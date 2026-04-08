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
  /** 업적/도장깨기 페이지 — 사용자 업적 및 도장깨기 진행 */
  ACHIEVEMENT: '/achievement',
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
 * 네비게이션 메뉴에 표시할 항목 목록.
 * Header 컴포넌트에서 반복 렌더링에 사용한다.
 */
export const NAV_ITEMS = [
  { path: ROUTES.HOME, label: '홈' },              // /home (영화 목록)
  { path: ROUTES.CHAT, label: 'AI 추천' },          // /chat (SSE 스트리밍 채팅)
  { path: ROUTES.MATCH, label: '둘이 영화 고르기' },    // /match (두 영화 교집합 추천)
  { path: ROUTES.WORLDCUP, label: '영화 월드컵' },    // /worldcup (이상형 월드컵)
  { path: ROUTES.COMMUNITY, label: '커뮤니티' },     // /community (게시판 + 리뷰)
  { path: ROUTES.SEARCH, label: '검색' },           // /search (키워드 + 필터)
];

/**
 * 로그인한 사용자 전용 메뉴 항목 목록.
 *
 * Header 우상단 유저 아바타 클릭 시 펼쳐지는 드롭다운과
 * 모바일 햄버거 메뉴 내부 인증 섹션에서 공용으로 사용한다.
 *
 * 항목 구성 원칙:
 *   1) 프로필(루트) → 2) 콘텐츠 그룹(추천/플레이리스트/업적/로드맵)
 *   → 3) 결제·리워드 그룹(포인트/결제) → 4) 지원(고객센터)
 *
 * 그룹 구분을 위해 `divider: true` 항목을 섞어둔다.
 * 드롭다운 렌더러는 이 플래그를 만나면 구분선만 출력하고 path는 무시한다.
 */
export const USER_MENU_ITEMS = [
  { path: ROUTES.MYPAGE, label: '마이페이지' },          // /mypage
  { divider: true },
  /* 콘텐츠 그룹 — AI 추천 결과/소장/도전과제/학습 코스 */
  { path: ROUTES.RECOMMENDATIONS, label: '추천 내역' },  // /recommendations
  { path: ROUTES.PLAYLIST, label: '플레이리스트' },       // /playlist
  { path: ROUTES.ACHIEVEMENT, label: '업적·도장깨기' },  // /achievement
  { path: ROUTES.QUIZ, label: '영화 퀴즈' },            // /quiz (오늘의 퀴즈)
  { path: ROUTES.ROADMAP, label: '영화 로드맵' },        // /roadmap
  { divider: true },
  /* 결제·리워드 그룹 — 단일 재화(포인트) + 결제/구독 */
  { path: ROUTES.POINT, label: '포인트' },              // /point
  { path: ROUTES.PAYMENT, label: '결제·구독' },         // /payment
  { divider: true },
  /* 지원 */
  { path: ROUTES.SUPPORT, label: '고객센터' },          // /support
];
