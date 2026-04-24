/**
 * 모달 열림 상태를 URL 쿼리(?modal=...)와 동기화하는 공통 훅.
 *
 * 배경:
 *   현재 프로젝트의 대형 폼 모달들(`MyPage.jsx:118 EditProfileModal`,
 *   `MyPage.jsx:332 FavoriteMovieModal` 등)은 `useState(false)` 로컬 상태로만 관리된다.
 *   그 결과:
 *     - 모달 열린 상태에서 브라우저 뒤로가기 → 모달만 닫혀야 하는데 페이지가 통째로 빠짐
 *     - 모달 열린 상태를 공유 링크로 전달 불가
 *     - 모달 열림 이벤트가 SPA 에서 추적 불가 (URL 변화 기반 분석 도구에 잡히지 않음)
 *   이 훅은 모달 열림/닫힘을 URL 쿼리에 기록해 위 세 문제를 한 번에 해결한다.
 *
 * 설계 결정:
 *   1) 단일 키 ?modal=xxx — 동시 다중 모달은 지원하지 않는다. 같은 페이지에서 모달 2개가
 *      겹쳐야 한다면 UX 를 재검토하는 것이 먼저. (중첩 모달이 꼭 필요하면 후속에서 별도 훅 검토)
 *   2) open() 은 replace:false — 뒤로가기 스택에 쌓아야 "뒤로가기 = 모달 닫기" 가 성립.
 *   3) close() 는 replace:true — 연속으로 닫고/열고 반복 시 히스토리 오염 방지.
 *   4) 기존 쿼리 보존 — ?tab=wishlist 와 ?modal=editProfile 은 공존 가능.
 *
 * 제한:
 *   - 이 훅은 "모달 N 개 중 하나만 열림" 을 전제로 한다. 탭 N 개 동시 열림 같은 케이스에는
 *     맞지 않으므로, 그럴 땐 각 모달마다 별도 쿼리 키를 쓰거나 UX 를 재설계한다.
 *   - 모달 내부 상태(폼 입력값 등)는 여전히 로컬 state — URL 에 담지 않는다.
 *
 * @param {string} name  모달 식별자 (?modal=<name>). 페이지 내에서 고유해야 함.
 * @returns {[boolean, () => void, () => void]}
 *          [isOpen, open, close]
 *          - isOpen: 현재 URL 쿼리의 modal 값이 name 과 일치하는지
 *          - open:   URL 에 modal=name 추가 (히스토리 스택에 쌓임 → 뒤로가기로 닫힘)
 *          - close:  URL 에서 modal 키 제거 (replace)
 *
 * @example
 *   const [isEditOpen, openEditModal, closeEditModal] = useModalRoute('editProfile');
 *   <EditBtn onClick={openEditModal}>편집</EditBtn>
 *   {isEditOpen && <EditProfileModal onClose={closeEditModal} />}
 */

import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function useModalRoute(name) {
  const [searchParams, setSearchParams] = useSearchParams();

  /*
   * 현재 URL 의 ?modal=... 값이 이 훅이 담당하는 name 과 일치하면 열린 상태로 간주.
   * 다른 값(예: 다른 모달의 name) 이면 이 모달은 닫힌 상태.
   */
  const isOpen = searchParams.get('modal') === name;

  /*
   * 모달 열기 — 기존 쿼리를 전부 보존한 채 modal 키만 추가.
   * replace 옵션을 생략하면 기본값 false — 새 히스토리 엔트리가 생성되어
   * 사용자가 브라우저 뒤로가기를 누르면 modal 쿼리만 제거된 이전 상태로 돌아간다.
   * 이것이 "뒤로가기 = 모달 닫기" UX 의 핵심.
   */
  const open = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.set('modal', name);
    setSearchParams(next);
  }, [searchParams, setSearchParams, name]);

  /*
   * 모달 닫기 — modal 키만 제거. replace:true 로 히스토리에 쌓지 않음.
   * 만약 replace:false 로 하면 "열기 → 닫기 → 열기 → 닫기" 반복 시 뒤로가기 누적 폭증.
   */
  const close = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('modal');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  return [isOpen, open, close];
}
