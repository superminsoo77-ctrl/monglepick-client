/**
 * 채팅 페이지 컴포넌트.
 *
 * 기존 ChatWindow 컴포넌트를 래핑하여 페이지 레벨에서 렌더링한다.
 * ChatWindow가 전체 채팅 UI(헤더, 메시지, 입력)를 포함하므로,
 * 이 페이지는 전체 높이를 차지하는 컨테이너 역할만 한다.
 *
 * HomePage에서 추천 질문을 클릭했을 때 state로 전달된 initialQuery를
 * 사용할 수 있도록 location.state를 확인한다.
 */

import { useLocation } from 'react-router-dom';
/* 채팅 윈도우 — 같은 feature 내의 components에서 가져옴 */
import ChatWindow from '../components/ChatWindow';
import './ChatPage.css';

export default function ChatPage() {
  // HomePage에서 전달된 초기 질문 확인
  const location = useLocation();
  const initialQuery = location.state?.initialQuery || '';

  return (
    <div className="chat-page">
      {/* 기존 ChatWindow 컴포넌트 — 전체 채팅 UI 포함 */}
      <ChatWindow initialQuery={initialQuery} />
    </div>
  );
}
