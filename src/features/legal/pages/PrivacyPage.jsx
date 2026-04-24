/**
 * 개인정보처리방침 페이지.
 *
 * 2026-04-23 Footer 후속 — LegalPageLayout 공용 컴포넌트 + placeholder.
 * 실제 수집 항목/이용 목적/보관 기간 확정 시 `sections` prop 으로 주입.
 */

import LegalPageLayout from '../components/LegalPageLayout';

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="개인정보처리방침"
      effectiveDate="2026-04-23"
      summary="수집 항목·이용 목적·보관 기간 및 이용자 권리"
    />
  );
}
