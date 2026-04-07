/**
 * API 상수 정의 모듈.
 *
 * 각 서비스별 엔드포인트 경로를 중앙 관리한다.
 * 서비스 Base URL은 shared/api/serviceUrls.js에서 관리하며,
 * 여기서는 상대 경로만 정의한다.
 *
 * 서비스 분류:
 * - @service Backend  → backendApi  (Spring Boot :8080)
 * - @service Agent    → agentApi / fetch (FastAPI :8000)
 * - @service Recommend → recommendApi (FastAPI :8001)
 */

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
  DETAIL: (id) => `${API_VERSION}/search/movies/${id}`,
  /** 영화 검색 - GET (query 파라미터 필요) */
  SEARCH: `${API_VERSION}/search/movies`,
  /** 인기 영화 목록 - GET */
  POPULAR: `${API_VERSION}/movies/popular`,
  /** 최신 영화 목록 - GET */
  LATEST: `${API_VERSION}/movies/latest`,
  /**
   * 영화 좋아요 토글 - POST (id 파라미터 필요, JWT 필요)
   * 응답: { liked: boolean, likeCount: number }
   */
  LIKE: (id) => `${API_VERSION}/movies/${id}/like`,
  /**
   * 영화 좋아요 상태 조회 - GET (id 파라미터 필요, JWT 필요)
   * 응답: { liked: boolean, likeCount: number }
   */
  LIKE_STATUS: (id) => `${API_VERSION}/movies/${id}/like`,
  /**
   * 영화 좋아요 수 조회 - GET (id 파라미터 필요, 공개 API)
   * 응답: { liked: false, likeCount: number }
   */
  LIKE_COUNT: (id) => `${API_VERSION}/movies/${id}/like/count`,
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
  /** 리뷰 수정 - PUT / 삭제 - DELETE (movieId, reviewId 파라미터 필요) */
  REVIEW_DETAIL: (movieId, reviewId) => `${API_VERSION}/movies/${movieId}/reviews/${reviewId}`,
  /** 리뷰 좋아요 - POST / 취소 - DELETE (movieId, reviewId 파라미터 필요) */
  REVIEW_LIKE: (movieId, reviewId) => `${API_VERSION}/movies/${movieId}/reviews/${reviewId}/like`,
  /** 게시글 수정 - PUT / 삭제 - DELETE (postId 파라미터 필요) */
  UPDATE_POST: (postId) => `${API_VERSION}/posts/${postId}`,
  /**
   * 게시글 좋아요 토글 - POST (postId 파라미터 필요, JWT 필요)
   * 응답: { liked: boolean, likeCount: number }
   */
  POST_LIKE: (postId) => `${API_VERSION}/posts/${postId}/like`,
  /**
   * 게시글 댓글 좋아요 토글 - POST (postId, commentId 파라미터 필요, JWT 필요)
   * 응답: { liked: boolean, likeCount: number }
   */
  COMMENT_LIKE: (postId, commentId) => `${API_VERSION}/posts/${postId}/comments/${commentId}/like`,
};

/**
 * 마이페이지(MyPage) 관련 엔드포인트.
 * 사용자 프로필, 위시리스트, 선호 설정을 처리한다.
 *
 * 시청 이력 엔드포인트는 폐기되었으며 (2026-04-08), "리뷰 작성 = 시청 완료" 단일 진실
 * 원본 원칙에 따라 reviews API로 통합되었다.
 */
export const MYPAGE_ENDPOINTS = {
  /** 프로필 조회 - GET (Backend: /api/v1/users/me/profile) */
  PROFILE: `${API_VERSION}/users/me/profile`,
  /** 프로필 수정 - PUT */
  UPDATE_PROFILE: `${API_VERSION}/users/me/profile`,
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
 * 포인트 상점(PointShop) 관련 엔드포인트 — AI 이용권 구매 전용.
 *
 * <p>설계서 v3.2 §16에 정의된 AI 이용권 구매 경로로,
 * {@code point_items} DB 테이블의 교환 아이템과는 별도로 운영된다.
 * 구매된 이용권은 {@code user_ai_quota.purchased_ai_tokens}에 누적되며,
 * QuotaService의 AI 3-소스 모델 3단계(PURCHASED)에서 소비된다.</p>
 *
 * <h4>상품 구성 (Backend PointShopService 하드코딩)</h4>
 * <ul>
 *   <li>AI_TOKEN_5     — 200P → 5회</li>
 *   <li>AI_TOKEN_20    — 700P → 20회 (번들 할인)</li>
 *   <li>AI_DAILY_EXTEND — 100P → 5회 (일일 한도 우회)</li>
 * </ul>
 */
export const POINT_SHOP_ENDPOINTS = {
  /** 상점 아이템 목록 + 현재 잔액/토큰 잔여 - GET */
  ITEMS: `${API_VERSION}/point/shop/items`,
  /** AI 이용권 팩 구매 - POST (query: packType) */
  PURCHASE_AI_TOKENS: `${API_VERSION}/point/shop/ai-tokens`,
  /** 일일 한도 우회 AI 이용권 구매 - POST */
  PURCHASE_AI_EXTEND: `${API_VERSION}/point/shop/ai-extend`,
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
 * 추천 내역(Recommendation) 관련 엔드포인트.
 * AI 추천 이력 조회, 찜/봤어요 토글, 만족도 피드백을 처리한다.
 */
export const RECOMMENDATION_ENDPOINTS = {
  /** 추천 이력 목록 - GET (query: page, size, status?) */
  LIST: `${API_VERSION}/recommendations`,
  /** 찜(위시리스트) 토글 - POST (path: recommendationId) */
  WISHLIST: (id) => `${API_VERSION}/recommendations/${id}/wishlist`,
  /** 봤어요 토글 - POST (path: recommendationId) */
  WATCHED: (id) => `${API_VERSION}/recommendations/${id}/watched`,
  /** 만족도 피드백 - POST (path: recommendationId, body: {rating, comment}) */
  FEEDBACK: (id) => `${API_VERSION}/recommendations/${id}/feedback`,
};

/**
 * 플레이리스트(Playlist) 관련 엔드포인트.
 * 사용자 영화 플레이리스트 CRUD를 처리한다.
 */
export const PLAYLIST_ENDPOINTS = {
  /** 플레이리스트 목록 - GET (query: page, size) */
  LIST: `${API_VERSION}/playlists`,
  /** 플레이리스트 생성 - POST (body: {title, description}) */
  CREATE: `${API_VERSION}/playlists`,
  /** 플레이리스트 상세 - GET (path: playlistId) */
  DETAIL: (id) => `${API_VERSION}/playlists/${id}`,
  /** 플레이리스트 수정 - PUT (path: playlistId) */
  UPDATE: (id) => `${API_VERSION}/playlists/${id}`,
  /** 플레이리스트 삭제 - DELETE (path: playlistId) */
  DELETE: (id) => `${API_VERSION}/playlists/${id}`,
  /** 플레이리스트에 영화 추가 - POST (path: playlistId, body: {movieId}) */
  ADD_MOVIE: (id) => `${API_VERSION}/playlists/${id}/movies`,
  /** 플레이리스트에서 영화 제거 - DELETE (path: playlistId, movieId) */
  REMOVE_MOVIE: (playlistId, movieId) => `${API_VERSION}/playlists/${playlistId}/movies/${movieId}`,
};

/**
 * 업적(Achievement) 관련 엔드포인트.
 * 사용자 업적/도장깨기 조회를 처리한다.
 */
export const ACHIEVEMENT_ENDPOINTS = {
  /** 업적 목록 - GET (query: category?) */
  LIST: `${API_VERSION}/users/me/achievements`,
  /** 업적 상세 - GET (path: achievementId) */
  DETAIL: (id) => `${API_VERSION}/users/me/achievements/${id}`,
  /** 도장깨기 목록 - GET */
  STAMP_RALLY: `${API_VERSION}/users/me/stamp-rally`,
  /** 도장깨기 진행 상황 - GET (path: rallyId) */
  STAMP_RALLY_DETAIL: (id) => `${API_VERSION}/users/me/stamp-rally/${id}`,
};

/**
 * 월드컵(Worldcup) 관련 엔드포인트.
 * 영화 이상형 월드컵 게임을 처리한다.
 */
export const WORLDCUP_ENDPOINTS = {
  /** 월드컵 시작 - POST (body: {round, genre?}) */
  START: `${API_VERSION}/worldcup/start`,
  /** 선택 제출 - POST (body: {matchId, winnerId}) */
  PICK: `${API_VERSION}/worldcup/pick`,
  /** 결과 조회 - GET (path: gameId) */
  RESULT: (gameId) => `${API_VERSION}/worldcup/result/${gameId}`,
  /** 최근 결과 목록 - GET (query: page, size) */
  HISTORY: `${API_VERSION}/worldcup/history`,
};

/**
 * 로드맵(Roadmap) 관련 엔드포인트.
 * 영화 학습 코스/로드맵을 처리한다.
 */
export const ROADMAP_ENDPOINTS = {
  /** 코스 목록 - GET (query: category?) */
  COURSES: `${API_VERSION}/roadmap/courses`,
  /** 코스 상세 - GET (path: courseId) */
  COURSE_DETAIL: (id) => `${API_VERSION}/roadmap/courses/${id}`,
  /** 코스 진행 상황 - GET (path: courseId) */
  COURSE_PROGRESS: (id) => `${API_VERSION}/roadmap/courses/${id}/progress`,
  /** 코스 시작 - POST (path: courseId) */
  START_COURSE: (id) => `${API_VERSION}/roadmap/courses/${id}/start`,
  /** 영화 시청 완료 마킹 - POST (path: courseId, movieId) */
  COMPLETE_MOVIE: (courseId, movieId) => `${API_VERSION}/roadmap/courses/${courseId}/movies/${movieId}/complete`,
};

/**
 * 퀴즈(Quiz) 관련 엔드포인트.
 * 영화 퀴즈 목록 조회 및 정답 제출을 처리한다.
 *
 * - GET  BY_MOVIE(movieId) — 영화별 PUBLISHED 퀴즈 목록 (공개, 비로그인 허용)
 * - GET  TODAY             — 오늘의 퀴즈 목록 (공개, 비로그인 허용)
 * - POST SUBMIT(quizId)    — 정답 제출 및 채점 (JWT 필수)
 */
export const QUIZ_ENDPOINTS = {
  /** 영화별 PUBLISHED 퀴즈 목록 - GET (공개) */
  BY_MOVIE: (movieId) => `${API_VERSION}/quizzes/movie/${movieId}`,
  /** 오늘의 퀴즈 목록 - GET (공개) */
  TODAY: `${API_VERSION}/quizzes/today`,
  /** 정답 제출 및 채점 - POST (JWT 필수, body: { answer }) */
  SUBMIT: (quizId) => `${API_VERSION}/quizzes/${quizId}/submit`,
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
  /** 티켓 상세 조회 - GET (ticketId 파라미터 필요) */
  TICKET_DETAIL: (ticketId) => `${API_VERSION}/support/tickets/${ticketId}`,
  /** AI 챗봇 대화 - POST (body: {message, sessionId?}) */
  CHATBOT: `${API_VERSION}/support/chatbot`,
};
