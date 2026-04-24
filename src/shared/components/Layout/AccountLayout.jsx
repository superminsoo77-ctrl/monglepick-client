/**
 * 계정 허브 레이아웃 (Phase 2).
 *
 * `/account/*` 하위 라우트들이 공유하는 레이아웃. 좌측(또는 모바일 상단)에
 * `AccountSideNav` 를 한 번만 렌더하고, 우측/아래 본문 영역에 `<Outlet />` 을
 * 두어 하위 라우트(프로필·포인트·결제·추천내역·플레이리스트·업적·도장깨기·월드컵 등)
 * 가 스왑된다.
 *
 * 주의 — PR-1 스켈레톤 단계:
 *   이 파일은 빈 껍데기로 먼저 커밋되며, 실제로는 PR-4 에서 App.jsx 의 라우트
 *   트리에 편입된다. PR-1 에서는 import 도, 참조도 없으므로 번들에 포함되지 않지만,
 *   파일이 존재해야 후속 PR 들이 이 경로를 기준으로 커밋을 쌓을 수 있다.
 *
 * 반응형 전략:
 *   - ≥ 1024px: 좌측 고정 사이드바(240px) + 우측 콘텐츠
 *   - < 1024px: 상단 가로 스크롤 탭바 + 세로 콘텐츠
 *   두 모드 모두 동일한 `NavLink` 트리를 재사용, CSS 미디어쿼리로 분기.
 */

import { NavLink, Outlet } from 'react-router-dom';
import * as S from './AccountLayout.styled';

/**
 * 사이드바 섹션 그룹 정의.
 *
 * 섹션 3개 (프로필 / 활동 / 결제·리워드) 로 묶어 사용자 인지 부담을 줄인다.
 * 각 NavLink 는 활성 상태를 `$active` prop 으로 styled 에 전달한다.
 *
 * end 속성:
 *   - '/account/profile' 같은 단일 페이지는 exact 매칭이면 충분
 *   - '/account/achievement' 는 하위 `/achievement/:id` 에서도 상위 항목이 활성으로
 *     보여야 하므로 end 를 설정하지 않음 (React Router v6+ 기본 prefix 매칭)
 */
const NAV_GROUPS = [
  {
    title: '프로필',
    items: [
      { to: '/account/profile', label: '내 정보', end: true },
    ],
  },
  {
    title: '활동',
    items: [
      { to: '/account/recommendations', label: '추천 내역' },
      { to: '/account/playlist',        label: '플레이리스트' },
      { to: '/account/achievement',     label: '업적' },
      { to: '/account/stamp',           label: '도장깨기' },
      { to: '/account/worldcup',        label: '영화 월드컵' },
    ],
  },
  {
    title: '결제·리워드',
    items: [
      { to: '/account/point',   label: '포인트' },
      { to: '/account/payment', label: '결제·구독' },
    ],
  },
];

export default function AccountLayout() {
  return (
    <S.Wrapper>
      {/* ── 좌측(모바일은 상단) 내비게이션 ── */}
      <S.SideNav aria-label="계정 메뉴">
        {NAV_GROUPS.map((group) => (
          <S.Group key={group.title}>
            <S.GroupTitle>{group.title}</S.GroupTitle>
            {group.items.map((item) => (
              /*
               * NavLink 는 현재 경로와 비교해 활성 상태를 자동으로 부여한다.
               * styled-components 의 transient prop($) 을 쓰기 위해 render prop 형태로
               * isActive 값을 받아 전달.
               */
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={{ textDecoration: 'none' }}
              >
                {({ isActive }) => (
                  <S.NavItem $active={isActive}>{item.label}</S.NavItem>
                )}
              </NavLink>
            ))}
          </S.Group>
        ))}
      </S.SideNav>

      {/* ── 우측(모바일은 아래) 본문: 하위 라우트 ── */}
      <S.Content>
        <Outlet />
      </S.Content>
    </S.Wrapper>
  );
}
