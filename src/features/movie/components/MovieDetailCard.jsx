/**
 * 영화 상세 정보 카드 컴포넌트.
 *
 * 영화의 모든 상세 정보를 표시한다:
 * - 포스터, 제목, 줄거리, 장르, 출연진, 평점
 * - 트레일러 (YouTube 임베드)
 * - OTT 플랫폼 정보
 * - 감독, 개봉일, 러닝타임 등 메타 정보
 *
 * 개선 사항:
 * - 포스터 로딩 시 Skeleton 적용
 * - 출연진 섹션 아바타 원형 + 이름 가로 스크롤
 * - OTT 태그 호버 시 tooltip 효과
 * - 섹션 구분선 추가
 * - 추천 이유 인용 스타일
 *
 * @param {Object} props
 * @param {Object} props.movie - 영화 상세 정보 객체
 * @param {function} [props.onWishlistToggle] - 위시리스트 토글 콜백
 * @param {boolean} [props.isWishlisted=false] - 위시리스트 포함 여부
 * @param {number} [props.likeCount=0] - 영화 좋아요 수
 * @param {boolean} [props.isLiked=false] - 현재 사용자의 좋아요 여부
 * @param {function} [props.onLikeToggle] - 좋아요 토글 콜백 (movieId 전달)
 */

import { useState } from 'react';
/* 포맷팅 유틸 — shared/utils에서 가져옴 */
/* formatGenres: 장르 태그는 movie.genres 배열을 직접 순회하므로 미사용 */
import { formatRating, formatRatingStars, formatRuntime, formatDate } from '../../../shared/utils/formatters';
/* styled-components — MovieDetailCard.styled.js */
import * as S from './MovieDetailCard.styled';

export default function MovieDetailCard({
  movie,
  onWishlistToggle,
  isWishlisted = false,
  wishlistLoading = false,
  onWatchComplete,
  likeCount = 0,
  isLiked = false,
  onLikeToggle,
}) {
  // 줄거리 펼치기/접기 상태
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  // 트레일러 표시 상태
  const [showTrailer, setShowTrailer] = useState(false);
  // 포스터 로딩 상태
  const [posterLoaded, setPosterLoaded] = useState(false);

  // 영화 데이터가 없으면 렌더링하지 않음
  if (!movie) return null;

  /**
   * 줄거리 펼치기/접기 토글.
   */
  const toggleOverview = () => {
    setIsOverviewExpanded((prev) => !prev);
  };

  /**
   * YouTube 트레일러 ID 추출.
   * trailer_url에서 YouTube 비디오 ID를 파싱한다.
   *
   * @param {string} url - YouTube URL
   * @returns {string|null} 비디오 ID 또는 null
   */
  const getYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const youtubeId = getYouTubeId(movie.trailer_url);

  return (
    <S.Wrapper>
      {/* ── 상단: 포스터 + 기본 정보 ── */}
      <S.Top>
        {/* 포스터 */}
        <S.Poster>
          {movie.poster_path || movie.posterUrl ? (
            <>
              {/* 포스터 로딩 전 Skeleton */}
              {!posterLoaded && <S.PosterSkeleton />}
              <S.PosterImg
                src={movie.poster_path || movie.posterUrl}
                alt={`${movie.title} 포스터`}
                /* $isLoading=true 이면 투명+절대 위치로 Skeleton 뒤에 숨김 */
                $isLoading={!posterLoaded}
                onLoad={() => setPosterLoaded(true)}
              />
            </>
          ) : (
            <S.PosterPlaceholder>
              <S.PosterPlaceholderIcon>🎬</S.PosterPlaceholderIcon>
              <span>포스터 없음</span>
            </S.PosterPlaceholder>
          )}
        </S.Poster>

        {/* 기본 정보 */}
        <S.Info>
          {/* 제목 */}
          <S.Title>{movie.title || movie.title_ko}</S.Title>

          {/* 원제 (한국어 제목과 다를 때) */}
          {movie.original_title && movie.original_title !== movie.title && (
            <S.OriginalTitle>{movie.original_title}</S.OriginalTitle>
          )}

          {/* 평점 */}
          <S.Rating>
            <S.RatingStars>
              {formatRatingStars(movie.rating || movie.vote_average)}
            </S.RatingStars>
            <S.RatingValue>
              {formatRating(movie.rating || movie.vote_average)}
            </S.RatingValue>
            {movie.vote_count && (
              <S.RatingCount>
                ({movie.vote_count.toLocaleString()}명)
              </S.RatingCount>
            )}
          </S.Rating>

          {/* 메타 정보 (개봉일, 러닝타임, 관람등급) */}
          <S.Meta>
            {movie.release_date && (
              <S.MetaItem>{formatDate(movie.release_date)} 개봉</S.MetaItem>
            )}
            {movie.runtime && (
              <S.MetaItem>{formatRuntime(movie.runtime)}</S.MetaItem>
            )}
            {movie.certification && (
              <S.Certification>{movie.certification}</S.Certification>
            )}
          </S.Meta>

          {/* 장르 태그 */}
          {movie.genres && movie.genres.length > 0 && (
            <S.Genres>
              {movie.genres.map((genre) => (
                <S.GenreTag
                  key={typeof genre === 'string' ? genre : (genre.name || genre.id)}
                >
                  {typeof genre === 'string' ? genre : genre.name}
                </S.GenreTag>
              ))}
            </S.Genres>
          )}

          {/* 감독 */}
          {movie.director && (
            <S.Director>
              <S.Label>감독</S.Label>
              <span>{movie.director}</span>
            </S.Director>
          )}

          {/* 액션 버튼 */}
          <S.Actions>
            {/* 위시리스트 버튼 */}
            {onWishlistToggle && (
              <S.WishlistBtn
                /* $wishlisted: transient prop — DOM에 전달되지 않음 */
                $wishlisted={isWishlisted}
                onClick={() => onWishlistToggle(movie.id)}
                disabled={wishlistLoading}
              >
                {isWishlisted ? '♥ 위시리스트에 추가됨' : '♡ 위시리스트에 추가'}
              </S.WishlistBtn>
            )}

            {/* 영화 좋아요 버튼 — 인스타그램 스타일 토글
                $liked: true이면 채워진 하트 + error 색상, false이면 빈 하트 + 기본 색상.
                likeCount가 0이면 숫자를 표시하지 않아 버튼을 깔끔하게 유지한다. */}
            {onLikeToggle && (
              <S.LikeBtn
                $liked={isLiked}
                onClick={() => onLikeToggle(movie.id)}
                aria-label={isLiked ? '좋아요 취소' : '좋아요'}
              >
                {isLiked ? '♥' : '♡'}{likeCount > 0 ? ` ${likeCount.toLocaleString()}` : ''}
              </S.LikeBtn>
            )}

            {/* Phase 5-2: 시청 완료 버튼 */}
            {onWatchComplete && (
              <S.TrailerBtn onClick={onWatchComplete}>
                ✓ 시청 완료
              </S.TrailerBtn>
            )}

            {/* 트레일러 버튼 */}
            {youtubeId && (
              <S.TrailerBtn onClick={() => setShowTrailer((prev) => !prev)}>
                {showTrailer ? '트레일러 닫기' : '▶ 트레일러 보기'}
              </S.TrailerBtn>
            )}
          </S.Actions>
        </S.Info>
      </S.Top>

      {/* ── 트레일러 (YouTube 임베드) ── */}
      {showTrailer && youtubeId && (
        <S.Trailer>
          <S.TrailerIframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
            title="트레일러"
            frameBorder="0"
            sandbox="allow-scripts allow-presentation allow-popups"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </S.Trailer>
      )}

      {/* ── 줄거리 ── */}
      {movie.overview && (
        <S.Section>
          <S.SectionTitle>줄거리</S.SectionTitle>
          {/* $collapsed: true 이면 4줄 말줄임표, false 이면 전체 표시 */}
          <S.OverviewText $collapsed={!isOverviewExpanded}>
            {movie.overview}
          </S.OverviewText>
          {movie.overview.length > 200 && (
            <S.OverviewToggle onClick={toggleOverview}>
              {isOverviewExpanded ? '접기' : '더 보기'}
            </S.OverviewToggle>
          )}
        </S.Section>
      )}

      {/* ── 추천 이유 (있는 경우) ── */}
      {movie.recommendation_reason && (
        <S.Section>
          <S.SectionTitle>추천 이유</S.SectionTitle>
          <S.Recommendation>{movie.recommendation_reason}</S.Recommendation>
        </S.Section>
      )}

      {/* ── 출연진 ── */}
      {movie.cast && movie.cast.length > 0 && (
        <S.Section>
          <S.SectionTitle>출연진</S.SectionTitle>
          <S.CastList>
            {movie.cast.slice(0, 10).map((actor) => (
              <S.CastItem key={actor.id || actor.name}>
                <S.CastAvatar>
                  {actor.profile_path ? (
                    <img src={actor.profile_path} alt={actor.name} />
                  ) : (
                    <span>{actor.name?.charAt(0)}</span>
                  )}
                </S.CastAvatar>
                <S.CastName>{actor.name}</S.CastName>
                {actor.character && (
                  <S.CastCharacter>{actor.character}</S.CastCharacter>
                )}
              </S.CastItem>
            ))}
          </S.CastList>
        </S.Section>
      )}

      {/* ── OTT 플랫폼 ── */}
      {movie.ott_platforms && movie.ott_platforms.length > 0 && (
        <S.Section>
          <S.SectionTitle>시청 가능한 곳</S.SectionTitle>
          <S.OttList>
            {movie.ott_platforms.map((platform) => (
              <S.OttTag
                key={platform}
                title={`${platform}에서 시청 가능`}
              >
                {platform}
              </S.OttTag>
            ))}
          </S.OttList>
        </S.Section>
      )}
    </S.Wrapper>
  );
}
