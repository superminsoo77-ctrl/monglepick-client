/**
 * 전역 비동기 로딩 상태 관리 Zustand 스토어.
 *
 * 여러 feature에서 동시에 로딩이 발생할 수 있으므로 단순 boolean 대신
 * 소스 식별자(source id) Set 으로 관리한다.
 *   - `match-sse`       : 둘이 영화 고르기 SSE 스트리밍
 *   - `chat-sse`        : AI 추천 채팅 SSE (추후 연결 가능)
 *   - `route-transition`: 페이지 전환 (추후 확장 가능)
 *
 * 사용 패턴:
 *   const start = useLoadingStore((s) => s.start);
 *   const stop  = useLoadingStore((s) => s.stop);
 *
 *   useEffect(() => {
 *     if (isLoading) start('match-sse');
 *     else stop('match-sse');
 *   }, [isLoading, start, stop]);
 *
 * 구독 패턴 (Header의 TopLoadingBar):
 *   const isActive = useLoadingStore((s) => s.sources.size > 0);
 *
 * 한 번에 여러 소스가 활성화되어도 한 개의 인디케이터만 표시하면 되므로,
 * "하나라도 켜져 있으면 active" 의 OR 로직으로 충분하다.
 *
 * @module shared/stores/useLoadingStore
 */

import { create } from 'zustand';

const useLoadingStore = create((set) => ({
  /**
   * 현재 활성화된 로딩 소스 ID 목록.
   * Set 으로 관리하여 동일 ID 중복 호출 시에도 idempotent 하게 동작한다.
   */
  sources: new Set(),

  /**
   * 특정 source ID 로 로딩 시작을 알린다.
   *
   * 동일 ID 가 이미 존재하면 상태는 변경되지 않는다(zustand reference equality 로 리렌더 방지).
   *
   * @param {string} id - 로딩 소스 식별자 (예: 'match-sse')
   */
  start: (id) => set((state) => {
    if (state.sources.has(id)) return state;
    const next = new Set(state.sources);
    next.add(id);
    return { sources: next };
  }),

  /**
   * 특정 source ID 로딩 종료를 알린다.
   *
   * 존재하지 않는 ID 라면 상태 변경 없이 반환하여 불필요한 리렌더를 막는다.
   *
   * @param {string} id - 로딩 소스 식별자
   */
  stop: (id) => set((state) => {
    if (!state.sources.has(id)) return state;
    const next = new Set(state.sources);
    next.delete(id);
    return { sources: next };
  }),

  /**
   * 모든 로딩 상태 초기화 — 에러 복구/라우트 언마운트 시 안전망 용도.
   */
  clear: () => set({ sources: new Set() }),
}));

export default useLoadingStore;
