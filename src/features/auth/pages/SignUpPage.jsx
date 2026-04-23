/**
 * 회원가입 페이지 컴포넌트.
 *
 * SignUpForm 컴포넌트를 중앙 정렬하여 표시한다.
 * 이미 로그인된 사용자는 홈 페이지로 리다이렉트한다.
 *
 * 개선 사항:
 * - 배경에 그라데이션 원 장식 2개 (decorative circles)
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
/* 인증 Context 훅 — app/providers에서 가져옴 */
import useAuthStore from '../../../shared/stores/useAuthStore';
/* 라우트 경로 상수 — shared/constants에서 가져옴 */
import { ROUTES } from '../../../shared/constants/routes';
/* 회원가입 폼 — 같은 feature 내의 components에서 가져옴 */
import SignUpForm from '../components/SignUpForm';
/* styled-components — SignUpPage 전용 스타일 */
import * as S from './SignUpPage.styled';

export default function SignUpPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const isLoading = useAuthStore((s) => s.isLoading);
  const navigate = useNavigate();
  const [isSignupRedirecting, setIsSignupRedirecting] = useState(false);

  /**
   * 이미 인증된 사용자는 홈으로 리다이렉트.
   */
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isSignupRedirecting) {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [isAuthenticated, isLoading, isSignupRedirecting, navigate]);

  return (
    <S.SignUpPageWrapper>
      {/* 배경 장식 — Floating Orb 3개 (보라/시안/핑크) */}
      <S.Orb1 aria-hidden="true" />
      <S.Orb2 aria-hidden="true" />
      <S.Orb3 aria-hidden="true" />
      <SignUpForm onSignupSuccess={() => setIsSignupRedirecting(true)} />
    </S.SignUpPageWrapper>
  );
}
