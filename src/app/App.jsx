/**
 * 몽글픽 메인 애플리케이션 컴포넌트.
 *
 * BrowserRouter 기반 라우팅으로 전체 페이지를 관리한다.
 * AuthProvider로 인증 상태를 전역에서 공유하며,
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
 *   - /community                : 커뮤니티 (게시판 + 리뷰)
 *   - /mypage                   : 마이페이지 (프로필/시청이력/위시리스트)
 *   - /point                    : 포인트 관리 (잔액/출석/아이템/이력)
 *   - /payment                  : 결제/구독 관리
 *   - /support                  : 고객센터 (FAQ/도움말/문의하기/문의내역)
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
/* 인증 상태 Provider — app/providers에서 가져옴 */
import { AuthProvider } from './providers/AuthProvider';
/* 메인 레이아웃 — shared/components에서 가져옴 (Header + Content + Footer) */
import MainLayout from '../shared/components/Layout/MainLayout';

/* ── 레이아웃 없는 페이지 (인증/랜딩/채팅) ── */
/* 랜딩 페이지 — features/landing에서 가져옴 */
import LandingPage from '../features/landing/pages/LandingPage';
/* 로그인 페이지 — features/auth에서 가져옴 */
import LoginPage from '../features/auth/pages/LoginPage';
/* 회원가입 페이지 — features/auth에서 가져옴 */
import SignUpPage from '../features/auth/pages/SignUpPage';
/* OAuth 콜백 페이지 — features/auth에서 가져옴 (소셜 로그인 인가 코드 처리) */
import OAuthCallbackPage from '../features/auth/pages/OAuthCallbackPage';
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

/* App 전용 레이아웃 스타일 */
import './App.css';

function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider — BrowserRouter 내부에서 인증 상태 제공 (useNavigate 사용 가능) */}
      <AuthProvider>
        <Routes>
          {/* ── 레이아웃 없는 페이지 ── */}

          {/* 랜딩 페이지 — 서비스/팀 소개 */}
          <Route path="/" element={<LandingPage />} />

          {/* 로그인 페이지 — 레이아웃 없이 단독 표시 */}
          <Route path="/login" element={<LoginPage />} />

          {/* 회원가입 페이지 — 레이아웃 없이 단독 표시 */}
          <Route path="/signup" element={<SignUpPage />} />

          {/* OAuth 콜백 페이지 — 소셜 로그인 인가 코드 처리 */}
          <Route path="/auth/callback/:provider" element={<OAuthCallbackPage />} />

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

          {/* 커뮤니티 — 게시판 + 리뷰 */}
          <Route
            path="/community"
            element={
              <MainLayout>
                <CommunityPage />
              </MainLayout>
            }
          />

          {/* 마이페이지 — 프로필/시청이력/위시리스트 */}
          <Route
            path="/mypage"
            element={
              <MainLayout>
                <MyPage />
              </MainLayout>
            }
          />

          {/* 포인트 관리 — 잔액/출석/아이템/이력 */}
          <Route
            path="/point"
            element={
              <MainLayout>
                <PointPage />
              </MainLayout>
            }
          />

          {/* 결제/구독 관리 */}
          <Route
            path="/payment"
            element={
              <MainLayout>
                <PaymentPage />
              </MainLayout>
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
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
