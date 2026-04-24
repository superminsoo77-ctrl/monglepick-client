/**
 * 동적 파라미터를 유지하면서 리다이렉트하는 헬퍼 컴포넌트.
 *
 * 배경:
 *   Phase 2 에서 `/achievement/:id` 같은 레거시 경로를 `/account/achievement/:id` 로
 *   이관할 때, React Router 의 기본 `<Navigate to="...">` 는 파라미터를 자동 치환하지 않는다.
 *   이 컴포넌트는 `:id` → 실제 값 치환을 수행하고 `<Navigate replace>` 로 넘겨준다.
 *
 *   Routes 예시:
 *     <Route
 *       path="/achievement/:id"
 *       element={<RedirectWithParams to="/account/achievement/:id" />}
 *     />
 *   사용자가 `/achievement/42` 로 진입하면 `/account/achievement/42` 로 replace 리다이렉트.
 *
 * 특징:
 *   - 쿼리 문자열도 그대로 보존 (location.search 전달)
 *   - 여러 파라미터도 지원 (`:courseId`, `:movieId` 등)
 *   - replace 이므로 뒤로가기 시 레거시 경로로 재진입하지 않음
 *   - 치환 실패(파라미터가 path 템플릿에 없음)해도 그대로 통과시켜 404 로 흐름
 */

import { Navigate, useLocation, useParams } from 'react-router-dom';

/**
 * @param {Object} props
 * @param {string} props.to  대상 path 템플릿 (예: '/account/achievement/:id')
 */
export default function RedirectWithParams({ to }) {
  /*
   * 현재 라우트에 매칭된 모든 동적 파라미터.
   * 예: path="/stamp/:courseId/review/:movieId" → { courseId, movieId }
   */
  const params = useParams();
  const location = useLocation();

  /*
   * 템플릿의 `:param` 을 실제 값으로 하나씩 치환.
   * Object.entries 순서는 JS 스펙상 숫자키→문자키 순이지만, useParams 반환값은
   * 순수 문자키만 가지므로 정의 순서가 유지된다. 안정적이다.
   */
  const resolved = Object.entries(params).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) return acc;
    return acc.replace(`:${key}`, encodeURIComponent(value));
  }, to);

  /*
   * 쿼리 문자열도 전달 — 기존 URL 의 ?key=value 를 유실하지 않도록.
   * 해시(#fragment) 는 네트워크 레벨에서 브라우저가 유지하므로 명시 전달 불필요.
   */
  const target = `${resolved}${location.search}`;

  return <Navigate to={target} replace />;
}
