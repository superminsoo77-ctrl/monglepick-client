/**
 * 리뷰(Review) API 모듈.
 *
 * 영화 리뷰의 조회 및 작성 관련 HTTP 요청을 처리한다.
 * communityApi에서 분리된 리뷰 전용 모듈이다.
 */

/* 공용 axios 인스턴스 — JWT 자동 주입 + 401 갱신 */
import api from '../../../shared/api/axiosInstance';
/* API 상수 — shared/constants에서 가져옴 */
import { COMMUNITY_ENDPOINTS } from '../../../shared/constants/api';

// ── 리뷰 (Reviews) ──

/**
 * 특정 영화의 리뷰 목록을 조회한다.
 *
 * @param {number|string} movieId - 영화 ID
 * @param {Object} [params={}] - 조회 파라미터
 * @param {number} [params.page=1] - 페이지 번호
 * @param {number} [params.size=10] - 페이지 크기
 * @param {string} [params.sort='latest'] - 정렬 기준 (latest, rating_high, rating_low)
 * @returns {Promise<Object>} 리뷰 목록 ({ reviews: [], total: number })
 */
export async function getReviews(movieId, { page = 1, size = 10, sort = 'latest' } = {}) {
  return api.get(COMMUNITY_ENDPOINTS.REVIEWS(movieId), { params: { page, size, sort } });
}

/**
 * 영화 리뷰를 작성한다.
 * 인증이 필요하다.
 *
 * <p>엑셀 5번 reviews 정합 필드를 모두 지원한다:</p>
 * <ul>
 *   <li><b>reviewSource</b>      — 어디서 작성했는지의 구체 참조 ID
 *       (예: {@code chat_ses_001}, {@code wsh_2345_003}, {@code cup_mch_005})</li>
 *   <li><b>reviewCategoryCode</b> — 작성 카테고리 분류 enum (서버 {@code ReviewCategoryCode})
 *       값: {@code 'THEATER_RECEIPT' | 'COURSE' | 'WORLDCUP' | 'WISHLIST' | 'AI_RECOMMEND' | 'PLAYLIST'}</li>
 * </ul>
 * <p>두 필드 모두 nullable. 호출하는 진입점 화면에 따라 적절한 값을 채워서 보낸다.</p>
 *
 * @param {number|string} movieId - 영화 ID
 * @param {Object}   reviewData
 * @param {string}   reviewData.content              - 리뷰 내용 (선택)
 * @param {number}   reviewData.rating               - 평점 (0.5 ~ 5.0)
 * @param {string}  [reviewData.reviewSource]        - 작성 출처 참조 ID (선택)
 * @param {string}  [reviewData.reviewCategoryCode]  - 작성 카테고리 코드 (선택, ReviewCategoryCode enum 값)
 * @returns {Promise<Object>} 생성된 리뷰 정보
 */
export async function createReview(
  movieId,
  { content, rating, reviewSource, reviewCategoryCode } = {},
) {
  return api.post(COMMUNITY_ENDPOINTS.CREATE_REVIEW(movieId), {
    movieId,
    content,
    rating,
    reviewSource,
    reviewCategoryCode,
  });
}

/**
 * 영화 리뷰를 수정한다.
 * 인증이 필요하며 본인 리뷰만 수정 가능하다.
 *
 * <p><b>주의</b>: 수정 API는 의도적으로 {@code reviewCategoryCode}를 변경 대상에서 제외한다.
 * 작성 카테고리는 작성 시점의 진입 경로를 기록하는 메타 정보이므로 사후 변경하지 않는다.</p>
 *
 * @param {number|string} movieId - 영화 ID
 * @param {number|string} reviewId - 리뷰 ID
 * @param {Object} reviewData - 수정할 리뷰 데이터
 * @param {string} reviewData.content - 리뷰 내용
 * @param {number} reviewData.rating - 평점 (0.5 ~ 5.0)
 * @returns {Promise<Object>} 수정된 리뷰 정보
 */
export async function updateReview(movieId, reviewId, { content, rating }) {
  return api.put(COMMUNITY_ENDPOINTS.REVIEW_DETAIL(movieId, reviewId), { content, rating });
}

/**
 * 영화 리뷰를 삭제한다.
 * 인증이 필요하며 본인 리뷰만 삭제 가능하다.
 *
 * @param {number|string} movieId - 영화 ID
 * @param {number|string} reviewId - 리뷰 ID
 * @returns {Promise<void>}
 */
export async function deleteReview(movieId, reviewId) {
  return api.delete(COMMUNITY_ENDPOINTS.REVIEW_DETAIL(movieId, reviewId));
}

/**
 * 리뷰 좋아요를 토글한다 (인스타그램 스타일 — 한 번 클릭으로 등록/취소 자동 전환).
 * 동일 엔드포인트 POST 호출로 등록 ↔ 취소가 자동 전환된다.
 * JWT 인증이 필요하다.
 *
 * @param {string|number} movieId - 영화 ID
 * @param {number|string} reviewId - 리뷰 ID
 * @returns {Promise<{liked: boolean, likeCount: number}>} 토글 후 좋아요 상태
 */
export async function toggleReviewLike(movieId, reviewId) {
  return api.post(COMMUNITY_ENDPOINTS.REVIEW_LIKE(movieId, reviewId));
}
