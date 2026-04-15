/**
 * 추천 내역 페이지.
 *
 * AI가 추천한 영화 이력을 조회하고,
 * 찜/봤어요 토글 및 만족도 피드백 기능을 제공한다.
 *
 * 필터 탭: 전체 / 찜한 영화 / 본 영화
 * 페이지네이션: 20개 단위
 *
 * @module features/recommendation/pages/RecommendationPage
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../../../shared/components/Modal';
import { ROUTES, buildPath } from '../../../shared/constants/routes';
import {
  getRecommendations,
  toggleWishlist,
  toggleWatched,
  submitFeedback,
} from '../api/recommendationApi';
import RecommendationCard from '../components/RecommendationCard';
import * as S from './RecommendationPage.styled';

/** 필터 탭 정의 */
const FILTER_TABS = [
  { key: 'ALL', label: '전체' },
  { key: 'WISHLIST', label: '찜한 영화' },
  { key: 'WATCHED', label: '본 영화' },
];

/** 페이지 크기 */
const PAGE_SIZE = 20;

export default function RecommendationPage() {
  const navigate = useNavigate();
  const { showAlert } = useModal();

  /* 필터 상태 */
  const [activeFilter, setActiveFilter] = useState('ALL');
  /* 추천 목록 */
  const [recommendations, setRecommendations] = useState([]);
  /* 페이지네이션 */
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  /* 로딩 */
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 추천 내역 로드.
   */
  const loadRecommendations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRecommendations({
        page,
        size: PAGE_SIZE,
        status: activeFilter,
      });
      setRecommendations(data?.content || []);
      setTotalPages(data?.totalPages || 0);
    } catch (err) {
      console.error('[Recommendation] 로드 실패:', err.message);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, activeFilter]);

  /* 필터/페이지 변경 시 재로드 */
  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  /**
   * 필터 탭 변경 시 페이지 초기화.
   */
  const handleFilterChange = (filterKey) => {
    setActiveFilter(filterKey);
    setPage(0);
  };

  /**
   * 찜 토글 핸들러.
   */
  const handleToggleWishlist = async (recommendationId) => {
    try {
      const result = await toggleWishlist(recommendationId);
      /* 목록에서 해당 항목 업데이트 */
      setRecommendations((prev) =>
        prev.map((rec) =>
          rec.id === recommendationId
            ? { ...rec, wishlisted: result?.wishlisted ?? !rec.wishlisted }
            : rec,
        ),
      );
    } catch {
      showAlert({ title: '오류', message: '찜 처리에 실패했습니다.', type: 'error' });
    }
  };

  /**
   * 봤어요 토글 핸들러.
   */
  const handleToggleWatched = async (recommendationId) => {
    try {
      const result = await toggleWatched(recommendationId);
      setRecommendations((prev) =>
        prev.map((rec) =>
          rec.id === recommendationId
            ? { ...rec, watched: result?.watched ?? !rec.watched }
            : rec,
        ),
      );
    } catch {
      showAlert({ title: '오류', message: '봤어요 처리에 실패했습니다.', type: 'error' });
    }
  };

  /**
   * 피드백 제출 핸들러.
   */
  const handleSubmitFeedback = async (recommendationId, feedback) => {
    try {
      await submitFeedback(recommendationId, feedback);
      setRecommendations((prev) =>
        prev.map((rec) =>
          rec.id === recommendationId
            ? { ...rec, feedbackRating: feedback.rating, feedbackComment: feedback.comment }
            : rec,
        ),
      );
      showAlert({ title: '감사합니다', message: '평가가 등록되었습니다.', type: 'success' });
    } catch {
      showAlert({ title: '오류', message: '평가 등록에 실패했습니다.', type: 'error' });
    }
  };

  /**
   * 영화 클릭 → 상세 페이지 이동.
   */
  const handleClickMovie = (movieId) => {
    if (movieId) {
      navigate(buildPath(ROUTES.MOVIE_DETAIL, { id: movieId }));
    }
  };

  return (
    <S.Container>
      <S.PageTitle>추천 내역</S.PageTitle>

      {/* 필터 탭 */}
      <S.FilterTabs>
        {FILTER_TABS.map((tab) => (
          <S.FilterTab
            key={tab.key}
            $active={activeFilter === tab.key}
            onClick={() => handleFilterChange(tab.key)}
          >
            {tab.label}
          </S.FilterTab>
        ))}
      </S.FilterTabs>

      {/* 로딩 스켈레톤 */}
      {isLoading && (
        <S.CardList>
          {[1, 2, 3].map((i) => (
            <S.SkeletonCard key={i}>
              <S.SkeletonPoster />
              <S.SkeletonInfo>
                <S.SkeletonLine $w="60%" $h={18} />
                <S.SkeletonLine $w="40%" />
                <S.SkeletonLine $w="90%" />
                <S.SkeletonLine $w="30%" />
              </S.SkeletonInfo>
            </S.SkeletonCard>
          ))}
        </S.CardList>
      )}

      {/* 추천 목록 */}
      {!isLoading && recommendations.length > 0 && (
        <>
          <S.CardList>
            {recommendations.map((rec) => (
              <RecommendationCard
                // 2026-04-15: Backend `RecommendationHistoryResponse` 는 `recommendationLogId` 로 내려오므로
                // `rec.id` 는 undefined 였음 → React key 중복 + 자식 컴포넌트의 피드백/토글 API 에 undefined FK 전달.
                key={rec.recommendationLogId}
                recommendation={rec}
                onToggleWishlist={handleToggleWishlist}
                onToggleWatched={handleToggleWatched}
                onSubmitFeedback={handleSubmitFeedback}
                onClickMovie={handleClickMovie}
              />
            ))}
          </S.CardList>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <S.Pagination>
              <S.PageBtn
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                이전
              </S.PageBtn>
              <S.PageInfo>
                {page + 1} / {totalPages}
              </S.PageInfo>
              <S.PageBtn
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                다음
              </S.PageBtn>
            </S.Pagination>
          )}
        </>
      )}

      {/* 빈 상태 */}
      {!isLoading && recommendations.length === 0 && (
        <S.EmptyState>
          <S.EmptyIcon>&#x1F3AC;</S.EmptyIcon>
          <S.EmptyTitle>
            {activeFilter === 'ALL' && '아직 추천 내역이 없어요'}
            {activeFilter === 'WISHLIST' && '찜한 영화가 없어요'}
            {activeFilter === 'WATCHED' && '본 영화가 없어요'}
          </S.EmptyTitle>
          <S.EmptyDesc>
            AI에게 영화를 추천받아 보세요!
          </S.EmptyDesc>
          <S.CtaBtn onClick={() => navigate(ROUTES.CHAT)}>
            AI 추천 받으러 가기
          </S.CtaBtn>
        </S.EmptyState>
      )}
    </S.Container>
  );
}
