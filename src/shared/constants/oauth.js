/**
 * OAuth 소셜 로그인 설정 모듈.
 *
 * 각 OAuth 제공자(Google, 카카오, 네이버)의 클라이언트 설정과
 * 인가 URL 생성 유틸리티를 제공한다.
 */

/**
 * OAuth 제공자별 설정.
 * 클라이언트 ID는 환경변수(VITE_*_CLIENT_ID)로 주입한다.
 */
export const OAUTH_CONFIG = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'openid email profile',
  },
  kakao: {
    clientId: import.meta.env.VITE_KAKAO_CLIENT_ID || '',
    authorizeUrl: 'https://kauth.kakao.com/oauth/authorize',
    scope: 'profile_nickname profile_image account_email',
  },
  naver: {
    clientId: import.meta.env.VITE_NAVER_CLIENT_ID || '',
    authorizeUrl: 'https://nid.naver.com/oauth2.0/authorize',
    scope: '',
  },
};

/**
 * OAuth 콜백 리다이렉트 URI를 생성한다.
 * @param {string} provider - 제공자 이름 (google, kakao, naver)
 * @returns {string} 콜백 URI (예: http://localhost:5173/auth/callback/google)
 */
export function getOAuthRedirectUri(provider) {
  return `${window.location.origin}/auth/callback/${provider}`;
}

/**
 * OAuth 인가 요청 URL을 생성한다.
 * CSRF 방지를 위해 state 파라미터를 생성하고 sessionStorage에 저장한다.
 *
 * @param {string} provider - 제공자 이름 (google, kakao, naver)
 * @returns {string} 완전한 인가 URL
 */
export function buildOAuthUrl(provider) {
  const config = OAUTH_CONFIG[provider];
  if (!config) throw new Error(`지원하지 않는 OAuth 제공자: ${provider}`);

  const redirectUri = getOAuthRedirectUri(provider);
  const state = crypto.randomUUID();

  // CSRF 방지용 state를 sessionStorage에 저장
  sessionStorage.setItem('oauth_state', state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: redirectUri,
    state,
  });

  // scope가 있는 경우에만 추가
  if (config.scope) {
    params.set('scope', config.scope);
  }

  return `${config.authorizeUrl}?${params.toString()}`;
}
