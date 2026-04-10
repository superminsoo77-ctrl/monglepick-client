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
// MOVIE_ENDPOINTS.LIKE / LIKE_STATUS / LIKE_COUNT 포함

/**
 * 영화 상세 정보를 조회한다.
 *
 * @param {number|string} movieId - 영화 ID
 * @returns {Promise<Object>} 영화 상세 정보 객체
 */
export async function getMovie(movieId) {
  const movie = await recommendApi.get(MOVIE_ENDPOINTS.DETAIL(movieId));
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
 * 검색 페이지에서 사용할 장르 선택 옵션을 조회한다.
 *
 * @returns {Promise<Array<{label: string, aliases: Array<string>, contents_count: number}>>}
 */
export async function getSearchGenres() {
  const data = await recommendApi.get(SEARCH_ENDPOINTS.GENRES);
  return data?.genres || [];
}

/**
 * 검색 입력 중 제목 자동완성 후보를 조회한다.
 *
 * Recommend API는 Redis 캐시를 우선 활용해 최대 10건까지 빠르게 반환한다.
 *
 * @param {Object} params - 자동완성 조회 파라미터
 * @param {string} params.query - 사용자가 입력 중인 검색어
 * @param {number} [params.limit=8] - 최대 후보 수
 * @returns {Promise<Array<string>>} 자동완성 후보 목록
 */
export async function getAutocompleteSuggestions({ query, limit = 8 }) {
  if (!query?.trim()) {
    return [];
  }

  const data = await recommendApi.get(SEARCH_ENDPOINTS.AUTOCOMPLETE, {
    params: {
      q: query.trim(),
      limit,
    },
  });

  return data?.suggestions || [];
}

/**
 * 영화를 검색한다.
 * 키워드, 장르, 정렬 등의 필터를 지원한다.
 *
 * @param {Object} params - 검색 파라미터
 * @param {string} params.query - 검색 키워드
 * @param {string} [params.searchType='all'] - 검색 대상 (all, title, director, actor)
 * @param {string} [params.genre] - 장르 필터
 * @param {Array<string>} [params.genres] - 장르만 검색용 다중 선택 장르 목록
 * @param {string} [params.sort='relevance'] - 정렬 기준 (relevance, rating, date)
 * @param {number} [params.page=1] - 페이지 번호
 * @param {number} [params.size=20] - 페이지 크기
 * @returns {Promise<Object>} 검색 결과 ({ movies: [], total: number, page: number })
 */
export async function searchMovies({
  query,
  searchType = 'all',
  genre,
  genres = [],
  sort = 'relevance',
  page = 1,
  size = 20,
}) {
  /* FastAPI 검색 파라미터 구성 */
  const params = { page, size, search_type: searchType };
  if (query) params.q = query;
  if (genre) params.genre = genre;
  if (genres.length > 0) params.genres = genres.join(',');
  if (sort === 'relevance') {
    params.sort_by = 'relevance';
    params.sort_order = 'desc';
  } else if (sort === 'rating') {
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
 * 로그인 사용자의 최근 검색 기록을 조회한다.
 *
 * Recommend API는 중복 제거된 최근 검색어를 최신순으로 페이지 단위 반환한다.
 *
 * @param {Object} [params] - 조회 파라미터
 * @param {number} [params.offset=0] - 중복 제거된 목록 기준 시작 위치
 * @param {number} [params.limit=30] - 페이지당 조회 개수
 * @returns {Promise<{searches: Array, pagination: Object}>}
 */
export async function getRecentSearches({ offset = 0, limit = 30 } = {}) {
  const data = await recommendApi.get(SEARCH_ENDPOINTS.RECENT, {
    params: { offset, limit },
  });

  return {
    searches: data?.searches || [],
    pagination: data?.pagination || {
      offset,
      limit,
      has_more: false,
      next_offset: null,
    },
  };
}

/**
 * 로그인 사용자의 특정 최근 검색어를 삭제한다.
 *
 * @param {string} keyword - 삭제할 검색 키워드
 * @returns {Promise<Object>} 삭제 결과
 */
export async function deleteRecentSearchKeyword(keyword) {
  return recommendApi.delete(SEARCH_ENDPOINTS.RECENT_KEYWORD(keyword));
}

/**
 * 로그인 사용자의 최근 검색 기록을 전체 삭제한다.
 *
 * @returns {Promise<Object>} 삭제 결과
 */
export async function deleteAllRecentSearches() {
  return recommendApi.delete(SEARCH_ENDPOINTS.RECENT);
}

/**
 * 검색 결과 클릭 로그를 저장한다.
 *
 * @param {Object} params - 클릭 로그 파라미터
 * @param {string} params.keyword - 검색 키워드
 * @param {string} params.clickedMovieId - 클릭한 영화 ID
 * @param {number} params.resultCount - 검색 결과 수
 * @param {Object} [params.filters] - 검색 필터 정보
 * @returns {Promise<Object>} 저장 결과
 */
export async function logSearchResultClick({
  keyword,
  clickedMovieId,
  resultCount,
  filters,
}) {
  return recommendApi.post(SEARCH_ENDPOINTS.CLICK_LOG, {
    keyword,
    clicked_movie_id: clickedMovieId,
    result_count: resultCount,
    filters,
  });
}

/**
 * 인기 영화 목록을 조회한다.
 * Spring Data Page 응답(content)을 { movies, total } 형식으로 변환한다.
 *
 * @param {number} [page=1] - 페이지 번호 (1-based, API 호출 시 0-based로 변환)
 * @param {number} [size=20] - 페이지 크기
 * @returns {Promise<Object>} 인기 영화 목록 ({ movies: [], total: number })
 */
export async function getPopularMovies(page = 1, size = 20) {
  const result = await backendApi.get(MOVIE_ENDPOINTS.POPULAR, {
    params: { page: page - 1, size },
  });
  return {
    movies: result?.content || [],
    total: result?.totalElements || 0,
  };
}

/**
 * 최신 영화 목록을 조회한다.
 *
 * 백엔드 `GET /api/v1/movies/latest` 는 Spring Data `Page<MovieResponse>` 를 반환한다.
 * getPopularMovies 와 동일한 `{ movies, total }` 형식으로 정규화하여 호출부에서 일관되게 사용할 수 있게 한다.
 *
 * @param {number} [page=1]  - 페이지 번호 (1-based, API 호출 시 0-based 로 변환)
 * @param {number} [size=8]  - 페이지 크기 (홈 섹션 기본 8)
 * @returns {Promise<{movies: Array, total: number}>} 최신 영화 목록 + 전체 개수
 */
export async function getLatestMovies(page = 1, size = 8) {
  const result = await backendApi.get(MOVIE_ENDPOINTS.LATEST, {
    params: { page: page - 1, size },
  });
  return {
    movies: result?.content || [],
    total: result?.totalElements || 0,
  };
}

/**
 * 영화 좋아요를 토글한다 (인스타그램 스타일 — 한 번 클릭으로 등록/취소 자동 전환).
 * 동일 엔드포인트 POST 호출로 등록 ↔ 취소가 자동 전환된다.
 * JWT 인증이 필요하다.
 *
 * @param {string|number} movieId - 영화 ID
 * @returns {Promise<{liked: boolean, likeCount: number}>} 토글 후 좋아요 상태
 */
export async function toggleMovieLike(movieId) {
  return backendApi.post(MOVIE_ENDPOINTS.LIKE(movieId));
}

/**
 * 로그인한 사용자의 영화 좋아요 상태를 조회한다.
 * JWT 인증이 필요하다.
 *
 * @param {string|number} movieId - 영화 ID
 * @returns {Promise<{liked: boolean, likeCount: number}>} 현재 좋아요 상태
 */
export async function getMovieLikeStatus(movieId) {
  return backendApi.get(MOVIE_ENDPOINTS.LIKE_STATUS(movieId));
}
