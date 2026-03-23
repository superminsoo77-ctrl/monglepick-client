/**
 * 영화(Movies) API 모듈.
 *
 * 영화 정보 조회, 검색 등 영화 관련 HTTP 요청을 처리한다.
 * fetch API를 사용하며, 인증이 필요한 요청은 Authorization 헤더를 포함한다.
 */

/* API 상수 — shared/constants에서 가져옴 */
import { MOVIE_ENDPOINTS, API_BASE_URL } from '../../../shared/constants/api';
/* localStorage 유틸 — shared/utils에서 가져옴 */
import { getToken } from '../../../shared/utils/storage';

/**
 * 인증 헤더를 포함한 공통 fetch 래퍼.
 * 저장된 토큰이 있으면 Authorization 헤더를 자동 추가한다.
 *
 * @param {string} url - 요청 URL
 * @param {Object} [options={}] - fetch 옵션
 * @returns {Promise<Object>} 파싱된 JSON 응답
 * @throws {Error} HTTP 에러 시 에러 메시지 포함
 */
async function fetchWithAuth(url, options = {}) {
  const token = getToken();

  // 헤더 구성: 토큰이 있으면 Authorization 추가
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.message || data?.detail || `요청 실패 (${response.status})`;
    throw new Error(errorMessage);
  }

  return data;
}

/**
 * 영화 상세 정보를 조회한다.
 *
 * @param {number|string} movieId - 영화 ID
 * @returns {Promise<Object>} 영화 상세 정보 객체
 *   - id, title, overview, genres, cast, rating, poster_path,
 *     trailer_url, ott_platforms, release_date, runtime 등
 *
 * @example
 * const movie = await getMovie(550);
 * console.log(movie.title); // '파이트 클럽'
 */
export async function getMovie(movieId) {
  return fetchWithAuth(MOVIE_ENDPOINTS.DETAIL(movieId));
}

/**
 * 영화를 검색한다.
 * 키워드, 장르, 정렬 등의 필터를 지원한다.
 *
 * @param {Object} params - 검색 파라미터
 * @param {string} params.query - 검색 키워드
 * @param {string} [params.genre] - 장르 필터
 * @param {string} [params.sort='relevance'] - 정렬 기준 (relevance, rating, date)
 * @param {number} [params.page=1] - 페이지 번호
 * @param {number} [params.size=20] - 페이지 크기
 * @returns {Promise<Object>} 검색 결과 ({ movies: [], total: number, page: number })
 *
 * @example
 * const results = await searchMovies({ query: '인터스텔라', genre: 'SF' });
 * console.log(results.movies.length); // 검색된 영화 수
 */
export async function searchMovies({ query, genre, sort = 'relevance', page = 1, size = 20 }) {
  // URL 쿼리 파라미터 구성
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (genre) params.append('genre', genre);
  if (sort) params.append('sort', sort);
  params.append('page', String(page));
  params.append('size', String(size));

  return fetchWithAuth(`${MOVIE_ENDPOINTS.SEARCH}?${params.toString()}`);
}

/**
 * 인기 영화 목록을 조회한다.
 *
 * @param {number} [page=1] - 페이지 번호
 * @param {number} [size=20] - 페이지 크기
 * @returns {Promise<Object>} 인기 영화 목록 ({ movies: [], total: number })
 */
export async function getPopularMovies(page = 1, size = 20) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return fetchWithAuth(`${MOVIE_ENDPOINTS.POPULAR}?${params.toString()}`);
}

/**
 * 최신 영화 목록을 조회한다.
 *
 * @param {number} [page=1] - 페이지 번호
 * @param {number} [size=20] - 페이지 크기
 * @returns {Promise<Object>} 최신 영화 목록 ({ movies: [], total: number })
 */
export async function getLatestMovies(page = 1, size = 20) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return fetchWithAuth(`${MOVIE_ENDPOINTS.LATEST}?${params.toString()}`);
}
