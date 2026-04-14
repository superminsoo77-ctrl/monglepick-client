/**
 * PaymentPage styled-components.
 *
 * 결제/구독 관리 페이지의 4개 섹션 레이아웃:
 *   1. 구독 상품 (2x2 카드 그리드)
 *   2. 포인트 팩 (가로 카드 그리드)
 *   3. 내 구독 상태 (정보 카드 + 취소 버튼)
 *   4. 결제 내역 (테이블 + 페이지네이션)
 *
 * CSS 변수 → theme 객체로 전환.
 * 공유 믹스인/애니메이션/미디어쿼리 활용.
 */

import styled, { keyframes, css } from 'styled-components';
import { fadeInUp, cardShine, borderGlow } from '../../../shared/styles/animations';
import { gradientText } from '../../../shared/styles/mixins';
import { media } from '../../../shared/styles/media';

/* ═══════════════════════════════════
   로컬 keyframes
   ═══════════════════════════════════ */

/** 에러/성공 메시지 등장 — 위에서 아래로 페이드인 */
const paymentFadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

/* ═══════════════════════════════════
   페이지 컨테이너
   ═══════════════════════════════════ */

/** 페이지 최외곽 래퍼 */
export const Page = styled.div`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};

  ${media.tablet} {
    padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md};
  }
`;

/** 내부 컨테이너 — 최대 폭 제한 + 페이지 등장 애니메이션 */
export const Inner = styled.div`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
  animation: ${fadeInUp} 0.5s ease forwards;
`;

/** 페이지 제목 — gradient-text */
export const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  margin: 0;
  ${gradientText}

  ${media.mobile} {
    font-size: ${({ theme }) => theme.typography.textXl};
  }
`;

/** 에러 메시지 — 빨간 테두리 + 등장 애니메이션 */
export const ErrorMsg = styled.div`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.errorBg};
  border: 1px solid ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.textSm};
  animation: ${paymentFadeIn} 0.3s ease;
`;

/** 성공 메시지 — 초록 테두리 + 등장 애니메이션 */
export const SuccessMsg = styled.div`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.successBg};
  border: 1px solid ${({ theme }) => theme.colors.success};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.success};
  font-size: ${({ theme }) => theme.typography.textSm};
  animation: ${paymentFadeIn} 0.3s ease;
`;

/* ═══════════════════════════════════
   공통 섹션 스타일
   ═══════════════════════════════════ */

/** 섹션 — glass-card 스타일 */
export const Section = styled.section`
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: blur(8px) saturate(1.4);
  -webkit-backdrop-filter: blur(8px) saturate(1.4);
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.xl};

  ${media.tablet} {
    padding: ${({ theme }) => theme.spacing.lg};
  }
`;

/** 섹션 제목 */
export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/** 섹션 설명 */
export const SectionDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
`;

/* ═══════════════════════════════════
   섹션 1: 구독 상품
   ═══════════════════════════════════ */

/** 2x2 그리드 */
export const PlansGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.md};

  ${media.tablet} {
    /* 구독 상품 — 1열 */
    grid-template-columns: 1fr;
  }
`;

/**
 * 구독 상품 카드 — glass-card + hover shine.
 * $isBest prop이 true이면 borderGlow 애니메이션 적용.
 */
export const PlanCard = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: blur(8px) saturate(1.4);
  -webkit-backdrop-filter: blur(8px) saturate(1.4);
  border: 1px solid ${({ $isBest, theme }) =>
    $isBest ? theme.colors.primary : theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  text-align: center;
  transition: all ${({ theme }) => theme.transitions.fast};
  overflow: hidden;
  box-shadow: ${({ $isBest, theme }) => $isBest ? theme.glows.primary : 'none'};
  ${({ $isBest }) => $isBest
    ? css`animation: ${borderGlow} 3s ease infinite;`
    : ''}

  /* 카드 hover shine */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent);
    pointer-events: none;
  }

  &:hover::after {
    animation: ${cardShine} 0.8s ease forwards;
  }

  &:hover {
    border-color: ${({ theme }) => theme.glass.border};
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg}, ${({ theme }) => theme.shadows.glow};
  }

  ${media.mobile} {
    padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md};
  }
`;

/** BEST 배지 — gradient-accent */
export const PlanBadge = styled.span`
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
  box-shadow: 0 0 12px rgba(239,71,111,0.3);
`;

/** 상품명 */
export const PlanName = styled.p`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

/** 가격 래퍼 */
export const PlanPrice = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.xs};
`;

/** 가격 금액 — gradient-text */
export const PlanPriceAmount = styled.span`
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  ${gradientText}

  ${media.mobile} {
    font-size: ${({ theme }) => theme.typography.textXl};
  }
`;

/** 가격 단위 (원/월 등) */
export const PlanPriceUnit = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/** 포인트 지급량 */
export const PlanPoints = styled.p`
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
`;

/** 가성비 표시 */
export const PlanValue = styled.p`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`;

/** 설명 */
export const PlanDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  line-height: ${({ theme }) => theme.typography.leadingNormal};
`;

/**
 * 구독 버튼.
 * $isBest prop이 true이면 gradient 배경 + 흰 글씨 기본 스타일.
 */
export const PlanBtn = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background: ${({ $isBest, theme }) => $isBest ? theme.gradients.primary : 'none'};
  border: 1px solid ${({ $isBest, theme }) => $isBest ? 'transparent' : theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.lg};
  color: ${({ $isBest }) => $isBest ? 'white' : ({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  margin-top: ${({ theme }) => theme.spacing.sm};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.gradients.primary};
    border-color: transparent;
    color: white;
    box-shadow: ${({ theme }) => theme.glows.primary};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* ═══════════════════════════════════
   섹션 2: 포인트 팩
   ═══════════════════════════════════ */

/** 가로 4열 그리드 */
export const PacksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing.md};

  ${media.tablet} {
    /* 포인트 팩 — 2열 */
    grid-template-columns: repeat(2, 1fr);
  }

  ${media.mobile} {
    /* 포인트 팩 — 1열 */
    grid-template-columns: 1fr;
  }
`;

/**
 * 포인트 팩 카드.
 * $isBest prop이 true이면 primary 테두리 + glow.
 */
export const PackCard = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.bgMain};
  border: 1px solid ${({ $isBest, theme }) =>
    $isBest ? theme.colors.primary : theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  text-align: center;
  transition: all ${({ theme }) => theme.transitions.fast};
  box-shadow: ${({ $isBest, theme }) => $isBest ? theme.shadows.glow : 'none'};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

/** 팩 BEST 배지 */
export const PackBadge = styled.span`
  position: absolute;
  top: -10px;
  right: ${({ theme }) => theme.spacing.md};
  padding: 2px ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  letter-spacing: 0.05em;
`;

/** 포인트 수량 */
export const PackPoints = styled.p`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
`;

/** 보너스 태그 — gradient-accent */
export const PackBonus = styled.span`
  display: inline-block;
  padding: 2px ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.gradients.accent};
  color: white;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  box-shadow: 0 0 8px rgba(6,214,160,0.2);
`;

/** 팩 가격 */
export const PackPrice = styled.p`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

/** 팩 구매 버튼 */
export const PackBtn = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  margin-top: ${({ theme }) => theme.spacing.xs};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primaryHover};
    box-shadow: ${({ theme }) => theme.shadows.glow};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* ═══════════════════════════════════
   섹션 3: 내 구독 상태
   ═══════════════════════════════════ */

/** 구독 없음 안내 */
export const NoSubscription = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
`;

/** 구독 없음 메인 텍스트 */
export const NoSubscriptionText = styled.p`
  font-size: ${({ theme }) => theme.typography.textBase};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
`;

/** 구독 없음 힌트 텍스트 */
export const NoSubscriptionHint = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`;

/** 구독 정보 카드 래퍼 */
export const SubscriptionCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

/** 구독 정보 세부 항목 컨테이너 */
export const SubscriptionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

/** 구독 정보 행 — 라벨 + 값 */
export const SubscriptionField = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};

  ${media.tablet} {
    /* 구독 정보 필드 — 세로 배치 */
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.xs};
    align-items: flex-start;
  }
`;

/** 구독 정보 라벨 */
export const SubscriptionLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textMuted};
  min-width: 80px;
`;

/** 구독 정보 값 */
export const SubscriptionValue = styled.span`
  font-size: ${({ theme }) => theme.typography.textBase};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

/** 구독 취소 버튼 */
export const CancelBtn = styled.button`
  align-self: flex-start;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.xl};
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.errorBg};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* ═══════════════════════════════════
   섹션 4: 결제 내역
   ═══════════════════════════════════ */

/** 건수 표시 */
export const OrdersCount = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontNormal};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/** 빈 내역 안내 */
export const OrdersEmpty = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxl};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

/** 테이블 래퍼 — 가로 스크롤 지원 */
export const OrdersTableWrapper = styled.div`
  overflow-x: auto;
`;

/** 결제 내역 테이블 */
export const OrdersTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  ${media.tablet} {
    min-width: 500px;
  }

  thead th {
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    font-size: ${({ theme }) => theme.typography.textSm};
    font-weight: ${({ theme }) => theme.typography.fontMedium};
    color: ${({ theme }) => theme.colors.textMuted};
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderDefault};
    white-space: nowrap;
  }

  tbody td {
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    font-size: ${({ theme }) => theme.typography.textSm};
    color: ${({ theme }) => theme.colors.textSecondary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  }

  /* 행 호버 — glass 효과 */
  tbody tr:hover {
    background-color: ${({ theme }) => theme.colors.primaryLight};
  }
`;

/** 주문번호 — 고정폭 폰트 */
export const OrderId = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/** 금액 */
export const OrderAmount = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
`;

/** 상태 배지 */
export const OrderStatus = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

/** 일시 */
export const OrderDate = styled.span`
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.textMuted};
`;

/** 페이지네이션 래퍼 */
export const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

/** 페이지네이션 버튼 */
export const PaginationBtn = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    color: ${({ theme }) => theme.colors.textMuted};
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

/** 페이지네이션 정보 텍스트 */
export const PaginationInfo = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/**
 * 구독 상품 로드 실패 시 표시되는 에러 배너.
 * 과거 하드코딩 fallback 을 제거한 뒤 이 배너가 노출되도록 리팩터링했다.
 */
export const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.errorBg};
  border: 1px solid ${({ theme }) => theme.colors.error};
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: 1.55;
`;

/** 에러 배너 내부의 "다시 시도" 버튼 */
export const RetryBtn = styled.button`
  padding: 8px 18px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.error};
  color: #ffffff;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  &:hover {
    opacity: 0.85;
  }
`;

/** 빈 목록 안내 박스 (구독 상품이 0개일 때) */
export const EmptyMsg = styled.p`
  padding: 48px 16px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px dashed ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  margin: 0;
`;

/* ═══════════════════════════════════
   현재 구독 요약 배너 (2026-04-14 추가)
   — 페이지 상단에 표시해 "내가 지금 어떤 구독 중인지" 즉시 확인 가능하게 한다.
   — hasActiveSubscription 일 때만 렌더된다.
   ═══════════════════════════════════ */

/** 상단 구독 요약 배너 — 페이드인 + primary 톤 강조 */
export const CurrentSubscriptionBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  animation: ${paymentFadeIn} 0.25s ease both;

  ${media.mobile} {
    flex-direction: column;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing.sm};
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

/** 체크 아이콘 원형 배경 — primary 하이라이트 */
export const CurrentSubscriptionIcon = styled.div`
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.gradients.primary};
  color: white;
  border-radius: 50%;
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontBold};
`;

/** 배너 본문 래퍼 — 제목 + 메타 2줄 세로 스택 */
export const CurrentSubscriptionBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

/** 배너 제목 — "현재 XXX 이용 중" */
export const CurrentSubscriptionTitle = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textBase};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};

  strong {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: ${({ theme }) => theme.typography.fontBold};
  }
`;

/** 배너 메타 — 만료일/상태 보조 정보 */
export const CurrentSubscriptionMeta = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: ${({ theme }) => theme.typography.leadingNormal};
`;
