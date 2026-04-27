/**
 * 추천 내역 API 모듈.
 *
 * Backend의 RecommendationController와 통신하여
 * AI 추천 이력 조회, 찜/봤어요 토글, 만족도 피드백을 수행한다.
 *
 * @module features/recommendation/api/recommendationApi
 */

import { backendApi, requireAuth } from '../../../shared/api/axiosInstance';
import { RECOMMENDATION_ENDPOINTS } from '../../../shared/constants/api';

/**
 * 추천 이력 목록을 조회한다 (페이징).
 *
 * @param {Object} params - 조회 파라미터
 * @param {number} [params.page=0] - 페이지 번호
 * @param {number} [params.size=20] - 페이지 크기
 * @param {string} [params.status] - 필터 (ALL, WISHLIST, WATCHED)
 * @returns {Promise<{content: Array, totalPages: number, totalElements: number}>}
 */
export async function getRecommendations({ page = 0, size = 20, status } = {}) {
  requireAuth();
  const params = { page, size };
  if (status && status !== 'ALL') params.status = status;
  return backendApi.get(RECOMMENDATION_ENDPOINTS.LIST, { params });
}

/**
 * 추천 영화 찜(위시리스트) 토글.
 *
 * @param {string|number} recommendationId - 추천 ID
 * @returns {Promise<{wishlisted: boolean}>}
 */
export async function toggleWishlist(recommendationId) {
  requireAuth();
  return backendApi.post(RECOMMENDATION_ENDPOINTS.WISHLIST(recommendationId));
}

/**
 * 추천 영화 봤어요 토글.
 *
 * @param {string|number} recommendationId - 추천 ID
 * @returns {Promise<{watched: boolean}>}
 */
export async function toggleWatched(recommendationId) {
  requireAuth();
  return backendApi.post(RECOMMENDATION_ENDPOINTS.WATCHED(recommendationId));
}

/**
 * 추천 영화 "관심 없음" 토글 (P2, 2026-04-24).
 *
 * <p>true 로 전환되면 Backend RecommendationImpact.dismissed=true 가 되어
 * Chat Agent 의 다음 추천 시 exclude_ids 에 자동 병합 → 같은 영화 재추천 차단.</p>
 *
 * @param {string|number} recommendationId - 추천 로그 ID (recommendationLogId)
 * @returns {Promise<{dismissed: boolean}>}
 */
export async function toggleDismissed(recommendationId) {
  requireAuth();
  return backendApi.post(RECOMMENDATION_ENDPOINTS.DISMISS(recommendationId));
}

/**
 * 추천 카드 별점/코멘트 제출 (UPSERT).
 *
 * 2026-04-27 통합: 기존 `/feedback` 엔드포인트가 폐기되고 reviews 테이블 단일 진실
 * 원본으로 통합됐다. 본 함수는 `POST /api/v1/recommendations/{id}/review` 로 호출하며
 * Backend 가 활성 리뷰 유무에 따라 INSERT/UPDATE 분기한다. 별점은 0.5~5.0 Double
 * 로 전송되며 (reviews.rating 컬럼은 DOUBLE), 추천 카드 UI 의 정수 1~5 그대로 보내도
 * Backend 검증을 통과한다 (Math.min/max 클램프).
 *
 * Backend 처리:
 *  - 활성 리뷰 있음 → rating/contents 갱신 (이미 받은 reward 미중복 지급)
 *  - 활성 리뷰 없음 → 신규 작성 + reward + 첫 리뷰 보너스 + user_watch_history 동기화 +
 *    recommendation_impact.rated 마킹
 *  - reviewSource = `rec_log_{id}`, reviewCategoryCode = `AI_RECOMMEND` 자동 세팅
 *
 * @param {string|number} recommendationId - 추천 로그 ID
 * @param {Object} feedback - 평가 데이터
 * @param {number} feedback.rating - 별점 (필수, 0.5~5.0)
 * @param {string} [feedback.comment] - 코멘트 (선택, null/빈 문자열 허용)
 * @returns {Promise<Object>} Backend `ReviewResponse`
 */
export async function submitFeedback(recommendationId, { rating, comment }) {
  requireAuth();
  return backendApi.post(RECOMMENDATION_ENDPOINTS.REVIEW(recommendationId), {
    rating,
    content: comment || null,
  });
}
