/**
 * 로딩 스피너 컴포넌트.
 *
 * 데이터 로딩 중 화면에 표시하는 스피너 애니메이션.
 * 전체 페이지 로딩(fullPage)과 인라인 로딩을 지원한다.
 *
 * @param {Object} props
 * @param {string} [props.message='로딩 중...'] - 스피너 아래 표시할 메시지
 * @param {boolean} [props.fullPage=false] - 전체 페이지 중앙 정렬 여부
 * @param {string} [props.size='md'] - 스피너 크기 (sm, md, lg)
 */

import './Loading.css';

export default function Loading({ message = '로딩 중...', fullPage = false, size = 'md' }) {
  return (
    <div className={`loading ${fullPage ? 'loading--full-page' : ''}`}>
      {/* 스피너 원형 애니메이션 */}
      <div className={`loading__spinner loading__spinner--${size}`}>
        <div className="loading__spinner-ring"></div>
      </div>

      {/* 로딩 메시지 */}
      {message && <p className="loading__message">{message}</p>}
    </div>
  );
}
