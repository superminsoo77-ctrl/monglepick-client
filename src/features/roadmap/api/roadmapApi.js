/**
 * 로드맵 API 모듈.
 *
 * Backend의 RoadmapController와 통신하여
 * 영화 학습 코스/로드맵 조회 및 진행을 수행한다.
 *
 * @module features/roadmap/api/roadmapApi
 */

import { backendApi, agentApi, requireAuth } from '../../../shared/api/axiosInstance';
import { ROADMAP_ENDPOINTS, REVIEW_VERIFICATION_ENDPOINTS } from '../../../shared/constants/api';

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
 * 코스 내 영화 시청 완료 마킹 (리뷰 저장 + PENDING 상태로 인증 레코드 생성).
 *
 * 2026-04-24 구조 변경: Backend가 에이전트를 직접 호출하던 방식에서
 * 프론트엔드가 에이전트를 직접 호출하는 방식으로 전환.
 * Backend는 리뷰/인증 레코드를 PENDING으로 저장하고 verificationId + moviePlot을 반환한다.
 * 프론트엔드는 이 값으로 callReviewVerificationAgent()를 호출하여 AI 판정을 수행하고,
 * 결과를 applyAiVerificationResult()로 Backend에 업데이트한다.
 *
 * @param {string|number} courseId
 * @param {string} movieId
 * @param {string} [review] - 도장깨기 인증 한마디 (선택)
 * @returns {Promise<CourseCompleteResponse>} 진행률 + verificationId + moviePlot (reviewStatus="PENDING")
 */
export async function completeMovie(courseId, movieId, review) {
  requireAuth();
  const body = review ? { review } : {};
  return backendApi.post(ROADMAP_ENDPOINTS.COMPLETE_MOVIE(courseId, movieId), body);
}

/**
 * AI 리뷰 검증 에이전트를 직접 호출한다.
 *
 * 2026-04-24 신규: 프론트엔드가 에이전트(FastAPI)를 직접 호출하는 방식.
 * Nginx가 /api/v1/admin/ai/review-verification/verify → ai_agent 서비스로 라우팅한다.
 *
 * @param {Object} params
 * @param {number} params.verificationId - course_verification PK
 * @param {string} params.userId - 리뷰 작성자 user_id
 * @param {string} params.courseId - 도장깨기 코스 ID
 * @param {string} params.movieId - 영화 ID
 * @param {string} params.reviewText - 사용자가 작성한 리뷰 본문
 * @param {string} params.moviePlot - 비교 기준 영화 줄거리
 * @returns {Promise<{verification_id, similarity_score, matched_keywords, confidence, review_status, rationale}>}
 */
export async function callReviewVerificationAgent({ verificationId, userId, courseId, movieId, reviewText, moviePlot }) {
  requireAuth();
  return agentApi.post(REVIEW_VERIFICATION_ENDPOINTS.VERIFY, {
    verification_id: verificationId,
    user_id: userId,
    course_id: courseId,
    movie_id: movieId,
    review_text: reviewText,
    movie_plot: moviePlot || '',
  });
}

/**
 * AI 에이전트 판정 결과를 Backend에 업데이트한다.
 *
 * 2026-04-24 신규: 프론트엔드가 에이전트에서 받은 판정 결과를 Backend에 전달한다.
 * Backend는 이 결과를 CourseVerification에 적용하고 AUTO_VERIFIED 시 진행률을 반영한다.
 *
 * @param {number} verificationId - course_verification PK
 * @param {Object} aiResult - 에이전트 판정 결과
 * @param {string} aiResult.reviewStatus - AUTO_VERIFIED / NEEDS_REVIEW / AUTO_REJECTED
 * @param {number} [aiResult.similarityScore] - 유사도 점수 (0.0~1.0)
 * @param {string[]} [aiResult.matchedKeywords] - 매칭된 핵심 키워드
 * @param {number} [aiResult.confidence] - 종합 신뢰도 점수 (0.0~1.0)
 * @param {string} [aiResult.rationale] - 판정 근거 요약
 * @returns {Promise<CourseCompleteResponse>} 업데이트된 코스 진행 현황 DTO
 */
export async function applyAiVerificationResult(verificationId, aiResult) {
  requireAuth();
  return backendApi.post(ROADMAP_ENDPOINTS.APPLY_AI_RESULT(verificationId), {
    reviewStatus: aiResult.review_status,
    similarityScore: aiResult.similarity_score,
    matchedKeywords: aiResult.matched_keywords || [],
    confidence: aiResult.confidence,
    rationale: aiResult.rationale,
  });
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
 * 코스 최종 감상평 제출 → 완주 처리.
 *
 * 마지막 영화 AUTO_VERIFIED 후 CourseCompleteResponse.requiresFinalReview=true 를 받으면
 * FinalReviewPage 에서 이 함수를 호출한다.
 * 응답 FinalReviewResponse.courseStatus === 'COMPLETED' 이면 코스가 완주 처리되고 리워드가 지급된다.
 *
 * @param {string|number} courseId
 * @param {string} reviewText - 감상평 본문
 * @returns {Promise<{courseStatus: string, rewardPoints: number, ...}>}
 */
export async function submitFinalReview(courseId, reviewText) {
  requireAuth();
  return backendApi.post(ROADMAP_ENDPOINTS.FINAL_REVIEW(courseId), { reviewText });
}

/**
 * 기 제출한 최종 감상평 조회.
 *
 * @param {string|number} courseId
 * @returns {Promise<{reviewText: string, createdAt: string}>}
 */
export async function getFinalReview(courseId) {
  requireAuth();
  return backendApi.get(ROADMAP_ENDPOINTS.FINAL_REVIEW(courseId));
}

