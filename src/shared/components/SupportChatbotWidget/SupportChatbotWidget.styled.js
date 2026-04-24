/**
 * SupportChatbotWidget styled-components 정의.
 *
 * 우측 하단 고정 플로팅 챗봇 위젯의 레이아웃/애니메이션을 담당한다.
 * - FAB(Floating Action Button): 기본 상태 (원형 버튼)
 * - Panel: 확장 상태 (채팅 패널)
 * - 모바일(<=480px)에서는 패널이 화면 전체에 근접한 크기로 확장된다.
 */

import styled, { keyframes } from 'styled-components';

/* ══════════════════════════════════════════
   애니메이션
   ══════════════════════════════════════════ */

/** 패널 진입 애니메이션 — 우측 하단 기준 팝업 */
const slideUp = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

/** 메시지 페이드 인 */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/** 타이핑 점 애니메이션 */
const dotBounce = keyframes`
  0%, 80%, 100% { transform: scale(0); }
  40%           { transform: scale(1); }
`;

/**
 * FAB 어텐션 펄스 — 2026-04-15.
 * primary 컬러로 잔잔히 퍼지는 그림자 링을 만들어 사용자 주의를 끈다.
 * 너무 빠르거나 강하면 산만하므로 2.4s 무한 반복, opacity 만 변동.
 */
const fabPulse = keyframes`
  0%   { box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22), 0 0 0 0 rgba(99, 102, 241, 0.55); }
  70%  { box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22), 0 0 0 14px rgba(99, 102, 241, 0); }
  100% { box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22), 0 0 0 0 rgba(99, 102, 241, 0); }
`;

/* ══════════════════════════════════════════
   래퍼 — 고정 위치
   ══════════════════════════════════════════ */

/**
 * 위젯 루트 — 우측 하단 고정 컨테이너.
 * 다른 fixed 요소(Modal, Toast)와의 겹침을 피하기 위해 z-index를 적절히 조정.
 * 모달(9999)보다 낮고 일반 콘텐츠보다는 높게 설정.
 *
 * 2026-04-24 배치 조정:
 *   - 기존 right/bottom 24px 은 화면 모서리에 너무 바싹 붙어 사용자가
 *     "구석에 처박힌" 느낌을 받는다는 피드백.
 *   - right/bottom 48/80px 로 안쪽으로 이동해 FAB 가 콘텐츠 영역에 더
 *     자연스럽게 떠 있도록 조정. 모바일은 좁은 화면을 고려해 24/48 로 완만하게.
 */
export const Root = styled.div`
  position: fixed;
  /*
   * iOS 노치/홈 인디케이터 영역 회피.
   * env(safe-area-inset-*) 는 viewport-fit=cover (index.html) 가 있어야 동작.
   * iPhone X+ 에서 home indicator 영역(약 34px)에 FAB 가 가려지던 문제를 해결.
   *
   * 위쪽(=bottom ↑) 과 왼쪽(=right ↑) 으로 더 끌어당기기 위해 두 축 모두
   * 기존 24px 에서 증가시킨다. safe-area-inset 가산은 유지.
   *
   * 2026-04-24 재조정: 우측 여백을 48 → 80px 로 더 키워 FAB 를 왼쪽으로
   * 추가 이동. bottom 은 80px 유지 (이미 이전 턴에 위로 올렸음).
   */
  right: calc(80px + env(safe-area-inset-right, 0px));
  bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  z-index: 900;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;

  @media (max-width: 480px) {
    /* 모바일은 좁은 화면을 고려해 완만하게만 안쪽으로 이동 */
    right: calc(24px + env(safe-area-inset-right, 0px));
    bottom: calc(48px + env(safe-area-inset-bottom, 0px));
  }
`;

/* ══════════════════════════════════════════
   FAB (Floating Action Button)
   ══════════════════════════════════════════ */

/**
 * 플로팅 아이콘 버튼 — 닫힌 상태.
 *
 * 2026-04-15 가시성 강화:
 *   - 크기 60→64 (탭하기 좋은 사이즈, FAB 표준 56~64)
 *   - 단색 → primary 그라데이션(theme.gradients.primary) 으로 시인성 ↑
 *   - 흰색 ring(border) 추가 — 어두운/밝은 배경 모두에서 분리감 확보
 *   - 펄스 애니메이션(fabPulse) 으로 사용자 주의 환기 (호버 시 일시정지)
 *   - hover 시 살짝 확대(scale 1.05) + glow 강화
 *   - 폰트 26→28 — 말풍선 이모지 명료도 ↑
 */
export const Fab = styled.button`
  /* 2026-04-24: 크기 확대 64→72px (시인성 강화 + 탭 타겟 확대). 폰트 28→32px. */
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 3px solid #fff;
  background: ${({ theme }) => theme.gradients?.primary || theme.colors.primary};
  color: #fff;
  font-size: 32px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22), 0 0 0 0 rgba(99, 102, 241, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fabPulse} 2.4s ease-out infinite;
  transition: transform ${({ theme }) => theme.transitions.fast},
              box-shadow ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: translateY(-2px) scale(1.05);
    /* hover 중에는 펄스를 멈춰 산만함 제거하고 강한 glow 로 대체 */
    animation-play-state: paused;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28),
                0 0 0 6px rgba(99, 102, 241, 0.25);
  }
  &:active { transform: translateY(0) scale(1.02); }
  &:focus-visible {
    outline: none;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28),
                0 0 0 4px rgba(99, 102, 241, 0.55);
  }

  /* 사용자가 모션 감속을 선호하면 펄스 비활성 (접근성) */
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** FAB 뱃지 — 새 메시지 알림 점 (예: 최초 열기 전 상시 노출) */
export const FabBadge = styled.span`
  position: absolute;
  top: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.error || '#ef4444'};
  border: 2px solid ${({ theme }) => theme.colors.bg};
`;

/* ══════════════════════════════════════════
   패널 — 열린 상태
   ══════════════════════════════════════════ */

/** 확장된 챗봇 패널 */
export const Panel = styled.div`
  width: 360px;
  height: 520px;
  /* 100dvh — 모바일 address bar 동적 변화 대응 (vh 폴백) */
  max-height: calc(100vh - 48px);
  max-height: calc(100dvh - 48px);
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: ${slideUp} 0.22s ease-out;

  @media (max-width: 480px) {
    width: calc(100vw - 32px);
    /*
     * 모바일에서는 패널이 거의 전체 화면을 차지.
     * - 100dvh 로 address bar / 가상 키보드 변화에 대응 (vh 폴백 우선 선언)
     * - 헤더(64px) + FAB(64px) + 여백(약 32px) = 120px 만큼 빼고 사용
     * - safe-area-inset-bottom 만큼 추가로 빼서 홈 인디케이터 회피
     */
    height: calc(100vh - 120px - env(safe-area-inset-bottom, 0px));
    height: calc(100dvh - 120px - env(safe-area-inset-bottom, 0px));
  }
`;

/* ══════════════════════════════════════════
   헤더
   ══════════════════════════════════════════ */

export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  flex-shrink: 0;
`;

export const BotAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
`;

export const HeaderText = styled.div`
  flex: 1;
  min-width: 0;
`;

export const BotName = styled.div`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
`;

export const BotStatus = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  opacity: 0.85;
`;

/** 닫기 버튼 */
export const CloseBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;

  &:hover { background: rgba(255, 255, 255, 0.32); }
`;

/* ══════════════════════════════════════════
   메시지 영역
   ══════════════════════════════════════════ */

export const Messages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: ${({ theme }) => theme.colors.bg};
`;

/** 환영 메시지 */
export const WelcomeMsg = styled.div`
  text-align: center;
  padding: 18px 8px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const WelcomeIcon = styled.div`
  font-size: 32px;
  margin-bottom: 6px;
`;

export const WelcomeText = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: 1.5;
  margin: 0;
`;

export const SuggestionChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-top: 12px;
`;

export const SuggestionChip = styled.button`
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textXs};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

/** 메시지 행 (사용자=오른쪽, 봇=왼쪽) */
export const MsgRow = styled.div`
  display: flex;
  justify-content: ${({ $isUser }) => ($isUser ? 'flex-end' : 'flex-start')};
  animation: ${fadeIn} 0.2s ease;
`;

/** 메시지 버블 */
export const MsgBubble = styled.div`
  max-width: 80%;
  padding: 9px 12px;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;

  ${({ $isUser, theme }) =>
    $isUser
      ? `
        background: ${theme.colors.primary};
        color: #fff;
        border-bottom-right-radius: ${theme.radius.sm};
      `
      : `
        background: ${theme.colors.bgElevated};
        color: ${theme.colors.textPrimary};
        border: 1px solid ${theme.colors.borderDefault};
        border-bottom-left-radius: ${theme.radius.sm};
      `}
`;

/** 타이핑 인디케이터 */
export const TypingIndicator = styled.div`
  display: flex;
  gap: 4px;
  padding: 10px 12px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  border-bottom-left-radius: ${({ theme }) => theme.radius.sm};
  width: fit-content;
`;

export const TypingDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.textMuted};
  animation: ${dotBounce} 1.4s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay || '0s'};
`;

/** 매칭 FAQ 카드 목록 */
export const FaqMatches = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
`;

/** 매칭 FAQ 카드 */
export const FaqMatchCard = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  padding: 7px 10px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ theme }) => theme.colors.bgSecondary};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textXs};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  line-height: 1.4;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primary}0c;
  }
`;

/** 상담원 이관 배너 */
export const HumanAgentBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.warning}15;
  border: 1px solid ${({ theme }) => theme.colors.warning}40;
  margin-top: 6px;
  animation: ${fadeIn} 0.3s ease;
`;

export const HumanAgentText = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const HumanAgentBtn = styled.a`
  padding: 5px 10px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: none;
  background: ${({ theme }) => theme.colors.warning};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  flex-shrink: 0;
  text-decoration: none;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  &:hover { opacity: 0.85; }
`;

/* ══════════════════════════════════════════
   입력 영역
   ══════════════════════════════════════════ */

export const InputArea = styled.form`
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderDefault};
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.bgSecondary};
`;

export const Input = styled.input`
  flex: 1;
  padding: 9px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-family: inherit;

  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

export const SendBtn = styled.button`
  padding: 9px 16px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: none;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: opacity ${({ theme }) => theme.transitions.fast};
  flex-shrink: 0;

  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
