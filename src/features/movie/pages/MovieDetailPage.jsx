/**
 * 영화 상세 페이지 컴포넌트.
 *
 * URL 파라미터에서 영화 ID를 추출하여 영화 상세 정보를 로드한다.
 * MovieDetailCard 컴포넌트로 영화 정보를 표시하고,
 * 위시리스트 토글, 리뷰 목록 등 부가 기능을 제공한다.
 */

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
/* 2026-04-23 PR-3: 뒤로가기 3단 폴백 공통 훅 — handleGoBack 로직을 대체 */
import useBackNavigation from '../../../shared/hooks/useBackNavigation';
/* Phase 2: 사용자 행동 이벤트 추적 */
import { trackEvent } from '../../../shared/utils/eventTracker';
/* 커스텀 모달 훅 — window.alert 대체 */
import { useModal } from '../../../shared/components/Modal';
/* 리워드 획득 토스트 — 활동 리워드 알림 */
import { useRewardToast } from '../../../shared/components/RewardToast';
/* 영화 API — 같은 feature 내의 movieApi에서 가져옴 */
import {
  getMovie,
  getCollectionRelatedMovies,
  getRelatedMovies,
  getMovieLikeCount,
  getMovieLikeStatus,
  toggleMovieLike,
} from '../api/movieApi';
/* 리뷰 API — features/review에서 가져옴 */
import { createReview, getReviews } from '../../review/api/reviewApi';
/* 위시리스트 API — features/user에서 가져옴 */
import { addToWishlist, getWishlistStatus, removeFromWishlist } from '../../user/api/userApi';
/* OCR 실관람 인증 이벤트 API (2026-04-14 신규) — 영화별 진행 중 이벤트 조회 */
import { getOcrEventByMovie } from '../../community/api/communityApi';
/* 인증 Context 훅 — app/providers에서 가져옴 */
import useAuthStore from '../../../shared/stores/useAuthStore';
/* 영화 상세 카드 — 같은 feature 내의 components에서 가져옴 */
import MovieDetailCard from '../components/MovieDetailCard';
/* Phase 5-2: 시청 후 평점 팝업 */
import PostWatchFeedback from '../components/PostWatchFeedback';
/* OCR 실관람 인증 배너 + 제출 모달 (2026-04-14 신규) */
import OcrEventBanner from '../components/OcrEventBanner';
import OcrVerificationModal from '../components/OcrVerificationModal';
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
  /* 리워드 획득 토스트 */
  const { showReward } = useRewardToast();

  // URL 파라미터에서 영화 ID 추출
  const { id } = useParams();

  /*
   * 뒤로가기 네비게이션 — 2026-04-23 PR-3 공통 훅화.
   *
   * 기존 handleGoBack 함수(3단 폴백: location.state.backTo → navigate(-1) → '/')를
   * useBackNavigation 훅으로 대체. 훅 내부 로직은 정확히 동일 의미를 갖지만,
   *   - backTab 필드(state.activeTab 로 재포장) 는 폐기됐다 (호출부가 backTo URL 에
   *     ?tab= 쿼리를 직접 넣도록 변경 — MyPage.jsx 참조).
   *   - fallback 은 기존 '/' 에서 '/home' 으로 격상 (랜딩보다 홈이 더 유용한 폴백).
   *
   * navigate(-1) 은 직접 URL 진입으로 history 스택이 비어있을 때 아무 동작 없이
   * 끝나는 특성이 있어 훅 내부에서 window.history.length 를 먼저 확인한다.
   */
  const handleGoBack = useBackNavigation('/home');
  // 영화 상세 정보 상태
  const [movie, setMovie] = useState(null);
  // 리뷰 목록 상태
  const [reviews, setReviews] = useState([]);
  // 같은 컬렉션 작품 목록 상태 — 시리즈 전용 블록에 별도 노출한다.
  const [collectionMovies, setCollectionMovies] = useState([]);
  // 같은 컬렉션 작품 로딩 상태.
  const [isCollectionMoviesLoading, setIsCollectionMoviesLoading] = useState(false);
  // 연관 영화 목록 상태 — 컬렉션을 제외한 줄거리/메타데이터 기반 후보를 노출한다.
  const [relatedMovies, setRelatedMovies] = useState([]);
  // 연관 영화 로딩 상태 — 상세 본문과 분리해 늦게 도착해도 페이지는 먼저 렌더링한다.
  const [isRelatedMoviesLoading, setIsRelatedMoviesLoading] = useState(false);
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

  /*
   * OCR 실관람 인증 이벤트 상태 (2026-04-14 신규).
   *
   * 이 영화가 현재 진행 중인 OCR 인증 이벤트의 대상이라면 상단에 배너를 노출한다.
   * - ocrEvent : 진행 중 이벤트 객체 (없으면 null → 배너 미노출)
   * - showOcrModal : "인증하러 가기" 클릭 시 열리는 제출 모달의 오픈 여부
   */
  const [ocrEvent, setOcrEvent] = useState(null);
  const [showOcrModal, setShowOcrModal] = useState(false);

  // 영화 좋아요 상태 — 인스타그램 스타일 낙관적 UI 업데이트에 사용
  const [isLiked, setIsLiked] = useState(false);
  // 영화 좋아요 수 — 서버 응답으로 동기화하며 낙관적으로 ±1 조정
  const [likeCount, setLikeCount] = useState(0);
  // 위시리스트 중복 요청 방지 — API 응답 전 버튼 재클릭 차단
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const hasMyReview = reviews.some((review) => review?.isMine);
  const reviewWriteButtonLabel = hasMyReview ? '리뷰 작성 완료' : '리뷰 작성';

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
      setMovie(null);
      setCollectionMovies([]);
      setIsCollectionMoviesLoading(false);
      setRelatedMovies([]);
      setIsRelatedMoviesLoading(false);

      try {
        // 영화 상세 정보 조회
        const movieData = await getMovie(id);
        setMovie(movieData);

        // 위시리스트 상태 (영화 데이터에 포함된 경우)
        if (movieData.isWishlisted !== undefined) {
          setIsWishlisted(movieData.isWishlisted);
        }

        // 위시리스트 상태는 recommend v2 전용 status API로 동기화한다.
        if (isAuthenticated) {
          try {
            const wishlistStatus = await getWishlistStatus(id);
            setIsWishlisted(Boolean(wishlistStatus?.wishlisted));
          } catch {
            // 위시리스트 상태 조회 실패는 상세 렌더링을 막지 않음
          }
        }

        // 리뷰 목록 조회 (별도 API, 실패해도 영화 정보는 표시)
        try {
          const reviewData = await getReviews(id);
          setReviews(reviewData?.reviews || []);
        } catch {
          // 리뷰 로드 실패 시 빈 배열
          setReviews([]);
        }

        // 진행 중 OCR 실관람 인증 이벤트 조회 (2026-04-14 신규) — 비로그인도 허용.
        // 실패/이벤트 없음 시 null 이 반환되며, 배너는 ocrEvent 가 truthy 일 때만 렌더링.
        try {
          const event = await getOcrEventByMovie(id);
          setOcrEvent(event);
        } catch {
          // 이벤트 조회 실패는 상세 렌더링을 막지 않음
          setOcrEvent(null);
        }

        // 좋아요 수는 비로그인도 볼 수 있게 공개 카운트 API를 우선 사용한다.
        // 로그인 상태라면 내 좋아요 여부까지 함께 내려주는 상태 API로 덮어쓴다.
        try {
          const publicLikeCount = await getMovieLikeCount(id);
          setLikeCount(publicLikeCount.likeCount || 0);
        } catch {
          // 공개 카운트 조회 실패는 무시 — 기본값(0) 유지
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
   * 연관 영화 목록을 비동기로 로드한다.
   *
   * 메인 상세 정보는 먼저 렌더링하고, 연관 영화는 별도 로딩 상태로 뒤이어 채운다.
   */
  useEffect(() => {
    let isCancelled = false;

    const isCollectionRelatedMovie = (targetMovie) => {
      const relationSources = Array.isArray(targetMovie?.relationSources)
        ? targetMovie.relationSources
        : (Array.isArray(targetMovie?.relation_sources) ? targetMovie.relation_sources : []);
      const relationReasons = Array.isArray(targetMovie?.relationReasons)
        ? targetMovie.relationReasons
        : (Array.isArray(targetMovie?.relation_reasons) ? targetMovie.relation_reasons : []);

      return relationSources.includes('collection_priority')
        || relationSources.includes('elasticsearch_collection')
        || relationReasons.some((reason) => String(reason || '').startsWith('같은 컬렉션'));
    };

    async function loadRelatedMovieData() {
      if (!movie) {
        setCollectionMovies([]);
        setIsCollectionMoviesLoading(false);
        setRelatedMovies([]);
        setIsRelatedMoviesLoading(false);
        return;
      }

      const shouldLoadCollectionMovies = Boolean(movie.collection_name);
      setIsCollectionMoviesLoading(shouldLoadCollectionMovies);
      setIsRelatedMoviesLoading(true);

      if (shouldLoadCollectionMovies) {
        getCollectionRelatedMovies(movie)
          .then((collectionMovieList) => {
            if (!isCancelled) {
              setCollectionMovies(collectionMovieList);
            }
          })
          .catch(() => {
            if (!isCancelled) {
              setCollectionMovies([]);
            }
          })
          .finally(() => {
            if (!isCancelled) {
              setIsCollectionMoviesLoading(false);
            }
          });
      } else {
        setCollectionMovies([]);
        setIsCollectionMoviesLoading(false);
      }

      getRelatedMovies(movie)
        .then((relatedMovieList) => {
          const filteredRelatedMovieList = relatedMovieList.filter(
            (relatedMovie) => !isCollectionRelatedMovie(relatedMovie)
          );
          if (!isCancelled) {
            setRelatedMovies(filteredRelatedMovieList);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setRelatedMovies([]);
          }
        })
        .finally(() => {
          if (!isCancelled) {
            setIsRelatedMoviesLoading(false);
          }
        });
    }

    loadRelatedMovieData();

    return () => {
      isCancelled = true;
    };
  }, [movie]);

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
   * OCR 실관람 인증 배너의 "인증하러 가기" 버튼 핸들러 (2026-04-14 신규).
   *
   * 비로그인 사용자는 로그인 안내를 먼저 띄워 현재 위치에서의 유입을 방지한다.
   * 로그인 사용자는 영수증 업로드 모달({@link OcrVerificationModal})을 연다.
   */
  const handleOcrVerifyClick = async () => {
    if (!isAuthenticated) {
      await showAlert({
        title: '로그인 필요',
        message: '실관람 인증을 하려면 로그인이 필요합니다.',
        type: 'warning',
      });
      return;
    }
    setShowOcrModal(true);
  };

  /**
   * OCR 인증 제출 성공 콜백 (2026-04-14 신규).
   *
   * 모달을 닫고 친절한 안내 메시지를 띄운다.
   * 향후 리워드 지급 단계가 추가되면 이 자리에서 showReward() 를 호출한다.
   */
  const handleOcrVerifySuccess = async (result) => {
    setShowOcrModal(false);
    await showAlert({
      title: '인증 접수 완료',
      message: result?.message || '영수증이 정상적으로 접수되었습니다.',
      type: 'success',
    });
  };

  /**
   * 리뷰 작성 버튼 핸들러.
   *
   * 로그인하지 않았거나 이미 내 리뷰가 있는 경우에는 모달을 열지 않고
   * 클라이언트에서 즉시 차단한다.
   */
  const handleReviewWriteClick = async () => {
    if (!isAuthenticated) {
      await showAlert({
        title: '로그인 필요',
        message: '리뷰를 작성하려면 로그인이 필요합니다.',
        type: 'warning',
      });
      return;
    }

    if (hasMyReview) {
      await showAlert({
        title: '이미 리뷰를 작성했어요',
        message: '이 영화는 이미 리뷰를 남겼습니다. 아래 리뷰 목록에서 수정하거나 삭제할 수 있습니다.',
        type: 'warning',
      });
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
   * 본문은 선택값으로 보내며, rating만 있어도 작성 가능하다.
   * 이미 내 리뷰가 있는 경우에는 제출 직전에도 한 번 더 가드한다.
   */
  const handleFeedbackSubmit = async (rating, content, isSpoiler) => {
    if (hasMyReview) {
      setShowFeedback(false);
      await showAlert({
        title: '이미 리뷰를 작성했어요',
        message: '이 영화는 이미 리뷰를 남겼습니다. 아래 리뷰 목록에서 수정하거나 삭제할 수 있습니다.',
        type: 'warning',
      });
      return;
    }

    try {
      const result = await createReview(id, {
        movieId: id,
        rating,
        content: content || null,
        isSpoiler,
        reviewSource: 'detail',
        reviewCategoryCode: 'AI_RECOMMEND',
      });
      // 리워드 지급 시 토스트 알림
      if (result?.rewardPoints > 0) {
        showReward(result.rewardPoints, '리뷰 작성');
      }

      // 리뷰 작성 직후 최신 목록을 다시 받아 하단 리뷰 섹션을 즉시 갱신한다.
      const reviewData = await getReviews(id);
      setReviews(reviewData?.reviews || []);
      setShowFeedback(false);
    } catch (err) {
      if (err?.status === 409) {
        try {
          const reviewData = await getReviews(id);
          setReviews(reviewData?.reviews || []);
        } catch {
          // 리뷰 재동기화 실패는 무시한다.
        }

        await showAlert({
          title: '이미 리뷰를 작성했어요',
          message: '이 영화는 이미 리뷰를 남겼습니다. 아래 리뷰 목록에서 수정하거나 삭제할 수 있습니다.',
          type: 'warning',
        });
      }

      setShowFeedback(false);
    }
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
        {/* ← 이전 버튼: Match 결과 / 검색 결과 등 어디서 진입했든 직관적 뒤로가기 제공 */}
        <S.BackButton onClick={handleGoBack} aria-label="이전 페이지로 돌아가기">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>이전</span>
        </S.BackButton>

        {/*
          OCR 실관람 인증 배너 (2026-04-14 신규).
          진행 중 이벤트가 있는 경우에만 영화 상세 카드 위에 표시된다.
          AI 추천/검색/커뮤니티 등 어디서 상세로 진입했든 즉시 인증 플로우로 유도한다.
        */}
        {ocrEvent && (
          <OcrEventBanner
            event={ocrEvent}
            onVerifyClick={handleOcrVerifyClick}
          />
        )}

        {/* 영화 상세 카드 */}
        <MovieDetailCard
          movie={movie}
          collectionMovies={collectionMovies}
          collectionMoviesLoading={isCollectionMoviesLoading}
          relatedMovies={relatedMovies}
          relatedMoviesLoading={isRelatedMoviesLoading}
          onWishlistToggle={handleWishlistToggle}
          isWishlisted={isWishlisted}
          wishlistLoading={isWishlistLoading}
          onReviewWrite={handleReviewWriteClick}
          hasReviewed={hasMyReview}
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

        {/* OCR 실관람 인증 제출 모달 (2026-04-14 신규) */}
        <OcrVerificationModal
          isOpen={showOcrModal}
          event={ocrEvent}
          onClose={() => setShowOcrModal(false)}
          onSuccess={handleOcrVerifySuccess}
        />

        {/* 리뷰 섹션 */}
        <S.ReviewsSection>
          <S.ReviewsHeader>
            <S.SectionTitle>
              리뷰 {reviews.length > 0 && <span>({reviews.length})</span>}
            </S.SectionTitle>
            <S.ReviewWriteButton
              type="button"
              onClick={handleReviewWriteClick}
              $completed={hasMyReview}
            >
              {reviewWriteButtonLabel}
            </S.ReviewWriteButton>
          </S.ReviewsHeader>
          {/* movieId를 전달해야 리뷰 좋아요 토글 API를 호출할 수 있다 */}
          <ReviewList reviews={reviews} movieId={id} onReviewsChange={setReviews} />
        </S.ReviewsSection>
      </S.InnerContainer>
    </S.MovieDetailPageWrapper>
  );
}
