/**
 * 영화 추천 카드 styled-components.
 *
 * 기존 MovieCard.css의 className 기반 스타일을 styled-components로 전환.
 * 모든 색상을 theme 토큰으로 참조하여 다크/라이트 모드 자동 대응.
 *
 * 구조:
 *   Card > RankBadge + PosterWrapper + InfoArea > Title, Meta, Tags, ...
 *   TrailerModal > ModalContent > CloseButton + ModalTitle + PlayerWrapper
 */

import styled, { keyframes } from 'styled-components';

/* ── 트레일러 모달 페이드인 애니메이션 ── */
const trailerFadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

/* ── 개별 영화 카드 ── */
export const Card = styled.div`
  flex-shrink: 0;
  width: 260px;
  background-color: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s, filter 0.2s;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  /* 취소된 카드 — opacity 60% + 채도 낮춰 "보존되었지만 부분 데이터" 시각화.
     호버 시에도 부각하지 않아 사용자가 활성 결과와 혼동하지 않도록 한다. */
  ${({ $cancelled }) => $cancelled && `
    opacity: 0.6;
    filter: grayscale(0.3);
    &:hover { transform: none; box-shadow: none; }
  `}
`;

/* ── 순위 배지 ── */
export const RankBadge = styled.span`
  position: absolute;
  top: 8px;
  left: 8px;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  z-index: 1;
`;

/* ── 외부 웹 정보 배지 (2026-04-23 후속 과제) ──
 * id 접두사 'external_' 인 영화에 노출. DB 에 없는 신작이라 DuckDuckGo 로 찾아온
 * 경우임을 사용자에게 명시적으로 표시한다. RankBadge 옆에 배치 (top:8px, left:48px).
 * 색상: 보조 액센트 (주황 계열) — 일반 추천과 시각적 구분.
 */
export const ExternalBadge = styled.span`
  position: absolute;
  top: 8px;
  left: 48px;
  background: #ff8c42;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 8px;
  z-index: 1;
  letter-spacing: 0.02em;
  display: inline-flex;
  align-items: center;
  gap: 3px;
`;

/* ── 외부 출처 링크 (2026-04-23 후속 과제) ──
 * overview 에 부착된 `[외부 출처] URL` 을 파싱해 별도 링크로 렌더링.
 * Overview 본문 아래 작은 글씨로 표시.
 */
export const ExternalSourceLink = styled.a`
  display: inline-block;
  margin-top: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  &::before {
    content: '🌐';
    margin-right: 3px;
  }
`;

/* ── 포스터 이미지 래퍼 ── */
export const PosterWrapper = styled.div`
  width: 100%;
  height: 160px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.bgMain};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

/* ── 카드 정보 영역 ── */
export const InfoArea = styled.div`
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

/* ── 한국어 제목 ──
 * QA #156 (2026-04-23): 트레일러 버튼이 있는 영화 카드에서 긴 제목/공백 없는 문자열이
 * 박스를 뚫고 나가는 현상 방지. word-break 를 명시해 한국어 줄바꿈을 표준화한다.
 */
export const Title = styled.h3`
  font-size: 14px;
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
  color: ${({ theme }) => theme.colors.textPrimary};
  /* 2줄 초과 시 말줄임 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
  word-break: break-word;
`;

/* ── 영어 제목 ── */
export const TitleEn = styled.p`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/* ── 메타 정보 (연도, 평점, 관람등급) ── */
export const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};

  span:not(:last-child)::after {
    content: '\u00B7';
    margin-left: 8px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

/* ── 감독/출연 ── */
export const Crew = styled.p`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/* ── 태그 목록 (장르, 무드) ── */
export const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

/* ── 공통 태그 베이스 ── */
const TagBase = styled.span`
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  line-height: 1.4;
`;

/* ── 장르 태그 ── */
export const GenreTag = styled(TagBase)`
  background-color: ${({ theme }) => theme.colors.bgTertiary};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/* ── 무드 태그 ── */
export const MoodTag = styled(TagBase)`
  background-color: ${({ theme }) => theme.colors.bgSecondary};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/* ── 줄거리 ── */
export const Overview = styled.p`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/* ── 추천 이유 ── */
export const Explanation = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
  line-height: 1.5;
  padding: 6px 8px;
  background-color: ${({ theme }) => theme.colors.primaryLight};
  border-radius: 6px;
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
`;

/* ── OTT 플랫폼 배지 목록 ── */
export const OttList = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

/* ── OTT 개별 배지 ──
 * QA #170 (2026-04-23): span → a 로 변경해 클릭 시 해당 OTT 의 영화 검색 결과로 이동.
 * href 가 없으면(매핑 없는 OTT) 기존과 동일하게 정적 뱃지처럼 보이도록 pointer 커서·밑줄 제거.
 */
export const OttBadge = styled.a`
  display: inline-block;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.colors.successBg};
  color: ${({ theme }) => theme.colors.success};
  text-decoration: none;
  cursor: ${({ href }) => (href ? 'pointer' : 'default')};
  transition: filter 0.15s ease;

  &:hover {
    ${({ href }) => href && 'filter: brightness(1.1); text-decoration: underline;'}
  }
`;

/* ── 트레일러 링크/버튼 공통 ──
 * QA #156 (2026-04-23): 트레일러 버튼 주변 레이아웃이 세로로 누적되어 카드가 길어지는
 * 현상 보정. align-self: flex-start 로 너비가 콘텐츠 크기에 맞춰지도록 하고,
 * margin-top 으로 앞 요소(OttList/Overview)와 시각적 간격을 일관화한다.
 */
export const TrailerLink = styled.button`
  align-self: flex-start;
  margin-top: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.colors.primaryHover};
    text-decoration: underline;
  }
`;

/* ── 트레일러 외부 링크 (a 태그) ── QA #156 */
export const TrailerAnchor = styled.a`
  align-self: flex-start;
  margin-top: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.colors.primaryHover};
    text-decoration: underline;
  }
`;

/* ============================================================
 * 트레일러 YouTube 모달 오버레이
 * ============================================================ */

/* ── 전체 화면 반투명 배경 ── */
export const TrailerModal = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: ${({ theme }) => theme.colors.bgOverlay};
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${trailerFadeIn} 0.2s ease-out;
`;

/* ── 모달 콘텐츠 박스 ── */
export const ModalContent = styled.div`
  position: relative;
  width: 90vw;
  max-width: 800px;
`;

/* ── 닫기 버튼 (우상단) ── */
export const CloseButton = styled.button`
  position: absolute;
  top: -36px;
  right: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
`;

/* ── 영화 제목 (모달 상단) ── */
export const ModalTitle = styled.p`
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/* ── 16:9 비율 유지 플레이어 래퍼 ── */
export const PlayerWrapper = styled.div`
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 */
  background-color: #000;
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
`;

/**
 * 카드 하단 액션 버튼 영역 — "리뷰 작성"과 "관심 없음"을 한 줄에 배치.
 * 좁은 카드 폭(260px)에서 버튼이 줄바꿈되지 않도록 gap/flex 로 간격만 유지한다.
 */
export const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

/**
 * Phase 5-1: "관심 없음" 버튼 — 추천 카드 하단에 배치.
 * 클릭 시 카드가 fade-out되며 not_interested 피드백을 전송한다.
 */
export const NotInterestedButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.danger || '#ef4444'};
    color: ${({ theme }) => theme.colors.danger || '#ef4444'};
    background: ${({ theme }) => (theme.colors.danger || '#ef4444') + '10'};
  }
`;

/**
 * "리뷰 작성" 버튼 — 추천 카드 하단에 배치.
 * 클릭 시 PostWatchFeedback 모달을 열고, 리뷰 저장 성공 시 "봤다" 상태로 전환된다.
 * 설계 원칙: 리뷰 작성 = 시청 완료 단일 신호 ("봤다 = 리뷰" 원칙, CLAUDE.md 참조).
 *
 * $completed=true 일 때는 이미 리뷰를 작성한 상태(disabled 시각 처리).
 */
export const ReviewButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid ${({ $completed, theme }) =>
    $completed ? theme.colors.success : theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ $completed, theme }) =>
    $completed
      ? (theme.colors.successBg || theme.colors.primaryLight)
      : 'transparent'};
  color: ${({ $completed, theme }) =>
    $completed ? theme.colors.success : theme.colors.primary};
  font-size: 0.75rem;
  font-weight: 500;
  cursor: ${({ $completed }) => ($completed ? 'default' : 'pointer')};
  transition: all 0.2s ease;

  &:hover {
    /* 리뷰 작성 완료 상태에서는 hover 효과 없음 (disabled 시각 힌트) */
    background: ${({ $completed, theme }) =>
      $completed
        ? (theme.colors.successBg || theme.colors.primaryLight)
        : theme.colors.primaryLight};
  }

  &:disabled {
    cursor: default;
    opacity: 0.9;
  }
`;

/**
 * Phase 5-1: 카드 fade-out 래퍼.
 * dismissed=true일 때 opacity 0 + height 축소 애니메이션.
 */
export const CardFadeWrapper = styled.div`
  transition: opacity 0.4s ease, max-height 0.4s ease, margin 0.4s ease;
  opacity: ${({ $dismissed }) => ($dismissed ? 0 : 1)};
  max-height: ${({ $dismissed }) => ($dismissed ? '0px' : '2000px')};
  overflow: hidden;
  margin-bottom: ${({ $dismissed }) => ($dismissed ? '0px' : '16px')};
`;
