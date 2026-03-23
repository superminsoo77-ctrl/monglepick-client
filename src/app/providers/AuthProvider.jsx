/**
 * 인증 상태 관리 Context 모듈.
 *
 * 앱 전체에서 사용자 인증 상태를 공유하기 위한 React Context를 제공한다.
 * - user: 현재 로그인한 사용자 정보 (null이면 미인증)
 * - token: JWT 액세스 토큰
 * - login: 로그인 처리 함수
 * - logout: 로그아웃 처리 함수
 * - isAuthenticated: 인증 여부 (boolean)
 *
 * localStorage를 통해 새로고침 후에도 인증 상태를 유지한다.
 */

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
/* localStorage 래퍼 — shared/utils에서 가져옴 */
import {
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser,
  setRefreshToken,
  removeRefreshToken,
  clearAll,
} from '../../shared/utils/storage';

/**
 * 인증 Context 객체.
 * Provider 외부에서 접근하면 null이 반환된다.
 */
const AuthContext = createContext(null);

/**
 * 인증 Context Provider 컴포넌트.
 *
 * 앱 최상위에서 감싸서 하위 컴포넌트에 인증 상태를 제공한다.
 * 초기 마운트 시 localStorage에서 저장된 토큰과 사용자 정보를 복원한다.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - 하위 컴포넌트
 */
export function AuthProvider({ children }) {
  // 사용자 정보 상태 (localStorage에서 복원)
  const [user, setUserState] = useState(null);
  // 액세스 토큰 상태 (localStorage에서 복원)
  const [token, setTokenState] = useState(null);
  // 초기 로딩 상태 (localStorage 복원 중)
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 컴포넌트 마운트 시 localStorage에서 인증 정보를 복원한다.
   * 토큰과 사용자 정보가 모두 존재하면 로그인 상태로 간주한다.
   */
  useEffect(() => {
    const savedToken = getToken();
    const savedUser = getUser();

    if (savedToken && savedUser) {
      setTokenState(savedToken);
      setUserState(savedUser);
    }

    // 복원 완료
    setIsLoading(false);
  }, []);

  /**
   * 로그인 처리 함수.
   * API 응답으로 받은 토큰과 사용자 정보를 상태와 localStorage에 저장한다.
   *
   * @param {Object} params - 로그인 응답 데이터
   * @param {string} params.accessToken - JWT 액세스 토큰
   * @param {string} [params.refreshToken] - JWT 리프레시 토큰
   * @param {Object} params.user - 사용자 정보 객체 (id, email, nickname 등)
   */
  const login = useCallback(({ accessToken, refreshToken, user: userData }) => {
    // 상태 업데이트
    setTokenState(accessToken);
    setUserState(userData);

    // localStorage에 영속 저장
    setToken(accessToken);
    setUser(userData);

    // 리프레시 토큰이 있으면 별도 저장
    if (refreshToken) {
      setRefreshToken(refreshToken);
    }
  }, []);

  /**
   * 로그아웃 처리 함수.
   * 상태와 localStorage의 모든 인증 정보를 삭제한다.
   */
  const logout = useCallback(() => {
    // 상태 초기화
    setTokenState(null);
    setUserState(null);

    // localStorage 전체 삭제
    clearAll();
  }, []);

  /**
   * 사용자 정보를 업데이트한다 (프로필 수정 등).
   *
   * @param {Object} updatedUser - 업데이트할 사용자 정보
   */
  const updateUser = useCallback((updatedUser) => {
    setUserState(updatedUser);
    setUser(updatedUser);
  }, []);

  /** 인증 여부 (토큰과 사용자 정보가 모두 존재하면 true) */
  const isAuthenticated = Boolean(token && user);

  /**
   * Context 값 메모이제이션.
   * 불필요한 리렌더링을 방지하기 위해 useMemo로 감싼다.
   */
  const contextValue = useMemo(
    () => ({
      user,
      token,
      isAuthenticated,
      isLoading,
      login,
      logout,
      updateUser,
    }),
    [user, token, isAuthenticated, isLoading, login, logout, updateUser],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 인증 Context를 사용하기 위한 커스텀 훅.
 * AuthProvider 내부에서만 호출 가능하다.
 *
 * @returns {Object} 인증 상태 및 액션
 * @returns {Object|null} user - 사용자 정보
 * @returns {string|null} token - 액세스 토큰
 * @returns {boolean} isAuthenticated - 인증 여부
 * @returns {boolean} isLoading - 초기 로딩 중 여부
 * @returns {function} login - 로그인 함수
 * @returns {function} logout - 로그아웃 함수
 * @returns {function} updateUser - 사용자 정보 업데이트 함수
 *
 * @throws {Error} AuthProvider 외부에서 호출 시 에러
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }

  return context;
}

export default AuthContext;
