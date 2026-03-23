/**
 * 회원가입 페이지 컴포넌트.
 *
 * SignUpForm 컴포넌트를 중앙 정렬하여 표시한다.
 * 이미 로그인된 사용자는 홈 페이지로 리다이렉트한다.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
/* 인증 Context 훅 — app/providers에서 가져옴 */
import { useAuth } from '../../../app/providers/AuthProvider';
/* 라우트 경로 상수 — shared/constants에서 가져옴 */
import { ROUTES } from '../../../shared/constants/routes';
/* 회원가입 폼 — 같은 feature 내의 components에서 가져옴 */
import SignUpForm from '../components/SignUpForm';
import './SignUpPage.css';

export default function SignUpPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  /**
   * 이미 인증된 사용자는 홈으로 리다이렉트.
   */
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="signup-page">
      <SignUpForm />
    </div>
  );
}
