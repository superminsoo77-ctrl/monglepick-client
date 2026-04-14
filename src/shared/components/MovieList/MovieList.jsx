/**
 * 영화 목록 그리드 컴포넌트.
 *
 * 영화 카드들을 반응형 그리드로 배치한다.
 * 각 카드는 포스터, 제목, 평점, 장르 정보를 표시하며,
 * 클릭 시 영화 상세 페이지로 이동한다.
 *
 * 개선 사항:
 * - 로딩 중 Skeleton 카드 6개 표시
 * - 포스터 없는 영화: 이모지 + "포스터 없음" 텍스트 개선
 * - 카드 호버 시 "자세히 보기" 오버레이
 * - 빈 상태에 EmptyState 컴포넌트 적용
 *
 * @param {Object} props
 * @param {Array} props.movies - 영화 객체 배열
 * @param {string} [props.title] - 섹션 제목 (선택)
 * @param {boolean} [props.loading=false] - 로딩 상태
 */

/* 라우트 경로 상수 + 경로 빌더 — shared/constants에서 가져옴 */
import { buildPath, ROUTES } from '../../constants/routes';
/* 포맷팅 유틸 — shared/utils에서 가져옴 */
import { formatRating, truncateText, genreMapper } from '../../utils/formatters';
/* 스켈레톤 로더 — shared/components에서 가져옴 */
import Skeleton from '../Skeleton/Skeleton';
/* 빈 상태 컴포넌트 — shared/components에서 가져옴 */
import EmptyState from '../EmptyState/EmptyState';
import * as S from './MovieList.styled';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

/**
 * genres를 배열로 안전하게 변환한다.
 * Backend API는 genres를 JSON 문자열로 반환하므로 파싱이 필요하다.
 */
function parseGenres(genres) {
  if (Array.isArray(genres)) return genres;
  if (typeof genres === 'string') {
    try { return JSON.parse(genres); } catch { return []; }
  }
  return [];
}

/**
 * 영화 포스터 소스를 안전하게 해석한다.
 * - full URL: 그대로 사용
 * - TMDB path fragment(`/abc.jpg`): w500 URL로 조합
 * - camelCase/snake_case/full URL 혼용 응답 모두 지원
 */
function resolvePosterSrc(movie) {
  const rawPoster = (
    movie?.poster_path
    || movie?.posterPath
    || movie?.posterUrl
    || movie?.poster_url
    || null
  );

  if (!rawPoster || typeof rawPoster !== 'string') {
    return null;
  }

  if (rawPoster.startsWith('http://') || rawPoster.startsWith('https://')) {
    return rawPoster;
  }

  if (rawPoster.startsWith('/')) {
    return `${TMDB_IMAGE_BASE}${rawPoster}`;
  }

  return rawPoster;
}

export default function MovieList({ movies = [], title, loading = false, onMovieClick }) {
  // 로딩 중 — Skeleton 카드 6개 표시
  if (loading) {
    return (
      <S.Section>
        {title && <S.Title>{title}</S.Title>}
        <S.Grid>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Skeleton key={n} variant="card" />
          ))}
        </S.Grid>
      </S.Section>
    );
  }

  // 영화 데이터가 없을 때 — EmptyState 컴포넌트
  if (!movies || movies.length === 0) {
    return (
      <EmptyState
        icon="🎬"
        title="표시할 영화가 없습니다"
        description="다른 조건으로 검색해보세요"
      />
    );
  }

  return (
    <S.Section>
      {/* 섹션 제목 (옵션) */}
      {title && <S.Title>{title}</S.Title>}

      {/* 영화 카드 그리드 */}
      <S.Grid>
        {movies.map((movie, index) => {
          const posterSrc = resolvePosterSrc(movie);

          return (
            <S.Card
              key={movie.id || movie.movieId}
              to={buildPath(ROUTES.MOVIE_DETAIL, { id: movie.id || movie.movieId })}
              $index={index}
              onClick={() => {
                if (onMovieClick) {
                  void onMovieClick(movie);
                }
              }}
            >
              {/* 포스터 이미지 */}
              <S.Poster>
                {posterSrc ? (
                  <S.PosterImg
                    src={posterSrc}
                    alt={`${movie.title || movie.title_ko} 포스터`}
                    loading="lazy"
                  />
                ) : (
                  /* 포스터 없을 때 — 이모지 + 텍스트 개선 */
                  <S.PosterPlaceholder>
                    <S.PlaceholderIcon>🎬</S.PlaceholderIcon>
                    <S.PlaceholderText>포스터 없음</S.PlaceholderText>
                  </S.PosterPlaceholder>
                )}

                {/* 평점 배지 (평점이 있을 때만 표시) */}
                {movie.rating > 0 && (
                  <S.RatingBadge>
                    {formatRating(movie.rating)}
                  </S.RatingBadge>
                )}

                {/* 호버 시 오버레이 — "자세히 보기" */}
                <S.Overlay>
                  <S.OverlayText>자세히 보기</S.OverlayText>
                </S.Overlay>
              </S.Poster>

              {/* 영화 정보 */}
              <S.Info>
                <S.Name>
                  {truncateText(movie.title || movie.title_ko, 20)}
                </S.Name>

                {/* 장르 태그 (최대 2개) — genres가 JSON 문자열일 수 있으므로 parseGenres로 변환 */}
                {(() => {
                  const genreList = parseGenres(movie.genres);
                  return genreList.length > 0 ? (
                    <S.Genres>
                      {genreList.slice(0, 2).map((genre) => (
                        <S.GenreTag key={typeof genre === 'string' ? genre : (genre.name || genre.id)}>
                          {genreMapper(genre)}
                        </S.GenreTag>
                      ))}
                    </S.Genres>
                  ) : null;
                })()}

                {/* 개봉 연도 — Backend 응답은 releaseYear(정수), Recommend는 release_date(문자열) */}
                {(movie.releaseYear || movie.release_date) && (
                  <S.Year>
                    {movie.releaseYear || new Date(movie.release_date).getFullYear()}
                  </S.Year>
                )}
              </S.Info>
            </S.Card>
          );
        })}
      </S.Grid>
    </S.Section>
  );
}
