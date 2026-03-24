/**
 * 결제(Payment) 및 구독(Subscription) API 모듈.
 *
 * Toss Payments 연동 결제, 주문 생성/승인/내역 조회,
 * 구독 상품 조회/상태 확인/취소 등의 HTTP 요청을 처리한다.
 * 결제/구독 관련 요청은 인증 토큰이 필요하며,
 * 구독 상품 목록 조회는 공개 API로 인증 없이 호출 가능하다.
 */

/* API 상수 — shared/constants에서 가져옴 */
import {
  PAYMENT_ENDPOINTS,
  SUBSCRIPTION_ENDPOINTS,
  API_BASE_URL,
} from '../../../shared/constants/api';
/* 공통 인증 fetch 래퍼 — shared/utils에서 가져옴 */
import { fetchWithAuthRequired } from '../../../shared/utils/fetchWithAuth';

// ── 결제 주문 ──

/**
 * 결제 주문을 생성한다.
 * 생성된 orderId와 clientKey로 Toss Payments SDK를 호출한다.
 *
 * @param {Object} orderData - 주문 데이터
 * @param {string} orderData.userId - 사용자 ID
 * @param {string} orderData.orderType - 주문 유형 ('POINT_CHARGE' 또는 'SUBSCRIPTION')
 * @param {number} orderData.amount - 결제 금액 (원)
 * @param {number} [orderData.pointsAmount] - 충전할 포인트 수량 (포인트 충전 시)
 * @param {string} [orderData.planCode] - 구독 상품 코드 (구독 결제 시)
 * @returns {Promise<Object>} 주문 생성 결과
 *   - orderId: 주문 UUID
 *   - amount: 결제 금액
 *   - clientKey: Toss Payments 클라이언트 키 (SDK 초기화용)
 *
 * @example
 * // 포인트 충전 주문
 * const order = await createOrder({
 *   userId: 'user123',
 *   orderType: 'POINT_CHARGE',
 *   amount: 5000,
 *   pointsAmount: 5000,
 * });
 * // order.orderId로 Toss Payments SDK 결제 진행
 *
 * @example
 * // 구독 결제 주문
 * const order = await createOrder({
 *   userId: 'user123',
 *   orderType: 'SUBSCRIPTION',
 *   amount: 3900,
 *   planCode: 'monthly_basic',
 * });
 */
export async function createOrder({ userId, orderType, amount, pointsAmount, planCode }) {
  return fetchWithAuthRequired(PAYMENT_ENDPOINTS.CREATE_ORDER, {
    method: 'POST',
    body: JSON.stringify({ userId, orderType, amount, pointsAmount, planCode }),
  });
}

/**
 * Toss Payments 결제를 승인한다.
 * Toss Payments SDK에서 결제 완료 후 반환된 paymentKey로 서버 승인을 요청한다.
 * 승인 성공 시 포인트가 자동 지급된다.
 *
 * @param {Object} confirmData - 결제 승인 데이터
 * @param {string} confirmData.orderId - 주문 UUID
 * @param {string} confirmData.paymentKey - Toss Payments 결제 키
 * @param {number} confirmData.amount - 결제 금액 (위변조 검증용)
 * @returns {Promise<Object>} 승인 결과
 *   - success: 승인 성공 여부 (boolean)
 *   - pointsGranted: 지급된 포인트
 *   - newBalance: 지급 후 잔액
 *
 * @example
 * // Toss Payments SDK 결제 완료 콜백에서 호출
 * const result = await confirmPayment({
 *   orderId: 'uuid-xxx',
 *   paymentKey: 'toss_payment_key',
 *   amount: 5000,
 * });
 * console.log(`${result.pointsGranted}P 지급 완료! 잔액: ${result.newBalance}P`);
 */
export async function confirmPayment({ orderId, paymentKey, amount }) {
  return fetchWithAuthRequired(PAYMENT_ENDPOINTS.CONFIRM, {
    method: 'POST',
    body: JSON.stringify({ orderId, paymentKey, amount }),
  });
}

/**
 * 결제 내역을 조회한다 (페이징).
 * 포인트 충전, 구독 결제 등 모든 결제 기록을 확인할 수 있다.
 *
 * @param {string} userId - 사용자 ID
 * @param {Object} [options={}] - 조회 옵션
 * @param {number} [options.page=0] - 페이지 번호 (0부터 시작, Spring Page 규격)
 * @param {number} [options.size=20] - 페이지 크기
 * @returns {Promise<Object>} Spring Page 응답
 *   - content: 결제 내역 배열 [{ orderId, orderType, amount, pointsAmount, status, completedAt, createdAt }]
 *   - totalPages: 총 페이지 수
 *   - totalElements: 총 결제 건수
 *   - number: 현재 페이지 번호
 *
 * @example
 * const result = await getOrders('user123', { page: 0, size: 10 });
 * result.content.forEach(order => {
 *   console.log(order.orderType, order.amount, order.status);
 * });
 */
export async function getOrders(userId, { page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({
    userId,
    page: String(page),
    size: String(size),
  });
  return fetchWithAuthRequired(`${PAYMENT_ENDPOINTS.ORDERS}?${params.toString()}`);
}

// ── 구독 ──

/**
 * 구독 상품 목록을 조회한다.
 * 활성 상태인 모든 구독 상품을 반환한다.
 *
 * @returns {Promise<Array<Object>>} 구독 상품 목록
 *   - [{ planId, planCode, name, periodType, price, pointsPerPeriod, description }]
 *   - periodType: 'MONTHLY' 또는 'YEARLY'
 *
 * @example
 * const plans = await getSubscriptionPlans();
 * plans.forEach(plan => {
 *   console.log(`${plan.name}: ${plan.price}원/월 → ${plan.pointsPerPeriod}P`);
 * });
 */
export async function getSubscriptionPlans() {
  // 구독 상품 목록은 공개 API이므로 인증 불필요 — plain fetch 사용
  const response = await fetch(`${API_BASE_URL}${SUBSCRIPTION_ENDPOINTS.PLANS}`);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || '구독 상품 조회에 실패했습니다.');
  }
  return data;
}

/**
 * 사용자의 현재 구독 상태를 조회한다.
 *
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 구독 상태 정보
 *   - hasActiveSubscription: 활성 구독 여부 (boolean)
 *   - planName: 구독 상품명 (null 가능)
 *   - status: 구독 상태 ('ACTIVE', 'CANCELLED', 'EXPIRED' 등)
 *   - startedAt: 구독 시작일
 *   - expiresAt: 구독 만료일
 *   - autoRenew: 자동 갱신 여부 (boolean)
 *
 * @example
 * const status = await getSubscriptionStatus('user123');
 * if (status.hasActiveSubscription) {
 *   console.log(`${status.planName} 구독 중 (만료: ${status.expiresAt})`);
 * }
 */
export async function getSubscriptionStatus(userId) {
  const params = new URLSearchParams({ userId });
  return fetchWithAuthRequired(`${SUBSCRIPTION_ENDPOINTS.STATUS}?${params.toString()}`);
}

/**
 * 구독을 취소한다.
 * 즉시 해지되지 않고, 현재 구독 기간 만료 시 해지된다.
 *
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 취소 결과
 *   - message: 취소 안내 메시지
 *
 * @example
 * const result = await cancelSubscription('user123');
 * console.log(result.message);
 * // '구독이 취소되었습니다. 2026-04-24까지 이용 가능합니다.'
 */
export async function cancelSubscription(userId) {
  const params = new URLSearchParams({ userId });
  return fetchWithAuthRequired(`${SUBSCRIPTION_ENDPOINTS.CANCEL}?${params.toString()}`, {
    method: 'POST',
  });
}
