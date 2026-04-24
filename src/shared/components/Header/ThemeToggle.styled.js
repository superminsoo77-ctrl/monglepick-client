/**
 * ThemeToggle styled-components.
 *
 * 2026-04-23 개편:
 *   기존 36×36 원형 아이콘 버튼 → 2가지 variant 지원.
 *     - variant="switch"   : UserDropdown 하단 전용 "행(row) 형 스위치".
 *                            "다크 모드" 라벨 + 우측 iOS 스타일 토글 스위치.
 *     - variant="compact"  : 비로그인 / 컴팩트 헤더에서 사용하는 작은 원형 아이콘 버튼.
 *                            기존 디자인을 유지해 단독 노출 상황의 시각적 호환성 보존.
 *
 *   헤더 상단 바에서 홀로 떠있던 토글 버튼을 제거하면서, UserDropdown 내부에
 *   "환경 설정" 성격의 스위치 row 를 기본 형태로 삼는다.
 */

import styled, { css } from 'styled-components';

/* ============================================================
 *  variant="switch" — 드롭다운 내부 행(row)형 스위치
 * ============================================================ */

/**
 * 전체 row 컨테이너.
 *
 * DropdownItem 과 padding/border-radius 를 맞춰 시각적 일관성 유지.
 * 단, DropdownItem 은 Link 이고 이 스위치는 `<button>` 이므로 hover 시
 * 배경 변화만 약하게 주어 "메뉴 이동 링크" 와 구분되는 느낌을 준다.
 *
 * onClick 으로 이벤트가 버블링되면 UserDropdown 외부 클릭 감지가
 * 드롭다운을 닫을 수 있어, 컴포넌트 레벨에서 stopPropagation 처리한다.
 */
export const SwitchRow = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border: none;
  background: transparent;
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
    background-color: ${({ theme }) => theme.colors.bgElevated};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: -2px;
  }
`;

/** row 좌측 — 아이콘 + 라벨 */
export const SwitchLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/** 아이콘 (해/달) — 테마 전환 시 미세 회전 애니메이션 */
export const SwitchIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  transition: transform ${({ theme }) => theme.transitions.base};

  ${SwitchRow}:active & {
    transform: rotate(30deg) scale(0.9);
  }
`;

/**
 * iOS 스타일 토글 트랙 — 다크 모드 ON 시 primary 그라데이션 배경.
 *
 * `$on` prop 으로 상태 시각화. 자식 Knob 이 translateX 로 좌/우 이동한다.
 * `role="switch" aria-checked` 는 부모 SwitchRow 에서 부여한다.
 */
export const SwitchTrack = styled.span`
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  transition: background ${({ theme }) => theme.transitions.base},
    border-color ${({ theme }) => theme.transitions.base};
  flex-shrink: 0;

  ${({ $on, theme }) =>
    $on &&
    css`
      background: ${theme.gradients.primary};
      border-color: transparent;
    `}
`;

/** 토글 노브(원형 슬라이더) — 트랙 위에서 좌→우 이동 */
export const SwitchKnob = styled.span`
  position: absolute;
  top: 50%;
  left: 2px;
  transform: translateY(-50%) translateX(${({ $on }) => ($on ? '18px' : '0')});
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  transition: transform ${({ theme }) => theme.transitions.base};
`;

/* ============================================================
 *  variant="compact" — 단독 노출용 원형 아이콘 버튼 (레거시 모양)
 * ============================================================ */

export const CompactButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryLight};
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.glass.border};
  }
`;

/** compact 아이콘 래퍼 — 전환 시 rotate 애니메이션 */
export const CompactIconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  transition: transform ${({ theme }) => theme.transitions.base};

  ${CompactButton}:active & {
    transform: rotate(180deg) scale(0.8);
  }
`;
