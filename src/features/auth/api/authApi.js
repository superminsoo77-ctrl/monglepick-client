/**
 * 인증(Authentication) API 모듈.
 *
 * 회원가입, 로그인, 토큰 갱신 등 인증 관련 HTTP 요청을 처리한다.
 * fetch API를 사용하며, 응답은 JSON으로 파싱하여 반환한다.
 */

/* API 상수 — shared/constants에서 가져옴 */
import { AUTH_ENDPOINTS, API_BASE_URL } from '../../../shared/constants/api';
/* localStorage 유틸 — shared/utils에서 가져옴 */
import { getRefreshToken } from '../../../shared/utils/storage';

/**
 * 공통 fetch 래퍼.
 * 요청 헤더 설정, 에러 처리를 통합한다.
 *
 * @param {string} url - 요청 URL
 * @param {Object} options - fetch 옵션
 * @returns {Promise<Object>} 파싱된 JSON 응답
 * @throws {Error} HTTP 에러 시 에러 메시지 포함
 */
async function fetchJSON(url, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  // 응답 본문을 JSON으로 파싱
  const data = await response.json().catch(() => null);

  // HTTP 에러 응답 처리
  if (!response.ok) {
    const errorMessage = data?.message || data?.detail || `요청 실패 (${response.status})`;
    throw new Error(errorMessage);
  }

  return data;
}

/**
 * 회원가입 API 호출.
 *
 * @param {Object} params - 회원가입 정보
 * @param {string} params.email - 이메일 주소
 * @param {string} params.password - 비밀번호
 * @param {string} params.nickname - 닉네임
 * @returns {Promise<Object>} 회원가입 응답 (accessToken, refreshToken, user)
 *
 * @example
 * const result = await signup({
 *   email: 'user@example.com',
 *   password: 'password123',
 *   nickname: '몽글이',
 * });
 */
export async function signup({ email, password, nickname }) {
  return fetchJSON(AUTH_ENDPOINTS.SIGNUP, {
    method: 'POST',
    body: JSON.stringify({ email, password, nickname }),
  });
}

/**
 * 로그인 API 호출.
 *
 * @param {Object} params - 로그인 정보
 * @param {string} params.email - 이메일 주소
 * @param {string} params.password - 비밀번호
 * @returns {Promise<Object>} 로그인 응답 (accessToken, refreshToken, user)
 *
 * @example
 * const result = await login({
 *   email: 'user@example.com',
 *   password: 'password123',
 * });
 * // result = { accessToken: 'xxx', refreshToken: 'yyy', user: { id, email, nickname } }
 */
export async function login({ email, password }) {
  return fetchJSON(AUTH_ENDPOINTS.LOGIN, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * 토큰 갱신 API 호출.
 * localStorage에 저장된 리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급받는다.
 *
 * @returns {Promise<Object>} 갱신 응답 (accessToken, refreshToken?)
 * @throws {Error} 리프레시 토큰이 없거나 만료된 경우
 */
export async function refreshToken() {
  const currentRefreshToken = getRefreshToken();

  if (!currentRefreshToken) {
    throw new Error('리프레시 토큰이 없습니다. 다시 로그인해주세요.');
  }

  return fetchJSON(AUTH_ENDPOINTS.REFRESH, {
    method: 'POST',
    body: JSON.stringify({ refreshToken: currentRefreshToken }),
  });
}

/**
 * 로그아웃 API 호출 (서버 세션 무효화).
 * 서버에서 리프레시 토큰을 무효화한다.
 *
 * @param {string} token - 현재 액세스 토큰
 * @returns {Promise<Object>} 로그아웃 응답
 */
export async function logoutAPI(token) {
  return fetchJSON(AUTH_ENDPOINTS.LOGOUT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * OAuth 소셜 로그인 API 호출.
 * OAuth 제공자로부터 받은 인가 코드를 백엔드에 전달하여 토큰을 발급받는다.
 *
 * @param {Object} params - OAuth 로그인 정보
 * @param {string} params.provider - 제공자 이름 (google, kakao, naver)
 * @param {string} params.code - OAuth 인가 코드
 * @param {string} params.redirectUri - 콜백 리다이렉트 URI
 * @returns {Promise<Object>} 로그인 응답 (accessToken, refreshToken, user)
 */
export async function oauthLogin({ provider, code, redirectUri }) {
  return fetchJSON(`${AUTH_ENDPOINTS.OAUTH(provider)}`, {
    method: 'POST',
    body: JSON.stringify({ code, redirectUri }),
  });
}
