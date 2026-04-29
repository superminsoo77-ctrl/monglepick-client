/**
 * MovieDetailCard styled-components.
 *
 * MovieDetailCard.css의 모든 스타일을 styled-components로 이관한다.
 * glass-card 전체 + gradient-text 제목 + 포스터 하단 페이드 +
 * 액션 버튼 gradient hover + 섹션 그라데이션 구분선 +
 * 별점 글로우 + 트레일러 주변 글로우 + fadeInUp 등장.
 *
 * 로컬 keyframe: shimmerDetail (포스터 Skeleton shimmer)
 */

import styled, { keyframes, css } from 'styled-components';
import { Link } from 'react-router-dom';
import { fadeInUp } from '../../../shared/styles/animations';
import { gradientText } from '../../../shared/styles/mixins';
import { media } from '../../../shared/styles/media';

/* ── 로컬 keyframe — Skeleton shimmer ── */
const shimmerDetail = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

/* ── 카드 전체 컨테이너 — glass-card + fadeInUp ── */
export const Wrapper = styled.article`
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: ${({ theme }) => theme.glass.blur};
  -webkit-backdrop-filter: ${({ theme }) => theme.glass.blur};
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
  animation: ${fadeInUp} 0.5s ease forwards;
`;

/* ── 상단: 포스터 + 정보 가로 배치 ── */
export const Top = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xl};

  ${media.tablet} {
    flex-direction: column;
    align-items: center;
  }
`;

/* 포스터 영역 — 하단 그라데이션 페이드 오버레이 */
export const Poster = styled.div`
  flex-shrink: 0;
  width: 280px;
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.bgElevated};
  position: relative;

  /* 포스터 하단 페이드 오버레이 */
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(to top, ${({ theme }) => theme.glass.bg}, transparent);
    pointer-events: none;
  }

  ${media.tablet} {
    width: 200px;
  }
`;

/* 포스터 이미지 — $isLoading prop으로 로딩 중 숨김 처리 */
export const PosterImg = styled.img`
  width: 100%;
  height: auto;
  display: block;

  /* $isLoading=true 이면 투명 + 절대 위치 (Skeleton 아래에 숨김) */
  ${({ $isLoading }) =>
    $isLoading &&
    css`
      opacity: 0;
      position: absolute;
    `}
`;

/* 포스터 Skeleton — shimmer 효과 */
export const PosterSkeleton = styled.div`
  width: 100%;
  aspect-ratio: 2 / 3;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.bgSecondary} 25%,
    ${({ theme }) => theme.colors.bgTertiary} 50%,
    ${({ theme }) => theme.colors.bgSecondary} 75%
  );
  background-size: 200% 100%;
  animation: ${shimmerDetail} 1.5s ease-in-out infinite;
`;

/* 포스터 플레이스홀더 (포스터 없을 때) */
export const PosterPlaceholder = styled.div`
  width: 100%;
  aspect-ratio: 2 / 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.bgElevated},
    ${({ theme }) => theme.colors.bgCard}
  );
`;

/* 플레이스홀더 이모지 아이콘 */
export const PosterPlaceholderIcon = styled.span`
  font-size: ${({ theme }) => theme.typography.text4xl};
  opacity: 0.5;
`;

/* 정보 영역 */
export const Info = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

/* 제목 — gradient-text + gradientShift 애니메이션 */
export const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.text3xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  margin: 0;
  line-height: ${({ theme }) => theme.typography.leadingTight};

  /* gradientText 믹스인 적용 */
  ${gradientText}

  ${media.tablet} {
    font-size: ${({ theme }) => theme.typography.text2xl};
    text-align: center;
  }
`;

/* 원제 — 한국어 제목과 다를 때 표시 */
export const OriginalTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.textBase};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
  margin-top: calc(-1 * ${({ theme }) => theme.spacing.sm});
`;

/* ── 평점 — 별 글로우 ── */
export const Rating = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  ${media.tablet} {
    justify-content: center;
  }
`;

/* 평점 별 아이콘 — 노란 글로우 */
export const RatingStars = styled.span`
  color: ${({ theme }) => theme.colors.starFilled};
  font-size: ${({ theme }) => theme.typography.textLg};
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
`;

/* 평점 숫자 값 */
export const RatingValue = styled.span`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

/* 평점 참여자 수 */
export const RatingCount = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/* ── 메타 정보 (개봉일, 러닝타임, 등급) ── */
export const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};

  ${media.tablet} {
    justify-content: center;
  }
`;

/* 메타 항목 */
export const MetaItem = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/* 관람 등급 배지 — 테두리 박스 형태 */
export const Certification = styled(MetaItem)`
  padding: 1px 8px;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

/* ── 장르 태그 목록 ── */
export const Genres = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};

  ${media.tablet} {
    justify-content: center;
  }
`;

/* 장르 태그 — primary 배경 pill */
export const GenreTag = styled.span`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

/* ── 감독 행 ── */
export const Director = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/* 라벨 (감독, OTT 등) */
export const Label = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/* ── 액션 버튼 영역 — outline → hover gradient 채움 + glow ──
 * flex-wrap 을 기본으로 활성화해 좁은 컨테이너에서도 버튼이 축소되지 않고
 * 다음 줄로 넘어가게 한다. 태블릿 이하에선 가운데 정렬만 추가.
 */
export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.sm};

  ${media.tablet} {
    justify-content: center;
  }
`;

/* 버튼 공통 베이스 */
export const Btn = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  color: ${({ theme }) => theme.colors.textSecondary};
  background-color: transparent;
  /* 한글 라벨이 세로로 한 글자씩 쪼개지는 것을 방지 (flex 축소 방어) */
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.gradients.primary};
    border-color: transparent;
    color: white;
    box-shadow: ${({ theme }) => theme.glows.primary};
  }
`;

/*
 * 위시리스트 버튼.
 * $wishlisted prop이 true이면 error 색상 테마 적용.
 */
export const WishlistBtn = styled(Btn)`
  ${({ $wishlisted, theme }) =>
    $wishlisted &&
    css`
      background-color: ${theme.colors.errorBg};
      border-color: ${theme.colors.error};
      color: ${theme.colors.error};

      &:hover {
        background-color: ${theme.colors.error};
        color: white;
        box-shadow: ${theme.glows.pink};
      }
    `}
`;

/**
 * 영화 좋아요 버튼 — 인스타그램 스타일 하트 토글.
 *
 * $liked prop:
 *   - true  → error 색상 테두리·배경·텍스트 (채워진 하트 ♥)
 *   - false → 기본 테두리·투명 배경·muted 텍스트 (빈 하트 ♡)
 *
 * :active 시 scale(0.9) 팝 애니메이션으로 터치감을 준다.
 */
export const LikeBtn = styled(Btn)`
  border-radius: ${({ theme }) => theme.radius.full};
  border-color: ${({ theme, $liked }) =>
    $liked ? theme.colors.error : theme.colors.borderDefault};
  background: ${({ theme, $liked }) =>
    $liked ? theme.colors.errorBg : 'transparent'};
  color: ${({ theme, $liked }) =>
    $liked ? theme.colors.error : theme.colors.textMuted};

  /* 클릭 시 팝 애니메이션 */
  &:active {
    transform: scale(0.9);
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.error};
    color: ${({ theme }) => theme.colors.error};
    background: ${({ theme }) => theme.colors.errorBg};
    /* Btn 기본 hover(gradient)를 덮어씀 */
    box-shadow: none;
  }
`;

/* 트레일러 버튼 — primary-light 배경 */
export const TrailerBtn = styled(Btn)`
  background-color: ${({ theme }) => theme.colors.primaryLight};
  border-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.primary};

  &:hover {
    background: ${({ theme }) => theme.gradients.primary};
    border-color: transparent;
    color: white;
    box-shadow: ${({ theme }) => theme.glows.primary};
  }
`;

/* ── 트레일러 — 주변 글로우 ── */
export const Trailer = styled.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.bgMain};
  box-shadow: ${({ theme }) => theme.glows.primary};
`;

/* 트레일러 iframe */
export const TrailerIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
`;

/* ── 섹션 공통 — 그라데이션 구분선 ── */
export const Section = styled.div`
  padding-top: ${({ theme }) => theme.spacing.lg};
  border-top: none;
  position: relative;

  /* 그라데이션 구분선 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: ${({ theme }) => theme.gradients.primary};
    opacity: 0.3;
  }
`;

/* 섹션 제목 */
export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
`;

export const SectionTab = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  letter-spacing: 0.02em;
`;

/* ── 줄거리 ── */

/*
 * 줄거리 텍스트.
 * $collapsed prop이 true이면 4줄 이후 말줄임표 처리.
 */
export const OverviewText = styled.p`
  font-size: ${({ theme }) => theme.typography.textBase};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.leadingRelaxed};
  margin: 0;

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
    `}
`;

/* 줄거리 더보기/접기 버튼 */
export const OverviewToggle = styled.button`
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  margin-top: ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
`;

/* ── 추천 이유 — 인용 스타일 + gradient 보더 ── */
export const Recommendation = styled.blockquote`
  font-size: ${({ theme }) => theme.typography.textBase};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.leadingRelaxed};
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing.md};
  border-left: 3px solid;
  border-image: ${({ theme }) => theme.gradients.primary} 1;
  font-style: italic;
`;

/* ── 연관 영화 ── */
export const RelatedSectionDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
`;

export const RelatedStatusText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: ${({ theme }) => theme.typography.leadingRelaxed};
`;

export const RelatedMovieGrid = styled.div`
  display: flex;
  overflow-x: auto;
  gap: ${({ theme }) => theme.spacing.lg};
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.bgElevated};
    border-radius: ${({ theme }) => theme.radius.full};
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.borderDefault};
    border-radius: ${({ theme }) => theme.radius.full};
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.primary};
  }

  ${media.mobile} {
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

export const RelatedMovieCard = styled(Link)`
  position: relative;
  flex: 0 0 132px;
  width: 132px;
  text-decoration: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  scroll-snap-align: start;
  outline: none;
  transition: transform ${({ theme }) => theme.transitions.base},
    box-shadow ${({ theme }) => theme.transitions.base},
    filter ${({ theme }) => theme.transitions.base};

  &:hover,
  &:focus-visible {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.md},
      ${({ theme }) => theme.shadows.glow};
    filter: saturate(1.05);
  }

  ${media.mobile} {
    flex-basis: 112px;
    width: 112px;
  }
`;

export const RelatedMovieSkeletonCard = styled.div`
  flex: 0 0 132px;
  width: 132px;
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  scroll-snap-align: start;

  ${media.mobile} {
    flex-basis: 112px;
    width: 112px;
  }
`;

export const RelatedPoster = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.bgElevated};
`;

export const RelatedPosterSkeleton = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.bgSecondary} 20%,
    ${({ theme }) => theme.colors.bgTertiary} 50%,
    ${({ theme }) => theme.colors.bgSecondary} 80%
  );
  background-size: 220% 100%;
  animation: ${shimmerDetail} 1.4s ease-in-out infinite;
`;

export const RelatedPosterImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform ${({ theme }) => theme.transitions.slow};

  ${RelatedMovieCard}:hover &,
  ${RelatedMovieCard}:focus-visible & {
    transform: scale(1.05);
  }
`;

export const RelatedPosterPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textXs};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.bgElevated},
    ${({ theme }) => theme.colors.bgCard}
  );
`;

export const RelatedPosterPlaceholderIcon = styled.span`
  font-size: ${({ theme }) => theme.typography.text3xl};
  opacity: 0.5;
`;

export const RelatedMovieBody = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm};
  background: linear-gradient(
    180deg,
    rgba(10, 14, 24, 0.08) 0%,
    rgba(10, 14, 24, 0.62) 45%,
    rgba(10, 14, 24, 0.92) 100%
  );
  opacity: 0;
  transform: translateY(8px);
  transition: opacity ${({ theme }) => theme.transitions.base},
    transform ${({ theme }) => theme.transitions.base};
  pointer-events: none;

  ${RelatedMovieCard}:hover &,
  ${RelatedMovieCard}:focus-visible & {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const RelatedMovieSkeletonBody = styled.div`
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm};
  background: linear-gradient(
    180deg,
    rgba(10, 14, 24, 0.05) 0%,
    rgba(10, 14, 24, 0.58) 45%,
    rgba(10, 14, 24, 0.88) 100%
  );
`;

export const RelatedSkeletonLine = styled.span`
  display: block;
  width: ${({ $width = '100%' }) => $width};
  height: ${({ $height = '10px' }) => $height};
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(255, 255, 255, 0.24);
`;

export const RelatedSkeletonTagRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

export const RelatedSkeletonTag = styled(RelatedSkeletonLine)`
  height: 18px;
  background: rgba(255, 255, 255, 0.18);
`;

export const RelatedMovieTitle = styled.h3`
  margin: 0;
  color: white;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  line-height: ${({ theme }) => theme.typography.leadingTight};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const RelatedMovieMeta = styled.span`
  color: rgba(255, 255, 255, 0.78);
  font-size: ${({ theme }) => theme.typography.textXs};
`;

export const RelatedReasonList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const RelatedReasonTag = styled.span`
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(255, 255, 255, 0.16);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  line-height: 1.2;
`;

/* ── 출연진 — 아바타 원형 + 가로 스크롤 ── */
export const CastList = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.lg};
  overflow-x: auto;
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  scrollbar-width: thin;
`;

/* 출연진 개별 아이템 */
export const CastItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 80px;
  transition: transform ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: translateY(-2px);
  }

  /* 호버 시 아바타 테두리 + 글로우 강조 */
  &:hover > div {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.glow};
  }
`;

/* 출연진 아바타 원형 */
export const CastAvatar = styled.div`
  width: 64px;
  height: 64px;
  border-radius: ${({ theme }) => theme.radius.full};
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.bgElevated};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textLg};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  transition: border-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

/* 출연진 이름 */
export const CastName = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: center;
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

/* 출연진 역할명 */
export const CastCharacter = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
`;

/* ── OTT 플랫폼 — tooltip 호버 효과 ── */
export const OttList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/* OTT 플랫폼 태그 */
export const OttTag = styled.span`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: default;
  position: relative;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.primaryLight};
  }
`;
