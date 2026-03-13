/**
 * 몽글픽 React 애플리케이션 진입점.
 * StrictMode로 감싸서 잠재적 문제를 감지하고,
 * App 컴포넌트를 #root DOM 노드에 마운트한다.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
