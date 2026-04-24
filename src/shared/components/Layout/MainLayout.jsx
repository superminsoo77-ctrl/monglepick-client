/**
 * 메인 레이아웃 래퍼 컴포넌트.
 *
 * Header + 메인 컨텐츠 영역 + Footer 의 3단 구조를 구성한다.
 * React Router v7 의 `<Outlet />` 기반으로 작성되어 App.jsx 의 중첩 라우트에서
 * 한 번만 렌더되면 모든 하위 라우트가 동일 레이아웃을 공유한다.
 *
 * 사용 패턴 (App.jsx):
 *   <Route element={<MainLayout />}>
 *     <Route path="/home"   element={<HomePage />} />
 *     <Route path="/search" element={<SearchPage />} />
 *     // ...
 *   </Route>
 *
 *   <Route element={<MainLayout hideFooter />}>
 *     <Route path="/chat"            element={<ChatWindow />} />
 *     <Route path="/chat/:sessionId" element={<ChatWindow />} />
 *   </Route>
 *
 * variant / hideFooter 옵션:
 *   - 'default' (기본): 풀 헤더 + Footer. 모든 유저 페이지에 사용.
 *   - 'compact':         슬림 헤더(상단 NAV 숨김) + Footer 제거. 현재 미사용이지만 추후 필요 시 재활용 여지.
 *   - `hideFooter`:       variant='default' 풀 헤더를 유지하되 Footer 만 숨김. 채팅 등 전체화면 집중 페이지.
 *
 * @param {Object} props
 * @param {'default' | 'compact'} [props.variant='default']
 * @param {boolean} [props.hideFooter=false]  풀 헤더 유지한 채 Footer 만 제거
 */

import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import { LayoutWrapper, MainContent } from './MainLayout.styled';

export default function MainLayout({ variant = 'default', hideFooter = false }) {
  /*
   * Footer 렌더 조건:
   *   - 명시적 hideFooter=true 면 숨김 (채팅 등 전체화면 페이지)
   *   - variant='compact' 면 기본적으로 숨김 (슬림 헤더 페이지는 Footer 도 어울리지 않음)
   *   - 그 외 (variant='default') 는 노출
   */
  const showFooter = !hideFooter && variant === 'default';

  return (
    <LayoutWrapper>
      <Header variant={variant} />

      {/* 메인 컨텐츠 영역 — 하위 라우트의 element 가 Outlet 자리에 렌더됨 */}
      <MainContent>
        <Outlet />
      </MainContent>

      {showFooter && <Footer />}
    </LayoutWrapper>
  );
}
