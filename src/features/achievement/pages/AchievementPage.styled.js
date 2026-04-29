/**
 * AchievementPage styled-components 정의.
 *
 * 간격/레이아웃을 RoadmapPage(PlaylistPage)와 동일하게 맞춤.
 */

import styled, { css, keyframes } from 'styled-components';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

/** 페이지 컨테이너 */
export const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 32px 32px;
  animation: ${fadeInUp} 0.4s ease;
`;

/** 페이지 제목 */
export const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

/** 서브 제목 */
export const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 4px 0 32px;
`;

/** 요약 통계 바 */
export const StatsBar = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

/** 통계 아이템 */
export const StatItem = styled.div`
  padding: 16px 24px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  text-align: center;
  flex: 1;
  min-width: 100px;
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
  margin-top: 4px;
`;

/** 카테고리 필터 */
export const CategoryFilters = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

/** 카테고리 버튼 */
export const CategoryBtn = styled.button`
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active }) => ($active ? '#fff' : 'inherit')};
  font-size: ${({ theme }) => theme.typography.textSm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover { border-color: ${({ theme }) => theme.colors.primary}; }
`;

/** 업적 그리드 — CourseGrid와 동일 */
export const AchievementGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

/** 업적 카드 — CourseCard와 동일한 패딩/구조 */
export const AchievementCard = styled.div`
  padding: 28px 24px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 140px;
  transition: all ${({ theme }) => theme.transitions.base};
  opacity: ${({ $achieved }) => ($achieved ? 1 : 0.65)};

  ${({ $achieved, theme }) =>
    $achieved &&
    css`
      border-color: ${theme.colors.success}50;
      background: ${theme.colors.success}08;
    `}

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
  }
`;

/** 카드 상단 행 (아이콘 + 이름) — CourseHeaderRow와 동일 */
export const AchievementHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

/** 업적 아이콘 — CourseThumbnail과 동일 */
export const AchievementIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.bgElevated};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  overflow: hidden;
`;

export const AchievementIconImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

/** 이름 + 달성 배지 묶음 */
export const AchievementNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

/** 업적 이름 — CourseTitle과 동일 */
export const AchievementName = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

/** 달성 배지 */
export const AchievedBadge = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.success};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.success}20;
`;

/** 업적 설명 — CourseDesc와 동일 */
export const AchievementDesc = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/** 진행 정보 하단 — CourseMeta와 동일 */
export const AchievementMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: auto;
`;

/** 진행률 바 외부 */
export const ProgressBarOuter = styled.div`
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.bgElevated};
  overflow: hidden;
`;

/** 진행률 바 내부 */
export const ProgressBarInner = styled.div`
  height: 100%;
  border-radius: 2px;
  background: ${({ $complete, theme }) =>
    $complete ? theme.colors.success : theme.colors.primary};
  width: ${({ $percent }) => Math.min(100, $percent || 0)}%;
  transition: width 0.5s ease;
`;

/** 진행률 텍스트 */
export const ProgressText = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/** 빈 상태 */
export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 20px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
`;

/** 빈 상태 아이콘 */
export const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

/** 빈 상태 텍스트 */
export const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  margin: 0;
  line-height: 1.5;
`;

/** 스켈레톤 */
export const SkeletonCard = styled.div`
  height: ${({ $h }) => $h || 140}px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.bgSecondary};
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
