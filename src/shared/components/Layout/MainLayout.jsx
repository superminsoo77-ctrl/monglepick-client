/**
 * 메인 레이아웃 래퍼 컴포넌트.
 *
 * Header + 메인 컨텐츠 영역 + Footer의 3단 구조를 구성한다.
 * children prop을 통해 각 페이지의 컨텐츠를 메인 영역에 렌더링한다.
 * Flexbox column 레이아웃으로 Footer가 항상 하단에 위치하도록 보장한다.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - 페이지 컨텐츠
 */

/* 헤더 컴포넌트 — shared/components/Header에서 가져옴 */
import Header from '../Header/Header';
/* 푸터 컴포넌트 — shared/components/Footer에서 가져옴 */
import Footer from '../Footer/Footer';
import './MainLayout.css';

export default function MainLayout({ children }) {
  return (
    <div className="main-layout">
      {/* 상단 네비게이션 헤더 */}
      <Header />

      {/* 메인 컨텐츠 영역 — 남은 공간을 모두 차지 (flex-grow: 1) */}
      <main className="main-layout__content">
        {children}
      </main>

      {/* 하단 푸터 */}
      <Footer />
    </div>
  );
}
