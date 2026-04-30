/**
 * 회원가입 폼 컴포넌트.
 *
 * 이메일, 비밀번호, 비밀번호 확인, 닉네임을 입력받아
 * 회원가입 API를 호출한다.
 * 가입 성공 시 자동 로그인 처리 후 홈으로 리다이렉트한다.
 *
 * - 비밀번호 입력 시 강도 표시 바 ($strength: 'weak'|'medium'|'strong')
 * - 제출 시 "처리 중..." 텍스트
 * - glassmorphism 배경 + borderGlow 호버
 * - 소셜 버튼 lift 효과
 */

import { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import TermsModal from './TermsModal';
/* 인증 Context 훅 — app/providers에서 가져옴 */
import useAuthStore from '../../../shared/stores/useAuthStore';
/* 회원가입 API — 같은 feature 내의 authApi에서 가져옴 */
import { signup as signupAPI } from '../api/authApi';
/* 유효성 검사 유틸 — shared/utils에서 가져옴 */
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
  validateNickname,
} from '../../../shared/utils/validators';
/* 라우트 경로 상수 — shared/constants에서 가져옴 */
import { ROUTES } from '../../../shared/constants/routes';
/* OAuth URL 생성 유틸 — shared/constants에서 가져옴 */
import { buildOAuthUrl } from '../../../shared/constants/oauth';
/*
 * 2026-04-23 PR-5 — 로그인/가입 복귀 경로 훅.
 *   - useReturnTo(): 가입 성공 후 원래 페이지(state.returnTo 또는 sessionStorage) 로 복귀
 *   - rememberReturnTo(): OAuth 리다이렉트 전에 state.returnTo 를 sessionStorage 로 stash
 *   LoginPage → "회원가입" 링크로 이동한 경우, LoginForm 이 state 를 함께 넘겨주므로
 *   SignUpForm 도 동일한 returnTo 를 이어받아 OAuth 경로에서 유실되지 않게 한다.
 */
import useReturnTo, { rememberReturnTo } from '../../../shared/hooks/useReturnTo';
/* 리워드 토스트 훅 — 가입 보너스 지급 알림 표시 */
import { useRewardToast } from '../../../shared/components/RewardToast/RewardToastProvider';
import * as S from './SignUpForm.styled';

/**
 * 비밀번호 강도를 'weak'|'medium'|'strong'|'' 문자열로 계산한다.
 * styled-components $strength prop에 직접 전달하기 위해 문자열 반환.
 *
 * @param {string} pw - 비밀번호
 * @returns {'weak'|'medium'|'strong'|''} 강도 레벨
 */
function getPasswordStrength(pw) {
  if (!pw) return '';
  let score = 0;
  /* 길이 기준 */
  if (pw.length >= 8) score += 1;
  /* 영문+숫자 조합 */
  if (/[a-zA-Z]/.test(pw) && /[0-9]/.test(pw)) score += 1;
  /* 특수문자 포함 */
  if (/[^a-zA-Z0-9]/.test(pw)) score += 1;

  if (score === 1) return 'weak';
  if (score === 2) return 'medium';
  if (score === 3) return 'strong';
  return '';
}

/** 강도별 한국어 라벨 매핑 */
const STRENGTH_LABEL = {
  weak:   '약함',
  medium: '보통',
  strong: '강함',
  '':     '',
};

export default function SignUpForm({ onSignupSuccess }) {
  /* 폼 입력값 상태 */
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname,        setNickname]        = useState('');
  /* 약관 동의 상태 */
  const [requiredTerm,    setRequiredTerm]    = useState(false);
  const [optionTerm,      setOptionTerm]      = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  /* 필드별 에러 메시지 */
  const [errors,      setErrors]      = useState({});
  /* API 호출 중 상태 */
  const [isSubmitting, setIsSubmitting] = useState(false);
  /* 서버 에러 메시지 */
  const [serverError,  setServerError]  = useState('');
  /* 약관 모달 — null이면 닫힘, 'service'|'privacy'|'marketing'이면 해당 약관 표시 */
  const [termsModal,   setTermsModal]   = useState(null);

  /* 전체 동의 여부 */
  const allChecked = requiredTerm && optionTerm && marketingAgreed;

  function handleAllCheck() {
    const next = !allChecked;
    setRequiredTerm(next);
    setOptionTerm(next);
    setMarketingAgreed(next);
  }

  const login    = useAuthStore((s) => s.login);
  const location = useLocation();
  /*
   * PR-5: 가입 성공 후 복귀 — state.returnTo 있으면 거기로, 없으면 ONBOARDING.
   * PrivateRoute → /login → (Link) → /signup 경로로 도달한 경우 state 가 전달되어
   * 원래 가려던 페이지로 복귀. 신규 가입자(returnTo 없음)는 온보딩 미션 페이지로 진입.
   */
  const goAfterSignup = useReturnTo(ROUTES.ONBOARDING);
  /* 가입 보너스 토스트 — 백엔드 응답의 signupBonusPoints 를 화면 상단에 표시 */
  const { showReward } = useRewardToast();

  /* 비밀번호 강도 계산 (메모이제이션) */
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  /**
   * 폼 전체의 유효성을 검사한다.
   * 모든 필드를 동시에 검증하여 에러 메시지를 한 번에 표시한다.
   *
   * @returns {boolean} 모든 필드가 유효하면 true
   */
  const validateForm = () => {
    const newErrors = {};

    /* 이메일 검증 */
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) newErrors.email = emailResult.message;

    /* 비밀번호 검증 */
    const passwordResult = validatePassword(password);
    if (!passwordResult.isValid) newErrors.password = passwordResult.message;

    /* 비밀번호 확인 검증 */
    const confirmResult = validatePasswordConfirm(password, passwordConfirm);
    if (!confirmResult.isValid) newErrors.passwordConfirm = confirmResult.message;

    /* 닉네임 검증 */
    const nicknameResult = validateNickname(nickname);
    if (!nicknameResult.isValid) newErrors.nickname = nicknameResult.message;

    /* 필수 약관 동의 검증 */
    if (!requiredTerm) newErrors.requiredTerm = '필수 약관에 동의해주세요';

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
      /* 회원가입 API 호출 */
      const response = await signupAPI({
        email,
        password,
        nickname,
        requiredTerm,
        optionTerm,
        marketingAgreed,
      });

      /*
       * 부모 SignUpPage의 "이미 인증됨 → 홈으로 이동" 가드가
       * 회원가입 직후 온보딩 이동을 덮어쓰지 않도록 먼저 알려준다.
       */
      onSignupSuccess?.();

      /* 가입 성공 시 자동 로그인 처리 */
      login({
        accessToken:  response.accessToken,
        refreshToken: response.refreshToken,
        user:         response.user,
      });

      /*
       * 회원가입 보너스 토스트.
       * 백엔드 AuthResponseBody.signupBonusPoints (SIGNUP_BONUS 정책 200P) 가
       * 0보다 크면 화면 상단에 "+200P 회원가입 보너스 리워드 획득!" 토스트 표시.
       * 트랜잭션 실패/정책 미지급 시에는 서버가 0을 반환하므로 자연스럽게 토스트 생략된다.
       */
      if (response.signupBonusPoints && response.signupBonusPoints > 0) {
        showReward(response.signupBonusPoints, '회원가입 보너스');
      }

      /*
       * PR-5 + 온보딩: returnTo 있으면 원래 경로로(복귀 우선),
       * 없으면 ROUTES.ONBOARDING 으로 (신규 가입자 미션).
       * useReturnTo(ROUTES.ONBOARDING) 한 번 호출로 두 케이스 통합 처리.
       */
      goAfterSignup();
    } catch (err) {
      /* 에러 코드별 사용자 친화적 메시지 분기 */
      if (err.code === 'A001') {
        /* 이메일 중복 — 로그인 안내 포함 */
        setServerError('이미 사용 중인 이메일입니다. 이미 가입하셨다면 로그인을 이용해주세요.');
      } else if (err.code === 'A002') {
        setServerError('이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.');
      } else if (err.code === 'A007') {
        setServerError('해당 이메일은 소셜 로그인으로 가입되어 있습니다. 소셜 로그인을 이용해주세요.');
      } else if (err.code === 'A013') {
        setServerError('탈퇴 후 30일 동안 동일 계정으로 재가입할 수 없습니다.');
      } else {
        setServerError(err.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    {termsModal && (
      <TermsModal type={termsModal} onClose={() => setTermsModal(null)} />
    )}
    <S.Form onSubmit={handleSubmit} noValidate>
      {/* 폼 제목 */}
      <S.Title>회원가입</S.Title>
      <S.Subtitle>몽글픽과 함께 영화 취향을 발견하세요</S.Subtitle>

      {/* 서버 에러 메시지 */}
      {serverError && <S.ErrorBanner>{serverError}</S.ErrorBanner>}

      {/* 이메일 입력 */}
      <S.Field>
        <S.Label htmlFor="signup-email">이메일</S.Label>
        <S.Input
          id="signup-email"
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

      {/* 닉네임 입력 */}
      <S.Field>
        <S.Label htmlFor="signup-nickname">닉네임</S.Label>
        <S.Input
          id="signup-nickname"
          type="text"
          $error={!!errors.nickname}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="2~20자, 한글/영문/숫자"
          autoComplete="nickname"
          disabled={isSubmitting}
        />
        {errors.nickname && <S.FieldError>{errors.nickname}</S.FieldError>}
      </S.Field>

      {/* 비밀번호 입력 + 강도 표시 바 */}
      <S.Field>
        <S.Label htmlFor="signup-password">비밀번호</S.Label>
        <S.Input
          id="signup-password"
          type="password"
          $error={!!errors.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="8자 이상, 영문+숫자 조합"
          autoComplete="new-password"
          disabled={isSubmitting}
        />
        {/* 비밀번호 강도 표시 바 — 입력이 있을 때만 렌더링 */}
        {password && (
          <S.StrengthWrap>
            <S.StrengthBar $strength={passwordStrength} />
            <S.StrengthLabel $strength={passwordStrength}>
              {STRENGTH_LABEL[passwordStrength]}
            </S.StrengthLabel>
          </S.StrengthWrap>
        )}
        {errors.password && <S.FieldError>{errors.password}</S.FieldError>}
      </S.Field>

      {/* 비밀번호 확인 입력 */}
      <S.Field>
        <S.Label htmlFor="signup-password-confirm">비밀번호 확인</S.Label>
        <S.Input
          id="signup-password-confirm"
          type="password"
          $error={!!errors.passwordConfirm}
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          placeholder="비밀번호를 다시 입력하세요"
          autoComplete="new-password"
          disabled={isSubmitting}
        />
        {errors.passwordConfirm && (
          <S.FieldError>{errors.passwordConfirm}</S.FieldError>
        )}
      </S.Field>

      {/* 약관 동의 */}
      <S.Field>
        {/* 전체 동의 */}
        <S.TermsAllRow onClick={handleAllCheck}>
          <S.Checkbox $checked={allChecked} />
          <S.TermsLabel $bold>전체 동의</S.TermsLabel>
        </S.TermsAllRow>

        {/* 개별 약관 */}
        <S.TermsList>
          {/* 필수 약관 */}
          <S.TermsRow>
            <S.Checkbox
              $checked={requiredTerm}
              $error={!!errors.requiredTerm}
              onClick={() => setRequiredTerm((v) => !v)}
            />
            <S.TermsLabel onClick={() => setRequiredTerm((v) => !v)}>
              서비스 이용약관
            </S.TermsLabel>
            <S.TermsViewButton type="button" onClick={() => setTermsModal('service')}>
              보기
            </S.TermsViewButton>
            <S.TermsBadge $required>필수</S.TermsBadge>
          </S.TermsRow>

          {/* 선택 약관 */}
          <S.TermsRow>
            <S.Checkbox
              $checked={optionTerm}
              onClick={() => setOptionTerm((v) => !v)}
            />
            <S.TermsLabel onClick={() => setOptionTerm((v) => !v)}>
              개인정보 수집 및 이용 동의
            </S.TermsLabel>
            <S.TermsViewButton type="button" onClick={() => setTermsModal('privacy')}>
              보기
            </S.TermsViewButton>
            <S.TermsBadge>선택</S.TermsBadge>
          </S.TermsRow>

          {/* 마케팅 동의 */}
          <S.TermsRow>
            <S.Checkbox
              $checked={marketingAgreed}
              onClick={() => setMarketingAgreed((v) => !v)}
            />
            <S.TermsLabel onClick={() => setMarketingAgreed((v) => !v)}>
              마케팅 정보 수신 동의
            </S.TermsLabel>
            <S.TermsViewButton type="button" onClick={() => setTermsModal('marketing')}>
              보기
            </S.TermsViewButton>
            <S.TermsBadge>선택</S.TermsBadge>
          </S.TermsRow>
        </S.TermsList>

        {errors.requiredTerm && (
          <S.FieldError>{errors.requiredTerm}</S.FieldError>
        )}
      </S.Field>

      {/* 가입 버튼 — 제출 시 "처리 중..." 텍스트 */}
      <S.SubmitButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? '처리 중...' : '가입하기'}
      </S.SubmitButton>

      {/* 소셜 로그인 구분선 */}
      <S.Divider><span>또는</span></S.Divider>

      {/*
        소셜 로그인 버튼.
        PR-5: OAuth 외부 리다이렉트 직전에 state.returnTo 를 sessionStorage 로 stash.
        LoginForm 과 동일 패턴 — useReturnTo 가 callback 페이지에서 꺼내 쓴다.
      */}
      <S.SocialList>
        <S.SocialButton
          type="button"
          $provider="google"
          onClick={() => {
            rememberReturnTo(location.state?.returnTo);
            window.location.href = buildOAuthUrl('google');
          }}
          disabled={isSubmitting}
        >
          Google로 시작하기
        </S.SocialButton>
        <S.SocialButton
          type="button"
          $provider="kakao"
          onClick={() => {
            rememberReturnTo(location.state?.returnTo);
            window.location.href = buildOAuthUrl('kakao');
          }}
          disabled={isSubmitting}
        >
          카카오로 시작하기
        </S.SocialButton>
        <S.SocialButton
          type="button"
          $provider="naver"
          onClick={() => {
            rememberReturnTo(location.state?.returnTo);
            window.location.href = buildOAuthUrl('naver');
          }}
          disabled={isSubmitting}
        >
          네이버로 시작하기
        </S.SocialButton>
      </S.SocialList>

      {/* 로그인 페이지 링크 — as={Link}로 react-router-dom 라우팅 유지 */}
      <S.Footer>
        이미 계정이 있으신가요?{' '}
        {/* PR-5: 가입 페이지 → 로그인 페이지 이동 시에도 state.returnTo 유지 */}
        <S.TextLink
          as={Link}
          to={ROUTES.LOGIN}
          state={location.state?.returnTo ? { returnTo: location.state.returnTo } : undefined}
        >로그인</S.TextLink>
      </S.Footer>
    </S.Form>
    </>
  );
}
