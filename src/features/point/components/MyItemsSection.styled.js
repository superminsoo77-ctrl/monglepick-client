/**
 * MyItemsSection 컴포넌트 styled-components 정의 (2026-04-14 신규, C 방향).
 *
 * "내 아이템" 인벤토리 섹션 스타일. ItemExchange.styled.js 와 같은 톤으로 통일.
 */

import styled from 'styled-components';
import { cardShine } from '../../../shared/styles/animations';
import { media } from '../../../shared/styles/media';

export const Section = styled.section`
  /* PointPage 에서 margin-bottom 제어 */
`;

export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
`;

export const SectionDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
  line-height: ${({ theme }) => theme.typography.leadingNormal};
`;

/**
 * 요약 카드 행 — 상단 개수 집계.
 * 4~6개 카드를 반응형 그리드로 배치.
 */
export const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

export const SummaryCard = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.glass.bg};
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.md};
  text-align: center;
`;

export const SummaryLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

export const SummaryValue = styled.div`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.primary};
`;

/**
 * 카테고리 필터 탭.
 */
export const Tabs = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  overflow-x: auto;

  ${media.mobile} {
    gap: ${({ theme }) => theme.spacing.xs};
  }
`;

export const Tab = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.primary : 'none'};
  border: 1px solid ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ $active, theme }) =>
    $active ? 'white' : theme.colors.textSecondary};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ $active, theme }) =>
      $active ? 'white' : theme.colors.primary};
  }

  ${media.mobile} {
    padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
    font-size: ${({ theme }) => theme.typography.textXs};
  }
`;

export const Empty = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxl};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  ${media.tablet} {
    grid-template-columns: 1fr;
  }
`;

/**
 * 개별 보유 아이템 카드.
 * $equipped 가 true 이면 primary 테두리 + glow 강조.
 * $expired 가 true 이면 opacity 50% + 회색 필터.
 */
export const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: blur(8px) saturate(1.4);
  -webkit-backdrop-filter: blur(8px) saturate(1.4);
  border: 1px solid ${({ $equipped, theme }) =>
    $equipped ? theme.colors.primary : theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  transition: all ${({ theme }) => theme.transitions.fast};
  position: relative;
  overflow: hidden;
  opacity: ${({ $expired }) => ($expired ? 0.5 : 1)};
  filter: ${({ $expired }) => ($expired ? 'grayscale(0.6)' : 'none')};

  ${({ $equipped, theme }) =>
    $equipped &&
    `box-shadow: ${theme.glows.primary};`}

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.03),
      transparent
    );
    pointer-events: none;
  }

  &:hover::before {
    animation: ${cardShine} 0.8s ease forwards;
  }

  &:hover {
    transform: translateY(-2px);
  }
`;

/**
 * 카드 상단 라벨 행 — 카테고리 배지 + 상태 배지.
 */
export const TagRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`;

export const CategoryTag = styled.span`
  display: inline-block;
  padding: 2px ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

/**
 * 상태 배지 — ACTIVE/EQUIPPED/USED/EXPIRED 구분.
 * $variant 에 따라 색상 변환.
 */
export const StatusBadge = styled.span`
  display: inline-block;
  padding: 2px ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontMedium};

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'equipped':
        return `background: ${theme.colors.primary}; color: white;`;
      case 'expired':
      case 'used':
        return `background: ${theme.colors.bgElevated}; color: ${theme.colors.textMuted};`;
      default:
        return `background: ${theme.colors.bgElevated}; color: ${theme.colors.textSecondary};`;
    }
  }}
`;

export const ItemImage = styled.img`
  width: 56px;
  height: 56px;
  object-fit: contain;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bgElevated};
  padding: ${({ theme }) => theme.spacing.xs};
`;

export const ItemName = styled.h3`
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

export const ItemDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.leadingNormal};
  margin: 0;
  flex: 1;
`;

export const Meta = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

export const ActionBtn = styled.button`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  background: ${({ $primary, theme }) =>
    $primary ? theme.gradients.primary : 'transparent'};
  color: ${({ $primary, theme }) => ($primary ? 'white' : theme.colors.primary)};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${({ $primary, theme }) => ($primary ? theme.glows.primary : 'none')};
    background: ${({ $primary, theme }) =>
      $primary ? theme.gradients.primary : theme.colors.primaryLight};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * 페이지네이션 컨트롤 행.
 */
export const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

export const PageBtn = styled.button`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const PageInfo = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
`;
