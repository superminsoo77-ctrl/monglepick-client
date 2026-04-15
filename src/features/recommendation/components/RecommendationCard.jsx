/**
 * 추천 영화 카드 컴포넌트.
 *
 * AI가 추천한 영화의 정보를 표시하며,
 * 찜/봤어요 토글과 만족도 피드백 기능을 제공한다.
 *
 * @param {Object} recommendation - 추천 데이터
 * @param {function} onToggleWishlist - 찜 토글 콜백
 * @param {function} onToggleWatched - 봤어요 토글 콜백
 * @param {function} onSubmitFeedback - 피드백 제출 콜백
 * @param {function} onClickMovie - 영화 클릭 시 상세 이동 콜백
 */

import { useState } from 'react';
import * as S from './RecommendationCard.styled';

/** TMDB 포스터 기본 URL */
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200';

export default function RecommendationCard({
  recommendation,
  onToggleWishlist,
  onToggleWatched,
  onSubmitFeedback,
  onClickMovie,
}) {
  /* 피드백 폼 표시 상태 */
  const [showFeedback, setShowFeedback] = useState(false);
  /* 별점 (1~5) */
  const [rating, setRating] = useState(recommendation.feedbackRating || 0);
  /* 코멘트 */
  const [comment, setComment] = useState(recommendation.feedbackComment || '');
  /* 제출 중 */
  const [isSubmitting, setIsSubmitting] = useState(false);

  const movie = recommendation.movie || recommendation;

  /** 포스터 URL 생성 */
  const posterUrl = movie.posterPath
    ? `${TMDB_IMAGE_BASE}${movie.posterPath}`
    : null;

  /** 장르 배열 파싱 */
  const genres = Array.isArray(movie.genres)
    ? movie.genres
    : typeof movie.genres === 'string'
      ? (() => { try { return JSON.parse(movie.genres); } catch { return []; } })()
      : [];

  /** 피드백 제출 핸들러 */
  const handleFeedback = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      await onSubmitFeedback(recommendation.recommendationLogId, { rating, comment });
      setShowFeedback(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  /** 추천 일시 포맷 */
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <S.Card>
      {/* 포스터 */}
      <S.PosterWrapper onClick={() => onClickMovie?.(movie.movieId || movie.id)}>
        {posterUrl ? (
          <S.Poster src={posterUrl} alt={movie.title} loading="lazy" />
        ) : (
          <S.PosterPlaceholder>&#x1F3AC;</S.PosterPlaceholder>
        )}
      </S.PosterWrapper>

      {/* 정보 영역 */}
      <S.Info>
        <S.Title onClick={() => onClickMovie?.(movie.movieId || movie.id)}>
          {movie.title || '제목 없음'}
        </S.Title>

        <S.Meta>
          {movie.releaseYear && `${movie.releaseYear}년`}
          {movie.releaseYear && genres.length > 0 && ' · '}
          {genres.slice(0, 3).join(', ')}
          {movie.rating && ` · ★ ${Number(movie.rating).toFixed(1)}`}
        </S.Meta>

        {/* 추천 이유 — 2026-04-15 정정: Backend RecommendationHistoryResponse 는 `reason` 필드.
            기존 `explanation` 키는 SSE movie_card payload 에서만 사용되는 필드라 마이픽 조회 경로와
            맞지 않아 이유 블록이 항상 숨겨졌었음. 둘 다 지원해 어느 쪽 호출에서도 노출. */}
        {(recommendation.reason || recommendation.explanation) && (
          <S.Explanation>{recommendation.reason || recommendation.explanation}</S.Explanation>
        )}

        {/* 추천 일시 */}
        <S.RecommendedAt>
          {formatDate(recommendation.recommendedAt || recommendation.createdAt)}
        </S.RecommendedAt>

        {/* 액션 버튼 */}
        <S.Actions>
          <S.ActionBtn
            $variant="wishlist"
            $active={recommendation.wishlisted}
            onClick={() => onToggleWishlist(recommendation.recommendationLogId)}
          >
            {recommendation.wishlisted ? '❤️ 찜' : '🤍 찜'}
          </S.ActionBtn>

          <S.ActionBtn
            $variant="watched"
            $active={recommendation.watched}
            onClick={() => onToggleWatched(recommendation.recommendationLogId)}
          >
            {recommendation.watched ? '✅ 봤어요' : '👀 봤어요'}
          </S.ActionBtn>

          <S.ActionBtn
            onClick={() => setShowFeedback(!showFeedback)}
          >
            {recommendation.feedbackRating ? `⭐ ${recommendation.feedbackRating}점` : '💬 평가'}
          </S.ActionBtn>
        </S.Actions>

        {/* 피드백 폼 */}
        {showFeedback && (
          <S.FeedbackForm>
            <S.FeedbackStars>
              {[1, 2, 3, 4, 5].map((star) => (
                <S.StarBtn
                  key={star}
                  $filled={star <= rating}
                  onClick={() => setRating(star)}
                  type="button"
                >
                  {star <= rating ? '★' : '☆'}
                </S.StarBtn>
              ))}
            </S.FeedbackStars>
            <S.FeedbackInput
              placeholder="추천이 어떠셨나요? (선택)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={200}
            />
            <S.FeedbackSubmitBtn
              onClick={handleFeedback}
              disabled={rating === 0 || isSubmitting}
            >
              {isSubmitting ? '제출 중...' : '평가 제출'}
            </S.FeedbackSubmitBtn>
          </S.FeedbackForm>
        )}
      </S.Info>
    </S.Card>
  );
}
