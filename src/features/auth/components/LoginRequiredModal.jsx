/**
 * 게스트(비로그인) 평생 1회 무료 체험 소진 시 노출되는 로그인 유도 모달.
 *
 * SSE `error` 이벤트에서 `error_code === 'GUEST_QUOTA_EXCEEDED'` 를 수신했을 때
 * ChatWindow 가 이 모달을 띄운다. ESC/오버레이 클릭으로 닫을 수 있고, CTA 는
 * 로그인/회원가입 2개로 구성.
 *
 * @param {Object} props
 * @param {boolean} props.open - 모달 오픈 여부
 * @param {function} props.onClose - 닫기 콜백
 * @param {string} [props.reason] - 서버가 내려준 차단 사유 (GUEST_COOKIE_USED / GUEST_IP_USED 등)
 */

import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as S from './LoginRequiredModal.styled';

export default function LoginRequiredModal({ open, onClose, reason }) {
  const navigate = useNavigate();

  /** ESC 키로 닫기. */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && open) onClose?.();
    },
    [onClose, open],
  );

  useEffect(() => {
    if (!open) return undefined;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  /** 오버레이 클릭 시 닫기 (컨테이너 내부 클릭은 버블링 차단). */
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const handleLogin = () => {
    onClose?.();
    navigate('/login');
  };

  const handleSignup = () => {
    onClose?.();
    navigate('/signup');
  };

  return (
    <S.Overlay onClick={handleOverlayClick}>
      <S.Container>
        <S.CloseButton onClick={onClose} aria-label="닫기">
          &#x2715;
        </S.CloseButton>

        <S.IconWrap aria-hidden="true">🎬</S.IconWrap>

        <S.Title>무료 체험 1회를 모두 사용하셨어요</S.Title>
        <S.Description>
          몽글픽은 로그인하시면 등급별로 더 많은 영화 추천과 포인트 리워드를 드려요.
          <br />
          가입 즉시 무료 포인트 500P를 지급해드립니다.
        </S.Description>

        <S.ButtonGroup>
          <S.PrimaryButton onClick={handleLogin} type="button">
            로그인하기
          </S.PrimaryButton>
          <S.SecondaryButton onClick={handleSignup} type="button">
            회원가입
          </S.SecondaryButton>
        </S.ButtonGroup>

        {reason && import.meta.env.DEV && (
          <S.DebugHint>debug: {reason}</S.DebugHint>
        )}
      </S.Container>
    </S.Overlay>
  );
}
