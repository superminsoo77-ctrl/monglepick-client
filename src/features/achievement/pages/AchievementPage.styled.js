/**
 * AchievementPage styled-components 정의.
 *
 * 업적/도장깨기 페이지: 탭 + 업적 그리드 + 도장깨기 카드.
 */

import styled, { css, keyframes } from 'styled-components';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

/** 페이지 컨테이너 */
export const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg}px ${({ theme }) => theme.spacing.md}px;
  animation: ${fadeInUp} 0.4s ease;
`;

/** 페이지 제목 */
export const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.md}px;
`;

/** 요약 통계 바 */
export const StatsBar = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
  flex-wrap: wrap;
`;

/** 통계 아이템 */
export const StatItem = styled.div`
  padding: 12px 20px;
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
  margin-top: 2px;
`;

/** 탭 영역 */
export const Tabs = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderDefault};
`;

/** 탭 버튼 */
export const Tab = styled.button`
  padding: 10px 20px;
  border: none;
  background: none;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ $active, theme }) =>
    $active ? theme.typography.fontSemibold : theme.typography.fontNormal};
  cursor: pointer;
  border-bottom: 2px solid ${({ $active, theme }) =>
    $active ? theme.colors.primary : 'transparent'};
  transition: all ${({ theme }) => theme.transitions.fast};
  margin-bottom: -1px;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

/** 카테고리 필터 */
export const CategoryFilters = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  flex-wrap: wrap;
`;

/** 카테고리 버튼 */
export const CategoryBtn = styled.button`
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active }) => ($active ? '#fff' : 'inherit')};
  font-size: ${({ theme }) => theme.typography.textXs};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover { border-color: ${({ theme }) => theme.colors.primary}; }
`;

/** 업적 그리드 */
export const AchievementGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
`;

/** 업적 카드 */
export const AchievementCard = styled.div`
  padding: 16px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  display: flex;
  gap: 12px;
  align-items: flex-start;
  opacity: ${({ $achieved }) => ($achieved ? 1 : 0.6)};
  transition: all ${({ theme }) => theme.transitions.base};

  ${({ $achieved, theme }) =>
    $achieved &&
    css`
      border-color: ${theme.colors.success}50;
      background: ${theme.colors.success}08;
    `}

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

/** 업적 아이콘 */
export const AchievementIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.bgElevated};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
`;

/** 업적 정보 */
export const AchievementInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

/** 업적 이름 */
export const AchievementName = styled.div`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 2px;
`;

/** 업적 설명 */
export const AchievementDesc = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.4;
  margin-bottom: 8px;
`;

/** 진행률 바 외부 */
export const ProgressBarOuter = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: ${({ theme }) => theme.colors.bgElevated};
  overflow: hidden;
`;

/** 진행률 바 내부 */
export const ProgressBarInner = styled.div`
  height: 100%;
  border-radius: 3px;
  background: ${({ $complete, theme }) =>
    $complete ? theme.colors.success : theme.colors.primary};
  width: ${({ $percent }) => Math.min(100, $percent)}%;
  transition: width 0.5s ease;
`;

/** 진행률 텍스트 */
export const ProgressText = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 4px;
  text-align: right;
`;

/** 달성 배지 */
export const AchievedBadge = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.success};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
`;

/* ── 도장깨기 ── */

/** 도장깨기 목록 */
export const StampList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

/** 도장깨기 카드 */
export const StampCard = styled.div`
  padding: 20px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

/** 도장깨기 헤더 */
export const StampHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

/** 도장깨기 제목 */
export const StampTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

/** 도장깨기 보상 */
export const StampReward = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
`;

/** 도장깨기 설명 */
export const StampDesc = styled.p`
  margin: 0 0 12px;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
`;

/** 도장 그리드 (영화 아이콘) */
export const StampGrid = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

/** 개별 도장 */
export const Stamp = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 2px solid ${({ $completed, theme }) =>
    $completed ? theme.colors.success : theme.colors.borderDefault};
  background: ${({ $completed, theme }) =>
    $completed ? `${theme.colors.success}15` : theme.colors.bgElevated};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  position: relative;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: scale(1.05);
  }
`;

/** 도장 체크 마크 */
export const StampCheck = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.success};
  color: #fff;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/** 도장 영화 제목 (툴팁용) */
export const StampLabel = styled.div`
  font-size: 9px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 56px;
`;

/** 빈 상태 */
export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
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
  height: ${({ $h }) => $h || 80}px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.bgSecondary};
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
