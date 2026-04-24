/**
 * Movie Match 상태 관리 커스텀 훅.
 *
 * 두 영화를 선택하고 SSE 스트리밍으로 분석 결과를 받아오는
 * 전체 흐름의 상태를 관리한다.
 *
 * -----------------------------------------------------------
 * 상태 저장소 (2026-04-14 리팩터)
 * -----------------------------------------------------------
 * 이전에는 useState 로 로컬 상태를 보관했다. 이 방식은 MatchPage 가
 * 언마운트되면(예: 추천 카드 클릭 → `/movie/:id` 이동) 상태가 사라져
 * 뒤로가기 후 Match 페이지가 초기화되는 UX 결함이 있었다.
 *
 * 현재는 `useMatchStore` (Zustand + sessionStorage persist) 를
 * 단일 저장소로 사용한다. 라우트 이탈/재진입 시 selectedMovie1/2,
 * sharedFeatures, matchResults 가 자동 복원된다.
 *
 * 훅은 store 상태를 선택적으로 구독하고, SSE 관련 refs 만 로컬로
 * 보관한다(abortController 등은 각 호출마다 새로 만들어야 하므로
 * 영속화 대상이 아니다).
 *
 * -----------------------------------------------------------
 * 관리 상태 (store 경유)
 * -----------------------------------------------------------
 * - selectedMovie1 / selectedMovie2: 선택된 두 영화 객체
 * - sharedFeatures: 두 영화의 공통 특성 분석 결과 (shared_features SSE)
 * - matchResults: 추천 영화 목록 최대 5편 (match_result SSE, Match v3)
 * - currentStatus: 현재 처리 단계 메시지 (status SSE)
 * - completedPhases: 완료된 처리 단계 목록 (체크마크 표시용)
 * - isLoading: SSE 스트리밍 진행 중 여부
 * - error: 에러 메시지
 */

import { useCallback, useRef, useState } from 'react';
/* Match SSE API — 같은 feature 내의 matchApi에서 가져옴 */
import { sendMatchRequest } from '../api/matchApi';
/* Match 전용 Zustand 스토어 — 라우트 이동 시 상태 영속 */
import useMatchStore from '../../../shared/stores/useMatchStore';

/**
 * Movie Match 상태 관리 훅.
 *
 * @param {Object} [config={}] - 훅 설정 옵션
 * @param {string} [config.userId=''] - 사용자 ID (빈 문자열이면 익명)
 * @returns {Object} Match 상태 및 액션 함수 모음
 */
export function useMatch({ userId = '' } = {}) {
  /* ── store 상태 선택적 구독 ──
   *
   * 각 필드별로 selector 를 분리해 불필요한 리렌더를 방지한다.
   * (하나로 묶어 객체 반환 시 매번 새 참조가 반환돼 리렌더 폭풍 발생)
   */
  const selectedMovie1 = useMatchStore((s) => s.selectedMovie1);
  const selectedMovie2 = useMatchStore((s) => s.selectedMovie2);
  const sharedFeatures = useMatchStore((s) => s.sharedFeatures);
  const matchResults = useMatchStore((s) => s.matchResults);
  const currentStatus = useMatchStore((s) => s.currentStatus);
  const completedPhases = useMatchStore((s) => s.completedPhases);
  const isLoading = useMatchStore((s) => s.isLoading);
  const error = useMatchStore((s) => s.error);

  /* ── store setter 구독 (함수 참조는 안정적) ── */
  const setSharedFeatures = useMatchStore((s) => s.setSharedFeatures);
  const setMatchResults = useMatchStore((s) => s.setMatchResults);
  const setCurrentStatus = useMatchStore((s) => s.setCurrentStatus);
  const appendCompletedPhase = useMatchStore((s) => s.appendCompletedPhase);
  const setCompletedPhases = useMatchStore((s) => s.setCompletedPhases);
  const setIsLoading = useMatchStore((s) => s.setIsLoading);
  const setError = useMatchStore((s) => s.setError);
  const selectMovieInSlot = useMatchStore((s) => s.selectMovieInSlot);
  const resetStore = useMatchStore((s) => s.reset);

  // ── refs (SSE 요청 생명주기 전용, store 영속화 대상 아님) ──

  /** 요청 취소용 AbortController — cancelRequest 에서 abort() 호출 */
  const abortControllerRef = useRef(null);

  /**
   * 게스트(비로그인) 평생 1회 쿼터 초과 모달 노출 state (2026-04-22).
   * error_code === 'GUEST_QUOTA_EXCEEDED' 수신 시 {reason} 저장.
   * sessionStorage persist 대상 아님 — 모달 닫으면 사라져야 함.
   */
  const [guestQuotaExceeded, setGuestQuotaExceeded] = useState(null);
  const dismissGuestQuotaModal = useCallback(() => {
    setGuestQuotaExceeded(null);
  }, []);
  /**
   * 현재 진행 중인 phase 코드를 추적하는 ref.
   * status 이벤트 수신 시 이전 phase 를 completedPhases 에 추가하기 위해 사용.
   * (state 클로저 문제 회피용 ref)
   */
  const currentPhaseRef = useRef('');

  /**
   * match_result SSE 가 이미 수신되었는지 추적하는 ref.
   *
   * [기존 주석 유지 — 2026-04-14]
   * agent 는 항상 match_result → done 순서로 이벤트를 발행하지만, 네트워크
   * 청크 경계 / SSE 프록시 / 브라우저 스케줄러 조합에 따라 done 이 앞서
   * 도달하는 극히 드문 케이스가 관측됐다. match_result 수신 여부를
   * 독립 ref 로 기록해 두고, onDone 에서 아직 도착하지 않았으면 isLoading
   * 을 해제하지 않고 대기한다.
   */
  const matchResultReceivedRef = useRef(false);
  /**
   * match_result 없이 done 이 먼저 도착했을 때 "대기 모드" 로 진입했는지 추적.
   */
  const pendingDoneRef = useRef(false);

  // ── 영화 선택 액션 ──

  /**
   * 첫 번째 영화를 선택한다. 이전 분석 결과도 함께 초기화된다.
   *
   * @param {Object} movie - 선택할 영화 객체
   */
  const selectMovie1 = useCallback(
    (movie) => {
      selectMovieInSlot(1, movie);
    },
    [selectMovieInSlot],
  );

  /**
   * 두 번째 영화를 선택한다. 이전 분석 결과도 함께 초기화된다.
   */
  const selectMovie2 = useCallback(
    (movie) => {
      selectMovieInSlot(2, movie);
    },
    [selectMovieInSlot],
  );

  /** 첫 번째 영화 선택 해제 */
  const clearMovie1 = useCallback(() => {
    selectMovieInSlot(1, null);
  }, [selectMovieInSlot]);

  /** 두 번째 영화 선택 해제 */
  const clearMovie2 = useCallback(() => {
    selectMovieInSlot(2, null);
  }, [selectMovieInSlot]);

  // ── Match 분석 액션 ──

  /**
   * 두 영화의 Match 분석을 시작한다.
   *
   * 사전 조건: selectedMovie1, selectedMovie2 가 모두 선택된 상태.
   * 이미 진행 중인 요청이 있으면 무시한다.
   *
   * @returns {Promise<void>}
   */
  const startMatch = useCallback(async () => {
    // store 의 현재 상태를 직접 읽어 클로저 stale 문제 회피
    const state = useMatchStore.getState();
    const m1 = state.selectedMovie1;
    const m2 = state.selectedMovie2;
    if (!m1 || !m2) return;
    if (state.isLoading) return;

    // ── 상태 초기화 ──
    setIsLoading(true);
    setError(null);
    setSharedFeatures(null);
    setMatchResults([]);
    setCompletedPhases([]);
    setCurrentStatus('');
    currentPhaseRef.current = '';
    matchResultReceivedRef.current = false;
    pendingDoneRef.current = false;

    // AbortController 생성 (요청 취소용)
    abortControllerRef.current = new AbortController();

    try {
      await sendMatchRequest(
        {
          movieId1: m1.movie_id || m1.id || String(m1.id),
          movieId2: m2.movie_id || m2.id || String(m2.id),
          userId,
        },
        {
          /**
           * status 이벤트 핸들러.
           * 새로운 phase 메시지를 받으면 현재 phase 를 완료 목록에 추가하고
           * 새 phase 를 currentStatus 로 설정한다.
           */
          onStatus: (data) => {
            if (currentPhaseRef.current && currentPhaseRef.current !== data.phase) {
              appendCompletedPhase(currentPhaseRef.current);
            }
            currentPhaseRef.current = data.phase || '';
            setCurrentStatus(data.message || '');
          },

          onSharedFeatures: (data) => {
            setSharedFeatures(data);
          },

          onMatchResult: (data) => {
            const movies = data.movies || [];
            setMatchResults(movies);
            if (movies.length > 0) {
              matchResultReceivedRef.current = true;
              // 이미 done 이 먼저 도착해 대기 모드였다면 이 시점에 로딩 해제
              if (pendingDoneRef.current) {
                pendingDoneRef.current = false;
                setCurrentStatus('');
                setIsLoading(false);
              }
            }
          },

          /**
           * done 이벤트 핸들러.
           *
           * 정상 순서: status × N → match_result → done.
           *   → onDone 시점에 matchResultReceivedRef 가 true 이므로 즉시 로딩 해제.
           *
           * 이례적 순서(네트워크 청크 경계 / 프록시 플러시 등): done 이 먼저 도착.
           *   → matchResultReceivedRef 가 false 이므로 pendingDoneRef 를 세우고
           *     로딩 해제를 보류한다.
           */
          onDone: () => {
            if (currentPhaseRef.current) {
              appendCompletedPhase(currentPhaseRef.current);
            }
            if (matchResultReceivedRef.current) {
              setCurrentStatus('');
              setIsLoading(false);
            } else {
              pendingDoneRef.current = true;
            }
          },

          onError: (data) => {
            // 게스트 평생 1회 쿼터 초과 — 로그인 유도 모달 트리거 (2026-04-22)
            if (data.error_code === 'GUEST_QUOTA_EXCEEDED') {
              setGuestQuotaExceeded({
                reason: data.reason ?? null,
                message: data.message ?? '',
              });
            } else {
              setError(data.message || '영화 분석 중 오류가 발생했습니다.');
            }
            setMatchResults([]);
            setSharedFeatures(null);
            setCurrentStatus('');
            matchResultReceivedRef.current = false;
            pendingDoneRef.current = false;
            setIsLoading(false);
          },
        },
        abortControllerRef.current.signal,
      );

      // sendMatchRequest 가 정상 반환됐는데 match_result 가 끝내 도착하지 않은
      // 경우(스트림 중도 종료 등) 무한 로딩 방지를 위해 복구 처리
      if (pendingDoneRef.current && !matchResultReceivedRef.current) {
        pendingDoneRef.current = false;
        setError('추천 결과를 받아오지 못했어요. 다시 시도해주세요.');
        setCurrentStatus('');
        setIsLoading(false);
      }
    } catch (err) {
      // AbortError 는 사용자가 직접 취소한 것이므로 에러 메시지 표시 없음
      if (err.name === 'AbortError') {
        setCurrentStatus('');
        setIsLoading(false);
        return;
      }

      setError(err.message || '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
      setCurrentStatus('');
      setIsLoading(false);
    }
  }, [
    userId,
    setIsLoading,
    setError,
    setSharedFeatures,
    setMatchResults,
    setCompletedPhases,
    setCurrentStatus,
    appendCompletedPhase,
  ]);

  /**
   * 진행 중인 SSE 요청을 취소한다.
   */
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * 전체 상태를 초기화한다. 진행 중인 요청이 있으면 먼저 취소한다.
   * sessionStorage 의 영속 상태도 함께 지워진다 (store.reset 경유).
   */
  const reset = useCallback(() => {
    cancelRequest();
    resetStore();
    currentPhaseRef.current = '';
    matchResultReceivedRef.current = false;
    pendingDoneRef.current = false;
  }, [cancelRequest, resetStore]);

  return {
    // 선택된 영화
    selectedMovie1,
    selectedMovie2,
    // SSE 수신 데이터
    sharedFeatures,
    matchResults,
    // 진행 상태
    currentStatus,
    completedPhases,
    isLoading,
    error,
    // 게스트 평생 1회 쿼터 초과 모달 상태 (2026-04-22)
    guestQuotaExceeded,
    dismissGuestQuotaModal,
    // 액션 함수
    selectMovie1,
    selectMovie2,
    clearMovie1,
    clearMovie2,
    startMatch,
    cancelRequest,
    reset,
  };
}
