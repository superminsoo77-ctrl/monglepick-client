/**
 * 로그인 폼 컴포넌트.
 *
 * 이메일과 비밀번호를 입력받아 로그인 API를 호출한다.
 * 로그인 성공 시 AuthContext를 통해 인증 상태를 업데이트하고,
 * 이전 페이지 또는 홈으로 리다이렉트한다.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
/* 인증 Context 훅 — app/providers에서 가져옴 */
import { useAuth } from '../../../app/providers/AuthProvider';
/* 로그인 API — 같은 feature 내의 authApi에서 가져옴 */
import { login as loginAPI } from '../api/authApi';
/* 유효성 검사 유틸 — shared/utils에서 가져옴 */
import { validateEmail, validatePassword } from '../../../shared/utils/validators';
/* 라우트 경로 상수 — shared/constants에서 가져옴 */
import { ROUTES } from '../../../shared/constants/routes';
/* OAuth URL 생성 유틸 — shared/constants에서 가져옴 */
import { buildOAuthUrl } from '../../../shared/constants/oauth';
import './LoginForm.css';

export default function LoginForm() {
  // 폼 입력값 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // 필드별 에러 메시지 상태
  const [errors, setErrors] = useState({});
  // API 호출 중 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 서버 에러 메시지
  const [serverError, setServerError] = useState('');

  // 인증 Context에서 login 함수 가져오기
  const { login } = useAuth();
  // 페이지 이동용 navigate
  const navigate = useNavigate();

  /**
   * 폼 전체의 유효성을 검사한다.
   *
   * @returns {boolean} 모든 필드가 유효하면 true
   */
  const validateForm = () => {
    const newErrors = {};

    // 이메일 검증
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      newErrors.email = emailResult.message;
    }

    // 비밀번호 검증 (로그인은 최소 입력 여부만 확인)
    if (!password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 폼 제출 핸들러.
   * 유효성 검사 → API 호출 → 인증 상태 업데이트 → 리다이렉트.
   *
   * @param {Event} e - 폼 제출 이벤트
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 클라이언트 유효성 검사
    if (!validateForm()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      // 로그인 API 호출
      const response = await loginAPI({ email, password });

      // AuthContext에 인증 정보 저장
      login({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user,
      });

      // 홈 페이지로 리다이렉트
      navigate(ROUTES.HOME);
    } catch (err) {
      // 서버 에러 메시지 표시
      setServerError(err.message || '로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      {/* 폼 제목 */}
      <h2 className="login-form__title">로그인</h2>
      <p className="login-form__subtitle">몽글픽에 오신 것을 환영합니다</p>

      {/* 서버 에러 메시지 */}
      {serverError && (
        <div className="login-form__error-banner">{serverError}</div>
      )}

      {/* 이메일 입력 필드 */}
      <div className="login-form__field">
        <label htmlFor="login-email" className="login-form__label">이메일</label>
        <input
          id="login-email"
          type="email"
          className={`login-form__input ${errors.email ? 'login-form__input--error' : ''}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          autoComplete="email"
          disabled={isSubmitting}
        />
        {errors.email && <span className="login-form__error">{errors.email}</span>}
      </div>

      {/* 비밀번호 입력 필드 */}
      <div className="login-form__field">
        <label htmlFor="login-password" className="login-form__label">비밀번호</label>
        <input
          id="login-password"
          type="password"
          className={`login-form__input ${errors.password ? 'login-form__input--error' : ''}`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 입력하세요"
          autoComplete="current-password"
          disabled={isSubmitting}
        />
        {errors.password && <span className="login-form__error">{errors.password}</span>}
      </div>

      {/* 로그인 버튼 */}
      <button
        type="submit"
        className="login-form__submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? '로그인 중...' : '로그인'}
      </button>

      {/* 소셜 로그인 구분선 */}
      <div className="login-form__divider">
        <span>또는</span>
      </div>

      {/* 소셜 로그인 버튼 */}
      <div className="login-form__social">
        <button
          type="button"
          className="login-form__social-btn login-form__social-btn--google"
          onClick={() => { window.location.href = buildOAuthUrl('google'); }}
          disabled={isSubmitting}
        >
          Google로 로그인
        </button>
        <button
          type="button"
          className="login-form__social-btn login-form__social-btn--kakao"
          onClick={() => { window.location.href = buildOAuthUrl('kakao'); }}
          disabled={isSubmitting}
        >
          카카오로 로그인
        </button>
        <button
          type="button"
          className="login-form__social-btn login-form__social-btn--naver"
          onClick={() => { window.location.href = buildOAuthUrl('naver'); }}
          disabled={isSubmitting}
        >
          네이버로 로그인
        </button>
      </div>

      {/* 회원가입 링크 */}
      <p className="login-form__footer">
        계정이 없으신가요?{' '}
        <Link to={ROUTES.SIGNUP} className="login-form__link">회원가입</Link>
      </p>
    </form>
  );
}
