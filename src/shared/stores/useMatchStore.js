/**
 * Movie Match 상태 관리 Zustand 스토어.
 *
 * "둘이 영화 고르기" 페이지의 선택 영화 / 추천 결과 / 공통 특성 분석
 * 결과를 전역 상태로 관리하고, sessionStorage 에 영속화한다.
 *
 * -----------------------------------------------------------
 * 배경 (2026-04-14, 유저 리포트)
 * -----------------------------------------------------------
 * 기존 `useMatch` 훅은 useState 로 상태를 보관해 MatchPage 가
 * 언마운트되면 즉시 소멸했다. 유저가 추천 결과 카드를 클릭해
 * `/movie/:id` 로 이동한 뒤 브라우저 뒤로가기를 누르면 MatchPage
 * 가 재마운트되면서 모든 선택/추천 결과가 초기화되어 "처음부터
 * 다시 두 영화를 골라야" 하는 UX 문제가 발생했다.
 *
 * -----------------------------------------------------------
 * 설계 결정
 * -----------------------------------------------------------
 * 1) Zustand + `persist` 미들웨어 + `sessionStorage` 사용.
 *    - 라우트 이탈 → 재진입 시 상태 복원 (탭 내에서)
 *    - 새 탭 / 강제 새로고침 / 탭 종료 시 상태 소멸
 *      (Match 상태가 며칠 뒤에도 살아있는 것은 혼란스럽기 때문)
 * 2) persist partialize 로 **선택 영화 + SSE 결과물만** 영속화.
 *    transient 상태(isLoading/currentStatus/completedPhases/error)
 *    는 영속화하지 않는다. 재진입 시 SSE 는 새로 시작하거나 결과
 *    캐시가 그대로 보이는 게 맞지, "로딩 중" 상태가 고착되어선
 *    안 된다.
 * 3) `useMatch` 훅은 store 를 읽고/쓰기만 하는 얇은 래퍼가 된다.
 *    SSE 요청 refs(abortController 등) 는 여전히 훅 로컬 유지.
 *
 * @module shared/stores/useMatchStore
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** sessionStorage 키. 다른 스토어와 충돌 방지 prefix */
const STORAGE_KEY = 'monglepick.match.v1';

/**
 * Movie Match Zustand 스토어.
 *
 * 상태는 크게 두 그룹:
 *  - "지속(persisted)"  : 선택 영화 A/B, sharedFeatures, matchResults
 *  - "일시(transient)" : isLoading, currentStatus, completedPhases, error
 *
 * partialize() 가 지속 그룹만 골라 sessionStorage 에 기록하고,
 * 복원 시에도 동일 그룹만 rehydrate 된다. 일시 그룹은 매 마운트
 * 마다 초기값으로 시작한다.
 *
 * 액션(setter) 은 얇게 두어 useMatch 훅의 기존 시그니처를 유지한다.
 */
const useMatchStore = create(
  persist(
    (set) => ({
      /* ── 지속 그룹 (sessionStorage 에 저장되는 상태) ── */

      /** 첫 번째 선택 영화 — MovieSelector 로 고른 객체 (null=미선택) */
      selectedMovie1: null,
      /** 두 번째 선택 영화 */
      selectedMovie2: null,
      /** 두 영화 공통 특성 분석 결과 (shared_features SSE) */
      sharedFeatures: null,
      /** 추천 영화 목록 최대 5편 (match_result SSE) */
      matchResults: [],

      /* ── 일시 그룹 (sessionStorage 에 저장되지 않음) ── */

      /** 현재 처리 단계 메시지 — status 이벤트 message */
      currentStatus: '',
      /** 완료된 처리 단계 phase 코드 목록 */
      completedPhases: [],
      /** SSE 스트리밍 진행 중 여부 */
      isLoading: false,
      /** 에러 메시지 (null=에러 없음) */
      error: null,

      /* ── setter 액션 ── */

      setSelectedMovie1: (movie) => set({ selectedMovie1: movie }),
      setSelectedMovie2: (movie) => set({ selectedMovie2: movie }),
      setSharedFeatures: (features) => set({ sharedFeatures: features }),
      setMatchResults: (results) => set({ matchResults: results }),
      setCurrentStatus: (status) => set({ currentStatus: status }),
      setCompletedPhases: (phases) => set({ completedPhases: phases }),
      /**
       * completedPhases 에 phase 를 멱등 추가.
       * 기존 훅의 `setCompletedPhases((prev) => prev.includes(...))` 패턴을
       * 한 곳에 모아두기 위한 편의 액션.
       */
      appendCompletedPhase: (phase) =>
        set((state) => {
          if (!phase) return state;
          if (state.completedPhases.includes(phase)) return state;
          return { completedPhases: [...state.completedPhases, phase] };
        }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setError: (err) => set({ error: err }),

      /**
       * 영화 선택 시 이전 분석 결과를 클리어한다.
       * 기존 훅의 selectMovie1/2 가 수행하던 "결과 초기화 + 영화 선택" 을
       * 단일 액션으로 묶어 컴포넌트에서 호출을 간결하게 유지한다.
       *
       * @param {1|2} slot - 슬롯 번호 (1 또는 2)
       * @param {Object|null} movie - 선택 영화 (null=해제)
       */
      selectMovieInSlot: (slot, movie) =>
        set({
          [slot === 1 ? 'selectedMovie1' : 'selectedMovie2']: movie,
          sharedFeatures: null,
          matchResults: [],
          completedPhases: [],
          currentStatus: '',
          error: null,
        }),

      /**
       * 전체 상태 초기화.
       * "다시 해보기" 버튼에서 호출한다. persist 에도 즉시 반영되어
       * sessionStorage 의 선택 영화 / 추천 결과도 함께 비운다.
       */
      reset: () =>
        set({
          selectedMovie1: null,
          selectedMovie2: null,
          sharedFeatures: null,
          matchResults: [],
          currentStatus: '',
          completedPhases: [],
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      /**
       * 영속화 대상 필드만 선별.
       *
       * isLoading/error/currentStatus/completedPhases 는 제외한다:
       *  - isLoading=true 상태에서 탭이 꺼지면, 다시 열 때 "로딩 중" 으로
       *    복원되어 실제로는 SSE 가 돌고 있지 않은데도 무한 로딩 UI 가 뜬다.
       *  - currentStatus/completedPhases 도 지난 요청의 진행도라 의미 없음.
       *  - error 도 마찬가지(지난 세션의 에러 배너 잔상).
       *
       * 반대로 selectedMovie1/2/sharedFeatures/matchResults 는 재진입 시
       * 결과 화면으로 바로 복원되어야 하므로 반드시 영속화한다.
       */
      partialize: (state) => ({
        selectedMovie1: state.selectedMovie1,
        selectedMovie2: state.selectedMovie2,
        sharedFeatures: state.sharedFeatures,
        matchResults: state.matchResults,
      }),
    },
  ),
);

export default useMatchStore;
