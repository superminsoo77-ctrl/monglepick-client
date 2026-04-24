/**
 * 프론트엔드 라우트 경로 상수 모듈.
 *
 * React Router v7 에서 사용하는 모든 경로를 중앙 관리한다.
 * 경로 변경 시 이 파일만 수정하면 전체 앱에 반영된다.
 *
 * 2026-04-23 PR-4 라우팅 재설계:
 *   - 기존 평면 레이아웃의 계정 영역 8개(/mypage, /point, /payment, /recommendations,
 *     /playlist, /achievement, /stamp, /worldcup, /roadmap) 를 `/account/*` 중첩 라우트로 통합.
 *   - ROUTES.ACCOUNT_* 신설. 레거시 ROUTES.MYPAGE 등은 하위호환 리다이렉트 전용으로 유지
 *     (App.jsx 에서 `<Navigate replace>` / `<RedirectWithParams>` 로 새 경로로 보냄).
 *   - 상단 NAV "마이 픽" 드롭다운 폐지. 계정 전 영역은 우상단 유저 드롭다운 + /account 사이드바로 이동.
 */

export const ROUTES = {
  /* ── Layer 0: 레이아웃 없음 ── */
  /** 랜딩 페이지 (서비스/팀 소개) */
  LANDING: '/',
  /** 로그인 페이지 */
  LOGIN: '/login',
  /** 회원가입 페이지 */
  SIGNUP: '/signup',
  /** OAuth 콜백 페이지 — 구 방식: 인가 코드 직접 처리 (동적 파라미터 :provider) */
  OAUTH_CALLBACK: '/auth/callback/:provider',
  /** OAuth 쿠키 교환 페이지 — Spring Security OAuth2 Client 방식 */
  OAUTH_COOKIE: '/cookie',
  /** 회원가입 직후 시작 미션 온보딩 페이지 — PrivateRoute 로 가드 */
  ONBOARDING: '/onboarding',

  /* ── Layer 1: 공용 영역 (MainLayout default) ── */
  /** 홈 페이지 (인기/최신 영화 목록) */
  HOME: '/home',
  /** 검색 결과 페이지 */
  SEARCH: '/search',
  /** 영화 상세 페이지 (동적 파라미터 :id) */
  MOVIE_DETAIL: '/movie/:id',
  /** Movie Match 페이지 — 두 영화 교집합 기반 함께 볼 영화 추천 */
  MATCH: '/match',
  /** 커뮤니티 (게시판 + 리뷰) */
  COMMUNITY: '/community',
  /** 커뮤니티 게시글 상세 */
  COMMUNITY_DETAIL: '/community/:id',
  /** 커뮤니티 공유 플레이리스트 상세 (읽기 전용) — 동적 파라미터 :playlistId */
  SHARED_PLAYLIST_DETAIL: '/community/playlist/:playlistId',
  /** 고객센터 페이지 */
  SUPPORT: '/support',
  /** 결제 실패 콜백 (Toss SDK redirect, 비로그인 도달 가능) — 공용 레이어 유지 */
  PAYMENT_FAIL: '/payment/fail',

  /*
   * ── 법적 정책 페이지 (2026-04-23 Footer 후속) ──
   *
   * Footer 하단 "약관 및 정책" 섹션에서 참조하는 4개 독립 페이지.
   * 현재는 LegalPageLayout 을 공유하는 placeholder 페이지이며,
   * 실제 약관 문구가 확정되는 시점에 각 페이지 컴포넌트 내부만 채우면 된다.
   * 모두 비로그인 접근 허용(법적으로 누구나 열람 가능해야 함).
   */
  /** 이용약관 */
  TERMS: '/terms',
  /** 개인정보처리방침 */
  PRIVACY: '/privacy',
  /** 운영정책 (커뮤니티/리뷰/추천 서비스 운영 규칙) */
  OPERATION_POLICY: '/operation-policy',
  /** 환불정책 (구독/AI 이용권/포인트 환불 규정) */
  REFUND_POLICY: '/refund-policy',

  /* ── Layer 2: 채팅 (MainLayout compact) ── */
  /** AI 채팅 추천 페이지 */
  CHAT: '/chat',
  /** AI 채팅 이어하기 (이전 세션 복원, 동적 파라미터 :sessionId) */
  CHAT_SESSION: '/chat/:sessionId',

  /* ══════════════════════════════════════════════════════════════
     Layer 3: 계정 허브 — /account/* (2026-04-23 PR-4 신설)

     AccountLayout 이 Outlet 으로 하위 페이지를 감싸며, 좌측(모바일은 상단)
     사이드바가 프로필/활동/결제·리워드 3섹션으로 분류해 노출한다.
     전 영역 PrivateRoute 하에 보호.
     ══════════════════════════════════════════════════════════════ */

  /** 계정 허브 진입점 — 기본 /profile 로 redirect */
  ACCOUNT: '/account',
  /** 내 정보 (구 /mypage) — 프로필·시청이력·위시리스트·선호 설정 */
  ACCOUNT_PROFILE: '/account/profile',
  /** 포인트 관리 (구 /point) */
  ACCOUNT_POINT: '/account/point',
  /** 결제/구독 (구 /payment) */
  ACCOUNT_PAYMENT: '/account/payment',
  /** 결제 성공 콜백 (구 /payment/success, Toss SDK successUrl 대상) */
  ACCOUNT_PAYMENT_SUCCESS: '/account/payment/success',
  /** 추천 내역 (구 /recommendations) */
  ACCOUNT_RECOMMENDATIONS: '/account/recommendations',
  /** 플레이리스트 목록 (구 /playlist) */
  ACCOUNT_PLAYLIST: '/account/playlist',
  /** 플레이리스트 상세 (구 /playlist/:id) */
  ACCOUNT_PLAYLIST_DETAIL: '/account/playlist/:id',
  /** 업적 목록 (구 /achievement) */
  ACCOUNT_ACHIEVEMENT: '/account/achievement',
  /** 업적 상세 (구 /achievement/:id) */
  ACCOUNT_ACHIEVEMENT_DETAIL: '/account/achievement/:id',
  /** 도장깨기 목록 (구 /stamp) — RoadmapPage 재사용 */
  ACCOUNT_STAMP: '/account/stamp',
  /** 도장깨기 코스 상세 (구 /stamp/:id) */
  ACCOUNT_STAMP_DETAIL: '/account/stamp/:id',
  /** 도장깨기 리뷰 작성 (구 /stamp/:courseId/review/:movieId) */
  ACCOUNT_STAMP_REVIEW: '/account/stamp/:courseId/review/:movieId',
  /** 영화 이상형 월드컵 (구 /worldcup) */
  ACCOUNT_WORLDCUP: '/account/worldcup',
  /** 로드맵 목록 (구 /roadmap) */
  ACCOUNT_ROADMAP: '/account/roadmap',
  /** 로드맵 코스 상세 (구 /roadmap/:id) */
  ACCOUNT_ROADMAP_DETAIL: '/account/roadmap/:id',

  /* ══════════════════════════════════════════════════════════════
     레거시 경로 — 하위호환 리다이렉트 전용 (코드에서 직접 쓰지 말 것)

     기존 외부 링크/북마크/Toss 설정이 가리키는 경로를 App.jsx 의
     리다이렉트 Route 가 받아 ACCOUNT_* 로 보낸다. 이 상수들은
     App.jsx 의 path 지정용으로만 사용되며, 호출부(페이지 내부) 에서는
     ACCOUNT_* 를 사용해야 한다.
     ══════════════════════════════════════════════════════════════ */

  MYPAGE: '/mypage',
  POINT: '/point',
  PAYMENT: '/payment',
  PAYMENT_SUCCESS: '/payment/success',
  RECOMMENDATIONS: '/recommendations',
  PLAYLIST: '/playlist',
  PLAYLIST_DETAIL: '/playlist/:id',
  ACHIEVEMENT: '/achievement',
  ACHIEVEMENT_DETAIL: '/achievement/:id',
  STAMP: '/stamp',
  STAMP_DETAIL: '/stamp/:id',
  STAMP_REVIEW: '/stamp/:courseId/review/:movieId',
  QUIZ: '/quiz',
  WORLDCUP: '/worldcup',
  ROADMAP: '/roadmap',
  ROADMAP_DETAIL: '/roadmap/:id',
};

/**
 * 동적 파라미터가 포함된 경로를 실제 값으로 치환하는 헬퍼 함수.
 *
 * @param {string} route - 라우트 패턴 (예: '/account/achievement/:id')
 * @param {Object} params - 치환할 파라미터 객체 (예: { id: 123 })
 * @returns {string} 치환된 실제 경로
 *
 * @example
 *   buildPath(ROUTES.ACCOUNT_ACHIEVEMENT_DETAIL, { id: 42 })
 *   // => '/account/achievement/42'
 */
export function buildPath(route, params = {}) {
  let path = route;
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, String(value));
  });
  return path;
}

/**
 * 상단 NAV 메뉴 항목 목록.
 *
 * 2026-04-23 PR-4 재편:
 *   기존 4탭(AI추천 ▾ · 검색 · 커뮤니티 · 마이픽 ▾) → 3탭(AI추천 ▾ · 검색 · 커뮤니티).
 *   "마이 픽" 드롭다운 전체(추천내역/플레이리스트/업적/도장깨기/월드컵) 는 우상단 유저
 *   아바타 드롭다운 + /account 사이드바로 이관 — 한 곳에서 관리.
 *
 * 항목 스키마:
 *   - `key`         : 리액트 key 및 드롭다운 개폐 식별자
 *   - `label`       : 탭에 표시될 한국어 라벨
 *   - `path`        : 단일 링크 탭의 이동 경로 (children 없는 경우)
 *   - `children`    : 드롭다운 항목 배열
 *   - `requiresAuth`: true 면 비로그인 사용자에게 탭 자체를 숨김
 */
export const NAV_ITEMS = [
  {
    key: 'ai-recommend',
    label: 'AI 추천',
    children: [
      { path: ROUTES.CHAT, label: 'AI 채팅 추천' },   // /chat (SSE 스트리밍 채팅)
      { path: ROUTES.MATCH, label: '둘이 영화 고르기' }, // /match
    ],
  },
  /*
   * 2026-04-23 수정: 홈 상단에 전용 검색창을 배치했지만, 사용자 요청으로
   * 헤더의 "검색" 탭도 유지해 /search 페이지로 바로 진입할 수 있도록 복원.
   */
  {
    key: 'search',
    label: '검색',
    path: ROUTES.SEARCH,                              // /search
  },
  {
    key: 'community',
    label: '커뮤니티',
    path: ROUTES.COMMUNITY,                           // /community
  },
];

/**
 * 로그인 사용자 전용 계정 드롭다운(우상단 아바타) 항목 목록.
 *
 * 2026-04-23 PR-4 재편:
 *   기존 5개(마이페이지/포인트/결제·구독/고객센터) → 10개(계정 허브 전영역).
 *   상단 NAV "마이 픽" 을 흡수하면서 프로필/활동/결제·리워드/지원 4 그룹으로 구분.
 *   각 항목은 /account/* 하위 페이지이며, 사이드바와 동일한 네비게이션을 드롭다운에서도 제공.
 */
export const USER_MENU_ITEMS = [
  /* 프로필 그룹 */
  { path: ROUTES.ACCOUNT_PROFILE, label: '내 정보' },                 // /account/profile
  { divider: true },

  /* 활동 그룹 — 구 "마이 픽" 드롭다운에서 흡수 */
  { path: ROUTES.ACCOUNT_RECOMMENDATIONS, label: '추천 내역' },       // /account/recommendations
  { path: ROUTES.ACCOUNT_PLAYLIST, label: '플레이리스트' },           // /account/playlist
  { path: ROUTES.ACCOUNT_ACHIEVEMENT, label: '업적' },                // /account/achievement
  { path: ROUTES.ACCOUNT_STAMP, label: '도장깨기' },                  // /account/stamp
  { path: ROUTES.ACCOUNT_WORLDCUP, label: '영화 월드컵' },            // /account/worldcup
  { divider: true },

  /* 결제·리워드 그룹 */
  { path: ROUTES.ACCOUNT_POINT, label: '포인트' },                    // /account/point
  { path: ROUTES.ACCOUNT_PAYMENT, label: '결제·구독' },               // /account/payment
  { divider: true },

  /* 지원 */
  { path: ROUTES.SUPPORT, label: '고객센터' },                        // /support
];
