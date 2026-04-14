/**
 * RoadmapPage styled-components 정의.
 *
 * 영화 학습 로드맵: 코스 목록 + 코스 상세 (영화 체크리스트).
 * 목록 카드 레이아웃 및 간격은 PlaylistPage와 동일하게 맞춤.
 */

import styled, { keyframes } from 'styled-components';

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

/** 탭 영역 */
export const Tabs = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
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

  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`;

/** 진행 중 배지 */
export const InProgressBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
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

/** 코스 그리드 — Playlist Grid와 동일 */
export const CourseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

/** 코스 카드 — Playlist Card와 동일한 패딩/구조 */
export const CourseCard = styled.div`
  padding: 28px 24px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 140px;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
  }
`;

/** 코스 카드 상단 행 (아이콘 + 제목) */
export const CourseHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

/** 코스 아이콘 (썸네일 대체 — 작은 이모지 뱃지) */
export const CourseThumbnail = styled.div`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.bgElevated};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
`;

/** 코스 제목 — Playlist CardTitle과 동일 */
export const CourseTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

/** 코스 설명 — Playlist CardDesc와 동일 */
export const CourseDesc = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/** 코스 메타 (영화 수, 난이도) — Playlist CardMeta와 동일 */
export const CourseMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: auto;
`;

/** 난이도 배지 */
export const DifficultyBadge = styled.span`
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  background: ${({ $level, theme }) => {
    if ($level === 'beginner') return `${theme.colors.success}20`;
    if ($level === 'intermediate') return `${theme.colors.warning}20`;
    return `${theme.colors.error}20`;
  }};
  color: ${({ $level, theme }) => {
    if ($level === 'beginner') return theme.colors.success;
    if ($level === 'intermediate') return theme.colors.warning;
    return theme.colors.error;
  }};
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
  background: ${({ $percent, theme }) =>
    $percent >= 100 ? theme.colors.success : theme.colors.primary};
  width: ${({ $percent }) => Math.min(100, $percent || 0)}%;
  transition: width 0.5s ease;
`;

/* ── 상세 뷰 ── */

/** 뒤로가기 링크 — Playlist BackLink와 동일 */
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

/** 상세 헤더 */
export const DetailHeader = styled.div`
  margin-bottom: 32px;
`;

/** 상세 진행 상황 */
export const DetailProgress = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
`;

/** 진행 텍스트 */
export const ProgressText = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
`;

/** 시작 버튼 */
export const StartBtn = styled.button`
  padding: 10px 24px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: none;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: opacity ${({ theme }) => theme.transitions.fast};
  margin-top: 12px;

  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

/** 영화 체크리스트 */
export const MovieList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/** 영화 아이템 */
export const MovieItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

/** 시청 인증 버튼 */
export const VerifyBtn = styled.button`
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1.5px solid ${({ $done, theme }) =>
    $done ? theme.colors.success : theme.colors.primary};
  background: ${({ $done, theme }) =>
    $done ? `${theme.colors.success}18` : 'transparent'};
  color: ${({ $done, theme }) =>
    $done ? theme.colors.success : theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  white-space: nowrap;
  flex-shrink: 0;
  cursor: ${({ $done }) => ($done ? 'default' : 'pointer')};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:not(:disabled):hover {
    background: ${({ theme }) => theme.colors.primary};
    color: #fff;
  }

  &:disabled {
    opacity: 1;
  }
`;

/** 영화 포스터 (작은) */
export const MoviePoster = styled.img`
  width: 40px;
  height: 60px;
  border-radius: ${({ theme }) => theme.radius.sm};
  object-fit: cover;
  flex-shrink: 0;
`;

/** 영화 포스터 플레이스홀더 */
export const MoviePosterPlaceholder = styled.div`
  width: 40px;
  height: 60px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bgElevated};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
`;

/** 영화 정보 */
export const MovieInfo = styled.div`
  flex: 1;
  min-width: 0;
  cursor: pointer;

  &:hover h4 { color: ${({ theme }) => theme.colors.primary}; }
`;

/** 영화 제목 */
export const MovieTitle = styled.h4`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textPrimary};
  transition: color ${({ theme }) => theme.transitions.fast};
`;

/** 영화 메타 */
export const MovieMeta = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 2px;
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

/* ── 도장깨기 인증 리뷰 모달 (미사용, 보존) ── */

export const ReviewOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
`;

export const ReviewPanel = styled.div`
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 28px 24px 20px;
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const ReviewTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const ReviewMovieName = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.primary};
`;

export const ReviewHint = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const ReviewTextarea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ theme }) => theme.colors.bgElevated};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textSm};
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

export const ReviewBtns = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
`;

export const ReviewBtn = styled.button`
  padding: 9px 20px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: none;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  background: ${({ $variant, theme }) =>
    $variant === 'cancel' ? theme.colors.bgElevated : theme.colors.primary};
  color: ${({ $variant, theme }) =>
    $variant === 'cancel' ? theme.colors.textSecondary : '#fff'};
  border: 1px solid ${({ $variant, theme }) =>
    $variant === 'cancel' ? theme.colors.borderDefault : 'transparent'};

  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
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
