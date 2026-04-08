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
/* 라우트 경로 상수 — shared/constants에서 가져옴 (USER_MENU_ITEMS = 유저 드롭다운 항목) */
import { ROUTES, NAV_ITEMS, USER_MENU_ITEMS } from '../../constants/routes';
import ThemeToggle from './ThemeToggle';
import * as S from './Header.styled';

export default function Header() {
  // 현재 경로 — 활성 메뉴 하이라이트에 사용
  const location = useLocation();
  // 인증 상태 및 액션
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  // 모바일 메뉴 열림/닫힘 상태
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // 데스크톱 유저 드롭다운 열림/닫힘 상태
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  // 드롭다운 외부 클릭 감지를 위한 래퍼 ref
  const userMenuRef = useRef(null);

  // 모바일 메뉴 열릴 때 body 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  /*
   * 드롭다운 외부 클릭 감지.
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
   * 라우트 변경 시 드롭다운/모바일 메뉴 자동 닫기.
   * 항목 클릭 → 페이지 이동 → 메뉴 자동 닫힘 흐름을 보장한다.
   */
  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
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
      <S.Inner>
        {/* ── 로고 영역 ── */}
        <S.LogoLink to={ROUTES.HOME} onClick={closeMobileMenu}>
          <S.LogoIcon src="/mongle-transparent.png" alt="몽글픽" />
          <S.LogoText>몽글픽</S.LogoText>
        </S.LogoLink>

        {/* ── 네비게이션 링크 (데스크톱) ── */}
        <S.Nav $isOpen={isMobileMenuOpen}>
          {NAV_ITEMS.map((item) => (
            <S.NavLink
              key={item.path}
              to={item.path}
              $active={location.pathname === item.path}
              onClick={closeMobileMenu}
            >
              {item.label}
            </S.NavLink>
          ))}

          {/* ── 테마 토글 (모바일 메뉴 내부 전용 — 데스크톱에서는 숨김) ── */}
          <S.MobileOnly>
            <ThemeToggle />
          </S.MobileOnly>

          {/*
            인증 영역 (모바일 메뉴 내부).
            로그인 상태에서는 USER_MENU_ITEMS를 NavLink 형태로 평탄화해
            햄버거 메뉴 안에서 모든 유저 기능(마이페이지/포인트/결제/추천내역
            /플레이리스트/업적/로드맵/고객센터)을 한눈에 노출한다.
          */}
          <S.AuthSection $mobile>
            {isAuthenticated ? (
              <>
                {USER_MENU_ITEMS.map((item) =>
                  /* divider 항목은 모바일에서는 시각적 구분이 불필요하므로 스킵 */
                  item.divider ? null : (
                    <S.NavLink
                      key={item.path}
                      to={item.path}
                      $active={location.pathname === item.path}
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

        {/* ── 테마 토글 (데스크톱) ── */}
        <ThemeToggle />

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
                  {user?.nickname?.charAt(0) || 'U'}
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
                      /* 그룹 구분선 — path가 없으므로 idx를 키로 사용 */
                      <S.DropdownDivider key={`divider-${idx}`} aria-hidden="true" />
                    ) : (
                      <S.DropdownItem
                        key={item.path}
                        to={item.path}
                        role="menuitem"
                        $active={location.pathname === item.path}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        {item.label}
                      </S.DropdownItem>
                    ),
                  )}
                  {/* 마지막 그룹 — 로그아웃 (path 없는 액션이라 별도 컴포넌트) */}
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
              <S.AuthBtn to={ROUTES.LOGIN}>
                로그인
              </S.AuthBtn>
              <S.SignupBtn to={ROUTES.SIGNUP}>
                회원가입
              </S.SignupBtn>
            </>
          )}
        </S.AuthSection>

        {/* ── 모바일 햄버거 메뉴 버튼 ── */}
        <S.MobileToggle
          $isOpen={isMobileMenuOpen}
          onClick={toggleMobileMenu}
          aria-label="메뉴 열기/닫기"
        >
          <span></span>
          <span></span>
          <span></span>
        </S.MobileToggle>
      </S.Inner>
    </S.HeaderWrapper>
  );
}
