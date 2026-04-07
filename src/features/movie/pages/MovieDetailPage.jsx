/**
 * 영화 상세 페이지 컴포넌트.
 *
 * URL 파라미터에서 영화 ID를 추출하여 영화 상세 정보를 로드한다.
 * MovieDetailCard 컴포넌트로 영화 정보를 표시하고,
 * 위시리스트 토글, 리뷰 목록 등 부가 기능을 제공한다.
 */

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
/* Phase 2: 사용자 행동 이벤트 추적 */
import { trackEvent } from '../../../shared/utils/eventTracker';
/* 커스텀 모달 훅 — window.alert 대체 */
import { useModal } from '../../../shared/components/Modal';
/* 영화 API — 같은 feature 내의 movieApi에서 가져옴 */
import { getMovie, toggleMovieLike, getMovieLikeStatus } from '../api/movieApi';
/* 리뷰 API — features/review에서 가져옴 */
import { getReviews } from '../../review/api/reviewApi';
/* 위시리스트 API — features/user에서 가져옴 */
import { addToWishlist, removeFromWishlist } from '../../user/api/userApi';
/* Phase 5-2: 시청 기록 저장용 Backend API */
import { backendApi } from '../../../shared/api/axiosInstance';
/* 인증 Context 훅 — app/providers에서 가져옴 */
import useAuthStore from '../../../shared/stores/useAuthStore';
/* 영화 상세 카드 — 같은 feature 내의 components에서 가져옴 */
import MovieDetailCard from '../components/MovieDetailCard';
/* Phase 5-2: 시청 후 평점 팝업 */
import PostWatchFeedback from '../components/PostWatchFeedback';
/* 리뷰 목록 — features/review에서 가져옴 */
import ReviewList from '../../review/components/ReviewList';
/* 로딩 스피너 — shared/components에서 가져옴 */
import Loading from '../../../shared/components/Loading/Loading';
/* 404 페이지 — API에서 영화를 찾을 수 없을 때 표시 */
import NotFoundPage from '../../error/pages/NotFoundPage';
/* styled-components — MovieDetailPage 전용 스타일 */
import * as S from './MovieDetailPage.styled';

export default function MovieDetailPage() {
  /* 커스텀 모달 — window.alert 대체 */
  const { showAlert } = useModal();

  // URL 파라미터에서 영화 ID 추출
  const { id } = useParams();
  // 영화 상세 정보 상태
  const [movie, setMovie] = useState(null);
  // 리뷰 목록 상태
  const [reviews, setReviews] = useState([]);
  // 위시리스트 포함 여부
  const [isWishlisted, setIsWishlisted] = useState(false);
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);
  // 에러 메시지
  const [error, setError] = useState(null);
  // API 404 응답 여부 (영화를 찾을 수 없을 때 NotFoundPage 렌더링용)
  const [isNotFound, setIsNotFound] = useState(false);

  // Phase 5-2: 시청 후 평점 팝업 상태
  const [showFeedback, setShowFeedback] = useState(false);

  // 영화 좋아요 상태 — 인스타그램 스타일 낙관적 UI 업데이트에 사용
  const [isLiked, setIsLiked] = useState(false);
  // 영화 좋아요 수 — 서버 응답으로 동기화하며 낙관적으로 ±1 조정
  const [likeCount, setLikeCount] = useState(0);
  // 위시리스트 중복 요청 방지 — API 응답 전 버튼 재클릭 차단
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  /* Phase 2: 페이지 진입 시각 기록 (체류 시간 측정용) */
  const enterTimeRef = useRef(null);

  /**
   * Phase 2: 영화 상세 페이지 체류 시간 이벤트.
   * 마운트 시 진입 시각 기록, 언마운트 시 체류 시간 전송.
   */
  useEffect(() => {
    enterTimeRef.current = Date.now();
    trackEvent('movie_detail_view', id);

    return () => {
      if (enterTimeRef.current) {
        const durationSec = Math.round((Date.now() - enterTimeRef.current) / 1000);
        trackEvent('movie_detail_leave', id, { duration_sec: durationSec });
      }
    };
  }, [id]);

  /**
   * 영화 상세 정보와 리뷰를 로드한다.
   */
  useEffect(() => {
    async function loadMovieData() {
      setIsLoading(true);
      setError(null);
      setIsNotFound(false);

      try {
        // 영화 상세 정보 조회
        const movieData = await getMovie(id);
        setMovie(movieData);

        // 위시리스트 상태 (영화 데이터에 포함된 경우)
        if (movieData.isWishlisted !== undefined) {
          setIsWishlisted(movieData.isWishlisted);
        }

        // 리뷰 목록 조회 (별도 API, 실패해도 영화 정보는 표시)
        try {
          const reviewData = await getReviews(id);
          setReviews(reviewData?.reviews || []);
        } catch {
          // 리뷰 로드 실패 시 빈 배열
          setReviews([]);
        }

        // 로그인한 경우 좋아요 상태 로드 (실패해도 영화 정보는 표시)
        if (isAuthenticated) {
          try {
            const likeStatus = await getMovieLikeStatus(id);
            setIsLiked(likeStatus.liked);
            setLikeCount(likeStatus.likeCount);
          } catch {
            // 좋아요 상태 로드 실패는 무시 — 기본값(false, 0) 유지
          }
        }
      } catch (err) {
        /* API 404 응답 시 NotFoundPage를 표시하도록 분기 */
        if (err.status === 404) {
          setIsNotFound(true);
        } else {
          setError(err.message || '영화 정보를 불러올 수 없습니다.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      loadMovieData();
    }
  }, [id, isAuthenticated]);

  /**
   * 위시리스트 토글 핸들러.
   * 인증된 사용자만 사용 가능하다.
   *
   * @param {string|number} movieId - 영화 ID
   */
  const handleWishlistToggle = async (movieId) => {
    if (!isAuthenticated) {
      await showAlert({
        title: '로그인 필요',
        message: '위시리스트를 사용하려면 로그인이 필요합니다.',
        type: 'warning',
      });
      return;
    }

    // 중복 클릭 방지 — API 응답 전 재요청 차단
    if (isWishlistLoading) return;
    setIsWishlistLoading(true);

    try {
      if (isWishlisted) {
        // 이미 찜한 상태 → 제거 (DELETE)
        await removeFromWishlist(movieId);
        setIsWishlisted(false);
      } else {
        // 찜하지 않은 상태 → 추가 (POST)
        await addToWishlist(movieId);
        setIsWishlisted(true);
      }
    } catch (err) {
      await showAlert({
        title: '오류',
        message: err.message || '위시리스트 변경에 실패했습니다.',
        type: 'error',
      });
    } finally {
      setIsWishlistLoading(false);
    }
  };

  /**
   * 영화 좋아요 토글 핸들러 (인스타그램 스타일 — 낙관적 UI 업데이트).
   *
   * 1. 미인증 사용자는 로그인 안내 후 중단.
   * 2. 서버 응답 전에 UI를 먼저 낙관적으로 업데이트해 반응성을 높인다.
   * 3. 서버 응답으로 실제 상태(liked, likeCount)를 동기화한다.
   * 4. 요청 실패 시 낙관적 업데이트를 롤백한다.
   */
  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      await showAlert({
        title: '로그인 필요',
        message: '좋아요를 사용하려면 로그인이 필요합니다.',
        type: 'warning',
      });
      return;
    }

    // 낙관적 UI 업데이트 — 서버 응답 전에 즉시 반영
    const optimisticLiked = !isLiked;
    setIsLiked(optimisticLiked);
    setLikeCount((prev) => (optimisticLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      // 서버에 토글 요청 후 실제 상태로 동기화
      const result = await toggleMovieLike(id);
      setIsLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      // 실패 시 낙관적 업데이트 롤백
      setIsLiked(!optimisticLiked);
      setLikeCount((prev) => (!optimisticLiked ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  /**
   * Phase 5-2: "시청 완료" 버튼 핸들러.
   * 시청 후 평점 팝업을 표시한다.
   */
  const handleWatchComplete = () => {
    if (!isAuthenticated) {
      showAlert({ title: '로그인 필요', message: '시청 기록을 남기려면 로그인이 필요합니다.', type: 'warning' });
      return;
    }
    setShowFeedback(true);
  };

  /**
   * Phase 5-2: 평점 제출 콜백.
   * 리뷰 API에 평점 + 코멘트를 저장한다.
   * "봤다" 버튼 → 리뷰 작성 = 시청 완료 확인의 단일 소스 (watch_history 대체).
   *
   * 엑셀 5번 reviews 정합:
   *  - reviewSource       : 작성 출처 참조 ID. 영화 상세 페이지는 별도 참조 엔티티가 없으므로 'detail' 표식 사용.
   *  - reviewCategoryCode : 6종 분류 enum. 상세 페이지에서 직접 작성하는 경우는 AI 추천 카테고리에 속하지 않으므로
   *                        가장 가까운 분류인 'AI_RECOMMEND'로 채운다 (영화 상세는 AI 추천 결과 화면에서도 진입).
   *
   * 중복 리뷰(이미 리뷰 작성한 영화)는 서버 409로 거부되지만 UX를 차단하지 않고 조용히 무시한다.
   */
  const handleFeedbackSubmit = async (rating, content) => {
    try {
      await backendApi.post(`/api/v1/movies/${id}/reviews`, {
        movieId: id,
        rating,
        content: content || null,
        reviewSource: 'detail',
        reviewCategoryCode: 'AI_RECOMMEND',
      });
    } catch {
      // 중복 리뷰(409) 포함 모든 오류: UX 차단하지 않음
    }
    setShowFeedback(false);
  };

  // 로딩 중
  if (isLoading) {
    return (
      <S.MovieDetailPageWrapper>
        <Loading message="영화 정보를 불러오는 중..." fullPage />
      </S.MovieDetailPageWrapper>
    );
  }

  // API 404 — 존재하지 않는 영화 ID일 때 NotFoundPage 표시
  if (isNotFound) {
    return <NotFoundPage />;
  }

  // 에러 발생
  if (error) {
    return (
      <S.MovieDetailPageWrapper>
        <S.ErrorContainer>
          <S.ErrorTitle>오류가 발생했습니다</S.ErrorTitle>
          <S.ErrorDescription>{error}</S.ErrorDescription>
        </S.ErrorContainer>
      </S.MovieDetailPageWrapper>
    );
  }

  return (
    <S.MovieDetailPageWrapper>
      <S.InnerContainer>
        {/* 영화 상세 카드 */}
        <MovieDetailCard
          movie={movie}
          onWishlistToggle={handleWishlistToggle}
          isWishlisted={isWishlisted}
          wishlistLoading={isWishlistLoading}
          onWatchComplete={handleWatchComplete}
          likeCount={likeCount}
          isLiked={isLiked}
          onLikeToggle={handleLikeToggle}
        />

        {/* Phase 5-2: 시청 후 평점 팝업 */}
        <PostWatchFeedback
          isOpen={showFeedback}
          movieTitle={movie?.title || ''}
          movieId={id}
          onSubmit={handleFeedbackSubmit}
          onClose={() => setShowFeedback(false)}
        />

        {/* 리뷰 섹션 */}
        <S.ReviewsSection>
          <S.SectionTitle>
            리뷰 {reviews.length > 0 && <span>({reviews.length})</span>}
          </S.SectionTitle>
          {/* movieId를 전달해야 리뷰 좋아요 토글 API를 호출할 수 있다 */}
          <ReviewList reviews={reviews} movieId={id} />
        </S.ReviewsSection>
      </S.InnerContainer>
    </S.MovieDetailPageWrapper>
  );
}
