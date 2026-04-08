/**
 * 영화 퀴즈 페이지 (도장깨기 퀴즈).
 *
 * "오늘의 퀴즈" 목록을 조회하여 사용자가 풀 수 있도록 카드 형태로 제공한다.
 * 각 퀴즈 카드는 독립적으로 답안 선택 → 제출 → 채점 결과 표시 흐름을 갖는다.
 *
 * 데이터 흐름:
 * 1. 페이지 마운트 → {@link getTodayQuizzes} 호출 → 오늘 공개된 PUBLISHED 퀴즈 목록 로드
 * 2. 사용자가 선택지 중 하나를 고르고 제출 버튼 클릭
 * 3. {@link submitQuizAnswer} 호출 (JWT 필수) → 정답 여부 + 해설 + 리워드 응답
 * 4. 결과를 카드 내부에 표시 (재제출 가능, 리워드는 최초 1회만 지급)
 *
 * 비로그인 사용자도 문제 열람은 가능하지만, 제출 시 submitQuizAnswer 내부의
 * requireAuth()에 의해 에러가 throw 되므로 QuizCard 에서 친절한 안내로 변환한다.
 *
 * @module features/quiz/pages/QuizPage
 */

import { useState, useEffect, useCallback } from 'react';
import { getTodayQuizzes } from '../api/quizApi';
import QuizCard from '../components/QuizCard';
import * as S from './QuizPage.styled';

export default function QuizPage() {
  /** 오늘의 퀴즈 목록 (백엔드 QuizResponse[]) */
  const [quizzes, setQuizzes] = useState([]);
  /** 초기 로딩 여부 */
  const [isLoading, setIsLoading] = useState(true);
  /** 로드 실패 메시지 */
  const [loadError, setLoadError] = useState(null);

  /**
   * 오늘의 퀴즈 목록을 API 로 불러온다.
   * 실패해도 빈 배열로 degrade 하여 페이지가 깨지지 않도록 한다.
   */
  const loadQuizzes = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getTodayQuizzes();
      /* 백엔드 응답은 QuizResponse[] 이지만 ApiResponse 래퍼가 벗겨진 data 직접 반환도 가능 */
      setQuizzes(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      console.error('[QuizPage] 오늘의 퀴즈 로드 실패:', err);
      setLoadError(err.message || '퀴즈 목록을 불러올 수 없습니다.');
      setQuizzes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* 초기 1회 로드 */
  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  return (
    <S.Container>
      {/* ── 페이지 헤더 ── */}
      <S.Header>
        <S.PageTitle>오늘의 영화 퀴즈</S.PageTitle>
        <S.PageDesc>
          영화에 대한 퀴즈를 풀고 포인트를 획득해보세요!
          <br />
          정답을 맞추면 최초 1회에 한해 리워드 포인트가 지급됩니다.
        </S.PageDesc>
      </S.Header>

      {/* ── 상단 통계 요약 ── */}
      <S.StatsBar>
        <S.StatItem>
          <S.StatValue>{quizzes.length}</S.StatValue>
          <S.StatLabel>오늘의 문제</S.StatLabel>
        </S.StatItem>
        <S.StatItem>
          <S.StatValue>
            {quizzes.reduce((sum, q) => sum + (q.rewardPoint || 0), 0)}
          </S.StatValue>
          <S.StatLabel>총 리워드(P)</S.StatLabel>
        </S.StatItem>
      </S.StatsBar>

      {/* ── 로딩 상태 ── */}
      {isLoading && (
        <S.QuizList>
          {[1, 2, 3].map((i) => (
            <S.SkeletonCard key={i} />
          ))}
        </S.QuizList>
      )}

      {/* ── 로드 에러 상태 ── */}
      {!isLoading && loadError && (
        <S.ErrorBanner>
          퀴즈 목록을 불러오지 못했어요. ({loadError})
          <S.RetryButton onClick={loadQuizzes}>다시 시도</S.RetryButton>
        </S.ErrorBanner>
      )}

      {/* ── 빈 상태 ── */}
      {!isLoading && !loadError && quizzes.length === 0 && (
        <S.EmptyState>
          <S.EmptyIcon>🎬</S.EmptyIcon>
          <S.EmptyText>
            오늘은 출제된 퀴즈가 없어요.
            <br />
            내일 다시 방문해주세요!
          </S.EmptyText>
        </S.EmptyState>
      )}

      {/* ── 퀴즈 카드 목록 ── */}
      {!isLoading && !loadError && quizzes.length > 0 && (
        <S.QuizList>
          {quizzes.map((quiz, idx) => (
            /* quizId 는 고유값이라 key 로 사용. 안전 폴백으로 idx 포함 */
            <QuizCard key={quiz.quizId ?? `quiz-${idx}`} quiz={quiz} index={idx} />
          ))}
        </S.QuizList>
      )}
    </S.Container>
  );
}
