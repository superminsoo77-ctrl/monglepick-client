/**
 * 구독 상품 카드 컴포넌트.
 *
 * 개별 구독 플랜의 정보를 카드 형태로 표시한다.
 * 상품명, 가격, 포인트 지급량, 가성비, 구독 버튼을 포함한다.
 *
 * <h3>2026-04-14 플랜 변경 허용 — 4-케이스 분기</h3>
 * 이전에는 "해지 후 변경 가능" 으로 완전 차단했으나, Backend 에서 플랜 변경 시
 * 기존 ACTIVE 를 자동 CANCELLED 로 전이한 뒤 새 구독을 생성하는 원자적 흐름이
 * 구현됨에 따라(2026-04-14 SubscriptionService.createSubscription 변경),
 * 프론트엔드에서도 실제 플랜 변경 진행을 허용한다.
 *
 * 현재 구독과 카드 플랜을 비교한 4-케이스 분기:
 *   1) 동일 planCode (= 현재 구독과 같음)
 *      → "구독 중" 배지 + 버튼 비활성 (중복 결제 방지)
 *   2) 현재 basic → 이 카드 premium (상위 등급)
 *      → "구독 플랜 업그레이드" + 버튼 활성 (primary 강조)
 *   3) 현재 premium → 이 카드 basic (하위 등급)
 *      → "구독 플랜 조정하기" + 버튼 활성 (중립)
 *   4) 동일 등급 내 주기만 다름 (monthly ↔ yearly)
 *      → "결제 주기 변경" + 버튼 활성 (중립)
 *
 * 변경 케이스 모두에서 PaymentPage 의 handleSubscribe 가 확인 모달을 띄워
 * 사용자에게 "기존 구독이 즉시 해지되고 새 플랜으로 전환됩니다" 를 고지한 뒤 진행한다.
 *
 * @param {Object} props
 * @param {Object} props.plan - 구독 상품 데이터
 * @param {string} props.plan.planCode - 상품 코드 (monthly_basic, yearly_premium 등)
 * @param {string} props.plan.name - 상품명
 * @param {number} props.plan.price - 가격 (원)
 * @param {number} props.plan.pointsPerPeriod - 주기당 지급 포인트
 * @param {string} props.plan.periodType - 주기 (MONTHLY, YEARLY)
 * @param {string} [props.plan.description] - 상품 설명
 * @param {boolean} [props.plan.best] - 최고 혜택 여부
 * @param {string|null} props.processingId - 현재 결제 처리 중인 상품 코드
 * @param {Function} props.onSubscribe - 구독 버튼 클릭 핸들러
 * @param {Function} props.formatNumber - 숫자 포맷팅 함수
 * @param {string|null} [props.currentPlanCode] - 현재 활성 구독의 planCode (없으면 null)
 * @param {boolean} [props.hasActiveSubscription] - 활성 구독 보유 여부
 */

import * as S from './SubscriptionCard.styled';

/** 구독 주기별 표시 라벨 */
const PERIOD_TYPE_LABELS = {
  MONTHLY: '월',
  YEARLY: '년',
};

/**
 * planCode 에서 구독 등급 계열(basic / premium) 을 추출한다.
 * Backend Grade.subscriptionPlanType 기준과 동일한 규칙이다.
 *
 * @param {string} planCode - 예: "monthly_basic", "yearly_premium"
 * @returns {'basic'|'premium'|null} 등급 계열. 매칭 없으면 null.
 */
function extractPlanTier(planCode) {
  if (!planCode) return null;
  const lower = planCode.toLowerCase();
  if (lower.includes('premium')) return 'premium';
  if (lower.includes('basic')) return 'basic';
  return null;
}

export default function SubscriptionCard({
  plan,
  processingId,
  onSubscribe,
  formatNumber,
  currentPlanCode = null,
  hasActiveSubscription = false,
}) {
  /* 포인트 단가 계산 (포인트당 원) — 높을수록 가성비 좋음 */
  const valuePerWon = plan.price > 0
    ? (plan.pointsPerPeriod / plan.price).toFixed(1)
    : 0;
  /* 최고 혜택 플랜 표시 여부 */
  const isBest = plan.best || plan.planCode === 'yearly_premium';
  const periodLabel = PERIOD_TYPE_LABELS[plan.periodType] || '월';

  /* ─── 현재 구독과의 관계 판정 ─── */
  /* 이 카드가 유저의 현재 구독 플랜인지 */
  const isCurrentPlan = hasActiveSubscription
    && currentPlanCode != null
    && currentPlanCode === plan.planCode;

  /* 다른 플랜 구독 중 (현재 플랜과 다른 카드들) — 업그레이드/다운그레이드/주기 변경 대상 */
  const isOtherPlanWhileActive = hasActiveSubscription && !isCurrentPlan;

  /* 등급 계열 비교 — basic ↔ premium 판정 */
  const currentTier = extractPlanTier(currentPlanCode);
  const cardTier = extractPlanTier(plan.planCode);

  /* 변경 유형 계산 (활성 구독 + 다른 플랜일 때만 의미 있음) */
  let changeType = null; // 'upgrade' | 'downgrade' | 'period'
  if (isOtherPlanWhileActive) {
    if (currentTier === 'basic' && cardTier === 'premium') {
      changeType = 'upgrade';
    } else if (currentTier === 'premium' && cardTier === 'basic') {
      changeType = 'downgrade';
    } else {
      /* 동일 등급 내 주기만 다름 (monthly ↔ yearly) 혹은 tier 판정 불가 케이스 */
      changeType = 'period';
    }
  }

  /* ─── 버튼 라벨/비활성/강조 결정 ─── */
  let buttonLabel = '구독하기';
  let isDisabled = false;
  let buttonVariant = 'default'; // 'default' | 'upgrade' | 'adjust'

  if (processingId === plan.planCode) {
    /* 이 카드가 결제 처리 중 */
    buttonLabel = '처리 중...';
    isDisabled = true;
  } else if (isCurrentPlan) {
    /* 현재 구독 중인 플랜 — 중복 결제 방지 */
    buttonLabel = '구독 중';
    isDisabled = true;
  } else if (changeType === 'upgrade') {
    /* basic → premium */
    buttonLabel = '구독 플랜 업그레이드';
    buttonVariant = 'upgrade';
  } else if (changeType === 'downgrade') {
    /* premium → basic */
    buttonLabel = '구독 플랜 조정하기';
    buttonVariant = 'adjust';
  } else if (changeType === 'period') {
    /* 동일 등급 내 주기 변경 */
    buttonLabel = '결제 주기 변경';
    buttonVariant = 'adjust';
  } else if (processingId) {
    /* 다른 카드의 결제가 진행 중 (중복 클릭 방지) */
    isDisabled = true;
  }

  return (
    <S.Wrapper $isBest={isBest} $isCurrent={isCurrentPlan}>
      {/*
        배지 우선순위: 구독 중 > BEST
        현재 플랜 배지를 더 우선 노출해 사용자가 자신의 구독을 즉시 인지하도록 한다.
      */}
      {isCurrentPlan ? (
        <S.Badge $variant="current">구독 중</S.Badge>
      ) : (
        isBest && <S.Badge>BEST</S.Badge>
      )}

      {/* 상품명 */}
      <S.Name>{plan.name}</S.Name>

      {/* 가격 */}
      <S.PriceRow>
        <S.PriceAmount>{formatNumber(plan.price)}</S.PriceAmount>
        <S.PriceUnit>원/{periodLabel}</S.PriceUnit>
      </S.PriceRow>

      {/* 포인트 지급량 */}
      <S.Points>{formatNumber(plan.pointsPerPeriod)}P 지급</S.Points>

      {/* 가성비 표시 */}
      <S.Value>1원당 {valuePerWon}P</S.Value>

      {/* 설명 */}
      {plan.description && <S.Desc>{plan.description}</S.Desc>}

      {/*
        플랜 변경 안내 문구 — 업그레이드/조정/주기 변경일 때 사용자에게 "기존 구독이 어떻게 될지" 암시.
        구체 안내는 버튼 클릭 시 확인 모달에서 수행하므로 여기서는 짧게 유지한다.
      */}
      {changeType === 'upgrade' && (
        <S.ChangeHint $variant="upgrade">
          현재 플랜보다 상위 등급으로 변경됩니다.
        </S.ChangeHint>
      )}
      {changeType === 'downgrade' && (
        <S.ChangeHint $variant="adjust">
          현재 플랜에서 하위 등급으로 변경됩니다.
        </S.ChangeHint>
      )}
      {changeType === 'period' && (
        <S.ChangeHint $variant="adjust">
          동일 등급 내 결제 주기를 변경합니다.
        </S.ChangeHint>
      )}

      {/* 구독 버튼 */}
      <S.SubscribeBtn
        $isBest={isBest}
        $variant={buttonVariant}
        onClick={() => onSubscribe(plan, { changeType })}
        disabled={isDisabled}
      >
        {buttonLabel}
      </S.SubscribeBtn>
    </S.Wrapper>
  );
}
