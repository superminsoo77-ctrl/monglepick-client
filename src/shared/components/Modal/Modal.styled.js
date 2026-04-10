/**
 * Modal styled-components.
 *
 * 글래스모피즘 기반 커스텀 모달 다이얼로그.
 * window.confirm / window.alert를 대체하며, 프로젝트 디자인 시스템에 맞춘
 * 반투명 블러 배경 + scaleIn 등장 애니메이션 + 글로우 효과를 사용한다.
 *
 * 타입별 색상:
 *   - info    : primary 보라색 (#7c6cf0)
 *   - success : 초록색 (#4ade80)
 *   - warning : 노란색 (#fbbf24)
 *   - error   : 빨간색 (#f87171)
 *   - confirm : primary 보라색 (#7c6cf0)
 */

import styled, { css, keyframes } from 'styled-components';
import { media } from '../../styles/media';

/* ── 등장/퇴장 애니메이션 ── */

/** 배경 오버레이 페이드 인 */
const backdropFadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

/** 배경 오버레이 페이드 아웃 */
const backdropFadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

/** 모달 스케일 인 (열릴 때) — translate 포함해야 centering 유지 */
const modalScaleIn = keyframes`
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`;

/** 모달 스케일 아웃 (닫힐 때) */
const scaleOut = keyframes`
  from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  to { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
`;

/* ── 타입별 색상 매핑 ── */

/** 모달 타입에 따른 아이콘 글로우 색상 반환 */
const getTypeColor = (type, theme) => {
  const colorMap = {
    info: theme.colors.primary,
    success: theme.colors.success,
    warning: theme.colors.warning,
    error: theme.colors.error,
    confirm: theme.colors.primary,
  };
  return colorMap[type] || theme.colors.primary;
};

/** 모달 타입에 따른 연한 배경색 반환 */
const getTypeBgColor = (type, theme) => {
  const bgMap = {
    info: theme.colors.infoBg,
    success: theme.colors.successBg,
    warning: theme.colors.warningBg,
    error: theme.colors.errorBg,
    confirm: theme.colors.primaryLight,
  };
  return bgMap[type] || theme.colors.primaryLight;
};

/* ── Styled Components ── */

/** 배경 오버레이 — 반투명 블러 + 클릭으로 닫기 지원 */
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.modalBackdrop};
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;

  /* 등장/퇴장 애니메이션 — $closing prop으로 전환 */
  animation: ${({ $closing }) => ($closing ? backdropFadeOut : backdropFadeIn)}
    ${({ $closing }) => ($closing ? '200ms' : '250ms')} ease forwards;
`;

/** 모달 컨테이너 — 글래스모피즘 카드 + scaleIn 등장 */
export const Container = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: ${({ theme }) => theme.zIndex.modal};
  width: 90%;
  max-width: 420px;
  padding: ${({ theme }) => `${theme.spacing.xl} ${theme.spacing.lg}`};
  border-radius: ${({ theme }) => theme.radius.xl};

  /* 글래스모피즘 배경 */
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: ${({ theme }) => theme.glass.blur};
  -webkit-backdrop-filter: ${({ theme }) => theme.glass.blur};
  border: 1px solid ${({ theme }) => theme.glass.border};

  /* 그림자 + 글로우 */
  box-shadow:
    ${({ theme }) => theme.shadows.xl},
    ${({ theme }) => theme.shadows.glow};

  /* 등장/퇴장 애니메이션 — translate 포함해야 centering 유지 */
  animation: ${({ $closing }) =>
      $closing
        ? css`${scaleOut}`
        : css`${modalScaleIn}`}
    ${({ $closing }) => ($closing ? '200ms' : '300ms')} ease forwards;

  ${media.mobile} {
    width: 95%;
    padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.md}`};
  }
`;

/** 아이콘 영역 — 타입별 색상 원형 배경 + 큰 아이콘 */
export const IconArea = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin: 0 auto ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $type, theme }) => getTypeBgColor($type, theme)};
  font-size: 28px;
  line-height: 1;

  /* 타입별 글로우 */
  box-shadow: 0 0 20px ${({ $type, theme }) =>
    getTypeColor($type, theme)}33,
    0 0 40px ${({ $type, theme }) => getTypeColor($type, theme)}11;
`;

/** 제목 — 중앙 정렬, 굵은 텍스트 */
export const Title = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: center;
  line-height: ${({ theme }) => theme.typography.leadingTight};
`;

/** 메시지 본문 — 보조 색상, 줄바꿈 지원 */
export const Message = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  line-height: ${({ theme }) => theme.typography.leadingRelaxed};
  white-space: pre-line;
  word-break: keep-all;
`;

/** 버튼 래퍼 — 가로 배치, 간격 */
export const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};

  /* 버튼이 1개면 중앙 정렬, 2개면 양쪽 균등 */
  ${({ $single }) =>
    $single
      ? css`justify-content: center;`
      : css`justify-content: stretch;`}
`;

/** 공통 버튼 베이스 스타일 */
const buttonBase = css`
  flex: 1;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  border: none;
  min-height: 42px;

  &:active {
    transform: scale(0.97);
  }
`;

/** 확인(Primary) 버튼 — 그라데이션 + 글로우 호버 */
export const PrimaryButton = styled.button`
  ${buttonBase}
  background: ${({ theme }) => theme.gradients.primary};
  color: white;

  &:hover {
    box-shadow: ${({ theme }) => theme.glows.primary};
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.97);
  }
`;

/** 취소(Secondary) 버튼 — 반투명 배경 + 보더 */
export const SecondaryButton = styled.button`
  ${buttonBase}
  background: ${({ theme }) => theme.colors.bgElevated};
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};

  &:hover {
    background: ${({ theme }) => theme.colors.bgTertiary};
    color: ${({ theme }) => theme.colors.textPrimary};
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:active {
    transform: scale(0.97);
  }
`;
