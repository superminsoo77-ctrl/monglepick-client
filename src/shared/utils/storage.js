/**
 * localStorage 래퍼 유틸리티 모듈.
 *
 * 인증 토큰, 세션 ID 등을 localStorage에 안전하게 저장/조회/삭제한다.
 * 시크릿 모드 등 localStorage 접근 불가 환경에서도 에러 없이 동작한다.
 *
 * [이슈6] Refresh Token 관련 설계 변경:
 * - Refresh Token은 서버가 HttpOnly 쿠키로 관리한다.
 * - 클라이언트(localStorage)에 Refresh Token을 저장하지 않는다.
 * - setRefreshToken / getRefreshToken / removeRefreshToken 함수는
 *   하위 호환성을 위해 시그니처를 유지하되, 실제 저장/조회를 수행하지 않는다.
 *   (no-op — no operation)
 * - Access Token은 새로고침 복원을 위해 localStorage에 계속 저장한다.
 *   단, 만료 시 axiosInstance의 인터셉터가 자동으로 제거한다.
 */

/** 인증 토큰(액세스 토큰) 저장 키 */
const TOKEN_KEY = 'monglepick_auth_token';

/** 사용자 정보 저장 키 */
const USER_KEY = 'monglepick_user';

// [REMOVED] 채팅 세션 ID 키는 삭제되었다.
// 채팅 세션 ID 의 단일 진실 원본(SSOT)은 URL(`/chat/:sessionId`) 이며,
// localStorage 이중 관리를 제거하였다 (단일 진실 원본 원칙).

/**
 * localStorage에서 값을 안전하게 가져온다.
 * localStorage 접근 실패 시 null을 반환한다.
 *
 * @param {string} key - 저장 키
 * @returns {string|null} 저장된 값 또는 null
 */
function safeGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    // 시크릿 모드 등에서 localStorage 접근 불가 시 무시
    console.warn(`[storage] localStorage 접근 실패: ${key}`);
    return null;
  }
}

/**
 * localStorage에 값을 안전하게 저장한다.
 *
 * @param {string} key - 저장 키
 * @param {string} value - 저장할 값
 * @returns {boolean} 저장 성공 여부
 */
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    console.warn(`[storage] localStorage 저장 실패: ${key}`);
    return false;
  }
}

/**
 * localStorage에서 값을 안전하게 삭제한다.
 *
 * @param {string} key - 삭제할 키
 * @returns {boolean} 삭제 성공 여부
 */
function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    console.warn(`[storage] localStorage 삭제 실패: ${key}`);
    return false;
  }
}

// ── 인증 토큰(액세스 토큰) 관련 ──

/**
 * 저장된 인증 토큰(액세스 토큰)을 가져온다.
 *
 * @returns {string|null} JWT 액세스 토큰 또는 null
 */
export function getToken() {
  return safeGetItem(TOKEN_KEY);
}

/**
 * 인증 토큰(액세스 토큰)을 저장한다.
 * 새로고침 후 인증 상태를 복원하기 위해 localStorage에 저장한다.
 *
 * @param {string} token - JWT 액세스 토큰
 * @returns {boolean} 저장 성공 여부
 */
export function setToken(token) {
  return safeSetItem(TOKEN_KEY, token);
}

/**
 * 인증 토큰(액세스 토큰)을 삭제한다.
 * 만료 감지 시 axiosInstance 인터셉터가 자동으로 호출한다.
 *
 * @returns {boolean} 삭제 성공 여부
 */
export function removeToken() {
  return safeRemoveItem(TOKEN_KEY);
}

// ── 리프레시 토큰 관련 (no-op — 서버 HttpOnly 쿠키로 관리) ──
// [이슈6] Refresh Token은 서버가 HttpOnly 쿠키로 발급/갱신하므로
// 클라이언트에서 localStorage에 저장하지 않는다.
// 하위 호환성을 위해 함수 시그니처는 유지하되 실제 동작을 수행하지 않는다.
// axiosInstance의 refresh 요청은 withCredentials: true로 쿠키를 자동 전송한다.

/**
 * 리프레시 토큰을 조회한다.
 *
 * @deprecated [이슈6] Refresh Token은 서버 HttpOnly 쿠키로 관리한다.
 *   이 함수는 하위 호환성을 위해 유지되며 항상 null을 반환한다.
 *   axiosInstance의 refresh 요청은 withCredentials: true로 쿠키를 자동 전송한다.
 * @returns {null} 항상 null 반환
 */
export function getRefreshToken() {
  // no-op: Refresh Token은 HttpOnly 쿠키로 관리 — localStorage 저장 안 함
  return null;
}

/**
 * 리프레시 토큰을 저장한다.
 *
 * @deprecated [이슈6] Refresh Token은 서버 HttpOnly 쿠키로 관리한다.
 *   이 함수는 하위 호환성을 위해 유지되며 아무 동작도 수행하지 않는다.
 * @returns {boolean} 항상 false 반환 (저장하지 않음)
 */
export function setRefreshToken() {
  // no-op: Refresh Token은 서버가 HttpOnly 쿠키로 갱신하므로 클라이언트에서 저장 금지
  return false;
}

/**
 * 리프레시 토큰을 삭제한다.
 *
 * @deprecated [이슈6] Refresh Token은 서버 HttpOnly 쿠키로 관리한다.
 *   이 함수는 하위 호환성을 위해 유지되며 아무 동작도 수행하지 않는다.
 *   실제 쿠키 삭제는 서버 로그아웃 API(/auth/logout)가 담당한다.
 * @returns {boolean} 항상 false 반환 (삭제하지 않음)
 */
export function removeRefreshToken() {
  // no-op: 쿠키는 서버 로그아웃 API가 삭제함
  return false;
}

// ── 사용자 정보 관련 ──

/**
 * 저장된 사용자 정보 객체를 가져온다.
 * JSON 파싱 실패 시 null을 반환한다.
 *
 * @returns {Object|null} 사용자 정보 객체 또는 null
 */
export function getUser() {
  const userJson = safeGetItem(USER_KEY);
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch {
    console.warn('[storage] 사용자 정보 파싱 실패');
    return null;
  }
}

/**
 * 사용자 정보 객체를 JSON으로 직렬화하여 저장한다.
 *
 * @param {Object} user - 사용자 정보 객체
 * @returns {boolean} 저장 성공 여부
 */
export function setUser(user) {
  try {
    return safeSetItem(USER_KEY, JSON.stringify(user));
  } catch {
    console.warn('[storage] 사용자 정보 직렬화 실패');
    return false;
  }
}

/**
 * 저장된 사용자 정보를 삭제한다.
 *
 * @returns {boolean} 삭제 성공 여부
 */
export function removeUser() {
  return safeRemoveItem(USER_KEY);
}

/**
 * 모든 몽글픽 관련 localStorage 데이터를 삭제한다.
 * 로그아웃 시 호출하여 완전한 상태 초기화를 수행한다.
 *
 * [이슈6] Refresh Token은 서버 HttpOnly 쿠키로 관리하므로 여기서 삭제하지 않는다.
 * 쿠키 삭제는 서버 로그아웃 API(/auth/logout)가 담당한다.
 */
export function clearAll() {
  removeToken();
  // removeRefreshToken() — no-op이므로 호출 불필요하나 명시적으로 유지
  // 세션 ID 는 URL 이 SSOT 이므로 localStorage 에서 삭제할 대상이 없다.
  removeUser();
}
