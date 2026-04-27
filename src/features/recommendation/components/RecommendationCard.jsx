/**
 * 추천 영화 카드 컴포넌트.
 *
 * AI가 추천한 영화의 정보를 표시하며,
 * 찜/봤어요 토글과 만족도 피드백 기능을 제공한다.
 *
 * 2026-04-27 UI/UX 정돈:
 *   - 정보 영역에 헤더 라인 신설 — 제목 좌, 추천 일시는 우측 상단 chip 으로 분리
 *   - 액션 버튼 라벨 정리("❤️ 찜" → "찜 해제 / 찜하기" 등 의미 명확화)
 *   - 평가 버튼 활성 상태 시각화: 별 아이콘 + 점수 + primary 풀필
 *   - 피드백 폼: 별점 옆 점수 hint + 푸터에 글자수 카운터 노출
 *   - 추천 일시 표기: 7일 이내 상대시간("2일 전"), 그 이후는 절대 날짜
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

/** 피드백 코멘트 글자수 상한 (Backend 와 동일) */
const COMMENT_MAX_LENGTH = 200;

/**
 * 추천 일시 포맷.
 *
 * 7일 이내: "방금 전" / "n분 전" / "n시간 전" / "n일 전"
 * 그 이후: "YYYY. M. D." (ko-KR locale)
 */
function formatRecommendedAt(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';

  const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (diffSec < 60) return '방금 전';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}일 전`;

  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

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

  /** 메타 라인 — 연도 · 장르(최대 3개) · 평점 */
  const metaParts = [];
  if (movie.releaseYear) metaParts.push(`${movie.releaseYear}년`);
  if (genres.length > 0) metaParts.push(genres.slice(0, 3).join(', '));
  if (movie.rating) metaParts.push(`★ ${Number(movie.rating).toFixed(1)}`);
  const metaLine = metaParts.join(' · ');

  /** 평가 완료 여부 — 활성 색상 분기에 사용 */
  const hasFeedback = Boolean(recommendation.feedbackRating);

  /**
   * 추천 이유 텍스트.
   *
   * Backend `recommendation_log.reason` 컬럼이 NOT NULL 이라 Agent 가 explanation 미생성 시
   * 공백(" ") 으로 저장한다. 단순히 truthy 체크만 하면 공백/줄바꿈만 있는 값도 렌더되어
   * 빈 보라색 바가 노출됐다 (2026-04-27 사용자 보고). trim 후 길이 체크로 차단.
   * SSE movie_card payload 의 `explanation` 도 동일 방식으로 폴백.
   */
  const rawReason = recommendation.reason || recommendation.explanation || '';
  const reasonText = typeof rawReason === 'string' ? rawReason.trim() : '';

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

  /** 추천 일시 렌더 문자열 */
  const recommendedAtLabel = formatRecommendedAt(
    recommendation.recommendedAt || recommendation.createdAt,
  );

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
        {/* 헤더: 제목 ↔ 추천 일시 chip */}
        <S.Header>
          <S.Title onClick={() => onClickMovie?.(movie.movieId || movie.id)}>
            {movie.title || '제목 없음'}
          </S.Title>
          {recommendedAtLabel && (
            <S.DateChip
              dateTime={recommendation.recommendedAt || recommendation.createdAt}
              title={recommendation.recommendedAt || recommendation.createdAt}
            >
              {recommendedAtLabel}
            </S.DateChip>
          )}
        </S.Header>

        {metaLine && <S.Meta>{metaLine}</S.Meta>}

        {/* 추천 이유 — Backend `reason` 또는 SSE movie_card `explanation`. trim 후 비어있지 않을 때만 렌더. */}
        {reasonText && <S.Explanation>{reasonText}</S.Explanation>}

        {/* 액션 버튼 */}
        <S.Actions>
          <S.ActionBtn
            $variant="wishlist"
            $active={recommendation.wishlisted}
            aria-pressed={!!recommendation.wishlisted}
            onClick={() => onToggleWishlist(recommendation.recommendationLogId)}
          >
            {recommendation.wishlisted ? '❤️ 찜 해제' : '🤍 찜하기'}
          </S.ActionBtn>

          <S.ActionBtn
            $variant="watched"
            $active={recommendation.watched}
            aria-pressed={!!recommendation.watched}
            onClick={() => onToggleWatched(recommendation.recommendationLogId)}
          >
            {recommendation.watched ? '✅ 봤어요' : '👀 봤어요'}
          </S.ActionBtn>

          <S.ActionBtn
            $variant="feedback"
            $active={hasFeedback}
            aria-expanded={showFeedback}
            onClick={() => setShowFeedback(!showFeedback)}
          >
            {hasFeedback ? `★ ${recommendation.feedbackRating}점` : '💬 평가 남기기'}
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
                  aria-label={`${star}점`}
                >
                  {star <= rating ? '★' : '☆'}
                </S.StarBtn>
              ))}
              <S.StarHint>{rating > 0 ? `${rating} / 5` : '별점을 선택해 주세요'}</S.StarHint>
            </S.FeedbackStars>
            <S.FeedbackInput
              placeholder="추천이 어떠셨나요? (선택)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={COMMENT_MAX_LENGTH}
            />
            <S.FeedbackFooter>
              <S.CharCount>
                {comment.length} / {COMMENT_MAX_LENGTH}
              </S.CharCount>
              <S.FeedbackSubmitBtn
                onClick={handleFeedback}
                disabled={rating === 0 || isSubmitting}
              >
                {isSubmitting ? '제출 중...' : '평가 제출'}
              </S.FeedbackSubmitBtn>
            </S.FeedbackFooter>
          </S.FeedbackForm>
        )}
      </S.Info>
    </S.Card>
  );
}
