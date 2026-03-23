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
  /** 홈 (랜딩 페이지) */
  HOME: '/',

  /** AI 채팅 추천 페이지 */
  CHAT: '/chat',

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
  { path: ROUTES.HOME, label: '홈' },
  { path: ROUTES.CHAT, label: 'AI 추천' },
  { path: ROUTES.COMMUNITY, label: '커뮤니티' },
  { path: ROUTES.SEARCH, label: '검색' },
];
