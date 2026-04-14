/**
 * "이 영화 어땠나요?" 시청 후 평점 팝업 (Phase 5-2).
 *
 * 시청 기록 추가 성공 후 표시되는 모달로,
 * 사용자에게 별점(1~5)과 한줄 감상을 입력받는다.
 * 수집된 평점은 추천 시스템의 CF/CBF 품질 향상에 직접 기여한다.
 *
 * 2026-04-14 UI/UX 개편:
 *   - 가시성 향상: 오버레이 블러 + 어두운 반투명 배경 + 큰 그림자로 모달 입체감 강화
 *   - 헤더에 ✨ 아이콘 + 제목/부제 강조, 우상단 X 닫기 버튼
 *   - 별점 SVG + 채워진 별/빈 별 구분으로 가독성 향상, hover 시 애니메이션
 *   - 입력 필드 글자수 카운터(최대 200자) + 포커스 시 primary 색 링
 *   - CTA 버튼은 primary gradient, 보조 버튼은 ghost 스타일로 시각적 위계 확립
 *   - fadeIn + slideUp 진입 애니메이션, ESC 키로 닫기 지원
 *
 * Props:
 *   isOpen      — 모달 표시 여부
 *   movieTitle  — 영화 제목 (모달 헤더 표시용)
 *   movieId     — 영화 ID (이벤트 추적용)
 *   onSubmit    — 제출 콜백 (rating, comment, isSpoiler) => void
 *   onClose     — 닫기/건너뛰기 콜백
 */

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes, css } from 'styled-components';
import { trackEvent } from '../../../shared/utils/eventTracker';

/* ── 애니메이션 ── */

/** 오버레이 페이드인 */
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

/** 모달 슬라이드업 + 페이드인 (진입 강조) */
const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

/** 별점 선택 시 팝 애니메이션 */
const starPop = keyframes`
  0% { transform: scale(1); }
  40% { transform: scale(1.35); }
  100% { transform: scale(1.15); }
`;

/* ── 스타일 ── */

/** 전체 화면 덮는 반투명 오버레이 — 블러로 뒤 배경 흐리게 */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(10, 12, 20, 0.62);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  animation: ${fadeIn} 0.18s ease-out;
`;

/** 모달 본체 — 넉넉한 padding + 입체감 있는 그림자 */
const Modal = styled.div`
  position: relative;
  width: 100%;
  max-width: 440px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding: 28px 28px 24px;
  border-radius: ${({ theme }) => theme.radius.lg || '16px'};
  background: ${({ theme }) => theme.colors.bgCard || theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault || theme.colors.border};
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.45),
    0 2px 8px rgba(0, 0, 0, 0.2);
  animation: ${slideUp} 0.22s cubic-bezier(0.16, 1, 0.3, 1);

  /* 모바일(≤480px) — 폭 100% 활용 */
  @media (max-width: 480px) {
    padding: 22px 20px 20px;
    border-radius: 14px;
  }
`;

/** 우상단 닫기 버튼 */
const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted || theme.colors.textSecondary};
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.bgTertiary || 'rgba(0,0,0,0.06)'};
    color: ${({ theme }) => theme.colors.textPrimary || theme.colors.text};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

/** 헤더 영역 — ✨ 아이콘 + 제목 + 영화명 부제 */
const Header = styled.div`
  text-align: center;
  margin-bottom: 18px;
`;

const HeaderIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: 10px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primaryLight || 'rgba(99,102,241,0.12)'};
  font-size: 22px;
  line-height: 1;
`;

const Title = styled.h3`
  margin: 0 0 4px;
  font-size: 1.15rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary || theme.colors.text};
  letter-spacing: -0.01em;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 0.88rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.45;
  /* 긴 영화 제목도 2줄 이내로 표시 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/** 별점 영역 */
const StarSection = styled.div`
  margin: 20px 0 14px;
`;

const StarRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 8px;
`;

const StarButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ $active, theme }) =>
    $active ? (theme.colors.warning || '#f59e0b') : (theme.colors.borderDefault || theme.colors.border || '#d1d5db')};
  transition: color 0.15s, transform 0.12s;

  svg {
    width: 34px;
    height: 34px;
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

/** 별점 라벨 — 선택한 점수에 따라 텍스트 표시 */
const StarLabel = styled.p`
  min-height: 18px;
  margin: 0;
  text-align: center;
  font-size: 0.82rem;
  font-weight: 500;
  color: ${({ $active, theme }) =>
    $active ? (theme.colors.warning || '#f59e0b') : theme.colors.textMuted || theme.colors.textSecondary};
  transition: color 0.15s;
`;

/** 한줄 감상 입력 영역 */
const CommentWrapper = styled.div`
  position: relative;
  margin-top: 4px;
`;

const CommentInput = styled.textarea`
  width: 100%;
  min-height: 72px;
  max-height: 140px;
  padding: 12px 14px 22px;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault || theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md || '10px'};
  background: ${({ theme }) => theme.colors.bgMain || theme.colors.background};
  color: ${({ theme }) => theme.colors.textPrimary || theme.colors.text};
  font-size: 0.9rem;
  line-height: 1.5;
  font-family: inherit;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted || theme.colors.textSecondary};
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary}66;
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}22;
  }
`;

/** 입력 우하단 글자수 카운터 */
const CharCount = styled.span`
  position: absolute;
  right: 10px;
  bottom: 8px;
  font-size: 0.7rem;
  color: ${({ $over, theme }) =>
    $over ? (theme.colors.danger || '#ef4444') : (theme.colors.textMuted || theme.colors.textSecondary)};
  pointer-events: none;
  user-select: none;
`;

/** 스포일러 체크박스 행 */
const SpoilerToggleRow = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.sm || '8px'};
  background: ${({ theme }) => theme.colors.bgTertiary || 'rgba(0,0,0,0.04)'};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.82rem;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.bgSecondary || 'rgba(0,0,0,0.06)'};
  }
`;

const SpoilerToggleInput = styled.input`
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
`;

const SpoilerLabel = styled.span`
  flex: 1;
  user-select: none;
`;

/** 버튼 영역 */
const ButtonRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

/** 건너뛰기 — ghost 스타일 (보조) */
const SkipButton = styled.button`
  flex: 1;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault || theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md || '10px'};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.92rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.bgTertiary || 'rgba(0,0,0,0.04)'};
    color: ${({ theme }) => theme.colors.textPrimary || theme.colors.text};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

/** 제출 — primary gradient (CTA) */
const SubmitButton = styled.button`
  flex: 1.4;
  padding: 12px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md || '10px'};
  background: ${({ disabled, theme }) =>
    disabled
      ? (theme.colors.borderDefault || theme.colors.border || '#d1d5db')
      : `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryHover || theme.colors.primary} 100%)`};
  color: #fff;
  font-size: 0.94rem;
  font-weight: 600;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.65 : 1)};
  box-shadow: ${({ disabled, theme }) =>
    disabled ? 'none' : `0 4px 12px ${theme.colors.primary}55`};
  transition: transform 0.12s, box-shadow 0.2s, opacity 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => `0 6px 16px ${theme.colors.primary}66`};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

/* ── 상수 ── */

/** 한줄 감상 최대 글자수 */
const MAX_COMMENT_LENGTH = 200;

/** 별점별 라벨 (1~5) */
const RATING_LABELS = [
  '',
  '별로예요',
  '아쉬워요',
  '괜찮아요',
  '좋아요',
  '최고예요!',
];

/** 채워진 별 SVG */
const StarFilledIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

/** 빈 별 SVG */
const StarEmptyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

/* ── 컴포넌트 ── */

export default function PostWatchFeedback({ isOpen, movieTitle, movieId, onSubmit, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  /* 별점 클릭 시 팝 애니메이션 트리거용 (마지막 클릭된 별 인덱스) */
  const [poppedStar, setPoppedStar] = useState(0);

  /**
   * 모달이 닫힐 때 내부 상태 초기화 — 다음 열림 시 깨끗한 상태로 시작.
   *
   * NOTE: React Compiler 의 `react-hooks/set-state-in-effect` 규칙은 일반적으로
   * effect 내부의 setState 동기 호출을 금지하지만, 모달 close 시 입력값 리셋은
   * 외부 prop(isOpen) 동기화 패턴으로 정당한 사용이다.
   * 부모 측 `key` 리마운트 패턴은 형제 모달들과 통일되지 않아 적용하지 않았다.
   */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setHoveredStar(0);
      setComment('');
      setIsSpoiler(false);
      setPoppedStar(0);
    }
  }, [isOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /** ESC 키로 닫기 + body 스크롤 잠금 */
  useEffect(() => {
    if (!isOpen) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  /** 별 클릭 — 점수 설정 + 팝 애니메이션 트리거 */
  const handleStarClick = useCallback((star) => {
    setRating(star);
    setPoppedStar(star);
    /* 같은 별을 다시 클릭해도 애니메이션이 재실행되도록 key 기반 리셋 */
    setTimeout(() => setPoppedStar(0), 280);
  }, []);

  /** 제출 핸들러 */
  const handleSubmit = useCallback(() => {
    if (rating === 0) return;
    trackEvent('post_watch_rating', movieId, {
      rating,
      has_comment: comment.trim().length > 0,
      is_spoiler: isSpoiler,
    });
    onSubmit(rating, comment.trim() || null, isSpoiler);
  }, [rating, comment, isSpoiler, movieId, onSubmit]);

  /** 건너뛰기 핸들러 */
  const handleSkip = useCallback(() => {
    trackEvent('post_watch_skip', movieId);
    onClose();
  }, [movieId, onClose]);

  /** 오버레이 클릭으로 닫기 — 모달 내부 클릭은 버블링 차단 불필요 (target 체크) */
  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) handleSkip();
    },
    [handleSkip],
  );

  if (!isOpen) return null;

  /* 현재 hover 중이면 hover 점수, 아니면 선택 점수로 라벨/채움 결정 */
  const displayStar = hoveredStar || rating;
  const commentOver = comment.length > MAX_COMMENT_LENGTH;

  /* document.body 로 포털 — 부모의 overflow:hidden / transform 영향 차단 */
  return createPortal(
    <Overlay onClick={handleOverlayClick}>
      <Modal role="dialog" aria-modal="true" aria-labelledby="post-watch-title">
        {/* 우상단 닫기 */}
        <CloseButton type="button" onClick={handleSkip} aria-label="닫기">
          ✕
        </CloseButton>

        {/* 헤더 */}
        <Header>
          <HeaderIcon aria-hidden="true">✨</HeaderIcon>
          <Title id="post-watch-title">이 영화 어떠셨어요?</Title>
          <Subtitle>{movieTitle}</Subtitle>
        </Header>

        {/* 별점 */}
        <StarSection>
          <StarRow role="radiogroup" aria-label="별점 선택">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = star <= displayStar;
              return (
                <StarButton
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={rating === star}
                  aria-label={`${star}점`}
                  $active={active}
                  $pop={poppedStar === star}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => handleStarClick(star)}
                >
                  {active ? <StarFilledIcon /> : <StarEmptyIcon />}
                </StarButton>
              );
            })}
          </StarRow>
          <StarLabel $active={displayStar > 0}>
            {displayStar > 0 ? RATING_LABELS[displayStar] : '별점을 선택해 주세요'}
          </StarLabel>
        </StarSection>

        {/* 한줄 감상 */}
        <CommentWrapper>
          <CommentInput
            placeholder="한줄 감상을 남겨주세요 (선택)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={MAX_COMMENT_LENGTH + 20} /* 초과 입력 방지용 여유 — 실제 제한은 UI 에서 */
          />
          <CharCount $over={commentOver}>
            {comment.length}/{MAX_COMMENT_LENGTH}
          </CharCount>
        </CommentWrapper>

        {/* 스포일러 체크 */}
        <SpoilerToggleRow>
          <SpoilerToggleInput
            type="checkbox"
            checked={isSpoiler}
            onChange={(e) => setIsSpoiler(e.target.checked)}
          />
          <SpoilerLabel>⚠️ 스포일러가 포함되어 있어요</SpoilerLabel>
        </SpoilerToggleRow>

        {/* 버튼 */}
        <ButtonRow>
          <SkipButton type="button" onClick={handleSkip}>
            건너뛰기
          </SkipButton>
          <SubmitButton
            type="button"
            disabled={rating === 0 || commentOver}
            onClick={handleSubmit}
          >
            {rating === 0 ? '별점을 선택하세요' : '리뷰 남기기'}
          </SubmitButton>
        </ButtonRow>
      </Modal>
    </Overlay>,
    document.body,
  );
}
