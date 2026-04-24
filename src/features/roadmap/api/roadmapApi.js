/**
 * 로드맵 API 모듈.
 *
 * Backend의 RoadmapController와 통신하여
 * 영화 학습 코스/로드맵 조회 및 진행을 수행한다.
 *
 * @module features/roadmap/api/roadmapApi
 */

import { backendApi, requireAuth } from '../../../shared/api/axiosInstance';
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
 * 코스 내 영화 시청 완료 마킹 + AI 리뷰 검증 (단일 호출).
 *
 * 2026-04-22 리팩토링: 기존 3-step(Client → Backend → Agent → Backend) 플로우는
 * AI 우회 취약점(사용자가 AUTO_VERIFIED 결과를 위조해서 전달) 으로 제거되었다.
 * 이제 Backend 가 트랜잭션 내부에서 Agent 를 직접 호출하고 최종 판정을 반환한다.
 *
 * @param {string|number} courseId
 * @param {string} movieId
 * @param {string} [review] - 도장깨기 인증 한마디 (선택)
 * @returns {Promise<CourseCompleteResponse>} 진행률 + AI 판정(reviewStatus/rationale/similarityScore/agentAvailable)
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

