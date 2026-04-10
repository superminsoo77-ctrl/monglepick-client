/**
 * "이 영화 어땠나요?" 시청 후 평점 팝업 (Phase 5-2).
 *
 * 시청 기록 추가 성공 후 표시되는 모달로,
 * 사용자에게 별점(1~5)과 한줄 감상을 입력받는다.
 * 수집된 평점은 추천 시스템의 CF/CBF 품질 향상에 직접 기여한다.
 *
 * Props:
 *   isOpen      — 모달 표시 여부
 *   movieTitle  — 영화 제목 (모달 헤더 표시용)
 *   movieId     — 영화 ID (이벤트 추적용)
 *   onSubmit    — 제출 콜백 (rating: number) => void
 *   onClose     — 닫기/건너뛰기 콜백
 */

import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { trackEvent } from '../../../shared/utils/eventTracker';

/* ── 스타일 ── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
`;

const Modal = styled.div`
  width: 90%;
  max-width: 400px;
  padding: 28px 24px;
  border-radius: ${({ theme }) => theme.radius.lg || '12px'};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
`;

const Title = styled.h3`
  margin: 0 0 4px;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text};
`;

const Subtitle = styled.p`
  margin: 0 0 20px;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const StarRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
`;

const Star = styled.button`
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: ${({ $active, theme }) =>
    $active ? (theme.colors.warning || '#f59e0b') : (theme.colors.border || '#d1d5db')};
  transition: color 0.15s, transform 0.15s;

  &:hover {
    transform: scale(1.2);
  }
`;

const CommentInput = styled.textarea`
  width: 100%;
  height: 60px;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm || '6px'};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.85rem;
  resize: none;
  outline: none;
  box-sizing: border-box;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SpoilerToggleRow = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.85rem;
  cursor: pointer;
`;

const SpoilerToggleInput = styled.input`
  margin: 0;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 16px;
`;

const SubmitButton = styled.button`
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm || '6px'};
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  transition: opacity 0.2s;
`;

const SkipButton = styled.button`
  flex: 1;
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm || '6px'};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.9rem;
  cursor: pointer;
`;

/* ── 컴포넌트 ── */

export default function PostWatchFeedback({ isOpen, movieTitle, movieId, onSubmit, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);

  /** 제출 핸들러 */
  const handleSubmit = useCallback(() => {
    if (rating === 0) return;
    trackEvent('post_watch_rating', movieId, {
      rating,
      has_comment: comment.trim().length > 0,
      is_spoiler: isSpoiler,
    });
    onSubmit(rating, comment.trim() || null, isSpoiler);
    // 상태 초기화
    setRating(0);
    setComment('');
    setIsSpoiler(false);
  }, [rating, comment, isSpoiler, movieId, onSubmit]);

  /** 건너뛰기 핸들러 */
  const handleSkip = useCallback(() => {
    trackEvent('post_watch_skip', movieId);
    setRating(0);
    setComment('');
    setIsSpoiler(false);
    onClose();
  }, [movieId, onClose]);

  /** 오버레이 클릭으로 닫기 */
  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) handleSkip();
  }, [handleSkip]);

  if (!isOpen) return null;

  return (
    <Overlay onClick={handleOverlayClick}>
      <Modal>
        <Title>이 영화 어땠나요?</Title>
        <Subtitle>{movieTitle}</Subtitle>

        {/* 별점 선택 (1~5) */}
        <StarRow>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              type="button"
              $active={star <= (hoveredStar || rating)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setRating(star)}
            >
              ★
            </Star>
          ))}
        </StarRow>

        {/* 한줄 감상 (선택) */}
        <CommentInput
          placeholder="한줄 감상을 남겨주세요 (선택)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        {/* 스포일러 여부는 사용자가 직접 체크해서 저장한다. */}
        <SpoilerToggleRow>
          <SpoilerToggleInput
            type="checkbox"
            checked={isSpoiler}
            onChange={(e) => setIsSpoiler(e.target.checked)}
          />
          <span>스포일러가 포함된 리뷰입니다</span>
        </SpoilerToggleRow>

        {/* 버튼 */}
        <ButtonRow>
          <SkipButton type="button" onClick={handleSkip}>
            건너뛰기
          </SkipButton>
          <SubmitButton type="button" disabled={rating === 0} onClick={handleSubmit}>
            평점 남기기
          </SubmitButton>
        </ButtonRow>
      </Modal>
    </Overlay>
  );
}
