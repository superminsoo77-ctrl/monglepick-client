/**
 * PostList 컴포넌트 styled-components 스타일 정의.
 *
 * glass-card 게시글 카드 + 좌측 gradient border (4px, 카테고리별 색상) +
 * hover shine 효과 + 스켈레톤 로딩 아이템.
 *
 * 동적 prop:
 *   Item의 $category: 'review' | 'question' | 'free' | undefined
 *     → 좌측 4px border-left 색상 결정
 *   CategoryBadge의 $category: 동일
 *     → 배지 배경/텍스트 색상 결정
 *
 * BEM → styled 매핑:
 *   .post-list               → Wrapper
 *   .post-list__item         → Item  ($category prop)
 *   .post-list__link         → ItemLink
 *   .post-list__item-header  → ItemHeader
 *   .post-list__category     → CategoryBadge  ($category prop)
 *   .post-list__time         → PostTime
 *   .post-list__title        → PostTitle
 *   .post-list__preview      → Preview
 *   .post-list__meta         → Meta
 *   .post-list__author       → Author
 *   .post-list__stats        → Stats
 *   .post-list__stat         → Stat
 *   .post-list__skeleton     → SkeletonItem
 */

import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { cardShine } from '../../../shared/styles/animations';

/** 카테고리별 좌측 border-left 색상 반환 헬퍼 */
const categoryBorderColor = ({ theme, $category }) => {
  switch ($category) {
    case 'review':   return theme.colors.primary;
    case 'question': return theme.colors.info;
    case 'free':     return theme.colors.success;
    default:         return theme.colors.borderDefault;
  }
};

/** 카테고리 배지 배경색 반환 헬퍼 */
const categoryBadgeBg = ({ theme, $category }) => {
  switch ($category) {
    case 'review':   return theme.colors.primaryLight;
    case 'question': return theme.colors.infoBg;
    case 'free':     return theme.colors.successBg;
    default:         return theme.colors.bgElevated;
  }
};

/** 카테고리 배지 텍스트색 반환 헬퍼 */
const categoryBadgeColor = ({ theme, $category }) => {
  switch ($category) {
    case 'review':   return theme.colors.primary;
    case 'question': return theme.colors.info;
    case 'free':     return theme.colors.success;
    default:         return theme.colors.textSecondary;
  }
};

/** 게시글 목록 컨테이너 */
export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/**
 * 게시글 아이템 — glass-card + 좌측 4px 카테고리 border + shine 호버.
 * $category transient prop으로 DOM 전달 차단.
 */
export const Item = styled.article`
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: blur(8px) saturate(1.4);
  -webkit-backdrop-filter: blur(8px) saturate(1.4);
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  /* 좌측 카테고리 컬러 바 — border shorthand 이후 덮어씀 */
  border-left: 4px solid ${categoryBorderColor};
  transition: all ${({ theme }) => theme.transitions.fast};
  position: relative;
  overflow: hidden;

  /* hover shine 효과 — 좌→우 광선 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.03),
      transparent
    );
    pointer-events: none;
  }

  &:hover::before {
    animation: ${cardShine} 0.8s ease forwards;
  }

  &:hover {
    border-color: ${({ theme }) => theme.glass.border};
    background: ${({ theme }) => theme.glass.bg};
    transform: translateX(4px);
    box-shadow: ${({ theme }) => theme.shadows.glow};
  }
`;

/** 링크 — 아이템 전체 영역 클릭 가능 */
export const ItemLink = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};
  text-decoration: none;
  color: inherit;
`;

/** 아이템 헤더 — 카테고리 배지 + 작성 시간 가로 배치 */
export const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

/**
 * 카테고리 배지.
 * $category transient prop에 따라 배경/텍스트 색상 변환.
 */
export const CategoryBadge = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  padding: 2px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${categoryBadgeBg};
  color: ${categoryBadgeColor};
`;

/** 작성 시간 */
export const PostTime = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/** 게시글 제목 */
export const PostTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
  line-height: ${({ theme }) => theme.typography.leadingTight};
`;

/** 내용 미리보기 */
export const Preview = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.leadingNormal};
  margin: 0;
`;

/** 하단 메타 정보 — 작성자 + 통계 가로 배치 */
export const Meta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

/** 작성자 — 아바타 + 닉네임 + 배지 가로 배치 */
export const Author = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  min-width: 0;
`;

/** 작성자 아바타 — 20x20 원형. 프로필 이미지 또는 장착 아바타가 있을 때 노출. */
export const AuthorAvatar = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  background: ${({ theme }) => theme.colors.bgElevated};
  flex-shrink: 0;
`;

/** 프로필 이미지 없을 때 이니셜 텍스트 fallback */
export const AuthorInitial = styled.span`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.fontBold};
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  flex-shrink: 0;
  text-transform: uppercase;
`;

/** 작성자 배지 — 14x14 SVG, 닉네임 우측에 살짝 겹치는 chip. */
export const AuthorBadge = styled.img`
  width: 14px;
  height: 14px;
  object-fit: contain;
  flex-shrink: 0;
  margin-left: 2px;
`;

/** 통계(좋아요·댓글) 묶음 */
export const Stats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
`;

/** 개별 통계 수치 */
export const Stat = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/** 스켈레톤 로딩 아이템 */
export const SkeletonItem = styled.div`
  background-color: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radius.lg};
  border-left: 4px solid ${({ theme }) => theme.colors.borderDefault};
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;
