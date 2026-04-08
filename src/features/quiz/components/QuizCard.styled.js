/**
 * QuizCard styled-components 정의.
 *
 * 퀴즈 1문제를 담는 카드 레이아웃: 헤더 + 문제 + 선택지 + 결과/액션.
 * 채점 이후에는 선택지 버튼이 정/오답에 따라 색상 하이라이트된다.
 */

import styled, { css, keyframes } from 'styled-components';

/** 결과 박스 등장 애니메이션 */
const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
`;

/**
 * 퀴즈 카드 전체 래퍼.
 * - 기본: 테두리만 있는 카드
 * - 채점 완료(`$solved`): 정/오답에 따라 왼쪽 accent 라인 색상 변경
 */
export const Card = styled.article`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  position: relative;
  overflow: hidden;
  transition: border-color ${({ theme }) => theme.transitions.base},
              box-shadow ${({ theme }) => theme.transitions.base};

  /* 왼쪽 accent 라인: 채점 전=기본, 정답=success, 오답=error */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${({ theme }) => theme.colors.primary};
    transition: background ${({ theme }) => theme.transitions.base};
  }

  ${({ $solved, $correct, theme }) =>
    $solved &&
    css`
      &::before {
        background: ${$correct ? theme.colors.success : theme.colors.error};
      }
    `}

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

/** 카드 헤더 — 번호와 리워드 배지 */
export const CardHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

/** 퀴즈 번호 라벨 (Q1, Q2...) */
export const QuizNumber = styled.span`
  display: inline-block;
  padding: 2px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  letter-spacing: 0.04em;
`;

/** 리워드 배지 (예: +10P) */
export const RewardBadge = styled.span`
  display: inline-block;
  padding: 2px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.warningBg};
  color: ${({ theme }) => theme.colors.warning};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontBold};
`;

/** 문제 텍스트 */
export const Question = styled.h2`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.55;
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  word-break: keep-all;
`;

/** 선택지 컨테이너 */
export const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

/**
 * 선택지 버튼.
 *
 * 상태:
 * - 기본: 테두리만
 * - $selected: primary 테두리 + 연한 배경
 * - $correct: success 배경 (정답 제출 후 해당 선택지)
 * - $wrong: error 배경 (오답 제출 후 해당 선택지)
 * - disabled: opacity + 커서
 */
export const OptionButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.bgInput};
  border: 1.5px solid ${({ theme }) => theme.colors.borderDefault};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textSm};
  text-align: left;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
              border-color ${({ theme }) => theme.transitions.fast},
              transform ${({ theme }) => theme.transitions.fast};

  /* 선택됨 — 아직 채점 전 */
  ${({ $selected, theme }) =>
    $selected &&
    css`
      border-color: ${theme.colors.primary};
      background: ${theme.colors.primaryLight};
    `}

  /* 채점 후 정답 */
  ${({ $correct, theme }) =>
    $correct &&
    css`
      border-color: ${theme.colors.success};
      background: ${theme.colors.successBg};
      color: ${theme.colors.success};
    `}

  /* 채점 후 오답 */
  ${({ $wrong, theme }) =>
    $wrong &&
    css`
      border-color: ${theme.colors.error};
      background: ${theme.colors.errorBg};
      color: ${theme.colors.error};
    `}

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

/** 선택지 번호 (1, 2, 3, 4) */
export const OptionNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.bgTertiary};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  flex-shrink: 0;
`;

/** 선택지 텍스트 */
export const OptionText = styled.span`
  flex: 1;
  word-break: keep-all;
  line-height: 1.45;
`;

/** 에러 메시지 (로그인 필요 등) */
export const ErrorMsg = styled.p`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.errorBg};
  border: 1px solid ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 8px 12px;
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
`;

/**
 * 채점 결과 박스.
 * 정/오답에 따라 배경색이 달라지며 slideDown 애니메이션으로 등장.
 */
export const ResultBox = styled.div`
  padding: 14px 16px;
  border-radius: ${({ theme }) => theme.radius.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  animation: ${slideDown} 0.25s ease;

  background: ${({ $correct, theme }) =>
    $correct ? theme.colors.successBg : theme.colors.errorBg};
  border: 1px solid
    ${({ $correct, theme }) =>
      $correct ? theme.colors.success : theme.colors.error};
`;

/** 결과 제목 (정답/오답) */
export const ResultTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 6px;
`;

/** 결과 해설 */
export const ResultExplanation = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.55;
  margin: 0;
  word-break: keep-all;
`;

/** 리워드 획득 배너 */
export const RewardEarned = styled.div`
  display: inline-block;
  margin-top: 10px;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $muted, theme }) =>
    $muted ? theme.colors.bgTertiary : theme.colors.warning};
  color: ${({ $muted, theme }) =>
    $muted ? theme.colors.textMuted : '#ffffff'};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontBold};
`;

/** 액션 버튼 정렬 영역 */
export const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/** 정답 제출 버튼 */
export const SubmitButton = styled.button`
  padding: 10px 24px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.primary};
  color: #ffffff;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  border: none;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
              opacity ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

/** 다시 풀기 버튼 */
export const RetryButton = styled.button`
  padding: 10px 24px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.bgSecondary};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;
