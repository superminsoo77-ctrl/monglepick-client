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
  getPointPacks,
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
 * 포인트팩 API 응답을 화면 렌더링용 모델로 변환한다.
 *
 * Backend {@link PointPackController}의 PointPackResponse 는 DB 원본 필드
 * ({@code packId, packName, price, pointsAmount, sortOrder}) 를 그대로 내려보내고,
 * 화면 컴포넌트({@link PointPackSection})는 {@code id/label/points/price/bonus/best}
 * 모양을 기대한다. 이 격차를 흡수하는 전용 매퍼이다.
 *
 * 규칙:
 *   - {@code id}     → `pack_${packId}` (React key + processingId 비교용 안정 문자열)
 *   - {@code label}  → "1,000P" 형식 (천단위 콤마)
 *   - {@code points} → {@code pointsAmount} 그대로
 *   - {@code price}  → {@code price} 그대로 (KRW)
 *   - {@code bonus}  → 현재 마스터 테이블에 보너스 필드가 없으므로 null
 *   - {@code best}   → 응답 내 최대 points 항목에만 true (최고가 팩 강조)
 *
 * "best" 규칙은 과거 하드코딩에서 10,000P 팩에 {@code best: true}를 박아두었던
 * 동작을 데이터 기반으로 일반화한 것이다. 관리자가 더 큰 팩을 추가하면 자동으로
 * 그 팩이 BEST 배지를 가져가게 된다.
 *
 * @param {Array} apiPacks - Backend 응답 배열
 * @returns {Array} PointPackSection 이 기대하는 형태의 배열
 */
function mapPointPacksForView(apiPacks) {
  if (!Array.isArray(apiPacks) || apiPacks.length === 0) return [];
  /* 최고가(=최다 포인트) 팩을 찾아 best 배지 부여 */
  const maxPoints = apiPacks.reduce((acc, p) => Math.max(acc, p?.pointsAmount ?? 0), 0);
  return apiPacks.map((p) => ({
    id: `pack_${p.packId}`,
    label: `${(p.pointsAmount ?? 0).toLocaleString()}P`,
    points: p.pointsAmount,
    price: p.price,
    bonus: null,
    best: p.pointsAmount === maxPoints && maxPoints > 0,
    /* 관리자 노출명을 툴팁/디버그에 활용하고 싶을 경우를 대비해 원본도 보존 */
    packName: p.packName,
  }));
}

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
  /* 포인트팩 목록 — 관리자 수정이 즉시 반영되도록 API 로부터 로드 */
  const [pointPacks, setPointPacks] = useState([]);
  const [isLoadingPointPacks, setIsLoadingPointPacks] = useState(true);
  /* 포인트팩 로드 실패 메시지 — 구독 플랜과 동일한 에러 배너 UX */
  const [pointPacksError, setPointPacksError] = useState(null);
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
   * 포인트팩 목록을 로드한다.
   *
   * 관리자 페이지({@code /admin/payment}의 포인트팩 탭)에서 수정된 가격/이름/활성 여부가
   * 유저 화면에 실시간 반영되도록 Backend {@code GET /api/v1/point-packs} 를 호출한다.
   * 비로그인 허용 공개 EP 이므로 requireAuth 없이 호출 가능하다.
   */
  const loadPointPacks = useCallback(async () => {
    setIsLoadingPointPacks(true);
    setPointPacksError(null);
    try {
      const data = await getPointPacks();
      /* Array 또는 {content:[]} 두 형식 모두 수용 (Spring Page 방어) */
      const raw = Array.isArray(data) ? data : data?.content || [];
      setPointPacks(mapPointPacksForView(raw));
    } catch (err) {
      console.error('[PaymentPage] 포인트팩 조회 실패:', err);
      setPointPacks([]);
      setPointPacksError(err?.message || '포인트팩 목록을 불러올 수 없습니다.');
    } finally {
      setIsLoadingPointPacks(false);
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
      /* 포인트팩 목록도 함께 로드 — 관리자 수정 즉시 반영 */
      loadPointPacks();
    }
  }, [isAuthenticated, loadPlans, loadPointPacks]);

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
   * 2026-04-14 변경 — 플랜 변경(업그레이드/다운그레이드/주기 변경) 허용:
   *   - 같은 플랜(planCode 동일): 중복 결제 차단 (에러 메시지)
   *   - 다른 플랜(업그레이드/다운그레이드/주기 변경): 확인 모달 후 결제 진행
   *     Backend 의 SubscriptionService.createSubscription 이 결제 승인 시점에
   *     기존 ACTIVE 를 CANCELLED 로 자동 전이하고 새 구독을 생성하는 원자적 흐름이므로,
   *     프런트에서 별도의 cancel API 호출 없이 결제만 진행하면 된다.
   *     결제 실패 시에는 Backend 트랜잭션이 롤백되어 기존 ACTIVE 구독이 그대로 보존된다.
   *
   * @param {Object} plan - 구독 상품 객체
   * @param {Object} [meta] - SubscriptionCard 에서 전달하는 부가 정보
   * @param {'upgrade'|'downgrade'|'period'|null} [meta.changeType] - 변경 유형
   */
  const handleSubscribe = async (plan, meta = {}) => {
    if (!user?.id || processingId) return;

    /* ── 동일 플랜 중복 결제 차단 ── */
    if (hasActiveSubscription) {
      const currentPlanCode = subscriptionStatus?.planCode;
      const isSamePlan = currentPlanCode && currentPlanCode === plan.planCode;
      if (isSamePlan) {
        showMessage(
          'error',
          '이미 해당 구독을 이용 중입니다. 만료일까지 중복 결제가 불가합니다.',
        );
        return;
      }

      /* ── 플랜 변경 확인 모달 ── */
      /*
       * 변경 유형별 메시지를 다르게 제공한다.
       *   - upgrade   : 긍정적 톤 (상위 등급)
       *   - downgrade : 중립 톤 (하위 등급, 손실 가능성 고지)
       *   - period    : 중립 톤 (주기 변경)
       *
       * 공통 고지:
       *   - 기존 구독은 즉시 해지(CANCELLED) 전이
       *   - 새 플랜은 결제 완료 즉시 시작
       *   - 기존 플랜의 잔여 기간은 실질적으로 사용 불가 (QuotaService 가 ACTIVE 단건 조회)
       */
      const currentPlanName = subscriptionStatus?.planName || '현재 구독';
      const ct = meta?.changeType;
      let modalConfig;
      if (ct === 'upgrade') {
        modalConfig = {
          title: '구독 플랜 업그레이드',
          message:
            `${currentPlanName}을(를) ${plan.name}(으)로 업그레이드합니다.\n\n` +
            '• 기존 구독은 결제 완료 즉시 해지 처리됩니다.\n' +
            '• 새 플랜의 혜택·포인트 지급은 결제 완료 즉시 시작됩니다.\n' +
            '• 기존 구독의 잔여 기간은 사용할 수 없습니다.\n\n' +
            '진행하시겠습니까?',
          type: 'info',
          confirmLabel: '업그레이드 진행',
          cancelLabel: '취소',
        };
      } else if (ct === 'downgrade') {
        modalConfig = {
          title: '구독 플랜 조정',
          message:
            `${currentPlanName}에서 ${plan.name}(으)로 변경합니다.\n\n` +
            '• 기존 구독은 결제 완료 즉시 해지 처리됩니다.\n' +
            '• 새 플랜의 혜택·포인트 지급은 결제 완료 즉시 시작됩니다.\n' +
            '• 기존 상위 플랜의 잔여 기간은 사용할 수 없습니다.\n\n' +
            '진행하시겠습니까?',
          type: 'warning',
          confirmLabel: '변경 진행',
          cancelLabel: '취소',
        };
      } else {
        /* period 또는 그 외 케이스 */
        modalConfig = {
          title: '결제 주기 변경',
          message:
            `${currentPlanName}에서 ${plan.name}(으)로 변경합니다.\n\n` +
            '• 기존 구독은 결제 완료 즉시 해지 처리됩니다.\n' +
            '• 새 결제 주기가 즉시 시작됩니다.\n' +
            '• 기존 구독의 잔여 기간은 사용할 수 없습니다.\n\n' +
            '진행하시겠습니까?',
          type: 'info',
          confirmLabel: '변경 진행',
          cancelLabel: '취소',
        };
      }

      const confirmed = await showConfirm(modalConfig);
      if (!confirmed) return;
    }

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

        {/*
          현재 구독 요약 배너 — 페이지 진입 즉시 "나는 지금 어떤 구독 중인지" 를 확인할 수 있도록
          가장 상단에 표시한다. 활성 구독이 있을 때만 렌더되며, 만료일 정보까지 한 줄에 정리한다.
          사용자 민원: "현재 구독 플랜 확인 불가" → 구독 상품 카드 하단 배지 + 이 상단 배너의
          이중 확인 경로로 해결한다.
        */}
        {hasActiveSubscription && subscriptionStatus && (
          <S.CurrentSubscriptionBanner role="status">
            <S.CurrentSubscriptionIcon aria-hidden="true">✓</S.CurrentSubscriptionIcon>
            <S.CurrentSubscriptionBody>
              <S.CurrentSubscriptionTitle>
                현재 <strong>{subscriptionStatus.planName || '구독 상품'}</strong> 이용 중
              </S.CurrentSubscriptionTitle>
              <S.CurrentSubscriptionMeta>
                {subscriptionStatus.expiresAt
                  ? `만료일 ${formatDate(subscriptionStatus.expiresAt)}까지 혜택이 유지됩니다.`
                  : '활성 구독이 확인되었습니다.'}
                {subscriptionStatus.status === 'CANCELLED' && ' (해지 예약됨)'}
              </S.CurrentSubscriptionMeta>
            </S.CurrentSubscriptionBody>
          </S.CurrentSubscriptionBanner>
        )}

        {/* 섹션 1: 구독 상품 */}
        <S.Section>
          <S.SectionTitle>구독 상품</S.SectionTitle>
          <S.SectionDesc>
            {hasActiveSubscription
              ? '플랜 카드의 "업그레이드/조정하기" 버튼으로 언제든 변경할 수 있습니다. 결제 완료 즉시 기존 구독은 해지되고 새 플랜이 시작됩니다.'
              : '구독하면 매 주기마다 포인트가 자동 지급됩니다.'}
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
                  /*
                   * 현재 구독 플랜 코드와 활성 여부를 전달.
                   * 카드 측에서 "구독 중" 배지 + 버튼 비활성 처리를 수행한다.
                   * planCode 가 SubscriptionStatusResponse 에 포함되므로 (2026-04-14 추가)
                   * planName 문자열 비교가 아닌 코드 기반의 안전한 매칭을 사용한다.
                   */
                  currentPlanCode={subscriptionStatus?.planCode || null}
                  hasActiveSubscription={hasActiveSubscription}
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

          {/*
            구독 상품과 동일한 렌더 우선순위.
            포인트팩은 관리자 페이지({@code /admin/payment})에서 실시간 수정되므로
            하드코딩 fallback 없이 항상 API 응답을 그대로 노출한다.
          */}
          {isLoadingPointPacks ? (
            <Loading message="포인트팩 로딩 중..." />
          ) : pointPacksError ? (
            <S.ErrorBanner role="alert">
              <span>{pointPacksError}</span>
              <S.RetryBtn type="button" onClick={loadPointPacks}>
                다시 시도
              </S.RetryBtn>
            </S.ErrorBanner>
          ) : pointPacks.length === 0 ? (
            <S.EmptyMsg>현재 판매 중인 포인트팩이 없습니다.</S.EmptyMsg>
          ) : (
            <PointPackSection
              packs={pointPacks}
              processingId={processingId}
              onBuyPack={handleBuyPack}
              formatNumber={formatNumber}
            />
          )}
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
