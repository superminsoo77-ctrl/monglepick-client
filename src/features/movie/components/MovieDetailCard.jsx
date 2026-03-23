/**
 * 영화 상세 정보 카드 컴포넌트.
 *
 * 영화의 모든 상세 정보를 표시한다:
 * - 포스터, 제목, 줄거리, 장르, 출연진, 평점
 * - 트레일러 (YouTube 임베드)
 * - OTT 플랫폼 정보
 * - 감독, 개봉일, 러닝타임 등 메타 정보
 *
 * @param {Object} props
 * @param {Object} props.movie - 영화 상세 정보 객체
 * @param {function} [props.onWishlistToggle] - 위시리스트 토글 콜백
 * @param {boolean} [props.isWishlisted=false] - 위시리스트 포함 여부
 */

import { useState } from 'react';
/* 포맷팅 유틸 — shared/utils에서 가져옴 */
import { formatRating, formatRatingStars, formatRuntime, formatDate, formatGenres } from '../../../shared/utils/formatters';
import './MovieDetailCard.css';

export default function MovieDetailCard({ movie, onWishlistToggle, isWishlisted = false }) {
  // 줄거리 펼치기/접기 상태
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  // 트레일러 표시 상태
  const [showTrailer, setShowTrailer] = useState(false);

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
    <article className="movie-detail">
      {/* ── 상단: 포스터 + 기본 정보 ── */}
      <div className="movie-detail__top">
        {/* 포스터 */}
        <div className="movie-detail__poster">
          {movie.poster_path || movie.posterUrl ? (
            <img
              src={movie.poster_path || movie.posterUrl}
              alt={`${movie.title} 포스터`}
              className="movie-detail__poster-img"
            />
          ) : (
            <div className="movie-detail__poster-placeholder">포스터 없음</div>
          )}
        </div>

        {/* 기본 정보 */}
        <div className="movie-detail__info">
          {/* 제목 */}
          <h1 className="movie-detail__title">{movie.title || movie.title_ko}</h1>

          {/* 원제 (한국어 제목과 다를 때) */}
          {movie.original_title && movie.original_title !== movie.title && (
            <p className="movie-detail__original-title">{movie.original_title}</p>
          )}

          {/* 평점 */}
          <div className="movie-detail__rating">
            <span className="movie-detail__rating-stars">
              {formatRatingStars(movie.rating || movie.vote_average)}
            </span>
            <span className="movie-detail__rating-value">
              {formatRating(movie.rating || movie.vote_average)}
            </span>
            {movie.vote_count && (
              <span className="movie-detail__rating-count">
                ({movie.vote_count.toLocaleString()}명)
              </span>
            )}
          </div>

          {/* 메타 정보 (개봉일, 러닝타임, 관람등급) */}
          <div className="movie-detail__meta">
            {movie.release_date && (
              <span className="movie-detail__meta-item">
                {formatDate(movie.release_date)} 개봉
              </span>
            )}
            {movie.runtime && (
              <span className="movie-detail__meta-item">
                {formatRuntime(movie.runtime)}
              </span>
            )}
            {movie.certification && (
              <span className="movie-detail__meta-item movie-detail__certification">
                {movie.certification}
              </span>
            )}
          </div>

          {/* 장르 태그 */}
          {movie.genres && movie.genres.length > 0 && (
            <div className="movie-detail__genres">
              {movie.genres.map((genre, idx) => (
                <span key={idx} className="movie-detail__genre-tag">
                  {typeof genre === 'string' ? genre : genre.name}
                </span>
              ))}
            </div>
          )}

          {/* 감독 */}
          {movie.director && (
            <div className="movie-detail__director">
              <span className="movie-detail__label">감독</span>
              <span>{movie.director}</span>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="movie-detail__actions">
            {/* 위시리스트 버튼 */}
            {onWishlistToggle && (
              <button
                className={`movie-detail__btn movie-detail__btn--wishlist ${isWishlisted ? 'movie-detail__btn--wishlisted' : ''}`}
                onClick={() => onWishlistToggle(movie.id)}
              >
                {isWishlisted ? '♥ 위시리스트에 추가됨' : '♡ 위시리스트에 추가'}
              </button>
            )}

            {/* 트레일러 버튼 */}
            {youtubeId && (
              <button
                className="movie-detail__btn movie-detail__btn--trailer"
                onClick={() => setShowTrailer((prev) => !prev)}
              >
                {showTrailer ? '트레일러 닫기' : '▶ 트레일러 보기'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 트레일러 (YouTube 임베드) ── */}
      {showTrailer && youtubeId && (
        <div className="movie-detail__trailer">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
            title="트레일러"
            className="movie-detail__trailer-iframe"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* ── 줄거리 ── */}
      {movie.overview && (
        <div className="movie-detail__overview">
          <h2 className="movie-detail__section-title">줄거리</h2>
          <p className={`movie-detail__overview-text ${isOverviewExpanded ? '' : 'movie-detail__overview-text--collapsed'}`}>
            {movie.overview}
          </p>
          {movie.overview.length > 200 && (
            <button className="movie-detail__overview-toggle" onClick={toggleOverview}>
              {isOverviewExpanded ? '접기' : '더 보기'}
            </button>
          )}
        </div>
      )}

      {/* ── 출연진 ── */}
      {movie.cast && movie.cast.length > 0 && (
        <div className="movie-detail__cast">
          <h2 className="movie-detail__section-title">출연진</h2>
          <div className="movie-detail__cast-list">
            {movie.cast.slice(0, 10).map((actor, idx) => (
              <div key={idx} className="movie-detail__cast-item">
                <div className="movie-detail__cast-avatar">
                  {actor.profile_path ? (
                    <img src={actor.profile_path} alt={actor.name} />
                  ) : (
                    <span>{actor.name?.charAt(0)}</span>
                  )}
                </div>
                <span className="movie-detail__cast-name">{actor.name}</span>
                {actor.character && (
                  <span className="movie-detail__cast-character">{actor.character}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── OTT 플랫폼 ── */}
      {movie.ott_platforms && movie.ott_platforms.length > 0 && (
        <div className="movie-detail__ott">
          <h2 className="movie-detail__section-title">시청 가능한 곳</h2>
          <div className="movie-detail__ott-list">
            {movie.ott_platforms.map((platform, idx) => (
              <span key={idx} className="movie-detail__ott-tag">
                {platform}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
