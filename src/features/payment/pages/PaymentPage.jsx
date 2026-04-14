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
 *   2) loadTossPayments(clientKey) → payment 객체 초기화
 *   3) payment.requestPayment (method + amount + successUrl/failUrl 리다이렉트)
 *   4) PaymentSuccessPage에서 confirmPayment (paymentKey + orderId + amount)
 *
 * 비인증 사용자는 PrivateRoute에 의해 로그인 페이지로 리다이렉트된다.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
/* 커스텀 모달 훅 — window.confirm 대체 */
import { useModal } from '../../../shared/components/Modal';
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
import * as S from './PaymentPage.styled';

/* ── 상수 정의 ── */

/**
 * 포인트 팩 상품 목록.
 *
 * 설계서 v3.2 §13.1 / 엑셀 Table 50 기준 — 1P = 10원 통일.
 * 사용자용 포인트 팩 조회 API 가 백엔드에 아직 없어 하드코딩으로 표시하지만,
 * 백엔드 {@code point_pack_prices} 테이블의 초기값과 완전히 동일하게 맞춰두었다.
 * 추후 `GET /api/v1/point-packs` 엔드포인트가 추가되면 API 연동으로 전환할 예정.
 */
const POINT_PACKS = [
  { id: 'pack_100',   points: 100,   price: 1000,   label: '100P',    bonus: null },
  { id: 'pack_200',   points: 200,   price: 2000,   label: '200P',    bonus: null },
  { id: 'pack_500',   points: 500,   price: 5000,   label: '500P',    bonus: null },
  { id: 'pack_1000',  points: 1000,  price: 10000,  label: '1,000P',  bonus: null },
  { id: 'pack_5000',  points: 5000,  price: 50000,  label: '5,000P',  bonus: null },
  { id: 'pack_10000', points: 10000, price: 100000, label: '10,000P', bonus: null, best: true },
];

/**
 * Toss Payments 결제수단 코드 (SDK v2 method enum).
 *
 * 몽글픽은 결제수단 선택 UI 를 노출하지 않고 `CARD` 단일 값으로 고정한다.
 * `CARD` 를 지정하면 Toss 결제창이 내부에서 신용/체크카드 + 토스페이·카카오페이
 * 등 간편결제 옵션까지 함께 노출해주므로 사용자가 별도 선택 단계를 거치지 않아도
 * 실질 결제수단 커버리지는 충분하다.
 *
 * Toss v2 는 영문 enum 만 허용한다 (CARD / TRANSFER / VIRTUAL_ACCOUNT / MOBILE_PHONE 등).
 * v1 시절의 한글 값('카드' 등) 을 넘기면 "method 파라미터에 사용할 수 없는 enum 값"
 * 에러가 발생하므로 절대 한글로 되돌리지 말 것.
 */
const TOSS_PAYMENT_METHOD = 'CARD';

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
  /* 커스텀 모달 — window.confirm 대체 */
  const { showConfirm } = useModal();

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
  /* 구독 플랜 로드 실패 메시지 — 하드코딩 fallback 제거 후 에러 배너로 전환 */
  const [plansError, setPlansError] = useState(null);
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
   *
   * 백엔드 `GET /api/v1/subscription/plans` (SubscriptionController#getPlans) 의 응답을
   * 그대로 화면에 표시한다. 과거에는 API 실패 시 하드코딩된 플랜으로 degrade 했지만,
   * 설계서 v3.2 가격/포인트와 맞지 않는 구값을 보여줄 위험이 있어 완전히 제거하고
   * 에러 배너 + 재시도 UI 로 전환했다.
   */
  const loadPlans = useCallback(async () => {
    setIsLoadingPlans(true);
    setPlansError(null);
    try {
      const data = await getSubscriptionPlans();
      /* Array 또는 {content:[]} 두 형식 모두 수용 */
      setPlans(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      console.error('[PaymentPage] 구독 상품 조회 실패:', err);
      setPlans([]);
      setPlansError(err?.message || '구독 상품 목록을 불러올 수 없습니다.');
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
   * 2) loadTossPayments → payment 객체 초기화
   * 3) payment.requestPayment (redirect 방식 — 결제수단 선택 포함)
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
    const payment = tossPayments.payment({ customerKey: user.id });

    /*
     * 3. 결제 요청 (redirect 방식).
     *
     * method 는 `TOSS_PAYMENT_METHOD` 상수 (='CARD') 로 고정한다.
     * Toss 결제창이 CARD 선택 시 내부에서 토스페이·카카오페이 등 간편결제도 함께 노출하므로
     * 별도의 결제수단 선택 UI 없이도 실질 결제수단 커버리지는 충분하다.
     * Toss v2 SDK 는 영문 enum(CARD/TRANSFER/...) 만 허용한다 — v1 한글 값('카드') 금지.
     */
    await payment.requestPayment({
      method: TOSS_PAYMENT_METHOD,
      amount: { currency: 'KRW', value: amount },
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
          /*
           * Backend PaymentOrder.OrderType enum 값과 정확히 일치해야 한다.
           * (PaymentService.createOrder → OrderType.valueOf(orderType.toUpperCase()))
           * 과거 'POINT_CHARGE'로 보내던 값을 'POINT_PACK'으로 통일한다 (설계서 v3.2 §13.1).
           */
          orderType: 'POINT_PACK',
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

    const confirmed = await showConfirm({
      title: '구독 취소',
      message: '정말 구독을 취소하시겠습니까?\n만료일까지는 계속 이용할 수 있습니다.',
      type: 'warning',
      confirmLabel: '취소하기',
      cancelLabel: '돌아가기',
    });
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
    <S.Page>
      <S.Inner>
        {/* 페이지 제목 */}
        <S.Title>결제 / 구독</S.Title>

        {/* 에러 메시지 */}
        {error && (
          <S.ErrorMsg role="alert">
            {error}
          </S.ErrorMsg>
        )}

        {/* 성공 메시지 */}
        {successMsg && (
          <S.SuccessMsg role="status">
            {successMsg}
          </S.SuccessMsg>
        )}

        {/* 섹션 1: 구독 상품 */}
        <S.Section>
          <S.SectionTitle>구독 상품</S.SectionTitle>
          <S.SectionDesc>
            구독하면 매 주기마다 포인트가 자동 지급됩니다.
          </S.SectionDesc>

          {/*
            렌더 우선순위:
            1) 로딩 중   → Loading 스피너
            2) 에러 발생 → 에러 배너 + 재시도 버튼 (하드코딩 fallback 없이)
            3) 빈 목록   → "등록된 상품이 없습니다" 안내
            4) 정상      → PlansGrid 카드 목록
          */}
          {isLoadingPlans ? (
            <Loading message="구독 상품 로딩 중..." />
          ) : plansError ? (
            <S.ErrorBanner role="alert">
              <span>{plansError}</span>
              <S.RetryBtn type="button" onClick={loadPlans}>
                다시 시도
              </S.RetryBtn>
            </S.ErrorBanner>
          ) : plans.length === 0 ? (
            <S.EmptyMsg>현재 판매 중인 구독 상품이 없습니다.</S.EmptyMsg>
          ) : (
            <S.PlansGrid>
              {plans.map((plan) => (
                <SubscriptionCard
                  key={plan.planCode}
                  plan={plan}
                  processingId={processingId}
                  onSubscribe={handleSubscribe}
                  formatNumber={formatNumber}
                />
              ))}
            </S.PlansGrid>
          )}
        </S.Section>

        {/* 섹션 2: 포인트 팩 */}
        <S.Section>
          <S.SectionTitle>포인트 충전</S.SectionTitle>
          <S.SectionDesc>
            필요한 만큼 포인트를 충전하세요.
          </S.SectionDesc>

          <PointPackSection
            packs={POINT_PACKS}
            processingId={processingId}
            onBuyPack={handleBuyPack}
            formatNumber={formatNumber}
          />
        </S.Section>

        {/* 섹션 3: 내 구독 상태 */}
        <S.Section>
          <S.SectionTitle>내 구독 상태</S.SectionTitle>

          <SubscriptionStatus
            subscriptionStatus={subscriptionStatus}
            hasActiveSubscription={hasActiveSubscription}
            isLoading={isLoadingSubscription}
            isCancelling={isCancelling}
            onCancel={handleCancelSubscription}
            formatDate={formatDate}
          />
        </S.Section>

        {/* 섹션 4: 결제 내역 */}
        <S.Section>
          <S.SectionTitle>
            결제 내역
            {orders.totalElements > 0 && (
              <S.OrdersCount>
                ({formatNumber(orders.totalElements)}건)
              </S.OrdersCount>
            )}
          </S.SectionTitle>

          <OrderHistory
            orders={orders}
            orderPage={orderPage}
            isLoading={isLoadingOrders}
            onPageChange={setOrderPage}
            formatNumber={formatNumber}
            formatDate={formatDate}
          />
        </S.Section>
      </S.Inner>
    </S.Page>
  );
}
