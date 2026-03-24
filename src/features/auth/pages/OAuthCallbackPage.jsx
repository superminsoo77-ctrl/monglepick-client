/**
 * OAuth 콜백 페이지 컴포넌트.
 *
 * OAuth 제공자(Google/카카오/네이버)에서 인가 코드를 받아
 * 백엔드에 전달하고, 로그인 처리 후 홈으로 리다이렉트한다.
 */

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
/* 인증 Context 훅 — app/providers에서 가져옴 */
import { useAuth } from '../../../app/providers/AuthProvider';
/* OAuth 로그인 API — 같은 feature 내의 authApi에서 가져옴 */
import { oauthLogin } from '../api/authApi';
/* OAuth 리다이렉트 URI 생성 유틸 — shared/constants에서 가져옴 */
import { getOAuthRedirectUri } from '../../../shared/constants/oauth';
/* 라우트 경로 상수 — shared/constants에서 가져옴 */
import { ROUTES } from '../../../shared/constants/routes';
import './OAuthCallbackPage.css';

export default function OAuthCallbackPage() {
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  /* 에러 메시지 상태 */
  const [error, setError] = useState('');
  /* OAuth 처리 진행 중 상태 */
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    /**
     * OAuth 인가 코드를 백엔드에 전달하여 로그인을 처리한다.
     * 1. URL 파라미터에서 code와 state를 추출
     * 2. sessionStorage의 state와 비교하여 CSRF 검증
     * 3. 백엔드 OAuth 로그인 API 호출
     * 4. AuthContext에 인증 정보 저장
     * 5. 홈으로 리다이렉트
     */
    const processOAuth = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const savedState = sessionStorage.getItem('oauth_state');

        // state 검증 (CSRF 방지)
        if (!state || state !== savedState) {
          throw new Error('잘못된 인증 요청입니다. 다시 시도해주세요.');
        }

        // 사용 완료된 state 삭제
        sessionStorage.removeItem('oauth_state');

        if (!code) {
          throw new Error('인가 코드가 없습니다. 다시 시도해주세요.');
        }

        // 백엔드에 인가 코드 전달
        const redirectUri = getOAuthRedirectUri(provider);
        const response = await oauthLogin({ provider, code, redirectUri });

        // AuthContext에 인증 정보 저장
        login({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          user: response.user,
        });

        // 홈으로 리다이렉트
        navigate(ROUTES.HOME, { replace: true });
      } catch (err) {
        setError(err.message || '소셜 로그인에 실패했습니다.');
        setIsProcessing(false);
      }
    };

    processOAuth();
  }, [provider, searchParams, login, navigate]);

  // 처리 중이고 에러가 없으면 로딩 스피너 표시
  if (isProcessing && !error) {
    return (
      <div className="oauth-callback">
        <div className="oauth-callback__spinner" />
        <p className="oauth-callback__message">로그인 처리 중...</p>
      </div>
    );
  }

  // 에러 발생 시 에러 메시지와 로그인 페이지 링크 표시
  return (
    <div className="oauth-callback">
      <div className="oauth-callback__error">
        <h2>로그인 실패</h2>
        <p>{error}</p>
        <Link to={ROUTES.LOGIN} className="oauth-callback__link">
          로그인 페이지로 돌아가기
        </Link>
      </div>
    </div>
  );
}
