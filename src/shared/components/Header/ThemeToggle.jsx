/**
 * 테마 토글 컴포넌트.
 *
 * 다크 모드 ↔ 라이트 모드 전환. Zustand useThemeStore 를 통해 전역 테마 상태를 변경한다.
 *
 * 2026-04-23 개편 — 2가지 variant 지원:
 *   - variant="switch"  (기본, UserDropdown 하단 전용)
 *       "다크 모드 [🌙] [토글 스위치]" 행(row) 형태. DropdownItem 과 시각적으로 일관.
 *       드롭다운 외부 클릭 감지로 닫히지 않도록 stopPropagation 처리.
 *   - variant="compact" (비로그인 / 단독 노출용)
 *       기존 36×36 원형 아이콘 버튼. AuthSection 옆에 붙여 사용.
 *
 * 헤더 상단 바에서 홀로 떠 있던 이전 버튼은 완전 제거. 테마는 "계정 환경 설정"의
 * 일부로 재구성되었다.
 */

import useThemeStore from '../../stores/useThemeStore';
import {
  SwitchRow,
  SwitchLabel,
  SwitchIcon,
  SwitchTrack,
  SwitchKnob,
  CompactButton,
  CompactIconWrapper,
} from './ThemeToggle.styled';

/**
 * @param {Object} props
 * @param {'switch' | 'compact'} [props.variant='switch']
 */
export default function ThemeToggle({ variant = 'switch' }) {
  /* 현재 모드 구독 + 토글 함수 — 두 variant 공통 */
  const mode = useThemeStore((s) => s.mode);
  const toggleMode = useThemeStore((s) => s.toggleMode);
  const isDark = mode === 'dark';
  const ariaLabel = isDark ? '라이트 모드로 전환' : '다크 모드로 전환';

  /* ── variant="compact" — 원형 아이콘 버튼 (레거시 모양) ── */
  if (variant === 'compact') {
    return (
      <CompactButton
        type="button"
        onClick={toggleMode}
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        <CompactIconWrapper>
          {isDark ? '🌙' : '☀️'}
        </CompactIconWrapper>
      </CompactButton>
    );
  }

  /* ── variant="switch" (기본) — 드롭다운 내부 행(row)형 스위치 ── */
  return (
    <SwitchRow
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={(e) => {
        /*
         * 드롭다운 외부 클릭 감지(Header.jsx) 가 mousedown 기반이지만,
         * 이 스위치는 드롭다운 내부이므로 외부 판정 자체는 false 이다.
         * 다만 향후 closeOnSelect 동작이 추가되어도 스위치만은 예외로
         * 드롭다운이 닫히지 않도록, 클릭 전파를 명시적으로 막는다.
         */
        e.stopPropagation();
        toggleMode();
      }}
    >
      <SwitchLabel>
        <SwitchIcon aria-hidden="true">{isDark ? '🌙' : '☀️'}</SwitchIcon>
        다크 모드
      </SwitchLabel>
      <SwitchTrack $on={isDark}>
        <SwitchKnob $on={isDark} />
      </SwitchTrack>
    </SwitchRow>
  );
}
