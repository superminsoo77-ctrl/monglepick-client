/**
 * API 상수 정의 모듈.
 *
 * 백엔드 API의 기본 URL과 각 리소스별 엔드포인트 경로를 중앙 관리한다.
 * Vite 개발 서버의 프록시 설정과 함께 사용되며,
 * 프로덕션에서는 환경 변수(VITE_API_BASE_URL)로 오버라이드할 수 있다.
 */

/**
 * API 기본 URL.
 * 개발 환경: Vite 프록시가 localhost:8000으로 전달.
 * 프로덕션 환경: VITE_API_BASE_URL 환경 변수 사용.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/** API 버전 접두사 */
export const API_VERSION = '/api/v1';

/**
 * 인증(Authentication) 관련 엔드포인트.
 * 회원가입, 로그인, 토큰 갱신 등을 처리한다.
 */
export const AUTH_ENDPOINTS = {
  /** 회원가입 - POST */
  SIGNUP: `${API_VERSION}/auth/signup`,
  /** 로그인 - POST */
  LOGIN: `${API_VERSION}/auth/login`,
  /** 토큰 갱신 - POST */
  REFRESH: `${API_VERSION}/auth/refresh`,
  /** 로그아웃 - POST */
  LOGOUT: `${API_VERSION}/auth/logout`,
};

/**
 * 채팅(Chat) 관련 엔드포인트.
 * AI 영화 추천 대화를 처리한다.
 */
export const CHAT_ENDPOINTS = {
  /** SSE 스트리밍 채팅 - POST */
  STREAM: `${API_VERSION}/chat`,
  /** 동기 채팅 (디버그용) - POST */
  SYNC: `${API_VERSION}/chat/sync`,
  /** 멀티파트 이미지 업로드 채팅 - POST */
  UPLOAD: `${API_VERSION}/chat/upload`,
};

/**
 * 영화(Movies) 관련 엔드포인트.
 * 영화 정보 조회 및 검색을 처리한다.
 */
export const MOVIE_ENDPOINTS = {
  /** 영화 목록 조회 - GET */
  LIST: `${API_VERSION}/movies`,
  /** 영화 상세 조회 - GET (id 파라미터 필요) */
  DETAIL: (id) => `${API_VERSION}/movies/${id}`,
  /** 영화 검색 - GET (query 파라미터 필요) */
  SEARCH: `${API_VERSION}/search`,
  /** 인기 영화 목록 - GET */
  POPULAR: `${API_VERSION}/movies/popular`,
  /** 최신 영화 목록 - GET */
  LATEST: `${API_VERSION}/movies/latest`,
};

/**
 * 커뮤니티(Posts) 관련 엔드포인트.
 * 게시글 및 리뷰 CRUD를 처리한다.
 */
export const COMMUNITY_ENDPOINTS = {
  /** 게시글 목록 조회 - GET */
  POSTS: `${API_VERSION}/posts`,
  /** 게시글 상세 조회 - GET (id 파라미터 필요) */
  POST_DETAIL: (id) => `${API_VERSION}/posts/${id}`,
  /** 게시글 작성 - POST */
  CREATE_POST: `${API_VERSION}/posts`,
  /** 리뷰 목록 조회 - GET (movieId 파라미터 필요) */
  REVIEWS: (movieId) => `${API_VERSION}/movies/${movieId}/reviews`,
  /** 리뷰 작성 - POST (movieId 파라미터 필요) */
  CREATE_REVIEW: (movieId) => `${API_VERSION}/movies/${movieId}/reviews`,
};

/**
 * 마이페이지(MyPage) 관련 엔드포인트.
 * 사용자 프로필, 시청 이력, 위시리스트를 처리한다.
 */
export const MYPAGE_ENDPOINTS = {
  /** 프로필 조회 - GET */
  PROFILE: `${API_VERSION}/mypage/profile`,
  /** 프로필 수정 - PUT */
  UPDATE_PROFILE: `${API_VERSION}/mypage/profile`,
  /** 시청 이력 조회 - GET */
  WATCH_HISTORY: `${API_VERSION}/mypage/watch-history`,
  /** 위시리스트 조회 - GET */
  WISHLIST: `${API_VERSION}/mypage/wishlist`,
  /** 위시리스트 토글 - POST (movieId 파라미터 필요) */
  TOGGLE_WISHLIST: (movieId) => `${API_VERSION}/mypage/wishlist/${movieId}`,
  /** 선호 장르/분위기 설정 - PUT */
  PREFERENCES: `${API_VERSION}/mypage/preferences`,
};

/**
 * 검색(Search) 관련 엔드포인트.
 */
export const SEARCH_ENDPOINTS = {
  /** 통합 검색 - GET (query 파라미터 필요) */
  SEARCH: `${API_VERSION}/search`,
  /** 자동완성 - GET (query 파라미터 필요) */
  AUTOCOMPLETE: `${API_VERSION}/search/autocomplete`,
};
