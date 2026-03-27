/**
 * "둘이 영화 고르기" 메인 페이지.
 *
 * 스텝 기반 위자드 플로우:
 *   Step 0 — 첫 번째 영화 선택 (몽글이 인사)
 *   Step 1 — 두 번째 영화 선택 → 두 영화 확인 + 시작 버튼
 *   Step 2 — AI 분석 진행 중 (몽글이 생각 중)
 *   Step 3 — 추천 결과 (몽글이 축하)
 *
 * 한 화면에 하나의 task만 보여줘서 사용자가 집중할 수 있도록 한다.
 * SPA 특성을 활용해 부드러운 스텝 전환 애니메이션을 적용한다.
 */

import { useMemo, Fragment } from 'react';
import styled, { css } from 'styled-components';
import { useMatch } from '../hooks/useMatch';
import useAuthStore from '../../../shared/stores/useAuthStore';
import MovieSelector from '../components/MovieSelector';
import SharedFeaturesBadge from '../components/SharedFeaturesBadge';
import MatchResultCard from '../components/MatchResultCard';
import MonggleCharacter from '../../../shared/components/MonggleCharacter/MonggleCharacter';
import { formatRating } from '../../../shared/utils/formatters';
/* 공유 디자인 시스템 */
import { fadeInUp, scaleIn, floatUpDown, pulseGlow, borderGlow } from '../../../shared/styles/animations';
import { glassCard, gradientText } from '../../../shared/styles/mixins';
import { media } from '../../../shared/styles/media';

/* ============================================================
 * 배경 장식 — HomePage 패턴 참조
 * ============================================================ */

/** 페이지 전체 래퍼 — 배경 orb 기준점 */
const PageContainer = styled.main`
  position: relative;
  max-width: 860px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xxl};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  min-height: calc(100vh - 180px);
  overflow: hidden;

  ${media.tablet} {
    padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  }
`;

/** Orb 공통 베이스 */
const orbBase = css`
  position: absolute;
  border-radius: ${({ theme }) => theme.radius.full};
  filter: blur(80px);
  pointer-events: none;
  ${media.tablet} { width: 160px; height: 160px; }
`;

/** 배경 보라색 Orb — 좌상단 */
const BgOrb1 = styled.div`
  ${orbBase}
  top: 5%;
  left: 5%;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(124, 108, 240, 0.18) 0%, transparent 70%);
  animation: ${floatUpDown} 8s ease-in-out infinite;
`;

/** 배경 시안 Orb — 우하단 */
const BgOrb2 = styled.div`
  ${orbBase}
  bottom: 10%;
  right: 5%;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(6, 214, 160, 0.12) 0%, transparent 70%);
  animation: ${floatUpDown} 10s ease-in-out infinite 2s;
`;

/** 중앙 글로우 */
const CenterGlow = styled.div`
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(124, 108, 240, 0.08) 0%, transparent 70%);
  pointer-events: none;
  ${media.tablet} { width: 300px; height: 300px; }
`;

/** 콘텐츠 레이어 — orb 위에 표시 */
const ContentLayer = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

/* ============================================================
 * 스텝 인디케이터
 * ============================================================ */

/** 스텝 도트 컨테이너 */
const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: ${({ theme }) => theme.glass.blur};
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.full};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

/** 개별 도트 */
const StepDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transition: all 300ms ease;

  ${({ $active, $completed, theme }) =>
    $active
      ? css`
          background: ${theme.gradients.primary};
          box-shadow: 0 0 8px rgba(124, 108, 240, 0.6);
        `
      : $completed
        ? css`background: ${theme.colors.success};`
        : css`background: ${theme.colors.borderDefault};`}
`;

/** 도트 사이 연결선 */
const StepLine = styled.div`
  width: 24px;
  height: 2px;
  transition: background 300ms ease;
  background: ${({ $completed, theme }) =>
    $completed ? theme.colors.success : theme.colors.borderDefault};

  ${media.mobile} { width: 16px; }
`;

/* ============================================================
 * 공통 Styled Components
 * ============================================================ */

/**
 * 페이지 제목 "둘이 영화 고르기".
 * Step 0에서는 크게, 이후 스텝에서는 작게 표시한다.
 */
const PageTitle = styled.h1`
  margin: 0;
  font-weight: ${({ theme }) => theme.typography.fontBold};
  ${gradientText}
  text-align: center;
  transition: font-size 300ms ease;
  font-size: ${({ $compact, theme }) => ($compact ? theme.typography.textLg : theme.typography.text3xl)};

  ${media.tablet} {
    font-size: ${({ $compact, theme }) => ($compact ? theme.typography.textBase : theme.typography.text2xl)};
  }
`;

/** 각 스텝의 콘텐츠 래퍼 — 페이드인 애니메이션 */
const StepWrapper = styled.div`
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  animation: ${fadeInUp} 0.5s ease both;
`;

/** 스텝 안내 텍스트 (h2) — gradientText 적용 */
const StepHeading = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  ${gradientText}
  text-align: center;

  ${media.tablet} {
    font-size: ${({ theme }) => theme.typography.textLg};
  }
`;

/** 스텝 보조 설명 */
const StepDesc = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textBase};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  line-height: ${({ theme }) => theme.typography.leadingRelaxed};

  ${media.tablet} {
    font-size: ${({ theme }) => theme.typography.textSm};
  }
`;

/** 몽글이 캐릭터 표시 영역 */
const MonggleArea = styled.div`
  display: flex;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.sm} 0;
`;

/** MovieSelector를 감싸는 영역 — z-index 확보 (드롭다운이 글래스카드 밖으로) */
const SelectorArea = styled.div`
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 2;
`;

/** 주요 액션 버튼 — 그라디언트 + pulseGlow */
const ActionButton = styled.button`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xxl};
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  border: none;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.gradients.primary};
  color: #fff;
  cursor: pointer;
  transition: transform 100ms, box-shadow 200ms;
  animation: ${pulseGlow} 2.5s ease-in-out infinite;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.glows.primary};
  }
  &:active {
    transform: translateY(0);
  }
`;

/** 보조 액션 버튼 (취소 등) */
const SecondaryButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.xl};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  color: ${({ theme }) => theme.colors.textMuted};
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.full};
  cursor: pointer;
  transition: color 200ms, border-color 200ms;

  &:hover {
    color: ${({ theme }) => theme.colors.error};
    border-color: ${({ theme }) => theme.colors.error};
  }
`;

/** 에러 배너 */
const ErrorBanner = styled.div`
  width: 100%;
  max-width: 500px;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.errorBg};
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: ${({ theme }) => theme.radius.lg};
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.textSm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  animation: ${fadeInUp} 0.3s ease both;
`;

/* ============================================================
 * Step 0 — 기능 소개 미니 카드
 * ============================================================ */

/** 하단 기능 소개 3개 카드 그리드 */
const FeaturePreview = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  max-width: 480px;
  margin-top: ${({ theme }) => theme.spacing.sm};

  ${media.mobile} {
    grid-template-columns: 1fr;
    max-width: 280px;
  }
`;

/** 기능 소개 개별 카드 */
const FeatureCard = styled.div`
  ${glassCard}
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  text-align: center;
  animation: ${fadeInUp} 0.5s ease both;
  animation-delay: ${({ $delay }) => $delay || '0'}s;
`;

/** 기능 아이콘 */
const FeatureIcon = styled.span`
  font-size: 1.5rem;
`;

/** 기능 라벨 */
const FeatureLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

/* ============================================================
 * Step 1 — 선택된 영화 카드 (칩 대체)
 * ============================================================ */

/** 첫 번째 선택 영화를 보여주는 글래스 카드 */
const SelectedMovieCard = styled.div`
  ${glassCard}
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
  animation: ${scaleIn} 0.4s ease both;
  width: 100%;
  max-width: 420px;
`;

/** 선택 카드 내 포스터 */
const CardPoster = styled.img`
  width: 40px;
  height: 60px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bgSecondary};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  flex-shrink: 0;
`;

/** 선택 카드 정보 영역 */
const CardInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

/** 선택 카드 제목 */
const CardTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/** 선택 카드 메타 */
const CardMeta = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/** 선택 카드 변경 버튼 */
const CardChangeBtn = styled.button`
  flex-shrink: 0;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.full};
  padding: 4px 12px;
  cursor: pointer;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

/* ============================================================
 * Step 1 (Ready) — 두 영화 페어 디스플레이
 * ============================================================ */

/** 페어 전체를 감싸는 글래스 카드 */
const PairDisplayCard = styled.div`
  ${glassCard}
  padding: ${({ theme }) => theme.spacing.xl};
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  animation: ${scaleIn} 0.4s ease both;
`;

/** 두 영화를 나란히 보여주는 페어 영역 */
const MoviePair = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.lg};

  ${media.mobile} {
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

/** 페어 내 개별 영화 카드 */
const PairCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  text-align: center;
`;

/** 페어 카드 포스터 — glow 효과 추가 */
const PairPoster = styled.img`
  width: 120px;
  height: 180px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg}, 0 0 20px rgba(124, 108, 240, 0.15);
  background: ${({ theme }) => theme.colors.bgSecondary};
  transition: transform ${({ theme }) => theme.transitions.base};

  &:hover {
    transform: scale(1.03);
  }

  ${media.mobile} {
    width: 100px;
    height: 150px;
  }
`;

/** 페어 카드 영화 제목 */
const PairTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** 페어 카드 메타 */
const PairMeta = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/** 페어 카드 "변경" 버튼 */
const PairChangeBtn = styled.button`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  transition: color 150ms;
  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`;

/** "VS" 원형 글래스 배지 커넥터 */
const PairConnectorBadge = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: ${({ theme }) => theme.glass.blur};
  border: 1px solid ${({ theme }) => theme.glass.border};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  align-self: center;
  margin-top: 60px;
  animation: ${pulseGlow} 2.5s ease-in-out infinite;
  user-select: none;

  ${media.mobile} {
    width: 36px;
    height: 36px;
    margin-top: 48px;
  }
`;

/** VS 텍스트 */
const VsText = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  ${gradientText}
`;

/* ============================================================
 * Step 2 — 분석 진행 상태
 * ============================================================ */

/** 분석 카드 — 글래스 카드로 감싸기 */
const AnalysisCard = styled.div`
  ${glassCard}
  padding: ${({ theme }) => theme.spacing.xl};
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  animation: ${fadeInUp} 0.5s ease both;
`;

/** 진행 상태 텍스트 */
const StatusText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  text-shadow: 0 0 12px rgba(124, 108, 240, 0.3);
`;

/** 전체 진행률 바 래퍼 */
const TotalProgressBar = styled.div`
  width: 100%;
  max-width: 360px;
`;

/** 진행률 바 트랙 (배경) */
const ProgressTrack = styled.div`
  height: 6px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border-radius: ${({ theme }) => theme.radius.full};
  overflow: hidden;
`;

/** 진행률 바 채움 — gradient + glow */
const ProgressFill = styled.div`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  background: ${({ theme }) => theme.gradients.primary};
  border-radius: ${({ theme }) => theme.radius.full};
  transition: width 600ms ease;
  box-shadow: 0 0 8px rgba(124, 108, 240, 0.4);
`;

/** 진행률 퍼센트 텍스트 */
const ProgressPercent = styled.div`
  text-align: right;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 4px;
`;

/** 진행 단계 그리드 — 3열 */
const ProgressStepGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;

  ${media.mobile} {
    grid-template-columns: repeat(2, 1fr);
  }
`;

/** 개별 진행 단계 카드 — 미니 글래스 카드 */
const ProgressStepCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: ${({ theme }) => theme.glass.blur};
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textXs};
  transition: border-color 300ms;

  ${({ $completed, theme }) =>
    $completed &&
    css`border-color: rgba(74, 222, 128, 0.3); color: ${theme.colors.success};`}

  ${({ $current }) =>
    $current &&
    css`animation: ${borderGlow} 2s ease-in-out infinite;`}

  ${({ $future }) =>
    $future &&
    css`opacity: 0.45;`}
`;

/** 단계 아이콘 */
const StepIcon = styled.span`
  flex-shrink: 0;
  font-size: ${({ theme }) => theme.typography.textXs};
`;

/* ============================================================
 * Step 3 — 결과
 * ============================================================ */

/** 결과 상단 Hero — 글래스 카드 */
const ResultHero = styled.div`
  ${glassCard}
  padding: ${({ theme }) => theme.spacing.xl};
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  animation: ${scaleIn} 0.5s ease both;
`;

/** 결과 카드 목록 래퍼 */
const ResultsGrid = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  animation: ${fadeInUp} 0.6s ease 0.3s both;
`;

/* ============================================================
 * 헬퍼
 * ============================================================ */

/** TMDB 포스터 URL 생성 */
function getPosterUrl(path, size = 'w185') {
  if (!path) return 'https://placehold.co/120x180/1a1a2e/666?text=No';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

/** Agent phase 코드 → 사용자 레이블 매핑 */
const PHASE_LABELS = {
  movie_loader: '영화 정보 로드',
  feature_extractor: '공통점 분석',
  query_builder: '검색 쿼리 생성',
  rag_retriever: '비슷한 영화 검색',
  match_scorer: '매치 점수 계산',
  explanation_generator: '추천 이유 생성',
};

const phaseEntries = Object.entries(PHASE_LABELS);

/* ============================================================
 * 메인 컴포넌트
 * ============================================================ */

export default function MatchPage() {
  /* Zustand 인증 스토어에서 사용자 ID 가져오기 */
  const user = useAuthStore((s) => s.user);
  const userId = user?.userId || user?.id || '';

  /* Match 상태 + 액션 */
  const {
    selectedMovie1,
    selectedMovie2,
    sharedFeatures,
    matchResults,
    currentStatus,
    completedPhases,
    isLoading,
    error,
    selectMovie1,
    selectMovie2,
    clearMovie1,
    clearMovie2,
    startMatch,
    cancelRequest,
    reset,
  } = useMatch({ userId });

  /* ── 현재 스텝 계산 ── */
  const step = useMemo(() => {
    if (matchResults.length > 0 || sharedFeatures) return 3;
    if (isLoading) return 2;
    if (selectedMovie1) return 1;
    return 0;
  }, [matchResults.length, sharedFeatures, isLoading, selectedMovie1]);

  /* ── 진행률 퍼센트 (Step 2) ── */
  const progressPercent = useMemo(() => {
    if (phaseEntries.length === 0) return 0;
    return Math.round((completedPhases.length / phaseEntries.length) * 100);
  }, [completedPhases.length]);

  /* ── 핸들러 ── */
  const handleStart = () => {
    if (selectedMovie1 && selectedMovie2 && !isLoading) startMatch();
  };
  const handleChangeMovie1 = () => { clearMovie1(); clearMovie2(); };
  const handleChangeMovie2 = () => { clearMovie2(); };
  const handleReset = () => { reset(); };

  /* ── 영화 메타 정보 포맷 ── */
  const formatMovieMeta = (movie) => {
    if (!movie) return '';
    const year = movie.release_year || movie.release_date?.slice(0, 4) || '';
    const rating = movie.rating || movie.vote_average;
    const parts = [];
    if (year) parts.push(year);
    if (rating) parts.push(`★ ${formatRating(rating)}`);
    return parts.join(' · ');
  };

  return (
    <PageContainer>
      {/* ── 배경 장식 ── */}
      <BgOrb1 aria-hidden="true" />
      <BgOrb2 aria-hidden="true" />
      <CenterGlow aria-hidden="true" />

      <ContentLayer>
        {/* ── 페이지 제목 ── */}
        <PageTitle $compact={step > 0}>둘이 영화 고르기</PageTitle>

        {/* ── 스텝 인디케이터 ── */}
        <StepIndicator>
          {[0, 1, 2, 3].map((i) => (
            <Fragment key={i}>
              {i > 0 && <StepLine $completed={step > i - 1} />}
              <StepDot $active={step === i} $completed={step > i} />
            </Fragment>
          ))}
        </StepIndicator>

        {/* ── 에러 배너 ── */}
        {error && (
          <ErrorBanner role="alert">
            <span aria-hidden="true">&#9888;</span>
            <span>{error}</span>
          </ErrorBanner>
        )}

        {/* ════════════════════════════════════════════
         *  Step 0 — 첫 번째 영화 선택
         * ════════════════════════════════════════════ */}
        {step === 0 && (
          <StepWrapper key="step-0">
            <MonggleArea>
              <MonggleCharacter animation="waving" size="lg" />
            </MonggleArea>
            <StepHeading>첫 번째 영화를 골라주세요</StepHeading>
            <StepDesc>
              두 영화를 선택하면 AI가 공통점을 분석하여
              <br />
              함께 볼 영화를 추천해드려요
            </StepDesc>
            <SelectorArea>
              <MovieSelector
                label=""
                selectedMovie={selectedMovie1}
                onSelect={selectMovie1}
                onClear={clearMovie1}
              />
            </SelectorArea>

            {/* 기능 소개 미니 카드 */}
            <FeaturePreview>
              <FeatureCard $delay="0.3">
                <FeatureIcon>🎬</FeatureIcon>
                <FeatureLabel>영화 두 편 선택</FeatureLabel>
              </FeatureCard>
              <FeatureCard $delay="0.45">
                <FeatureIcon>🔍</FeatureIcon>
                <FeatureLabel>AI 공통점 분석</FeatureLabel>
              </FeatureCard>
              <FeatureCard $delay="0.6">
                <FeatureIcon>✨</FeatureIcon>
                <FeatureLabel>맞춤 영화 추천</FeatureLabel>
              </FeatureCard>
            </FeaturePreview>
          </StepWrapper>
        )}

        {/* ════════════════════════════════════════════
         *  Step 1-A — 두 번째 영화 검색
         * ════════════════════════════════════════════ */}
        {step === 1 && !selectedMovie2 && (
          <StepWrapper key="step-1-search">
            {/* 첫 번째 선택 영화 카드 */}
            <SelectedMovieCard>
              <CardPoster
                src={getPosterUrl(selectedMovie1?.poster_path, 'w92')}
                alt={selectedMovie1?.title || ''}
              />
              <CardInfo>
                <CardTitle>{selectedMovie1?.title}</CardTitle>
                <CardMeta>{formatMovieMeta(selectedMovie1)}</CardMeta>
              </CardInfo>
              <CardChangeBtn onClick={handleChangeMovie1}>변경</CardChangeBtn>
            </SelectedMovieCard>

            <MonggleArea>
              <MonggleCharacter animation="idle" size="md" />
            </MonggleArea>
            <StepHeading>두 번째 영화를 골라주세요</StepHeading>
            <StepDesc>첫 번째 영화와 비교할 영화를 검색해보세요</StepDesc>
            <SelectorArea>
              <MovieSelector
                label=""
                selectedMovie={selectedMovie2}
                onSelect={selectMovie2}
                onClear={clearMovie2}
              />
            </SelectorArea>
          </StepWrapper>
        )}

        {/* ════════════════════════════════════════════
         *  Step 1-B — 두 영화 확인 + 시작
         * ════════════════════════════════════════════ */}
        {step === 1 && selectedMovie2 && (
          <StepWrapper key="step-1-ready">
            <MonggleArea>
              <MonggleCharacter animation="idle" size="md" />
            </MonggleArea>
            <StepHeading>이 두 영화로 시작할까요?</StepHeading>

            <PairDisplayCard>
              <MoviePair>
                {/* 영화 A */}
                <PairCard>
                  <PairPoster
                    src={getPosterUrl(selectedMovie1?.poster_path, 'w185')}
                    alt={selectedMovie1?.title || ''}
                  />
                  <PairTitle title={selectedMovie1?.title}>{selectedMovie1?.title}</PairTitle>
                  <PairMeta>{formatMovieMeta(selectedMovie1)}</PairMeta>
                  <PairChangeBtn onClick={handleChangeMovie1}>변경</PairChangeBtn>
                </PairCard>

                <PairConnectorBadge>
                  <VsText>VS</VsText>
                </PairConnectorBadge>

                {/* 영화 B */}
                <PairCard>
                  <PairPoster
                    src={getPosterUrl(selectedMovie2?.poster_path, 'w185')}
                    alt={selectedMovie2?.title || ''}
                  />
                  <PairTitle title={selectedMovie2?.title}>{selectedMovie2?.title}</PairTitle>
                  <PairMeta>{formatMovieMeta(selectedMovie2)}</PairMeta>
                  <PairChangeBtn onClick={handleChangeMovie2}>변경</PairChangeBtn>
                </PairCard>
              </MoviePair>
            </PairDisplayCard>

            <ActionButton onClick={handleStart}>
              둘의 공통점 찾기
            </ActionButton>
          </StepWrapper>
        )}

        {/* ════════════════════════════════════════════
         *  Step 2 — 분석 진행 중
         * ════════════════════════════════════════════ */}
        {step === 2 && (
          <StepWrapper key="step-2">
            <AnalysisCard>
              <MonggleArea>
                <MonggleCharacter animation="thinking" size="lg" />
              </MonggleArea>
              <StepHeading>두 영화를 분석하고 있어요</StepHeading>
              <StatusText>{currentStatus || '잠시만 기다려주세요...'}</StatusText>

              {/* 전체 진행률 바 */}
              <TotalProgressBar>
                <ProgressTrack>
                  <ProgressFill $percent={progressPercent} />
                </ProgressTrack>
                <ProgressPercent>{progressPercent}%</ProgressPercent>
              </TotalProgressBar>

              {/* 진행 단계 그리드 */}
              <ProgressStepGrid>
                {phaseEntries.map(([phase, label]) => {
                  const isCompleted = completedPhases.includes(phase);
                  const isCurrent =
                    !isCompleted &&
                    phaseEntries.findIndex(([p]) => p === phase) === completedPhases.length;
                  const isFuture = !isCompleted && !isCurrent;

                  return (
                    <ProgressStepCard
                      key={phase}
                      $completed={isCompleted}
                      $current={isCurrent}
                      $future={isFuture}
                    >
                      <StepIcon>
                        {isCompleted ? '✓' : isCurrent ? '●' : '○'}
                      </StepIcon>
                      <span>{label}</span>
                    </ProgressStepCard>
                  );
                })}
              </ProgressStepGrid>
            </AnalysisCard>

            <SecondaryButton onClick={cancelRequest}>취소</SecondaryButton>
          </StepWrapper>
        )}

        {/* ════════════════════════════════════════════
         *  Step 3 — 추천 결과
         * ════════════════════════════════════════════ */}
        {step === 3 && (
          <StepWrapper key="step-3">
            <ResultHero>
              <MonggleArea>
                <MonggleCharacter animation="celebrating" size="md" />
              </MonggleArea>
              <StepHeading>이런 영화 어떠세요?</StepHeading>

              {/* 공통 특성 배지 */}
              {sharedFeatures && <SharedFeaturesBadge sharedFeatures={sharedFeatures} />}
            </ResultHero>

            {/* 추천 영화 카드 목록 */}
            {matchResults.length > 0 && (
              <ResultsGrid>
                {matchResults.map((movie) => (
                  <MatchResultCard
                    key={movie.movie_id || `match-${movie.rank}-${movie.title}`}
                    movie={movie}
                    movie1Title={selectedMovie1?.title || '영화 A'}
                    movie2Title={selectedMovie2?.title || '영화 B'}
                  />
                ))}
              </ResultsGrid>
            )}

            <ActionButton onClick={handleReset}>
              다시 해보기
            </ActionButton>
          </StepWrapper>
        )}
      </ContentLayer>
    </PageContainer>
  );
}
