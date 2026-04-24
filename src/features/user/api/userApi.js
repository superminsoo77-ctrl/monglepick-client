/**
 * 마이페이지(MyPage) API 모듈.
 *
 * 사용자 프로필, 시청 이력, 위시리스트, 선호 설정 등
 * 마이페이지 관련 HTTP 요청을 처리한다.
 * 모든 요청에 인증 토큰이 필요하다.
 *
 * axios interceptor가 JWT 자동 주입 + 401 시 자동 토큰 갱신을 처리한다.
 */

/* 공용 axios 인스턴스 + 인증 필수 가드 */
import api, { recommendApi, requireAuth } from '../../../shared/api/axiosInstance';
/* API 상수 — shared/constants에서 가져옴 */
import {
  MYPAGE_ENDPOINTS,
  RECOMMEND_USER_ENDPOINTS,
  WATCH_HISTORY_ENDPOINTS,
} from '../../../shared/constants/api';

const MIN_VISIBLE_FAVORITE_GENRE_COUNT = 100;

function normalizeWishlistMovie(movie) {
  if (!movie) {
    return null;
  }

  return {
    ...movie,
    id: movie.movie_id || movie.movieId,
    posterUrl: movie.poster_url || movie.posterUrl,
    releaseYear: movie.release_year || movie.releaseYear,
  };
}

function normalizeReview(review) {
  if (!review) {
    return null;
  }

  return {
    id: review.id,
    movieId: review.movie_id || review.movieId,
    movieTitle: review.movie_title || review.movieTitle || null,
    posterUrl: review.poster_url || review.posterUrl || null,
    rating: review.rating,
    content: review.content,
    author: {
      nickname: review.author?.nickname || '익명',
    },
    isSpoiler: Boolean(review.is_spoiler ?? review.isSpoiler),
    isMine: Boolean(review.is_mine ?? review.isMine),
    reviewSource: review.review_source || review.reviewSource || null,
    reviewCategoryCode: review.review_category_code || review.reviewCategoryCode || null,
    createdAt: review.created_at || review.createdAt,
    likeCount: review.like_count ?? review.likeCount ?? 0,
    liked: Boolean(review.liked ?? false),
  };
}

function normalizeFavoriteMovie(item) {
  if (!item) {
    return null;
  }

  return {
    favMovieId: item.fav_movie_id || item.favMovieId,
    movieId: item.movie_id || item.movieId,
    priority: item.priority ?? 0,
    createdAt: item.created_at || item.createdAt || null,
    movie: normalizeWishlistMovie(item.movie),
  };
}

function normalizeFavoriteGenreOption(item) {
  if (!item) {
    return null;
  }

  const genreId = Number(item.genre_id ?? item.genreId);
  if (!Number.isFinite(genreId)) {
    return null;
  }

  return {
    genreId,
    genreCode: item.genre_code || item.genreCode,
    genreName: item.genre_name || item.genreName,
    contentsCount: item.contents_count ?? item.contentsCount ?? 0,
  };
}

function normalizeFavoriteGenre(item) {
  if (!item) {
    return null;
  }

  const genre = normalizeFavoriteGenreOption(item.genre);
  const genreId = Number(item.genre_id ?? item.genreId ?? genre?.genreId);
  if (!genre || !Number.isFinite(genreId)) {
    return null;
  }

  return {
    favGenreId: item.fav_genre_id || item.favGenreId,
    genreId,
    priority: item.priority ?? 0,
    createdAt: item.created_at || item.createdAt || null,
    genre,
  };
}

// ── 프로필 ──

/**
 * 사용자 프로필 정보를 조회한다.
 *
 * @returns {Promise<Object>} 프로필 정보
 *   - id, email, nickname, profileImage, createdAt, favoriteGenres 등
 */
export async function getProfile() {
  requireAuth();
  return api.get(MYPAGE_ENDPOINTS.PROFILE);
}

/**
 * 사용자 프로필 정보를 수정한다.
 *
 * @param {Object} profileData - 수정할 프로필 데이터
 * @param {string} [profileData.nickname] - 닉네임
 * @param {string} [profileData.profileImage] - 프로필 이미지 URL
 * @returns {Promise<Object>} 수정된 프로필 정보
 */
export async function updateProfile(profileData) {
  requireAuth();
  // If caller provided a FormData (file upload), send as multipart/form-data.
  // Otherwise send JSON body as before.
  if (typeof FormData !== 'undefined' && profileData instanceof FormData) {
    // Do NOT set Content-Type manually — the browser must generate the boundary.
    // Setting Content-Type: undefined removes the instance-level 'application/json'
    // default so the browser can attach the correct multipart/form-data; boundary=...
    return api.patch(MYPAGE_ENDPOINTS.UPDATE_PROFILE, profileData, {
      headers: { 'Content-Type': undefined },
    });
  }

  return api.patch(MYPAGE_ENDPOINTS.UPDATE_PROFILE, profileData);
}

// ── 위시리스트 ──

/**
 * 사용자의 위시리스트를 조회한다.
 *
 * @param {Object} [options={}] - 조회 파라미터
 * @param {number} [options.page=1] - 페이지 번호
 * @param {number} [options.size=20] - 페이지 크기
 * @returns {Promise<Object>} 위시리스트 ({ wishlist: [], total: number })
 */
export async function getWishlist({ page = 1, size = 20 } = {}) {
  requireAuth();
  const result = await recommendApi.get(RECOMMEND_USER_ENDPOINTS.WISHLIST, {
    params: { page, size },
  });

  return {
    wishlist: (result?.wishlist || []).map((item) => ({
      wishlistId: item.wishlist_id || item.wishlistId,
      movieId: item.movie_id || item.movieId,
      createdAt: item.created_at || item.createdAt,
      movie: normalizeWishlistMovie(item.movie),
    })),
    total: result?.total || 0,
  };
}

/**
 * 사용자가 작성한 리뷰를 최신순으로 페이징 조회한다.
 *
 * 마이페이지의 시청 이력 탭은 이제 watch_history 대신 이 응답을 사용한다.
 *
 * @param {Object} [options={}] - 조회 파라미터
 * @param {number} [options.page=1] - 페이지 번호 (1부터 시작)
 * @param {number} [options.size=20] - 페이지 크기
 * @returns {Promise<Object>} 내 리뷰 목록 ({ reviews, pagination })
 */
export async function getMyReviews({ page = 1, size = 20 } = {}) {
  requireAuth();
  const result = await recommendApi.get(RECOMMEND_USER_ENDPOINTS.MY_REVIEWS, {
    params: { page, size },
  });

  return {
    reviews: (result?.reviews || []).map(normalizeReview),
    pagination: {
      page: result?.pagination?.page || page,
      size: result?.pagination?.size || size,
      total: result?.pagination?.total || 0,
      totalPages: result?.pagination?.total_pages || result?.pagination?.totalPages || 0,
    },
  };
}

/**
 * 위시리스트에 영화를 추가한다.
 * Backend: POST /api/v1/users/me/wishlist/{movieId} → 201 Created
 *
 * @param {string} movieId - 영화 ID
 * @returns {Promise<void>}
 */
export async function addToWishlist(movieId) {
  requireAuth();
  return recommendApi.post(RECOMMEND_USER_ENDPOINTS.TOGGLE_WISHLIST(movieId));
}

/**
 * 위시리스트에서 영화를 제거한다.
 * Backend: DELETE /api/v1/users/me/wishlist/{movieId} → 204 No Content
 *
 * @param {string} movieId - 영화 ID
 * @returns {Promise<void>}
 */
export async function removeFromWishlist(movieId) {
  requireAuth();
  return recommendApi.delete(RECOMMEND_USER_ENDPOINTS.TOGGLE_WISHLIST(movieId));
}

/**
 * 특정 영화가 현재 사용자의 위시리스트에 포함되어 있는지 조회한다.
 *
 * 영화 상세 진입 시 버튼 초기 상태를 맞추는 용도다.
 *
 * @param {string} movieId - 영화 ID
 * @returns {Promise<{wishlisted: boolean}>}
 */
export async function getWishlistStatus(movieId) {
  requireAuth();
  return recommendApi.get(RECOMMEND_USER_ENDPOINTS.WISHLIST_STATUS(movieId));
}

// ── 최애 영화 ──

/**
 * 사용자의 최애 영화 목록을 priority 순으로 조회한다.
 *
 * @returns {Promise<{favoriteMovies: Array, total: number, maxCount: number}>}
 */
export async function getFavoriteMovies() {
  requireAuth();
  const result = await recommendApi.get(RECOMMEND_USER_ENDPOINTS.FAVORITE_MOVIES);

  return {
    favoriteMovies: (result?.favorite_movies || result?.favoriteMovies || [])
      .map(normalizeFavoriteMovie)
      .filter(Boolean),
    total: result?.total || 0,
    maxCount: result?.max_count || result?.maxCount || 9,
  };
}

/**
 * 모달에서 선택한 최애 영화 목록을 저장한다.
 *
 * @param {Array<string>} movieIds - 저장할 영화 ID 목록
 * @returns {Promise<{favoriteMovies: Array, total: number, maxCount: number}>}
 */
export async function saveFavoriteMovies(movieIds) {
  requireAuth();
  const result = await recommendApi.put(RECOMMEND_USER_ENDPOINTS.FAVORITE_MOVIES, {
    movie_ids: movieIds,
  });

  return {
    favoriteMovies: (result?.favorite_movies || []).map(normalizeFavoriteMovie).filter(Boolean),
    total: result?.total || 0,
    maxCount: result?.max_count || 9,
  };
}

/**
 * 현재 저장된 최애 영화의 순서를 다시 저장한다.
 *
 * @param {Array<string>} movieIds - 새 순서의 영화 ID 목록
 * @returns {Promise<{favoriteMovies: Array, total: number, maxCount: number}>}
 */
export async function reorderFavoriteMovies(movieIds) {
  requireAuth();
  const result = await recommendApi.put(RECOMMEND_USER_ENDPOINTS.FAVORITE_MOVIE_ORDER, {
    movie_ids: movieIds,
  });

  return {
    favoriteMovies: (result?.favorite_movies || []).map(normalizeFavoriteMovie).filter(Boolean),
    total: result?.total || 0,
    maxCount: result?.max_count || 9,
  };
}

// ── 선호 장르 ──

/**
 * 사용자의 선호 장르 목록과 선택 가능한 장르 옵션을 조회한다.
 *
 * @returns {Promise<{availableGenres: Array, selectedGenres: Array, selectedGenreIds: Array<number>}>}
 */
export async function getFavoriteGenres() {
  requireAuth();
  const result = await recommendApi.get(RECOMMEND_USER_ENDPOINTS.FAVORITE_GENRES);

  const availableGenres = (result?.available_genres || result?.availableGenres || [])
    .map(normalizeFavoriteGenreOption)
    .filter((item) => item?.contentsCount >= MIN_VISIBLE_FAVORITE_GENRE_COUNT)
    .filter(Boolean);
  const selectedGenres = (result?.selected_genres || result?.selectedGenres || [])
    .map(normalizeFavoriteGenre)
    .filter(Boolean);

  return {
    availableGenres,
    selectedGenres,
    selectedGenreIds: selectedGenres.map((item) => item.genreId),
  };
}

/**
 * 사용자가 선택한 선호 장르 목록을 저장한다.
 *
 * @param {Array<number>} genreIds - 저장할 장르 ID 목록 (선택 순서 포함)
 * @returns {Promise<{availableGenres: Array, selectedGenres: Array, selectedGenreIds: Array<number>}>}
 */
export async function saveFavoriteGenres(genreIds) {
  requireAuth();
  const result = await recommendApi.put(RECOMMEND_USER_ENDPOINTS.FAVORITE_GENRES, {
    genre_ids: genreIds,
  });

  const availableGenres = (result?.available_genres || result?.availableGenres || [])
    .map(normalizeFavoriteGenreOption)
    .filter((item) => item?.contentsCount >= MIN_VISIBLE_FAVORITE_GENRE_COUNT)
    .filter(Boolean);
  const selectedGenres = (result?.selected_genres || result?.selectedGenres || [])
    .map(normalizeFavoriteGenre)
    .filter(Boolean);

  return {
    availableGenres,
    selectedGenres,
    selectedGenreIds: selectedGenres.map((item) => item.genreId),
  };
}

// ── 시청 이력 ──

/**
 * 사용자의 시청 이력을 페이징 조회한다 (마이페이지 통합 경로).
 *
 * Backend: GET /api/v1/users/me/watch-history → 200 OK + Page<UserWatchHistoryResponse>
 *
 * Spring Data Pageable 응답 구조이므로 응답에는 content[], totalElements, totalPages,
 * number(현재 페이지), size 가 포함된다. 정렬 기본값은 watchedAt DESC (최신순).
 *
 * @param {Object} [options={}] - 조회 파라미터
 * @param {number} [options.page=0] - 페이지 번호 (0부터 시작 — Spring 표준)
 * @param {number} [options.size=20] - 페이지 크기
 * @returns {Promise<Object>} 페이지 응답 ({ content, totalElements, totalPages, ... })
 */
export async function getMyWatchHistory({ page = 0, size = 20 } = {}) {
  requireAuth();
  return api.get(MYPAGE_ENDPOINTS.WATCH_HISTORY_ME, { params: { page, size } });
}

/**
 * 시청 기록을 추가한다.
 *
 * Backend: POST /api/v1/watch-history → 201 Created + UserWatchHistoryResponse
 *
 * 동일 영화를 여러 번 시청한 경우 매번 새 레코드로 저장된다(중복 허용).
 * 재관람 횟수 추적을 위한 의도적 설계이며, watchedAt 미입력 시 서버 시각이 자동 채워진다.
 *
 * @param {Object} payload - 시청 기록 요청
 * @param {string} payload.movieId - 영화 ID (필수)
 * @param {string} [payload.watchedAt] - ISO 8601 시청 일시 (선택, 미입력 시 서버 시각)
 * @param {number} [payload.rating] - 평점 1.0 ~ 5.0 (선택)
 * @param {string} [payload.watchSource] - 시청 경로 (recommendation/search/wishlist/home/match/direct)
 * @param {number} [payload.watchDurationSeconds] - 실제 시청 시간 초 단위 (선택)
 * @param {string} [payload.completionStatus] - COMPLETED / ABANDONED / IN_PROGRESS (선택)
 * @returns {Promise<Object>} 저장된 시청 이력 응답 DTO
 */
export async function addWatchHistory(payload) {
  requireAuth();
  return api.post(WATCH_HISTORY_ENDPOINTS.ADD, payload);
}

/**
 * 특정 시청 기록을 삭제한다 (본인 소유만 가능).
 *
 * Backend: DELETE /api/v1/watch-history/{id} → 204 No Content
 *
 * 본인 소유가 아니거나 존재하지 않는 ID 는 동일하게 400 으로 응답된다 (enumeration attack 방지).
 *
 * @param {number|string} id - 삭제할 시청 이력 PK (user_watch_history_id)
 * @returns {Promise<void>}
 */
export async function deleteWatchHistory(id) {
  requireAuth();
  return api.delete(WATCH_HISTORY_ENDPOINTS.DELETE(id));
}

/**
 * 특정 영화의 재관람 횟수를 조회한다.
 *
 * Backend: GET /api/v1/watch-history/movies/{movieId}/count → 200 OK + { movieId, count }
 *
 * 시청 기록이 없으면 count 는 0 으로 반환된다. 영화 상세 화면의
 * "이 영화를 N 번 봤어요" 표시 등에 사용한다.
 *
 * @param {string} movieId - 조회 대상 영화 ID
 * @returns {Promise<{ movieId: string, count: number }>}
 */
export async function getRewatchCount(movieId) {
  requireAuth();
  return api.get(WATCH_HISTORY_ENDPOINTS.REWATCH_COUNT(movieId));
}

// ── 내가 쓴 글 ──

/**
 * 내가 작성한 게시글 목록을 페이징 조회한다.
 *
 * @param {Object} [options={}]
 * @param {number} [options.page=0] - 페이지 번호 (0부터 시작)
 * @param {number} [options.size=20] - 페이지 크기
 * @returns {Promise<Object>} { posts, totalElements, totalPages }
 */
export async function getMyPosts({ page = 0, size = 20 } = {}) {
  requireAuth();
  return api.get(MYPAGE_ENDPOINTS.MY_POSTS, { params: { page, size } });
}

// ── 선호 설정 ──

/**
 * 사용자의 선호 장르/분위기 설정을 업데이트한다.
 *
 * @param {Object} preferences - 선호 설정 데이터
 * @param {string[]} [preferences.favoriteGenres] - 선호 장르 목록
 * @param {string[]} [preferences.favoriteMoods] - 선호 분위기 목록
 * @param {string[]} [preferences.favoriteDirectors] - 선호 감독 목록
 * @returns {Promise<Object>} 업데이트된 선호 설정
 */
export async function updatePreferences(preferences) {
  requireAuth();
  return api.put(MYPAGE_ENDPOINTS.PREFERENCES, preferences);
}
