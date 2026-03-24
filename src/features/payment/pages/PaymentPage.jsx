/**
 * 결제 및 구독 관리 페이지 컴포넌트.
 *
 * 포인트 충전(결제)과 구독 관리를 위한 단일 스크롤 페이지.
 * 4개 섹션으로 구성된다:
 *   1. 구독 상품 — 4개 구독 플랜 카드 (2x2 그리드)
 *   2. 포인트 팩 — 포인트 일회성 구매 옵션
 *   3. 내 구독 상태 — 현재 구독 정보 + 취소 버튼
 *   4. 결제 내역 — 과거 주문 테이블 (페이징)
 *
 * Toss Payments 연동 흐름:
 *   1) createOrder → orderId + clientKey 반환
 *   2) Toss SDK로 결제 위젯 오픈
 *   3) 성공 시 confirmPayment (paymentKey + orderId + amount)
 *
 * 비인증 사용자는 로그인 페이지로 리다이렉트된다.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
/* 인증 Context 훅 — app/providers에서 가져옴 */
import { useAuth } from '../../../app/providers/AuthProvider';
/* 결제/구독 API — 같은 feature 내의 paymentApi에서 가져옴 */
import {
  createOrder,
  confirmPayment,
  getOrders,
  getSubscriptionPlans,
  getSubscriptionStatus,
  cancelSubscription,
} from '../api/paymentApi';
/* 라우트 경로 상수 — shared/constants에서 가져옴 */
import { ROUTES } from '../../../shared/constants/routes';
/* 로딩 스피너 — shared/components에서 가져옴 */
import Loading from '../../../shared/components/Loading/Loading';
import './PaymentPage.css';

/* ── 상수 정의 ── */

/**
 * 포인트 팩 상품 목록.
 * 일회성 포인트 구매 옵션을 정의한다.
 * 각 팩은 포인트 수량, 가격, 보너스 비율을 포함한다.
 */
const POINT_PACKS = [
  { id: 'pack_1000', points: 1000, price: 1900, label: '1,000P', bonus: null },
  { id: 'pack_3000', points: 3000, price: 4900, label: '3,000P', bonus: '10% 보너스' },
  { id: 'pack_5000', points: 5000, price: 7900, label: '5,000P', bonus: '15% 보너스' },
  { id: 'pack_10000', points: 10000, price: 14900, label: '10,000P', bonus: '25% 보너스', best: true },
];

/** 결제 내역 페이지당 표시 건수 */
const ORDER_PAGE_SIZE = 10;

/** 주문 상태별 표시 라벨 및 색상 */
const ORDER_STATUS_CONFIG = {
  PENDING: { label: '대기 중', color: 'var(--warning)' },
  COMPLETED: { label: '완료', color: 'var(--success)' },
  FAILED: { label: '실패', color: 'var(--error)' },
  REFUNDED: { label: '환불', color: 'var(--text-muted)' },
  CANCELLED: { label: '취소', color: 'var(--text-muted)' },
};

/** 주문 유형별 표시 라벨 */
const ORDER_TYPE_LABELS = {
  POINT_CHARGE: '포인트 충전',
  POINT_PURCHASE: '포인트 충전',
  SUBSCRIPTION: '구독 결제',
};

/** 구독 주기별 표시 라벨 */
const PERIOD_TYPE_LABELS = {
  MONTHLY: '월',
  YEARLY: '년',
};

/**
 * 숫자를 천 단위 콤마가 포함된 문자열로 포맷팅한다.
 *
 * @param {number} num - 포맷팅할 숫자
 * @returns {string} 콤마가 포함된 문자열
 */
function formatNumber(num) {
  if (num == null) return '0';
  return Number(num).toLocaleString('ko-KR');
}

/**
 * ISO 날짜 문자열을 'YYYY.MM.DD' 형식으로 변환한다.
 *
 * @param {string} dateString - ISO 날짜 문자열
 * @returns {string} 포맷팅된 날짜 문자열
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

export default function PaymentPage() {
  /* ── 상태 관리 ── */

  /* 구독 상품 목록 */
  const [plans, setPlans] = useState([]);
  /* 현재 구독 상태 */
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  /* 결제 내역 (Spring Page 응답) */
  const [orders, setOrders] = useState({ content: [], totalPages: 0, totalElements: 0 });
  /* 현재 결제 내역 페이지 번호 (0-indexed) */
  const [orderPage, setOrderPage] = useState(0);

  /* 로딩 상태 */
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  /* 결제 처리 중 (어떤 상품의 결제가 진행 중인지) */
  const [processingId, setProcessingId] = useState(null);
  /* 구독 취소 처리 중 */
  const [isCancelling, setIsCancelling] = useState(false);

  /* 에러/성공 메시지 */
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  /* 인증 상태 및 네비게이션 */
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  /* ── 인증 확인 ── */

  /**
   * 비인증 사용자를 로그인 페이지로 리다이렉트한다.
   */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(ROUTES.LOGIN);
    }
  }, [isAuthenticated, authLoading, navigate]);

  /* ── 데이터 로드 ── */

  /**
   * 구독 상품 목록을 로드한다.
   */
  const loadPlans = useCallback(async () => {
    setIsLoadingPlans(true);
    try {
      const data = await getSubscriptionPlans();
      setPlans(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      console.error('구독 상품 조회 실패:', err);
      /* API 미구현 시 기본 구독 상품으로 표시 */
      setPlans([
        {
          planCode: 'monthly_basic',
          name: '월간 기본',
          price: 3900,
          pointsPerPeriod: 3000,
          periodType: 'MONTHLY',
          description: '매월 3,000P 지급',
        },
        {
          planCode: 'monthly_premium',
          name: '월간 프리미엄',
          price: 7900,
          pointsPerPeriod: 8000,
          periodType: 'MONTHLY',
          description: '매월 8,000P 지급',
        },
        {
          planCode: 'yearly_basic',
          name: '연간 기본',
          price: 39000,
          pointsPerPeriod: 40000,
          periodType: 'YEARLY',
          description: '연 40,000P 지급',
        },
        {
          planCode: 'yearly_premium',
          name: '연간 프리미엄',
          price: 79000,
          pointsPerPeriod: 100000,
          periodType: 'YEARLY',
          description: '연 100,000P 지급 (최고 혜택)',
          best: true,
        },
      ]);
    } finally {
      setIsLoadingPlans(false);
    }
  }, []);

  /**
   * 현재 구독 상태를 로드한다.
   */
  const loadSubscriptionStatus = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingSubscription(true);
    try {
      const data = await getSubscriptionStatus(user.id);
      setSubscriptionStatus(data);
    } catch (err) {
      console.error('구독 상태 조회 실패:', err);
      setSubscriptionStatus(null);
    } finally {
      setIsLoadingSubscription(false);
    }
  }, [user?.id]);

  /**
   * 결제 내역을 로드한다.
   */
  const loadOrders = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingOrders(true);
    try {
      const data = await getOrders(user.id, {
        page: orderPage,
        size: ORDER_PAGE_SIZE,
      });
      setOrders({
        content: data?.content || [],
        totalPages: data?.totalPages || 0,
        totalElements: data?.totalElements || 0,
      });
    } catch (err) {
      console.error('결제 내역 조회 실패:', err);
      setOrders({ content: [], totalPages: 0, totalElements: 0 });
    } finally {
      setIsLoadingOrders(false);
    }
  }, [user?.id, orderPage]);

  /* 컴포넌트 마운트 시 데이터 로드 */
  useEffect(() => {
    if (isAuthenticated) {
      loadPlans();
    }
  }, [isAuthenticated, loadPlans]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadSubscriptionStatus();
    }
  }, [isAuthenticated, user?.id, loadSubscriptionStatus]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadOrders();
    }
  }, [isAuthenticated, user?.id, loadOrders]);

  /* ── 이벤트 핸들러 ── */

  /**
   * 에러/성공 메시지를 3초 후 자동 숨김 처리한다.
   */
  const showMessage = (type, message) => {
    if (type === 'error') {
      setError(message);
      setSuccessMsg(null);
    } else {
      setSuccessMsg(message);
      setError(null);
    }
    setTimeout(() => {
      setError(null);
      setSuccessMsg(null);
    }, 3000);
  };

  /**
   * 구독 상품 결제를 시작한다.
   * createOrder로 주문을 생성하고, Toss Payments SDK를 호출한다.
   *
   * @param {Object} plan - 구독 상품 객체
   */
  const handleSubscribe = async (plan) => {
    if (!user?.id || processingId) return;
    setProcessingId(plan.planCode);
    setError(null);

    try {
      /* 주문 생성 */
      const order = await createOrder({
        userId: user.id,
        orderType: 'SUBSCRIPTION',
        amount: plan.price,
        planCode: plan.planCode,
      });

      /**
       * TODO: Toss Payments SDK 연동
       *
       * Toss Payments SDK가 로드된 후:
       * const tossPayments = TossPayments(order.clientKey);
       * tossPayments.requestPayment('카드', {
       *   amount: order.amount,
       *   orderId: order.orderId,
       *   orderName: plan.name,
       *   successUrl: `${window.location.origin}/payment/success`,
       *   failUrl: `${window.location.origin}/payment/fail`,
       * });
       *
       * 현재는 주문 생성까지만 구현하고 알림으로 안내한다.
       */
      showMessage(
        'success',
        `주문이 생성되었습니다. (주문번호: ${order.orderId?.slice(0, 8)}...) Toss 결제 위젯은 준비 중입니다.`
      );

      /* 결제 내역 갱신 */
      await loadOrders();
    } catch (err) {
      showMessage('error', err.message || '주문 생성에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * 포인트 팩 구매를 시작한다.
   *
   * @param {Object} pack - 포인트 팩 객체
   */
  const handleBuyPack = async (pack) => {
    if (!user?.id || processingId) return;
    setProcessingId(pack.id);
    setError(null);

    try {
      /* 주문 생성 */
      const order = await createOrder({
        userId: user.id,
        orderType: 'POINT_CHARGE',
        amount: pack.price,
        pointsAmount: pack.points,
      });

      /**
       * TODO: Toss Payments SDK 연동
       * (구독 결제와 동일한 흐름)
       */
      showMessage(
        'success',
        `주문이 생성되었습니다. (주문번호: ${order.orderId?.slice(0, 8)}...) Toss 결제 위젯은 준비 중입니다.`
      );

      /* 결제 내역 갱신 */
      await loadOrders();
    } catch (err) {
      showMessage('error', err.message || '주문 생성에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * 구독 취소를 처리한다.
   * 확인 다이얼로그 후 취소 API를 호출한다.
   */
  const handleCancelSubscription = async () => {
    if (!user?.id || isCancelling) return;

    const confirmed = window.confirm(
      '정말 구독을 취소하시겠습니까?\n만료일까지는 계속 이용할 수 있습니다.'
    );
    if (!confirmed) return;

    setIsCancelling(true);
    setError(null);

    try {
      await cancelSubscription(user.id);
      showMessage('success', '구독이 취소되었습니다. 만료일까지 이용 가능합니다.');
      /* 구독 상태 갱신 */
      await loadSubscriptionStatus();
    } catch (err) {
      showMessage('error', err.message || '구독 취소에 실패했습니다.');
    } finally {
      setIsCancelling(false);
    }
  };

  /* ── 렌더링 ── */

  /* 인증 로딩 중 */
  if (authLoading) {
    return <Loading message="인증 확인 중..." fullPage />;
  }

  /* 활성 구독 여부 */
  const hasActiveSubscription =
    subscriptionStatus?.hasActiveSubscription ||
    subscriptionStatus?.status === 'ACTIVE';

  return (
    <div className="payment-page">
      <div className="payment-page__inner">
        {/* 페이지 제목 */}
        <h1 className="payment-page__title">결제 / 구독</h1>

        {/* 에러 메시지 */}
        {error && (
          <div className="payment-page__error" role="alert">
            {error}
          </div>
        )}

        {/* 성공 메시지 */}
        {successMsg && (
          <div className="payment-page__success" role="status">
            {successMsg}
          </div>
        )}

        {/* ═══════════════════════════════════════════
            섹션 1: 구독 상품
            ═══════════════════════════════════════════ */}
        <section className="payment-page__section">
          <h2 className="payment-page__section-title">구독 상품</h2>
          <p className="payment-page__section-desc">
            구독하면 매 주기마다 포인트가 자동 지급됩니다.
          </p>

          {isLoadingPlans ? (
            <Loading message="구독 상품 로딩 중..." />
          ) : (
            <div className="payment-page__plans-grid">
              {plans.map((plan) => {
                /* 포인트 단가 계산 (포인트당 원) — 높을수록 가성비 좋음 */
                const valuePerWon = plan.price > 0
                  ? (plan.pointsPerPeriod / plan.price).toFixed(1)
                  : 0;
                /* 최고 혜택 플랜 표시 여부 */
                const isBest = plan.best || plan.planCode === 'yearly_premium';
                const periodLabel = PERIOD_TYPE_LABELS[plan.periodType] || '월';

                return (
                  <div
                    key={plan.planCode}
                    className={[
                      'payment-page__plan-card',
                      isBest ? 'payment-page__plan-card--best' : '',
                    ].join(' ')}
                  >
                    {/* 최고 혜택 배지 */}
                    {isBest && (
                      <div className="payment-page__plan-badge">BEST</div>
                    )}

                    {/* 상품명 */}
                    <h3 className="payment-page__plan-name">{plan.name}</h3>

                    {/* 가격 */}
                    <div className="payment-page__plan-price">
                      <span className="payment-page__plan-price-amount">
                        {formatNumber(plan.price)}
                      </span>
                      <span className="payment-page__plan-price-unit">원/{periodLabel}</span>
                    </div>

                    {/* 포인트 지급량 */}
                    <p className="payment-page__plan-points">
                      {formatNumber(plan.pointsPerPeriod)}P 지급
                    </p>

                    {/* 가성비 표시 */}
                    <p className="payment-page__plan-value">
                      1원당 {valuePerWon}P
                    </p>

                    {/* 설명 */}
                    {plan.description && (
                      <p className="payment-page__plan-desc">{plan.description}</p>
                    )}

                    {/* 구독 버튼 */}
                    <button
                      className={[
                        'payment-page__plan-btn',
                        isBest ? 'payment-page__plan-btn--best' : '',
                      ].join(' ')}
                      onClick={() => handleSubscribe(plan)}
                      disabled={processingId === plan.planCode}
                    >
                      {processingId === plan.planCode ? '처리 중...' : '구독하기'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════
            섹션 2: 포인트 팩
            ═══════════════════════════════════════════ */}
        <section className="payment-page__section">
          <h2 className="payment-page__section-title">포인트 충전</h2>
          <p className="payment-page__section-desc">
            필요한 만큼 포인트를 충전하세요.
          </p>

          <div className="payment-page__packs-grid">
            {POINT_PACKS.map((pack) => (
              <div
                key={pack.id}
                className={[
                  'payment-page__pack-card',
                  pack.best ? 'payment-page__pack-card--best' : '',
                ].join(' ')}
              >
                {/* 보너스/최고 혜택 배지 */}
                {pack.best && (
                  <div className="payment-page__pack-badge">BEST</div>
                )}

                {/* 포인트 수량 */}
                <div className="payment-page__pack-points">{pack.label}</div>

                {/* 보너스 안내 */}
                {pack.bonus && (
                  <span className="payment-page__pack-bonus">{pack.bonus}</span>
                )}

                {/* 가격 */}
                <div className="payment-page__pack-price">
                  {formatNumber(pack.price)}원
                </div>

                {/* 구매 버튼 */}
                <button
                  className="payment-page__pack-btn"
                  onClick={() => handleBuyPack(pack)}
                  disabled={processingId === pack.id}
                >
                  {processingId === pack.id ? '처리 중...' : '구매하기'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            섹션 3: 내 구독 상태
            ═══════════════════════════════════════════ */}
        <section className="payment-page__section">
          <h2 className="payment-page__section-title">내 구독 상태</h2>

          {isLoadingSubscription ? (
            <Loading message="구독 상태 확인 중..." />
          ) : !hasActiveSubscription ? (
            <div className="payment-page__no-subscription">
              <p className="payment-page__no-subscription-text">
                현재 활성화된 구독이 없습니다.
              </p>
              <p className="payment-page__no-subscription-hint">
                위 구독 상품을 선택하여 더 많은 혜택을 받아보세요!
              </p>
            </div>
          ) : (
            <div className="payment-page__subscription-card">
              {/* 구독 정보 */}
              <div className="payment-page__subscription-info">
                <div className="payment-page__subscription-field">
                  <span className="payment-page__subscription-label">구독 상품</span>
                  <span className="payment-page__subscription-value">
                    {subscriptionStatus?.planName || '-'}
                  </span>
                </div>
                <div className="payment-page__subscription-field">
                  <span className="payment-page__subscription-label">상태</span>
                  <span
                    className="payment-page__subscription-value"
                    style={{
                      color:
                        subscriptionStatus?.status === 'ACTIVE'
                          ? 'var(--success)'
                          : subscriptionStatus?.status === 'CANCELLED'
                            ? 'var(--warning)'
                            : 'var(--text-secondary)',
                    }}
                  >
                    {subscriptionStatus?.status === 'ACTIVE'
                      ? '구독 중'
                      : subscriptionStatus?.status === 'CANCELLED'
                        ? '취소됨 (만료일까지 이용 가능)'
                        : subscriptionStatus?.status || '-'}
                  </span>
                </div>
                <div className="payment-page__subscription-field">
                  <span className="payment-page__subscription-label">시작일</span>
                  <span className="payment-page__subscription-value">
                    {formatDate(subscriptionStatus?.startedAt || subscriptionStatus?.startDate)}
                  </span>
                </div>
                <div className="payment-page__subscription-field">
                  <span className="payment-page__subscription-label">만료일</span>
                  <span className="payment-page__subscription-value">
                    {formatDate(subscriptionStatus?.expiresAt || subscriptionStatus?.endDate)}
                  </span>
                </div>
              </div>

              {/* 구독 취소 버튼 — ACTIVE 상태에서만 표시 */}
              {subscriptionStatus?.status === 'ACTIVE' && (
                <button
                  className="payment-page__cancel-btn"
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                >
                  {isCancelling ? '취소 처리 중...' : '구독 취소'}
                </button>
              )}
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════
            섹션 4: 결제 내역
            ═══════════════════════════════════════════ */}
        <section className="payment-page__section">
          <h2 className="payment-page__section-title">
            결제 내역
            {orders.totalElements > 0 && (
              <span className="payment-page__orders-count">
                ({formatNumber(orders.totalElements)}건)
              </span>
            )}
          </h2>

          {isLoadingOrders ? (
            <Loading message="결제 내역 로딩 중..." />
          ) : orders.content.length === 0 ? (
            <div className="payment-page__orders-empty">
              <p>결제 내역이 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 결제 내역 테이블 */}
              <div className="payment-page__orders-table-wrapper">
                <table className="payment-page__orders-table">
                  <thead>
                    <tr>
                      <th>주문번호</th>
                      <th>유형</th>
                      <th>금액</th>
                      <th>상태</th>
                      <th>일시</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.content.map((order, idx) => {
                      const statusConfig = ORDER_STATUS_CONFIG[order.status] || {
                        label: order.status,
                        color: 'var(--text-secondary)',
                      };

                      return (
                        <tr key={order.orderId || idx}>
                          <td className="payment-page__order-id">
                            {order.orderId
                              ? `${order.orderId.slice(0, 8)}...`
                              : '-'}
                          </td>
                          <td>
                            {ORDER_TYPE_LABELS[order.orderType] || order.orderType || '-'}
                          </td>
                          <td className="payment-page__order-amount">
                            {formatNumber(order.amount)}원
                          </td>
                          <td>
                            <span
                              className="payment-page__order-status"
                              style={{ color: statusConfig.color }}
                            >
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="payment-page__order-date">
                            {formatDate(order.completedAt || order.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {orders.totalPages > 1 && (
                <div className="payment-page__pagination">
                  <button
                    className="payment-page__pagination-btn"
                    onClick={() => setOrderPage((prev) => Math.max(0, prev - 1))}
                    disabled={orderPage === 0}
                  >
                    이전
                  </button>
                  <span className="payment-page__pagination-info">
                    {orderPage + 1} / {orders.totalPages}
                  </span>
                  <button
                    className="payment-page__pagination-btn"
                    onClick={() =>
                      setOrderPage((prev) => Math.min(orders.totalPages - 1, prev + 1))
                    }
                    disabled={orderPage >= orders.totalPages - 1}
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
