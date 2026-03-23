/**
 * 몽글픽 메인 애플리케이션 컴포넌트.
 *
 * BrowserRouter 기반 라우팅으로 랜딩 페이지와 채팅 페이지를 분리한다.
 * - / : 랜딩 페이지 (서비스 소개 + 팀 소개)
 * - /chat : AI 채팅 추천 (기존 ChatWindow)
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
/* 랜딩 페이지 — features/landing에서 가져옴 */
import LandingPage from '../features/landing/pages/LandingPage';
/* 채팅 윈도우 컴포넌트 — features/chat에서 가져옴 */
import ChatWindow from '../features/chat/components/ChatWindow';
/* App 전용 레이아웃 스타일 */
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 랜딩 페이지 — 서비스/팀 소개 */}
        <Route path="/" element={<LandingPage />} />
        {/* AI 채팅 추천 — 기존 전체 화면 채팅 UI */}
        <Route path="/chat" element={<div className="app"><ChatWindow /></div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
