/**
 * 서비스별 axios 인스턴스 모듈.
 *
 * 3개 서비스(Backend, Agent, Recommend)에 대해 각각 독립된 axios 인스턴스를 생성한다.
 * - backendApi : Spring Boot Backend (인증, 포인트, 결제, 영화, 커뮤니티 등)
 * - agentApi   : FastAPI AI Agent (채팅 SSE, Movie Match SSE)
 * - recommendApi : FastAPI Recommend (검색, 온보딩)
 *
 * JWT 토큰 자동 갱신(refresh) 로직은 3개 인스턴스 모두에 공통 적용된다.
 *   - 요청 시: 토큰이 만료 임박이면 미리 /jwt/refresh 호출 (Backend 직접 호출)
 *   - 401 응답 시: refresh 후 원 요청 1회 재시도
 * `isRefreshing` 뮤텍스를 세 인스턴스가 공유하므로 refresh race 를 방지한다.
 *
 * 2026-04-14: recommendApi/agentApi 가 SimpleTokenInjector 만 쓰던 기존 구조에서는
 *            Access Token 만료 후 리뷰/채팅 요청이 바로 401 로 떨어지는 문제가 있었다.
 *            → backendApi 와 동일한 전체 인증 인터셉터로 통일.
 *
 * 적용된 보안 개선 사항:
 * - [C-C2] 토큰 주입 전 JWT 3-파트 형식 검증 (유효하지 않은 토큰 자동 제거)
 * - [W-C3] 토큰 주입 전 만료 여부 검사 (만료 시 자동 refresh 시도)
 * - [이슈4] 뮤텍스 패턴으로 401 동시 다발 refresh race condition 방지
 *
 * 사용법:
 *   // Backend API (default export — 기존 코드 호환)
 *   import api from '../../../shared/api/axiosInstance';
 *   const data = await api.get('/api/v1/point/balance');
 *
 *   // 서비스별 명시적 import
 *   import { backendApi, agentApi, recommendApi } from '../../../shared/api/axiosInstance';
 *   const movies = await recommendApi.get('/api/v1/search/movies', { params });
 *
 * @module shared/api/axiosInstance
 */

import axios from 'axios';
import { getToken, setToken, removeToken, clearAll } from '../utils/storage';
import { AUTH_ENDPOINTS } from '../constants/api';
import { SERVICE_URLS } from './serviceUrls';
/* Zustand 인증 스토어 — refresh 실패 시 인메모리 상태도 함께 초기화 */
import useAuthStore from '../stores/useAuthStore';

/* ══════════════════════════════════════════════════════════
 * 공통 유틸리티
 * ══════════════════════════════════════════════════════════ */

/**
 * HTTP 상태코드별 사용자 친화적 기본 에러 메시지.
 * 백엔드 ErrorResponse.message가 없을 때 fallback으로 사용한다.
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

/**
 * [C-C2] JWT 토큰의 기본 형식(헤더.페이로드.서명 3파트)이 유효한지 검사한다.
 *
 * @param {*} token - 검사할 토큰 값
 * @returns {boolean} 유효한 JWT 형식이면 true
 */
function isValidJwtFormat(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  return parts.every((part) => part.length > 0);
}

/**
 * [W-C3] JWT 토큰의 만료 여부를 검사한다.
 * 5초의 여유(skew)를 두어 네트워크 지연 중 만료를 미리 처리한다.
 *
 * @param {string} token - JWT 토큰 문자열
 * @returns {boolean} 만료되었으면 true
 */
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const SKEW_MS = 5000;
    return payload.exp * 1000 < Date.now() + SKEW_MS;
  } catch {
    return true;
  }
}

/* ══════════════════════════════════════════════════════════
 * [이슈4] 뮤텍스 패턴 — 401 동시 다발 refresh race condition 방지
 * ══════════════════════════════════════════════════════════ */

/** 현재 refresh 진행 중 여부 (뮤텍스 플래그) */
let isRefreshing = false;

/**
 * refresh 완료를 기다리는 요청 큐.
 * @type {Array<{resolve: Function, reject: Function}>}
 */
let failedQueue = [];

/**
 * 대기 중인 요청 큐를 처리한다.
 *
 * @param {Error|null} error - refresh 실패 에러 (성공 시 null)
 * @param {string|null} token - 새 액세스 토큰 (실패 시 null)
 */
function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

/**
 * refresh 요청을 큐에 추가하고 새 토큰 또는 에러를 기다린다.
 *
 * @returns {Promise<string>} 새 액세스 토큰
 */
function enqueueRefreshWaiter() {
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  });
}

/**
 * 리프레시 토큰으로 새 액세스 토큰을 발급받는다.
 * Backend 서비스에 직접 요청한다 (인터셉터 우회를 위해 raw axios 사용).
 *
 * @returns {Promise<string>} 새 액세스 토큰
 * @throws {Error} 갱신 실패 시
 */
async function refreshAccessToken() {
  const response = await axios.post(
    `${SERVICE_URLS.BACKEND}${AUTH_ENDPOINTS.REFRESH}`,
    null,
    {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true, // HttpOnly 쿠키 자동 전송
    },
  );

  const { accessToken } = response.data;
  if (accessToken) setToken(accessToken);
  return accessToken;
}

/* ══════════════════════════════════════════════════════════
 * 공통 인터셉터 팩토리
 * ══════════════════════════════════════════════════════════ */

/**
 * Bearer 토큰 주입 request interceptor (만료 검사 + 자동 refresh 포함).
 *
 * <p>JWT 형식 검증 → 만료 임박 시 refresh → Authorization 헤더 주입의 순서로 동작한다.
 * `backendApi` 의 request interceptor 와 동일 로직을 공용 헬퍼로 추출한 것이다.</p>
 *
 * <p>3개 인스턴스(Backend/Agent/Recommend)가 모듈 스코프 `isRefreshing` 뮤텍스와
 * `failedQueue` 를 공유하므로 동시 다발 refresh race condition 이 발생하지 않는다.</p>
 *
 * @param {import('axios').AxiosInstance} instance - axios 인스턴스
 */
function attachAuthRequestInterceptor(instance) {
  instance.interceptors.request.use(
    async (config) => {
      const token = getToken();

      if (!token) return config;

      // [C-C2] JWT 형식 검증
      if (!isValidJwtFormat(token)) {
        removeToken();
        return config;
      }

      // [W-C3] 토큰 만료 검사 — 만료 임박 시 미리 refresh 시도
      if (isTokenExpired(token)) {
        if (isRefreshing) {
          try {
            const newToken = await enqueueRefreshWaiter();
            config.headers.Authorization = `Bearer ${newToken}`;
          } catch {
            // refresh 실패 — Authorization 헤더 없이 요청 (서버가 401 반환 → 응답 인터셉터에서 처리)
          }
          return config;
        }

        isRefreshing = true;
        try {
          const newToken = await refreshAccessToken();
          processQueue(null, newToken);
          config.headers.Authorization = `Bearer ${newToken}`;
        } catch (err) {
          processQueue(err, null);
          clearAll();
          useAuthStore.setState({ token: null, user: null });
        } finally {
          isRefreshing = false;
        }
        return config;
      }

      // 유효한 토큰 주입
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error),
  );
}

/**
 * 401 응답 시 refresh 후 원 요청을 1회 재시도하는 response interceptor.
 *
 * <p>성공 응답은 `response.data` 만 추출해 반환하고, 에러 응답은 서버 메시지를
 * 파싱해 `Error` 객체로 포장한다. 401 재시도 로직은 `backendApi` 와 동일 패턴이며,
 * 모듈 스코프 뮤텍스를 공유한다.</p>
 *
 * @param {import('axios').AxiosInstance} instance - axios 인스턴스
 */
function attachAuthResponseInterceptor(instance) {
  instance.interceptors.response.use(
    /* 성공 응답 — response.data만 반환 */
    (response) => response.data,

    async (error) => {
      const originalRequest = error.config || {};
      const status = error.response?.status;

      // refresh 요청 자체가 401 이면 재시도하지 않음 (무한 루프 방지)
      const isRefreshRequest = originalRequest.url?.includes(AUTH_ENDPOINTS.REFRESH);

      if (
        status === 401 &&
        !originalRequest._retry &&
        !isRefreshRequest
      ) {
        originalRequest._retry = true;

        if (isRefreshing) {
          try {
            const newToken = await enqueueRefreshWaiter();
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);
          } catch (queueError) {
            return Promise.reject(queueError);
          }
        }

        isRefreshing = true;
        try {
          const newToken = await refreshAccessToken();
          processQueue(null, newToken);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          clearAll();
          useAuthStore.setState({ token: null, user: null });
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // 에러 메시지 추출
      const data = error.response?.data;
      const message = data?.message || data?.detail || getFallbackMessage(status);
      const apiError = new Error(message);
      apiError.code = data?.code || null;
      apiError.status = status || null;
      return Promise.reject(apiError);
    },
  );
}

/* ══════════════════════════════════════════════════════════
 * 서비스별 axios 인스턴스 생성
 * ══════════════════════════════════════════════════════════ */

/**
 * Backend API 인스턴스 (Spring Boot :8080).
 * - JWT 자동 갱신 interceptor 포함 (request: 형식검증+만료검사+refresh, response: 401 뮤텍스)
 * - withCredentials: true (HttpOnly Refresh Token 쿠키 전송)
 */
const backendApi = axios.create({
  baseURL: SERVICE_URLS.BACKEND,
  timeout: 30000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Agent API 인스턴스 (FastAPI :8000).
 * - Bearer 토큰 주입만 수행 (refresh 없음)
 * - SSE(fetch) 호출 시에는 이 인스턴스를 사용하지 않고 SERVICE_URLS.AGENT를 직접 참조
 */
const agentApi = axios.create({
  baseURL: SERVICE_URLS.AGENT,
  timeout: 60000, // AI 추론 응답 대기 시간 고려
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Recommend API 인스턴스 (FastAPI :8001).
 * - Bearer 토큰 주입만 수행 (refresh 없음)
 */
const recommendApi = axios.create({
  baseURL: SERVICE_URLS.RECOMMEND,
  timeout: 150000,
  headers: { 'Content-Type': 'application/json' },
});

/* ── Backend: 전체 JWT interceptor (형식검증 + 만료검사 + refresh + 401 뮤텍스) ── */
backendApi.interceptors.request.use(
  async (config) => {
    const token = getToken();

    if (!token) return config;

    // [C-C2] JWT 형식 검증
    if (!isValidJwtFormat(token)) {
      removeToken();
      return config;
    }

    // [W-C3] 토큰 만료 검사 — 만료 임박 시 미리 refresh 시도
    if (isTokenExpired(token)) {
      if (isRefreshing) {
        try {
          const newToken = await enqueueRefreshWaiter();
          config.headers.Authorization = `Bearer ${newToken}`;
        } catch {
          // refresh 실패 — Authorization 헤더 없이 요청
        }
        return config;
      }

      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        config.headers.Authorization = `Bearer ${newToken}`;
      } catch (err) {
        processQueue(err, null);
        /* 인증 정보 전체 초기화 (localStorage + Zustand 인메모리 상태) */
        clearAll();
        useAuthStore.setState({ token: null, user: null });
        /* 로그인 리다이렉트는 하지 않음 — 공개 페이지에서도 호출되므로
           인증 필수 페이지는 PrivateRoute가 자동으로 /login 리다이렉트 처리 */
      } finally {
        isRefreshing = false;
      }
      return config;
    }

    // 유효한 토큰 주입
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

/* ── Backend: 401 응답 시 뮤텍스 패턴 refresh + 재시도 ── */
backendApi.interceptors.response.use(
  (response) => response.data,

  async (error) => {
    const originalRequest = error.config;

    const isAuthRequest = originalRequest.url?.includes('/auth/');
    const isRefreshRequest = originalRequest.url?.includes(AUTH_ENDPOINTS.REFRESH);

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshRequest &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        try {
          const newToken = await enqueueRefreshWaiter();
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return backendApi(originalRequest);
        } catch (queueError) {
          return Promise.reject(queueError);
        }
      }

      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return backendApi(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        /* 인증 정보 전체 초기화 (localStorage + Zustand 인메모리 상태) */
        clearAll();
        useAuthStore.setState({ token: null, user: null });
        /* 로그인 리다이렉트는 하지 않음 — 에러를 호출측에 전파하여
           PrivateRoute 또는 개별 컴포넌트가 인증 필요 여부를 판단하도록 위임 */
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 에러 메시지 추출
    const data = error.response?.data;
    const status = error.response?.status;
    const message = data?.message || data?.detail || getFallbackMessage(status);
    const apiError = new Error(message);
    apiError.code = data?.code || null;
    apiError.status = status || null;
    return Promise.reject(apiError);
  },
);

/* ── Agent: 전체 JWT interceptor (형식검증 + 만료검사 + refresh + 401 재시도) ── */
attachAuthRequestInterceptor(agentApi);
attachAuthResponseInterceptor(agentApi);

/* ── Recommend: 전체 JWT interceptor (형식검증 + 만료검사 + refresh + 401 재시도) ──
   2026-04-14: 기존에는 SimpleTokenInjector 만 쓰고 있어서 Access Token 만료 후
              `POST /api/v2/movies/{id}/reviews` 같은 인증 필수 엔드포인트가
              즉시 401 로 실패했다. backendApi 와 동일 refresh 로직으로 통일. */
attachAuthRequestInterceptor(recommendApi);
attachAuthResponseInterceptor(recommendApi);

/* ══════════════════════════════════════════════════════════
 * 공용 유틸리티 export
 * ══════════════════════════════════════════════════════════ */

/**
 * 인증 필수 가드.
 * 토큰이 없으면 즉시 에러를 던진다.
 *
 * @throws {Error} 인증 토큰이 없을 때
 */
export function requireAuth() {
  const token = getToken();
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }
}

/* ── Named exports ── */
export { backendApi, agentApi, recommendApi };

/* ── Default export: backendApi (기존 코드 호환) ── */
export default backendApi;
