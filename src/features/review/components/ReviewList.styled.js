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

import { Link } from 'react-router-dom';
import styled, { css, keyframes } from 'styled-components';
import { glassCard } from '../../../shared/styles/mixins';

const starPop = keyframes`
  0% { transform: scale(1); }
  40% { transform: scale(1.35); }
  100% { transform: scale(1.15); }
`;

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

/** 마이페이지에서는 리뷰가 어떤 영화에 대한 것인지 링크로 노출한다. */
export const MovieLink = styled(Link)`
  width: fit-content;
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
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

/** 리뷰 본문 행 — 포스터와 텍스트 블록을 옆으로 나란히 배치한다. */
export const ReviewBodyRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
`;

/** 리뷰 제목/본문을 담는 텍스트 영역 */
export const ReviewTextBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;
  flex: 1;
`;

/** 마이페이지용 포스터 썸네일 */
export const ReviewPoster = styled.img`
  width: 72px;
  height: 104px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.glass.border};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  flex-shrink: 0;
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
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

/** 스포일러 리뷰 안내 카드 */
export const SpoilerCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.backgroundSecondary || 'rgba(255,255,255,0.04)'};
  cursor: pointer;
`;

/** 스포일러 안내 문구 */
export const SpoilerBadge = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.warning || theme.colors.primary};
`;

/** 흐리게 가린 리뷰 본문 */
export const SpoilerBlurredText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.leadingRelaxed};
  filter: blur(7px);
  user-select: none;
`;

/** 스포일러 카드 보조 힌트 */
export const SpoilerHint = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
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

/** 수정/삭제/저장 버튼 묶음 */
export const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`;

/** 리뷰 편집 폼 컨테이너 */
export const EditForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/** 리뷰 수정 textarea */
export const EditField = styled.textarea`
  width: 100%;
  min-height: 88px;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textSm};
  resize: vertical;
  box-sizing: border-box;
`;

/** 수정 폼의 평점/스포일러 제어 행 */
export const EditControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

/** 수정 폼 별점 영역 */
export const EditRatingSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const EditStarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

export const EditStarButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ $active, theme }) =>
    $active
      ? (theme.colors.warning || '#f59e0b')
      : (theme.colors.borderDefault || theme.colors.border || '#d1d5db')};
  transition: color 0.15s, transform 0.12s;

  svg {
    width: 28px;
    height: 28px;
    filter: ${({ $active }) =>
      $active ? 'drop-shadow(0 2px 6px rgba(245, 158, 11, 0.35))' : 'none'};
  }

  &:hover {
    transform: scale(1.12);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
    border-radius: 6px;
  }

  ${({ $pop }) =>
    $pop &&
    css`
      animation: ${starPop} 0.28s ease-out;
    `}
`;

export const EditStarLabel = styled.p`
  min-height: 18px;
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ $active, theme }) =>
    $active
      ? (theme.colors.warning || '#f59e0b')
      : (theme.colors.textMuted || theme.colors.textSecondary)};
`;

/** 스포일러 체크박스 라벨 */
export const SpoilerToggleLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
`;

/** 보조 액션 버튼 */
export const SecondaryActionBtn = styled.button`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textXs};
  cursor: pointer;
`;

/** 기본 액션 버튼 */
export const PrimaryActionBtn = styled.button`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary || '#fff'};
  font-size: ${({ theme }) => theme.typography.textXs};
  cursor: pointer;
`;

/** 위험 액션 버튼 */
export const DangerActionBtn = styled.button`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.error};
  background: transparent;
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.textXs};
  cursor: pointer;
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
