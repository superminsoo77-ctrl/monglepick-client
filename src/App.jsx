/**
 * 몽글픽 메인 애플리케이션 컴포넌트.
 *
 * ChatWindow를 전체 화면으로 렌더링한다.
 */

import ChatWindow from './components/Chat/ChatWindow';
import './App.css';

function App() {
  return (
    <div className="app">
      <ChatWindow />
    </div>
  );
}

export default App;
