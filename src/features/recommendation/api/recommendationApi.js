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
 * 별점(1~5) 을 Backend 가 요구하는 feedbackType enum 으로 매핑한다.
 *
 * QA #172 (2026-04-23) 근본 해결 (후속): Backend `RecommendationFeedbackRequest` 에
 * `rating Integer` 필드가 추가되어 별점을 원시값 그대로 전송 가능. feedbackType 은
 * 여전히 필수이므로 별점에서 파생해 함께 보낸다.
 *
 * 매핑 규칙:
 *  - 4~5 점 → `like`    (만족)
 *  - 1~3 점 → `dislike` (불만족 — 3점도 완벽 만족은 아니므로 dislike 쪽으로 분류)
 *  - 별점 없음 → `like` (기본값, 호출부가 명시적으로 like/dislike 를 지정하지 않은 경우)
 */
function mapRatingToFeedbackType(rating) {
  if (rating == null) return 'like';
  return rating >= 4 ? 'like' : 'dislike';
}

/**
 * 만족도 피드백 제출.
 *
 * QA #172 근본해결: 별점을 `rating` 필드로 별도 전송. 과거엔 `[별점 N/5]` 프리픽스를 comment 에
 * 합쳐 보냈으나 Backend 엔티티에 rating 컬럼이 추가되어 원시값을 그대로 보관할 수 있게 됐다.
 *
 * @param {string|number} recommendationId - 추천 ID
 * @param {Object} feedback - 피드백 데이터
 * @param {number} [feedback.rating] - 별점 (1~5, 선택)
 * @param {string} [feedback.comment] - 코멘트 (선택)
 * @returns {Promise<Object>} Backend `RecommendationFeedbackResponse`
 */
export async function submitFeedback(recommendationId, { rating, comment }) {
  requireAuth();
  const feedbackType = mapRatingToFeedbackType(rating);
  return backendApi.post(RECOMMENDATION_ENDPOINTS.FEEDBACK(recommendationId), {
    feedbackType,
    rating: rating ?? null,
    comment: comment || null,
  });
}
