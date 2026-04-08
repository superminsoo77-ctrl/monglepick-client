/**
 * QuizPage styled-components 정의.
 *
 * 전체 페이지 레이아웃: 헤더 + 통계 바 + 퀴즈 카드 리스트.
 * AchievementPage 와 동일한 색상 토큰/간격을 사용해 일관성 유지.
 */

import styled, { keyframes } from 'styled-components';

/** 카드 진입 애니메이션 */
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

/** 스켈레톤 shimmer */
const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

/** 페이지 컨테이너 */
export const Container = styled.div`
  max-width: 840px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md};
  animation: ${fadeInUp} 0.4s ease;
`;

/** 페이지 상단 헤더 */
export const Header = styled.header`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

/** 페이지 제목 */
export const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.xs};
`;

/** 페이지 설명문 */
export const PageDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.55;
  margin: 0;
`;

/** 통계 요약 바 (AchievementPage 와 동일 톤) */
export const StatsBar = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
`;

/** 통계 개별 아이템 */
export const StatItem = styled.div`
  padding: 12px 20px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  text-align: center;
  flex: 1;
  min-width: 120px;
`;

/** 통계 수치 */
export const StatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.primary};
`;

/** 통계 라벨 */
export const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 2px;
`;

/** 퀴즈 카드 세로 리스트 */
export const QuizList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

/** 스켈레톤 카드 (로딩 중) */
export const SkeletonCard = styled.div`
  height: 220px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.bgSecondary} 0%,
    ${({ theme }) => theme.colors.bgHover ?? theme.colors.bgSecondary} 50%,
    ${({ theme }) => theme.colors.bgSecondary} 100%
  );
  background-size: 400px 100%;
  animation: ${shimmer} 1.6s linear infinite;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
`;

/** 에러 배너 */
export const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 14px 18px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.errorBg ?? '#fef2f2'};
  color: ${({ theme }) => theme.colors.error};
  border: 1px solid ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

/** 다시 시도 버튼 (에러 배너 내부) */
export const RetryButton = styled.button`
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.error};
  color: #ffffff;
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  border: none;
  cursor: pointer;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  &:hover {
    opacity: 0.85;
  }
`;

/** 빈 상태 래퍼 */
export const EmptyState = styled.div`
  text-align: center;
  padding: 64px 24px;
  background: ${({ theme }) => theme.colors.bgSecondary};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px dashed ${({ theme }) => theme.colors.borderDefault};
`;

/** 빈 상태 이모지 */
export const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
`;

/** 빈 상태 문구 */
export const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.6;
  margin: 0;
`;
