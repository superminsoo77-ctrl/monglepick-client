/**
 * BalanceCard 컴포넌트 styled-components 정의.
 *
 * 포인트 요약 카드 — gradient-accent 배경 + pulseGlow 애니메이션.
 *
 * 인라인 스타일 제거:
 *   - 등급(grade)별 배경색/글자색/테두리색 → $grade transient prop으로 매핑
 *   - 6등급(NORMAL/BRONZE/SILVER/GOLD/PLATINUM/DIAMOND, 팝콘 테마) 지원
 *   - DIAMOND(몽아일체)는 단일 색상 대신 무지개 그라디언트 배경
 *   - 색상 정의는 `shared/constants/grade.js` 단일 진실 원본에서 import
 */

import styled from 'styled-components';
import { pulseGlow } from '../../../shared/styles/animations';
import { media } from '../../../shared/styles/media';
import { GRADE_COLORS, DEFAULT_GRADE_CODE } from '../../../shared/constants/grade';

/** 등급 코드에 매핑되는 색상 엔트리 — 알 수 없는 코드는 NORMAL 로 fallback */
const resolveGrade = ($grade) =>
  GRADE_COLORS[$grade] || GRADE_COLORS[DEFAULT_GRADE_CODE];

/** 등급 prop에서 text/border color 값 반환 */
const gradeColor = ({ $grade }) => resolveGrade($grade).color;

/** 등급 prop에서 background 값 반환 — gradient 가 있으면 우선 */
const gradeBg = ({ $grade }) => {
  const entry = resolveGrade($grade);
  return entry.gradient || entry.bg;
};

/* 포인트 요약 섹션 — gradient-accent 배경 + pulseGlow */
export const SummarySection = styled.section`
  /* 3색 그라디언트 배경 */
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primaryLight} 0%,
    rgba(6, 214, 160, 0.1) 50%,
    rgba(239, 71, 111, 0.08) 100%
  );
  border-color: ${({ theme }) => theme.glass.border};
  border-width: 1px;
  /* pulseGlow 애니메이션 — 4s 무한 반복 */
  animation: ${pulseGlow} 4s ease-in-out infinite;
`;

/* 좌우 분할 카드 레이아웃 */
export const SummaryCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.lg};

  /* 모바일: 세로 배치 */
  ${media.tablet} {
    flex-direction: column;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

/* 좌측 — 잔액 정보 영역 */
export const SummaryLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

/* "보유 포인트" 라벨 */
export const SummaryLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`;

/* 잔액 숫자 — 대형 폰트 */
export const SummaryBalance = styled.p`
  font-size: ${({ theme }) => theme.typography.text4xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
  line-height: 1.2;

  /* 태블릿 */
  ${media.tablet} {
    font-size: ${({ theme }) => theme.typography.text3xl};
  }

  /* 모바일 */
  ${media.mobile} {
    font-size: ${({ theme }) => theme.typography.text2xl};
  }
`;

/* 잔액 단위 "P" */
export const SummaryUnit = styled.span`
  font-size: ${({ theme }) => theme.typography.text2xl};
  color: ${({ theme }) => theme.colors.primary};
  margin-left: ${({ theme }) => theme.spacing.xs};
`;

/* 총 획득 포인트 표시 */
export const SummaryEarned = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

/* 우측 — 등급 배지 + 충전 버튼 영역 */
export const SummaryRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing.md};

  /* 모바일: 가로 배치, 전체 너비 */
  ${media.tablet} {
    flex-direction: row;
    align-items: center;
    width: 100%;
    justify-content: space-between;
  }
`;

/* 등급 배지 — $grade prop으로 등급별 색상 적용 (팝콘 테마 한국어명) */
export const GradeBadge = styled.div`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  /* $grade prop 기반 등급 색상 (DIAMOND 는 gradient 배경) */
  background: ${gradeBg};
  color: ${gradeColor};
  border: 1px solid ${gradeColor};
  letter-spacing: 0.02em;
  /* 한글 라벨 — uppercase 제거 */
`;

/* 충전 버튼 — gradient-primary 배경 */
export const ChargeButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.gradients.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    box-shadow: ${({ theme }) => theme.glows.primary};
    transform: translateY(-1px);
  }
`;
