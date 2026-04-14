/**
 * 프론트엔드 라우트 경로 상수 모듈.
 *
 * React Router에서 사용하는 모든 경로를 중앙 관리한다.
 * 경로 변경 시 이 파일만 수정하면 전체 앱에 반영된다.
 */

/**
 * 앱 전체 라우트 경로 정의.
 * 각 경로는 React Router의 <Route path=""> 속성에 사용된다.
 */
export const ROUTES = {
  /** 랜딩 페이지 (서비스/팀 소개) */
  LANDING: '/',

  /** 홈 페이지 (인기/최신 영화 목록) */
  HOME: '/home',

  /** AI 채팅 추천 페이지 */
  CHAT: '/chat',
  /** AI 채팅 이어하기 (이전 세션 복원, 동적 파라미터 :sessionId) */
  CHAT_SESSION: '/chat/:sessionId',

  /** 영화 상세 페이지 (동적 파라미터 :id) */
  MOVIE_DETAIL: '/movie/:id',

  /** 커뮤니티 (게시판 + 리뷰) */
  COMMUNITY: '/community',

  /** 마이페이지 (프로필, 시청 이력, 위시리스트) */
  MYPAGE: '/mypage',

  /** 검색 결과 페이지 */
  SEARCH: '/search',

  /** 로그인 페이지 */
  LOGIN: '/login',

  /** 회원가입 페이지 */
  SIGNUP: '/signup',

  /** OAuth 콜백 페이지 — 구 방식: 인가 코드 직접 처리 (동적 파라미터 :provider) */
  OAUTH_CALLBACK: '/auth/callback/:provider',

  /** OAuth 쿠키 교환 페이지 — Spring Security OAuth2 Client 방식 */
  OAUTH_COOKIE: '/cookie',

  /** 포인트 관리 페이지 */
  POINT: '/point',
  /** 결제/구독 페이지 */
  PAYMENT: '/payment',
  /** 결제 성공 콜백 (Toss SDK redirect) */
  PAYMENT_SUCCESS: '/payment/success',
  /** 결제 실패 콜백 (Toss SDK redirect) */
  PAYMENT_FAIL: '/payment/fail',
  /** 고객센터 페이지 */
  SUPPORT: '/support',

  /** Movie Match 페이지 — 두 영화 교집합 기반 함께 볼 영화 추천 */
  MATCH: '/match',

  /** 추천 내역 페이지 — AI 추천 이력 조회, 찜/봤어요/피드백 */
  RECOMMENDATIONS: '/recommendations',
  /** 플레이리스트 페이지 — 사용자 영화 플레이리스트 관리 */
  PLAYLIST: '/playlist',
  /** 플레이리스트 상세 — 동적 파라미터 :id */
  PLAYLIST_DETAIL: '/playlist/:id',
  /** 커뮤니티 공유 플레이리스트 상세 (읽기 전용) — 동적 파라미터 :playlistId */
  SHARED_PLAYLIST_DETAIL: '/community/playlist/:playlistId',
  /** 업적 페이지 — 사용자 업적 진행 */
  ACHIEVEMENT: '/achievement',
  /** 도장깨기 페이지 — 영화 코스 시청 미션 (RoadmapPage 재사용) */
  STAMP: '/stamp',
  /** 도장깨기 코스 상세 — 동적 파라미터 :id */
  STAMP_DETAIL: '/stamp/:id',
  /** 퀴즈 페이지 — 오늘의 영화 퀴즈 (비로그인 열람 가능, 제출은 로그인 필수) */
  QUIZ: '/quiz',
  /** 월드컵 페이지 — 영화 이상형 월드컵 */
  WORLDCUP: '/worldcup',
  /** 로드맵 페이지 — 영화 학습 코스 */
  ROADMAP: '/roadmap',
  /** 로드맵 코스 상세 — 동적 파라미터 :id */
  ROADMAP_DETAIL: '/roadmap/:id',
};

/**
 * 동적 파라미터가 포함된 경로를 실제 값으로 치환하는 헬퍼 함수.
 *
 * @param {string} route - 라우트 패턴 (예: '/movie/:id')
 * @param {Object} params - 치환할 파라미터 객체 (예: { id: 123 })
 * @returns {string} 치환된 실제 경로 (예: '/movie/123')
 *
 * @example
 * buildPath(ROUTES.MOVIE_DETAIL, { id: 550 })
 * // => '/movie/550'
 */
export function buildPath(route, params = {}) {
  let path = route;
  // :param 패턴을 찾아서 실제 값으로 치환
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, String(value));
  });
  return path;
}

/**
 * 네비게이션 메뉴(상단 NAV)에 표시할 항목 목록.
 *
 * v2 개편 (2026-04-08) — 도메인 기반 4탭 구조:
 *   1) AI 추천 ▾   (드롭다운) — 채팅 추천, 둘이 영화 고르기
 *   2) 검색          (단일 링크) — 영화 검색
 *   3) 커뮤니티      (단일 링크) — 게시판 + 리뷰 (퀴즈/월드컵은 이관)
 *   4) 마이 픽 ▾   (로그인 시만, 드롭다운) — 추천내역/플레이리스트/로드맵/업적/월드컵
 *
 * NOTE: "홈" 은 상단 탭으로 노출하지 않고 로고 아이콘 클릭으로 대체한다.
 * NOTE: 퀴즈(`/quiz`)는 커뮤니티 게시판 카테고리로 통합될 예정이므로 헤더 메뉴에서 제거한다.
 *
 * 항목 스키마:
 *   - `key`       : 리액트 key 및 드롭다운 개폐 식별자 (필수)
 *   - `label`     : 탭에 표시될 한국어 라벨 (필수)
 *   - `path`      : 단일 링크 탭의 이동 경로 (children 없는 경우)
 *   - `children`  : 드롭다운 항목 배열 ([{ path, label }, ...])
 *   - `requiresAuth` : true 면 비로그인 사용자에게 탭 자체를 숨김
 */
export const NAV_ITEMS = [
  {
    key: 'ai-recommend',
    label: 'AI 추천',
    children: [
      { path: ROUTES.CHAT, label: 'AI 채팅 추천' },   // /chat (SSE 스트리밍 채팅)
      { path: ROUTES.MATCH, label: '둘이 영화 고르기' }, // /match (두 영화 교집합 추천)
    ],
  },
  {
    key: 'search',
    label: '검색',
    path: ROUTES.SEARCH,                              // /search (키워드 + 필터)
  },
  {
    key: 'community',
    label: '커뮤니티',
    path: ROUTES.COMMUNITY,                           // /community (게시판 + 리뷰 + 퀴즈 카테고리)
  },
  {
    key: 'my-pick',
    label: '마이 픽',
    requiresAuth: true,
    children: [
      { path: ROUTES.RECOMMENDATIONS, label: '추천 내역' }, // /recommendations
      { path: ROUTES.PLAYLIST, label: '플레이리스트' },     // /playlist
      { path: ROUTES.ACHIEVEMENT, label: '업적' },          // /achievement
      { path: ROUTES.STAMP, label: '도장깨기' },            // /stamp
      { path: ROUTES.WORLDCUP, label: '영화 월드컵' },      // /worldcup (이상형 월드컵)
    ],
  },
];

/**
 * 로그인한 사용자 전용 계정 메뉴(우상단 아바타 드롭다운) 항목 목록.
 *
 * v2 개편 (2026-04-08) — "내 계정 관리" 전용으로 역할 축소:
 *   기존 11개 항목(콘텐츠성 포함) → 5개 항목(계정/결제/지원)만 남김.
 *   콘텐츠성 항목(추천내역/플레이리스트/업적/로드맵/월드컵)은 상단 NAV "마이 픽"으로 이관.
 *
 * 항목 구성:
 *   1) 프로필: 마이페이지
 *   2) 결제·리워드: 포인트, 결제·구독
 *   3) 지원: 고객센터
 *   (+ 로그아웃은 Header 컴포넌트에서 별도 렌더링)
 *
 * 그룹 구분을 위해 `divider: true` 항목을 섞어둔다.
 * 드롭다운 렌더러는 이 플래그를 만나면 구분선만 출력하고 path는 무시한다.
 */
export const USER_MENU_ITEMS = [
  /* 프로필 */
  { path: ROUTES.MYPAGE, label: '마이페이지' },          // /mypage
  { divider: true },
  /* 결제·리워드 그룹 — 단일 재화(포인트) + 결제/구독 */
  { path: ROUTES.POINT, label: '포인트' },              // /point
  { path: ROUTES.PAYMENT, label: '결제·구독' },         // /payment
  { divider: true },
  /* 지원 */
  { path: ROUTES.SUPPORT, label: '고객센터' },          // /support
];
