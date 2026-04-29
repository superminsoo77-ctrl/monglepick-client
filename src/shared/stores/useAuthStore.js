/**
 * 인증 상태 관리 Zustand 스토어.
 *
 * 앱 전체에서 사용자 인증 상태를 공유한다.
 * - user: 현재 로그인한 사용자 정보 (null이면 미인증)
 * - token: JWT 액세스 토큰
 * - login: 로그인 처리 (토큰 + 사용자 정보 저장)
 * - logout: 로그아웃 처리 (모든 인증 정보 삭제)
 * - isAuthenticated: 인증 여부 (computed)
 *
 * localStorage를 통해 새로고침 후에도 인증 상태를 유지한다.
 *
 * @module shared/stores/useAuthStore
 *
 * @example
 * // 컴포넌트에서 필요한 상태만 선택 (선택적 구독으로 리렌더링 최소화)
 * const user = useAuthStore((s) => s.user);
 * const { login, logout } = useAuthStore();
 *
 * // PrivateRoute 등에서 인증 여부 확인
 * const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
 */

import { create } from 'zustand';
import {
  getToken,
  setToken,
  getUser,
  setUser,
  clearAll,
} from '../utils/storage';
// [이슈6] setRefreshToken 제거 — Refresh Token은 서버 HttpOnly 쿠키로 관리
// removeToken, removeUser는 logout에서 clearAll()로 일괄 처리하므로 미사용

// 서버 로그아웃 API — Refresh Token DB 삭제 + HttpOnly 쿠키 만료 처리
import { logoutAPI } from '../../features/auth/api/authApi';
 // ✅ stores (복수)

/**
 * 인증 Zustand 스토어.
 *
 * 초기 상태: localStorage에서 토큰과 사용자 정보를 복원한다.
 * Context API와 달리 Provider 래핑이 불필요하며,
 * 선택적 구독(selector)으로 불필요한 리렌더링을 방지한다.
 */
/**
 * JWT 토큰의 payload(2번째 세그먼트)를 디코딩하여 JSON 객체로 반환한다.
 * 디코딩 실패 시 null 반환 — 호출자가 안전하게 fallback 처리.
 *
 * @param {string} token - JWT 토큰 문자열
 * @returns {Object|null} 디코딩된 payload, 실패 시 null
 */
function decodeTokenPayload(token) {
  try {
    if (typeof token !== 'string') return null;
    const segments = token.split('.');
    if (segments.length < 2) return null;
    return JSON.parse(atob(segments[1]));
  } catch {
    return null;
  }
}

/**
 * JWT 토큰의 만료 여부를 검사한다.
 * payload의 exp 클레임을 디코딩하여 현재 시간과 비교한다.
 *
 * @param {string} token - JWT 토큰 문자열
 * @returns {boolean} 만료되었으면 true
 */
function isTokenExpired(token) {
  const payload = decodeTokenPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  /* exp는 초 단위이므로 밀리초로 변환하여 비교 */
  return payload.exp * 1000 < Date.now();
}

/**
 * 응답으로 받은 user 객체에 id 가 비어 있을 경우 JWT 의 sub claim 으로 보강한다.
 *
 * <p>2026-04-29 안전망 — Backend 는 {@code /jwt/exchange} 응답에 user 정보를 동봉하도록
 * 변경됐지만(JwtController.ExchangeResponseBody), 다음 두 가지 경계 상황에 대비한다.</p>
 * <ul>
 *   <li>구버전 Backend 가 아직 운영에 배포되지 않은 캐시 환경 — accessToken 만 내려와도
 *     sub claim 으로 user.id 를 채워 PointPage 등의 가드를 통과시킨다.</li>
 *   <li>다른 인증 경로(예: 로컬 회원가입 직후 redirect, refresh 후 user 미동봉)
 *     에서도 동일하게 동작 — 단일 진실 원본(login 진입점)에서 보장.</li>
 * </ul>
 *
 * <p>id 외 필드(email/nickname/profileImage/provider/role) 는 access token claims 에
 * 포함돼 있지 않으므로 그대로 둔다(있으면 사용, 없으면 null/undefined). MyPage 진입 시
 * {@code GET /api/v1/users/me} 호출로 자연스럽게 채워진다.</p>
 *
 * @param {string} token - JWT Access Token (id 추출용)
 * @param {Object} userData - 응답에 포함된 user 객체 (없을 수 있음)
 * @returns {Object|null} id 가 보장된 user 객체, 어떤 정보도 없으면 null
 */
function ensureUserId(token, userData) {
  /* userData 자체가 null/undefined 인 경우, JWT sub 만으로 최소 user 객체 생성.
   * userData 에 id 가 이미 있으면 변형 없이 그대로 반환. */
  const hasId = userData && typeof userData === 'object' && userData.id;
  if (hasId) return userData;

  const payload = decodeTokenPayload(token);
  const sub = payload && typeof payload.sub === 'string' ? payload.sub : null;

  /* JWT sub 가 없으면 보강 불가. 기존 userData 그대로 반환(null 포함). */
  if (!sub) return userData ?? null;

  /* 기존 userData 의 다른 필드(닉네임 등)를 보존하면서 id 만 보강.
   * userData 가 null 이면 sub 만 담은 minimal 객체. */
  return { ...(userData || {}), id: sub };
}

const useAuthStore = create((set, get) => {
  /* ── 초기 상태: localStorage에서 복원 (만료된 토큰은 무시) ── */
  const savedToken = getToken();
  const savedUserRaw = getUser();
  const isValid = savedToken && savedUserRaw && !isTokenExpired(savedToken);

  /* 만료된 토큰이 있으면 즉시 정리 */
  if (savedToken && !isValid) {
    clearAll();
  }

  /* 옛 세션이 user.id 없이 저장돼 있던 경우(소셜 로그인 회귀 이전 데이터)
   * sub claim 으로 보강해 하위 호환성 확보. */
  const savedUser = isValid ? ensureUserId(savedToken, savedUserRaw) : null;
  if (isValid && savedUser !== savedUserRaw && savedUser) {
    setUser(savedUser);
  }

  return {
    /** 사용자 정보 (null이면 미인증) */
    user: savedUser,

    /** JWT 액세스 토큰 */
    token: isValid ? savedToken : null,

    /** 초기 로딩 완료 여부 (localStorage 복원 즉시 완료되므로 false) */
    isLoading: false,

    /**
     * 인증 여부를 반환한다.
     * Zustand에서는 getter 함수로 구현 (derived state).
     *
     * @returns {boolean} 토큰과 사용자 정보가 모두 존재하면 true
     */
    isAuthenticated: () => {
      const { token, user } = get();
      return Boolean(token && user);
    },

    /**
     * 로그인 처리.
     * API 응답으로 받은 액세스 토큰과 사용자 정보를 상태와 localStorage에 저장한다.
     *
     * [이슈6] refreshToken 파라미터는 하위 호환성을 위해 시그니처에 유지하지만
     * localStorage에 저장하지 않는다. Refresh Token은 서버가 HttpOnly 쿠키로 관리하며,
     * axiosInstance의 refresh 요청 시 withCredentials: true로 자동 전송된다.
     *
     * @param {Object} params - 로그인 응답 데이터
     * @param {string} params.accessToken - JWT 액세스 토큰 (localStorage 저장)
     * @param {string} [params.refreshToken] - JWT 리프레시 토큰 (사용 안 함 — 서버 쿠키 관리)
     * @param {Object} params.user - 사용자 정보 객체 (id, email, nickname 등)
     */
    // eslint-disable-next-line no-unused-vars
    login: ({ accessToken, refreshToken, user: userData }) => {
      /* 2026-04-29 안전망 — 응답에 user 객체가 누락되거나 user.id 가 없는 경우
       * accessToken 의 sub claim 으로 user.id 를 보강한다. 소셜 로그인 흐름에서
       * Backend 가 구버전이라 accessToken 만 내려오는 캐시 상황에서도 PointPage 등
       * 개인화 데이터 로더의 user.id 가드가 정상 통과되도록 보장. */
      const safeUser = ensureUserId(accessToken, userData);

      /* Zustand 상태 업데이트 */
      set({ token: accessToken, user: safeUser });

      /* localStorage에 영속 저장 (새로고침 후 인증 상태 복원용) */
      setToken(accessToken);
      setUser(safeUser);

      // [이슈6] refreshToken은 서버 HttpOnly 쿠키로 관리하므로 저장하지 않음
    },

    /**
     * 로그아웃 처리.
     * 1) 서버에 로그아웃 요청 → Refresh Token DB 삭제 + HttpOnly 쿠키 만료
     * 2) 클라이언트 상태(Zustand) + localStorage 인증 정보 전체 삭제
     *
     * 서버 요청 실패 시에도 클라이언트 상태는 반드시 삭제한다 (best-effort).
     * 네트워크 오류나 서버 오류가 있어도 로그아웃은 항상 완료된다.
     */
    logout: async () => {
      // 서버에 로그아웃 요청 (쿠키의 Refresh Token DB 삭제 + 쿠키 만료 처리)
      try {
        await logoutAPI();
      } catch (err) {
        // 네트워크 오류 시에도 클라이언트 상태는 삭제 (best-effort)
        // 서버 로그아웃 실패가 클라이언트 로그아웃을 막아서는 안 됨
        console.warn('[auth] 서버 로그아웃 실패:', err.message);
      }

      // Zustand 상태 초기화
      set({ token: null, user: null });
      // localStorage 인증 정보 전체 삭제 (accessToken, user 등)
      clearAll();
    },

    /**
     * 사용자 정보를 업데이트한다 (프로필 수정 등).
     *
     * @param {Object} updatedUser - 업데이트할 사용자 정보
     */
    updateUser: (updatedUser) => {
      set({ user: updatedUser });
      setUser(updatedUser);
    },
  };
});

export default useAuthStore;
