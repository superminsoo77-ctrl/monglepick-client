/**
 * SubscriptionCard 컴포넌트 styled-components 정의.
 *
 * SubscriptionCard.css의 모든 규칙을 styled-components로 이관한다.
 * BEM 클래스(.subscription-card__*) → 개별 컴포넌트(S.Wrapper, S.Badge 등)로 매핑.
 *
 * $isBest — transient prop (DOM에 전달하지 않음)
 *   - true 이면 BEST 카드 스타일(borderGlow 애니메이션, 초기 gradient 버튼)을 적용한다.
 *
 * 공유 리소스:
 *   - animations.js : gradientShift, borderGlow, cardShine
 *   - media.js      : media.mobile
 */

import styled, { css } from 'styled-components';
import { gradientShift, borderGlow, cardShine } from '../../../shared/styles/animations';
import { media } from '../../../shared/styles/media';

/**
 * 구독 카드 루트 컨테이너.
 *
 * $isBest 가 true 이면 테두리 글로우 + borderGlow 애니메이션이 추가된다.
 * ::after 수도 요소로 hover 시 빛이 지나가는 shine 효과를 구현한다.
 */
export const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: blur(8px) saturate(1.4);
  -webkit-backdrop-filter: blur(8px) saturate(1.4);
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  text-align: center;
  transition: all ${({ theme }) => theme.transitions.fast};
  overflow: hidden;

  /* BEST 카드 — 보더 글로우 + 애니메이션 */
  ${({ $isBest, theme }) =>
    $isBest &&
    css`
    border-color: rgba(124,108,240,0.5);
    box-shadow: ${theme.glows.primary};
    animation: ${borderGlow} 3s ease infinite;
  `}

  /* hover 시 카드가 위로 떠오르며 테두리 강조 */
  &:hover {
    border-color: rgba(124, 108, 240, 0.4);
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg}, 0 0 20px rgba(124, 108, 240, 0.1);
  }

  /* hover shine — 좌→우 광선 효과 */
  &::after {
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

  &:hover::after {
    animation: ${cardShine} 0.8s ease forwards;
  }

  /* 모바일 반응형 */
  ${media.mobile} {
    padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md};
  }
`;

/**
 * BEST 배지 — gradient-accent 배경, 카드 상단 오른쪽에 절대 위치.
 */
export const Badge = styled.div`
  position: absolute;
  top: -10px;
  right: ${({ theme }) => theme.spacing.md};
  padding: 2px ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.gradients.accent};
  color: white;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  letter-spacing: 0.05em;
  box-shadow: 0 0 12px rgba(239, 71, 111, 0.3);
`;

/**
 * 구독 상품명.
 */
export const Name = styled.h3`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

/**
 * 가격 행 컨테이너 — 금액과 단위를 베이스라인 정렬.
 */
export const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.xs};
`;

/**
 * 가격 금액 — gradient-text + gradientShift 애니메이션.
 *
 * 모바일에서는 text-xl 크기로 축소된다.
 */
export const PriceAmount = styled.span`
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  background: ${({ theme }) => theme.gradients.text};
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${gradientShift} 4s ease infinite;

  ${media.mobile} {
    font-size: ${({ theme }) => theme.typography.textXl};
  }
`;

/**
 * 가격 단위 텍스트 ("원/월" 등).
 */
export const PriceUnit = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/**
 * 포인트 지급량 텍스트.
 */
export const Points = styled.p`
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
`;

/**
 * 가성비(1원당 P) 텍스트.
 */
export const Value = styled.p`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`;

/**
 * 상품 설명 텍스트.
 */
export const Desc = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  line-height: ${({ theme }) => theme.typography.leadingNormal};
`;

/**
 * 구독 버튼.
 *
 * $isBest 가 true 이면 처음부터 gradient 배경이 적용된다.
 * 기본 상태에서는 테두리만 있다가 hover 시 gradient로 전환된다.
 */
export const SubscribeBtn = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background: ${({ $isBest, theme }) =>
    $isBest ? theme.gradients.primary : 'none'};
  border: 1px solid ${({ $isBest, theme }) =>
    $isBest ? 'transparent' : theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.lg};
  color: ${({ $isBest, theme }) => ($isBest ? 'white' : theme.colors.primary)};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  margin-top: ${({ theme }) => theme.spacing.sm};

  /* 기본 카드 hover — gradient 배경으로 전환 */
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.gradients.primary};
    border-color: transparent;
    color: white;
    box-shadow: ${({ theme }) => theme.glows.primary};
  }

  /* BEST 카드 hover — translateY + glow */
  ${({ $isBest, theme }) =>
    $isBest &&
    `
    &:hover:not(:disabled) {
      box-shadow: ${theme.glows.primary};
      transform: translateY(-1px);
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
