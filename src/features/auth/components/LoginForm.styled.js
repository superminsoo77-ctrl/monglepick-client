/**
 * LoginForm 스타일 정의 (styled-components).
 *
 * glassmorphism 카드 + borderGlow 호버 + gradient-text 제목 +
 * 포커스 글로우 입력 필드 + $error prop 에러 상태 +
 * gradient 제출 버튼 + 소셜 그라데이션 구분선 + 소셜 버튼 3종.
 * fadeInUp 폼 등장, gradientShift 제목 애니메이션.
 */

import styled, { css } from 'styled-components';
import { fadeInUp } from '../../../shared/styles/animations';
import { gradientText } from '../../../shared/styles/mixins';
import { media } from '../../../shared/styles/media';

/**
 * 폼 컨테이너 — glass-card + borderGlow 호버 + fadeInUp 등장.
 * 최대 너비 420px, 세로 flex 레이아웃.
 */
export const Form = styled.form`
  width: 100%;
  max-width: 420px;
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: ${({ theme }) => theme.glass.blur};
  -webkit-backdrop-filter: ${({ theme }) => theme.glass.blur};
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.xxl};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  position: relative;
  z-index: 1;
  animation: ${fadeInUp} 0.5s ease forwards;
  /* hover 시 border-color만 transition으로 변경 (animation 덮어쓰기 금지 — fadeInUp 재실행 깜빡임 방지) */
  transition: border-color 1.5s ease;

  &:hover {
    border-color: rgba(6, 214, 160, 0.5);
  }

  /* 모바일 — 풀너비 + 패딩 축소 */
  ${media.mobile} {
    max-width: 100%;
    padding: ${({ theme }) => theme.spacing.lg};
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

/**
 * 폼 제목 — gradientText mixin (보라→시안→블루 + gradientShift).
 */
export const Title = styled.h2`
  ${gradientText}
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  text-align: center;
  margin: 0;
`;

/** 부제목 — secondary 텍스트 색상, 중앙 정렬. */
export const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  margin: 0;
  margin-top: calc(-1 * ${({ theme }) => theme.spacing.sm});
`;

/**
 * 서버 에러 배너 — error 배경 + 테두리.
 */
export const ErrorBanner = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.errorBg};
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.textSm};
  text-align: center;
`;

/** 입력 필드 그룹 — 라벨 + 인풋 + 에러 메시지 세로 배치. */
export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

/** 인풋 라벨 — medium 두께, secondary 색상. */
export const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/**
 * 입력 필드 — 포커스 시 glow-primary.
 *
 * $error prop이 true이면 error 색상 테두리 + error-bg 포커스 그림자를 적용한다.
 *
 * @prop {boolean} $error - 유효성 검사 에러 여부
 */
export const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.bgInput};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textBase};
  transition: border-color ${({ theme }) => theme.transitions.fast},
              box-shadow ${({ theme }) => theme.transitions.fast};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.glows.primary};
    outline: none;
  }

  /* 에러 상태 */
  ${({ $error, theme }) =>
    $error &&
    css`
      border-color: ${theme.colors.error};

      &:focus {
        box-shadow: 0 0 0 3px ${theme.colors.errorBg};
      }
    `}
`;

/** 필드 에러 메시지 — error 색상, xs 크기. */
export const FieldError = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.error};
`;

/**
 * 제출 버튼 — gradient 배경 + 호버 glow.
 * 비활성(:disabled) 시 opacity 0.6.
 */
export const SubmitButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.gradients.primary};
  color: white;
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  margin-top: ${({ theme }) => theme.spacing.sm};

  &:hover:not(:disabled) {
    box-shadow: ${({ theme }) => theme.glows.primary};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

/**
 * 테스트 유저 로그인 버튼 — 개발/테스트 환경용.
 * dashed 테두리 + 투명 배경, 호버 시 primary 색상으로 전환.
 */
export const TestLoginButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  border: 1px dashed ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
    /* hover bg — primaryLight 토큰으로 대체 */
    background: ${({ theme }) => theme.colors.primaryLight};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

/**
 * 소셜 구분선 — 그라데이션 좌우 라인 + 중앙 텍스트.
 * ::before / ::after 로 gradient 라인을 렌더링한다.
 */
export const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: ${({ theme }) => theme.spacing.md} 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.gradients.primary};
    opacity: 0.4;
  }

  span {
    padding: 0 ${({ theme }) => theme.spacing.md};
  }
`;

/** 소셜 버튼 묶음 — 세로 flex. */
export const SocialList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/**
 * 소셜 로그인 버튼 기본 스타일.
 *
 * $provider prop('google'|'kakao'|'naver')으로
 * 각 브랜드 색상을 적용한다.
 *
 * @prop {'google'|'kakao'|'naver'} $provider - OAuth 제공자
 */
export const SocialButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  text-align: center;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Google — 흰 배경, 어두운 텍스트 */
  ${({ $provider }) =>
    $provider === 'google' &&
    css`
      background-color: #fff;
      color: #333;
      border-color: #ddd;

      &:hover:not(:disabled) {
        background-color: #f5f5f5;
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.4);
      }
    `}

  /* 카카오 — 노란 배경, 어두운 텍스트 */
  ${({ $provider }) =>
    $provider === 'kakao' &&
    css`
      background-color: #fee500;
      color: #191919;
      border-color: #fee500;

      &:hover:not(:disabled) {
        background-color: #e6cf00;
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.4);
      }
    `}

  /* 네이버 — 초록 배경, 흰 텍스트 */
  ${({ $provider }) =>
    $provider === 'naver' &&
    css`
      background-color: #03c75a;
      color: #fff;
      border-color: #03c75a;

      &:hover:not(:disabled) {
        background-color: #02b351;
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.4);
      }
    `}
`;

/**
 * 비밀번호 찾기 링크 — 비밀번호 필드 아래 우측 정렬 작은 링크.
 */
export const ForgotPasswordButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  text-decoration: underline;
  text-align: right;
  align-self: flex-end;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  &:hover {
    opacity: 0.75;
  }
`;

/**
 * 뒤로가기 버튼 — 비밀번호 찾기 스텝에서 로그인으로 돌아갈 때 사용.
 */
export const BackButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

/**
 * 성공 배너 — 비밀번호 변경 완료 안내.
 */
export const SuccessBanner = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: rgba(6, 214, 160, 0.12);
  border: 1px solid rgba(6, 214, 160, 0.35);
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.success ?? '#06d6a0'};
  font-size: ${({ theme }) => theme.typography.textSm};
  text-align: center;
`;

/** 하단 안내 텍스트 (회원가입 링크 등). */
export const Footer = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  margin: 0;
`;

/**
 * 인라인 텍스트 링크 — primary 색상.
 * 호버 시 underline + 연보라 text-shadow.
 */
export const TextLink = styled.a`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: ${({ theme }) => theme.typography.fontMedium};

  &:hover {
    text-decoration: underline;
    /* text-shadow glow — theme 토큰으로 대체 */
    text-shadow: ${({ theme }) => theme.shadows.glow};
  }
`;
