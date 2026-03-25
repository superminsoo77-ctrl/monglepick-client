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
 * Toss Payments SDK v2 연동 흐름:
 *   1) createOrder → orderId + amount + clientKey 반환
 *   2) loadTossPayments(clientKey) → widgets 초기화
 *   3) widgets.setAmount → widgets.requestPayment (successUrl/failUrl 리다이렉트)
 *   4) PaymentSuccessPage에서 confirmPayment (paymentKey + orderId + amount)
 *
 * 비인증 사용자는 PrivateRoute에 의해 로그인 페이지로 리다이렉트된다.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
/* Toss Payments SDK v2 — 결제위젯 초기화용 */
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
/* 인증 Context 훅 — app/providers에서 가져옴 */
import useAuthStore from '../../../shared/stores/useAuthStore';
/* 결제/구독 API — 같은 feature 내의 paymentApi에서 가져옴 */
import {
  createOrder,
  getOrders,
  getSubscriptionPlans,
  getSubscriptionStatus,
  cancelSubscription,
} from '../api/paymentApi';
/* 로딩 스피너 — shared/components에서 가져옴 */
import Loading from '../../../shared/components/Loading/Loading';

/* ── 하위 컴포넌트 ── */
import SubscriptionCard from '../components/SubscriptionCard';
import PointPackSection from '../components/PointPackSection';
import SubscriptionStatus from '../components/SubscriptionStatus';
import OrderHistory from '../components/OrderHistory';

/* 포맷 유틸 — shared/utils에서 가져옴 */
import { formatDate, formatNumberWithComma as formatNumber } from '../../../shared/utils/formatters';
import './PaymentPage.css';

/* ── 상수 정의 ── */

/**
 * 포인트 팩 상품 목록.
 * 일회성 포인트 구매 옵션을 정의한다.
 */
const POINT_PACKS = [
  { id: 'pack_1000', points: 1000, price: 1900, label: '1,000P', bonus: null },
  { id: 'pack_3000', points: 3000, price: 4900, label: '3,000P', bonus: '10% 보너스' },
  { id: 'pack_5000', points: 5000, price: 7900, label: '5,000P', bonus: '15% 보너스' },
  { id: 'pack_10000', points: 10000, price: 14900, label: '10,000P', bonus: '25% 보너스', best: true },
];

/** 결제 내역 페이지당 표시 건수 */
const ORDER_PAGE_SIZE = 10;

/** Toss Payments 클라이언트 키 (환경변수에서 주입) */
const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY;

/**
 * 결제 성공/실패 리다이렉트 URL의 기본 경로.
 * 현재 origin 기준으로 절대 경로를 생성한다.
 */
const SUCCESS_URL = `${window.location.origin}/payment/success`;
const FAIL_URL = `${window.location.origin}/payment/fail`;

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

  /* setTimeout cleanup 용 ref (메모리 누수 방지) */
  const messageTimerRef = useRef(null);
  useEffect(() => {
    return () => { if (messageTimerRef.current) clearTimeout(messageTimerRef.current); };
  }, []);

  /* 인증 상태 */
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.isLoading);

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
      const data = await getSubscriptionStatus();
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
      const data = await getOrders({
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
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => {
      setError(null);
      setSuccessMsg(null);
    }, 3000);
  };

  /**
   * Toss Payments SDK v2를 초기화하고 결제를 요청하는 공통 함수.
   *
   * 1) Backend createOrder로 orderId 생성
   * 2) loadTossPayments → widgets 초기화
   * 3) widgets.setAmount → widgets.requestPayment (redirect 방식)
   * 4) 결제 완료 시 successUrl로 리다이렉트 → PaymentSuccessPage에서 승인 처리
   *
   * @param {Object} orderData - createOrder에 전달할 주문 데이터
   * @param {string} orderName - Toss 결제창에 표시할 주문명
   */
  const requestTossPayment = async (orderData, orderName) => {
    /* 1. Backend에서 주문 생성 → orderId + amount + clientKey 반환 */
    const order = await createOrder(orderData);
    const { orderId, amount } = order;
    /* Backend가 clientKey를 반환하면 사용, 아니면 환경변수 fallback */
    const clientKey = order.clientKey || TOSS_CLIENT_KEY;

    if (!clientKey) {
      throw new Error('Toss Payments 클라이언트 키가 설정되지 않았습니다.');
    }

    /* 2. Toss SDK v2 초기화 — customerKey는 user.id 사용 (회원 결제) */
    const tossPayments = await loadTossPayments(clientKey);
    const widgets = tossPayments.widgets({ customerKey: user.id });

    /* 3. 결제 금액 설정 */
    await widgets.setAmount({ currency: 'KRW', value: amount });

    /* 4. 결제 요청 (redirect 방식 — PC/모바일 모두 지원) */
    await widgets.requestPayment({
      orderId,
      orderName,
      successUrl: SUCCESS_URL,
      failUrl: FAIL_URL,
      customerEmail: user.email || undefined,
      customerName: user.nickname || user.name || undefined,
    });
  };

  /**
   * 구독 상품 결제를 시작한다.
   * Toss Payments SDK v2 결제위젯을 통해 결제 진행.
   *
   * @param {Object} plan - 구독 상품 객체
   */
  const handleSubscribe = async (plan) => {
    if (!user?.id || processingId) return;
    setProcessingId(plan.planCode);
    setError(null);

    try {
      await requestTossPayment(
        {
          orderType: 'SUBSCRIPTION',
          amount: plan.price,
          planCode: plan.planCode,
        },
        `${plan.name} 구독`,
      );
      /* requestPayment가 성공하면 리다이렉트되므로 이 아래는 실행되지 않음 */
    } catch (err) {
      /* 사용자가 결제창을 닫은 경우 (PAY_PROCESS_CANCELED) 또는 주문 생성 실패 */
      const msg = err?.message || '결제를 진행할 수 없습니다.';
      showMessage('error', msg);
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * 포인트 팩 구매를 시작한다.
   * Toss Payments SDK v2 결제위젯을 통해 결제 진행.
   *
   * @param {Object} pack - 포인트 팩 객체
   */
  const handleBuyPack = async (pack) => {
    if (!user?.id || processingId) return;
    setProcessingId(pack.id);
    setError(null);

    try {
      await requestTossPayment(
        {
          orderType: 'POINT_CHARGE',
          amount: pack.price,
          pointsAmount: pack.points,
        },
        `포인트 ${pack.label} 충전`,
      );
      /* requestPayment가 성공하면 리다이렉트되므로 이 아래는 실행되지 않음 */
    } catch (err) {
      const msg = err?.message || '결제를 진행할 수 없습니다.';
      showMessage('error', msg);
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * 구독 취소를 처리한다.
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
      await cancelSubscription();
      showMessage('success', '구독이 취소되었습니다. 만료일까지 이용 가능합니다.');
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

        {/* 섹션 1: 구독 상품 */}
        <section className="payment-page__section">
          <h2 className="payment-page__section-title">구독 상품</h2>
          <p className="payment-page__section-desc">
            구독하면 매 주기마다 포인트가 자동 지급됩니다.
          </p>

          {isLoadingPlans ? (
            <Loading message="구독 상품 로딩 중..." />
          ) : (
            <div className="payment-page__plans-grid">
              {plans.map((plan) => (
                <SubscriptionCard
                  key={plan.planCode}
                  plan={plan}
                  processingId={processingId}
                  onSubscribe={handleSubscribe}
                  formatNumber={formatNumber}
                />
              ))}
            </div>
          )}
        </section>

        {/* 섹션 2: 포인트 팩 */}
        <section className="payment-page__section">
          <h2 className="payment-page__section-title">포인트 충전</h2>
          <p className="payment-page__section-desc">
            필요한 만큼 포인트를 충전하세요.
          </p>

          <PointPackSection
            packs={POINT_PACKS}
            processingId={processingId}
            onBuyPack={handleBuyPack}
            formatNumber={formatNumber}
          />
        </section>

        {/* 섹션 3: 내 구독 상태 */}
        <section className="payment-page__section">
          <h2 className="payment-page__section-title">내 구독 상태</h2>

          <SubscriptionStatus
            subscriptionStatus={subscriptionStatus}
            hasActiveSubscription={hasActiveSubscription}
            isLoading={isLoadingSubscription}
            isCancelling={isCancelling}
            onCancel={handleCancelSubscription}
            formatDate={formatDate}
          />
        </section>

        {/* 섹션 4: 결제 내역 */}
        <section className="payment-page__section">
          <h2 className="payment-page__section-title">
            결제 내역
            {orders.totalElements > 0 && (
              <span className="payment-page__orders-count">
                ({formatNumber(orders.totalElements)}건)
              </span>
            )}
          </h2>

          <OrderHistory
            orders={orders}
            orderPage={orderPage}
            isLoading={isLoadingOrders}
            onPageChange={setOrderPage}
            formatNumber={formatNumber}
            formatDate={formatDate}
          />
        </section>
      </div>
    </div>
  );
}
