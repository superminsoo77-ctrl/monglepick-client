/**
 * 운영정책 페이지.
 *
 * 2026-04-23 Footer 후속 — LegalPageLayout 공용 컴포넌트 + placeholder.
 * 커뮤니티 게시글·리뷰·추천 이의제기·계정 제재 기준 등을 다루며,
 * 확정 시 `sections` 로 채워 넣는다.
 */

import LegalPageLayout from '../components/LegalPageLayout';

export default function OperationPolicyPage() {
  return (
    <LegalPageLayout
      title="운영정책"
      effectiveDate="2026-04-23"
      summary="커뮤니티·리뷰·추천 서비스 운영 기준 및 제재 규정"
    />
  );
}
