/**
 * OAuth 콜백 페이지 컴포넌트.
 *
 * OAuth 제공자(Google/카카오/네이버)에서 인가 코드를 받아
 * 백엔드에 전달하고, 로그인 처리 후 홈으로 리다이렉트한다.
 *
 * @deprecated 구 방식 — Spring Security OAuth2 Client 전환 후
 *   OAuthCookiePage(/cookie)가 메인 흐름이므로, 추후 제거 예정.
 *   현재는 fallback 용도로 유지.
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
/* 인증 Context 훅 — app/providers에서 가져옴 */
import useAuthStore from '../../../shared/stores/useAuthStore';
/* OAuth 로그인 API — 같은 feature 내의 authApi에서 가져옴 */
import { oauthLogin } from '../api/authApi';
/* OAuth 리다이렉트 URI 생성 유틸 — shared/constants에서 가져옴 */
import { getOAuthRedirectUri } from '../../../shared/constants/oauth';
/* 라우트 경로 상수 — shared/constants에서 가져옴 */
import { ROUTES } from '../../../shared/constants/routes';
/* styled-components — OAuthCallbackPage 전용 스타일 */
import * as S from './OAuthCallbackPage.styled';

export default function OAuthCallbackPage() {
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  /* 에러 메시지 상태 */
  const [error, setError] = useState('');
  /* OAuth 처리 진행 중 상태 */
  const [isProcessing, setIsProcessing] = useState(true);
  /* useEffect 중복 실행 방지 guard (StrictMode/searchParams 참조 불안정 대응) */
  const hasProcessed = useRef(false);

  useEffect(() => {
    // 이미 처리 중이면 중복 실행 방지
    if (hasProcessed.current) return;
    hasProcessed.current = true;

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
        // provider 유효성 검증 (임의 URL 접근 방지)
        const validProviders = ['google', 'kakao', 'naver'];
        if (!validProviders.includes(provider)) {
          throw new Error(`지원하지 않는 소셜 로그인 제공자입니다: ${provider}`);
        }

        const code = searchParams.get('code');
        const state = searchParams.get('state');

        // provider별 state 키로 조회 (oauth.js의 buildOAuthUrl과 동일한 키)
        const stateKey = `oauth_state_${provider}`;
        const savedState = sessionStorage.getItem(stateKey);

        // [C-C1] CSRF 검증을 먼저 수행한 후 state를 삭제한다.
        // 이전 코드는 삭제를 먼저 실행하여 검증 실패 시에도 state가 지워지는 문제가 있었다.
        // 검증을 먼저 통과해야만 sessionStorage에서 state를 제거한다.
        if (!state || state !== savedState) {
          // 검증 실패 시에도 구식 state 잔류를 방지하기 위해 삭제
          sessionStorage.removeItem(stateKey);
          throw new Error('잘못된 인증 요청입니다. 다시 시도해주세요.');
        }

        // 검증 성공 후 사용된 state 삭제 (재사용 방지)
        sessionStorage.removeItem(stateKey);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 마운트 시 1회만 실행 (hasProcessed guard와 함께 중복 방지)

  // 처리 중이고 에러가 없으면 로딩 스피너 표시
  if (isProcessing && !error) {
    return (
      <S.OAuthCallbackWrapper>
        <S.Spinner />
        <S.Message>로그인 처리 중...</S.Message>
      </S.OAuthCallbackWrapper>
    );
  }

  // 에러 발생 시 에러 메시지와 로그인 페이지 링크 표시
  return (
    <S.OAuthCallbackWrapper>
      <S.ErrorContainer>
        <S.ErrorTitle>로그인 실패</S.ErrorTitle>
        <S.ErrorDescription>{error}</S.ErrorDescription>
        <S.BackLink to={ROUTES.LOGIN}>
          로그인 페이지로 돌아가기
        </S.BackLink>
      </S.ErrorContainer>
    </S.OAuthCallbackWrapper>
  );
}
