/**
 * WorldcupPage styled-components 정의.
 *
 * 영화 이상형 월드컵: 설정 → 대결 → 결과 3단계 UI.
 */

import styled, { keyframes } from 'styled-components';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

const vsAppear = keyframes`
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
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
  text-align: center;
`;

/** 서브 제목 */
export const Subtitle = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.lg}px;
`;

/* ── 설정 화면 ── */

/** 설정 카드 */
export const SetupCard = styled.div`
  max-width: 480px;
  margin: 0 auto;
  padding: 32px;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: ${scaleIn} 0.3s ease;
`;

/** 설정 라벨 */
export const SetupLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  display: block;
  margin-bottom: 8px;
`;

/** 라운드 선택 그리드 */
export const RoundGrid = styled.div`
  display: flex;
  gap: 12px;
`;

/** 라운드 버튼 */
export const RoundBtn = styled.button`
  flex: 1;
  padding: 14px;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 2px solid ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.borderDefault};
  background: ${({ $active, theme }) =>
    $active ? `${theme.colors.primary}15` : 'transparent'};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

/** 장르 셀렉트 */
export const GenreSelect = styled.select`
  width: 100%;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textBase};
  font-family: inherit;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

/** 시작 버튼 */
export const StartBtn = styled.button`
  width: 100%;
  padding: 14px;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: none;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  cursor: pointer;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

/* ── 대결 화면 ── */

/** 라운드 정보 바 */
export const RoundInfo = styled.div`
  text-align: center;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

/** 라운드 배지 */
export const RoundBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  margin-right: 8px;
`;

/** 대결 영역 */
export const BattleArea = styled.div`
  display: flex;
  align-items: stretch;
  gap: 16px;
  animation: ${fadeInUp} 0.4s ease;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: center;
  }
`;

/** 영화 선택 카드 */
export const MovieCard = styled.div`
  flex: 1;
  max-width: 380px;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  overflow: hidden;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }

  &:active {
    transform: translateY(-2px);
  }
`;

/** 영화 포스터 */
export const MoviePoster = styled.img`
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
  display: block;
`;

/** 포스터 플레이스홀더 */
export const PosterPlaceholder = styled.div`
  width: 100%;
  aspect-ratio: 2/3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.bgElevated};
`;

/** 영화 정보 영역 */
export const MovieInfo = styled.div`
  padding: 16px;
  text-align: center;
`;

/** 영화 제목 */
export const MovieTitle = styled.h3`
  margin: 0 0 4px;
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

/** 영화 메타 */
export const MovieMeta = styled.div`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/** VS 배지 */
export const VsBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.error};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  align-self: center;
  animation: ${vsAppear} 0.5s ease;
  box-shadow: 0 0 20px ${({ theme }) => theme.colors.error}40;

  @media (max-width: 640px) {
    width: 44px;
    height: 44px;
    font-size: ${({ theme }) => theme.typography.textLg};
  }
`;

/* ── 결과 화면 ── */

/** 결과 컨테이너 */
export const ResultContainer = styled.div`
  text-align: center;
  animation: ${scaleIn} 0.5s ease;
`;

/** 우승 타이틀 */
export const WinnerTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.primary};
  margin: 0 0 ${({ theme }) => theme.spacing.lg}px;
`;

/** 우승 카드 */
export const WinnerCard = styled.div`
  max-width: 300px;
  margin: 0 auto ${({ theme }) => theme.spacing.xl}px;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 3px solid ${({ theme }) => theme.colors.primary};
  overflow: hidden;
  box-shadow: 0 0 30px ${({ theme }) => theme.colors.primary}30;
`;

/** 순위 목록 */
export const RankingList = styled.div`
  max-width: 500px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/** 순위 아이템 */
export const RankingItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
`;

/** 순위 번호 */
export const RankNumber = styled.span`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ $rank, theme }) => {
    if ($rank === 1) return '#fbbf24';
    if ($rank === 2) return '#9ca3af';
    if ($rank === 3) return '#b45309';
    return theme.colors.textMuted;
  }};
  min-width: 28px;
`;

/** 순위 영화 제목 */
export const RankTitle = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

/** 다시하기 / 공유 버튼 영역 */
export const ResultActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: ${({ theme }) => theme.spacing.xl}px;
`;

/** 결과 액션 버튼 */
export const ResultBtn = styled.button`
  padding: 12px 24px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: ${({ $variant }) => ($variant === 'outline' ? '1px solid' : 'none')};
  border-color: ${({ theme }) => theme.colors.borderDefault};
  background: ${({ $variant, theme }) =>
    $variant === 'outline' ? 'transparent' : theme.colors.primary};
  color: ${({ $variant, theme }) =>
    $variant === 'outline' ? theme.colors.textSecondary : '#fff'};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover { opacity: 0.85; }
`;

/** 이력 섹션 제목 */
export const HistoryTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: ${({ theme }) => theme.spacing.xxl}px 0 ${({ theme }) => theme.spacing.md}px;
`;

/** 빈 상태 */
export const EmptyState = styled.div`
  text-align: center;
  padding: 48px 20px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

/** 빈 상태 아이콘 */
export const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
`;

/** 빈 상태 텍스트 */
export const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  margin: 0;
`;
