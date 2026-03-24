/**
 * 인증이 필요한 API 요청을 위한 공통 fetch 래퍼.
 *
 * 저장된 JWT 토큰이 있으면 Authorization 헤더를 자동 추가한다.
 * 여러 feature API 모듈(pointApi, paymentApi, movieApi, communityApi, userApi)에서
 * 공통으로 사용하여 코드 중복을 방지한다.
 *
 * @module shared/utils/fetchWithAuth
 */

/* API 상수 — shared/constants에서 가져옴 */
import { API_BASE_URL } from '../constants/api';
/* localStorage 유틸 — shared/utils에서 가져옴 */
import { getToken } from './storage';

/**
 * 인증이 필요한 API 요청을 위한 공통 fetch 래퍼.
 * 저장된 JWT 토큰이 있으면 Authorization 헤더를 자동 추가한다.
 *
 * @param {string} url - 요청 URL (API_BASE_URL 이후 경로)
 * @param {Object} [options={}] - fetch 옵션
 * @returns {Promise<Object>} 파싱된 JSON 응답
 * @throws {Error} HTTP 에러 시 에러 메시지 포함
 *
 * @example
 * // 토큰이 있으면 자동으로 Authorization 헤더가 추가된다
 * const data = await fetchWithAuth('/api/v1/point/balance?userId=user123');
 *
 * @example
 * // POST 요청 시 body와 함께 전달
 * const result = await fetchWithAuth('/api/v1/point/attendance', {
 *   method: 'POST',
 * });
 */
export async function fetchWithAuth(url, options = {}) {
  const token = getToken();

  // 헤더 구성: 토큰이 있으면 Authorization 헤더 자동 추가
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

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
    const error = new Error(errorMessage);
    error.code = data?.code || null;
    error.status = response.status;
    throw error;
  }

  return data;
}

/**
 * 인증 필수 API 요청을 위한 fetch 래퍼.
 * fetchWithAuth와 동일하지만, 토큰이 없으면 즉시 에러를 던진다.
 * 포인트, 결제, 마이페이지 등 반드시 인증이 필요한 API에 사용한다.
 *
 * @param {string} url - 요청 URL (API_BASE_URL 이후 경로)
 * @param {Object} [options={}] - fetch 옵션
 * @returns {Promise<Object>} 파싱된 JSON 응답
 * @throws {Error} 인증 토큰이 없거나 HTTP 에러 시
 *
 * @example
 * const balance = await fetchWithAuthRequired('/api/v1/point/balance?userId=user123');
 */
export async function fetchWithAuthRequired(url, options = {}) {
  const token = getToken();

  // 인증 필수 — 토큰이 없으면 즉시 에러
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  return fetchWithAuth(url, options);
}
