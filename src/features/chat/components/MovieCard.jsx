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
import useAuthStore from '../../../shared/stores/useAuthStore';
import { useModal } from '../../../shared/components/Modal';
import { useRewardToast } from '../../../shared/components/RewardToast';
import { createReview } from '../../../features/review/api/reviewApi';
import PostWatchFeedback from '../../../features/movie/components/PostWatchFeedback';

/* styled-components 기반 스타일 — theme 토큰으로 다크/라이트 모드 자동 대응 */
import {
  Card,
  RankBadge,
  ExternalBadge,
  ExternalSourceLink,
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
  ActionRow,
  NotInterestedButton,
  ReviewButton,
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
 * OTT 플랫폼명 → 해당 OTT 의 영화 검색 URL 매핑.
 *
 * QA #170 (2026-04-23): OttBadge 클릭 시 사용자가 실제로 해당 플랫폼에서 영화를 찾아볼 수 있도록
 * 제목 기반 검색 딥링크를 제공한다. 각 OTT 가 "제목" 쿼리를 URL 파라미터로 받는 검색 페이지를
 * 가지므로 encodeURIComponent 처리만 해서 바로 여는 방식.
 *
 * 매핑 키는 Agent/DB 에 저장된 OTT 이름(한글/영문 변형)을 lowercase trim 한 것.
 * 매핑에 없는 플랫폼은 href 없이 정적 뱃지로 렌더된다 (기존 동작 호환).
 */
const OTT_SEARCH_URL_BY_NAME = {
  netflix: (q) => `https://www.netflix.com/search?q=${encodeURIComponent(q)}`,
  '넷플릭스': (q) => `https://www.netflix.com/search?q=${encodeURIComponent(q)}`,
  watcha: (q) => `https://watcha.com/search?query=${encodeURIComponent(q)}`,
  '왓챠': (q) => `https://watcha.com/search?query=${encodeURIComponent(q)}`,
  tving: (q) => `https://www.tving.com/search?keyword=${encodeURIComponent(q)}`,
  '티빙': (q) => `https://www.tving.com/search?keyword=${encodeURIComponent(q)}`,
  'disney+': (q) => `https://www.disneyplus.com/search?q=${encodeURIComponent(q)}`,
  'disney plus': (q) => `https://www.disneyplus.com/search?q=${encodeURIComponent(q)}`,
  '디즈니+': (q) => `https://www.disneyplus.com/search?q=${encodeURIComponent(q)}`,
  '디즈니플러스': (q) => `https://www.disneyplus.com/search?q=${encodeURIComponent(q)}`,
  wavve: (q) => `https://www.wavve.com/search/search.html?searchWord=${encodeURIComponent(q)}`,
  '웨이브': (q) => `https://www.wavve.com/search/search.html?searchWord=${encodeURIComponent(q)}`,
  coupangplay: (q) => `https://www.coupangplay.com/search?keyword=${encodeURIComponent(q)}`,
  '쿠팡플레이': (q) => `https://www.coupangplay.com/search?keyword=${encodeURIComponent(q)}`,
  'apple tv+': (q) => `https://tv.apple.com/kr/search?term=${encodeURIComponent(q)}`,
  'apple tv': (q) => `https://tv.apple.com/kr/search?term=${encodeURIComponent(q)}`,
  '애플tv+': (q) => `https://tv.apple.com/kr/search?term=${encodeURIComponent(q)}`,
  '애플티비': (q) => `https://tv.apple.com/kr/search?term=${encodeURIComponent(q)}`,
  primevideo: (q) => `https://www.primevideo.com/search?phrase=${encodeURIComponent(q)}`,
  '프라임비디오': (q) => `https://www.primevideo.com/search?phrase=${encodeURIComponent(q)}`,
};

function getOttSearchUrl(platformName, movieTitle) {
  if (!platformName || !movieTitle) return null;
  const key = platformName.trim().toLowerCase();
  const builder = OTT_SEARCH_URL_BY_NAME[key];
  return builder ? builder(movieTitle) : null;
}

/**
 * overview 끝에 부착된 `[외부 출처] URL` 마커를 분리한다 (2026-04-23 후속 과제).
 *
 * Agent `external_search_node` 가 DuckDuckGo 결과의 source_url 을 overview 본문 뒤에
 * 한 줄로 붙여 보낸다:
 *   "본문 텍스트...\n[외부 출처] https://namu.wiki/w/XXX"
 *
 * Client 는 이 마커를 파싱해 본문과 출처 URL 을 분리 렌더링한다.
 * 출처 URL 이 없으면 overview 전체를 본문으로 반환.
 *
 * @param {string|null|undefined} overview
 * @returns {{ body: string, sourceUrl: string|null }}
 */
function parseExternalSource(overview) {
  if (!overview) return { body: '', sourceUrl: null };
  const marker = '[외부 출처]';
  const idx = overview.lastIndexOf(marker);
  if (idx === -1) return { body: overview, sourceUrl: null };

  const body = overview.slice(0, idx).trim();
  const afterMarker = overview.slice(idx + marker.length).trim();
  // URL 이 공백·줄바꿈 으로 끝날 수 있음
  const sourceUrl = afterMarker.split(/\s+/)[0] || null;
  return { body, sourceUrl };
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
 * @param {string} [props.sessionId] - 현재 채팅 세션 ID (리뷰 작성 시 reviewSource 로 기록)
 * @param {(text:string)=>void} [props.onFindNearbyTheater] - "근처 영화관" 버튼 클릭 시 호출.
 *   ChatWindow 가 setInputText 를 wrap 해서 전달하면 입력창에 "○○○ 근처 영화관 알려줘" 자동 채움.
 *   자동 전송하지 않고 사용자가 검토 후 직접 보내도록 한다 (사용자 의도 존중, NowShowingPanel 과 동일 패턴).
 * @param {boolean} [props.cancelled] - SSE 도중 취소된 부분 데이터. true 면 dimmed 시각화.
 */
export default function MovieCard({ movie, sessionId, onFindNearbyTheater, cancelled = false }) {
  const {
    id,
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

  /* 2026-04-23 후속: Agent external_search_node 가 생성한 영화 식별.
   * id 가 'external_' 접두사면 DB 에 없는 신작 (DuckDuckGo 경유 정보). */
  const isExternal = typeof id === 'string' && id.startsWith('external_');

  /* overview 에서 [외부 출처] URL 부분을 분리 — 본문과 링크를 별도로 렌더링 */
  const { body: overviewBody, sourceUrl: externalSourceUrl } = parseExternalSource(overview);

  /* 트레일러 모달 표시 상태 */
  const [showTrailer, setShowTrailer] = useState(false);

  /* Phase 5-1: "관심 없음" 클릭 시 fade-out */
  const [dismissed, setDismissed] = useState(false);

  /* 리뷰 작성 모달 표시 상태 */
  const [showFeedback, setShowFeedback] = useState(false);

  /* 리뷰 작성 완료 여부 — true 일 때 "리뷰 작성" 버튼이 "✓ 리뷰 작성됨" 으로 잠김 */
  const [reviewed, setReviewed] = useState(false);

  /* 리뷰 전송 중 중복 제출 방지 플래그 */
  const [submitting, setSubmitting] = useState(false);

  /* 인증/토스트/알림 훅 — 로그인 체크 및 리워드 토스트 표시용 */
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const { showAlert } = useModal();
  const { showReward } = useRewardToast();

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

  /**
   * "리뷰 작성" 버튼 클릭 핸들러.
   * 비로그인 상태면 알럿 안내 후 종료, 이미 작성했다면 아무 동작 없음.
   * 로그인 상태면 PostWatchFeedback 모달을 연다.
   *
   * 설계: "리뷰 작성 = 시청 완료" 단일 신호. reviews 테이블이 추천 학습의 단일 진실 원본이므로
   *       별도로 /watch-history 를 호출하지 않는다. (CLAUDE.md "봤다 = 리뷰" 원칙)
   */
  const handleReviewClick = () => {
    if (reviewed) return;
    if (!isAuthenticated) {
      showAlert({
        title: '로그인 필요',
        message: '리뷰를 작성하려면 로그인이 필요합니다.',
        type: 'warning',
      });
      return;
    }
    trackEvent('review_open', movie.id, { rank, source: 'chat' });
    setShowFeedback(true);
  };

  /**
   * PostWatchFeedback 모달에서 평점·코멘트를 제출했을 때 호출되는 콜백.
   * recommendApi 를 통해 Recommend(:8001) /api/v2/movies/{id}/reviews 로 전송한다.
   *
   * 엑셀 5번 reviews 정합:
   *  - reviewSource       : AI 채팅 추천에서 작성한 리뷰이므로 세션 ID 를 참조로 기록 (없으면 'chat')
   *  - reviewCategoryCode : 진입 경로가 AI 추천이므로 'AI_RECOMMEND' 고정
   *
   * 중복 리뷰(409)를 포함한 모든 에러는 UX 를 차단하지 않고 조용히 무시한다.
   * 성공 시 버튼을 "✓ 리뷰 작성됨" 으로 잠그고, 리워드 포인트가 있으면 토스트로 표시한다.
   */
  const handleReviewSubmit = async (ratingValue, content, isSpoiler) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await createReview(movie.id, {
        movieId: movie.id,
        rating: ratingValue,
        content: content || null,
        isSpoiler,
        reviewSource: sessionId ? `chat_${sessionId}` : 'chat',
        reviewCategoryCode: 'AI_RECOMMEND',
      });
      setReviewed(true);
      trackEvent('review_submit', movie.id, {
        rank, source: 'chat', rating: ratingValue,
      });
      /* Recommend 응답에 reward_points 가 포함되면 토스트 표시.
         ※ 2026-04-14 현재 Recommend schema 에 필드 미반영 — 백엔드 후속 작업 전까지는 no-op */
      if (result?.rewardPoints > 0) {
        showReward(result.rewardPoints, '리뷰 작성');
      }
    } catch (err) {
      /* 409 중복 리뷰 — 이미 이 영화에 리뷰를 작성한 상태이므로 버튼을 잠금 처리한다.
         네트워크/5xx 등 다른 에러는 조용히 무시하여 UX 를 차단하지 않는다.
         (실패 시 사용자는 나중에 재시도 가능) */
      if (err?.response?.status === 409) {
        setReviewed(true);
      }
    } finally {
      setSubmitting(false);
      setShowFeedback(false);
    }
  };

  return (
    <CardFadeWrapper $dismissed={dismissed}>
    <Card
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      $cancelled={cancelled}
    >
      {/* 순위 배지 */}
      {rank && <RankBadge>#{rank}</RankBadge>}

      {/* 외부 웹 정보 배지 — DuckDuckGo 경유로 찾아온 DB 밖 신작임을 표시 */}
      {isExternal && <ExternalBadge title="DB 에 없는 최신 영화 — 외부 웹에서 찾은 정보">🌐 웹 정보</ExternalBadge>}

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

        {/* 줄거리 (최대 100자). 외부 출처 URL 은 아래 별도 링크로 분리 렌더링. */}
        {overviewBody && (
          <Overview>
            {overviewBody.length > 100 ? overviewBody.slice(0, 100) + '...' : overviewBody}
          </Overview>
        )}

        {/* 외부 출처 링크 — external_search_node 결과일 때만 표시 */}
        {externalSourceUrl && (
          <ExternalSourceLink
            href={externalSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="원문 정보 보기"
          >
            출처 보기
          </ExternalSourceLink>
        )}

        {/* 추천 이유 */}
        {explanation && (
          <Explanation>{explanation}</Explanation>
        )}

        {/* OTT 플랫폼 — QA #170: 클릭 시 해당 OTT 의 영화 검색 페이지로 이동 (매핑 없으면 정적 뱃지).
            추적: 어떤 OTT 로 이동했는지 기록해 추천 결과 클릭 전환율을 분석. */}
        {ott_platforms.length > 0 && (
          <OttList>
            {ott_platforms.map((p) => {
              const url = getOttSearchUrl(p, title);
              return (
                <OttBadge
                  key={p}
                  href={url || undefined}
                  target={url ? '_blank' : undefined}
                  rel={url ? 'noopener noreferrer' : undefined}
                  title={url ? `${p} 에서 "${title}" 검색` : p}
                  onClick={url ? () => trackEvent('ott_click', movie.id, { rank, platform: p, source: 'chat' }) : undefined}
                >
                  {p}
                </OttBadge>
              );
            })}
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

        {/* 하단 액션 버튼 — "리뷰 작성" + "관심 없음" 을 한 줄에 배치.
            리뷰 작성 완료 시 버튼은 "✓ 리뷰 작성됨" 으로 잠금되며, "관심 없음" 은 사라진다. */}
        {!dismissed && (
          <ActionRow>
            <ReviewButton
              type="button"
              onClick={handleReviewClick}
              disabled={reviewed || submitting}
              $completed={reviewed}
              aria-label={reviewed ? '리뷰 작성 완료' : '리뷰 작성'}
            >
              {reviewed ? '✓ 리뷰 작성됨' : '✎ 리뷰 작성'}
            </ReviewButton>
            {/* "근처 영화관" — onFindNearbyTheater 콜백이 전달됐고 리뷰 미작성 상태에서만 노출.
                ReviewButton 우측에 보조 액션으로 배치. NotInterestedButton 과 함께 라인업되어
                기존 레이아웃(2버튼 → 3버튼)을 깨지 않도록 NotInterestedButton 다음 순서. */}
            {!reviewed && (
              <NotInterestedButton type="button" onClick={handleNotInterested}>
                ✕ 관심 없음
              </NotInterestedButton>
            )}
            {!reviewed && typeof onFindNearbyTheater === 'function' && (
              <NotInterestedButton
                type="button"
                onClick={() => onFindNearbyTheater(`${title} 근처에서 볼 수 있는 영화관 알려줘`)}
                aria-label={`${title} 근처 영화관 찾기`}
              >
                🏢 영화관
              </NotInterestedButton>
            )}
          </ActionRow>
        )}
      </InfoArea>

    </Card>

    {/* 리뷰 작성 모달 — 별점 + 한줄 감상 + 스포일러 체크 재사용 (MovieDetailPage 와 동일 컴포넌트) */}
    <PostWatchFeedback
      isOpen={showFeedback}
      movieTitle={title}
      movieId={movie.id}
      onSubmit={handleReviewSubmit}
      onClose={() => setShowFeedback(false)}
    />

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
