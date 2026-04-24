/**
 * AccountLayout styled-components.
 *
 * 반응형 2-pane 레이아웃:
 *   - ≥ 1024px: [사이드바 240px | 본문 flex:1] 가로 배치
 *   - < 1024px: [상단 가로 스크롤 탭바 | 본문] 세로 배치
 *
 * 테마 변수는 기존 MainLayout.styled.js 와 동일하게 `theme.colors.*` 를 사용.
 * 커스텀 색상은 도입하지 않고 현재 테마 팔레트 내에서 해결한다.
 */

import styled, { css } from 'styled-components';

/** 데스크톱/모바일 분기 임계값 — 768px(태블릿) 은 아직 좁으므로 1024 를 기준으로 삼음 */
const BREAKPOINT = '1024px';

/** 전체 컨테이너 — 페이지 콘텐츠 너비 제한 + 2-pane 정렬 */
export const Wrapper = styled.div`
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px 64px;
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 32px;

  @media (max-width: ${BREAKPOINT}) {
    grid-template-columns: 1fr;
    padding: 16px 12px 48px;
    gap: 16px;
  }
`;

/** 좌측(또는 모바일 상단) 네비게이션 래퍼 */
export const SideNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: sticky;
  top: 80px;                                  /* 상단 헤더(64) + 여유 16 */
  align-self: start;

  @media (max-width: ${BREAKPOINT}) {
    position: static;
    flex-direction: row;
    overflow-x: auto;
    gap: 4px;
    padding-bottom: 4px;
    scroll-snap-type: x mandatory;
    /* 스크롤바 숨김 — 가로 스와이프 UX 에만 의존 */
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }
`;

/** 섹션 그룹 (프로필 / 활동 / 결제·리워드) */
export const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  @media (max-width: ${BREAKPOINT}) {
    flex-direction: row;
    gap: 4px;
    flex-shrink: 0;
    /* 모바일에서는 그룹 타이틀이 사라지므로 그룹 간 간격은 section 구분선으로 대신 */
    &:not(:last-child)::after {
      content: '';
      width: 1px;
      background: ${({ theme }) => theme.colors.borderLight ?? 'rgba(255,255,255,0.08)'};
      margin: 4px 8px;
      scroll-snap-align: none;
    }
  }
`;

/** 섹션 타이틀 — 데스크톱에서만 노출 */
export const GroupTitle = styled.h3`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted ?? 'rgba(255,255,255,0.5)'};
  letter-spacing: 0.4px;
  text-transform: uppercase;
  margin: 0 0 4px 12px;

  @media (max-width: ${BREAKPOINT}) {
    display: none;
  }
`;

/**
 * NavLink 내부에서 렌더되는 실제 항목 버튼.
 *
 * transient prop `$active` 를 받아 NavLink 의 isActive 를 반영.
 * hover / active / 일반 상태 3단계 스타일.
 */
export const NavItem = styled.span`
  display: block;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary ?? 'rgba(255,255,255,0.72)'};
  transition: background 120ms ease, color 120ms ease;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.bgHover ?? 'rgba(255,255,255,0.06)'};
    color: ${({ theme }) => theme.colors.textPrimary ?? '#fff'};
  }

  ${({ $active, theme }) =>
    $active &&
    css`
      background: ${theme.colors.primaryLight ?? 'rgba(255,107,107,0.14)'};
      color: ${theme.colors.primary ?? '#ff6b6b'};
      font-weight: 600;
    `}

  @media (max-width: ${BREAKPOINT}) {
    padding: 8px 14px;
    scroll-snap-align: start;
    font-size: 13px;
  }
`;

/** 본문 영역 — 하위 라우트의 Outlet 을 감싸는 컨테이너 */
export const Content = styled.section`
  min-width: 0;   /* grid flex overflow 안전장치 */
`;
