/**
 * 네비게이션 헤더 컴포넌트.
 *
 * 앱 상단에 고정되어 로고, 네비게이션 링크, 인증 버튼을 표시한다.
 * 다크 테마에 맞춘 반투명 배경으로 세련된 느낌을 제공한다.
 * 모바일 환경에서는 햄버거 메뉴로 전환된다.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
/* 인증 Context 훅 — app/providers에서 가져옴 */
import useAuthStore from '../../stores/useAuthStore';
/* 전역 로딩 상태 스토어 — Match SSE 등 비동기 작업의 진행 여부를 TopBar 에 반영 */
import useLoadingStore from '../../stores/useLoadingStore';
/* 라우트 경로 상수 — shared/constants에서 가져옴 (USER_MENU_ITEMS = 유저 드롭다운 항목) */
import { ROUTES, NAV_ITEMS, USER_MENU_ITEMS } from '../../constants/routes';
/* 라우트 청크 prefetch — 메뉴 hover/focus 시 lazy 청크 미리 다운로드해 fallback 제거 */
import { prefetchRouteByPath } from '../../utils/prefetchRoute';
import ThemeToggle from './ThemeToggle';
import * as S from './Header.styled';

function resolveUserProfileImage(user) {
  return user?.profileImageUrl || user?.profileImage || user?.profile_image || null;
}

/**
 * @param {Object} props
 * @param {'default' | 'compact'} [props.variant='default']
 *   - 'default': 기본 헤더 — 상단 NAV 드롭다운 + 모바일 햄버거 + 유저 드롭다운 전체 노출
 *   - 'compact': 슬림 헤더 — 상단 NAV 와 모바일 햄버거를 숨긴다. 로고/테마 토글/유저
 *     드롭다운만 남겨 ChatWindow 같은 "전체 화면 집중" UX 에서도 계정 접근은 유지.
 *     NAV 숨김으로 모바일 햄버거도 함께 의미를 잃으므로 같이 감춘다.
 */
export default function Header({ variant = 'default' }) {
  // compact 모드 플래그 — 아래 렌더 트리에서 Nav/MobileToggle 조건 부여
  const isCompact = variant === 'compact';
  // 현재 경로 — 활성 메뉴 하이라이트에 사용
  const location = useLocation();
  // 인증 상태 및 액션
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const userProfileImage = resolveUserProfileImage(user);
  // 모바일 메뉴 열림/닫힘 상태
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  /*
   * 전역 로딩 인디케이터 활성화 여부.
   *
   * useLoadingStore 의 sources Set 크기로 판정한다 — Match SSE, 검색 등
   * 어느 feature 든 하나라도 start() 한 상태면 true 가 되어 상단 TopBar 가 렌더링된다.
   * `sources.size > 0` 값을 셀렉터로 매핑하여 primitive boolean 이 되도록
   * 해 store 참조 변경마다 매번 리렌더되는 문제를 막는다.
   */
  const isGlobalLoading = useLoadingStore((s) => s.sources.size > 0);
  // 데스크톱 유저 드롭다운 열림/닫힘 상태
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  /*
   * 상단 NAV 드롭다운(`AI 추천`, `마이 픽` 등)의 개폐 상태.
   *
   * - 데스크톱에서는 한 번에 하나만 열리므로 단일 문자열(현재 열린 항목의 key) 또는 null.
   * - 모바일(햄버거 메뉴) 안에서는 여러 섹션이 동시에 펼쳐져도 자연스러우므로
   *   Set 으로 관리한다 → 각 키의 토글이 독립.
   */
  const [openNavDropdown, setOpenNavDropdown] = useState(null);
  const [openMobileSections, setOpenMobileSections] = useState(() => new Set());
  // 드롭다운 외부 클릭 감지를 위한 래퍼 ref
  const userMenuRef = useRef(null);
  // 상단 NAV 영역 전체 — 외부 클릭 시 NAV 드롭다운 닫기 위한 ref
  const navRef = useRef(null);

  // 모바일 메뉴 열릴 때 body 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  /*
   * 유저 아바타 드롭다운 외부 클릭 감지.
   * 트리거(UserInfo 버튼)를 포함한 래퍼 바깥을 클릭하면 닫는다.
   * mousedown을 쓰는 이유: click보다 먼저 발생해 자연스러운 닫힘 UX 제공.
   */
  useEffect(() => {
    if (!isUserMenuOpen) return undefined;

    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsUserMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isUserMenuOpen]);

  /*
   * 상단 NAV 드롭다운 외부 클릭 감지.
   * Nav 컨테이너 바깥을 클릭하면 열려있던 드롭다운을 닫는다.
   * 다른 NAV 트리거 클릭은 onClick 핸들러가 직접 토글하므로 여기선 무시.
   */
  useEffect(() => {
    if (!openNavDropdown) return undefined;

    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenNavDropdown(null);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpenNavDropdown(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [openNavDropdown]);

  /*
   * 라우트 변경 시 드롭다운/모바일 메뉴 자동 닫기.
   * 항목 클릭 → 페이지 이동 → 메뉴 자동 닫힘 흐름을 보장한다.
   *
   * eslint-disable react-hooks/set-state-in-effect — 라우트 동기화는 외부 시스템(React Router)
   * 변화에 반응하는 합법적 effect 사용 사례이다. 라우터 location.pathname 자체가 외부 상태이며,
   * 이를 받아 UI 메뉴 상태를 닫는 것은 "외부 → React" 한 방향 동기화로 cascading 렌더의
   * 의미가 다르다. setState 4개를 묶어 단일 batch 로 처리되므로 성능 영향도 없다.
   */
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    setOpenNavDropdown(null);
    setOpenMobileSections(new Set());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [location.pathname]);

  /**
   * 모바일 메뉴 토글 핸들러.
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  /**
   * 메뉴 항목 클릭 시 모바일 메뉴 닫기.
   */
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  /**
   * 데스크톱 유저 드롭다운 토글.
   * 트리거(아바타+닉네임 버튼) 클릭 시 호출된다.
   */
  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen((prev) => !prev);
  }, []);

  /**
   * 상단 NAV 드롭다운(`AI 추천`/`마이 픽`) 토글 — 데스크톱.
   *
   * 한 번에 하나만 열리도록, 같은 키를 다시 누르면 닫고 다른 키를 누르면 그 키로 교체.
   * 클릭 즉시 유저 드롭다운은 닫는다(겹쳐 보이는 현상 방지).
   */
  const toggleNavDropdown = useCallback((key) => {
    setOpenNavDropdown((prev) => (prev === key ? null : key));
    setIsUserMenuOpen(false);
  }, []);

  /**
   * 모바일 햄버거 메뉴 안의 섹션(드롭다운 항목) 펼침/접힘 토글.
   *
   * 데스크톱과 달리 여러 섹션을 동시에 펼칠 수 있도록 Set 으로 관리한다.
   */
  const toggleMobileSection = useCallback((key) => {
    setOpenMobileSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  /**
   * NAV 항목 노출 여부 판정 — `requiresAuth: true` 면 로그인 사용자에게만 노출.
   *
   * "마이 픽" 탭은 비로그인 사용자에게는 클릭해도 의미 있는 콘텐츠가 없으므로
   * 아예 헤더에서 숨긴다(로그인 후에만 등장).
   */
  const isNavItemVisible = (item) => !item.requiresAuth || isAuthenticated;

  /**
   * 드롭다운 트리거의 활성 상태 판정 — 자식 항목 중 어느 하나라도 현재 경로와 일치하는지.
   *
   * 활성 시 트리거 버튼이 primaryLight 배경 + 글로우 점으로 강조되어,
   * 사용자가 현재 페이지가 어느 그룹에 속하는지 한눈에 알 수 있다.
   */
  const isDropdownActive = (children) =>
    children?.some((child) => child.path === location.pathname) ?? false;

  /**
   * 로그아웃 버튼 클릭 핸들러.
   * useAuthStore.logout이 async (서버 로그아웃 포함)이므로 await로 완료를 기다린다.
   * 서버 요청 실패 시에도 logout() 내부에서 best-effort 처리하므로
   * 이 핸들러에서는 별도 에러 처리가 불필요하다.
   */
  const navigate = useNavigate();

  const handleLogout = async () => {
    // 서버 로그아웃 + 클라이언트 상태 삭제가 완료될 때까지 대기
    await logout();
    closeMobileMenu();
    navigate(ROUTES.LANDING);
  };

  return (
    <S.HeaderWrapper>
      {/*
        전역 비동기 작업 진행 중일 때만 상단 TopBar 로딩 인디케이터 표시.
        - Match SSE 분석 중: '둘이 영화 고르기' 페이지에서 start('match-sse')
        - 완료/취소 시 stop() 으로 제거되어 자동으로 언마운트된다.
        role="progressbar" + aria-label 로 스크린리더 접근성 제공.
      */}
      {isGlobalLoading && (
        <S.TopLoadingBar role="progressbar" aria-label="로딩 중" aria-busy="true" />
      )}
      <S.Inner>
        {/* ── 로고 영역 ── */}
        <S.LogoLink to={ROUTES.HOME} onClick={closeMobileMenu}>
          <S.LogoIcon src="/mongle-transparent.png" alt="몽글픽" />
          <S.LogoText>몽글픽</S.LogoText>
        </S.LogoLink>

        {/*
          ── 네비게이션 링크 (데스크톱 + 모바일 햄버거) ──

          NAV_ITEMS 의 두 가지 항목 타입을 동시에 처리:
            1) 단일 링크: { path, label }                    → <NavLink>
            2) 드롭다운:  { children: [{ path, label }, ...] } → <NavDropdownTrigger> + <NavDropdownPanel>

          데스크톱에서는 드롭다운이 absolute 패널로 떠오르고,
          모바일(햄버거)에서는 같은 마크업이 column flex 흐름에 편입되어
          접이식 섹션처럼 동작한다(스타일에서 분기 처리).
        */}
        {/*
          compact 모드에서는 상단 NAV 트리 자체를 렌더하지 않는다.
          모바일 햄버거의 AuthSection(모바일 유저메뉴) 도 같이 빠지지만,
          compact 는 로고+테마+데스크톱 유저 드롭다운만으로 계정 접근을 보장한다
          (ChatWindow 내부 사이드바에 세션 히스토리가 별도로 존재).
        */}
        {!isCompact && (
        <S.Nav ref={navRef} $isOpen={isMobileMenuOpen}>
          {NAV_ITEMS.filter(isNavItemVisible).map((item) => {
            /* ── 드롭다운(자식 있음) ── */
            if (item.children) {
              const childActive = isDropdownActive(item.children);
              const isOpen = openNavDropdown === item.key;
              const isMobileOpen = openMobileSections.has(item.key);
              /* 데스크톱: openNavDropdown 으로 통제 / 모바일: openMobileSections 로 통제 */
              const shouldShowPanel = isOpen || isMobileOpen;

              return (
                <S.NavDropdownWrapper key={item.key}>
                  <S.NavDropdownTrigger
                    type="button"
                    $active={childActive}
                    onClick={() => {
                      /*
                       * 데스크톱과 모바일 모두에 동작하도록 양쪽 토글을 호출한다.
                       * CSS media query 로 어느 쪽이 보일지가 결정되므로,
                       * 두 상태를 동시에 갱신해도 시각적 충돌은 발생하지 않는다.
                       */
                      toggleNavDropdown(item.key);
                      toggleMobileSection(item.key);
                    }}
                    aria-haspopup="menu"
                    aria-expanded={shouldShowPanel}
                  >
                    {item.label}
                    <S.NavDropdownCaret $open={shouldShowPanel} aria-hidden="true">
                      ▾
                    </S.NavDropdownCaret>
                  </S.NavDropdownTrigger>

                  {shouldShowPanel && (
                    <S.NavDropdownPanel role="menu">
                      {item.children.map((child) => (
                        <S.NavDropdownItem
                          key={child.path}
                          to={child.path}
                          role="menuitem"
                          $active={location.pathname === child.path}
                          /* hover/focus 시 lazy 청크 prefetch — 사용자 클릭 전에 다운로드 시작 */
                          onMouseEnter={() => prefetchRouteByPath(child.path)}
                          onFocus={() => prefetchRouteByPath(child.path)}
                          onClick={() => {
                            /* 항목 선택 → 양쪽 드롭다운 닫고 모바일 메뉴까지 닫음 */
                            setOpenNavDropdown(null);
                            setOpenMobileSections(new Set());
                            closeMobileMenu();
                          }}
                        >
                          {child.label}
                        </S.NavDropdownItem>
                      ))}
                    </S.NavDropdownPanel>
                  )}
                </S.NavDropdownWrapper>
              );
            }

            /* ── 단일 링크 (검색, 커뮤니티 등) ── */
            return (
              <S.NavLink
                key={item.key || item.path}
                to={item.path}
                $active={location.pathname === item.path}
                /* hover/focus 시 lazy 청크 prefetch — 클릭 전 다운로드 시작 */
                onMouseEnter={() => prefetchRouteByPath(item.path)}
                onFocus={() => prefetchRouteByPath(item.path)}
                onClick={closeMobileMenu}
              >
                {item.label}
              </S.NavLink>
            );
          })}

          {/*
            ── 테마 토글 (모바일 메뉴 내부 전용) ──
            모바일 햄버거 메뉴 내부에서는 드롭다운이 없는 맥락이므로 스위치 variant 를
            그대로 한 row 로 노출한다. 햄버거 메뉴 섹션 구분 border-top 과 자연스럽게 결합.
            데스크톱에서는 MobileOnly 로 숨김 — 유저 드롭다운 맨 아래 스위치가 담당.
          */}
          <S.MobileOnly>
            <ThemeToggle variant="switch" />
          </S.MobileOnly>

          {/*
            인증 영역 (모바일 메뉴 내부).

            v2 개편으로 USER_MENU_ITEMS 가 5개로 축소됨(마이페이지/포인트/결제·구독/고객센터).
            콘텐츠성 항목(추천내역/플레이리스트/업적/로드맵/월드컵)은 위 NAV "마이 픽"
            드롭다운에서 이미 노출되므로 여기서는 계정/결제/지원 영역만 보여준다.
          */}
          <S.AuthSection $mobile>
            {isAuthenticated ? (
              <>
                {USER_MENU_ITEMS.map((item, idx) =>
                  /* divider 항목은 모바일에서는 시각적 구분이 불필요하므로 스킵 */
                  item.divider ? null : (
                    <S.NavLink
                      key={item.path || `divider-${idx}`}
                      to={item.path}
                      $active={location.pathname === item.path}
                      /* 모바일 hover 는 없지만 focus 와 햄버거 펼침 시점에 prefetch 가
                         자동 실행됨 — onFocus 만으로도 키보드 접근성 + 일부 데스크톱
                         축소 화면에서 hover 유효 */
                      onMouseEnter={() => prefetchRouteByPath(item.path)}
                      onFocus={() => prefetchRouteByPath(item.path)}
                      onClick={closeMobileMenu}
                    >
                      {item.label}
                    </S.NavLink>
                  ),
                )}
                <S.LogoutBtn onClick={handleLogout}>
                  로그아웃
                </S.LogoutBtn>
              </>
            ) : (
              <>
                <S.AuthBtn to={ROUTES.LOGIN} onClick={closeMobileMenu}>
                  로그인
                </S.AuthBtn>
                <S.SignupBtn to={ROUTES.SIGNUP} onClick={closeMobileMenu}>
                  회원가입
                </S.SignupBtn>
              </>
            )}
          </S.AuthSection>
        </S.Nav>
        )}

        {/*
          ── 데스크톱 테마 토글 제거 (2026-04-23) ──
          헤더 상단 바에서 홀로 떠 있던 ThemeToggle 을 제거.
          - 로그인 상태: UserDropdown 맨 아래 스위치 row 로 이동 (환경 설정 그룹).
          - 비로그인 상태: AuthSection 내부 로그인 버튼 왼쪽에 compact variant 로 노출.
          - 모바일: 햄버거 메뉴 내부 MobileOnly 스위치 row 로 노출 (위 Nav 블록 참고).
        */}

        {/*
          인증 영역 (데스크톱).
          로그인 상태에서는 아바타+닉네임 트리거를 누르면 드롭다운이 펼쳐진다.
          드롭다운에는 USER_MENU_ITEMS의 모든 항목 + 로그아웃이 들어가며,
          divider 항목은 그룹 구분선으로 렌더링된다.
        */}
        <S.AuthSection $desktop>
          {isAuthenticated ? (
            <S.UserMenuWrapper ref={userMenuRef}>
              <S.UserInfo
                type="button"
                $open={isUserMenuOpen}
                onClick={toggleUserMenu}
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                aria-label="사용자 메뉴 열기"
              >
                <S.UserAvatar>
                  {userProfileImage ? (
                    <img src={userProfileImage} alt={`${user?.nickname || '사용자'} 프로필 이미지`} />
                  ) : (
                    user?.nickname?.charAt(0) || 'U'
                  )}
                </S.UserAvatar>
                <S.UserName>{user?.nickname || '사용자'}</S.UserName>
                <S.UserMenuCaret $open={isUserMenuOpen} aria-hidden="true">
                  ▾
                </S.UserMenuCaret>
              </S.UserInfo>

              {isUserMenuOpen && (
                <S.UserDropdown role="menu">
                  {USER_MENU_ITEMS.map((item, idx) =>
                    item.divider ? (
                      <S.DropdownDivider key={`divider-${idx}`} aria-hidden="true" />
                    ) : (
                      <S.DropdownItem
                        key={item.path}
                        to={item.path}
                        role="menuitem"
                        $active={location.pathname === item.path}
                        /* 드롭다운 펼침 후 메뉴 항목 hover/focus 시 prefetch.
                           UserDropdown 의 9 항목 모두에 부착되지만, prefetched Set 으로
                           중복 호출 차단되어 첫 hover 만 실제 다운로드 발생. */
                        onMouseEnter={() => prefetchRouteByPath(item.path)}
                        onFocus={() => prefetchRouteByPath(item.path)}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        {item.label}
                      </S.DropdownItem>
                    ),
                  )}
                  {/*
                    ── 다크 모드 스위치 (환경 설정 그룹) ──
                    메뉴 이동 항목들과 로그아웃 사이의 "환경 설정" 슬롯.
                    내부에서 stopPropagation + role="switch" 로 처리되므로
                    여기서는 단순히 배치만 한다.
                  */}
                  <S.DropdownDivider aria-hidden="true" />
                  <ThemeToggle variant="switch" />
                  <S.DropdownDivider aria-hidden="true" />
                  <S.DropdownLogoutBtn
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    로그아웃
                  </S.DropdownLogoutBtn>
                </S.UserDropdown>
              )}
            </S.UserMenuWrapper>
          ) : (
            <>
              {/*
                비로그인 상태 — UserDropdown 이 없으므로 테마 토글을 여기에 직접 노출.
                compact variant = 작은 원형 아이콘 버튼으로 로그인/회원가입 버튼과 균형.
              */}
              <ThemeToggle variant="compact" />
              <S.AuthBtn to={ROUTES.LOGIN}>
                로그인
              </S.AuthBtn>
              <S.SignupBtn to={ROUTES.SIGNUP}>
                회원가입
              </S.SignupBtn>
            </>
          )}
        </S.AuthSection>

        {/*
          ── 모바일 햄버거 메뉴 버튼 ──
          compact 모드에서는 숨긴다 — 열릴 Nav 자체가 없으므로 토글 버튼은 의미 없음.
        */}
        {!isCompact && (
          <S.MobileToggle
            $isOpen={isMobileMenuOpen}
            onClick={toggleMobileMenu}
            aria-label="메뉴 열기/닫기"
          >
            <span></span>
            <span></span>
            <span></span>
          </S.MobileToggle>
        )}
      </S.Inner>
    </S.HeaderWrapper>
  );
}
