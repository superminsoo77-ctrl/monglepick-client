/**
 * 영화 리뷰 목록 컴포넌트.
 *
 * 특정 영화에 대한 사용자 리뷰들을 리스트로 표시한다.
 * 각 리뷰는 작성자, 평점(별), 내용, 작성일을 보여준다.
 *
 * 좋아요 기능 (인스타그램 스타일):
 * - likedMap: reviewId → boolean 맵으로 각 리뷰의 좋아요 상태 관리
 * - likeCountMap: reviewId → number 맵으로 낙관적 카운트 캐시
 * - movieId prop이 있어야 토글 API를 호출할 수 있다
 *
 * @param {Object} props
 * @param {Array} props.reviews - 리뷰 배열
 * @param {boolean} [props.loading=false] - 로딩 상태
 * @param {string|number} [props.movieId] - 영화 ID (좋아요 토글 API 호출에 필요)
 */

import { useState, useCallback, useRef } from 'react';
/* 포맷팅 유틸 — shared/utils에서 가져옴 */
import { formatRelativeTime, formatRatingStars, formatRating } from '../../../shared/utils/formatters';
/* 로딩 스피너 — shared/components에서 가져옴 */
import Loading from '../../../shared/components/Loading/Loading';
/* 인증 스토어 — 로그인 여부 확인용 */
import useAuthStore from '../../../shared/stores/useAuthStore';
/* 리뷰 좋아요 토글 API */
import { toggleReviewLike } from '../api/reviewApi';
import * as S from './ReviewList.styled';

export default function ReviewList({ reviews = [], loading = false, movieId }) {
  // 인증 여부 — 미인증 사용자는 좋아요 버튼 비활성화
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  /**
   * 각 리뷰의 좋아요 상태 맵 (렌더링용).
   * 서버 초기값 없이 클라이언트 낙관적 업데이트로만 관리한다.
   * 구조: { [reviewId]: boolean }
   */
  const [likedMap, setLikedMap] = useState({});

  /**
   * likedMap의 최신 값을 동기적으로 참조하기 위한 ref.
   * useCallback deps에서 likedMap state를 제거하여
   * 좋아요 토글마다 핸들러가 재생성되는 것을 방지한다.
   */
  const likedRef = useRef({});

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
  const handleLikeToggle = useCallback(async (reviewId, currentCount) => {
    // 미인증이거나 movieId 없으면 토글 불가
    if (!isAuthenticated || !movieId) return;

    // ref에서 현재 좋아요 상태를 동기적으로 읽음 (likedMap state 클로저 불필요)
    const wasLiked = likedRef.current[reviewId] ?? false;
    const newLiked = !wasLiked;

    // ref + state 동시 업데이트 — ref는 즉시, state는 다음 렌더 반영
    likedRef.current = { ...likedRef.current, [reviewId]: newLiked };
    setLikedMap({ ...likedRef.current });
    setLikeCountMap((prev) => ({
      ...prev,
      [reviewId]: wasLiked
        ? Math.max(0, (prev[reviewId] ?? currentCount) - 1)
        : (prev[reviewId] ?? currentCount) + 1,
    }));

    try {
      // 서버에 토글 요청 후 실제 상태로 동기화
      const result = await toggleReviewLike(movieId, reviewId);
      likedRef.current = { ...likedRef.current, [reviewId]: result.liked };
      setLikedMap({ ...likedRef.current });
      setLikeCountMap((prev) => ({ ...prev, [reviewId]: result.likeCount }));
    } catch {
      // 실패 시 낙관적 업데이트 롤백
      likedRef.current = { ...likedRef.current, [reviewId]: wasLiked };
      setLikedMap({ ...likedRef.current });
      setLikeCountMap((prev) => ({ ...prev, [reviewId]: currentCount }));
    }
  }, [isAuthenticated, movieId]);

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

          {/* 리뷰 내용 */}
          <S.ReviewContent>{review.content}</S.ReviewContent>

          {/* 좋아요 버튼 — 인스타그램 스타일 하트 토글
              $liked: likedMap에 값이 있으면 그 값, 없으면 false (초기 상태).
              disabled: 미인증이거나 movieId가 없으면 비활성화. */}
          <S.Footer>
            <S.LikeBtn
              $liked={likedMap[review.id] ?? false}
              onClick={(e) => {
                // 리뷰 아이템 클릭 이벤트가 상위로 전파되지 않도록 차단
                e.stopPropagation();
                handleLikeToggle(review.id, review.likeCount || 0);
              }}
              disabled={!isAuthenticated || !movieId}
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
