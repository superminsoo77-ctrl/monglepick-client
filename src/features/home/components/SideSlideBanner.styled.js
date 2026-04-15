/**
 * SideSlideBanner styled-components — 2026-04-15 (placement v3).
 *
 * 우측하단 플로팅 슬라이드 배너 위젯. 홈(/home) 어느 섹션을 보고 있어도
 * 시야 안에 항상 노출되도록 `position: fixed` 로 viewport 에 고정한다.
 *
 * 디자인 원칙
 *   - 작고 이쁘게 (220×140) — 메인 콘텐츠를 가리지 않는 크기
 *   - glass-card 톤 + primary glow hover — HomePage 전체 톤과 통일
 *   - 모바일(≤480px)에서만 숨김 — 데스크톱/태블릿/모바일 대부분 노출
 *   - Hero 의 `overflow: hidden` 영향을 받지 않도록 Wrapper 바깥에서 렌더
 *   - `z-index` 99 — 헤더 TopLoadingBar(z:100) 보다 낮게, 일반 컨텐츠보다 위
 *
 * 2026-04-15 placement v3 변경 사항:
 *   - 우측하단 SupportChatbotWidget(FAB 64×64, right:24/bottom:24, z:900)
 *     과 영역이 겹쳐 챗봇 FAB 가 배너 위에 놓이는 시각 충돌이 발생.
 *   - 배너를 챗봇 FAB 위쪽으로 띄우기 위해 `bottom` 을 FAB 높이 + 여백만큼
 *     상향 조정 (데스크톱 100px / 태블릿 92px). 모바일은 기존대로 숨김.
 */

import styled, { keyframes } from 'styled-components';
import { fadeInUp } from '../../../shared/styles/animations';
import { media } from '../../../shared/styles/media';

/** 개별 슬라이드 fade 전환 keyframe — 0.5s 안에 완만히 나타남 */
const fadeSlide = keyframes`
  from { opacity: 0; transform: scale(1.02); }
  to   { opacity: 1; transform: scale(1);    }
`;

/**
 * 배너 위젯 전체 프레임 — viewport 우측하단 플로팅.
 *
 * 2026-04-14 placement v2 변경 사항:
 *   - `position: absolute` (Hero 내부) → `position: fixed` (viewport)
 *   - 크기 240×180 → 220×140 (더 작게, 하단 여백 절약)
 *   - `media.desktop` 숨김 → `media.mobile` 숨김 (노출 범위 확대)
 */
export const Frame = styled.div`
  position: fixed;
  right: 20px;
  /*
   * 챗봇 FAB(우측하단 64×64, bottom:24)와 겹치지 않도록 위로 띄움.
   * 24(FAB 하단 여백) + 64(FAB 높이) + 12(분리 여백) = 100px.
   */
  bottom: 100px;
  width: 220px;
  height: 140px;
  z-index: 99;
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: ${({ theme }) => theme.glass.blur};
  -webkit-backdrop-filter: ${({ theme }) => theme.glass.blur};
  border: 1px solid ${({ theme }) => theme.glass.border};
  box-shadow: ${({ theme }) => theme.shadows.md};
  animation: ${fadeInUp} 0.6s ease both;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.glow};
    transform: translateY(-2px);
  }

  /* 태블릿(≤768px) 에서는 조금 더 작게 */
  ${media.tablet} {
    width: 180px;
    height: 116px;
    right: 12px;
    /* 태블릿 챗봇 FAB(bottom:24) 위로 — 24+64+12=100 */
    bottom: 100px;
  }

  /*
   * 모바일(≤480px) 에서는 숨김. 작은 화면에서는 FAB(고객센터 챗봇 위젯)과
   * 영역이 겹쳐 사용자 시선을 방해하므로 제외. 태블릿 이상에서만 노출.
   */
  ${media.mobile} {
    display: none;
  }
`;

/** 실제 배너 이미지가 렌더링되는 링크 레이어 — 링크 없으면 div 로 동작 */
export const Slide = styled.a`
  position: absolute;
  inset: 0;
  display: block;
  text-decoration: none;
  color: inherit;
  cursor: ${({ href }) => (href ? 'pointer' : 'default')};
  animation: ${fadeSlide} 0.5s ease both;
`;

/**
 * 배너 이미지 — 프레임을 가득 채우되 비율 유지.
 * imageUrl 이 없을 때는 Fallback 이 표시된다.
 */
export const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

/**
 * 제목 오버레이 — 하단에서 상단으로 페이드된 그라데이션 위에 텍스트를 얹어 가독성 확보.
 * 작아진 카드 크기에 맞춰 1줄로 축소하고 폰트도 한 단계 작게.
 */
export const TitleOverlay = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 8px 10px;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.78) 0%,
    rgba(0, 0, 0, 0.45) 55%,
    rgba(0, 0, 0, 0) 100%
  );
  color: #fff;
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none; /* 링크 클릭 이벤트를 Slide <a> 로 통과시키기 위함 */
`;

/**
 * 이미지가 없거나 로드 실패했을 때 표시되는 기본 배경 (primary gradient).
 * 배너가 등록되어 있더라도 이미지 URL 이 깨져 있을 수 있으므로 fallback 필수.
 */
export const Fallback = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  text-align: center;
  background: ${({ theme }) => theme.gradients.primary};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  line-height: 1.3;
`;

/**
 * 닫기 버튼 — 우측 상단. 사용자가 이 세션 동안 배너를 숨길 수 있도록 제공.
 * 오버레이 형태로 살짝 띄워 두되 배너 본체 링크 클릭을 방해하지 않도록
 * 작은 영역에만 히트 박스를 둔다.
 */
export const CloseButton = styled.button`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border: none;
  padding: 0;
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  z-index: 4;
  opacity: 0.7;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  &:hover {
    opacity: 1;
    background: ${({ theme }) => theme.colors.primary};
  }
`;

/** 슬라이드 인디케이터 컨테이너 — 하단 중앙에 작은 점 여러 개 */
export const Indicators = styled.div`
  position: absolute;
  left: 50%;
  bottom: 6px;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
  z-index: 3;
`;

/** 개별 인디케이터 점 — 활성 상태이면 primary 색, 아니면 반투명 흰색 */
export const Dot = styled.button`
  width: 5px;
  height: 5px;
  border: none;
  padding: 0;
  border-radius: 50%;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.primary : 'rgba(255, 255, 255, 0.55)'};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ $active, theme }) =>
      $active ? theme.colors.primary : 'rgba(255, 255, 255, 0.85)'};
  }
`;
