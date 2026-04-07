/**
 * 마이페이지(MyPage) API 모듈.
 *
 * 사용자 프로필, 시청 이력, 위시리스트, 선호 설정 등
 * 마이페이지 관련 HTTP 요청을 처리한다.
 * 모든 요청에 인증 토큰이 필요하다.
 *
 * axios interceptor가 JWT 자동 주입 + 401 시 자동 토큰 갱신을 처리한다.
 */

/* 공용 axios 인스턴스 + 인증 필수 가드 */
import api, { requireAuth } from '../../../shared/api/axiosInstance';
/* API 상수 — shared/constants에서 가져옴 */
import { MYPAGE_ENDPOINTS } from '../../../shared/constants/api';

// ── 프로필 ──

/**
 * 사용자 프로필 정보를 조회한다.
 *
 * @returns {Promise<Object>} 프로필 정보
 *   - id, email, nickname, profileImage, createdAt, favoriteGenres 등
 */
export async function getProfile() {
  requireAuth();
  return api.get(MYPAGE_ENDPOINTS.PROFILE);
}

/**
 * 사용자 프로필 정보를 수정한다.
 *
 * @param {Object} profileData - 수정할 프로필 데이터
 * @param {string} [profileData.nickname] - 닉네임
 * @param {string} [profileData.profileImage] - 프로필 이미지 URL
 * @returns {Promise<Object>} 수정된 프로필 정보
 */
export async function updateProfile(profileData) {
  requireAuth();
  return api.patch(MYPAGE_ENDPOINTS.UPDATE_PROFILE, profileData);
}

// ── 위시리스트 ──

/**
 * 사용자의 위시리스트를 조회한다.
 *
 * @param {Object} [options={}] - 조회 파라미터
 * @param {number} [options.page=1] - 페이지 번호
 * @param {number} [options.size=20] - 페이지 크기
 * @returns {Promise<Object>} 위시리스트 ({ wishlist: [], total: number })
 */
export async function getWishlist({ page = 1, size = 20 } = {}) {
  requireAuth();
  return api.get(MYPAGE_ENDPOINTS.WISHLIST, { params: { page, size } });
}

/**
 * 위시리스트에 영화를 추가한다.
 * Backend: POST /api/v1/users/me/wishlist/{movieId} → 201 Created
 *
 * @param {string} movieId - 영화 ID
 * @returns {Promise<void>}
 */
export async function addToWishlist(movieId) {
  requireAuth();
  return api.post(MYPAGE_ENDPOINTS.TOGGLE_WISHLIST(movieId));
}

/**
 * 위시리스트에서 영화를 제거한다.
 * Backend: DELETE /api/v1/users/me/wishlist/{movieId} → 204 No Content
 *
 * @param {string} movieId - 영화 ID
 * @returns {Promise<void>}
 */
export async function removeFromWishlist(movieId) {
  requireAuth();
  return api.delete(MYPAGE_ENDPOINTS.TOGGLE_WISHLIST(movieId));
}

// ── 선호 설정 ──

/**
 * 사용자의 선호 장르/분위기 설정을 업데이트한다.
 *
 * @param {Object} preferences - 선호 설정 데이터
 * @param {string[]} [preferences.favoriteGenres] - 선호 장르 목록
 * @param {string[]} [preferences.favoriteMoods] - 선호 분위기 목록
 * @param {string[]} [preferences.favoriteDirectors] - 선호 감독 목록
 * @returns {Promise<Object>} 업데이트된 선호 설정
 */
export async function updatePreferences(preferences) {
  requireAuth();
  return api.put(MYPAGE_ENDPOINTS.PREFERENCES, preferences);
}
