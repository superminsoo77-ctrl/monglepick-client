/**
 * 로드맵 API 모듈.
 *
 * Backend의 RoadmapController와 통신하여
 * 영화 학습 코스/로드맵 조회 및 진행을 수행한다.
 *
 * @module features/roadmap/api/roadmapApi
 */

import { backendApi, agentApi, requireAuth } from '../../../shared/api/axiosInstance';
import { ROADMAP_ENDPOINTS } from '../../../shared/constants/api';

/**
 * 코스 목록 조회.
 *
 * @param {Object} params
 * @param {string} [params.category] - 카테고리 필터 (GENRE, DIRECTOR, ERA, COUNTRY, THEME)
 * @returns {Promise<Array<{id, title, description, category, movieCount, thumbnailUrl, difficulty}>>}
 */
export async function getCourses({ theme } = {}) {
  requireAuth();
  const params = {};
  if (theme) params.theme = theme;
  return backendApi.get(ROADMAP_ENDPOINTS.COURSES, { params });
}

/**
 * 코스 상세 조회 (영화 목록 포함).
 *
 * @param {string|number} courseId
 * @returns {Promise<{id, title, description, category, movies: Array, progress}>}
 */
export async function getCourseDetail(courseId) {
  requireAuth();
  return backendApi.get(ROADMAP_ENDPOINTS.COURSE_DETAIL(courseId));
}

/**
 * 코스 진행 상황 조회.
 *
 * @param {string|number} courseId
 * @returns {Promise<{courseId, completedMovies: Array, totalMovies: number, progressPercent: number}>}
 */
export async function getCourseProgress(courseId) {
  requireAuth();
  return backendApi.get(ROADMAP_ENDPOINTS.COURSE_PROGRESS(courseId));
}

/**
 * 코스 시작.
 *
 * @param {string|number} courseId
 * @returns {Promise<void>}
 */
export async function startCourse(courseId) {
  requireAuth();
  return backendApi.post(ROADMAP_ENDPOINTS.START_COURSE(courseId));
}

/**
 * 코스 내 영화 시청 완료 마킹.
 *
 * @param {string|number} courseId
 * @param {string} movieId
 * @param {string} [review] - 도장깨기 인증 한마디 (선택)
 * @returns {Promise<{completedCount: number, totalCount: number}>}
 */
export async function completeMovie(courseId, movieId, review) {
  requireAuth();
  const body = review ? { review } : {};
  return backendApi.post(ROADMAP_ENDPOINTS.COMPLETE_MOVIE(courseId, movieId), body);
}

/**
 * 이미 작성한 영화 리뷰 조회.
 *
 * @param {string|number} courseId
 * @param {string|number} movieId
 * @returns {Promise<{review: string, createdAt: string}>}
 */
export async function getMovieReview(courseId, movieId) {
  requireAuth();
  const res = await backendApi.get(ROADMAP_ENDPOINTS.MOVIE_REVIEW(courseId, movieId));
  return res?.data ?? res;
}

/**
 * FastAPI AI 에이전트에 리뷰 검증 요청 (직접 호출).
 *
 * Spring Boot → FastAPI 동기 호출 대신 프론트엔드가 직접 FastAPI를 호출한다.
 *
 * @param {Object} params
 * @param {number} params.verificationId  - CourseVerification PK (completeMovie 응답에서 수신)
 * @param {string} params.userId          - 사용자 ID
 * @param {string} params.courseId        - 코스 슬러그
 * @param {string} params.movieId         - 영화 ID
 * @param {string} params.reviewText      - 리뷰 본문
 * @param {string} params.moviePlot       - 영화 줄거리 (completeMovie 응답에서 수신)
 * @returns {Promise<{review_status: string, rationale: string, similarity_score: number, matched_keywords: string[], confidence: number}>}
 */
export async function verifyReview({ verificationId, userId, courseId, movieId, reviewText, moviePlot }) {
  return agentApi.post('/api/v1/admin/ai/review-verification/verify', {
    verification_id: verificationId,
    user_id: userId,
    course_id: courseId,
    movie_id: movieId,
    review_text: reviewText,
    movie_plot: moviePlot || '',
  });
}

/**
 * FastAPI AI 검증 결과를 Spring Boot에 전달하여 DB 업데이트 및 진행률 반영.
 *
 * @param {string} courseId
 * @param {string} movieId
 * @param {Object} params
 * @param {number} params.verificationId
 * @param {string} params.reviewStatus     - AUTO_VERIFIED | NEEDS_REVIEW | AUTO_REJECTED | PENDING
 * @param {string|null} params.rationale
 * @param {number|null} params.similarityScore
 * @param {string[]|null} params.matchedKeywords
 * @param {number|null} params.confidence
 * @returns {Promise<CourseCompleteResponse>}
 */
export async function applyVerifyResult(courseId, movieId, {
  verificationId, reviewStatus, rationale, similarityScore, matchedKeywords, confidence,
}) {
  requireAuth();
  return backendApi.patch(ROADMAP_ENDPOINTS.VERIFY_RESULT(courseId, movieId), {
    verificationId,
    reviewStatus,
    rationale: rationale ?? null,
    similarityScore: similarityScore ?? null,
    matchedKeywords: matchedKeywords ?? null,
    confidence: confidence ?? null,
  });
}
