/**
 * 이용약관 페이지.
 *
 * 2026-04-23 Footer 후속 — LegalPageLayout 공용 컴포넌트를 사용해
 * placeholder "준비 중" 상태로 노출된다. 실제 약관 문구가 확정되면
 * `sections` prop 에 항목을 채우고 `showPendingNotice={false}` 로 전환한다.
 */

import LegalPageLayout from '../components/LegalPageLayout';

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="이용약관"
      effectiveDate="2026-04-23"
      summary="몽글픽 서비스 이용에 관한 기본 약관"
    />
  );
}
