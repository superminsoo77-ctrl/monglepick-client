/**
 * CommunityPage styled-components 스타일 정의.
 *
 * gradient-text 제목 + 활성 탭 gradient 하단 바 + 글로우 +
 * 콘텐츠 fade-in + 본문 내 게시글 작성 버튼.
 *
 * 로컬 keyframe: fadeIn (탭 콘텐츠 등장)
 * 공유 keyframe: fadeInUp (페이지 진입), gradientShift (제목)
 *
 * v2 개편 (2026-04-08): 우하단 FAB(`+` 아이콘만 있는 floating 버튼) 제거 →
 * 본문 내 명확한 "게시글 작성" 버튼(`WriteButton`)으로 대체.
 * FAB 는 의도가 모호하고(`+` 가 무엇을 작성하는지 라벨 없음) 모바일에서 콘텐츠를
 * 가리는 문제가 있어, 게시글 목록 상단에 라벨이 명확한 행동 버튼으로 변경.
 *
 * BEM → styled 매핑:
 *   .community-page                → PageWrapper
 *   .community-page__inner         → PageInner
 *   .community-page__header        → Header
 *   .community-page__title         → Title
 *   .community-page__desc          → Desc
 *   .community-page__tabs          → Tabs
 *   .community-page__tab           → Tab  ($active prop)
 *   .community-page__content       → Content
 *   .community-page__write-row     → WriteButtonRow
 *   .community-page__write-btn     → WriteButton
 *   .community-page__login-prompt  → LoginPromptRow
 */

import styled, { keyframes } from 'styled-components';
import { fadeInUp } from '../../../shared/styles/animations';
import { gradientText } from '../../../shared/styles/mixins';
import { media } from '../../../shared/styles/media';

/* ── 로컬 keyframe: 탭 콘텐츠 등장 (위로 8px 이동) ── */
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

/** 페이지 최외곽 컨테이너 — FAB fixed 기준 position:relative */
export const PageWrapper = styled.div`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
  position: relative;
  /*
   * 자식 그리드/칩 행이 터치 가로 스크롤을 가질 수 있어,
   * 페이지 자체가 가로 스크롤이 생기지 않도록 안전하게 차단.
   */
  overflow-x: hidden;

  /* 모바일에서는 좌우 패딩을 줄여 콘텐츠 가용 너비 확보 */
  ${media.mobile} {
    padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.md}`};
  }
`;

/** 내부 컨테이너 — 최대 폭(narrow) 제한 + fadeInUp 등장 */
export const PageInner = styled.div`
  max-width: ${({ theme }) => theme.layout.contentNarrow};
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  animation: ${fadeInUp} 0.5s ease forwards;
`;

/** 페이지 헤더 — 제목 + 설명 묶음 */
export const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

/** 페이지 제목 — gradientShift 텍스트 믹스인 */
export const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.text3xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  margin: 0;
  ${gradientText}
`;

/** 페이지 부제 */
export const Desc = styled.p`
  font-size: ${({ theme }) => theme.typography.textBase};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

/** 탭 네비게이션 — 하단 border 라인 */
export const Tabs = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderDefault};
  padding-bottom: 0;

  /*
   * 모바일에서 탭 4~5개가 한 줄에 안 들어가면 줄바꿈 대신 가로 스크롤로 처리.
   * (줄바꿈되면 활성 탭 하단 바와 border-bottom 정렬이 흐트러짐)
   */
  ${media.tablet} {
    overflow-x: auto;
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
    &::-webkit-scrollbar { display: none; }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

/**
 * 탭 버튼.
 * $active: true 일 때 gradient 하단 바 + 글로우 활성화.
 * border-image 사용 시 border-radius가 적용되지 않으므로 상단 radius만 적용.
 */
export const Tab = styled.button`
  /* 가로 스크롤 환경에서 줄어들지 않도록 고정 */
  flex-shrink: 0;
  white-space: nowrap;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme, $active }) =>
    $active ? theme.typography.fontSemibold : theme.typography.fontMedium};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.primary : theme.colors.textSecondary};
  background: none;
  border: none;
  /* 활성 탭: gradient border-image 3px 하단 바 */
  border-bottom: ${({ $active }) => ($active ? '3px solid' : '3px solid transparent')};
  border-image: ${({ theme, $active }) =>
    $active ? `${theme.gradients.primary} 1` : 'none'};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  margin-bottom: -1px;
  border-radius: ${({ theme }) => theme.radius.md} ${({ theme }) => theme.radius.md} 0 0;
  /* 활성 탭 글로우 */
  text-shadow: ${({ $active, theme }) =>
    $active ? theme.shadows.glow : 'none'};

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
    background-color: ${({ theme }) => theme.colors.bgTertiary};
  }
`;

/** 탭 콘텐츠 영역 — key 변경 시 fadeIn 재실행 */
export const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  animation: ${fadeIn} 0.3s ease-out;
`;

/**
 * 카테고리 필터 칩 행 — 게시글 탭 본문 상단.
 *
 * 가로 스크롤 가능 (모바일에서 칩이 화면 폭을 넘기면 자연스럽게 스크롤).
 * 칩 사이 간격은 spacing.sm 으로 적당히 좁게.
 */
export const CategoryChipRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
  padding: ${({ theme }) => `${theme.spacing.xs} 0`};

  ${media.tablet} {
    flex-wrap: nowrap;
    overflow-x: auto;
    /* 가로 스크롤바 숨김 (모바일 친화) */
    &::-webkit-scrollbar { display: none; }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

/**
 * 카테고리 필터 칩 (단일 버튼).
 *
 * - 비활성: 투명 배경 + 보더 + secondary 텍스트
 * - 활성:   gradient 배경 + 흰색 텍스트 + 글로우
 * - 호버:   bgElevated 배경 + primary 색 텍스트
 *
 * `$active` 는 transient prop 으로 DOM 에 누설되지 않음.
 */
export const CategoryChip = styled.button`
  flex-shrink: 0;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  background: ${({ $active, theme }) =>
    $active ? theme.gradients.primary : 'transparent'};
  color: ${({ $active, theme }) =>
    $active ? 'white' : theme.colors.textSecondary};
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? 'transparent' : theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  white-space: nowrap;
  transition: all ${({ theme }) => theme.transitions.fast};
  ${({ $active, theme }) =>
    $active &&
    `box-shadow: ${theme.glows.primary};`}

  &:hover {
    color: ${({ $active, theme }) =>
      $active ? 'white' : theme.colors.primary};
    background: ${({ $active, theme }) =>
      $active ? theme.gradients.primary : theme.colors.bgElevated};
    border-color: ${({ $active, theme }) =>
      $active ? 'transparent' : theme.colors.primary};
  }
`;

/**
 * 게시글 작성 버튼이 위치하는 행.
 *
 * 본문(탭 콘텐츠) 안 PostList 위쪽에 우측 정렬되며,
 * 모바일에서는 풀너비 버튼이 되도록 align-self 가 stretch 로 전환된다.
 */
export const WriteButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;

  ${media.tablet} {
    justify-content: stretch;
  }
`;

/**
 * 본문 내 게시글 작성 버튼 — v2 개편으로 우하단 FAB 를 대체.
 *
 * - gradient 배경 + 명확한 라벨("게시글 작성") + 연필 이모지 아이콘
 * - 데스크톱: 우측 정렬 + 자동 너비
 * - 모바일:   풀너비 + 큰 터치 타깃
 */
export const WriteButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  background: ${({ theme }) => theme.gradients.primary};
  color: white;
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows.md};
  transition: all ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.lg}, ${({ theme }) => theme.glows.primary};
  }

  &:active {
    transform: translateY(0);
  }

  ${media.tablet} {
    width: 100%;
    padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
    font-size: ${({ theme }) => theme.typography.textLg};
  }
`;

/** 게시글 작성 버튼 좌측 아이콘 (이모지) — 텍스트와 시각적 구분만 위한 장식 */
export const WriteIcon = styled.span`
  font-size: 1.1em;
  line-height: 1;
`;

/**
 * 비로그인 사용자에게 노출되는 안내 행.
 *
 * 작성 버튼 자리에 대신 표시되며, "로그인 후 작성 가능" 메시지로
 * 사용자가 작성 옵션이 사라진 이유를 한눈에 알 수 있도록 한다.
 */
export const LoginPromptRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px dashed ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
  background-color: ${({ theme }) => theme.colors.bgElevated};
`;

export const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

export const PageBtn = styled.button`
  min-width: 36px;
  height: 36px;
  padding: 0 ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.borderDefault};
  background: ${({ $active, theme }) =>
    $active ? theme.gradients.primary : 'transparent'};
  color: ${({ $active, theme }) =>
    $active ? '#fff' : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
export const SearchForm = styled.form`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const SearchInput = styled.input`
  flex: 1;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background: ${({ theme }) => theme.glass.bg};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textSm};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

export const SearchBtn = styled.button`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background: ${({ theme }) => theme.gradients.primary};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.textBase};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;