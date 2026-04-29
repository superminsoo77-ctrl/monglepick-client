/**
 * Header styled-components.
 *
 * 다크 테마 반투명 배경의 상단 고정 네비게이션 바.
 * 하단 그라데이션 보더 + 로고 gradient-text + 활성 링크 글로우 점.
 * 768px 이하에서 모바일 햄버거 메뉴로 전환된다.
 */

import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import { gradientText } from '../../styles/mixins';
import { media } from '../../styles/media';
import { topBarSlide } from '../../styles/animations';

/**
 * 헤더 — 상단 고정, 반투명 배경 + 블러 + 하단 그라데이션 보더.
 *
 * ⚠️ background-color / backdrop-filter 를 ::before 의사 요소로 분리.
 * CSS 스펙상 backdrop-filter 가 요소에 직접 있으면 자식의 position: fixed 에
 * 대한 containing block 을 생성하여, 모바일 햄버거 메뉴(Nav) 의 fixed 포지셔닝이
 * 뷰포트 대신 64px 헤더 기준이 되어 메뉴 오버레이가 보이지 않는 버그 발생.
 * ::before 로 분리하면 Nav 는 HeaderWrapper 의 자식이지 ::before 의 자식이
 * 아니므로, position: fixed 가 정상적으로 뷰포트 기준으로 동작한다.
 */
export const HeaderWrapper = styled.header`
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndex.sticky};
  width: 100%;
  height: ${({ theme }) => theme.layout.headerHeight};
  border-bottom: none;

  /*
   * 반투명 배경 + 블러 — ::before 의사 요소로 분리.
   * z-index: -1 로 HeaderWrapper 스태킹 컨텍스트 내에서 가장 뒤에 배치하되,
   * 부모 배경(transparent) 위에 그려지므로 블러 효과는 정상 동작.
   */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${({ theme }) => theme.header.bg};
    backdrop-filter: blur(20px) saturate(1.8);
    -webkit-backdrop-filter: blur(20px) saturate(1.8);
    z-index: -1;
  }

  /* 하단 그라데이션 라인 (1px) */
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: ${({ theme }) => theme.gradients.primary};
    opacity: 0.5;
  }
`;

/**
 * 전역 TopBar 로딩 인디케이터.
 *
 * 헤더 최상단에 붙는 얇은(2px) 그라데이션 바로, 전역 `useLoadingStore` 의
 * sources 크기가 1 이상일 때만 렌더링된다.
 * YouTube/GitHub 스타일의 indeterminate progress — 완료율을 알 수 없는
 * 비동기 작업(Match SSE 분석, 검색 등) 에서 "뭔가 일어나고 있음" 을
 * 시각적으로 알린다.
 *
 * position: absolute 로 HeaderWrapper 상단에 겹치도록 배치하며,
 * `::before` 의사 요소가 좌→우로 흐르면서 진행 느낌을 만든다.
 */
export const TopLoadingBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  overflow: hidden;
  pointer-events: none;
  /* 배경은 아주 옅게 깔아두어 바가 지나지 않는 구간도 살짝 보이게 */
  background: rgba(124, 108, 240, 0.08);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -35%;
    width: 35%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(124, 108, 240, 0.9) 30%,
      rgba(6, 214, 160, 0.9) 70%,
      transparent 100%
    );
    /* topBarSlide keyframes — shared/styles/animations.js 정의 */
    animation: ${topBarSlide} 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    box-shadow: 0 0 10px rgba(124, 108, 240, 0.4);
  }
`;

/** 내부 컨테이너 — 최대 너비 + 양쪽 정렬 */
export const Inner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  height: 100%;
`;

/** 로고 링크 */
export const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  text-decoration: none;
  color: ${({ theme }) => theme.colors.textPrimary};
  flex-shrink: 0;
`;

/** 로고 아이콘 (몽글 캐릭터 이미지) */
export const LogoIcon = styled.img`
  width: 36px;
  height: 36px;
  object-fit: contain;
  flex-shrink: 0;
`;

/** 로고 텍스트 — 그라데이션 텍스트 효과 */
export const LogoText = styled.span`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  ${gradientText}
`;

/** 네비게이션 — 데스크톱 flex, 모바일 오버레이 */
export const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  /*
   * 2026-04-23 중앙 배치:
   * Nav 와 AuthSection($desktop) 양쪽에 margin-left: auto 를 주면 flex 가 두 요소 앞의
   * 남는 공간을 균등 분배한다. 결과적으로 [로고 ... NAV ... 유저드롭다운] 구도가 되어
   * NAV 가 헤더 중앙에 위치한다 (유저 드롭다운은 우측 끝 유지).
   * (2026-04-23 후속: 헤더 상단 바의 ThemeToggle 단독 노출 폐지 — UserDropdown 내부 스위치로 흡수)
   */
  margin-left: auto;

  ${media.tablet} {
    /* 모바일에서는 풀 오버레이이므로 data auto margin 무효화 */
    margin-left: 0;
    display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
    position: fixed;
    top: ${({ theme }) => theme.layout.headerHeight};
    left: 0;
    right: 0;
    /*
     * 높이는 'top: headerHeight + height: (viewport - headerHeight)' 로 명시한다.
     *
     * 기존 'bottom: 0' 방식이 짤림의 근본 원인이었다:
     *   - 모바일 브라우저(iOS Safari, Chrome Android) 의 address bar 는 동적으로
     *     보였다/숨겨졌다 하며 이로 인해 visual viewport 가 매 프레임 변동된다.
     *   - 'bottom: 0' 은 layout viewport 기준이라, address bar 가 표시된 상태에서는
     *     실제로 보이는 영역보다 메뉴가 더 길어져 하단이 잘려 보였다.
     *
     * 해결:
     *   1) 100dvh (dynamic viewport height) 를 사용해 address bar 변화에 동적으로 대응.
     *      → dvh 미지원 브라우저는 100vh 로 폴백.
     *   2) safe-area-inset-bottom 만큼 padding-bottom 을 추가해 홈 인디케이터/제스처 바를
     *      회피 (index.html 의 viewport-fit=cover 와 함께 동작).
     *   3) -webkit-overflow-scrolling: touch + overscroll-behavior: contain 으로
     *      iOS 모멘텀 스크롤 활성 + 부모 body 로 스크롤 체이닝 차단.
     */
    height: calc(100vh - ${({ theme }) => theme.layout.headerHeight});
    height: calc(100dvh - ${({ theme }) => theme.layout.headerHeight});
    /* 모바일 메뉴가 페이지 콘텐츠 위에 오도록 z-index 설정 */
    z-index: ${({ theme }) => theme.zIndex.modal};
    flex-direction: column;
    padding: ${({ theme }) => theme.spacing.lg};
    /* 홈 인디케이터/노치 영역 회피 — viewport-fit=cover 필요 */
    padding-bottom: calc(${({ theme }) => theme.spacing.lg} + env(safe-area-inset-bottom, 0px));
    padding-left: calc(${({ theme }) => theme.spacing.lg} + env(safe-area-inset-left, 0px));
    padding-right: calc(${({ theme }) => theme.spacing.lg} + env(safe-area-inset-right, 0px));
    background-color: ${({ theme }) => theme.header.mobileBg};
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid ${({ theme }) => theme.colors.borderDefault};
    gap: ${({ theme }) => theme.spacing.sm};
    overflow-y: auto;
    overflow-x: hidden;
    /* iOS 모멘텀 스크롤 — 햄버거 메뉴가 길어졌을 때 부드러운 터치 스크롤 보장 */
    -webkit-overflow-scrolling: touch;
    /* 부모 body 로 스크롤 체이닝 방지 — 메뉴 끝에서 페이지가 밀리는 현상 차단 */
    overscroll-behavior: contain;
  }
`;

/**
 * 네비게이션 링크.
 *
 * v2 개편 (2026-04-08): 활성 표시는 글로우 점이 아니라
 * primary 색 텍스트 + primaryLight 배경 만으로 처리(더 깔끔).
 */
export const NavLink = styled(Link)`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.textSecondary};
  background-color: ${({ $active, theme }) =>
    $active ? theme.colors.primaryLight : 'transparent'};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  text-decoration: none;
  transition: all ${({ theme }) => theme.transitions.fast};
  position: relative;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
    background-color: ${({ theme }) => theme.colors.bgElevated};
  }

  ${media.tablet} {
    font-size: ${({ theme }) => theme.typography.textLg};
    padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
    border-radius: ${({ theme }) => theme.radius.lg};
  }
`;

/* ============================================================ */
/*  상단 NAV 드롭다운 (v2 개편 — AI 추천 / 마이 픽 등)              */
/* ============================================================ */

/**
 * NAV 드롭다운 래퍼 — 트리거 버튼과 패널을 감싸는 위치 기준점.
 *
 * `position: relative` 가 있어야 NavDropdownPanel 이 트리거 바로 아래로 정렬된다.
 * 모바일(햄버거 메뉴 내부)에서는 드롭다운이 아니라 접이식 섹션으로 평탄화되므로
 * 위치 기준이 의미가 없어진다 — Nav 컨테이너가 column flex 로 동작.
 */
export const NavDropdownWrapper = styled.div`
  position: relative;
  display: inline-flex;

  ${media.tablet} {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
`;

/**
 * NAV 드롭다운 트리거 버튼 — NavLink 와 동일한 외형 + ▾ 캐럿.
 *
 * NavLink 가 <Link> 컴포넌트인 데 비해, 트리거는 자체 path 가 없으므로 <button>.
 * `$active` 는 드롭다운 자식 중 어느 하나라도 현재 경로와 일치할 때 true.
 *
 * v2 개편 (2026-04-08): 활성 표시를 글로우 점이 아닌 primary 색 텍스트 + primaryLight 배경
 * 만으로 처리하여 NavLink 와 일관된 시각 언어를 유지.
 */
export const NavDropdownTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border: none;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.primaryLight : 'transparent'};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  font-family: inherit;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  position: relative;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
    background-color: ${({ theme }) => theme.colors.bgElevated};
  }

  /* 모바일에서는 섹션 헤더처럼 동작 — 풀너비 + 큰 폰트 */
  ${media.tablet} {
    width: 100%;
    justify-content: space-between;
    font-size: ${({ theme }) => theme.typography.textLg};
    padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
    border-radius: ${({ theme }) => theme.radius.lg};
  }
`;

/**
 * NAV 드롭다운 트리거의 캐럿 — 열림 시 180도 회전.
 *
 * 가시성 보정 이력 (2026-04-08):
 *   1차: 10px → 14px + bold
 *   2차: 14px → 18px (사용자 피드백 — 더 잘 보여야 함)
 *
 * - 색상은 inherit(currentColor) — 트리거 버튼의 활성/호버 색을 그대로 따라감
 * - 굵은 문자 weight + 살짝 큰 line-height 로 가시성 향상
 * - 라벨과의 시각적 균형을 위해 좌측 마진 살짝 확보
 *
 * 글리프는 프로젝트 전반(SearchPage SortArrow 등)에서 쓰는 ▾ 컨벤션을 유지.
 */
export const NavDropdownCaret = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  color: inherit;
  font-weight: ${({ theme }) => theme.typography.fontBold};
  margin-left: 2px;
  transition: transform ${({ theme }) => theme.transitions.fast};
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
`;

/**
 * NAV 드롭다운 패널 — 데스크톱에서 트리거 바로 아래에 absolute.
 *
 * UserDropdown 과 동일한 글래스 모피즘 + 그림자.
 * 모바일에서는 햄버거 메뉴 안에서 일반 흐름으로 그대로 펼쳐지도록
 * absolute 해제 + 좌측 들여쓰기.
 */
export const NavDropdownPanel = styled.div`
  position: absolute;
  top: calc(100% + ${({ theme }) => theme.spacing.xs});
  left: 0;
  min-width: 200px;
  padding: ${({ theme }) => theme.spacing.xs};
  background-color: ${({ theme }) => theme.header.bg};
  backdrop-filter: blur(20px) saturate(1.8);
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  z-index: ${({ theme }) => theme.zIndex.dropdown ?? 100};
  display: flex;
  flex-direction: column;
  gap: 2px;

  /* 모바일 — absolute 해제, 햄버거 메뉴 흐름에 편입 */
  ${media.tablet} {
    position: static;
    min-width: 0;
    margin-top: ${({ theme }) => theme.spacing.xs};
    margin-left: ${({ theme }) => theme.spacing.md};
    padding: 0;
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border: none;
    border-left: 2px solid ${({ theme }) => theme.colors.borderDefault};
    border-radius: 0;
    box-shadow: none;
    padding-left: ${({ theme }) => theme.spacing.md};
  }
`;

/**
 * NAV 드롭다운 패널 내부의 단일 메뉴 항목 (Link).
 *
 * UserDropdown 의 DropdownItem 과 동일 스타일을 별도 컴포넌트로 정의해
 * 향후 NAV/유저 메뉴 스타일이 갈라질 때 영향 격리.
 */
export const NavDropdownItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.textSecondary};
  background-color: ${({ $active, theme }) =>
    $active ? theme.colors.primaryLight : 'transparent'};
  text-decoration: none;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
    background-color: ${({ theme }) => theme.colors.bgElevated};
  }

  /* 모바일에서 본문 텍스트 살짝 키우기 */
  ${media.tablet} {
    font-size: ${({ theme }) => theme.typography.textBase};
    padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  }
`;

/* ============================================================ */

/** 인증 버튼 영역 */
export const AuthSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  /* 모바일용 — 데스크톱에서 숨김 */
  ${({ $mobile }) =>
    $mobile &&
    css`
      display: none;

      ${media.tablet} {
        display: flex;
        flex-direction: column;
        gap: ${({ theme }) => theme.spacing.sm};
        margin-top: ${({ theme }) => theme.spacing.lg};
        padding-top: ${({ theme }) => theme.spacing.lg};
        border-top: 1px solid ${({ theme }) => theme.colors.borderDefault};
      }
    `}

  /* 데스크톱용 — 모바일에서 숨김 */
  ${({ $desktop }) =>
    $desktop &&
    css`
      /*
       * 2026-04-23 우측 끝 고정:
       * Inner(space-between) + 4 자식(Logo/Nav/AuthSection/MobileToggle) 구도에서
       * 자식들이 균등 분산되어 AuthSection 이 중간처럼 보이는 현상 방지.
       * margin-left: auto 로 본인의 왼쪽 여백을 모두 흡수 → AuthSection 이 항상 최우측에 붙는다.
       * (데스크톱에서 MobileToggle 은 display:none 이므로 AuthSection 이 실질적 최우측 자식이 됨)
       *
       * 2026-04-23 후속: 헤더 상단 바의 ThemeToggle 단독 노출을 폐지.
       *   - 로그인 상태:  UserDropdown 맨 아래 스위치 row 로 흡수.
       *   - 비로그인 상태: AuthSection 내부(로그인 버튼 왼쪽)에 compact variant 로 삽입.
       *   헤더 바 자식은 Logo/Nav/AuthSection/MobileToggle 4개로 정리됨.
       */
      margin-left: auto;

      ${media.tablet} {
        display: none;
      }
    `}
`;

/** 인증 버튼 — 기본 */
export const AuthBtn = styled(Link)`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  ${AuthSection}[data-mobile] & {
    padding: ${({ theme }) => theme.spacing.md};
    text-align: center;
    font-size: ${({ theme }) => theme.typography.textLg};
    border-radius: ${({ theme }) => theme.radius.lg};
  }
`;

/** 회원가입 버튼 — 그라데이션 배경 */
export const SignupBtn = styled(AuthBtn)`
  background: ${({ theme }) => theme.gradients.primary};
  color: white;

  &:hover {
    color: white;
    box-shadow: ${({ theme }) => theme.glows.primary};
    transform: translateY(-1px);
  }
`;

/** 로그아웃 버튼 */
export const LogoutBtn = styled.button`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textMuted};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.error};
  }
`;

/**
 * 사용자 메뉴 래퍼 — 데스크톱 드롭다운의 위치 기준점.
 *
 * 아바타 트리거 버튼과 그 아래 absolute 위치한 드롭다운 패널을 감싼다.
 * `position: relative` 가 있어야 패널이 트리거 바로 아래에 정렬된다.
 */
export const UserMenuWrapper = styled.div`
  position: relative;
  display: inline-flex;
`;

/**
 * 사용자 정보 트리거 (로그인 상태) — 아바타 + 닉네임 버튼.
 *
 * 기존에는 `<Link to="/mypage">` 였으나 드롭다운 트리거 역할을 하도록
 * `<button>` 으로 변경했다. 마이페이지 진입은 드롭다운 첫 항목으로 옮겼다.
 */
export const UserInfo = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  background: transparent;
  border: none;
  cursor: pointer;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.radius.md};
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.bgElevated};
  }

  /* 드롭다운 열림 상태 — 배경 강조 */
  ${({ $open, theme }) =>
    $open &&
    css`
      background-color: ${theme.colors.bgElevated};
    `}
`;

/**
 * 트리거 우측 ▾ 화살표 — 열림 상태에서 180도 회전.
 *
 * NavDropdownCaret 과 동일한 가시성 보정 (2026-04-08): 18px + bold + 좌측 마진.
 * 헤더의 모든 드롭다운 캐럿이 같은 크기/굵기로 통일된다.
 */
export const UserMenuCaret = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  margin-left: 2px;
  transition: transform ${({ theme }) => theme.transitions.fast};
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
`;

/**
 * 드롭다운 패널 — 트리거 바로 아래에 절대 위치.
 *
 * 다크 테마 반투명 + blur 효과로 헤더와 동일한 글래스 모피즘 스타일.
 * 768px 이하(모바일)에서는 햄버거 메뉴 내부에 직접 노출하므로 숨긴다.
 */
export const UserDropdown = styled.div`
  position: absolute;
  top: calc(100% + ${({ theme }) => theme.spacing.xs});
  right: 0;
  min-width: 220px;
  padding: ${({ theme }) => theme.spacing.xs};
  background-color: ${({ theme }) => theme.header.bg};
  backdrop-filter: blur(20px) saturate(1.8);
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  z-index: ${({ theme }) => theme.zIndex.dropdown ?? 100};
  display: flex;
  flex-direction: column;
  gap: 2px;

  /* 모바일에서는 햄버거 메뉴 안에서 항목을 펼치므로 드롭다운 자체는 숨김 */
  ${media.tablet} {
    display: none;
  }
`;

/** 드롭다운 메뉴 항목 — Link */
export const DropdownItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.textSecondary};
  background-color: ${({ $active, theme }) =>
    $active ? theme.colors.primaryLight : 'transparent'};
  text-decoration: none;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
    background-color: ${({ theme }) => theme.colors.bgElevated};
  }
`;

/** 드롭다운 그룹 구분선 */
export const DropdownDivider = styled.div`
  height: 1px;
  margin: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  background-color: ${({ theme }) => theme.colors.borderDefault};
`;

/** 드롭다운 푸터(로그아웃 영역) — 본문과 시각적으로 분리 */
export const DropdownLogoutBtn = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textMuted};
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.error};
    background-color: ${({ theme }) => theme.colors.bgElevated};
  }
`;

/** 사용자 아바타 (원형) — 그라데이션 보더 */
export const UserAvatar = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.gradients.primary};
  color: white;
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  font-size: ${({ theme }) => theme.typography.textSm};
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

/** 사용자 닉네임 */
export const UserName = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

/** 모바일에서만 표시 (데스크톱 Nav 내부 중복 요소 숨김용) */
export const MobileOnly = styled.div`
  display: none;

  ${media.tablet} {
    display: block;
  }
`;

/** 모바일 햄버거 메뉴 버튼 */
export const MobileToggle = styled.button`
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 28px;
  height: 28px;
  cursor: pointer;

  span {
    display: block;
    width: 100%;
    height: 2px;
    background-color: ${({ theme }) => theme.colors.textSecondary};
    border-radius: 1px;
    transition: all ${({ theme }) => theme.transitions.fast};
  }

  /* 햄버거 -> X 변환 (열림 상태) */
  ${({ $isOpen }) =>
    $isOpen &&
    css`
      span:nth-child(1) {
        transform: translateY(7px) rotate(45deg);
      }
      span:nth-child(2) {
        opacity: 0;
      }
      span:nth-child(3) {
        transform: translateY(-7px) rotate(-45deg);
      }
    `}

  ${media.tablet} {
    display: flex;
  }
`;
