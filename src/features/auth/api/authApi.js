/**
 * 인증(Authentication) API 모듈.
 *
 * 회원가입, 로그인, 토큰 갱신 등 인증 관련 HTTP 요청을 처리한다.
 * axios 인스턴스를 사용하며, 응답은 interceptor에서 JSON으로 자동 파싱된다.
 *
 * [이슈5] OAuth 흐름 정합성:
 *   - Spring Security OAuth2 Client 방식이 메인 흐름이다.
 *   - 흐름: /oauth2/authorization/{provider} → Spring 처리 → HttpOnly 쿠키 설정
 *           → 클라이언트 /cookie 페이지 → POST /jwt/exchange (withCredentials: true)
 *           → JSON 기반 accessToken 응답
 *   - exchangeToken()이 현재 유효한 메인 OAuth 처리 함수이다.
 *   - oauthLogin()은 구 방식(인가 코드 직접 전달)이며 fallback 용도로 유지한다.
 *
 * [이슈6] Refresh Token 관련:
 *   - refreshToken() 함수는 axiosInstance 인터셉터가 자동 처리하므로 직접 호출 불필요.
 *   - withCredentials: true로 HttpOnly 쿠키의 Refresh Token이 자동 전송된다.
 */

/* 공용 axios 인스턴스 — JWT 자동 주입 + 401 갱신 (Backend) */
import api from '../../../shared/api/axiosInstance';
/* API 상수 */
import { AUTH_ENDPOINTS } from '../../../shared/constants/api';
/* 서비스 URL — Backend 직접 호출용 */
import { SERVICE_URLS } from '../../../shared/api/serviceUrls';
/* axios 원본 — 인터셉터 루프 우회 요청에 사용 */
import axios from 'axios';

/**
 * 회원가입 API 호출.
 *
 * @param {Object} params - 회원가입 정보
 * @param {string} params.email - 이메일 주소
 * @param {string} params.password - 비밀번호
 * @param {string} params.nickname - 닉네임
 * @param {boolean} params.requiredTerm - 필수 약관 동의 (필수)
 * @param {boolean} [params.optionTerm] - 선택 약관 동의
 * @param {boolean} [params.marketingAgreed] - 마케팅 수신 동의
 * @returns {Promise<Object>} 회원가입 응답 (accessToken, user)
 */
export async function signup({ email, password, nickname, requiredTerm, optionTerm, marketingAgreed }) {
  return api.post(AUTH_ENDPOINTS.SIGNUP, { email, password, nickname, requiredTerm, optionTerm, marketingAgreed });
}

/**
 * 로그인 API 호출.
 *
 * @param {Object} params - 로그인 정보
 * @param {string} params.email - 이메일 주소
 * @param {string} params.password - 비밀번호
 * @returns {Promise<Object>} 로그인 응답 (accessToken, user)
 */
export async function login({ email, password }) {
  return api.post(AUTH_ENDPOINTS.LOGIN, { email, password });
}

/**
 * 토큰 갱신 API를 직접 호출한다.
 *
 * [이슈6] 일반적인 경우 이 함수를 직접 호출할 필요가 없다.
 * axiosInstance의 request/response 인터셉터가 토큰 만료를 감지하여
 * withCredentials: true로 /jwt/refresh를 자동 호출하기 때문이다.
 *
 * 이 함수는 인터셉터 외부에서 명시적으로 refresh가 필요한 경우(예: 초기화 로직)에만 사용한다.
 *
 * @returns {Promise<Object>} 갱신 응답 (accessToken)
 * @throws {Error} 갱신 실패 시 (쿠키 없음 또는 만료)
 */
export async function refreshToken() {
  // withCredentials: true — HttpOnly 쿠키의 Refresh Token 자동 전송
  // axiosInstance의 인터셉터 루프를 피하기 위해 axios 원본 사용
  const response = await axios.post(
    `${SERVICE_URLS.BACKEND}${AUTH_ENDPOINTS.REFRESH}`,
    null, // body 없음 — Refresh Token은 쿠키로 전송
    {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    },
  );
  return response.data;
}

/**
 * 로그아웃 API 호출 (서버 세션 무효화).
 * 서버에서 Refresh Token 쿠키를 삭제하고 토큰을 무효화한다.
 *
 * withCredentials: true로 HttpOnly 쿠키를 함께 전송하여
 * 서버가 쿠키를 삭제할 수 있도록 한다.
 *
 * @returns {Promise<Object>} 로그아웃 응답
 */
export async function logoutAPI() {
  // withCredentials: true — 서버가 HttpOnly 쿠키(Refresh Token)를 삭제할 수 있도록 전송
  return api.post(AUTH_ENDPOINTS.LOGOUT, null, {
    withCredentials: true,
  });
}

/**
 * 비밀번호 찾기 — 이메일 존재 확인.
 * LOCAL 계정으로 가입된 이메일인지 확인한다.
 *
 * @param {string} email - 확인할 이메일
 * @returns {Promise<void>} 존재하면 200, 없으면 404 예외
 */
export async function checkEmailExists(email) {
  return api.post(AUTH_ENDPOINTS.PASSWORD_CHECK, { email });
}

/**
 * 비밀번호 재설정.
 * LOCAL 계정의 비밀번호를 새 비밀번호로 변경한다.
 *
 * @param {string} email - 이메일
 * @param {string} newPassword - 새 비밀번호
 * @returns {Promise<void>}
 */
export async function resetPassword(email, newPassword) {
  return api.post(AUTH_ENDPOINTS.PASSWORD_RESET, { email, newPassword });
}

/**
 * OAuth 소셜 로그인 API 호출 (구 방식 — 인가 코드 직접 전달).
 * OAuth 제공자로부터 받은 인가 코드를 백엔드에 전달하여 토큰을 발급받는다.
 *
 * @deprecated Spring Security OAuth2 Client 방식으로 전환되었다.
 *   현재 메인 흐름은 exchangeToken()을 사용하는 OAuthCookiePage(/cookie)이다.
 *   이 함수는 OAuthCallbackPage의 fallback 용도로만 유지한다.
 *
 * @param {Object} params - OAuth 로그인 정보
 * @param {string} params.provider - 제공자 이름 (google, kakao, naver)
 * @param {string} params.code - OAuth 인가 코드
 * @param {string} params.redirectUri - 콜백 리다이렉트 URI
 * @returns {Promise<Object>} 로그인 응답 (accessToken, user)
 */
export async function oauthLogin({ provider, code, redirectUri }) {
  return api.post(AUTH_ENDPOINTS.OAUTH(provider), { code, redirectUri });
}

/**
 * OAuth2 쿠키→헤더 토큰 교환 API 호출.
 *
 * [이슈5] 현재 메인 OAuth 흐름에서 사용하는 함수이다.
 *
 * Spring Security OAuth2 Client 방식의 소셜 로그인 흐름:
 * 1. 사용자가 /oauth2/authorization/{provider}로 이동
 * 2. Spring Security가 OAuth2 제공자와 인증 처리
 * 3. SocialSuccessHandler가 HttpOnly 쿠키에 Refresh Token 저장 후 /cookie로 리다이렉트
 * 4. OAuthCookiePage가 이 함수를 호출하여 쿠키를 JSON 기반 JWT로 교환
 * 5. 응답의 accessToken을 localStorage에 저장하고 홈으로 이동
 *
 * withCredentials: true로 HttpOnly 쿠키를 자동 전송한다.
 *
 * @returns {Promise<Object>} JWT 교환 응답
 * @returns {string} .accessToken - 새 JWT 액세스 토큰
 * @returns {Object} [.user] - 사용자 정보 (userNickname 필드 포함 가능)
 * @throws {Error} 쿠키가 없거나 만료된 경우 / 서버 오류
 */
export async function exchangeToken() {
  try {
    // 쿠키 전송이 필요하므로 withCredentials 옵션 사용
    // axiosInstance 인터셉터 루프를 피하기 위해 axios 원본 사용
    const response = await axios.post(
      `${SERVICE_URLS.BACKEND}/jwt/exchange`,
      null, // body 없음 — Refresh Token은 HttpOnly 쿠키로 전송
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      },
    );
    return response.data;
  } catch (err) {
    // [이슈5] 에러 핸들링 강화 — 서버 응답 메시지를 우선 사용하고 없으면 한국어 fallback
    const serverMessage =
      err.response?.data?.message ||
      err.response?.data?.detail ||
      null;

    // 상태코드별 사용자 친화적 메시지 제공
    const status = err.response?.status;
    let fallbackMessage = '소셜 로그인 토큰 교환에 실패했습니다.';
    if (status === 401 || status === 403) {
      fallbackMessage = '소셜 로그인 세션이 만료되었습니다. 다시 로그인해주세요.';
    } else if (status === 500) {
      fallbackMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    } else if (!err.response) {
      // 네트워크 오류 (서버 응답 없음)
      fallbackMessage = '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.';
    }

    // 서버 메시지가 있으면 우선 사용, 없으면 상태코드 기반 fallback
    const message = serverMessage || fallbackMessage;
    const exchangeError = new Error(message);
    exchangeError.code = err.response?.data?.code || null;
    exchangeError.status = status || null;
    throw exchangeError;
  }
}
