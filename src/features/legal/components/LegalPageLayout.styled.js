/**
 * LegalPageLayout styled-components.
 *
 * 정책 페이지 4종(이용약관/개인정보/운영정책/환불정책)이 공유하는
 * 공통 레이아웃 스타일. 중앙 정렬 + 최대 너비 제한 + 헤더 영역 + 본문 영역.
 *
 * 본문은 읽기 중심이므로 line-height 를 여유롭게 주고, 제목 위계는 2단계만 사용.
 */

import styled from 'styled-components';

/** 최상위 래퍼 — MainLayout 내부에서 추가 패딩 + 중앙 정렬 */
export const Wrapper = styled.main`
  max-width: 860px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing.xxl} ${theme.spacing.lg}`};
  color: ${({ theme }) => theme.colors.textPrimary};

  @media (max-width: 768px) {
    padding: ${({ theme }) => `${theme.spacing.xl} ${theme.spacing.md}`};
  }
`;

/** 페이지 헤더 — 제목 + 시행일 */
export const Header = styled.header`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderDefault};
`;

/** 페이지 제목 */
export const Title = styled.h1`
  margin: 0 0 ${({ theme }) => theme.spacing.xs} 0;
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

/** 시행일/버전 메타 정보 */
export const Meta = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/**
 * 준비 중 안내 박스 — 실제 약관 문구가 확정되기 전까지 표시하는 placeholder.
 *
 * 본문 위에 눈에 띄는 박스로 배치. 약관 확정 후 이 블록만 제거하면 된다.
 */
export const PendingNotice = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.radius.lg};
  background-color: ${({ theme }) => theme.colors.primaryLight};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
`;

/** 준비 중 안내 타이틀 */
export const PendingTitle = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.primary};
`;

/** 준비 중 안내 본문 */
export const PendingBody = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.leadingRelaxed};
`;

/** 본문 영역 — section 태그 래퍼, 섹션 간 간격 통일 */
export const Body = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
`;

/** 본문 섹션 제목 (h2) */
export const SectionTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

/** 본문 단락 */
export const Paragraph = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.leadingRelaxed};
`;

/** 문의 안내 푸터 — 본문 하단 문의 이메일 안내 */
export const Footer = styled.footer`
  margin-top: ${({ theme }) => theme.spacing.xxl};
  padding-top: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.borderDefault};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: ${({ theme }) => theme.typography.leadingRelaxed};

  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  }
`;
