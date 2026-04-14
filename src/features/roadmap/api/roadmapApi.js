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
