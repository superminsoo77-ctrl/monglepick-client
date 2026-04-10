/**
 * 영화 리뷰 목록 컴포넌트.
 *
 * 특정 영화에 대한 사용자 리뷰들을 리스트로 표시한다.
 * 각 리뷰는 작성자, 평점(별), 내용, 작성일을 보여준다.
 *
 * 좋아요 기능 (인스타그램 스타일):
 * - likedMap: reviewId → boolean 맵으로 각 리뷰의 좋아요 상태 관리
 * - likeCountMap: reviewId → number 맵으로 낙관적 카운트 캐시
 * - movieId prop이 없더라도 review.movieId가 있으면 마이페이지에서도 재사용할 수 있다
 *
 * @param {Object} props
 * @param {Array} props.reviews - 리뷰 배열
 * @param {boolean} [props.loading=false] - 로딩 상태
 * @param {string|number} [props.movieId] - 영화 상세 페이지의 공통 영화 ID
 * @param {boolean} [props.showMovieLink=false] - 리뷰 대상 영화 링크 노출 여부
 */

import { useState, useCallback } from 'react';
import { ROUTES, buildPath } from '../../../shared/constants/routes';
/* 포맷팅 유틸 — shared/utils에서 가져옴 */
import { formatRelativeTime, formatRatingStars, formatRating } from '../../../shared/utils/formatters';
/* 로딩 스피너 — shared/components에서 가져옴 */
import Loading from '../../../shared/components/Loading/Loading';
/* 인증 스토어 — 로그인 여부 확인용 */
import useAuthStore from '../../../shared/stores/useAuthStore';
/* 리뷰 좋아요 토글 API */
import { deleteReview, toggleReviewLike, updateReview } from '../api/reviewApi';
import * as S from './ReviewList.styled';

export default function ReviewList({
  reviews = [],
  loading = false,
  movieId,
  onReviewsChange,
  showMovieLink = false,
}) {
  // 인증 여부 — 미인증 사용자는 좋아요 버튼 비활성화
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const [revealedSpoilers, setRevealedSpoilers] = useState({});
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingRating, setEditingRating] = useState(0);
  const [editingSpoiler, setEditingSpoiler] = useState(false);

  /**
   * 각 리뷰의 좋아요 상태 맵 (렌더링용).
   * 서버 초기값 없이 클라이언트 낙관적 업데이트로만 관리한다.
   * 구조: { [reviewId]: boolean }
   */
  const [likedMap, setLikedMap] = useState({});

  /**
   * 각 리뷰의 좋아요 수 캐시 맵.
   * review.likeCount를 기준으로 ±1 낙관적 조정한다.
   * 구조: { [reviewId]: number }
   */
  const [likeCountMap, setLikeCountMap] = useState({});

  /**
   * 리뷰 좋아요 토글 핸들러 (인스타그램 스타일 낙관적 UI).
   *
   * 1. 미인증이거나 movieId가 없으면 즉시 반환.
   * 2. likedRef로 현재 상태를 동기적으로 읽어 likedMap을 deps에서 제거.
   * 3. 서버 응답 전에 UI를 낙관적으로 업데이트해 반응성을 높인다.
   * 4. 서버 응답으로 실제 상태를 동기화한다.
   * 5. 요청 실패 시 낙관적 업데이트를 롤백한다.
   *
   * @param {number|string} reviewId - 토글할 리뷰 ID
   * @param {number} currentCount - 서버 기준 현재 좋아요 수 (롤백 기준점)
   */
  const handleLikeToggle = useCallback(async (targetMovieId, reviewId, currentCount) => {
    // 미인증이거나 movieId 없으면 토글 불가
    if (!isAuthenticated || !targetMovieId) return;

    // 최신 state를 기준으로 낙관적 토글을 적용한다.
    const wasLiked = likedMap[reviewId] ?? false;
    const newLiked = !wasLiked;

    setLikedMap((prev) => ({ ...prev, [reviewId]: newLiked }));
    setLikeCountMap((prev) => ({
      ...prev,
      [reviewId]: wasLiked
        ? Math.max(0, (prev[reviewId] ?? currentCount) - 1)
        : (prev[reviewId] ?? currentCount) + 1,
    }));

    try {
      // 서버에 토글 요청 후 실제 상태로 동기화
      const result = await toggleReviewLike(targetMovieId, reviewId);
      setLikedMap((prev) => ({ ...prev, [reviewId]: result.liked }));
      setLikeCountMap((prev) => ({ ...prev, [reviewId]: result.likeCount }));
    } catch {
      // 실패 시 낙관적 업데이트 롤백
      setLikedMap((prev) => ({ ...prev, [reviewId]: wasLiked }));
      setLikeCountMap((prev) => ({ ...prev, [reviewId]: currentCount }));
    }
  }, [isAuthenticated, likedMap]);

  /**
   * 스포일러 리뷰는 기본적으로 흐리게 보이고, 사용자가 클릭하면 내용이 드러난다.
   *
   * 한 번 열어본 리뷰는 현재 페이지에서 계속 펼친 상태를 유지한다.
   */
  const handleSpoilerReveal = useCallback((reviewId) => {
    setRevealedSpoilers((prev) => ({ ...prev, [reviewId]: true }));
  }, []);

  /**
   * 수정 모드 진입 시 현재 리뷰 값을 편집 상태로 복사한다.
   *
   * 수정 폼도 일반 작성과 동일하게 스포일러 여부를 함께 조절할 수 있게 한다.
   */
  const startEditing = useCallback((review) => {
    setEditingReviewId(review.id);
    setEditingContent(review.content || '');
    setEditingRating(review.rating || 0);
    setEditingSpoiler(Boolean(review.isSpoiler));
  }, []);

  /** 수정 모드를 닫고 임시 입력 상태를 초기화한다. */
  const resetEditing = useCallback(() => {
    setEditingReviewId(null);
    setEditingContent('');
    setEditingRating(0);
    setEditingSpoiler(false);
  }, []);

  /** 리뷰 수정 결과를 상위 상태에 반영한다. */
  const handleUpdateReview = useCallback(async (review) => {
    const targetMovieId = movieId || review.movieId;

    if (!targetMovieId || !onReviewsChange || editingRating <= 0) {
      return;
    }

    try {
      const updatedReview = await updateReview(targetMovieId, review.id, {
        content: editingContent.trim() || null,
        rating: editingRating,
        isSpoiler: editingSpoiler,
      });

      onReviewsChange((prev) => prev.map((review) => (
        review.id === updatedReview.id ? updatedReview : review
      )));
      resetEditing();
    } catch {
      // 수정 실패 시 현재 화면 상태는 유지한다.
    }
  }, [
    editingContent,
    editingRating,
    editingSpoiler,
    movieId,
    onReviewsChange,
    resetEditing,
  ]);

  /** 본인 리뷰를 삭제하고 상위 목록에서도 즉시 제거한다. */
  const handleDeleteReview = useCallback(async (review) => {
    const targetMovieId = movieId || review.movieId;

    if (!targetMovieId || !onReviewsChange) {
      return;
    }

    const shouldDelete = window.confirm('이 리뷰를 삭제할까요?');
    if (!shouldDelete) {
      return;
    }

    try {
      await deleteReview(targetMovieId, review.id);
      onReviewsChange((prev) => prev.filter((item) => item.id !== review.id));
      if (editingReviewId === review.id) {
        resetEditing();
      }
    } catch {
      // 삭제 실패 시 현재 화면 상태는 유지한다.
    }
  }, [editingReviewId, movieId, onReviewsChange, resetEditing]);

  // 로딩 중 표시
  if (loading) {
    return <Loading message="리뷰를 불러오는 중..." />;
  }

  // 리뷰가 없을 때
  if (!reviews || reviews.length === 0) {
    return (
      <S.Empty>
        <S.EmptyText>아직 작성된 리뷰가 없습니다.</S.EmptyText>
        <S.EmptyHint>첫 번째 리뷰를 남겨보세요!</S.EmptyHint>
      </S.Empty>
    );
  }

  return (
    <S.Wrapper>
      {reviews.map((review) => (
        <S.Item key={review.id}>
          {/* 리뷰 헤더 — 작성자 + 작성일 */}
          <S.ItemHeader>
            <S.AuthorInfo>
              {/* 작성자 아바타 */}
              <S.Avatar>
                {review.author?.nickname?.charAt(0) || 'U'}
              </S.Avatar>
              <div>
                <S.AuthorName>
                  {review.author?.nickname || '익명'}
                </S.AuthorName>
                <S.Time>
                  {formatRelativeTime(review.createdAt)}
                </S.Time>
              </div>
            </S.AuthorInfo>

            {/* 평점 표시 */}
            <S.Rating>
              <S.Stars>
                {formatRatingStars(review.rating)}
              </S.Stars>
              <S.Score>
                {formatRating(review.rating)}
              </S.Score>
            </S.Rating>
          </S.ItemHeader>

          {editingReviewId === review.id ? (
            <S.EditForm>
              {/* 리뷰 수정 시에도 스포일러 여부를 다시 지정할 수 있다. */}
              <S.EditField
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                placeholder="리뷰 내용을 수정해주세요"
              />
              <S.EditControlsRow>
                <S.EditSelect
                  value={editingRating}
                  onChange={(e) => setEditingRating(Number(e.target.value))}
                >
                  {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((score) => (
                    <option key={score} value={score}>{score.toFixed(1)}</option>
                  ))}
                </S.EditSelect>
                <S.SpoilerToggleLabel>
                  <input
                    type="checkbox"
                    checked={editingSpoiler}
                    onChange={(e) => setEditingSpoiler(e.target.checked)}
                  />
                  <span>스포일러 포함</span>
                </S.SpoilerToggleLabel>
              </S.EditControlsRow>
              <S.ActionGroup>
                <S.SecondaryActionBtn type="button" onClick={resetEditing}>
                  취소
                </S.SecondaryActionBtn>
                <S.PrimaryActionBtn
                  type="button"
                  onClick={() => {
                    void handleUpdateReview(review);
                  }}
                >
                  수정 저장
                </S.PrimaryActionBtn>
              </S.ActionGroup>
            </S.EditForm>
          ) : (
            <S.ReviewBodyRow>
              {/* 마이페이지에서는 영화 제목/리뷰 본문 옆에 포스터를 나란히 보여준다. */}
              {showMovieLink && review.posterUrl && (
                <S.ReviewPoster
                  src={review.posterUrl}
                  alt={`${review.movieTitle || '영화'} 포스터`}
                  loading="lazy"
                />
              )}

              <S.ReviewTextBlock>
                {/* 마이페이지에서는 리뷰가 어느 영화에 대한 것인지 바로 이동 가능해야 한다. */}
                {showMovieLink && review.movieTitle && review.movieId && (
                  <S.MovieLink
                    to={buildPath(ROUTES.MOVIE_DETAIL, { id: review.movieId })}
                  >
                    {review.movieTitle}
                  </S.MovieLink>
                )}

                {review.isSpoiler && !revealedSpoilers[review.id] ? (
                  <S.SpoilerCard
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSpoilerReveal(review.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleSpoilerReveal(review.id);
                      }
                    }}
                  >
                    <S.SpoilerBadge>스포일러가 포함된 후기입니다.</S.SpoilerBadge>
                    <S.SpoilerBlurredText>{review.content || '리뷰 내용이 없습니다.'}</S.SpoilerBlurredText>
                    <S.SpoilerHint>클릭하면 내용을 볼 수 있습니다.</S.SpoilerHint>
                  </S.SpoilerCard>
                ) : (
                  <S.ReviewContent>{review.content}</S.ReviewContent>
                )}
              </S.ReviewTextBlock>
            </S.ReviewBodyRow>
          )}

          {/* 좋아요 버튼 — 인스타그램 스타일 하트 토글
              $liked: likedMap에 값이 있으면 그 값, 없으면 false (초기 상태).
              disabled: 미인증이거나 movieId가 없으면 비활성화. */}
          <S.Footer>
            {review.isMine && editingReviewId !== review.id && (
              <S.ActionGroup>
                <S.SecondaryActionBtn
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(review);
                  }}
                >
                  수정
                </S.SecondaryActionBtn>
                <S.DangerActionBtn
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDeleteReview(review);
                  }}
                >
                  삭제
                </S.DangerActionBtn>
              </S.ActionGroup>
            )}
            <S.LikeBtn
              $liked={likedMap[review.id] ?? false}
              onClick={(e) => {
                // 리뷰 아이템 클릭 이벤트가 상위로 전파되지 않도록 차단
                e.stopPropagation();
                void handleLikeToggle(movieId || review.movieId, review.id, review.likeCount || 0);
              }}
              disabled={!isAuthenticated || !(movieId || review.movieId)}
              aria-label={(likedMap[review.id] ?? false) ? '좋아요 취소' : '좋아요'}
            >
              {(likedMap[review.id] ?? false) ? '♥' : '♡'}{' '}
              {likeCountMap[review.id] ?? review.likeCount ?? 0}
            </S.LikeBtn>
          </S.Footer>
        </S.Item>
      ))}
    </S.Wrapper>
  );
}
