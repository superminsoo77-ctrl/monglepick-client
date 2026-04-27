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
/** Recommend v2 API 버전 접두사 */
export const API_V2_VERSION = '/api/v2';

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
  /** 비밀번호 찾기 — 이메일 존재 확인 - POST */
  PASSWORD_CHECK: `${API_VERSION}/auth/password/check`,
  /** 비밀번호 재설정 - POST */
  PASSWORD_RESET: `${API_VERSION}/auth/password/reset`,
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
 * Recommend v2 영화 좋아요 엔드포인트.
 * recommend(FastAPI)의 Redis 하이브리드 캐시 구현을 직접 호출한다.
 */
export const RECOMMEND_MOVIE_ENDPOINTS = {
  /** 영화 상세 조회 - GET (공개) */
  DETAIL: (id) => `${API_V2_VERSION}/search/movies/${id}`,
  /** 영화 좋아요 토글 - POST (id 파라미터 필요, JWT 필요) */
  LIKE: (id) => `${API_V2_VERSION}/movies/${id}/like`,
  /** 내 영화 좋아요 상태 조회 - GET (id 파라미터 필요, JWT 필요) */
  LIKE_STATUS: (id) => `${API_V2_VERSION}/movies/${id}/like`,
  /** 영화 좋아요 수 조회 - GET (id 파라미터 필요, 공개 API) */
  LIKE_COUNT: (id) => `${API_V2_VERSION}/movies/${id}/like/count`,
};

/**
 * Recommend v2 리뷰 엔드포인트.
 * 영화 상세의 리뷰 조회/작성/수정/삭제/좋아요 토글을 담당한다.
 */
export const RECOMMEND_REVIEW_ENDPOINTS = {
  /** 리뷰 목록 조회 / 작성 - GET, POST */
  REVIEWS: (movieId) => `${API_V2_VERSION}/movies/${movieId}/reviews`,
  /** 리뷰 수정 / 삭제 - PUT, DELETE */
  REVIEW_DETAIL: (movieId, reviewId) => `${API_V2_VERSION}/movies/${movieId}/reviews/${reviewId}`,
  /** 리뷰 좋아요 토글 - POST */
  REVIEW_LIKE: (movieId, reviewId) => `${API_V2_VERSION}/movies/${movieId}/reviews/${reviewId}/like`,
};

/**
 * Recommend v2 사용자 위시리스트 엔드포인트.
 * 마이페이지 위시리스트와 영화 상세의 찜 버튼이 이 경로를 사용한다.
 */
export const RECOMMEND_USER_ENDPOINTS = {
  /** 내 위시리스트 목록 조회 - GET */
  WISHLIST: `${API_V2_VERSION}/users/me/wishlist`,
  /** 내 리뷰 목록 조회 - GET */
  MY_REVIEWS: `${API_V2_VERSION}/users/me/reviews`,
  /** 내 선호 장르 목록 조회/저장 - GET, PUT */
  FAVORITE_GENRES: `${API_V2_VERSION}/users/me/favorite-genres`,
  /** 내 최애 영화 목록 조회/저장 - GET, PUT */
  FAVORITE_MOVIES: `${API_V2_VERSION}/users/me/favorite-movies`,
  /** 내 최애 영화 순서 저장 - PUT */
  FAVORITE_MOVIE_ORDER: `${API_V2_VERSION}/users/me/favorite-movies/order`,
  /** 특정 영화 위시리스트 상태 조회 - GET */
  WISHLIST_STATUS: (movieId) => `${API_V2_VERSION}/users/me/wishlist/${movieId}`,
  /** 위시리스트 추가 - POST / 삭제 - DELETE */
  TOGGLE_WISHLIST: (movieId) => `${API_V2_VERSION}/users/me/wishlist/${movieId}`,
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
  /**
   * 게시글 신고 - POST (postId 파라미터 필요, JWT 필요)
   * 바디: { reason, detail? }
   */
  POST_REPORT: (postId) => `${API_VERSION}/posts/${postId}/report`,
  /** 플레이리스트 공유 피드 - GET (PLAYLIST_SHARE 카테고리만, 비로그인 허용) */
  SHARED_PLAYLISTS: `${API_VERSION}/posts/shared-playlists`,
  /**
   * 2026-04-14 신규: OCR 실관람 인증 이벤트 공개 목록 조회 - GET (비로그인 허용).
   * 커뮤니티 "실관람인증" 탭에서 관리자 등록 이벤트를 노출한다.
   * 반환: ACTIVE/READY 상태 + endDate > now 이벤트만.
   */
  OCR_EVENTS: `${API_VERSION}/ocr-events`,
  /**
   * 2026-04-14 신규: 특정 영화의 진행 중 OCR 이벤트 단건 조회 - GET (비로그인 허용).
   * 영화 상세 페이지 상단 "실관람 인증 진행중" 배너 노출 여부 판단에 사용.
   * 반환: 단건 OcrEventPublicResponse 또는 null.
   */
  OCR_EVENT_BY_MOVIE: (movieId) => `${API_VERSION}/ocr-events/by-movie/${movieId}`,
  /**
   * OCR 영수증 분석 - POST (JWT 필수).
   * Python OCR 서비스가 이미지를 분석해 영화명/관람일/인원수/신뢰도를 추출한다.
   * 바디: { imageUrl }
   * 반환: { extractedMovieName, extractedWatchDate, extractedHeadcount, ocrConfidence }
   */
  OCR_ANALYZE: `${API_VERSION}/ocr-events/analyze`,
  /**
   * 2026-04-14 신규: OCR 실관람 인증 제출 - POST (JWT 필수).
   * 바디: { imageUrl, extractedMovieName?, extractedWatchDate?, extractedHeadcount?, ocrConfidence? }
   */
  OCR_VERIFY: (eventId) => `${API_VERSION}/ocr-events/${eventId}/verify`,
};

/**
 * 마이페이지(MyPage) 관련 엔드포인트.
 * 사용자 프로필, 시청 이력, 위시리스트, 선호 설정을 처리한다.
 *
 * <h3>시청 이력 도메인 재도입 (2026-04-08)</h3>
 * user_watch_history 테이블 신설 + UserWatchHistory 도메인 부활. Kaggle MovieLens 시드인
 * kaggle_watch_history (Agent 전용 read-only)와는 완전히 분리된 운영 도메인이다.
 * 추천 학습의 단일 진실 원본은 여전히 reviews 이며, 본 엔드포인트는 유저 대면 UX
 * (시청 이력 탭, 재관람 카운트, "봤어요" 원터치 체크)를 담당한다.
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
  /**
   * 시청 이력 조회 (마이페이지 통합 경로) - GET
   * Backend: /api/v1/users/me/watch-history (UserController)
   */
  WATCH_HISTORY_ME: `${API_VERSION}/users/me/watch-history`,
  /** 내가 쓴 게시글 목록 - GET */
  MY_POSTS: `${API_VERSION}/users/me/posts`,
};

/**
 * 시청 이력(WatchHistory) 독립 경로 엔드포인트.
 *
 * 마이페이지 통합 조회는 MYPAGE_ENDPOINTS.WATCH_HISTORY_ME 사용.
 * 본 엔드포인트는 추가/삭제/재관람 카운트 등 운영 액션 전용이다.
 *
 * Backend 구현: domain/userwatchhistory/controller/UserWatchHistoryController
 * 테이블 분리: user_watch_history (운영) ⟷ kaggle_watch_history (Kaggle 시드, Agent 전용)
 */
export const WATCH_HISTORY_ENDPOINTS = {
  /** 시청 이력 페이징 조회 - GET (독립 경로) */
  LIST: `${API_VERSION}/watch-history`,
  /** 시청 기록 추가 - POST (중복 허용, 재관람 카운트 가능) */
  ADD: `${API_VERSION}/watch-history`,
  /** 시청 기록 삭제 - DELETE (본인 소유만, id 파라미터 필요) */
  DELETE: (id) => `${API_VERSION}/watch-history/${id}`,
  /** 특정 영화 재관람 카운트 - GET (movieId 파라미터 필요) */
  REWATCH_COUNT: (movieId) => `${API_VERSION}/watch-history/movies/${movieId}/count`,
};

/**
 * 검색(Search) 관련 엔드포인트.
 */
export const SEARCH_ENDPOINTS = {
  /** 통합 검색 - GET (query 파라미터 필요) */
  SEARCH: `${API_VERSION}/search`,
  /** 검색용 장르 목록 - GET */
  GENRES: `${API_VERSION}/search/genres`,
  /** 자동완성 - GET (query 파라미터 필요) */
  AUTOCOMPLETE: `${API_VERSION}/search/autocomplete`,
  /** 최근 검색어 조회 - GET (JWT 필요) */
  RECENT: `${API_VERSION}/search/recent`,
  /** 최근 검색어 개별 삭제 - DELETE (keyword 파라미터 필요, JWT 필요) */
  RECENT_KEYWORD: (keyword) => `${API_VERSION}/search/recent/${encodeURIComponent(keyword)}`,
  /** 검색 결과 클릭 로그 저장 - POST */
  CLICK_LOG: `${API_VERSION}/search/click`,
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
  /**
   * 리워드 지급 기준(정책 카탈로그) 조회 - GET (query: category?)
   * 2026-04-14 신설 — PointPage 의 "리워드 지급 기준" 섹션이 사용.
   */
  POLICIES: `${API_VERSION}/point/policies`,
  /**
   * 내 리워드 진행 현황 조회 - GET
   * 2026-04-14 신설 — 활동별 카운터 + 마일스톤 진행률 + 포인트 요약 반환.
   */
  PROGRESS: `${API_VERSION}/point/progress`,
};

/**
 * 포인트 상점(PointShop) 관련 엔드포인트 — AI 이용권 구매 전용.
 *
 * <p>설계서 v3.2 §16에 정의된 AI 이용권 구매 경로로,
 * {@code point_items} DB 테이블의 교환 아이템과는 별도로 운영된다.
 * 구매된 이용권은 {@code user_ai_quota.purchased_ai_tokens}에 누적되며,
 * QuotaService의 AI 3-소스 모델 3단계(PURCHASED)에서 소비된다.</p>
 *
 * <h4>상품 구성 (Backend PointShopService 하드코딩, 설계서 v3.2 — 단가 10P/회 통일)</h4>
 * <ul>
 *   <li>AI_TOKEN_1  — 10P → 1회</li>
 *   <li>AI_TOKEN_5  — 50P → 5회</li>
 *   <li>AI_TOKEN_20 — 200P → 20회</li>
 *   <li>AI_TOKEN_50 — 500P → 50회</li>
 * </ul>
 *
 * <p>v3.2 변경: AI_DAILY_EXTEND 폐지. PURCHASED 토큰 자체가 일일 무료 한도를 우회한다.</p>
 */
export const POINT_SHOP_ENDPOINTS = {
  /** 상점 아이템 목록 + 현재 잔액/토큰 잔여 - GET */
  ITEMS: `${API_VERSION}/point/shop/items`,
  /** AI 이용권 팩 구매 - POST (query: packType=AI_TOKEN_1/5/20/50) */
  PURCHASE_AI_TOKENS: `${API_VERSION}/point/shop/ai-tokens`,
};

/**
 * 보유 아이템(UserItem) 관련 엔드포인트 — "내 아이템" 인벤토리 (2026-04-14 신규, C 방향).
 *
 * <p>AI 이용권은 {@code user_ai_quota.purchased_ai_tokens} 카운터로 별도 관리되므로
 * 이 경로에서 조회되지 않는다. 여기서 다루는 대상은 아바타·배지·응모권·힌트 등
 * 인벤토리형 아이템이다. PointItemService.exchangeItem() v2가 카테고리별로
 * 자동 분기하여 UserAiQuota 또는 UserItem에 지급한다.</p>
 */
export const USER_ITEM_ENDPOINTS = {
  /** 내 보유 아이템 목록 - GET (query: category?, page, size) */
  LIST: `${API_VERSION}/users/me/items`,
  /** 카테고리별 요약 + 착용 정보 - GET */
  SUMMARY: `${API_VERSION}/users/me/items/summary`,
  /** 착용 중인 아바타/배지 2원소 배열 - GET (프로필 렌더링용) */
  EQUIPPED: `${API_VERSION}/users/me/items/equipped`,
  /** 아이템 착용 - POST (path: userItemId) */
  EQUIP: (userItemId) => `${API_VERSION}/users/me/items/${userItemId}/equip`,
  /** 아이템 착용 해제 - POST (path: userItemId) */
  UNEQUIP: (userItemId) => `${API_VERSION}/users/me/items/${userItemId}/unequip`,
  /** 아이템 1회 사용 (힌트/응모권) - POST (path: userItemId) */
  USE: (userItemId) => `${API_VERSION}/users/me/items/${userItemId}/use`,
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
 * 포인트팩(PointPack) 관련 엔드포인트 — 2026-04-14 신설.
 *
 * 관리자 페이지에서 관리하는 {@code point_pack_prices} 테이블의 활성 팩만
 * sortOrder 순으로 반환한다. 과거에는 PaymentPage 에서 상수 배열로 하드코딩되어
 * 관리자 수정이 반영되지 않았으나, 이 엔드포인트 도입 이후 단일 진실 원본으로 통일된다.
 * 비로그인 허용 (Public API).
 */
export const POINT_PACK_ENDPOINTS = {
  /** 활성 포인트팩 목록 조회 - GET (공개) */
  LIST: `${API_VERSION}/point-packs`,
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
 * AI 추천 이력 조회, 찜/봤어요 토글, 별점/코멘트 리뷰 작성을 처리한다.
 */
export const RECOMMENDATION_ENDPOINTS = {
  /** 추천 이력 목록 - GET (query: page, size, status?) */
  LIST: `${API_VERSION}/recommendations`,
  /** 찜(위시리스트) 토글 - POST (path: recommendationId) */
  WISHLIST: (id) => `${API_VERSION}/recommendations/${id}/wishlist`,
  /** 봤어요 토글 - POST (path: recommendationId) */
  WATCHED: (id) => `${API_VERSION}/recommendations/${id}/watched`,
  /**
   * 추천 카드 별점/코멘트 UPSERT - POST (path: recommendationId, body: {rating, content}).
   *
   * 2026-04-27 통합: 기존 /feedback 엔드포인트를 폐기하고 reviews 테이블 단일 진실
   * 원본으로 통합. 같은 영화에 활성 리뷰가 있으면 업데이트, 없으면 신규 작성.
   * Backend 가 movie_id 매핑 + reviewSource("rec_log_{id}") + reviewCategoryCode
   * (AI_RECOMMEND) 자동 세팅. 추천 카드에서 작성된 별점이 reviews 에 저장되어
   * CF 학습 단일 진실 원본에 즉시 흡수된다.
   */
  REVIEW: (id) => `${API_VERSION}/recommendations/${id}/review`,
  /** 관심없음 토글 - POST (path: recommendationId) (P2, 2026-04-24) */
  DISMISS: (id) => `${API_VERSION}/recommendations/${id}/dismiss`,
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
  /** 플레이리스트 좋아요 - POST / 취소 - DELETE */
  LIKE: (id) => `${API_VERSION}/playlists/${id}/like`,
  /** 플레이리스트 가져오기(복사) - POST */
  IMPORT: (id) => `${API_VERSION}/playlists/${id}/import`,
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
 * Recommend 온보딩 월드컵 엔드포인트.
 * recommend(FastAPI) 런타임 월드컵 플로우를 처리한다.
 */
export const RECOMMEND_WORLDCUP_ENDPOINTS = {
  /** 커스텀 빌더 장르 목록 - GET */
  GENRES: `${API_VERSION}/onboarding/worldcup/genres`,
  /** 카테고리 목록 - GET */
  CATEGORIES: `${API_VERSION}/onboarding/worldcup/categories`,
  /** 시작 가능 라운드 계산 - POST */
  OPTIONS: `${API_VERSION}/onboarding/worldcup/options`,
  /** 대진표 시작 - POST */
  START: `${API_VERSION}/onboarding/worldcup/start`,
  /** 라운드 결과 제출 - POST */
  SUBMIT: `${API_VERSION}/onboarding/worldcup`,
  /** 완료 결과 조회 - GET */
  RESULT: `${API_VERSION}/onboarding/worldcup/result`,
};

/**
 * Recommend 시작 미션 온보딩 엔드포인트.
 * recommend(FastAPI)의 미션 상태 조회를 처리한다.
 */
export const RECOMMEND_ONBOARDING_ENDPOINTS = {
  /** 시작 미션 상태 조회 - GET */
  STATUS: `${API_V2_VERSION}/onboarding/status`,
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
  /** 영화 리뷰 조회 - GET (path: courseId, movieId) */
  MOVIE_REVIEW: (courseId, movieId) => `${API_VERSION}/roadmap/courses/${courseId}/movies/${movieId}/review`,
  /** 코스 최종 감상평 제출(POST) / 조회(GET) - path: courseId */
  FINAL_REVIEW: (courseId) => `${API_VERSION}/roadmap/courses/${courseId}/final-review`,
  /**
   * AI 검증 결과 업데이트 - POST (path: verificationId)
   * 프론트엔드가 에이전트에서 받은 판정 결과를 Backend에 전달한다.
   * body: { reviewStatus, similarityScore, matchedKeywords, confidence, rationale }
   */
  APPLY_AI_RESULT: (verificationId) => `${API_VERSION}/roadmap/courses/verifications/${verificationId}/ai-result`,
};

/**
 * AI 리뷰 검증 에이전트 엔드포인트 (도장깨기 시청 인증).
 *
 * Agent 서비스(FastAPI :8000)에 직접 요청 — Nginx 프록시가 라우팅.
 * 2026-04-24 구조 변경: Backend 내부 호출 → 프론트엔드 직접 호출로 전환.
 */
export const REVIEW_VERIFICATION_ENDPOINTS = {
  /**
   * 리뷰 검증 요청 - POST (X-Service-Key 없이 직접 호출)
   * body: { verification_id, user_id, course_id, movie_id, review_text, movie_plot }
   * 응답: { verification_id, similarity_score, matched_keywords, confidence, review_status, rationale }
   */
  VERIFY: `${API_VERSION}/admin/ai/review-verification/verify`,
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
 * 공지사항(Notice) 관련 엔드포인트.
 * 앱 메인 화면에 노출되는 BANNER/POPUP/MODAL 공지를 조회한다.
 * 비로그인 허용 (Public API).
 */
export const NOTICE_ENDPOINTS = {
  /** 활성 공지 목록 조회(홈 메인) - GET (query: type? = BANNER/POPUP/MODAL) */
  ACTIVE: `${API_VERSION}/notices`,
  /** 커뮤니티 공지 탭 전체 활성 공지 페이징 - GET (query: page?, size?) */
  LIST: `${API_VERSION}/notices/list`,
  /** 공지 단건 상세 조회 - GET (id 파라미터 필요) */
  DETAIL: (id) => `${API_VERSION}/notices/${id}`,
};

/**
 * 배너(Banner) 관련 엔드포인트 — 2026-04-14 신규.
 * 홈 화면 슬라이드 배너 위젯이 조회한다. 관리자 페이지의 배너 CRUD
 * (`/admin/banners`)와 독립된 공개 GET 엔드포인트이다. 비로그인 허용.
 */
export const BANNER_ENDPOINTS = {
  /** 노출 중 배너 목록 조회 - GET (query: position? = MAIN/SIDE ..., 기본 MAIN) */
  ACTIVE: `${API_VERSION}/banners`,
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
  /**
   * (레거시) Backend 키워드 매칭 기반 챗봇 — POST (body: {message, sessionId?}).
   * 2026-04-23 이후 LLM 몽글이 SSE 챗봇으로 교체됨. 새 코드는 SUPPORT_CHAT_SSE 사용.
   * 백엔드 엔드포인트는 당분간 유지(Client 롤백 안전망 + 관리자 E2E 검증용).
   */
  CHATBOT: `${API_VERSION}/support/chatbot`,
  /**
   * 고객센터 AI 챗봇 SSE (Agent 서비스 — EXAONE 1.2B 몽글이 + FAQ RAG).
   * POST (body: {message, sessionId?}). EventSourceResponse(text/event-stream).
   * 이벤트: session / status / matched_faq / token / needs_human / done / error.
   */
  SUPPORT_CHAT_SSE: `${API_VERSION}/support/chat`,
};
