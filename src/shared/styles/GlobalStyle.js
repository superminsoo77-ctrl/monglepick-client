/**
 * 글로벌 스타일 정의 (styled-components).
 *
 * global.css의 CSS 리셋, 기본 요소 스타일, 스크롤바, 접근성을
 * createGlobalStyle로 변환한다.
 * ThemeProvider의 theme 객체를 참조하여 다크 테마를 적용한다.
 *
 * 유틸리티 클래스(.card, .btn 등)는 JSX에서 직접 사용하지 않으므로
 * 여기에 포함하지 않는다. 필요 시 mixins.js의 css 헬퍼를 사용한다.
 */

import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  /* ── CSS 리셋 ── */

  /* 모든 요소의 box-sizing을 border-box로 통일 */
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* HTML 기본 설정 — color-scheme을 테마 모드에 따라 동적 반영 */
  html {
    font-size: 16px;
    color-scheme: ${({ theme }) => theme.mode};
    -webkit-text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    scroll-behavior: smooth;
  }

  /* Body 기본 스타일 — 테마 전환 트랜지션 포함 */
  body {
    transition: background-color 0.3s ease, color 0.3s ease;
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.textBase};
    font-weight: ${({ theme }) => theme.typography.fontNormal};
    line-height: ${({ theme }) => theme.typography.leadingNormal};
    color: ${({ theme }) => theme.colors.textPrimary};
    background-color: ${({ theme }) => theme.colors.bgMain};
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ── 기본 요소 스타일 ── */

  /* 제목 */
  h1, h2, h3, h4, h5, h6 {
    font-weight: ${({ theme }) => theme.typography.fontBold};
    line-height: ${({ theme }) => theme.typography.leadingTight};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  h1 { font-size: ${({ theme }) => theme.typography.text4xl}; }
  h2 { font-size: ${({ theme }) => theme.typography.text3xl}; }
  h3 { font-size: ${({ theme }) => theme.typography.text2xl}; }
  h4 { font-size: ${({ theme }) => theme.typography.textXl}; }
  h5 { font-size: ${({ theme }) => theme.typography.textLg}; }
  h6 { font-size: ${({ theme }) => theme.typography.textBase}; }

  /* 단락 */
  p {
    margin-bottom: ${({ theme }) => theme.spacing.md};
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  /* 링크 */
  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    transition: color ${({ theme }) => theme.transitions.fast};
  }

  a:hover {
    color: ${({ theme }) => theme.colors.primaryHover};
  }

  /* 이미지 — 반응형 기본 설정 */
  img {
    max-width: 100%;
    height: auto;
    display: block;
  }

  /* 버튼 리셋 */
  button {
    cursor: pointer;
    border: none;
    background: none;
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    padding: 0;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* 입력 필드 리셋 */
  input,
  textarea,
  select {
    font-family: inherit;
    font-size: inherit;
    color: ${({ theme }) => theme.colors.textPrimary};
    background-color: ${({ theme }) => theme.colors.bgInput};
    border: 1px solid ${({ theme }) => theme.colors.borderDefault};
    border-radius: ${({ theme }) => theme.radius.md};
    padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
    transition: border-color ${({ theme }) => theme.transitions.fast},
      box-shadow ${({ theme }) => theme.transitions.fast};
    outline: none;
  }

  input:focus,
  textarea:focus,
  select:focus {
    border-color: ${({ theme }) => theme.colors.borderFocus};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primaryLight};
  }

  input::placeholder,
  textarea::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  /* 리스트 리셋 */
  ul, ol {
    list-style: none;
  }

  /* 구분선 */
  hr {
    border: none;
    border-top: 1px solid ${({ theme }) => theme.colors.borderDefault};
    margin: ${({ theme }) => theme.spacing.lg} 0;
  }

  /* ── 스크롤바 스타일 (Webkit) ── */

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.bgMain};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.borderDefault};
    border-radius: ${({ theme }) => theme.radius.full};
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.textMuted};
  }

  /* 선택 영역 스타일 */
  ::selection {
    background-color: ${({ theme }) => theme.colors.primaryLight};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  /* ── 접근성 (Accessibility) ── */

  /* 키보드 포커스 스타일 — 마우스 클릭 시에는 표시하지 않음 */
  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  /* 입력 필드는 자체 포커스 스타일이 있으므로 outline 제거 */
  input:focus-visible,
  textarea:focus-visible,
  select:focus-visible {
    outline: none;
  }

  /* ── 모션 감소 선호 사용자 대응 (WCAG 2.3.3) ── */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* ── 루트/앱 레이아웃 (App.css 통합) ── */
  /*
   * 모바일 브라우저(iOS Safari, Chrome Android) 의 address bar 가 동적으로
   * 보였다/숨겨졌다 하면서 100vh 가 실제 보이는 높이보다 커지는 문제가 있다.
   * 100dvh (dynamic viewport height) 를 우선 사용하고, 미지원 브라우저는
   * 100vh 로 폴백 (캐스케이드 순서 활용 — dvh 미지원이면 dvh 줄이 무시됨).
   */
  #root {
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    margin: 0;
    padding: 0;
  }

  .app {
    width: 100%;
    height: 100vh;
    height: 100dvh;
  }
`;

export default GlobalStyle;
