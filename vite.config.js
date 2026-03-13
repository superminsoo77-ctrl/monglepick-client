import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 모든 네트워크 인터페이스에서 접근 허용 (LAN/외부 디바이스 테스트용)
    host: '0.0.0.0',
    // 백엔드 API 프록시 — 개발 시 상대경로(/api/v1/chat)로 호출 가능
    proxy: {
      '/api': {
        target: 'http://100.73.239.117:8000',
        changeOrigin: true,
      },
    },
  },
})
