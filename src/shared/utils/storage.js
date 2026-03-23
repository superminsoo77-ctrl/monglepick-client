/**
 * localStorage 래퍼 유틸리티 모듈.
 *
 * 인증 토큰, 세션 ID 등을 localStorage에 안전하게 저장/조회/삭제한다.
 * 시크릿 모드 등 localStorage 접근 불가 환경에서도 에러 없이 동작한다.
 */

/** 인증 토큰 저장 키 */
const TOKEN_KEY = 'monglepick_auth_token';

/** 리프레시 토큰 저장 키 */
const REFRESH_TOKEN_KEY = 'monglepick_refresh_token';

/** 채팅 세션 ID 저장 키 */
const SESSION_ID_KEY = 'monglepick_session_id';

/** 사용자 정보 저장 키 */
const USER_KEY = 'monglepick_user';

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

// ── 인증 토큰 관련 ──

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
 *
 * @param {string} token - JWT 액세스 토큰
 * @returns {boolean} 저장 성공 여부
 */
export function setToken(token) {
  return safeSetItem(TOKEN_KEY, token);
}

/**
 * 인증 토큰(액세스 토큰)을 삭제한다.
 *
 * @returns {boolean} 삭제 성공 여부
 */
export function removeToken() {
  return safeRemoveItem(TOKEN_KEY);
}

// ── 리프레시 토큰 관련 ──

/**
 * 저장된 리프레시 토큰을 가져온다.
 *
 * @returns {string|null} JWT 리프레시 토큰 또는 null
 */
export function getRefreshToken() {
  return safeGetItem(REFRESH_TOKEN_KEY);
}

/**
 * 리프레시 토큰을 저장한다.
 *
 * @param {string} token - JWT 리프레시 토큰
 * @returns {boolean} 저장 성공 여부
 */
export function setRefreshToken(token) {
  return safeSetItem(REFRESH_TOKEN_KEY, token);
}

/**
 * 리프레시 토큰을 삭제한다.
 *
 * @returns {boolean} 삭제 성공 여부
 */
export function removeRefreshToken() {
  return safeRemoveItem(REFRESH_TOKEN_KEY);
}

// ── 세션 ID 관련 ──

/**
 * 채팅 세션 ID를 가져온다.
 *
 * @returns {string|null} 세션 ID 또는 null
 */
export function getSessionId() {
  return safeGetItem(SESSION_ID_KEY);
}

/**
 * 채팅 세션 ID를 저장한다.
 *
 * @param {string} sessionId - 세션 ID
 * @returns {boolean} 저장 성공 여부
 */
export function setSessionId(sessionId) {
  return safeSetItem(SESSION_ID_KEY, sessionId);
}

/**
 * 채팅 세션 ID를 삭제한다.
 *
 * @returns {boolean} 삭제 성공 여부
 */
export function removeSessionId() {
  return safeRemoveItem(SESSION_ID_KEY);
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
 */
export function clearAll() {
  removeToken();
  removeRefreshToken();
  removeSessionId();
  removeUser();
}
