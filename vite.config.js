import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // .env 파일에서 환경변수 로드 (VITE_ 접두사 포함)
  const env = loadEnv(mode, process.cwd(), '')

  // 프록시 대상 URL — .env에서 가져오되, 기본값 제공
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:8080'
  const agentUrl = env.VITE_AGENT_URL || 'http://localhost:8000'

  // server와 preview에서 공유할 프록시 설정
  const proxyConfig = {
        // Spring Boot 백엔드 API (인증, 포인트, 결제, 구독)
        // 더 구체적인 경로가 범용 /api 보다 먼저 선언되어야 함
        // Spring Security OAuth2 인가 엔드포인트 (소셜 로그인 시작)
        '/oauth2': {
          target: backendUrl,
          changeOrigin: true,
        },
        // Spring Security OAuth2 콜백 엔드포인트 (제공자 → 백엔드)
        '/login/oauth2': {
          target: backendUrl,
          changeOrigin: true,
        },
        // JWT 토큰 교환/갱신 엔드포인트 (쿠키→헤더 교환, Refresh Rotation)
        '/jwt': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/api/v1/auth': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/api/v1/users': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/api/v1/point': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/api/v1/payment': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/api/v1/subscription': {
          target: backendUrl,
          changeOrigin: true,
        },
        // /api/v1/mypage는 /api/v1/users/me로 통합됨 (UserController)
        // AI Agent API (채팅, 검색 등 — 나머지 모든 /api 요청)
        '/api': {
          target: agentUrl,
          changeOrigin: true,
        },
  }

  return {
    plugins: [react()],
    server: {
      // 모든 네트워크 인터페이스에서 접근 허용 (LAN/외부 디바이스 테스트용)
      host: '0.0.0.0',
      proxy: proxyConfig,
    },
    preview: {
      proxy: proxyConfig,
    },
  }
})
