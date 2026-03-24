/**
 * 회원가입 폼 컴포넌트.
 *
 * 이메일, 비밀번호, 비밀번호 확인, 닉네임을 입력받아
 * 회원가입 API를 호출한다.
 * 가입 성공 시 자동 로그인 처리 후 홈으로 리다이렉트한다.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
/* 인증 Context 훅 — app/providers에서 가져옴 */
import { useAuth } from '../../../app/providers/AuthProvider';
/* 회원가입 API — 같은 feature 내의 authApi에서 가져옴 */
import { signup as signupAPI } from '../api/authApi';
/* 유효성 검사 유틸 — shared/utils에서 가져옴 */
import { validateEmail, validatePassword, validatePasswordConfirm, validateNickname } from '../../../shared/utils/validators';
/* 라우트 경로 상수 — shared/constants에서 가져옴 */
import { ROUTES } from '../../../shared/constants/routes';
/* OAuth URL 생성 유틸 — shared/constants에서 가져옴 */
import { buildOAuthUrl } from '../../../shared/constants/oauth';
import './SignUpForm.css';

export default function SignUpForm() {
  // 폼 입력값 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  // 필드별 에러 메시지
  const [errors, setErrors] = useState({});
  // API 호출 중 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 서버 에러 메시지
  const [serverError, setServerError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  /**
   * 폼 전체의 유효성을 검사한다.
   * 모든 필드를 동시에 검증하여 에러 메시지를 한 번에 표시한다.
   *
   * @returns {boolean} 모든 필드가 유효하면 true
   */
  const validateForm = () => {
    const newErrors = {};

    // 이메일 검증
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) newErrors.email = emailResult.message;

    // 비밀번호 검증
    const passwordResult = validatePassword(password);
    if (!passwordResult.isValid) newErrors.password = passwordResult.message;

    // 비밀번호 확인 검증
    const confirmResult = validatePasswordConfirm(password, passwordConfirm);
    if (!confirmResult.isValid) newErrors.passwordConfirm = confirmResult.message;

    // 닉네임 검증
    const nicknameResult = validateNickname(nickname);
    if (!nicknameResult.isValid) newErrors.nickname = nicknameResult.message;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 폼 제출 핸들러.
   * 유효성 검사 → API 호출 → 자동 로그인 → 홈 리다이렉트.
   *
   * @param {Event} e - 폼 제출 이벤트
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      // 회원가입 API 호출
      const response = await signupAPI({ email, password, nickname });

      // 가입 성공 시 자동 로그인 처리
      login({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user,
      });

      // 홈 페이지로 리다이렉트
      navigate(ROUTES.HOME);
    } catch (err) {
      setServerError(err.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="signup-form" onSubmit={handleSubmit} noValidate>
      {/* 폼 제목 */}
      <h2 className="signup-form__title">회원가입</h2>
      <p className="signup-form__subtitle">몽글픽과 함께 영화 취향을 발견하세요</p>

      {/* 서버 에러 메시지 */}
      {serverError && (
        <div className="signup-form__error-banner">{serverError}</div>
      )}

      {/* 이메일 입력 */}
      <div className="signup-form__field">
        <label htmlFor="signup-email" className="signup-form__label">이메일</label>
        <input
          id="signup-email"
          type="email"
          className={`signup-form__input ${errors.email ? 'signup-form__input--error' : ''}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          autoComplete="email"
          disabled={isSubmitting}
        />
        {errors.email && <span className="signup-form__error">{errors.email}</span>}
      </div>

      {/* 닉네임 입력 */}
      <div className="signup-form__field">
        <label htmlFor="signup-nickname" className="signup-form__label">닉네임</label>
        <input
          id="signup-nickname"
          type="text"
          className={`signup-form__input ${errors.nickname ? 'signup-form__input--error' : ''}`}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="2~20자, 한글/영문/숫자"
          autoComplete="nickname"
          disabled={isSubmitting}
        />
        {errors.nickname && <span className="signup-form__error">{errors.nickname}</span>}
      </div>

      {/* 비밀번호 입력 */}
      <div className="signup-form__field">
        <label htmlFor="signup-password" className="signup-form__label">비밀번호</label>
        <input
          id="signup-password"
          type="password"
          className={`signup-form__input ${errors.password ? 'signup-form__input--error' : ''}`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="8자 이상, 영문+숫자 조합"
          autoComplete="new-password"
          disabled={isSubmitting}
        />
        {errors.password && <span className="signup-form__error">{errors.password}</span>}
      </div>

      {/* 비밀번호 확인 입력 */}
      <div className="signup-form__field">
        <label htmlFor="signup-password-confirm" className="signup-form__label">비밀번호 확인</label>
        <input
          id="signup-password-confirm"
          type="password"
          className={`signup-form__input ${errors.passwordConfirm ? 'signup-form__input--error' : ''}`}
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          placeholder="비밀번호를 다시 입력하세요"
          autoComplete="new-password"
          disabled={isSubmitting}
        />
        {errors.passwordConfirm && <span className="signup-form__error">{errors.passwordConfirm}</span>}
      </div>

      {/* 가입 버튼 */}
      <button
        type="submit"
        className="signup-form__submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? '가입 중...' : '가입하기'}
      </button>

      {/* 소셜 로그인 구분선 */}
      <div className="signup-form__divider">
        <span>또는</span>
      </div>

      {/* 소셜 로그인 버튼 */}
      <div className="signup-form__social">
        <button
          type="button"
          className="signup-form__social-btn signup-form__social-btn--google"
          onClick={() => { window.location.href = buildOAuthUrl('google'); }}
          disabled={isSubmitting}
        >
          Google로 시작하기
        </button>
        <button
          type="button"
          className="signup-form__social-btn signup-form__social-btn--kakao"
          onClick={() => { window.location.href = buildOAuthUrl('kakao'); }}
          disabled={isSubmitting}
        >
          카카오로 시작하기
        </button>
        <button
          type="button"
          className="signup-form__social-btn signup-form__social-btn--naver"
          onClick={() => { window.location.href = buildOAuthUrl('naver'); }}
          disabled={isSubmitting}
        >
          네이버로 시작하기
        </button>
      </div>

      {/* 로그인 페이지 링크 */}
      <p className="signup-form__footer">
        이미 계정이 있으신가요?{' '}
        <Link to={ROUTES.LOGIN} className="signup-form__link">로그인</Link>
      </p>
    </form>
  );
}
