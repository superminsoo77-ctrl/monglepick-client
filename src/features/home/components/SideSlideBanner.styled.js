/**
 * SideSlideBanner styled-components — 2026-04-24 (placement v6, 반응형 가림 방지).
 *
 * 좌측상단 플로팅 슬라이드 배너 위젯. 홈(/home) 어느 섹션을 보고 있어도
 * 시야 안에 항상 노출되도록 HomePage Wrapper 기준 `position: absolute` 로 앵커링.
 *
 * 디자인 원칙
 *   - 작고 이쁘게 (220×140) — 메인 콘텐츠를 가리지 않는 크기
 *   - glass-card 톤 + primary glow hover — HomePage 전체 톤과 통일
 *   - 모바일(≤480px)에서만 숨김 — 데스크톱/태블릿에서는 반응형 재배치로 노출 유지
 *   - Hero 의 `overflow: hidden` 영향을 받지 않도록 Wrapper 레벨에 배치
 *   - `z-index` 99 — 헤더 TopLoadingBar(z:100) 보다 낮게, 일반 컨텐츠보다 위
 *
 * 2026-04-24 placement v6 — 검색창 가림 방지 반응형 재배치:
 *   기존(v5)은 viewport 전 구간에서 `top: 16px` 고정이었는데, HomeSearch 섹션은
 *   `max-width: contentMaxWidth(1200)` + `margin: 0 auto` 로 가운데 정렬되므로
 *   viewport 가 1680px 이하로 좁아지면 배너 우측단(x=240) 과 검색창 좌측단이
 *   가로로 겹쳐 검색 UI 를 가리는 결함이 있었다.
 *   (overlap 임계: (viewport − 1200)/2 + 24 ≤ 240  →  viewport ≤ 1632)
 *
 *   v6 는 다음 3단 구조로 겹침을 제거한다.
 *     ① viewport > 1680px : 기존 좌상단 플로팅 유지 (검색창은 중앙에서 충분히 안쪽)
 *     ② 481~1680px        : 배너를 검색창 아래(top ≈ 120px)로 내려 overlap 회피
 *     ③ ≤480px (모바일)    : 기존과 동일하게 숨김
 *
 *   top 오프셋(120px)은 HomeSearch 섹션 높이(대략 padding lg 48px + form 56~60px
 *   ≈ 104~108px) 위로 12~16px 여유를 둔 값이다. 태블릿(≤768)은 카드 크기를 축소
 *   하면서 좌측 패딩도 12px 로 조였기 때문에 top 도 104px 로 살짝 올린다.
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
 * 배너 위젯 전체 프레임 — 페이지 좌측상단 앵커 + 반응형 재배치 (2026-04-24 placement v6).
 *
 * 이력:
 *   - v2(2026-04-14) `position: absolute`(Hero 내부) → `position: fixed`(viewport),
 *                    240×180 → 220×140, `media.desktop` 숨김 → `media.mobile` 숨김.
 *   - v3(2026-04-15) 우측하단 고정 + 챗봇 FAB 회피를 위해 `bottom: 100px` 로 상향.
 *   - v4(2026-04-24) 우측하단 → 좌측상단 헤더 아래 (top:80 / left:20) 로 이동.
 *   - v5(2026-04-24) `position: fixed` → `absolute` 로 변경. viewport 에 달라붙어
 *                    스크롤을 따라오던 동작을 제거하고, HomePage Wrapper 기준
 *                    좌측상단에 한 번 앵커링. 아래로 스크롤하면 배너도 같이
 *                    위로 밀려 올라가서 자연스럽게 사라진다 ("고정 위치" 요청 반영).
 *                    Wrapper 에 `position: relative` 가 추가되어 기준점으로 작동.
 *   - v6(2026-04-24) 반응형 가림 방지. viewport ≤ 1680px 부터 HomeSearch(중앙 정렬,
 *                    max-width 1200) 의 좌측단과 배너 우측단이 겹쳐 검색 UI 를
 *                    가리던 문제를 제거. 좁은 화면에서는 배너를 검색창 아래
 *                    (top: 120px) 로 내리고, 태블릿에서는 카드 크기와 top 을 동시 축소.
 */
export const Frame = styled.div`
  position: absolute;
  /*
   * 기본(넓은 데스크톱, viewport > 1680px) 앵커 위치.
   * HomeSearch 가 (viewport-1200)/2 + 24 지점에서 시작하므로 viewport > 1680 이면
   * 배너 우측단(x=240) 과 검색창 좌측단 사이에 여유가 생긴다.
   * Wrapper 기준 absolute 이므로 스크롤 시 함께 밀려 올라가 자연스럽게 사라진다.
   */
  top: 16px;
  left: 20px;
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

  /*
   * 검색창 가림 방지 (v6): viewport ≤ 1680px 구간은 HomeSearch 섹션이 content
   * 영역을 거의 꽉 채워 배너가 입력창·버튼과 가로로 겹친다. 이 구간에서는
   * 배너를 검색창 바로 아래로 내려 가림 없이 Hero 상단 좌측에 자연스럽게 얹힌다.
   * top 120px = HomeSearch 섹션 높이(≈ 108px) + 12px 여유.
   */
  @media (max-width: 1680px) {
    top: 120px;
  }

  /* 태블릿(≤768px) 에서는 조금 더 작게 + 좌측 여백 축소 + top 도 살짝 위로 */
  ${media.tablet} {
    width: 180px;
    height: 116px;
    top: 104px;
    left: 12px;
  }

  /*
   * 모바일(≤480px) 에서는 숨김. 작은 화면에서는 본문 콘텐츠(검색창·Hero)
   * 와 겹쳐 사용자 시선을 방해하므로 제외. 태블릿 이상에서만 노출.
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
