/**
 * LegalPageLayout — 법적 정책 페이지 공용 레이아웃 컴포넌트.
 *
 * 이용약관 / 개인정보처리방침 / 운영정책 / 환불정책 4개 페이지가 공유하는 헤더/본문/
 * 문의 푸터 골격을 제공한다. 각 페이지는 `title`, `effectiveDate`, `summary` prop 과
 * 섹션 배열(`sections: [{title, paragraphs: string[]}]`) 만 넘기면 된다.
 *
 * 현재는 실제 약관 문구 미확정 상태 — 상단에 "준비 중" PendingNotice 를 공통 표시.
 * 문구 확정 시 `showPendingNotice` 를 false 로 두고 sections 를 채우면 자동 전환.
 */

import * as S from './LegalPageLayout.styled';

/**
 * @param {Object} props
 * @param {string} props.title             페이지 제목 (예: "이용약관")
 * @param {string} [props.effectiveDate]   시행일 문자열 (예: "2026-04-23")
 * @param {string} [props.summary]         페이지 1~2줄 요약 (Meta 옆 보조 설명)
 * @param {Array<{title:string, paragraphs:string[]}>} [props.sections]
 *                                          본문 섹션 목록. 생략 시 "준비 중" 상태만 렌더.
 * @param {boolean} [props.showPendingNotice=true]
 *                                          상단 "준비 중" 안내 박스 표시 여부.
 *                                          실제 약관 확정 시 false 로 두면 된다.
 */
export default function LegalPageLayout({
  title,
  effectiveDate,
  summary,
  sections,
  showPendingNotice = true,
}) {
  return (
    <S.Wrapper>
      {/* ── 페이지 헤더: 제목 + 시행일 ── */}
      <S.Header>
        <S.Title>{title}</S.Title>
        {(effectiveDate || summary) && (
          <S.Meta>
            {effectiveDate && <span>시행일 {effectiveDate}</span>}
            {effectiveDate && summary && <span> · </span>}
            {summary && <span>{summary}</span>}
          </S.Meta>
        )}
      </S.Header>

      {/*
        ── 준비 중 안내 (placeholder) ──
        실제 약관 문구가 확정되기 전까지 표시. sections 가 비어있더라도
        페이지 자체는 의미 있게 렌더되도록 고정 메시지 제공.
      */}
      {showPendingNotice && (
        <S.PendingNotice role="note">
          <S.PendingTitle>문서 준비 중</S.PendingTitle>
          <S.PendingBody>
            본 문서는 현재 최종 검토 중으로, 서비스 상용화에 맞춰 공식 버전이
            공개될 예정입니다. 문의 사항은 아래 이메일로 연락 주시면 안내 드리겠습니다.
          </S.PendingBody>
        </S.PendingNotice>
      )}

      {/* ── 본문 섹션 목록 (확정 문구 주입 시 자동 렌더) ── */}
      {sections && sections.length > 0 && (
        <S.Body>
          {sections.map((section) => (
            <div key={section.title}>
              <S.SectionTitle>{section.title}</S.SectionTitle>
              {section.paragraphs.map((paragraph, idx) => (
                <S.Paragraph key={idx}>{paragraph}</S.Paragraph>
              ))}
            </div>
          ))}
        </S.Body>
      )}

      {/* ── 문의 안내 ── */}
      <S.Footer>
        본 문서에 대한 문의는{' '}
        <a href="mailto:contact@monglepick.com">contact@monglepick.com</a>
        {' '}으로 연락 주시기 바랍니다.
      </S.Footer>
    </S.Wrapper>
  );
}
