import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 모든 네트워크 인터페이스에서 접근 허용 (LAN/외부 디바이스 테스트용)
    host: '0.0.0.0',
    proxy: {
      // Spring Boot 백엔드 API (인증, 포인트, 결제, 구독)
      // 더 구체적인 경로가 범용 /api 보다 먼저 선언되어야 함
      '/api/v1/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/v1/users': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/v1/point': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/v1/payment': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/v1/subscription': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/v1/mypage': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // AI Agent API (채팅, 검색 등 — 나머지 모든 /api 요청)
      '/api': {
        target: 'http://100.73.239.117:8000',
        changeOrigin: true,
      },
    },
  },
})
