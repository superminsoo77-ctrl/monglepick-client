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

/** 헤더 — 상단 고정, 반투명 배경 + 블러 + 하단 그라데이션 보더 */
export const HeaderWrapper = styled.header`
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndex.sticky};
  width: 100%;
  height: ${({ theme }) => theme.layout.headerHeight};
  background-color: ${({ theme }) => theme.header.bg};
  backdrop-filter: blur(20px) saturate(1.8);
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  border-bottom: none;
  transition: backdrop-filter ${({ theme }) => theme.transitions.base};

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

  ${media.tablet} {
    display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
    position: fixed;
    top: ${({ theme }) => theme.layout.headerHeight};
    left: 0;
    right: 0;
    bottom: 0;
    flex-direction: column;
    padding: ${({ theme }) => theme.spacing.lg};
    background-color: ${({ theme }) => theme.header.mobileBg};
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid ${({ theme }) => theme.colors.borderDefault};
    gap: ${({ theme }) => theme.spacing.sm};
    overflow-y: auto;
  }
`;

/** 네비게이션 링크 */
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

  /* 활성 링크 하단 글로우 점 */
  ${({ $active, theme }) =>
    $active &&
    css`
      &::after {
        content: '';
        position: absolute;
        bottom: 2px;
        left: 50%;
        transform: translateX(-50%);
        width: 6px;
        height: 6px;
        border-radius: ${theme.radius.full};
        background-color: ${theme.colors.primary};
        box-shadow: ${theme.glows.primary};
      }
    `}

  ${media.tablet} {
    font-size: ${({ theme }) => theme.typography.textLg};
    padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
    border-radius: ${({ theme }) => theme.radius.lg};
  }
`;

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

/** 트리거 우측 ▾ 화살표 — 열림 상태에서 180도 회전 */
export const UserMenuCaret = styled.span`
  display: inline-block;
  font-size: 10px;
  line-height: 1;
  color: ${({ theme }) => theme.colors.textMuted};
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
