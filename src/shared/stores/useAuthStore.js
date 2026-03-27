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

/**
 * 인증 Zustand 스토어.
 *
 * 초기 상태: localStorage에서 토큰과 사용자 정보를 복원한다.
 * Context API와 달리 Provider 래핑이 불필요하며,
 * 선택적 구독(selector)으로 불필요한 리렌더링을 방지한다.
 */
/**
 * JWT 토큰의 만료 여부를 검사한다.
 * payload의 exp 클레임을 디코딩하여 현재 시간과 비교한다.
 *
 * @param {string} token - JWT 토큰 문자열
 * @returns {boolean} 만료되었으면 true
 */
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    /* exp는 초 단위이므로 밀리초로 변환하여 비교 */
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

const useAuthStore = create((set, get) => {
  /* ── 초기 상태: localStorage에서 복원 (만료된 토큰은 무시) ── */
  const savedToken = getToken();
  const savedUser = getUser();
  const isValid = savedToken && savedUser && !isTokenExpired(savedToken);

  /* 만료된 토큰이 있으면 즉시 정리 */
  if (savedToken && !isValid) {
    clearAll();
  }

  return {
    /** 사용자 정보 (null이면 미인증) */
    user: isValid ? savedUser : null,

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
      /* Zustand 상태 업데이트 */
      set({ token: accessToken, user: userData });

      /* localStorage에 영속 저장 (새로고침 후 인증 상태 복원용) */
      setToken(accessToken);
      setUser(userData);

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
