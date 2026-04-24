/**
 * 탭 상태를 URL 쿼리 문자열(?tab=...)과 양방향 동기화하는 공통 훅.
 *
 * 배경:
 *   CommunityPage(`features/community/pages/CommunityPage.jsx:47-80`) 에서 이미
 *   `useSearchParams` + `VALID_TAB_IDS` 화이트리스트 + `handleTabChange` 조합으로
 *   탭↔URL 동기화를 구현해 두었다. MyPage/PointPage/SupportPage 등 다른 탭 보유
 *   페이지에서도 같은 패턴이 필요하지만 각자 `useState` 로컬 상태만 쓰고 있어
 *   새로고침 시 탭이 기본값으로 초기화되고 공유 링크도 만들 수 없다.
 *
 * 이 훅은 그 성공 패턴을 하나의 진입점으로 추출한 것으로,
 *   - 탭 전환 → URL 갱신 (히스토리 pollution 방지를 위해 `replace: true`)
 *   - URL 외부 변경(뒤로가기·딥링크 진입) → 탭 state 동기화
 *   - 기본 탭 선택 시 쿼리에서 해당 키 제거 (URL 을 깔끔하게 유지)
 *   - 다른 쿼리 파라미터는 전부 보존 (?sort=... 등과 공존)
 * 네 가지 규약을 한 번에 보장한다.
 *
 * 설계 결정:
 *   1) 화이트리스트(validIds): 외부 입력(URL) 은 신뢰 불가하므로 반드시 Set 으로 검증.
 *      잘못된 값이면 기본 탭으로 폴백한다.
 *   2) replace:true: 탭 전환이 뒤로가기 스택을 쌓지 않도록. 뒤로가기는 "이전 페이지"로
 *      가야지 "이전 탭" 으로 가면 사용자가 혼란스럽다.
 *   3) 기본 탭 쿼리 생략: `?tab=posts` 같은 기본값은 URL 에서 제거해 캐노니컬 URL 1개를
 *      유지. SEO 관점에서도 중복 URL 배제 효과.
 *
 * @param {Object}     options
 * @param {string}     [options.paramName='tab']  쿼리 키 이름
 * @param {Set<string>} options.validIds          유효한 탭 id Set (화이트리스트)
 * @param {string}     options.defaultTab         기본 탭 id — 쿼리에서 생략되는 값
 * @returns {[string, (id: string) => void]}      [활성 탭 id, 탭 변경 함수]
 *
 * @example
 *   const VALID_TAB_IDS = new Set(['profile', 'watch-history', 'wishlist']);
 *   const [activeTab, setActiveTab] = useTabParam({
 *     validIds: VALID_TAB_IDS,
 *     defaultTab: 'profile',
 *   });
 *   // URL: /account/profile?tab=wishlist  →  activeTab === 'wishlist'
 *   // setActiveTab('profile')            →  URL: /account/profile (쿼리 생략)
 */

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function useTabParam({
  paramName = 'tab',
  validIds,
  defaultTab,
}) {
  /*
   * useSearchParams 는 React Router v6+ API.
   * searchParams 는 URLSearchParams 인스턴스지만, 내부 참조는 URL 변경 시마다 새로 만들어지므로
   * 의존성 배열에서 직접 사용 가능하다. 단 setSearchParams 는 안정적인 setter 라 호출은 안전.
   */
  const [searchParams, setSearchParams] = useSearchParams();

  /*
   * 초기 탭 결정:
   *   URL 에 유효한 탭 id 가 있으면 그걸 사용, 아니면 defaultTab.
   *   이 계산은 컴포넌트 첫 마운트 시에만 영향 — 이후는 아래 useEffect 가 동기화를 담당.
   */
  const rawFromUrl = searchParams.get(paramName);
  const initial = rawFromUrl && validIds.has(rawFromUrl) ? rawFromUrl : defaultTab;

  const [active, setActive] = useState(initial);

  /*
   * URL → state 동기화:
   *   - 브라우저 뒤로가기/앞으로가기, 외부 링크로 진입 등 URL 이 "외부에서" 변경된 경우
   *     내부 state 를 URL 값에 맞춘다.
   *   - rawFromUrl 이 whitelist 에 없거나 null 인데 현재 state 가 defaultTab 이 아니면
   *     defaultTab 으로 복원.
   *
   * react-hooks/exhaustive-deps 규칙상 validIds/defaultTab/active 도 의존성에 들어가야 하지만,
   * 이 훅의 의미적 계약은 "URL 변화에 반응"이지 "validIds 변경에 반응"이 아니다. validIds 는
   * 호출부에서 모듈 레벨 상수(VALID_TAB_IDS = new Set([...])) 로 정의되므로 렌더마다 동일하고,
   * defaultTab 도 거의 고정이다. active 는 이 effect 가 직접 setActive 하기 때문에 넣으면
   * 무한 루프. 따라서 rawFromUrl 만 의존성으로 쓰고 disable 처리.
   */
  useEffect(() => {
    if (rawFromUrl && validIds.has(rawFromUrl)) {
      if (rawFromUrl !== active) setActive(rawFromUrl);
    } else if (!rawFromUrl && active !== defaultTab) {
      setActive(defaultTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawFromUrl]);

  /*
   * state → URL 동기화 (사용자가 탭 클릭):
   *   - 다른 쿼리 파라미터(?sort=, ?page= 등)는 전부 보존한 채 paramName 만 갱신
   *   - 기본 탭일 때는 쿼리에서 해당 키를 제거해 URL 간결화
   *   - replace:true 로 히스토리 스택에 쌓지 않음 (뒤로가기는 이전 "페이지" 로 가야 함)
   */
  const setTab = useCallback(
    (id) => {
      setActive(id);
      const next = new URLSearchParams(searchParams);
      if (id === defaultTab) {
        next.delete(paramName);
      } else {
        next.set(paramName, id);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, paramName, defaultTab],
  );

  return [active, setTab];
}
