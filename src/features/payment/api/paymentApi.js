/**
 * 결제(Payment) 및 구독(Subscription) API 모듈.
 *
 * Toss Payments 연동 결제, 주문 생성/승인/내역 조회,
 * 구독 상품 조회/상태 확인/취소 등의 HTTP 요청을 처리한다.
 * 결제/구독 관련 요청은 인증 토큰이 필요하며,
 * 구독 상품 목록 조회는 공개 API로 인증 없이 호출 가능하다.
 */

/* 공용 axios 인스턴스 + 인증 필수 가드 */
import api, { requireAuth } from '../../../shared/api/axiosInstance';
/* API 상수 — shared/constants에서 가져옴 */
import {
  PAYMENT_ENDPOINTS,
  POINT_PACK_ENDPOINTS,
  SUBSCRIPTION_ENDPOINTS,
} from '../../../shared/constants/api';

// ── 결제 주문 ──

/**
 * 결제 주문을 생성한다.
 * 생성된 orderId와 clientKey로 Toss Payments SDK를 호출한다.
 *
 * @param {Object} orderData - 주문 데이터
 * @param {string} orderData.orderType - 주문 유형 ('POINT_PACK' 또는 'SUBSCRIPTION') — Backend enum과 일치 필수
 * @param {number} orderData.amount - 결제 금액 (원)
 * @param {number} [orderData.pointsAmount] - 충전할 포인트 수량 (포인트 충전 시)
 * @param {string} [orderData.planCode] - 구독 상품 코드 (구독 결제 시)
 * @returns {Promise<Object>} 주문 생성 결과 (orderId, amount, clientKey)
 */
export async function createOrder({ orderType, amount, pointsAmount, planCode }) {
  requireAuth();
  /* userId는 서버가 JWT에서 추출 (BOLA 방지) */
  return api.post(PAYMENT_ENDPOINTS.CREATE_ORDER, { orderType, amount, pointsAmount, planCode });
}

/**
 * Toss Payments 결제를 승인한다.
 * 승인 성공 시 포인트가 자동 지급된다.
 *
 * @param {Object} confirmData - 결제 승인 데이터
 * @param {string} confirmData.orderId - 주문 UUID
 * @param {string} confirmData.paymentKey - Toss Payments 결제 키
 * @param {number} confirmData.amount - 결제 금액 (위변조 검증용)
 * @returns {Promise<Object>} 승인 결과 (success, pointsGranted, newBalance)
 */
export async function confirmPayment({ orderId, paymentKey, amount }) {
  requireAuth();
  return api.post(PAYMENT_ENDPOINTS.CONFIRM, { orderId, paymentKey, amount });
}

/**
 * 결제 내역을 조회한다 (페이징).
 *
 * @param {Object} [options={}] - 조회 옵션
 * @param {number} [options.page=0] - 페이지 번호 (0부터 시작, Spring Page 규격)
 * @param {number} [options.size=20] - 페이지 크기
 * @returns {Promise<Object>} Spring Page 응답
 */
export async function getOrders({ page = 0, size = 20 } = {}) {
  requireAuth();
  return api.get(PAYMENT_ENDPOINTS.ORDER_LIST, { params: { page, size } });
}

// ── 포인트팩 ──

/**
 * 활성 포인트팩 목록을 조회한다.
 *
 * 관리자 페이지에서 관리하는 point_pack_prices 테이블의 is_active=true 팩만
 * sortOrder ASC 로 반환한다. 비로그인 허용이므로 requireAuth() 를 호출하지 않는다.
 *
 * @returns {Promise<Array<{packId:number, packName:string, price:number, pointsAmount:number, sortOrder:number}>>}
 */
export async function getPointPacks() {
  return api.get(POINT_PACK_ENDPOINTS.LIST);
}

// ── 구독 ──

/**
 * 구독 상품 목록을 조회한다.
 * 인증 불필요 — 공개 API. axios interceptor가 토큰 있으면 자동 주입하지만 필수 아님.
 *
 * @returns {Promise<Array<Object>>} 구독 상품 목록
 */
export async function getSubscriptionPlans() {
  return api.get(SUBSCRIPTION_ENDPOINTS.PLANS);
}

/**
 * 사용자의 현재 구독 상태를 조회한다.
 *
 * @returns {Promise<Object>} 구독 상태 정보
 */
export async function getSubscriptionStatus() {
  requireAuth();
  return api.get(SUBSCRIPTION_ENDPOINTS.STATUS);
}

/**
 * 구독을 취소한다.
 * 즉시 해지되지 않고, 현재 구독 기간 만료 시 해지된다.
 *
 * @returns {Promise<Object>} 취소 결과 (message)
 */
export async function cancelSubscription() {
  requireAuth();
  return api.post(SUBSCRIPTION_ENDPOINTS.CANCEL);
}
