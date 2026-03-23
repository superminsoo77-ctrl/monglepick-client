/**
 * 마이페이지(MyPage) API 모듈.
 *
 * 사용자 프로필, 시청 이력, 위시리스트, 선호 설정 등
 * 마이페이지 관련 HTTP 요청을 처리한다.
 * 모든 요청에 인증 토큰이 필요하다.
 */

/* API 상수 — shared/constants에서 가져옴 */
import { MYPAGE_ENDPOINTS, API_BASE_URL } from '../../../shared/constants/api';
/* localStorage 유틸 — shared/utils에서 가져옴 */
import { getToken } from '../../../shared/utils/storage';

/**
 * 인증이 필요한 API 요청을 위한 공통 fetch 래퍼.
 * Authorization 헤더를 자동으로 포함한다.
 *
 * @param {string} url - 요청 URL
 * @param {Object} [options={}] - fetch 옵션
 * @returns {Promise<Object>} 파싱된 JSON 응답
 * @throws {Error} 인증 토큰이 없거나 HTTP 에러 시
 */
async function fetchAuthenticated(url, options = {}) {
  const token = getToken();

  // 인증 토큰 검증 — 마이페이지 API는 인증 필수
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // 401 Unauthorized — 토큰 만료 등
    if (response.status === 401) {
      throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
    }
    const errorMessage = data?.message || data?.detail || `요청 실패 (${response.status})`;
    throw new Error(errorMessage);
  }

  return data;
}

// ── 프로필 ──

/**
 * 사용자 프로필 정보를 조회한다.
 *
 * @returns {Promise<Object>} 프로필 정보
 *   - id, email, nickname, profileImage, createdAt, favoriteGenres 등
 *
 * @example
 * const profile = await getProfile();
 * console.log(profile.nickname); // '몽글이'
 */
export async function getProfile() {
  return fetchAuthenticated(MYPAGE_ENDPOINTS.PROFILE);
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
  return fetchAuthenticated(MYPAGE_ENDPOINTS.UPDATE_PROFILE, {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
}

// ── 시청 이력 ──

/**
 * 사용자의 시청 이력을 조회한다.
 *
 * @param {Object} [params={}] - 조회 파라미터
 * @param {number} [params.page=1] - 페이지 번호
 * @param {number} [params.size=20] - 페이지 크기
 * @returns {Promise<Object>} 시청 이력 ({ watchHistory: [], total: number })
 *
 * @example
 * const result = await getWatchHistory({ page: 1 });
 * result.watchHistory.forEach(item => {
 *   console.log(item.movie.title, item.watchedAt, item.rating);
 * });
 */
export async function getWatchHistory({ page = 1, size = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return fetchAuthenticated(`${MYPAGE_ENDPOINTS.WATCH_HISTORY}?${params.toString()}`);
}

// ── 위시리스트 ──

/**
 * 사용자의 위시리스트를 조회한다.
 *
 * @param {Object} [params={}] - 조회 파라미터
 * @param {number} [params.page=1] - 페이지 번호
 * @param {number} [params.size=20] - 페이지 크기
 * @returns {Promise<Object>} 위시리스트 ({ wishlist: [], total: number })
 */
export async function getWishlist({ page = 1, size = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return fetchAuthenticated(`${MYPAGE_ENDPOINTS.WISHLIST}?${params.toString()}`);
}

/**
 * 위시리스트에 영화를 추가하거나 제거한다 (토글).
 * 이미 위시리스트에 있으면 제거, 없으면 추가한다.
 *
 * @param {number|string} movieId - 영화 ID
 * @returns {Promise<Object>} 토글 결과 ({ added: boolean, movieId })
 *
 * @example
 * const result = await toggleWishlist(550);
 * if (result.added) {
 *   console.log('위시리스트에 추가됨');
 * } else {
 *   console.log('위시리스트에서 제거됨');
 * }
 */
export async function toggleWishlist(movieId) {
  return fetchAuthenticated(MYPAGE_ENDPOINTS.TOGGLE_WISHLIST(movieId), {
    method: 'POST',
  });
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
  return fetchAuthenticated(MYPAGE_ENDPOINTS.PREFERENCES, {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
}
