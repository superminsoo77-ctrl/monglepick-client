/**
 * 로그인 폼 컴포넌트.
 *
 * 이메일과 비밀번호를 입력받아 로그인 API를 호출한다.
 * 로그인 성공 시 AuthContext를 통해 인증 상태를 업데이트하고,
 * 이전 페이지 또는 홈으로 리다이렉트한다.
 *
 * 비밀번호 찾기 플로우 (이메일 인증 없음):
 *   step 'login'        — 기본 로그인 폼
 *   step 'email-check'  — 이메일 입력 → POST /api/v1/auth/password/check
 *   step 'reset'        — 새 비밀번호 입력 → POST /api/v1/auth/password/reset
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../../shared/stores/useAuthStore';
import { login as loginAPI, checkEmailExists, resetPassword } from '../api/authApi';
import { validateEmail, validatePassword, validatePasswordConfirm } from '../../../shared/utils/validators';
import { ROUTES } from '../../../shared/constants/routes';
import { getOAuth2AuthorizationUrl } from '../../../shared/constants/oauth';
/*
 * 2026-04-23 PR-5 — 로그인 복귀 경로 훅.
 * useReturnTo(): 로컬 로그인 성공 시 state.returnTo 로 복귀 (PrivateRoute 가 주입).
 * rememberReturnTo(): OAuth 리다이렉트처럼 state 가 날아가는 경우 sessionStorage 경유.
 */
import useReturnTo, { rememberReturnTo } from '../../../shared/hooks/useReturnTo';
import * as S from './LoginForm.styled';

export default function LoginForm() {
  /* ── 로그인 상태 ── */
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError]   = useState('');

  /* ── 비밀번호 찾기 플로우 ── */
  /** 'login' | 'email-check' | 'reset' */
  const [step, setStep] = useState('login');

  /* email-check 스텝 */
  const [fpEmail, setFpEmail]           = useState('');
  const [fpEmailError, setFpEmailError] = useState('');

  /* reset 스텝 */
  const [fpNewPassword,     setFpNewPassword]     = useState('');
  const [fpConfirmPassword, setFpConfirmPassword] = useState('');
  const [fpPasswordErrors,  setFpPasswordErrors]  = useState({});
  const [fpSuccess,         setFpSuccess]         = useState(false);

  const login    = useAuthStore((s) => s.login);
  const location = useLocation();
  /*
   * 로그인 성공 후 복귀 네비게이터.
   *   - state.returnTo (PrivateRoute 가 주입) → sessionStorage (OAuth 경로) → '/home' 순 폴백
   *   - PR-5 이전에는 navigate(ROUTES.HOME) 하드코딩으로 항상 홈으로 떨어졌다.
   */
  const goAfterLogin = useReturnTo(ROUTES.HOME);

  /* ── 로그인 폼 유효성 검사 ── */
  const validateLoginForm = () => {
    const newErrors = {};
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) newErrors.email = emailResult.message;
    if (!password) newErrors.password = '비밀번호를 입력해주세요.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ── 로그인 제출 ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      const response = await loginAPI({ email, password });
      login({
        accessToken:  response.accessToken,
        refreshToken: response.refreshToken,
        user:         response.user,
      });
      /* PR-5: state.returnTo 있으면 원래 페이지로, 없으면 ROUTES.HOME 으로 */
      goAfterLogin();
    } catch (err) {
      if (err.code === 'A003') {
        setServerError('이메일 또는 비밀번호가 올바르지 않습니다. 가입하지 않은 경우 회원가입을 진행해주세요.');
      } else if (err.code === 'A007') {
        setServerError('해당 이메일은 소셜 로그인으로 가입되어 있습니다. 소셜 로그인을 이용해주세요.');
      } else {
        setServerError(err.message || '로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── 테스트 유저 로그인 ── */
  const handleTestLogin = async () => {
    setIsSubmitting(true);
    setServerError('');
    try {
      const response = await loginAPI({
        email:    'e2e_v2@monglepick.com',
        password: 'Test1234!',
      });
      login({
        accessToken:  response.accessToken,
        refreshToken: response.refreshToken,
        user:         response.user,
      });
      /* PR-5: state.returnTo 있으면 원래 페이지로, 없으면 ROUTES.HOME 으로 */
      goAfterLogin();
    } catch (err) {
      if (err.code === 'A003') {
        setServerError('이메일 또는 비밀번호가 올바르지 않습니다. 가입하지 않은 경우 회원가입을 진행해주세요.');
      } else {
        setServerError(err.message || '테스트 유저 로그인에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── 비밀번호 찾기: 이메일 확인 ── */
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    const emailResult = validateEmail(fpEmail);
    if (!emailResult.isValid) {
      setFpEmailError(emailResult.message);
      return;
    }
    setFpEmailError('');
    setIsSubmitting(true);
    setServerError('');

    try {
      await checkEmailExists(fpEmail);
      /* 200 OK → 비밀번호 재설정 스텝으로 */
      setStep('reset');
    } catch (err) {
      if (err.status === 404 || err.code === 'U001') {
        setFpEmailError('해당 이메일로 가입된 계정이 없습니다.');
      } else {
        setServerError(err.message || '이메일 확인 중 오류가 발생했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── 비밀번호 찾기: 비밀번호 재설정 ── */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const pwResult = validatePassword(fpNewPassword);
    if (!pwResult.isValid) newErrors.newPassword = pwResult.message;
    const confirmResult = validatePasswordConfirm(fpNewPassword, fpConfirmPassword);
    if (!confirmResult.isValid) newErrors.confirmPassword = confirmResult.message;
    setFpPasswordErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      await resetPassword(fpEmail, fpNewPassword);
      setFpSuccess(true);
    } catch (err) {
      if (err.status === 404 || err.code === 'U001') {
        setServerError('계정을 찾을 수 없습니다. 처음부터 다시 시도해주세요.');
      } else {
        setServerError(err.message || '비밀번호 변경 중 오류가 발생했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── 비밀번호 찾기 초기화 후 로그인으로 돌아가기 ── */
  const handleBackToLogin = () => {
    setStep('login');
    setFpEmail('');
    setFpEmailError('');
    setFpNewPassword('');
    setFpConfirmPassword('');
    setFpPasswordErrors({});
    setFpSuccess(false);
    setServerError('');
  };

  /* ──────────────────────────────────────────── */
  /* step: 'email-check' — 이메일 입력 화면       */
  /* ──────────────────────────────────────────── */
  if (step === 'email-check') {
    return (
      <S.Form onSubmit={handleCheckEmail} noValidate>
        <S.BackButton type="button" onClick={handleBackToLogin}>
          ← 로그인으로 돌아가기
        </S.BackButton>

        <S.Title>비밀번호 찾기</S.Title>
        <S.Subtitle>가입 시 사용한 이메일을 입력해주세요</S.Subtitle>

        {serverError && <S.ErrorBanner>{serverError}</S.ErrorBanner>}

        <S.Field>
          <S.Label htmlFor="fp-email">이메일</S.Label>
          <S.Input
            id="fp-email"
            type="email"
            $error={!!fpEmailError}
            value={fpEmail}
            onChange={(e) => setFpEmail(e.target.value)}
            placeholder="example@email.com"
            autoComplete="email"
            disabled={isSubmitting}
          />
          {fpEmailError && <S.FieldError>{fpEmailError}</S.FieldError>}
        </S.Field>

        <S.SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? '확인 중...' : '이메일 확인하기'}
        </S.SubmitButton>
      </S.Form>
    );
  }

  /* ──────────────────────────────────────────── */
  /* step: 'reset' — 새 비밀번호 입력 화면         */
  /* ──────────────────────────────────────────── */
  if (step === 'reset') {
    /* 성공 상태 */
    if (fpSuccess) {
      return (
        <S.Form as="div">
          <S.Title>비밀번호 변경 완료</S.Title>
          <S.SuccessBanner>
            비밀번호가 성공적으로 변경되었습니다.
          </S.SuccessBanner>
          <S.SubmitButton type="button" onClick={handleBackToLogin}>
            로그인하러 가기
          </S.SubmitButton>
        </S.Form>
      );
    }

    return (
      <S.Form onSubmit={handleResetPassword} noValidate>
        <S.BackButton type="button" onClick={() => setStep('email-check')}>
          ← 이메일 입력으로 돌아가기
        </S.BackButton>

        <S.Title>새 비밀번호 설정</S.Title>
        <S.Subtitle>{fpEmail}의 새 비밀번호를 입력해주세요</S.Subtitle>

        {serverError && <S.ErrorBanner>{serverError}</S.ErrorBanner>}

        <S.Field>
          <S.Label htmlFor="fp-new-password">새 비밀번호</S.Label>
          <S.Input
            id="fp-new-password"
            type="password"
            $error={!!fpPasswordErrors.newPassword}
            value={fpNewPassword}
            onChange={(e) => setFpNewPassword(e.target.value)}
            placeholder="8자 이상, 영문+숫자 조합"
            autoComplete="new-password"
            disabled={isSubmitting}
          />
          {fpPasswordErrors.newPassword && (
            <S.FieldError>{fpPasswordErrors.newPassword}</S.FieldError>
          )}
        </S.Field>

        <S.Field>
          <S.Label htmlFor="fp-confirm-password">새 비밀번호 확인</S.Label>
          <S.Input
            id="fp-confirm-password"
            type="password"
            $error={!!fpPasswordErrors.confirmPassword}
            value={fpConfirmPassword}
            onChange={(e) => setFpConfirmPassword(e.target.value)}
            placeholder="비밀번호를 다시 입력하세요"
            autoComplete="new-password"
            disabled={isSubmitting}
          />
          {fpPasswordErrors.confirmPassword && (
            <S.FieldError>{fpPasswordErrors.confirmPassword}</S.FieldError>
          )}
        </S.Field>

        <S.SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? '변경 중...' : '비밀번호 변경하기'}
        </S.SubmitButton>
      </S.Form>
    );
  }

  /* ──────────────────────────────────────────── */
  /* step: 'login' — 기본 로그인 폼               */
  /* ──────────────────────────────────────────── */
  return (
    <S.Form onSubmit={handleSubmit} noValidate>
      <S.Title>로그인</S.Title>
      <S.Subtitle>몽글픽에 오신 것을 환영합니다</S.Subtitle>

      {serverError && <S.ErrorBanner>{serverError}</S.ErrorBanner>}

      <S.Field>
        <S.Label htmlFor="login-email">이메일</S.Label>
        <S.Input
          id="login-email"
          type="email"
          $error={!!errors.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          autoComplete="email"
          disabled={isSubmitting}
        />
        {errors.email && <S.FieldError>{errors.email}</S.FieldError>}
      </S.Field>

      <S.Field>
        <S.Label htmlFor="login-password">비밀번호</S.Label>
        <S.Input
          id="login-password"
          type="password"
          $error={!!errors.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 입력하세요"
          autoComplete="current-password"
          disabled={isSubmitting}
        />
        {errors.password && <S.FieldError>{errors.password}</S.FieldError>}
        <S.ForgotPasswordButton
          type="button"
          onClick={() => setStep('email-check')}
          disabled={isSubmitting}
        >
          비밀번호를 잊으셨나요?
        </S.ForgotPasswordButton>
      </S.Field>

      <S.SubmitButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? '로그인 중...' : '로그인'}
      </S.SubmitButton>

      <S.TestLoginButton
        type="button"
        disabled={isSubmitting}
        onClick={handleTestLogin}
      >
        테스트 유저로 로그인
      </S.TestLoginButton>

      <S.Divider><span>또는</span></S.Divider>

      {/*
        2026-04-23 PR-5: OAuth 로그인 전에 state.returnTo 를 sessionStorage 에 stash.
        외부 리다이렉트(Google/카카오/네이버) 를 거치면 location.state 가 소실되므로,
        sessionStorage 를 브리지로 사용해 OAuthCookiePage 가 복귀 경로를 해석할 수 있도록 한다.
        rememberReturnTo 내부에서 sanitizeReturnTo 로 안전 검증.
      */}
      <S.SocialList>
        <S.SocialButton
          type="button"
          $provider="google"
          onClick={() => {
            rememberReturnTo(location.state?.returnTo);
            window.location.href = getOAuth2AuthorizationUrl('google');
          }}
          disabled={isSubmitting}
        >
          Google로 로그인
        </S.SocialButton>
        <S.SocialButton
          type="button"
          $provider="kakao"
          onClick={() => {
            rememberReturnTo(location.state?.returnTo);
            window.location.href = getOAuth2AuthorizationUrl('kakao');
          }}
          disabled={isSubmitting}
        >
          카카오로 로그인
        </S.SocialButton>
        <S.SocialButton
          type="button"
          $provider="naver"
          onClick={() => {
            rememberReturnTo(location.state?.returnTo);
            window.location.href = getOAuth2AuthorizationUrl('naver');
          }}
          disabled={isSubmitting}
        >
          네이버로 로그인
        </S.SocialButton>
      </S.SocialList>

      <S.Footer>
        계정이 없으신가요?{' '}
        {/*
          PR-5: state.returnTo 를 회원가입 페이지로 전달 — SignUpForm 이 OAuth 클릭 시
          이 값을 sessionStorage 에 넘기고, OAuth 복귀 후 원래 페이지로 이동할 수 있도록.
          returnTo 가 없어도 state 는 { returnTo: undefined } 가 되어 안전.
        */}
        <S.TextLink
          as={Link}
          to={ROUTES.SIGNUP}
          state={location.state?.returnTo ? { returnTo: location.state.returnTo } : undefined}
        >회원가입</S.TextLink>
      </S.Footer>
    </S.Form>
  );
}
