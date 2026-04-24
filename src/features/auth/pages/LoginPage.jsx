/**
 * 로그인 페이지 컴포넌트.
 *
 * LoginForm 컴포넌트를 중앙 정렬하여 표시한다.
 * 이미 로그인된 사용자는 홈 페이지로 리다이렉트한다.
 *
 * 개선 사항:
 * - 배경에 그라데이션 원 장식 2개 (decorative circles)
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../shared/stores/useAuthStore';
import { ROUTES } from '../../../shared/constants/routes';
import { getSuspendedReason, clearSuspendedReason } from '../../../shared/utils/storage';
import LoginForm from '../components/LoginForm';
import * as S from './LoginPage.styled';

export default function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const isLoading = useAuthStore((s) => s.isLoading);
  const navigate = useNavigate();

  /* lazy initializer — 렌더 전 1회 실행, useEffect setState 경고 없음 */
  const [suspendedMessage] = useState(() => {
    const reason = getSuspendedReason();
    if (reason) {
      clearSuspendedReason();
      return reason;
    }
    return null;
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <S.LoginPageWrapper>
      <S.Orb1 aria-hidden="true" />
      <S.Orb2 aria-hidden="true" />
      <S.Orb3 aria-hidden="true" />
      {suspendedMessage && (
        <S.SuspendedBanner role="alert">
          🚫 {suspendedMessage}
        </S.SuspendedBanner>
      )}
      <LoginForm />
    </S.LoginPageWrapper>
  );
}
