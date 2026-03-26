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
import useAuthStore from '../../../shared/stores/useAuthStore';
/* 로그인 API — 같은 feature 내의 authApi에서 가져옴 */
import { login as loginAPI } from '../api/authApi';
/* 유효성 검사 유틸 — shared/utils에서 가져옴 */
/* 로그인 폼은 비밀번호 입력 여부만 확인하므로 validatePassword는 사용하지 않음 */
import { validateEmail } from '../../../shared/utils/validators';
/* 라우트 경로 상수 — shared/constants에서 가져옴 */
import { ROUTES } from '../../../shared/constants/routes';
/* OAuth URL 생성 유틸 — shared/constants에서 가져옴 */
import { getOAuth2AuthorizationUrl } from '../../../shared/constants/oauth';
import * as S from './LoginForm.styled';

export default function LoginForm() {
  /* 폼 입력값 상태 */
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  /* 필드별 에러 메시지 상태 */
  const [errors, setErrors]           = useState({});
  /* API 호출 중 상태 */
  const [isSubmitting, setIsSubmitting] = useState(false);
  /* 서버 에러 메시지 */
  const [serverError, setServerError]   = useState('');

  /* 인증 Context에서 login 함수 가져오기 */
  const login    = useAuthStore((s) => s.login);
  /* 페이지 이동용 navigate */
  const navigate = useNavigate();

  /**
   * 폼 전체의 유효성을 검사한다.
   *
   * @returns {boolean} 모든 필드가 유효하면 true
   */
  const validateForm = () => {
    const newErrors = {};

    /* 이메일 검증 */
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      newErrors.email = emailResult.message;
    }

    /* 비밀번호 검증 (로그인은 최소 입력 여부만 확인) */
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

    /* 클라이언트 유효성 검사 */
    if (!validateForm()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      /* 로그인 API 호출 */
      const response = await loginAPI({ email, password });

      /* AuthContext에 인증 정보 저장 */
      login({
        accessToken:  response.accessToken,
        refreshToken: response.refreshToken,
        user:         response.user,
      });

      /* 홈 페이지로 리다이렉트 */
      navigate(ROUTES.HOME);
    } catch (err) {
      /* 에러 코드별 사용자 친화적 메시지 분기 */
      if (err.code === 'A003') {
        /* 미가입 또는 비밀번호 불일치 — 회원가입 안내 포함 */
        setServerError('이메일 또는 비밀번호가 올바르지 않습니다. 가입하지 않은 경우 회원가입을 진행해주세요.');
      } else if (err.code === 'A007') {
        /* 소셜 로그인으로 가입된 이메일 */
        setServerError('해당 이메일은 소셜 로그인으로 가입되어 있습니다. 소셜 로그인을 이용해주세요.');
      } else {
        setServerError(err.message || '로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 테스트 유저 로그인 핸들러.
   * 개발/테스트 환경에서 고정된 테스트 계정으로 로그인한다.
   */
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
      navigate(ROUTES.HOME);
    } catch (err) {
      /* 에러 코드별 사용자 친화적 메시지 분기 */
      if (err.code === 'A003') {
        setServerError('이메일 또는 비밀번호가 올바르지 않습니다. 가입하지 않은 경우 회원가입을 진행해주세요.');
      } else {
        setServerError(err.message || '테스트 유저 로그인에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <S.Form onSubmit={handleSubmit} noValidate>
      {/* 폼 제목 */}
      <S.Title>로그인</S.Title>
      <S.Subtitle>몽글픽에 오신 것을 환영합니다</S.Subtitle>

      {/* 서버 에러 메시지 */}
      {serverError && <S.ErrorBanner>{serverError}</S.ErrorBanner>}

      {/* 이메일 입력 필드 */}
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

      {/* 비밀번호 입력 필드 */}
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
      </S.Field>

      {/* 로그인 버튼 */}
      <S.SubmitButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? '로그인 중...' : '로그인'}
      </S.SubmitButton>

      {/* 테스트 유저 로그인 버튼 — 개발/테스트 환경용 */}
      <S.TestLoginButton
        type="button"
        disabled={isSubmitting}
        onClick={handleTestLogin}
      >
        테스트 유저로 로그인
      </S.TestLoginButton>

      {/* 소셜 로그인 구분선 */}
      <S.Divider><span>또는</span></S.Divider>

      {/* 소셜 로그인 버튼 */}
      <S.SocialList>
        <S.SocialButton
          type="button"
          $provider="google"
          onClick={() => { window.location.href = getOAuth2AuthorizationUrl('google'); }}
          disabled={isSubmitting}
        >
          Google로 로그인
        </S.SocialButton>
        <S.SocialButton
          type="button"
          $provider="kakao"
          onClick={() => { window.location.href = getOAuth2AuthorizationUrl('kakao'); }}
          disabled={isSubmitting}
        >
          카카오로 로그인
        </S.SocialButton>
        <S.SocialButton
          type="button"
          $provider="naver"
          onClick={() => { window.location.href = getOAuth2AuthorizationUrl('naver'); }}
          disabled={isSubmitting}
        >
          네이버로 로그인
        </S.SocialButton>
      </S.SocialList>

      {/* 회원가입 링크 — as={Link}로 react-router-dom 라우팅 유지 */}
      <S.Footer>
        계정이 없으신가요?{' '}
        <S.TextLink as={Link} to={ROUTES.SIGNUP}>회원가입</S.TextLink>
      </S.Footer>
    </S.Form>
  );
}
