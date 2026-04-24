/**
 * FaqTab 컴포넌트 styled-components 정의.
 *
 * FaqTab.css의 모든 규칙을 styled-components로 이관한다.
 * BEM 클래스(.faq-tab__*) → 개별 컴포넌트(S.SearchBar, S.List, S.Item 등)로 매핑.
 * SupportPage가 소유하는 공통 클래스(.support-page__section 등)는
 * JSX에서 S.Wrapper(section)로 대체하고, 해당 스타일은 SupportPage.css에 그대로 유지한다.
 *
 * $isOpen — transient prop (DOM에 전달하지 않음)
 *   - true 이면 토글 화살표를 180° 회전시킨다.
 *
 * $selected — transient prop (DOM에 전달하지 않음)
 *   - true 이면 피드백 버튼에 primary 배경을 적용한다.
 *
 * 공유 리소스:
 *   - media.js : media.tablet, media.mobile
 *
 * supportFadeIn — SupportPage.css에만 정의된 로컬 keyframe이므로
 *   여기서 keyframes 헬퍼로 새로 정의한다.
 */

import styled, { keyframes } from 'styled-components';
import { media } from '../../../shared/styles/media';

/* ── 섹션 레이아웃 ── */

export const SectionWrapper = styled.section`
  /* 기본 구조만 담당 — 패딩은 부모(SupportPage)가 관리 */
`;

export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
`;

export const CategoryTabs = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;

  ${media.tablet} {
    overflow-x: auto;
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }
`;

export const CategoryTab = styled.button`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background: ${({ $isActive, theme }) =>
    $isActive ? theme.gradients.primary : theme.colors.bgCard};
  border: 1px solid ${({ $isActive, theme }) =>
    $isActive ? 'transparent' : theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.full};
  color: ${({ $isActive, theme }) =>
    $isActive ? 'white' : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  box-shadow: ${({ $isActive, theme }) => $isActive ? theme.glows.primary : 'none'};
  flex-shrink: 0;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

export const Empty = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const EmptyIcon = styled.div`
  font-size: ${({ theme }) => theme.typography.text4xl};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  opacity: 0.5;
`;

export const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.textBase};
  margin: 0;
`;

/**
 * FAQ 답변 패널 등장 애니메이션.
 * SupportPage.css의 @keyframes supportFadeIn 을 그대로 포팅한다.
 * (아래에서 위로 4px 이동하며 opacity 0 → 1)
 */
const supportFadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

/* ── 검색 바 ── */

/**
 * 검색 바 컨테이너 — 검색 아이콘을 절대 위치로 품는 상대 위치 블록.
 */
export const SearchBar = styled.div`
  position: relative;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

/**
 * 검색 아이콘 — 입력 필드 왼쪽에 절대 위치.
 */
export const SearchIcon = styled.span`
  position: absolute;
  left: ${({ theme }) => theme.spacing.sm};
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textLg};
  pointer-events: none;
`;

/**
 * 검색 입력 필드.
 * 왼쪽 패딩을 xl로 설정해 아이콘이 텍스트와 겹치지 않도록 한다.
 * 포커스 시 primary 테두리 + glow 효과를 적용한다.
 */
export const SearchInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.sm}
    ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.xl};
  background-color: ${({ theme }) => theme.colors.bgInput};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textBase};
  outline: none;
  transition: border-color ${({ theme }) => theme.transitions.fast};
  box-sizing: border-box;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.glows.primary};
  }
`;

/* ── FAQ 아코디언 ── */

/**
 * FAQ 아이템 목록 컨테이너.
 */
export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/**
 * 개별 FAQ 아이템 — glass-card, hover 시 보더 강조.
 */
export const Item = styled.div`
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: blur(8px) saturate(1.4);
  -webkit-backdrop-filter: blur(8px) saturate(1.4);
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
  transition: border-color ${({ theme }) => theme.transitions.base},
    box-shadow ${({ theme }) => theme.transitions.base};

  &:hover {
    border-color: ${({ theme }) => theme.glass.border};
    box-shadow: ${({ theme }) => theme.shadows.glow};
  }
`;

/**
 * FAQ 질문 버튼 (아코디언 헤더).
 * 전체 너비를 차지하며 배지 / 질문 텍스트 / 토글 화살표를 가로로 배치한다.
 * hover 시 elevated 배경색으로 강조.
 */
export const Question = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  text-align: left;
  cursor: pointer;
  gap: ${({ theme }) => theme.spacing.sm};

  &:hover {
    background-color: ${({ theme }) => theme.colors.bgElevated};
  }

  ${media.tablet} {
    padding: ${({ theme }) => theme.spacing.sm};
    font-size: ${({ theme }) => theme.typography.textSm};
  }
`;

/**
 * 카테고리 배지 — primary 계열 pill 형태.
 * 모바일(480px 이하)에서는 숨겨서 레이아웃을 단순화한다.
 */
export const CategoryBadge = styled.span`
  flex-shrink: 0;
  padding: 2px ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontMedium};

  ${media.mobile} {
    display: none;
  }
`;

/**
 * 질문 본문 텍스트 — 남은 공간을 모두 차지.
 */
export const QuestionText = styled.span`
  flex: 1;
  line-height: ${({ theme }) => theme.typography.leadingNormal};
`;

/**
 * 토글 화살표 아이콘.
 *
 * $isOpen 이 true 이면 180° 회전하여 닫힘 상태를 표시한다.
 */
export const Toggle = styled.span`
  flex-shrink: 0;
  font-size: ${({ theme }) => theme.typography.textLg};
  color: ${({ theme }) => theme.colors.textMuted};
  transition: transform ${({ theme }) => theme.transitions.fast};
  transform: ${({ $isOpen }) => ($isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
`;

/**
 * FAQ 답변 패널 — 아코디언 열림 시 supportFadeIn 애니메이션으로 등장.
 */
export const Answer = styled.div`
  padding: 0 ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.md};
  animation: ${supportFadeIn} 0.2s ease;

  ${media.tablet} {
    padding: 0 ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.sm};
  }
`;

/**
 * 답변 본문 텍스트.
 * white-space: pre-line 으로 줄바꿈을 그대로 표현한다.
 */
export const AnswerText = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: ${({ theme }) => theme.typography.leadingRelaxed};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
  white-space: pre-line;
`;

/* ── 피드백 영역 ── */

/**
 * 피드백 버튼 행 — "도움이 되었나요?" 라벨 + 버튼 두 개.
 */
export const Feedback = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.borderDefault};
`;

/**
 * 피드백 라벨 텍스트.
 */
export const FeedbackLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/**
 * 피드백 버튼 (좋아요 / 싫어요).
 *
 * $selected 가 true 이면 primary 배경색으로 선택 상태를 표시한다.
 * hover 시 primary 테두리 + 텍스트 색상으로 강조.
 * 비활성(이미 투표 / 로딩 중) 상태에서는 불투명도를 낮춘다.
 */
export const FeedbackBtn = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.primaryLight : 'none'};
  border: 1px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.primary : theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ $selected, theme }) =>
    $selected ? theme.colors.primary : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textXs};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * 피드백 제출 완료 후 노출되는 감사 메시지.
 *
 * 버튼(네/아니요)을 완전히 대체해 "피드백을 해주셔서 감사합니다!" 텍스트를 표시한다.
 * 리워드 정책 FAQ_FEEDBACK 으로 1회당 3P (등급 배율 적용), 일일 5회까지 자동 지급되므로
 * UX 상 포인트 지급 여부는 명시하지 않고 감사 인사만 노출 (서버가 한도 초과 시 조용히 skip).
 */
export const FeedbackThanks = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;
