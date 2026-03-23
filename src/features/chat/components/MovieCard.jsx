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
 * - 트레일러 링크
 * - OTT 플랫폼
 */

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
    // 포스터 없을 때 플레이스홀더
    return `https://placehold.co/342x513/1a1a2e/666?text=No+Poster`;
  }
  return `https://image.tmdb.org/t/p/${size}${posterPath}`;
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

  return (
    <div className="movie-card">
      {/* 순위 배지 */}
      {rank && <span className="movie-card__rank">#{rank}</span>}

      {/* 포스터 이미지 */}
      <div className="movie-card__poster">
        <img
          src={getPosterUrl(poster_path)}
          alt={`${title} 포스터`}
          loading="lazy"
        />
      </div>

      {/* 카드 정보 영역 */}
      <div className="movie-card__info">
        {/* 제목 */}
        <h3 className="movie-card__title">{title}</h3>
        {title_en && <p className="movie-card__title-en">{title_en}</p>}

        {/* 메타 정보 (연도, 평점, 관람등급) */}
        <div className="movie-card__meta">
          {release_year && <span>{release_year}</span>}
          {rating != null && <span>★ {rating.toFixed(1)}</span>}
          {certification && <span>{certification}</span>}
        </div>

        {/* 감독 · 출연 */}
        {director && (
          <p className="movie-card__crew">
            감독: {director}
            {cast.length > 0 && ` | 출연: ${cast.slice(0, 3).join(', ')}`}
          </p>
        )}

        {/* 장르 태그 */}
        {genres.length > 0 && (
          <div className="movie-card__tags">
            {genres.map((g) => (
              <span key={g} className="movie-card__tag movie-card__tag--genre">
                {g}
              </span>
            ))}
          </div>
        )}

        {/* 무드 태그 */}
        {mood_tags.length > 0 && (
          <div className="movie-card__tags">
            {mood_tags.map((m) => (
              <span key={m} className="movie-card__tag movie-card__tag--mood">
                {m}
              </span>
            ))}
          </div>
        )}

        {/* 줄거리 (최대 100자) */}
        {overview && (
          <p className="movie-card__overview">
            {overview.length > 100 ? overview.slice(0, 100) + '...' : overview}
          </p>
        )}

        {/* 추천 이유 */}
        {explanation && (
          <p className="movie-card__explanation">{explanation}</p>
        )}

        {/* OTT 플랫폼 */}
        {ott_platforms.length > 0 && (
          <div className="movie-card__ott">
            {ott_platforms.map((p) => (
              <span key={p} className="movie-card__ott-badge">{p}</span>
            ))}
          </div>
        )}

        {/* 트레일러 링크 */}
        {trailer_url && (
          <a
            href={trailer_url}
            target="_blank"
            rel="noopener noreferrer"
            className="movie-card__trailer"
          >
            ▶ 트레일러 보기
          </a>
        )}
      </div>
    </div>
  );
}
