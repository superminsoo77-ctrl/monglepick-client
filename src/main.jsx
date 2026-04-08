/**
 * 몽글픽 React 애플리케이션 진입점.
 *
 * StrictMode로 감싸서 잠재적 문제를 감지하고,
 * Root 컴포넌트를 #root DOM 노드에 마운트한다.
 *
 * Root 컴포넌트에서 Zustand useThemeStore의 mode를 구독하여
 * darkTheme / lightTheme를 동적으로 ThemeProvider에 전달한다.
 * 테마 변경 시 전체 앱이 리렌더링되지만, styled-components
 * ThemeProvider 특성상 불가피하며 정상 동작이다.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';

/* 테마 객체 — darkTheme / lightTheme 분리 */
import { darkTheme, lightTheme } from './shared/styles/theme';
/* 테마 모드 상태 관리 (Zustand) */
import useThemeStore from './shared/stores/useThemeStore';
/* 글로벌 스타일 — color-scheme 동적 반영 */
import GlobalStyle from './shared/styles/GlobalStyle';
/* 모달 컨텍스트 프로바이더 */
import { ModalProvider } from './shared/components/Modal';
/* 메인 App 컴포넌트 */
import App from './app/App.jsx';

/**
 * 루트 컴포넌트.
 *
 * useThemeStore의 mode를 구독하여 테마 객체를 선택한다.
 * Zustand 셀렉터로 mode만 구독하므로 다른 스토어 변경에는 반응하지 않는다.
 *
 * react-refresh/only-export-components 룰 disable: main.jsx 는 진입점 파일이므로
 * Fast Refresh 대상이 아니다. Root 컴포넌트는 export 없이 createRoot 에 직접 사용된다.
 */
// eslint-disable-next-line react-refresh/only-export-components
function Root() {
  /* 현재 테마 모드 구독 ('dark' | 'light') */
  const mode = useThemeStore((s) => s.mode);
  /* 모드에 따른 테마 객체 선택 */
  const theme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <ModalProvider>
        <App />
      </ModalProvider>
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
