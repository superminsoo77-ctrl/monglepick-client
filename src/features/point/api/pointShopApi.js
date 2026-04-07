/**
 * 포인트 상점(PointShop) API 모듈.
 *
 * AI 추천 이용권 구매 전용 API로, 일반 포인트 아이템 교환(pointApi.js)과는
 * 별도로 운영된다. Backend의 PointShopController와 1:1 대응된다.
 *
 * 구매된 이용권은 user_ai_quota.purchased_ai_tokens에 누적되며,
 * QuotaService의 AI 3-소스 모델 3단계(PURCHASED)에서 소비된다.
 *
 * 모든 요청에 JWT 인증이 필요하다.
 */

/* 공용 axios 인스턴스 + 인증 가드 */
import api, { requireAuth } from '../../../shared/api/axiosInstance';
/* API 상수 — shared/constants에서 가져옴 */
import { POINT_SHOP_ENDPOINTS } from '../../../shared/constants/api';

/**
 * 포인트 상점 아이템 목록과 현재 잔액/이용권 잔여 횟수를 조회한다.
 *
 * @returns {Promise<Object>} 상점 응답
 *   - currentBalance: 현재 보유 포인트 잔액
 *   - currentAiTokens: 현재 보유 AI 이용권 잔여 횟수 (purchased_ai_tokens)
 *   - items: [{ itemId, name, cost, amount, description }, ...] 상품 3종
 */
export async function getShopItems() {
  requireAuth();
  return api.get(POINT_SHOP_ENDPOINTS.ITEMS);
}

/**
 * AI 이용권 팩을 구매한다.
 *
 * @param {'AI_TOKEN_5'|'AI_TOKEN_20'} packType - 구매할 팩 유형
 * @returns {Promise<Object>} 구매 결과
 *   - deductedPoints: 차감된 포인트
 *   - addedTokens: 지급된 이용권 횟수
 *   - remainingBalance: 남은 포인트 잔액
 *   - totalPurchasedTokens: 전체 AI 이용권 잔여 횟수
 * @throws {Error} 포인트 부족 시 402, 잘못된 packType은 400, 포인트 레코드 없음은 404
 */
export async function purchaseAiTokens(packType) {
  requireAuth();
  return api.post(
    POINT_SHOP_ENDPOINTS.PURCHASE_AI_TOKENS,
    null,
    { params: { packType } },
  );
}

/**
 * 일일 한도 우회 AI 이용권(AI_DAILY_EXTEND)을 구매한다.
 *
 * <p>오늘의 무료 AI 사용 횟수를 모두 소진한 사용자가
 * 당일 추가 사용을 원할 때 100P를 소비하여 5회를 구매한다.
 * 구매된 토큰은 일일 한도를 우회하여 즉시 사용 가능하다.</p>
 *
 * @returns {Promise<Object>} 구매 결과 (purchaseAiTokens와 동일한 구조)
 */
export async function purchaseAiDailyExtend() {
  requireAuth();
  return api.post(POINT_SHOP_ENDPOINTS.PURCHASE_AI_EXTEND);
}
