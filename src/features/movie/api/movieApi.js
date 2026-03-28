/**
 * 영화(Movies) API 모듈.
 *
 * 영화 정보 조회, 검색 등 영화 관련 HTTP 요청을 처리한다.
 * axios 인스턴스를 사용하며, 인증이 필요한 요청은 interceptor가 Authorization 헤더를 자동 추가한다.
 */

/* 서비스별 axios 인스턴스 — Backend(영화 상세/인기), Recommend(검색) */
import { backendApi, recommendApi } from '../../../shared/api/axiosInstance';
/* API 상수 */
import { MOVIE_ENDPOINTS, SEARCH_ENDPOINTS } from '../../../shared/constants/api';

/**
 * 영화 상세 정보를 조회한다.
 *
 * @param {number|string} movieId - 영화 ID
 * @returns {Promise<Object>} 영화 상세 정보 객체
 */
export async function getMovie(movieId) {
  const movie = await backendApi.get(MOVIE_ENDPOINTS.DETAIL(movieId));
  return {
    ...movie,
    id: movie.movie_id,
    posterUrl: movie.poster_url,
    backdropUrl: movie.backdrop_url,
    original_title: movie.original_title,
    releaseYear: movie.release_year,
    release_date: movie.release_date || (movie.release_year ? `${movie.release_year}-01-01` : null),
    trailerUrl: movie.trailer_url,
    cast: (movie.cast || []).map((actor) => (
      typeof actor === 'string' ? { name: actor } : actor
    )),
  };
}

function normalizeSearchMovie(movie) {
  return {
    ...movie,
    id: movie.movie_id,
    posterUrl: movie.poster_url,
    trailerUrl: movie.trailer_url,
    releaseYear: movie.release_year,
    release_date: movie.release_year ? `${movie.release_year}-01-01` : null,
  };
}

/**
 * 영화를 검색한다.
 * 키워드, 장르, 정렬 등의 필터를 지원한다.
 *
 * @param {Object} params - 검색 파라미터
 * @param {string} params.query - 검색 키워드
 * @param {string} [params.searchType='all'] - 검색 대상 (all, title, director, actor)
 * @param {string} [params.genre] - 장르 필터
 * @param {string} [params.sort='relevance'] - 정렬 기준 (relevance, rating, date)
 * @param {number} [params.page=1] - 페이지 번호
 * @param {number} [params.size=20] - 페이지 크기
 * @returns {Promise<Object>} 검색 결과 ({ movies: [], total: number, page: number })
 */
export async function searchMovies({
  query,
  searchType = 'all',
  genre,
  sort = 'relevance',
  page = 1,
  size = 20,
}) {
  /* FastAPI 검색 파라미터 구성 */
  const params = { page, size, search_type: searchType };
  if (query) params.q = query;
  if (genre) params.genre = genre;
  if (sort === 'rating') {
    params.sort_by = 'rating';
    params.sort_order = 'desc';
  } else if (sort === 'date') {
    params.sort_by = 'release_date';
    params.sort_order = 'desc';
  }

  const data = await recommendApi.get(MOVIE_ENDPOINTS.SEARCH, { params });
  return {
    ...data,
    total: data?.pagination?.total || 0,
    movies: (data?.movies || []).map(normalizeSearchMovie),
  };
}

/**
 * 인기 영화 목록을 조회한다.
 *
 * @param {number} [page=1] - 페이지 번호
 * @param {number} [size=20] - 페이지 크기
 * @returns {Promise<Object>} 인기 영화 목록 ({ movies: [], total: number })
 */
export async function getPopularMovies(page = 1, size = 20) {
  return backendApi.get(MOVIE_ENDPOINTS.POPULAR, { params: { page, size } });
}

/**
 * 최신 영화 목록을 조회한다.
 *
 * @param {number} [page=1] - 페이지 번호
 * @param {number} [size=20] - 페이지 크기
 * @returns {Promise<Object>} 최신 영화 목록 ({ movies: [], total: number })
 */
export async function getLatestMovies(page = 1, size = 20) {
  return backendApi.get(MOVIE_ENDPOINTS.LATEST, { params: { page, size } });
}
