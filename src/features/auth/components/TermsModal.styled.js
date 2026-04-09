/**
 * TermsModal 스타일 정의 (styled-components).
 *
 * glassmorphism 오버레이 + 스크롤 가능한 약관 내용 컨테이너.
 */

import styled from 'styled-components';
import { fadeInUp } from '../../../shared/styles/animations';

/** 반투명 블러 오버레이 — 전체 화면 덮음. */
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.lg};
`;

/** 모달 컨테이너 — glass-card, 최대 640px, 최대 높이 80vh. */
export const Container = styled.div`
  width: 100%;
  max-width: 640px;
  max-height: 80vh;
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: ${({ theme }) => theme.glass.blur};
  -webkit-backdrop-filter: ${({ theme }) => theme.glass.blur};
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  display: flex;
  flex-direction: column;
  animation: ${fadeInUp} 0.25s ease forwards;
  overflow: hidden;
`;

/** 모달 헤더 — 제목 + 닫기 버튼. */
export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderDefault};
  flex-shrink: 0;
`;

/** 제목 텍스트. */
export const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

/** 닫기(X) 버튼. */
export const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color ${({ theme }) => theme.transitions.fast},
              color ${({ theme }) => theme.transitions.fast};
  flex-shrink: 0;

  &:hover {
    background-color: ${({ theme }) => theme.colors.bgElevated};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

/** 스크롤 가능한 약관 본문 영역. */
export const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: 1.75;

  /* 스크롤바 스타일 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.borderDefault};
    border-radius: ${({ theme }) => theme.radius.full};
  }
`;

/** 약관 섹션 제목. */
export const SectionTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: ${({ theme }) => theme.spacing.lg} 0 ${({ theme }) => theme.spacing.sm};

  &:first-child {
    margin-top: 0;
  }
`;

/** 약관 본문 단락. */
export const Paragraph = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/** 항목 목록. */
export const List = styled.ul`
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  padding-left: ${({ theme }) => theme.spacing.lg};

  li {
    margin-bottom: ${({ theme }) => theme.spacing.xs};
  }
`;

/** 모달 푸터 — 확인 버튼. */
export const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-top: 1px solid ${({ theme }) => theme.colors.borderDefault};
  flex-shrink: 0;
`;

/** 닫기 확인 버튼. */
export const ConfirmButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.gradients.primary};
  color: white;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    box-shadow: ${({ theme }) => theme.glows.primary};
    transform: translateY(-1px);
  }
`;
