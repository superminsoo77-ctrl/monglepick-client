/**
 * 라우트별 청크 prefetch 헬퍼.
 *
 * 2026-04-29 라우트 단위 lazy 분할 후속 작업으로 도입.
 * 사용자가 NAV 메뉴 / 유저 드롭다운에 hover (또는 focus) 하는 시점에 해당 라우트의
 * lazy 청크를 백그라운드에서 미리 다운로드한다. 사용자가 실제 클릭하는 순간에는
 * 청크가 이미 캐시에 있어 Suspense fallback 깜빡임을 사실상 제거.
 *
 * ── 동작 원리 ──
 * 1) `prefetchRoute('chat')` 호출 시 미리 등록된 import() 함수가 한 번 실행된다.
 * 2) Vite/Rollup 의 동적 import 가 해당 청크를 비동기로 다운로드.
 * 3) 다운로드된 모듈은 React.lazy 의 내부 캐시와 동일한 모듈 그래프를 공유하므로,
 *    이후 lazy 컴포넌트가 마운트될 때 이미 resolve 된 모듈을 즉시 사용.
 *
 * ── 멱등성 ──
 * 동일 routeKey 를 여러 번 hover 해도 import() 자체가 모듈 캐시를 가지므로 실제
 * 네트워크 다운로드는 한 번만 발생. 별도 가드 불필요하지만, 호출 횟수 자체를 줄이기
 * 위해 prefetch 한 키를 Set 으로 기억 (불필요한 함수 호출 자체를 차단).
 *
 * ── 모바일 대응 ──
 * 모바일은 hover 가 없어 prefetch 가 트리거되지 않지만, 햄버거 메뉴 펼침
 * (toggleNavDropdown / toggleMobileSection) 시점에 prefetch 를 같이 호출하면 된다.
 * 이 모듈은 keyByPath 도 함께 export 해 path 기반 호출도 지원.
 *
 * ── 안전성 ──
 * 동적 import 실패 (네트워크 단절 등) 는 console.warn 만 남기고 throw 하지 않는다.
 * 사용자가 실제 클릭하면 React.lazy 가 다시 시도하며, 그쪽 에러 핸들링은 Suspense
 * + ErrorBoundary 가 담당.
 */

/**
 * routeKey → import() 매핑.
 *
 * App.jsx 에서 lazy 처리한 25개 라우트와 동일한 import 경로를 갖는다.
 * App.jsx 와 이 파일은 별도지만, Vite/Rollup 이 동일한 동적 import 표현식을 만나면
 * 같은 청크를 참조하므로 이중 청크 생성 없음.
 *
 * key 명명: NAV_ITEMS / USER_MENU_ITEMS 의 의미 단위 + 라우트 path 의 마지막 segment.
 */
const ROUTE_LOADERS = {
  // Layer 1 공용
  home:                () => import('../../features/home/pages/HomePage'),
  search:              () => import('../../features/search/pages/SearchPage'),
  movieDetail:         () => import('../../features/movie/pages/MovieDetailPage'),
  community:           () => import('../../features/community/pages/CommunityPage'),
  postDetail:          () => import('../../features/community/pages/PostDetailPage'),
  sharedPlaylistDetail:() => import('../../features/community/pages/SharedPlaylistDetailPage'),
  match:               () => import('../../features/match/pages/MatchPage'),
  support:             () => import('../../features/support/pages/SupportPage'),
  paymentFail:         () => import('../../features/payment/pages/PaymentFailPage'),

  // 법적 정책
  terms:           () => import('../../features/legal/pages/TermsPage'),
  privacy:         () => import('../../features/legal/pages/PrivacyPage'),
  operationPolicy: () => import('../../features/legal/pages/OperationPolicyPage'),
  refundPolicy:    () => import('../../features/legal/pages/RefundPolicyPage'),

  // Layer 2 채팅 / 온보딩
  chat:       () => import('../../features/chat/components/ChatWindow'),
  onboarding: () => import('../../features/onboarding/pages/OnboardingPage'),

  // Layer 3 계정 허브
  accountProfile:        () => import('../../features/user/pages/MyPage'),
  accountPoint:          () => import('../../features/point/pages/PointPage'),
  accountPayment:        () => import('../../features/payment/pages/PaymentPage'),
  accountPaymentSuccess: () => import('../../features/payment/pages/PaymentSuccessPage'),
  accountRecommendations:() => import('../../features/recommendation/pages/RecommendationPage'),
  accountPlaylist:       () => import('../../features/playlist/pages/PlaylistPage'),
  accountAchievement:    () => import('../../features/achievement/pages/AchievementPage'),
  accountAchievementDetail: () => import('../../features/achievement/pages/AchievementDetailPage'),
  accountWorldcup:       () => import('../../features/worldcup/pages/WorldcupPage'),
  accountRoadmap:        () => import('../../features/roadmap/pages/RoadmapPage'),
  accountStampReview:    () => import('../../features/roadmap/pages/StampReviewPage'),
  accountStampFinalReview: () => import('../../features/roadmap/pages/FinalReviewPage'),
};

/**
 * path → routeKey 매핑.
 *
 * NAV_ITEMS / USER_MENU_ITEMS 가 path (`/match`, `/account/point`) 만 들고 있으므로
 * 호출 측에서 `prefetchRouteByPath(item.path)` 한 줄로 사용할 수 있게 한다.
 *
 * 동적 파라미터 라우트 (`/movie/:id`, `/community/:id`) 는 메뉴 hover 시 prefetch 의
 * 의미가 약하므로 매핑하지 않는다.
 */
const PATH_TO_KEY = {
  '/home':           'home',
  '/search':         'search',
  '/community':      'community',
  '/match':          'match',
  '/support':        'support',
  '/onboarding':     'onboarding',
  '/chat':           'chat',
  '/terms':          'terms',
  '/privacy':        'privacy',
  '/operation-policy': 'operationPolicy',
  '/refund-policy':  'refundPolicy',
  '/account/profile':         'accountProfile',
  '/account/point':           'accountPoint',
  '/account/payment':         'accountPayment',
  '/account/recommendations': 'accountRecommendations',
  '/account/playlist':        'accountPlaylist',
  '/account/achievement':     'accountAchievement',
  '/account/worldcup':        'accountWorldcup',
  '/account/roadmap':         'accountRoadmap',
  '/account/stamp':           'accountRoadmap',  // RoadmapPage 재사용
};

/**
 * 이미 prefetch 가 시작된 routeKey Set — 중복 호출 차단.
 *
 * dynamic import() 자체도 모듈 캐시를 갖지만, hover 가 빠르게 반복되는 상황(메뉴
 * 위에서 마우스를 좌우로 흔들기 등)에서 함수 호출 자체를 줄이는 게 더 가볍다.
 */
const prefetched = new Set();

/**
 * routeKey 로 청크를 prefetch.
 *
 * @param {string} routeKey - ROUTE_LOADERS 의 키 (예: 'chat', 'accountPoint')
 * @returns {void}
 */
export function prefetchRoute(routeKey) {
  if (!routeKey || prefetched.has(routeKey)) return;
  const loader = ROUTE_LOADERS[routeKey];
  if (!loader) return;
  prefetched.add(routeKey);
  /* import() 의 결과는 사용하지 않는다 — Vite 가 청크를 fetch 하기만 하면 됨. */
  loader().catch((err) => {
    /* 실패 시 기록만 남기고 silent — 사용자 클릭 시 React.lazy 가 재시도. */
    // eslint-disable-next-line no-console
    console.warn('[prefetchRoute] failed', routeKey, err);
    /* 재시도 가능하도록 Set 에서 제거 */
    prefetched.delete(routeKey);
  });
}

/**
 * path 로 청크를 prefetch (NAV_ITEMS / USER_MENU_ITEMS 가 path 만 들고 있어 편의).
 *
 * @param {string} path - 라우트 경로 (예: '/match', '/account/point')
 * @returns {void}
 */
export function prefetchRouteByPath(path) {
  prefetchRoute(PATH_TO_KEY[path]);
}
