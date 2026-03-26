/**
 * API 상수 정의 모듈.
 *
 * 백엔드 API의 기본 URL과 각 리소스별 엔드포인트 경로를 중앙 관리한다.
 * Vite 개발 서버의 프록시 설정과 함께 사용되며,
 * 프로덕션에서는 환경 변수(VITE_API_BASE_URL)로 오버라이드할 수 있다.
 */

/**
 * API 기본 URL.
 * 개발 환경: Vite 프록시가 경로별로 분배 (인증/포인트/결제 → :8080, 채팅 등 → :8000).
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
  /** 토큰 갱신 - POST /jwt/refresh (JwtController — Refresh Token Rotation) */
  REFRESH: `/jwt/refresh`,
  /** 로그아웃 - POST */
  LOGOUT: `${API_VERSION}/auth/logout`,
  /** OAuth 소셜 로그인 - POST (provider 파라미터 필요) */
  OAUTH: (provider) => `${API_VERSION}/auth/oauth/${provider}`,
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
  SEARCH: `${API_VERSION}/search/movies`,
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
  /** 프로필 조회 - GET (Backend: /api/v1/users/me/profile) */
  PROFILE: `${API_VERSION}/users/me/profile`,
  /** 프로필 수정 - PUT */
  UPDATE_PROFILE: `${API_VERSION}/users/me/profile`,
  /** 시청 이력 조회 - GET */
  WATCH_HISTORY: `${API_VERSION}/users/me/watch-history`,
  /** 위시리스트 조회 - GET */
  WISHLIST: `${API_VERSION}/users/me/wishlist`,
  /** 위시리스트 추가 - POST / 삭제 - DELETE (movieId 파라미터 필요) */
  TOGGLE_WISHLIST: (movieId) => `${API_VERSION}/users/me/wishlist/${movieId}`,
  /** 선호 장르/분위기 설정 - GET/PUT */
  PREFERENCES: `${API_VERSION}/users/me/preferences`,
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

/**
 * 포인트(Point) 관련 엔드포인트.
 * 포인트 잔액, 이력, 출석 체크, 아이템 교환을 처리한다.
 */
export const POINT_ENDPOINTS = {
  /** 포인트 잔액+쿼터 사전 확인 - POST (Agent 내부용) */
  CHECK: `${API_VERSION}/point/check`,
  /** 포인트 차감 - POST (Agent 내부용) */
  DEDUCT: `${API_VERSION}/point/deduct`,
  /** 포인트 획득 - POST */
  EARN: `${API_VERSION}/point/earn`,
  /** 포인트 잔액 조회 - GET (query: userId) */
  BALANCE: `${API_VERSION}/point/balance`,
  /** 포인트 변동 이력 - GET (query: userId, page, size) */
  HISTORY: `${API_VERSION}/point/history`,
  /** 출석 체크 - POST (query: userId) */
  ATTENDANCE: `${API_VERSION}/point/attendance`,
  /** 출석 현황 조회 - GET (query: userId) */
  ATTENDANCE_STATUS: `${API_VERSION}/point/attendance/status`,
  /** 교환 아이템 목록 - GET (query: category?) */
  ITEMS: `${API_VERSION}/point/items`,
  /** 아이템 교환 - POST (path: itemId, query: userId) */
  EXCHANGE: (itemId) => `${API_VERSION}/point/items/${itemId}/exchange`,
};

/**
 * 결제(Payment) 관련 엔드포인트.
 * Toss Payments 연동 결제를 처리한다.
 */
export const PAYMENT_ENDPOINTS = {
  /** 주문 생성 - POST /payment/orders */
  CREATE_ORDER: `${API_VERSION}/payment/orders`,
  /** 결제 승인 - POST /payment/confirm */
  CONFIRM: `${API_VERSION}/payment/confirm`,
  /** 결제 내역 조회 - GET /payment/orders (query: page, size) */
  ORDER_LIST: `${API_VERSION}/payment/orders`,
};

/**
 * 구독(Subscription) 관련 엔드포인트.
 */
export const SUBSCRIPTION_ENDPOINTS = {
  /** 구독 상품 목록 - GET */
  PLANS: `${API_VERSION}/subscription/plans`,
  /** 내 구독 상태 - GET (query: userId) */
  STATUS: `${API_VERSION}/subscription/status`,
  /** 구독 취소 - POST (query: userId) */
  CANCEL: `${API_VERSION}/subscription/cancel`,
};

/**
 * Movie Match 관련 엔드포인트.
 * 두 영화의 교집합 특성 분석 및 함께 볼 영화 추천을 처리한다.
 * AI Agent(:8000)에 직접 요청 — Vite 프록시가 /api/* → :8000으로 전달.
 */
export const MATCH_ENDPOINTS = {
  /** SSE 스트리밍 Match 요청 - POST (body: {movie_id_1, movie_id_2, user_id?}) */
  STREAM: `${API_VERSION}/match`,
  /** 동기 Match 요청 (디버그용) - POST */
  SYNC: `${API_VERSION}/match/sync`,
};

/**
 * 고객센터(Support) 관련 엔드포인트.
 * FAQ, 도움말, 상담 티켓을 처리한다.
 */
export const SUPPORT_ENDPOINTS = {
  /** FAQ 목록 조회 - GET (query: category?) */
  FAQ: `${API_VERSION}/support/faq`,
  /** FAQ 피드백 - POST (path: faqId) */
  FAQ_FEEDBACK: (faqId) => `${API_VERSION}/support/faq/${faqId}/feedback`,
  /** 도움말 문서 목록 - GET (query: category?) */
  HELP: `${API_VERSION}/support/help`,
  /** 상담 티켓 생성 - POST */
  CREATE_TICKET: `${API_VERSION}/support/tickets`,
  /** 내 티켓 목록 - GET (query: page, size) */
  MY_TICKETS: `${API_VERSION}/support/tickets`,
};
