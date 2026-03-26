/**
 * axios 인스턴스 및 인터셉터 설정 모듈.
 *
 * 전역 axios 인스턴스를 생성하고, JWT 토큰 자동 주입(request interceptor)과
 * 401 응답 시 토큰 자동 갱신 + 재시도(response interceptor)를 처리한다.
 *
 * 사용법:
 *   import api from '../../../shared/api/axiosInstance';
 *   const data = await api.get('/api/v1/point/balance');
 *   const data = await api.post('/api/v1/auth/login', { email, password });
 *
 * 인증 필수 요청:
 *   import api, { requireAuth } from '../../../shared/api/axiosInstance';
 *   requireAuth();  // 토큰 없으면 즉시 에러
 *   const data = await api.get('/api/v1/users/me/profile');
 *
 * @module shared/api/axiosInstance
 */

import axios from 'axios';
import { getToken, setToken, getRefreshToken, setRefreshToken, clearAll } from '../utils/storage';
import { AUTH_ENDPOINTS } from '../constants/api';

/**
 * HTTP 상태코드별 사용자 친화적 기본 에러 메시지.
 * 백엔드 ErrorResponse.message가 없을 때 fallback으로 사용한다.
 * raw 상태코드(400, 500 등)가 사용자에게 노출되지 않도록 한국어 메시지를 반환한다.
 *
 * @param {number|undefined} status - HTTP 상태코드
 * @returns {string} 사용자 친화적 에러 메시지
 */
function getFallbackMessage(status) {
  switch (status) {
    case 400: return '입력 정보를 확인해주세요.';
    case 401: return '인증이 필요합니다. 다시 로그인해주세요.';
    case 403: return '접근 권한이 없습니다.';
    case 404: return '요청하신 정보를 찾을 수 없습니다.';
    case 409: return '이미 처리된 요청입니다.';
    case 429: return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
    case 500: return '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
    case 502: case 503: case 504:
      return '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.';
    default:
      return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
}

/* ── 기본 URL: .env의 VITE_API_BASE_URL (개발 시 빈 문자열 → Vite 프록시 사용) ── */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * 공용 axios 인스턴스.
 * 모든 API 요청은 이 인스턴스를 통해 수행한다.
 * response interceptor가 response.data를 자동 추출하므로,
 * api.get('/foo') 호출 시 바로 JSON 데이터가 반환된다.
 */
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ── 토큰 갱신 동시 호출 방지용 상태 ── */
/** 현재 진행 중인 갱신 Promise (null이면 갱신 진행 중 아님) */
let refreshPromise = null;

/**
 * 리프레시 토큰으로 새 액세스 토큰을 발급받는다.
 * 동시에 여러 요청이 401을 받아도 갱신 요청은 1회만 실행된다.
 *
 * @returns {Promise<string>} 새 액세스 토큰
 * @throws {Error} 갱신 실패 시
 */
async function refreshAccessToken() {
  /* 이미 갱신 진행 중이면 같은 Promise를 공유 (중복 갱신 방지) */
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const currentRefreshToken = getRefreshToken();
    if (!currentRefreshToken) {
      throw new Error('리프레시 토큰이 없습니다.');
    }

    /* 갱신 요청은 인터셉터를 타지 않도록 axios 원본 사용 */
    const response = await axios.post(
      `${BASE_URL}${AUTH_ENDPOINTS.REFRESH}`,
      { refreshToken: currentRefreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    );

    const { accessToken, refreshToken: newRefreshToken } = response.data;

    /* 새 토큰을 localStorage에 저장 */
    if (accessToken) setToken(accessToken);
    if (newRefreshToken) setRefreshToken(newRefreshToken);

    return accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    /* 갱신 완료 후 Promise 캐시 제거 (다음 갱신 허용) */
    refreshPromise = null;
  }
}

/* ══════════════════════════════════════════════════════════
 * REQUEST INTERCEPTOR — JWT 토큰 자동 주입
 * ══════════════════════════════════════════════════════════ */
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/* ══════════════════════════════════════════════════════════
 * RESPONSE INTERCEPTOR
 * 1) 성공 응답 → response.data 자동 추출 (기존 fetchWithAuth 호환)
 * 2) 401 에러 → 토큰 갱신 + 원래 요청 재시도
 * ══════════════════════════════════════════════════════════ */
api.interceptors.response.use(
  /* 성공 응답 — response.data만 반환 (JSON 데이터 직접 접근) */
  (response) => response.data,

  /* 에러 응답 — 401일 때만 갱신 시도 */
  async (error) => {
    const originalRequest = error.config;

    /*
     * 조건:
     * 1) 401 Unauthorized
     * 2) 아직 재시도하지 않은 요청 (_retry 플래그)
     * 3) 토큰 갱신 요청 자체가 아닌 경우 (무한 루프 방지)
     * 4) 인증 관련 요청(/auth/)이 아닌 경우
     *    - 로그인 401(미가입/비밀번호 불일치)은 갱신 대상이 아님
     *    - 회원가입, OAuth 등도 갱신 없이 에러를 컴포넌트로 전달
     */
    const isAuthRequest = originalRequest.url?.includes('/auth/');
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes(AUTH_ENDPOINTS.REFRESH) &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        /* 새 토큰으로 원래 요청 재시도 */
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        /* 갱신 실패 → 인증 정보 삭제 + 로그인 페이지로 리다이렉트 */
        clearAll();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    /*
     * 에러 응답에서 서버 메시지를 추출하여 Error 객체에 담는다.
     * 기존 fetchWithAuth의 에러 처리 패턴과 호환된다.
     *
     * 우선순위:
     * 1) 백엔드 ErrorResponse.message (한국어 사용자 친화적 메시지)
     * 2) 백엔드 detail 필드 (대체 상세 정보)
     * 3) HTTP 상태코드별 한국어 기본 메시지 (raw 코드 노출 방지)
     */
    const data = error.response?.data;
    const status = error.response?.status;
    const message = data?.message || data?.detail || getFallbackMessage(status);
    const apiError = new Error(message);
    apiError.code = data?.code || null;
    apiError.status = status || null;
    return Promise.reject(apiError);
  },
);

/**
 * 인증 필수 가드.
 * 토큰이 없으면 즉시 에러를 던진다.
 * 포인트, 결제, 마이페이지 등 반드시 인증이 필요한 API 호출 전에 사용한다.
 *
 * @throws {Error} 인증 토큰이 없을 때
 *
 * @example
 * requireAuth();
 * const profile = await api.get(MYPAGE_ENDPOINTS.PROFILE);
 */
export function requireAuth() {
  const token = getToken();
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }
}

export default api;
