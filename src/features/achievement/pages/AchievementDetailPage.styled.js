/**
 * AchievementDetailPage styled-components 정의.
 *
 * 업적 상세 페이지 레이아웃.
 * AchievementPage.styled.js 와 동일한 디자인 시스템(theme 토큰) 사용.
 */

import styled, { keyframes } from 'styled-components';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

/** 페이지 컨테이너 */
export const Container = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 48px 32px 32px;
  animation: ${fadeInUp} 0.4s ease;

  @media (max-width: 480px) {
    padding: 32px 16px 24px;
  }
`;

/** 뒤로가기 링크 */
export const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 0;
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  cursor: pointer;
  margin-bottom: 16px;

  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`;

/** 스켈레톤 로더 — $h 로 높이 지정 */
export const Skeleton = styled.div`
  height: ${({ $h }) => $h || 120}px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.bgSecondary};
  margin-bottom: 16px;
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.5; }
  }
`;

/**
 * 헤더 카드 — 아이콘 + 제목/뱃지.
 * $achieved 가 true 이면 프라이머리 톤 강조.
 */
export const Header = styled.section`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 20px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ $achieved, theme }) =>
    $achieved ? `${theme.colors.primary}10` : theme.colors.bgSecondary};
  border: 1px solid
    ${({ $achieved, theme }) =>
      $achieved ? theme.colors.primary : theme.colors.borderDefault};
  margin-bottom: 16px;
`;

/** 아이콘 박스 — 업적 이모지/아이콘 표시 */
export const IconBox = styled.div`
  width: 72px;
  height: 72px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ $achieved, theme }) =>
    $achieved ? `${theme.colors.primary}22` : theme.colors.bgElevated};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  flex-shrink: 0;
  opacity: ${({ $achieved }) => ($achieved ? 1 : 0.6)};
  overflow: hidden;
`;

export const IconImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

/** 헤더 오른쪽 컨텐츠 블록 */
export const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`;

/** 업적 제목 */
export const Title = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

/** 뱃지 라인 */
export const BadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

/** 카테고리 뱃지 — 중립 톤 */
export const CategoryBadge = styled.span`
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.bgElevated};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
`;

/** 달성 완료 뱃지 — success 톤 */
export const AchievedBadge = styled.span`
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.success}22;
  color: ${({ theme }) => theme.colors.success};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
`;

/** 미달성 뱃지 — muted 톤 */
export const LockedBadge = styled.span`
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.bgElevated};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
`;

/** 섹션 카드 */
export const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  margin-bottom: 16px;
`;

/** 섹션 라벨 */
export const SectionLabel = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/** 본문 텍스트 */
export const BodyText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.6;
`;

/** 진행률 바 외부 — RoadmapPage와 동일 */
export const ProgressBarOuter = styled.div`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.bgElevated};
  overflow: hidden;
  margin-top: 4px;
`;

/** 진행률 바 내부 — $percent(0~100), $complete 시 success 톤 */
export const ProgressBarInner = styled.div`
  height: 100%;
  border-radius: 4px;
  background: ${({ $complete, theme }) =>
    $complete ? theme.colors.success : theme.colors.primary};
  width: ${({ $percent }) => Math.min(100, $percent || 0)}%;
  transition: width 0.5s ease;
`;

/** 진행률 수치 라인 */
export const ProgressRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

/** 진행 카운트 (X / Y) — $complete 시 success 톤 */
export const ProgressCount = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ $complete, theme }) =>
    $complete ? theme.colors.success : theme.colors.textPrimary};
`;

/** 퍼센트 수치 */
export const ProgressPercent = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/** 하단 정보 그리드 (보상/달성일) */
export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

/** 정보 카드 */
export const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  text-align: center;
`;

/** 정보 수치 (보상 포인트 등) */
export const InfoValue = styled.div`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.primary};
`;

/** 정보 라벨 */
export const InfoLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;
