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
/* 전역 플로팅 챗봇 위젯 — 우측 하단 고정 FAB/패널 (AI 채팅/고객센터/인증 페이지는 자동 숨김) */
import SupportChatbotWidget from '../shared/components/SupportChatbotWidget/SupportChatbotWidget';

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
/* 커뮤니티 게시글 상세 페이지 — 댓글 섹션 포함 */
import PostDetailPage from '../features/community/pages/PostDetailPage';
/* 마이페이지 — features/user에서 가져옴 */
import MyPage from '../features/user/pages/MyPage';
/* 포인트 관리 페이지 — features/point에서 가져옴 */
import PointPage from '../features/point/pages/PointPage';
/* 결제/구독 페이지 — features/payment에서 가져옴 */
import PaymentPage from '../features/payment/pages/PaymentPage';
/* 결제 성공 콜백 페이지 — Toss Payments v2 successUrl 리다이렉트 대상 */
import PaymentSuccessPage from '../features/payment/pages/PaymentSuccessPage';
/* 결제 실패 콜백 페이지 — Toss Payments v2 failUrl 리다이렉트 대상 */
import PaymentFailPage from '../features/payment/pages/PaymentFailPage';
/* 고객센터 페이지 — features/support에서 가져옴 */
import SupportPage from '../features/support/pages/SupportPage';
/* 둘이 영화 고르기 페이지 — features/match에서 가져옴 (비로그인 가능) */
import MatchPage from '../features/match/pages/MatchPage';
/* 추천 내역 페이지 — features/recommendation에서 가져옴 */
import RecommendationPage from '../features/recommendation/pages/RecommendationPage';
/* 플레이리스트 페이지 — features/playlist에서 가져옴 */
import PlaylistPage from '../features/playlist/pages/PlaylistPage';
import SharedPlaylistDetailPage from '../features/community/pages/SharedPlaylistDetailPage';
/* 업적 페이지 — features/achievement에서 가져옴 */
import AchievementPage from '../features/achievement/pages/AchievementPage';
/*
 * 영화 퀴즈 페이지 — v2 개편(2026-04-08)으로 CommunityPage 의 "오늘의 퀴즈" 탭으로 이관됨.
 * /quiz 진입은 /community?tab=quiz 로 redirect 처리하므로 App.jsx 에서는 import 불필요.
 * QuizPage 컴포넌트 자체는 features/quiz/pages/QuizPage.jsx 에 그대로 존재하며,
 * CommunityPage 가 직접 import 하여 탭 본문으로 사용한다.
 */
/* 영화 월드컵 페이지 — features/worldcup에서 가져옴 */
import WorldcupPage from '../features/worldcup/pages/WorldcupPage';
/* 영화 로드맵 페이지 — features/roadmap에서 가져옴 */
import RoadmapPage from '../features/roadmap/pages/RoadmapPage';
/* 404 에러 페이지 — features/error에서 가져옴 */
import NotFoundPage from '../features/error/pages/NotFoundPage';

/* 로딩 스피너 — shared/components에서 가져옴 (PrivateRoute 로딩 중 표시용) */
import Loading from '../shared/components/Loading/Loading';
/* App.css 삭제됨 — #root/.app 레이아웃은 GlobalStyle.js에서 관리 */

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

        {/* AI 채팅 추천 — 전체 화면 채팅 UI (레이아웃 없음) */}
        <Route path="/chat" element={<div className="app"><ChatWindow /></div>} />
        {/* AI 채팅 추천 — 이전 세션 이어하기 (URL에 sessionId 포함) */}
        <Route path="/chat/:sessionId" element={<div className="app"><ChatWindow /></div>} />

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

        {/*
          커뮤니티 게시글 상세 (비로그인 허용).
          PostList에서 {@code /community/:id} Link로 진입하며,
          댓글 섹션이 CommentSection 내부에서 독립적으로 렌더링된다.
        */}
        <Route
          path="/community/:id"
          element={
            <MainLayout>
              <PostDetailPage />
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

        {/*
          결제 성공 콜백 (인증 필수).
          Toss Payments v2 successUrl로 지정되며,
          쿼리파라미터(paymentKey/orderId/amount)를 추출해
          Backend POST /api/v1/payment/confirm 호출로 승인을 완료한다.
          승인 API가 JWT를 요구하므로 PrivateRoute로 보호한다.
        */}
        <Route
          path="/payment/success"
          element={
            <PrivateRoute>
              <MainLayout>
                <PaymentSuccessPage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/*
          결제 실패 콜백 (레이아웃 O, 인증 없음).
          Toss Payments v2 failUrl로 지정되며,
          쿼리파라미터(code/message/orderId)로 사용자 친화 메시지를 표시만 한다.
          서버 호출이 없으므로 로그인 없이도 표시 가능하도록 PrivateRoute를 제외한다.
        */}
        <Route
          path="/payment/fail"
          element={
            <MainLayout>
              <PaymentFailPage />
            </MainLayout>
          }
        />

        {/* 고객센터 — FAQ/도움말/AI챗봇/문의하기/문의내역 */}
        <Route
          path="/support"
          element={
            <MainLayout>
              <SupportPage />
            </MainLayout>
          }
        />

        {/* 추천 내역 — AI 추천 이력 조회, 찜/봤어요/피드백 (인증 필수) */}
        <Route
          path="/recommendations"
          element={
            <PrivateRoute>
              <MainLayout>
                <RecommendationPage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* 플레이리스트 목록 (인증 필수) */}
        <Route
          path="/playlist"
          element={
            <PrivateRoute>
              <MainLayout>
                <PlaylistPage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* 플레이리스트 상세 (인증 필수) */}
        <Route
          path="/playlist/:id"
          element={
            <PrivateRoute>
              <MainLayout>
                <PlaylistPage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* 커뮤니티 공유 플레이리스트 상세 (읽기 전용, 비로그인 허용) */}
        <Route
          path="/community/playlist/:playlistId"
          element={
            <MainLayout>
              <SharedPlaylistDetailPage />
            </MainLayout>
          }
        />

        {/* 업적 (인증 필수) */}
        <Route
          path="/achievement"
          element={
            <PrivateRoute>
              <MainLayout>
                <AchievementPage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* 도장깨기 목록 (인증 필수) */}
        <Route
          path="/stamp"
          element={
            <PrivateRoute>
              <MainLayout>
                <RoadmapPage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* 도장깨기 코스 상세 (인증 필수) */}
        <Route
          path="/stamp/:id"
          element={
            <PrivateRoute>
              <MainLayout>
                <RoadmapPage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/*
          영화 퀴즈 페이지 — v2 개편 (2026-04-08).

          기존 독립 페이지(`/quiz`)에서 CommunityPage 의 "오늘의 퀴즈" 탭으로 이관됨.
          외부 링크/즐겨찾기/북마크 호환을 위해 `/quiz` 경로는 그대로 두되,
          접근 시 `/community?tab=quiz` 로 영구 리다이렉트(replace) 한다.

          replace=true 이유: 뒤로가기 시 `/quiz` 로 다시 돌아가지 않도록 히스토리 스택을 교체.
        */}
        <Route
          path="/quiz"
          element={<Navigate to="/community?tab=quiz" replace />}
        />

        {/* 영화 이상형 월드컵 (인증 필수) */}
        <Route
          path="/worldcup"
          element={
            <PrivateRoute>
              <MainLayout>
                <WorldcupPage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* 영화 로드맵 목록 (인증 필수) */}
        <Route
          path="/roadmap"
          element={
            <PrivateRoute>
              <MainLayout>
                <RoadmapPage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* 영화 로드맵 코스 상세 (인증 필수) */}
        <Route
          path="/roadmap/:id"
          element={
            <PrivateRoute>
              <MainLayout>
                <RoadmapPage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* 404 — 매칭되지 않는 모든 경로를 Not Found 페이지로 처리 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/*
        전역 플로팅 챗봇 위젯 — BrowserRouter 내부에 위치하여 useLocation 동작을 보장한다.
        Routes 바깥에 두어야 모든 라우트에서 동일한 위젯 인스턴스가 유지되며(대화 상태 보존),
        AI 채팅(/chat), 고객센터(/support), 인증 관련 페이지에서는 내부에서 자동 숨김 처리된다.
      */}
      <SupportChatbotWidget />
    </BrowserRouter>
  );
}

export default App;
