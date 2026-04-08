/**
 * AttendanceCalendar 스타일 정의 (styled-components).
 *
 * 출석 체크 섹션 — 통계, 보너스 태그, 달력 그리드, 결과 애니메이션, 체크 버튼.
 * bounceIn 애니메이션은 이 파일 내 로컬 keyframes로 정의한다.
 * media.js의 tablet/mobile 미디어쿼리를 활용한 반응형 레이아웃을 포함한다.
 */

import styled, { keyframes, css } from 'styled-components';
import { media } from '../../../shared/styles/media';

/* ── 출석 결과 등장 애니메이션 (CSS point-page-bounce-in 대체) ── */
const bounceIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  60% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

/**
 * 출석 체크 전체 콘텐츠 래퍼.
 * 세로 flex 레이아웃으로 각 섹션을 gap으로 구분한다.
 */
export const AttendanceContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

/**
 * 출석 통계 영역 (연속 출석 / 총 출석 가로 배치).
 * 모바일(480px 이하)에서는 세로로 전환된다.
 */
export const AttendanceStats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xl};

  ${media.mobile} {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

/** 개별 통계 아이템 (값 + 라벨 세로 배치). */
export const AttendanceStat = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

/** 통계 수치 — Primary 색상 + Bold. */
export const AttendanceStatValue = styled.span`
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.primary};
`;

/** 통계 라벨 — Muted 텍스트. */
export const AttendanceStatLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/**
 * 보너스 안내 태그 영역 (flex-wrap).
 */
export const BonusInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/**
 * 보너스 태그 컴포넌트.
 *
 * $variant prop으로 기본/highlight/premium 스타일을 구분한다.
 * - undefined: 기본 (회색 배경)
 * - 'highlight': 파랑(info) 계열
 * - 'premium': 노랑(warning) 계열
 *
 * @prop {'highlight'|'premium'|undefined} $variant - 태그 스타일 변형
 */
export const BonusTag = styled.span`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textXs};
  background-color: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  color: ${({ theme }) => theme.colors.textSecondary};

  /* highlight variant — info 계열 */
  ${({ $variant, theme }) =>
    $variant === 'highlight' &&
    css`
      background-color: ${theme.colors.infoBg};
      border-color: ${theme.colors.info};
      color: ${theme.colors.info};
    `}

  /* premium variant — warning 계열 */
  ${({ $variant, theme }) =>
    $variant === 'premium' &&
    css`
      background-color: ${theme.colors.warningBg};
      border-color: ${theme.colors.warning};
      color: ${theme.colors.warning};
    `}
`;

/**
 * 달력 전체 래퍼 (세로 flex + gap).
 */
export const Calendar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/** 달력 헤더 — 현재 월 표시, 중앙 정렬. */
export const CalendarHeader = styled.div`
  text-align: center;
  padding-bottom: ${({ theme }) => theme.spacing.sm};
`;

/** 달력 월 텍스트 — semibold. */
export const CalendarMonth = styled.span`
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

/**
 * 요일 라벨 행 — 7열 그리드.
 */
export const CalendarWeekdays = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${({ theme }) => theme.spacing.xs};
  text-align: center;
`;

/** 요일 라벨 텍스트 (일~토). */
export const CalendarWeekday = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.spacing.xs} 0;
`;

/**
 * 날짜 셀 그리드 — 7열 repeat.
 */
export const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${({ theme }) => theme.spacing.xs};
`;

/**
 * 날짜 셀 개별 컴포넌트.
 *
 * $isEmpty — 이전/다음 달 빈 셀 (투명 배경)
 * $isToday — 오늘 날짜 (Primary 테두리 하이라이트)
 * $isChecked — 출석 완료 (gradient 배경 + glow)
 *
 * @prop {boolean} $isEmpty - 빈 셀 여부
 * @prop {boolean} $isToday - 오늘 날짜 여부
 * @prop {boolean} $isChecked - 출석 완료 여부
 */
export const CalendarCell = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.colors.bgElevated};
  transition: all ${({ theme }) => theme.transitions.fast};
  min-height: 36px;

  /* 빈 셀 — 투명 배경 */
  ${({ $isEmpty }) =>
    $isEmpty &&
    css`
      background-color: transparent;
    `}

  /* 오늘 날짜 — Primary 테두리 */
  ${({ $isToday, theme }) =>
    $isToday &&
    css`
      border: 2px solid ${theme.colors.primary};
    `}

  /* 출석 완료 — gradient + glow */
  ${({ $isChecked, theme }) =>
    $isChecked &&
    css`
      background: linear-gradient(135deg, ${theme.colors.primaryLight}, rgba(6, 214, 160, 0.15));
      box-shadow: ${theme.shadows.glow};
    `}

  ${media.tablet} {
    min-height: 32px;
  }
`;

/** 날짜 숫자 텍스트. */
export const CalendarDay = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

/** 출석 완료 체크 아이콘 (&#10003;). */
export const CalendarCheckIcon = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.primary};
  line-height: 1;
`;

/**
 * 출석 결과 배너 — bounceIn 애니메이션.
 * success 배경 + 테두리로 강조한다.
 */
export const AttendanceResult = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.successBg};
  border: 1px solid ${({ theme }) => theme.colors.success};
  border-radius: ${({ theme }) => theme.radius.md};
  animation: ${bounceIn} 0.5s ease;
`;

/** 결과 포인트 텍스트 (+NP). */
export const AttendanceResultPoints = styled.span`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.success};
`;

/** 결과 스트릭 텍스트 (N일 연속 출석!). */
export const AttendanceResultText = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.success};
`;

/**
 * 출석 체크 버튼.
 *
 * 비활성(:disabled) 상태 — bgElevated 배경 + textMuted 색상.
 * 활성 호버 — primaryHover + shadow glow.
 */
export const AttendanceButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primaryHover};
    box-shadow: ${({ theme }) => theme.shadows.glow};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.bgElevated};
    color: ${({ theme }) => theme.colors.textMuted};
    cursor: not-allowed;
    box-shadow: none;
  }
`;
