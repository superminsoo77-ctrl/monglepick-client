/**
 * 몽글픽 메인 애플리케이션 컴포넌트.
 *
 * BrowserRouter 기반 라우팅으로 전체 페이지를 관리한다.
 * Zustand useAuthStore로 인증 상태를 전역에서 공유하며,
 * MainLayout이 필요한 페이지는 Header/Footer를 포함하는 레이아웃으로 감싼다.
 *
 * 라우트 구성:
 *   - /                         : 랜딩 페이지 (서비스 소개 + 팀 소개)
 *   - /login                    : 로그인 페이지 (레이아웃 없음)
 *   - /signup                   : 회원가입 페이지 (레이아웃 없음)
 *   - /auth/callback/:provider  : OAuth 콜백 페이지 (소셜 로그인 처리)
 *   - /chat                     : AI 채팅 추천 (전체 화면, 레이아웃 없음)
 *   - /home                     : 홈 페이지 (인기/최신 영화 목록)
 *   - /search                   : 검색 결과 페이지
 *   - /movie/:id                : 영화 상세 페이지
 *   - /match                     : 둘이 영화 고르기 (두 영화 교집합 추천, 비로그인 가능)
 *   - /community                : 커뮤니티 (게시판 + 리뷰)
 *   - /mypage                   : 마이페이지 (프로필/시청이력/위시리스트)
 *   - /point                    : 포인트 관리 (잔액/출석/아이템/이력)
 *   - /payment                  : 결제/구독 관리
 *   - /support                  : 고객센터 (FAQ/도움말/문의하기/문의내역)
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
/* Zustand 인증 스토어 — shared/stores에서 가져옴 */
import useAuthStore from '../shared/stores/useAuthStore';
/* 메인 레이아웃 — shared/components에서 가져옴 (Header + Content + Footer) */
import MainLayout from '../shared/components/Layout/MainLayout';

/* ── 레이아웃 없는 페이지 (인증/랜딩/채팅) ── */
/* 랜딩 페이지 — features/landing에서 가져옴 */
import LandingPage from '../features/landing/pages/LandingPage';
/* 로그인 페이지 — features/auth에서 가져옴 */
import LoginPage from '../features/auth/pages/LoginPage';
/* 회원가입 페이지 — features/auth에서 가져옴 */
import SignUpPage from '../features/auth/pages/SignUpPage';
/* OAuth 콜백 페이지 — features/auth에서 가져옴 (구 방식: 인가 코드 처리, fallback) */
import OAuthCallbackPage from '../features/auth/pages/OAuthCallbackPage';
/* OAuth 쿠키 교환 페이지 — features/auth에서 가져옴 (Spring Security OAuth2 Client: 쿠키→JWT 교환) */
import OAuthCookiePage from '../features/auth/pages/OAuthCookiePage';
/* 채팅 윈도우 컴포넌트 — features/chat에서 가져옴 */
import ChatWindow from '../features/chat/components/ChatWindow';

/* ── MainLayout 포함 페이지 (Header/Footer 있음) ── */
/* 홈 페이지 — features/home에서 가져옴 */
import HomePage from '../features/home/pages/HomePage';
/* 검색 결과 페이지 — features/search에서 가져옴 */
import SearchPage from '../features/search/pages/SearchPage';
/* 영화 상세 페이지 — features/movie에서 가져옴 */
import MovieDetailPage from '../features/movie/pages/MovieDetailPage';
/* 커뮤니티 페이지 — features/community에서 가져옴 */
import CommunityPage from '../features/community/pages/CommunityPage';
/* 마이페이지 — features/user에서 가져옴 */
import MyPage from '../features/user/pages/MyPage';
/* 포인트 관리 페이지 — features/point에서 가져옴 */
import PointPage from '../features/point/pages/PointPage';
/* 결제/구독 페이지 — features/payment에서 가져옴 */
import PaymentPage from '../features/payment/pages/PaymentPage';
/* 고객센터 페이지 — features/support에서 가져옴 */
import SupportPage from '../features/support/pages/SupportPage';
/* 둘이 영화 고르기 페이지 — features/match에서 가져옴 (비로그인 가능) */
import MatchPage from '../features/match/pages/MatchPage';
/* 404 에러 페이지 — features/error에서 가져옴 */
import NotFoundPage from '../features/error/pages/NotFoundPage';

/* 로딩 스피너 — shared/components에서 가져옴 (PrivateRoute 로딩 중 표시용) */
import Loading from '../shared/components/Loading/Loading';
/* App 전용 레이아웃 스타일 */
import './App.css';

/**
 * 인증이 필요한 라우트를 보호하는 래퍼 컴포넌트.
 * 인증되지 않은 사용자는 로그인 페이지로 리다이렉트한다.
 */
function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const isLoading = useAuthStore((s) => s.isLoading);

  /* 초기 로딩 중에는 Loading 컴포넌트를 표시 (localStorage 복원 대기) */
  if (isLoading) return <Loading message="인증 확인 중..." />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      {/* Zustand 스토어는 Provider 래핑 불필요 — 어디서든 useAuthStore() 호출 가능 */}
      <Routes>
        {/* ── 레이아웃 없는 페이지 ── */}

        {/* 랜딩 페이지 — 서비스/팀 소개 */}
        <Route path="/" element={<LandingPage />} />

        {/* 로그인 페이지 — 레이아웃 없이 단독 표시 */}
        <Route path="/login" element={<LoginPage />} />

        {/* 회원가입 페이지 — 레이아웃 없이 단독 표시 */}
        <Route path="/signup" element={<SignUpPage />} />

        {/* OAuth 콜백 페이지 — 구 방식: 인가 코드 직접 처리 (fallback) */}
        <Route path="/auth/callback/:provider" element={<OAuthCallbackPage />} />

        {/* OAuth 쿠키 교환 페이지 — Spring Security OAuth2 Client 방식 (쿠키→JWT 교환) */}
        <Route path="/cookie" element={<OAuthCookiePage />} />

        {/* AI 채팅 추천 — 기존 전체 화면 채팅 UI (레이아웃 없음) */}
        <Route path="/chat" element={<div className="app"><ChatWindow /></div>} />

        {/* ── MainLayout(Header/Footer) 포함 페이지 ── */}

        {/* 홈 페이지 — 인기/최신 영화 목록 */}
        <Route
          path="/home"
          element={
            <MainLayout>
              <HomePage />
            </MainLayout>
          }
        />

        {/* 검색 결과 페이지 */}
        <Route
          path="/search"
          element={
            <MainLayout>
              <SearchPage />
            </MainLayout>
          }
        />

        {/* 영화 상세 페이지 — URL 파라미터에서 영화 ID 추출 */}
        <Route
          path="/movie/:id"
          element={
            <MainLayout>
              <MovieDetailPage />
            </MainLayout>
          }
        />

        {/* 둘이 영화 고르기 — 두 영화 교집합 추천 (비로그인 가능) */}
        <Route
          path="/match"
          element={
            <MainLayout>
              <MatchPage />
            </MainLayout>
          }
        />

        {/* 커뮤니티 — 게시판 + 리뷰 */}
        <Route
          path="/community"
          element={
            <MainLayout>
              <CommunityPage />
            </MainLayout>
          }
        />

        {/* 마이페이지 — 프로필/시청이력/위시리스트 (인증 필수) */}
        <Route
          path="/mypage"
          element={
            <PrivateRoute>
              <MainLayout>
                <MyPage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* 포인트 관리 — 잔액/출석/아이템/이력 (인증 필수) */}
        <Route
          path="/point"
          element={
            <PrivateRoute>
              <MainLayout>
                <PointPage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* 결제/구독 관리 (인증 필수) */}
        <Route
          path="/payment"
          element={
            <PrivateRoute>
              <MainLayout>
                <PaymentPage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* 고객센터 — FAQ/도움말/문의하기/문의내역 */}
        <Route
          path="/support"
          element={
            <MainLayout>
              <SupportPage />
            </MainLayout>
          }
        />

        {/* 404 — 매칭되지 않는 모든 경로를 Not Found 페이지로 처리 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
