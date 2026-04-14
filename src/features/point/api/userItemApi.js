/**
 * 보유 아이템(UserItem) API 모듈 (2026-04-14 신규, C 방향).
 *
 * "내 아이템" 인벤토리 조회·착용·사용을 처리한다. AI 이용권(purchased_ai_tokens)은
 * PointShop 쪽에서 별도 조회되므로 이 모듈에서는 다루지 않는다.
 *
 * Backend 경로: /api/v1/users/me/items/**
 * 모든 요청은 JWT 인증 필수.
 */

/* 공용 axios 인스턴스 + 인증 필수 가드 */
import api, { requireAuth } from '../../../shared/api/axiosInstance';
/* 엔드포인트 상수 — shared/constants/api.js */
import { USER_ITEM_ENDPOINTS } from '../../../shared/constants/api';

// ── 목록/요약 조회 ──

/**
 * 내 보유 아이템 목록 조회 (페이징 + 카테고리 필터).
 *
 * @param {Object} [opts={}]
 * @param {string} [opts.category] — "coupon"/"avatar"/"badge"/"apply"/"hint" (선택)
 * @param {number} [opts.page=0] — 0-indexed
 * @param {number} [opts.size=20]
 * @returns {Promise<Object>} Spring Page 구조
 *   - content: 아이템 배열 [{ userItemId, pointItemId, itemName, category, itemType,
 *                          imageUrl, status, acquiredAt, expiresAt, equippedAt,
 *                          remainingQuantity, equipped, expired }]
 *   - page, size, totalElements, totalPages
 */
export async function getMyItems({ category, page = 0, size = 20 } = {}) {
  requireAuth();
  const params = { page, size };
  if (category) params.category = category;
  return api.get(USER_ITEM_ENDPOINTS.LIST, { params });
}

/**
 * 내 보유 아이템 요약 조회 — 카테고리별 개수 + 착용 정보.
 *
 * @returns {Promise<Object>}
 *   - totalActive, avatarCount, badgeCount, couponCount, applyCount, hintCount
 *   - equippedAvatar: UserItemResponse | null
 *   - equippedBadge: UserItemResponse | null
 */
export async function getMyItemsSummary() {
  requireAuth();
  return api.get(USER_ITEM_ENDPOINTS.SUMMARY);
}

/**
 * 착용 중인 아이템만 조회 (프로필 렌더링 경량 API).
 *
 * 리스트 인덱스: [0]=avatar, [1]=badge. 미착용 시 null 포함.
 *
 * @returns {Promise<Array<Object|null>>} 2-원소 배열
 */
export async function getEquippedItems() {
  requireAuth();
  return api.get(USER_ITEM_ENDPOINTS.EQUIPPED);
}

// ── 상태 전이 ──

/**
 * 아이템 착용 (아바타/배지).
 * 같은 카테고리 기존 착용 아이템은 백엔드에서 자동 해제된다.
 *
 * @param {number} userItemId
 * @returns {Promise<Object>} 착용된 UserItemResponse
 * @throws 400: USER_ITEM_NOT_EQUIPPABLE / USER_ITEM_INVALID_STATE
 * @throws 404: USER_ITEM_NOT_FOUND (타인 소유도 포함)
 */
export async function equipItem(userItemId) {
  requireAuth();
  return api.post(USER_ITEM_ENDPOINTS.EQUIP(userItemId));
}

/**
 * 아이템 착용 해제.
 *
 * @param {number} userItemId
 * @returns {Promise<Object>} UserItemResponse
 */
export async function unequipItem(userItemId) {
  requireAuth();
  return api.post(USER_ITEM_ENDPOINTS.UNEQUIP(userItemId));
}

/**
 * 아이템 1회 사용 (힌트/응모권).
 * remainingQuantity 가 1 차감되고 0 이 되면 status=USED 로 전환된다.
 *
 * @param {number} userItemId
 * @returns {Promise<Object>} UserItemResponse
 * @throws 400: USER_ITEM_INVALID_STATE (잔여 수량 0 또는 이미 USED/EXPIRED)
 */
export async function useItem(userItemId) {
  requireAuth();
  return api.post(USER_ITEM_ENDPOINTS.USE(userItemId));
}
