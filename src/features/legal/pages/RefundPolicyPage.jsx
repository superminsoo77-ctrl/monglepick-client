/**
 * 환불정책 페이지.
 *
 * 2026-04-23 Footer 후속 — LegalPageLayout 공용 컴포넌트 + placeholder.
 * 구독(월/연) 취소·AI 이용권·포인트 환불 조건을 다루며, 결제 모듈
 * (Toss Payments v2) 과 연계해 확정 시 `sections` 로 채운다.
 */

import LegalPageLayout from '../components/LegalPageLayout';

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      title="환불정책"
      effectiveDate="2026-04-23"
      summary="구독·AI 이용권·포인트 환불 조건 및 절차"
    />
  );
}
