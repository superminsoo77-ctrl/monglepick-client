/**
 * ReviewList 컴포넌트 styled-components 스타일 정의.
 *
 * 다크 테마 리뷰 리스트 — glass-card 아이템 + 별점 글로우 + 좋아요 버튼.
 *
 * BEM → styled 매핑:
 *   .review-list             → Wrapper
 *   .review-list__item       → Item
 *   .review-list__header     → ItemHeader
 *   .review-list__author-info → AuthorInfo
 *   .review-list__avatar     → Avatar
 *   .review-list__author-name → AuthorName
 *   .review-list__time       → Time
 *   .review-list__rating     → Rating
 *   .review-list__stars      → Stars
 *   .review-list__score      → Score
 *   .review-list__content    → Content
 *   .review-list__footer     → Footer
 *   .review-list__like-btn   → LikeBtn
 *   .review-list__empty      → Empty
 *   .review-list__empty-text → EmptyText
 *   .review-list__empty-hint → EmptyHint
 */

import styled from 'styled-components';
import { glassCard } from '../../../shared/styles/mixins';

/** 리뷰 목록 컨테이너 */
export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

/** 리뷰 아이템 — glass-card 믹스인 + hover border/glow */
export const Item = styled.article`
  ${glassCard}
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  transition: border-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.glass.border};
    box-shadow: ${({ theme }) => theme.shadows.glow};
  }
`;

/** 리뷰 헤더 — 작성자 정보 + 평점 가로 배치 */
export const ItemHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`;

/** 작성자 정보 묶음 — 아바타 + 이름/시간 */
export const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/** 작성자 아바타 — 이니셜 표시 원형 뱃지 */
export const Avatar = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  font-size: ${({ theme }) => theme.typography.textSm};
  flex-shrink: 0;
`;

/** 작성자 닉네임 */
export const AuthorName = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

/** 작성 시간 */
export const Time = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/** 평점 영역 — 별 + 점수 가로 배치 */
export const Rating = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-shrink: 0;
`;

/** 별점 — 노란 글로우 */
export const Stars = styled.span`
  color: ${({ theme }) => theme.colors.starFilled};
  font-size: ${({ theme }) => theme.typography.textSm};
  letter-spacing: 1px;
  text-shadow: 0 0 8px rgba(251, 191, 36, 0.3);
`;

/** 평점 숫자 */
export const Score = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

/** 리뷰 본문 */
export const ReviewContent = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.leadingRelaxed};
  margin: 0;
`;

/** 하단 영역 — 좋아요 버튼 등 */
export const Footer = styled.div`
  display: flex;
  align-items: center;
`;

/**
 * 좋아요 버튼 — 인스타그램 스타일 하트 토글.
 *
 * $liked prop (transient — DOM에 전달되지 않음):
 *   - true  → error 색상 테두리·배경·텍스트 (채워진 하트 ♥)
 *   - false → 투명 배경·테두리 없음·muted 텍스트 (빈 하트 ♡)
 *
 * :active 시 scale(0.85) 팝 애니메이션으로 터치감을 준다.
 * :disabled 시 opacity 0.6 + cursor default으로 비활성 상태를 표현한다.
 */
export const LikeBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: ${({ theme }) => theme.typography.textXs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme, $liked }) =>
    $liked ? theme.colors.error : 'transparent'};
  background: ${({ theme, $liked }) =>
    $liked ? theme.colors.errorBg : 'none'};
  color: ${({ theme, $liked }) =>
    $liked ? theme.colors.error : theme.colors.textMuted};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  /* 클릭 시 팝 애니메이션 */
  &:active {
    transform: scale(0.85);
  }

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.error};
    background-color: ${({ theme }) => theme.colors.errorBg};
    border-color: ${({ theme }) => theme.colors.error};
  }

  /* 미인증 / movieId 없음 — 비활성 상태 */
  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
`;

/** 빈 상태 컨테이너 */
export const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xxl};
  gap: ${({ theme }) => theme.spacing.sm};
`;

/** 빈 상태 주요 텍스트 */
export const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.textBase};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

/** 빈 상태 보조 힌트 */
export const EmptyHint = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`;
