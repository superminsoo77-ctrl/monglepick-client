/**
 * 영화 리뷰 목록 컴포넌트.
 *
 * 특정 영화에 대한 사용자 리뷰들을 리스트로 표시한다.
 * 각 리뷰는 작성자, 평점(별), 내용, 작성일을 보여준다.
 *
 * @param {Object} props
 * @param {Array} props.reviews - 리뷰 배열
 * @param {boolean} [props.loading=false] - 로딩 상태
 */

/* 포맷팅 유틸 — shared/utils에서 가져옴 */
import { formatRelativeTime, formatRatingStars, formatRating } from '../../../shared/utils/formatters';
/* 로딩 스피너 — shared/components에서 가져옴 */
import Loading from '../../../shared/components/Loading/Loading';
import './ReviewList.css';

export default function ReviewList({ reviews = [], loading = false }) {
  // 로딩 중 표시
  if (loading) {
    return <Loading message="리뷰를 불러오는 중..." />;
  }

  // 리뷰가 없을 때
  if (!reviews || reviews.length === 0) {
    return (
      <div className="review-list__empty">
        <p className="review-list__empty-text">아직 작성된 리뷰가 없습니다.</p>
        <p className="review-list__empty-hint">첫 번째 리뷰를 남겨보세요!</p>
      </div>
    );
  }

  return (
    <div className="review-list">
      {reviews.map((review) => (
        <article key={review.id} className="review-list__item">
          {/* 리뷰 헤더 — 작성자 + 작성일 */}
          <div className="review-list__header">
            <div className="review-list__author-info">
              {/* 작성자 아바타 */}
              <span className="review-list__avatar">
                {review.author?.nickname?.charAt(0) || 'U'}
              </span>
              <div>
                <span className="review-list__author-name">
                  {review.author?.nickname || '익명'}
                </span>
                <span className="review-list__time">
                  {formatRelativeTime(review.createdAt)}
                </span>
              </div>
            </div>

            {/* 평점 표시 */}
            <div className="review-list__rating">
              <span className="review-list__stars">
                {formatRatingStars(review.rating)}
              </span>
              <span className="review-list__score">
                {formatRating(review.rating)}
              </span>
            </div>
          </div>

          {/* 리뷰 내용 */}
          <p className="review-list__content">{review.content}</p>

          {/* 좋아요 버튼 */}
          <div className="review-list__footer">
            <button className="review-list__like-btn">
              ♡ {review.likeCount || 0}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
