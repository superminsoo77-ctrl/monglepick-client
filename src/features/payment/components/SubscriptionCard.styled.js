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
    /* BEST 카드 border — glass.border 토큰으로 대체 */
    border-color: ${theme.colors.primary};
    box-shadow: ${theme.glows.primary};
    animation: ${borderGlow} 3s ease infinite;
  `}

  /*
   * 현재 구독 중인 플랜 카드 — BEST 보다 우선 적용되도록 아래쪽에 배치.
   * 시각적으로 "지금 이용 중"을 즉시 알 수 있도록 accent 톤으로 테두리 강조.
   * 기존 border-color 와 glow 를 덮어쓴다.
   */
  ${({ $isCurrent, theme }) =>
    $isCurrent &&
    css`
    border-color: ${theme.colors.accent || theme.colors.primary};
    box-shadow: 0 0 0 2px ${theme.colors.accent || theme.colors.primary}33,
      ${theme.shadows.lg};
    animation: none;
  `}

  /* hover 시 카드가 위로 떠오르며 테두리 강조 */
  &:hover {
    /* hover border — glass.border 토큰으로 대체 */
    border-color: ${({ theme }) => theme.glass.border};
    transform: translateY(-4px);
    /* hover glow — glows.primary 토큰으로 대체 */
    box-shadow: ${({ theme }) => theme.shadows.lg}, ${({ theme }) => theme.glows.primary};
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
 * BEST / 구독 중 배지 — 카드 상단 오른쪽 절대 위치.
 *
 * $variant 'current' 이면 "구독 중" 표시용으로 primary gradient 를 사용한다.
 * 기본값(undefined) 이면 BEST 뱃지 — gradient-accent 배경.
 */
export const Badge = styled.div`
  position: absolute;
  top: -10px;
  right: ${({ theme }) => theme.spacing.md};
  padding: 2px ${({ theme }) => theme.spacing.md};
  background: ${({ $variant, theme }) =>
    $variant === 'current' ? theme.gradients.primary : theme.gradients.accent};
  color: white;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  letter-spacing: 0.05em;
  box-shadow: ${({ $variant }) =>
    $variant === 'current'
      ? '0 0 12px rgba(99, 102, 241, 0.35)'
      : '0 0 12px rgba(239, 71, 111, 0.3)'};
  z-index: 1;
`;

/**
 * 다른 플랜 구독 중일 때 카드 안쪽에 표시되는 안내 문구 (레거시 — 현재 미사용).
 *
 * 플랜 변경 허용(2026-04-14) 이후로는 ChangeHint 로 대체되었으나,
 * 하위 호환을 위해 export 유지한다. 신규 코드는 ChangeHint 를 사용할 것.
 */
export const LockNote = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.glass.bg};
  border: 1px dashed ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: ${({ theme }) => theme.typography.leadingNormal};
`;

/**
 * 플랜 변경(업그레이드/다운그레이드/주기 변경) 시 카드 안쪽 힌트.
 *
 * $variant 에 따라 톤을 다르게 준다:
 *   - 'upgrade' : primary 톤으로 긍정적 강조 (상위 등급으로 올라감)
 *   - 'adjust'  : 중립 톤 (하위 등급/주기 변경, 조정 성격)
 *
 * 상세 안내는 클릭 시 확인 모달에서 수행하므로 여기서는 한 줄로 짧게 유지한다.
 */
export const ChangeHint = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textXs};
  line-height: ${({ theme }) => theme.typography.leadingNormal};

  ${({ $variant, theme }) =>
    $variant === 'upgrade'
      ? css`
          background: ${theme.colors.primary}14; /* 8% alpha — theme 토큰에 primaryAlpha 없어 hex suffix 사용 */
          border: 1px solid ${theme.colors.primary}44;
          color: ${theme.colors.primary};
        `
      : css`
          background: ${theme.glass.bg};
          border: 1px solid ${theme.glass.border};
          color: ${theme.colors.textSecondary};
        `}
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
 * 두 가지 축의 스타일 변형이 있다:
 *   1) $isBest (true/false)          — BEST 플랜(yearly_premium 등)은 처음부터 gradient 배경
 *   2) $variant ('default'|'upgrade'|'adjust') — 플랜 변경 케이스별 톤 (2026-04-14 추가)
 *
 * 우선순위: $variant='upgrade' 는 항상 primary gradient 강조 (BEST 카드가 아니어도 강조).
 *           $variant='adjust'  는 중립 테두리 버튼 (조정 성격).
 *           $variant='default' (일반 신규 구독 또는 "구독 중" disabled 상태) 는 기존 스타일 유지.
 */
export const SubscribeBtn = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  margin-top: ${({ theme }) => theme.spacing.sm};

  /* ── 기본 스타일: $variant / $isBest 조합으로 배경/테두리/색상 결정 ── */
  ${({ $variant, $isBest, theme }) => {
    if ($variant === 'upgrade') {
      /* 업그레이드: 항상 primary gradient 로 강조 (CTA 성격 강함) */
      return css`
        background: ${theme.gradients.primary};
        border: 1px solid transparent;
        color: white;
        box-shadow: ${theme.glows.primary};
      `;
    }
    if ($variant === 'adjust') {
      /* 조정/주기 변경: 중립 테두리 버튼 (과도한 CTA 회피) */
      return css`
        background: none;
        border: 1px solid ${theme.colors.borderDefault};
        color: ${theme.colors.textPrimary};
      `;
    }
    /* default: BEST 카드면 gradient, 아니면 테두리만 */
    return css`
      background: ${$isBest ? theme.gradients.primary : 'none'};
      border: 1px solid ${$isBest ? 'transparent' : theme.colors.primary};
      color: ${$isBest ? 'white' : theme.colors.primary};
    `;
  }}

  /* ── hover 효과 ── */
  &:hover:not(:disabled) {
    ${({ $variant, theme }) => {
      if ($variant === 'upgrade') {
        return css`
          transform: translateY(-1px);
          box-shadow: ${theme.glows.primary};
        `;
      }
      if ($variant === 'adjust') {
        return css`
          background: ${theme.glass.bg};
          border-color: ${theme.colors.primary};
          color: ${theme.colors.primary};
        `;
      }
      /* default */
      return css`
        background: ${theme.gradients.primary};
        border-color: transparent;
        color: white;
        box-shadow: ${theme.glows.primary};
      `;
    }}
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
