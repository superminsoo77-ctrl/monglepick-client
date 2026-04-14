/**
 * 공유 keyframes 애니메이션 정의.
 *
 * global.css의 8개 @keyframes를 styled-components의 keyframes 헬퍼로 변환한다.
 * 컴포넌트에서 import하여 animation 속성에 보간(interpolation)으로 사용한다.
 *
 * 사용 예시:
 *   import { fadeInUp } from '../../../shared/styles/animations';
 *   const Box = styled.div`animation: ${fadeInUp} 0.5s ease forwards;`;
 */

import { keyframes } from 'styled-components';

/** 그라데이션 배경 이동 — 텍스트/배경 효과용 (무한 반복) */
export const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

/** 위아래 부유 — 배경 오브, 장식 요소 (무한 반복) */
export const floatUpDown = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

/** 글로우 펄스 — 버튼/카드 강조 (무한 반복) */
export const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(124,108,240,0.2); }
  50% { box-shadow: 0 0 40px rgba(124,108,240,0.4), 0 0 60px rgba(124,108,240,0.1); }
`;

/** 보더 색상 변화 — 카드 테두리 강조 (무한 반복) */
export const borderGlow = keyframes`
  0% { border-color: rgba(124,108,240,0.3); }
  50% { border-color: rgba(6,214,160,0.5); }
  100% { border-color: rgba(124,108,240,0.3); }
`;

/** 아래에서 위로 등장 — 페이지/섹션 진입 */
export const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

/** 왼쪽에서 슬라이드 등장 — 요소 진입 */
export const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
`;

/** 스케일 인 등장 — 팝업/모달 진입 */
export const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

/** 카드 빛 지나가기 — 호버 시 좌→우 광선 효과 */
export const cardShine = keyframes`
  0% { left: -100%; }
  100% { left: 200%; }
`;

/**
 * 헤더 상단 TopBar 로딩 인디케이터 — 전역 비동기 작업(Match SSE, 검색 등) 중 상단에 흐르는 얇은 바.
 * YouTube/GitHub 스타일의 indeterminate progress. (무한 반복)
 */
export const topBarSlide = keyframes`
  0%   { left: -35%; width: 35%; }
  60%  { left: 100%; width: 45%; }
  100% { left: 100%; width: 45%; }
`;
