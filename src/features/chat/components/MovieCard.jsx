/**
 * 영화 추천 카드 컴포넌트.
 *
 * 백엔드 movie_card SSE 이벤트로 수신한 RankedMovie 데이터를
 * 시각적인 카드로 렌더링한다.
 *
 * 표시 정보:
 * - 포스터 이미지 (TMDB poster_path 기반)
 * - 제목 (한국어/영어)
 * - 장르 태그, 무드 태그
 * - 평점, 개봉연도, 관람등급
 * - 추천 이유 (explanation)
 * - 트레일러 (YouTube embed 모달)
 * - OTT 플랫폼
 */

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { trackEvent } from '../../../shared/utils/eventTracker';

/* styled-components 기반 스타일 — theme 토큰으로 다크/라이트 모드 자동 대응 */
import {
  Card,
  RankBadge,
  PosterWrapper,
  InfoArea,
  Title,
  TitleEn,
  Meta,
  Crew,
  Tags,
  GenreTag,
  MoodTag,
  Overview,
  Explanation,
  OttList,
  OttBadge,
  TrailerLink,
  TrailerAnchor,
  TrailerModal,
  ModalContent,
  CloseButton,
  ModalTitle,
  PlayerWrapper,
  NotInterestedButton,
  CardFadeWrapper,
} from './MovieCard.styled';

/**
 * TMDB 포스터 이미지 URL 생성.
 * poster_path가 없으면 플레이스홀더 반환.
 *
 * @param {string|null} posterPath - TMDB poster_path (/xxx.jpg)
 * @param {string} size - TMDB 이미지 사이즈 (w185, w342, w500 등)
 * @returns {string} 이미지 URL
 */
function getPosterUrl(posterPath, size = 'w342') {
  if (!posterPath) {
    return `https://placehold.co/342x513/1a1a2e/666?text=No+Poster`;
  }
  return `https://image.tmdb.org/t/p/${size}${posterPath}`;
}

/**
 * YouTube URL에서 영상 ID를 추출하여 embed URL을 반환한다.
 * 지원하는 URL 형식:
 *   - https://www.youtube.com/watch?v=VIDEO_ID
 *   - https://youtu.be/VIDEO_ID
 *   - https://www.youtube.com/embed/VIDEO_ID
 *
 * YouTube URL이 아니면 null을 반환한다.
 *
 * @param {string} url - 트레일러 URL
 * @returns {string|null} YouTube embed URL 또는 null
 */
function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    let videoId = null;

    /* youtube.com/watch?v=xxx */
    if (parsed.hostname.includes('youtube.com') && parsed.searchParams.get('v')) {
      videoId = parsed.searchParams.get('v');
    }
    /* youtu.be/xxx */
    else if (parsed.hostname === 'youtu.be') {
      videoId = parsed.pathname.slice(1);
    }
    /* youtube.com/embed/xxx */
    else if (parsed.hostname.includes('youtube.com') && parsed.pathname.startsWith('/embed/')) {
      videoId = parsed.pathname.split('/embed/')[1];
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
  } catch {
    /* URL 파싱 실패 시 무시 */
  }
  return null;
}

/**
 * 영화 추천 카드.
 *
 * @param {Object} props
 * @param {Object} props.movie - RankedMovie 데이터
 * @param {number} props.movie.rank - 추천 순위 (1부터 시작)
 * @param {string} props.movie.title - 한국어 제목
 * @param {string} [props.movie.title_en] - 영어 제목
 * @param {string[]} [props.movie.genres] - 장르 목록
 * @param {string} [props.movie.director] - 감독
 * @param {string[]} [props.movie.cast] - 출연진
 * @param {number} [props.movie.rating] - 평점 (0~10)
 * @param {number} [props.movie.release_year] - 개봉연도
 * @param {string} [props.movie.overview] - 줄거리
 * @param {string[]} [props.movie.mood_tags] - 무드 태그
 * @param {string} [props.movie.poster_path] - TMDB 포스터 경로
 * @param {string[]} [props.movie.ott_platforms] - OTT 플랫폼 목록
 * @param {string} [props.movie.certification] - 관람등급
 * @param {string} [props.movie.trailer_url] - 트레일러 URL
 * @param {string} [props.movie.explanation] - 추천 이유
 */
export default function MovieCard({ movie }) {
  const {
    rank,
    title,
    title_en,
    genres = [],
    director,
    cast = [],
    rating,
    release_year,
    overview,
    mood_tags = [],
    poster_path,
    ott_platforms = [],
    certification,
    trailer_url,
    explanation,
  } = movie;

  /* 트레일러 모달 표시 상태 */
  const [showTrailer, setShowTrailer] = useState(false);

  /* Phase 5-1: "관심 없음" 클릭 시 fade-out */
  const [dismissed, setDismissed] = useState(false);

  /* YouTube embed URL (YouTube가 아니면 null → 외부 링크 폴백) */
  const embedUrl = getYouTubeEmbedUrl(trailer_url);

  /* Phase 2: 호버 시작 시각 추적용 ref */
  const hoverStartRef = useRef(null);

  /* 트레일러 모달 열림 시: ESC 키 닫기 + body 스크롤 잠금 */
  useEffect(() => {
    if (!showTrailer) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowTrailer(false);
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showTrailer]);

  /**
   * 트레일러 모달 배경 클릭 시 닫기.
   * 이벤트 버블링으로 iframe 위 클릭은 전파되지 않으므로 자연스럽게 동작한다.
   *
   * 2026-04-08 — useCallback 제거. React Compiler 가 컴포넌트 단위로 자동 memoize 하므로
   * 수동 useCallback 은 오히려 "Existing memoization could not be preserved" 경고를 발생시킨다.
   */
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowTrailer(false);
    }
  };

  /* Phase 2: 카드 호버 시작 — 시각 기록 (useCallback 제거: React Compiler 위임) */
  const handleMouseEnter = () => {
    hoverStartRef.current = Date.now();
  };

  /* Phase 2: 카드 호버 종료 — 300ms 이상이면 이벤트 전송 */
  /* useCallback 제거 — React Compiler 자동 memoize 위임 */
  const handleMouseLeave = () => {
    if (hoverStartRef.current) {
      const durationMs = Date.now() - hoverStartRef.current;
      if (durationMs >= 300) {
        trackEvent('recommendation_card_hover', movie.id, {
          rank, duration_ms: durationMs, source: 'chat',
        });
      }
      hoverStartRef.current = null;
    }
  };

  /* Phase 2: 트레일러 재생 이벤트 — useCallback 제거 (React Compiler 위임) */
  const handleTrailerClick = () => {
    trackEvent('trailer_play', movie.id, { rank, source: 'chat' });
    setShowTrailer(true);
  };

  /* Phase 5-1: "관심 없음" 클릭 핸들러 — fade-out + 이벤트 전송 (useCallback 제거: React Compiler 위임) */
  const handleNotInterested = () => {
    setDismissed(true);
    trackEvent('not_interested', movie.id, { rank, source: 'chat' });
  };

  return (
    <CardFadeWrapper $dismissed={dismissed}>
    <Card
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 순위 배지 */}
      {rank && <RankBadge>#{rank}</RankBadge>}

      {/* 포스터 이미지 */}
      <PosterWrapper>
        <img
          src={getPosterUrl(poster_path)}
          alt={`${title} 포스터`}
          loading="lazy"
        />
      </PosterWrapper>

      {/* 카드 정보 영역 */}
      <InfoArea>
        {/* 제목 */}
        <Title>{title}</Title>
        {title_en && <TitleEn>{title_en}</TitleEn>}

        {/* 메타 정보 (연도, 평점, 관람등급) */}
        <Meta>
          {release_year && <span>{release_year}</span>}
          {rating != null && <span>★ {rating.toFixed(1)}</span>}
          {certification && <span>{certification}</span>}
        </Meta>

        {/* 감독 · 출연 */}
        {director && (
          <Crew>
            감독: {director}
            {cast.length > 0 && ` | 출연: ${cast.slice(0, 3).join(', ')}`}
          </Crew>
        )}

        {/* 장르 태그 */}
        {genres.length > 0 && (
          <Tags>
            {genres.map((g) => (
              <GenreTag key={g}>{g}</GenreTag>
            ))}
          </Tags>
        )}

        {/* 무드 태그 */}
        {mood_tags.length > 0 && (
          <Tags>
            {mood_tags.map((m) => (
              <MoodTag key={m}>{m}</MoodTag>
            ))}
          </Tags>
        )}

        {/* 줄거리 (최대 100자) */}
        {overview && (
          <Overview>
            {overview.length > 100 ? overview.slice(0, 100) + '...' : overview}
          </Overview>
        )}

        {/* 추천 이유 */}
        {explanation && (
          <Explanation>{explanation}</Explanation>
        )}

        {/* OTT 플랫폼 */}
        {ott_platforms.length > 0 && (
          <OttList>
            {ott_platforms.map((p) => (
              <OttBadge key={p}>{p}</OttBadge>
            ))}
          </OttList>
        )}

        {/* 트레일러 버튼 — YouTube이면 모달, 아니면 외부 링크 */}
        {trailer_url && (
          embedUrl ? (
            <TrailerLink
              type="button"
              onClick={handleTrailerClick}
            >
              ▶ 트레일러 보기
            </TrailerLink>
          ) : (
            <TrailerAnchor
              href={trailer_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              ▶ 트레일러 보기
            </TrailerAnchor>
          )
        )}

        {/* Phase 5-1: "관심 없음" 버튼 */}
        {!dismissed && (
          <NotInterestedButton type="button" onClick={handleNotInterested}>
            ✕ 관심 없음
          </NotInterestedButton>
        )}
      </InfoArea>

    </Card>

      {/* YouTube 트레일러 모달 — createPortal로 body에 직접 렌더링.
       * Card의 overflow:hidden + transform(hover)이 position:fixed를
       * 깨뜨리는 문제를 우회한다. */}
      {showTrailer && embedUrl && createPortal(
        <TrailerModal onClick={handleOverlayClick}>
          <ModalContent>
            {/* 닫기 버튼 */}
            <CloseButton
              type="button"
              onClick={() => setShowTrailer(false)}
            >
              ✕
            </CloseButton>
            {/* 영화 제목 */}
            <ModalTitle>{title} 트레일러</ModalTitle>
            {/* YouTube iframe */}
            <PlayerWrapper>
              <iframe
                src={embedUrl}
                title={`${title} 트레일러`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </PlayerWrapper>
          </ModalContent>
        </TrailerModal>,
        document.body,
      )}
    </CardFadeWrapper>
  );
}
