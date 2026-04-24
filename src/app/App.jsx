/**
 * 몽글픽 메인 애플리케이션 컴포넌트.
 *
 * React Router v7 의 중첩 라우트 + `<Outlet />` 패턴으로 레이아웃을 공유한다.
 * Zustand useAuthStore 로 인증 상태를 전역에서 공유하며,
 * PrivateRoute 는 Layer 3 최상위에 한 번만 적용해 하위 계정 라우트 전체를 가드한다.
 *
 * 라우트 계층 (2026-04-23 PR-4 재편 — Account Hub 통합):
 *   Layer 0 — 레이아웃 없음 (랜딩/인증/OAuth)
 *   Layer 1 — <MainLayout />                      Header(default) + Footer
 *   Layer 2 — <MainLayout variant="compact" />   슬림 Header, Footer 없음 (채팅)
 *   Layer 3 — Layer 1 아래 /account/* 중첩       PrivateRoute → AccountLayout → Outlet
 *   Layer 4 — 레거시 경로 리다이렉트              외부 링크·북마크 하위호환
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
/* Zustand 인증 스토어 */
import useAuthStore from '../shared/stores/useAuthStore';
/* 게스트 쿠키 발급 — 비로그인 평생 1회 무료 체험 식별자 (2026-04-22) */
import { initGuestToken } from '../shared/api/guestApi';
/* 메인 레이아웃 — Outlet 기반, variant 로 default/compact 분기 (PR-2) */
import MainLayout from '../shared/components/Layout/MainLayout';
/* 계정 허브 레이아웃 — Outlet + 사이드바 (PR-1 에서 스켈레톤 배치, PR-4 에서 활성화) */
import AccountLayout from '../shared/components/Layout/AccountLayout';
/* 동적 파라미터 유지 리다이렉트 — PR-4 레거시 경로 대응 (PR-1 에서 선제 배치) */
import RedirectWithParams from '../shared/components/RedirectWithParams';
/* 전역 플로팅 챗봇 위젯 */
import SupportChatbotWidget from '../shared/components/SupportChatbotWidget/SupportChatbotWidget';

/* ── Layer 0 페이지 ── */
import LandingPage from '../features/landing/pages/LandingPage';
import LoginPage from '../features/auth/pages/LoginPage';
import SignUpPage from '../features/auth/pages/SignUpPage';
import OAuthCallbackPage from '../features/auth/pages/OAuthCallbackPage';
import OAuthCookiePage from '../features/auth/pages/OAuthCookiePage';

/* ── Layer 2 페이지 ── */
import ChatWindow from '../features/chat/components/ChatWindow';
/* 회원가입 직후 시작 미션 온보딩 페이지 */
import OnboardingPage from '../features/onboarding/pages/OnboardingPage';

/* ── Layer 1 공용 페이지 ── */
import HomePage from '../features/home/pages/HomePage';
import SearchPage from '../features/search/pages/SearchPage';
import MovieDetailPage from '../features/movie/pages/MovieDetailPage';
import CommunityPage from '../features/community/pages/CommunityPage';
import PostDetailPage from '../features/community/pages/PostDetailPage';
import SharedPlaylistDetailPage from '../features/community/pages/SharedPlaylistDetailPage';
import MatchPage from '../features/match/pages/MatchPage';
import SupportPage from '../features/support/pages/SupportPage';
import PaymentFailPage from '../features/payment/pages/PaymentFailPage';

/* ── 법적 정책 페이지 (2026-04-23 Footer 후속) ── */
import TermsPage from '../features/legal/pages/TermsPage';
import PrivacyPage from '../features/legal/pages/PrivacyPage';
import OperationPolicyPage from '../features/legal/pages/OperationPolicyPage';
import RefundPolicyPage from '../features/legal/pages/RefundPolicyPage';

/* ── Layer 3 계정 페이지 ── */
import MyPage from '../features/user/pages/MyPage';
import PointPage from '../features/point/pages/PointPage';
import PaymentPage from '../features/payment/pages/PaymentPage';
import PaymentSuccessPage from '../features/payment/pages/PaymentSuccessPage';
import RecommendationPage from '../features/recommendation/pages/RecommendationPage';
import PlaylistPage from '../features/playlist/pages/PlaylistPage';
import AchievementPage from '../features/achievement/pages/AchievementPage';
import AchievementDetailPage from '../features/achievement/pages/AchievementDetailPage';
import WorldcupPage from '../features/worldcup/pages/WorldcupPage';
import RoadmapPage from '../features/roadmap/pages/RoadmapPage';
import StampReviewPage from '../features/roadmap/pages/StampReviewPage';

import NotFoundPage from '../features/error/pages/NotFoundPage';
import Loading from '../shared/components/Loading/Loading';

/**
 * 인증이 필요한 라우트를 보호하는 래퍼 컴포넌트.
 *
 * 비인증 사용자는 /login 으로 replace 리다이렉트되며, 이때 현재 경로를
 * `state.returnTo` 에 실어 로그인 성공 후 원래 가려던 페이지로 돌아갈 수 있게 한다.
 *
 * 2026-04-23 PR-5 확장:
 *   기존엔 단순히 `<Navigate to="/login" replace />` 만 하여 로그인 후 항상 홈으로
 *   떨어졌다. 예컨대 `/account/point` 에 접근하던 사용자가 로그인 세션이 만료된 경우,
 *   로그인 후 홈으로 튕기면 "포인트 충전하려다 이탈" 같은 UX 손실이 발생했다.
 *   이제 LoginPage/OAuthCookiePage 등은 `useReturnTo()` 훅으로 이 state 를 소비해
 *   정확히 원래 페이지로 복귀한다.
 */
function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const isLoading = useAuthStore((s) => s.isLoading);
  const location = useLocation();

  /* 초기 로딩 중에는 Loading 컴포넌트를 표시 (localStorage 복원 대기) */
  if (isLoading) return <Loading message="인증 확인 중..." />;

  if (!isAuthenticated) {
    /*
     * state.returnTo 에는 pathname + search 만 담는다 (hash 는 브라우저가 자체 보존).
     * 예: '/account/point?tab=history' 처럼 쿼리 문자열까지 기억해야
     * 복귀 시 탭 상태가 유지된다.
     *
     * useReturnTo 의 sanitizeReturnTo 가 `/` 시작 내부 path 만 허용하므로,
     * 악의적 returnTo 주입은 자동 차단된다 (open redirect 방어).
     */
    return (
      <Navigate
        to="/login"
        replace
        state={{ returnTo: location.pathname + location.search }}
      />
    );
  }

  return children;
}

function App() {
  /*
   * 앱 최초 마운트 시 게스트 쿠키(mongle_guest) 발급/재확인.
   * 서버가 멱등 처리하므로 로그인/비로그인 상관없이 1회 호출한다.
   */
  useEffect(() => {
    initGuestToken();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* ══════════════════════════════════════════════════════════════
            Layer 0 — 레이아웃 없음
            ══════════════════════════════════════════════════════════════ */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        {/* 회원가입 직후 시작 미션 온보딩 페이지 */}
        <Route
          path="/onboarding"
          element={
            <PrivateRoute>
              <MainLayout>
                <OnboardingPage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* OAuth 콜백 페이지 — 구 방식: 인가 코드 직접 처리 (fallback) */}
        <Route path="/auth/callback/:provider" element={<OAuthCallbackPage />} />
        <Route path="/cookie" element={<OAuthCookiePage />} />

        {/* ══════════════════════════════════════════════════════════════
            Layer 1 — 공용 영역 (MainLayout default)

            Layer 3(/account/*) 은 이 Layer 의 자식으로 중첩되어 MainLayout
            을 상속받는다 (Header + Footer 공용). AccountLayout 은 /account
            진입 시에만 추가 사이드바를 덧그리는 2중 Outlet 구조.
            ══════════════════════════════════════════════════════════════ */}
        <Route element={<MainLayout />}>
          {/* 비로그인 허용 */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/movie/:id" element={<MovieDetailPage />} />
          {/* /movies/:id — 기존 북마크 호환 레거시 alias */}
          <Route path="/movies/:id" element={<MovieDetailPage />} />
          <Route path="/match" element={<MatchPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/community/:id" element={<PostDetailPage />} />
          <Route path="/community/playlist/:playlistId" element={<SharedPlaylistDetailPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/payment/fail" element={<PaymentFailPage />} />

          {/*
            ── 법적 정책 페이지 4종 (2026-04-23 Footer 후속) ──
            비로그인 접근 허용. LegalPageLayout 공용 컴포넌트를 사용해
            현재는 placeholder "준비 중" 상태로 노출된다. 실제 약관 문구 확정 시
            각 페이지 컴포넌트의 sections prop 만 채우면 본문이 자동 렌더된다.
          */}
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/operation-policy" element={<OperationPolicyPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />

          {/* ════════════════════════════════════════════════════════════
              Layer 3 — 계정 허브 /account/*

              PrivateRoute 로 한 번만 가드, 하위 전 라우트가 자동 보호됨.
              AccountLayout 이 좌측 사이드바 + <Outlet /> 로 하위 페이지 렌더.
              index route 는 /account 직접 진입 시 /account/profile 로 redirect.
              ════════════════════════════════════════════════════════════ */}
          <Route
            path="/account"
            element={
              <PrivateRoute>
                <AccountLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile"                       element={<MyPage />} />
            <Route path="point"                         element={<PointPage />} />
            <Route path="payment"                       element={<PaymentPage />} />
            <Route path="payment/success"               element={<PaymentSuccessPage />} />
            <Route path="recommendations"               element={<RecommendationPage />} />
            <Route path="playlist"                      element={<PlaylistPage />} />
            <Route path="playlist/:id"                  element={<PlaylistPage />} />
            <Route path="achievement"                   element={<AchievementPage />} />
            <Route path="achievement/:id"               element={<AchievementDetailPage />} />
            <Route path="stamp"                         element={<RoadmapPage />} />
            <Route path="stamp/:id"                     element={<RoadmapPage />} />
            <Route path="stamp/:courseId/review/:movieId" element={<StampReviewPage />} />
            <Route path="worldcup"                      element={<WorldcupPage />} />
            <Route path="roadmap"                       element={<RoadmapPage />} />
            <Route path="roadmap/:id"                   element={<RoadmapPage />} />
          </Route>

          {/* ════════════════════════════════════════════════════════════
              Layer 4 — 레거시 경로 하위호환 리다이렉트

              외부 링크/북마크/Toss successUrl 구 설정이 가리키는 경로를
              /account/* 로 보낸다. RedirectWithParams 는 동적 :id 와 함께
              쿼리 문자열도 자동 보존 (예: ?paymentKey=...).
              ════════════════════════════════════════════════════════════ */}
          <Route path="/mypage"          element={<Navigate to="/account/profile" replace />} />
          <Route path="/point"           element={<Navigate to="/account/point" replace />} />
          <Route path="/payment"         element={<Navigate to="/account/payment" replace />} />
          <Route path="/payment/success" element={<RedirectWithParams to="/account/payment/success" />} />
          <Route path="/recommendations" element={<Navigate to="/account/recommendations" replace />} />
          <Route path="/playlist"        element={<Navigate to="/account/playlist" replace />} />
          <Route path="/playlist/:id"    element={<RedirectWithParams to="/account/playlist/:id" />} />
          <Route path="/achievement"     element={<Navigate to="/account/achievement" replace />} />
          <Route path="/achievement/:id" element={<RedirectWithParams to="/account/achievement/:id" />} />
          <Route path="/stamp"           element={<Navigate to="/account/stamp" replace />} />
          <Route path="/stamp/:id"       element={<RedirectWithParams to="/account/stamp/:id" />} />
          <Route
            path="/stamp/:courseId/review/:movieId"
            element={<RedirectWithParams to="/account/stamp/:courseId/review/:movieId" />}
          />
          <Route path="/worldcup"        element={<Navigate to="/account/worldcup" replace />} />
          <Route path="/roadmap"         element={<Navigate to="/account/roadmap" replace />} />
          <Route path="/roadmap/:id"     element={<RedirectWithParams to="/account/roadmap/:id" />} />
        </Route>

        {/* ══════════════════════════════════════════════════════════════
            Layer 2 — 채팅 (MainLayout default + hideFooter)

            2026-04-23 PR-2 의 슬림 헤더(compact) 로 편입 → 자체 헤더 중복 이슈
            → Layer 0 독립 복귀 (채팅 중 전역 네비 불가) → 최종 재편 (본 버전):
            풀 헤더를 그대로 얹고 Footer 만 숨긴다. ChatWindow 자체 헤더는
            로고/타이틀을 제거한 "슬림 도구바" 로 축소 — 햄버거(사이드바) + 뒤로가기 + 새 대화.
            결과: 상단 64px 전역 네비 + 44px 채팅 도구바 = 108px, 역할 명확 분리.
            ══════════════════════════════════════════════════════════════ */}
        <Route element={<MainLayout hideFooter />}>
          <Route path="/chat" element={<ChatWindow />} />
          <Route path="/chat/:sessionId" element={<ChatWindow />} />
        </Route>

        {/* ══════════════════════════════════════════════════════════════
            기타 리다이렉트 & 404
            ══════════════════════════════════════════════════════════════ */}
        {/* /quiz — CommunityPage "오늘의 퀴즈" 탭으로 이관 (2026-04-08) */}
        <Route path="/quiz" element={<Navigate to="/community?tab=quiz" replace />} />

        {/* 매칭되지 않는 모든 경로 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/*
        전역 플로팅 챗봇 위젯 — BrowserRouter 내부에 위치해 useLocation 동작을 보장.
        Routes 바깥이라 모든 라우트에서 동일 인스턴스(대화 상태 보존).
        AI 채팅(/chat), 고객센터(/support), 인증 페이지에서는 내부에서 자동 숨김.
      */}
      <SupportChatbotWidget />
    </BrowserRouter>
  );
}

export default App;
