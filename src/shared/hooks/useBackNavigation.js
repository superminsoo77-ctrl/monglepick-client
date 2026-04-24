/**
 * 일관된 "뒤로가기" 정책을 제공하는 공통 훅.
 *
 * 배경:
 *   현재 프로젝트에는 3가지 서로 다른 뒤로가기 정책이 혼재한다.
 *     1) `MovieDetailPage.jsx:68-82` — location.state.backTo → navigate(-1) → '/' 3단 폴백 (모범)
 *     2) `ChatWindow.jsx:459`        — navigate(-1) 만
 *     3) `AchievementDetailPage.jsx:88,102,120` — navigate(ROUTES.ACHIEVEMENT) 하드코딩
 *   이 훅은 (1) 패턴을 표준화해 호출부가 한 줄로 사용할 수 있도록 한다.
 *
 * 폴백 우선순위:
 *   1) location.state.backTo 가 있으면 그 경로로 이동. backState 가 함께 있으면 주입.
 *      → 리스트 → 상세 이동 시 발신자가 명시적으로 복귀 경로를 지정한 경우.
 *   2) window.history.length > 1 이면 navigate(-1). → 일반 브라우저 히스토리 따라감.
 *   3) fallback (페이지별 기본 귀환 경로). 직접 URL 진입 / 새 탭 등 히스토리가 비어있는 경우.
 *
 * 규약 (호출부에서 지켜야 할 것):
 *   리스트 → 상세 이동 시 `state: { backTo, backState }` 를 주입하면
 *   상세에서 뒤로가기 시 원래 리스트의 탭·필터·페이지 상태까지 복원된다.
 *
 *   // 예: 업적 목록에서 상세로
 *   navigate(`/account/achievement/${id}`, {
 *     state: {
 *       backTo: `/account/achievement?tab=${activeTab}&page=${page}`,
 *       backState: { scrollTop: window.scrollY },  // 선택적 부가 정보
 *     },
 *   });
 *
 * @param {string} [fallback='/home']  backTo 없고 히스토리도 비어있을 때의 귀환 경로
 * @returns {() => void}               호출 시 뒤로가기를 실행하는 함수
 *
 * @example
 *   // AchievementDetailPage 에서
 *   const goBack = useBackNavigation('/account/achievement');
 *   <BackButton onClick={goBack}>목록으로</BackButton>
 */

import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function useBackNavigation(fallback = '/home') {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    const state = location.state;

    /*
     * 1) 명시적 backTo 우선.
     *    state?.backState 가 있으면 재주입해서 체인 이동(A → B → C → B → A)에서도 상태 유지.
     *    없으면 undefined 를 넘겨 state 가 초기화되게 둔다(명시적 규약).
     */
    if (state?.backTo) {
      navigate(state.backTo, { state: state.backState });
      return;
    }

    /*
     * 2) 브라우저 히스토리가 있으면 일반 뒤로가기.
     *    window.history.length 는 SPA 에서도 누적되므로 1 보다 크면 pop 가능.
     *    단, 직접 URL 로 진입한 첫 페이지라면 1(현재 항목만 존재).
     */
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    /*
     * 3) 완전 폴백 — 새 탭으로 직접 진입한 경우 등.
     *    페이지마다 의미 있는 상위로 떨어트리고 싶으므로 fallback 을 parameter 로 받음.
     */
    navigate(fallback);
  }, [navigate, location.state, fallback]);
}
