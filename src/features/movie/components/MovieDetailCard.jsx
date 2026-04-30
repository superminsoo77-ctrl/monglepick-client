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
 * @param {boolean} [props.wishlistLoading=false] - 위시리스트 요청 진행 여부
 * @param {number} [props.likeCount=0] - 영화 좋아요 수
 * @param {boolean} [props.isLiked=false] - 현재 사용자의 좋아요 여부
 * @param {function} [props.onLikeToggle] - 좋아요 토글 콜백 (movieId 전달)
 * @param {Array} [props.collectionMovies=[]] - 같은 컬렉션 작품 목록
 * @param {boolean} [props.collectionMoviesLoading=false] - 컬렉션 작품 로딩 여부
 * @param {Array} [props.relatedMovies=[]] - 컬렉션을 제외한 연관 영화 목록
 * @param {boolean} [props.relatedMoviesLoading=false] - 일반 연관 영화 로딩 여부
 * @param {function} [props.onReviewWrite] - 리뷰 작성 버튼 클릭 콜백
 * @param {boolean} [props.hasReviewed=false] - 현재 사용자의 리뷰 작성 여부
 */

import { useState } from 'react';
/* 라우트 경로 상수 + 경로 빌더 — shared/constants에서 가져옴 */
import { buildPath, ROUTES } from '../../../shared/constants/routes';
/* 포맷팅 유틸 — shared/utils에서 가져옴 */
/* formatGenres: 장르 태그는 movie.genres 배열을 직접 순회하므로 미사용 */
import { formatRating, formatRatingStars, formatRuntime, formatDate } from '../../../shared/utils/formatters';
/* styled-components — MovieDetailCard.styled.js */
import * as S from './MovieDetailCard.styled';

export default function MovieDetailCard({
  movie,
  collectionMovies = [],
  collectionMoviesLoading = false,
  relatedMovies = [],
  relatedMoviesLoading = false,
  onWishlistToggle,
  isWishlisted = false,
  wishlistLoading = false,
  onReviewWrite,
  hasReviewed = false,
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

  const resolveImageUrl = (pathOrUrl) => {
    if (!pathOrUrl || typeof pathOrUrl !== 'string') return null;
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      return pathOrUrl;
    }
    if (pathOrUrl.startsWith('/')) {
      return `https://image.tmdb.org/t/p/w500${pathOrUrl}`;
    }
    return null;
  };

  const parseGenres = (genres) => {
    if (Array.isArray(genres)) return genres;
    if (typeof genres !== 'string') return [];

    try {
      const parsed = JSON.parse(genres);
      if (Array.isArray(parsed)) {
        return parsed.map((genre) => String(genre).trim()).filter(Boolean);
      }
    } catch {
      // JSON 문자열이 아니면 콤마 구분 문자열로 처리
    }

    return genres.split(',').map((genre) => genre.trim()).filter(Boolean);
  };

  const resolveMovieId = (targetMovie) => (
    targetMovie?.movie_id || targetMovie?.movieId || targetMovie?.id || null
  );

  const resolveMovieTitle = (targetMovie) => (
    targetMovie?.title || targetMovie?.title_ko || '제목 없음'
  );

  const resolveReleaseYear = (targetMovie) => {
    if (targetMovie?.releaseYear) return targetMovie.releaseYear;
    if (targetMovie?.release_year) return targetMovie.release_year;
    if (typeof targetMovie?.release_date === 'string' && targetMovie.release_date.length >= 4) {
      return targetMovie.release_date.slice(0, 4);
    }
    return null;
  };

  const posterSrc = resolveImageUrl(
    movie.posterUrl || movie.poster_url || movie.poster_path
  );
  const buildMovieSkeletons = (movies) => Array.from(
    { length: movies.length > 0 ? 3 : 5 },
    (_, index) => index
  );
  const collectionMovieSeedExists = Boolean(
    movie.collection_name || collectionMoviesLoading || collectionMovies.length > 0
  );
  const relatedMovieSeedExists = Boolean(
    relatedMoviesLoading
      || relatedMovies.length > 0
      || movie.director
      || (movie.cast && movie.cast.length > 0)
      || movie.overview
      || parseGenres(movie.genres).length > 0
  );

  /**
   * 줄거리 펼치기/접기 토글.
   */
  const toggleOverview = () => {
    setIsOverviewExpanded((prev) => !prev);
  };

  /**
   * YouTube URL에서 embed URL을 생성한다.
   * 지원하는 URL 형식:
   *   - https://www.youtube.com/watch?v=VIDEO_ID
   *   - https://youtu.be/VIDEO_ID
   *   - https://www.youtube.com/embed/VIDEO_ID
   *
   * @param {string} url - YouTube URL
   * @returns {string|null} embed URL 또는 null
   */
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      let videoId = null;

      if (parsed.hostname.includes('youtube.com') && parsed.searchParams.get('v')) {
        videoId = parsed.searchParams.get('v');
      } else if (parsed.hostname === 'youtu.be') {
        videoId = parsed.pathname.slice(1);
      } else if (parsed.hostname.includes('youtube.com') && parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1];
      }

      if (!videoId) return null;

      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;
    } catch {
      return null;
    }
  };

  const embedUrl = getYouTubeEmbedUrl(movie.trailer_url);

  const renderMovieCarousel = ({
    movies,
    loading,
    emptyText,
    loadingText,
    loadingMoreText,
  }) => {
    const movieSkeletons = buildMovieSkeletons(movies);

    if (movies.length > 0) {
      return (
        <>
          <S.RelatedMovieGrid>
            {movies.map((targetMovie) => {
              const targetMovieId = resolveMovieId(targetMovie);
              const targetPosterSrc = resolveImageUrl(
                targetMovie.posterUrl || targetMovie.poster_url || targetMovie.poster_path
              );

              if (!targetMovieId) {
                return null;
              }

              return (
                <S.RelatedMovieCard
                  key={targetMovieId}
                  to={buildPath(ROUTES.MOVIE_DETAIL, { id: targetMovieId })}
                  aria-label={`${resolveMovieTitle(targetMovie)} 상세 보기`}
                >
                  <S.RelatedPoster>
                    {targetPosterSrc ? (
                      <S.RelatedPosterImg
                        src={targetPosterSrc}
                        alt={`${resolveMovieTitle(targetMovie)} 포스터`}
                        loading="lazy"
                      />
                    ) : (
                      <S.RelatedPosterPlaceholder>
                        <S.RelatedPosterPlaceholderIcon>🎬</S.RelatedPosterPlaceholderIcon>
                        <span>포스터 없음</span>
                      </S.RelatedPosterPlaceholder>
                    )}

                    <S.RelatedMovieBody>
                      <S.RelatedMovieTitle>{resolveMovieTitle(targetMovie)}</S.RelatedMovieTitle>
                      <S.RelatedMovieMeta>
                        {resolveReleaseYear(targetMovie) || '연도 미상'}
                      </S.RelatedMovieMeta>

                      {targetMovie.relationReasons?.length > 0 && (
                        <S.RelatedReasonList>
                          {targetMovie.relationReasons.map((reason) => (
                            <S.RelatedReasonTag key={`${targetMovieId}-${reason}`}>
                              {reason}
                            </S.RelatedReasonTag>
                          ))}
                        </S.RelatedReasonList>
                      )}
                    </S.RelatedMovieBody>
                  </S.RelatedPoster>
                </S.RelatedMovieCard>
              );
            })}

            {loading && movieSkeletons.map((index) => (
              <S.RelatedMovieSkeletonCard key={`related-skeleton-${index}`} aria-hidden="true">
                <S.RelatedPosterSkeleton>
                  <S.RelatedMovieSkeletonBody>
                    <S.RelatedSkeletonLine $width="76%" $height="12px" />
                    <S.RelatedSkeletonLine $width="34%" $height="9px" />
                    <S.RelatedSkeletonTagRow>
                      <S.RelatedSkeletonTag $width="48px" />
                      <S.RelatedSkeletonTag $width="56px" />
                    </S.RelatedSkeletonTagRow>
                  </S.RelatedMovieSkeletonBody>
                </S.RelatedPosterSkeleton>
              </S.RelatedMovieSkeletonCard>
            ))}
          </S.RelatedMovieGrid>

          {loading && (
            <S.RelatedStatusText>
              {loadingMoreText || loadingText}
            </S.RelatedStatusText>
          )}
        </>
      );
    }

    if (loading) {
      return (
        <>
          <S.RelatedMovieGrid>
            {movieSkeletons.map((index) => (
              <S.RelatedMovieSkeletonCard key={`related-skeleton-empty-${index}`} aria-hidden="true">
                <S.RelatedPosterSkeleton>
                  <S.RelatedMovieSkeletonBody>
                    <S.RelatedSkeletonLine $width="76%" $height="12px" />
                    <S.RelatedSkeletonLine $width="34%" $height="9px" />
                    <S.RelatedSkeletonTagRow>
                      <S.RelatedSkeletonTag $width="48px" />
                      <S.RelatedSkeletonTag $width="56px" />
                    </S.RelatedSkeletonTagRow>
                  </S.RelatedMovieSkeletonBody>
                </S.RelatedPosterSkeleton>
              </S.RelatedMovieSkeletonCard>
            ))}
          </S.RelatedMovieGrid>
          <S.RelatedStatusText>{loadingText}</S.RelatedStatusText>
        </>
      );
    }

    return (
      <S.RelatedStatusText>
        {emptyText}
      </S.RelatedStatusText>
    );
  };

  return (
    <S.Wrapper>
      {/* ── 상단: 포스터 + 기본 정보 ── */}
      <S.Top>
        {/* 포스터 */}
        <S.Poster>
          {posterSrc ? (
            <>
              {/* 포스터 로딩 전 Skeleton */}
              {!posterLoaded && <S.PosterSkeleton />}
              <S.PosterImg
                src={posterSrc}
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
          {(() => {
            const genresArray = parseGenres(movie.genres);
            return genresArray.length > 0 ? (
              <S.Genres>
                {genresArray.map((genre) => (
                  <S.GenreTag
                    key={typeof genre === 'string' ? genre : (genre.name || genre.id)}
                  >
                    {typeof genre === 'string' ? genre : genre.name}
                  </S.GenreTag>
                ))}
              </S.Genres>
            ) : null;
          })()}

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
                {isWishlisted ? '★ 위시리스트에 추가됨' : '✩ 위시리스트에 추가'}
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

            {/* 리뷰 작성 버튼 */}
            {onReviewWrite && (
              <S.ReviewWriteBtn
                type="button"
                onClick={onReviewWrite}
                $completed={hasReviewed}
              >
                {hasReviewed ? '리뷰 작성 완료' : '리뷰 작성'}
              </S.ReviewWriteBtn>
            )}

            {/* 트레일러 버튼 */}
            {embedUrl && (
              <S.TrailerBtn onClick={() => setShowTrailer((prev) => !prev)}>
                {showTrailer ? '트레일러 닫기' : '▶ 트레일러 보기'}
              </S.TrailerBtn>
            )}
          </S.Actions>
        </S.Info>
      </S.Top>

      {/* ── 트레일러 (YouTube 임베드) ── */}
      {showTrailer && embedUrl && (
        <S.Trailer>
          <S.TrailerIframe
            src={embedUrl}
            title="트레일러"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
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

      {/* ── 같은 시리즈 작품 ── */}
      {collectionMovieSeedExists && (
        <S.Section>
          <S.SectionHeading>
            <S.SectionTitle>
              {movie.collection_name || '같은 시리즈 작품'}
            </S.SectionTitle>
          </S.SectionHeading>

          {renderMovieCarousel({
            movies: collectionMovies,
            loading: collectionMoviesLoading,
            emptyText: '같은 시리즈 작품이 아직 없습니다.',
            loadingText: '시리즈 작품을 찾는 중입니다.',
            loadingMoreText: '추가 시리즈 작품을 찾는 중입니다.',
          })}
        </S.Section>
      )}

      {/* ── 연관 영화 ── */}
      {relatedMovieSeedExists && (
        <S.Section>
          <S.SectionTitle>연관 영화</S.SectionTitle>

          {renderMovieCarousel({
            movies: relatedMovies,
            loading: relatedMoviesLoading,
            emptyText: '연관 영화 후보를 아직 찾지 못했습니다.',
            loadingText: '연관 영화를 찾는 중입니다.',
            loadingMoreText: '추가 연관 영화를 찾는 중입니다.',
          })}
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
