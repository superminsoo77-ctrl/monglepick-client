/**
 * 개별 퀴즈 카드 컴포넌트.
 *
 * 하나의 퀴즈에 대한 문제 + 선택지 + 제출 + 결과 표시 흐름을 캡슐화한다.
 * 상위 페이지(QuizPage)는 여러 카드를 리스트 형태로 렌더링하기만 하면 된다.
 *
 * 상태:
 * - selected  : 현재 사용자가 고른 선택지
 * - submitting: 제출 API 호출 중 여부
 * - result    : 채점 결과 { correct, explanation, rewardPoint } | null
 * - error     : 제출 실패 시 에러 메시지 (로그인 필요 포함)
 *
 * 동작:
 * 1. 사용자는 선택지 중 하나를 클릭하여 `selected`를 세팅
 * 2. "정답 제출" 버튼 클릭 → submitQuizAnswer 호출
 *    - 로그인 되지 않았다면 "로그인이 필요합니다" 메시지 노출
 *    - 성공 시 result 로 교체 → 정/오답 + 해설 + 리워드 표시
 * 3. "다시 풀기" 버튼으로 상태 초기화 가능 (리워드는 최초 1회만 지급)
 *
 * @module features/quiz/components/QuizCard
 */

import { useState, useCallback } from 'react';
import { submitQuizAnswer } from '../api/quizApi';
import * as S from './QuizCard.styled';

/**
 * 퀴즈 카드 컴포넌트.
 *
 * @param {Object} props
 * @param {Object} props.quiz  - 백엔드 QuizResponse (quizId/movieId/question/options/rewardPoint)
 * @param {number} [props.index] - 카드 순번 (번호 표시용)
 * @param {(result: Object) => void} [props.onSubmitted] - 채점 응답을 받은 직후 호출되는 콜백.
 *   QuizPage 가 "내 응시 현황" 카드를 즉시 리페치하기 위한 hook (2026-04-29).
 */
export default function QuizCard({ quiz, index = 0, onSubmitted }) {
  /** 사용자가 고른 선택지 텍스트 */
  const [selected, setSelected] = useState(null);
  /** 제출 API 호출 중 플래그 */
  const [submitting, setSubmitting] = useState(false);
  /** 채점 결과 — 백엔드 SubmitResponse. quiz.solved=true면 이미 참여한 상태로 초기화 */
  const [result, setResult] = useState(quiz?.solved === true ? { _alreadySolved: true } : null);
  /** 제출 실패 에러 메시지 */
  const [error, setError] = useState(null);

  /** 현재 제출 가능 여부 — 선택 되어 있고 제출 중 아니고 아직 결과가 없을 때 */
  const canSubmit = selected !== null && !submitting && !result;

  /**
   * 정답 제출 핸들러.
   *
   * submitQuizAnswer 내부의 requireAuth() 가 비로그인 시 에러를 throw 하므로,
   * 여기서 잡아 error 상태에 표시한다.
   */
  const handleSubmit = useCallback(async () => {
    if (!quiz?.quizId || selected === null) return;

    setSubmitting(true);
    setError(null);
    try {
      const resp = await submitQuizAnswer(quiz.quizId, selected);
      setResult(resp);
      /* 응시 현황 카드 즉시 갱신을 위해 부모에게 알림 (옵셔널) */
      if (typeof onSubmitted === 'function') {
        onSubmitted(resp);
      }
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      if (status === 409) {
        /* 이미 제출한 퀴즈 — 잠금 상태로 전환 */
        setResult({ _alreadySolved: true });
      } else {
        const msg = err?.message?.includes('로그인')
          ? '정답을 제출하려면 로그인이 필요해요.'
          : err?.message || '제출 처리 중 오류가 발생했어요.';
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }, [quiz?.quizId, selected, onSubmitted]);


  /* 선택지가 string 배열이 아닐 경우(예: {text, id}) 방어적 정규화 */
  const options = Array.isArray(quiz?.options)
    ? quiz.options.map((opt) => (typeof opt === 'string' ? opt : opt?.text ?? String(opt)))
    : [];

  return (
    <S.Card $solved={result !== null} $correct={result?.correct}>
      {/* ── 카드 헤더: 번호 + 리워드 배지 ── */}
      <S.CardHeader>
        <S.QuizNumber>Q{index + 1}</S.QuizNumber>
        {quiz?.rewardPoint > 0 && (
          <S.RewardBadge>+{quiz.rewardPoint}P</S.RewardBadge>
        )}
      </S.CardHeader>

      {/* ── 문제 ── */}
      <S.Question>{quiz?.question ?? '문제를 불러올 수 없습니다.'}</S.Question>

      {/* ── 선택지 목록 ── */}
      <S.OptionList>
        {options.map((opt, i) => {
          const isSelected = selected === opt;
          /* 채점 후 정답/오답 하이라이트 — result.correctAnswer 가 없는 경우에도 선택만 표시 */
          const showResult = result !== null;
          const isUserChoice = showResult && isSelected;
          const wasCorrect = showResult && isUserChoice && result?.correct;
          const wasWrong = showResult && isUserChoice && !result?.correct;

          return (
            <S.OptionButton
              key={`${opt}-${i}`}
              type="button"
              $selected={isSelected}
              $correct={wasCorrect}
              $wrong={wasWrong}
              /* 결과가 나온 뒤에는 버튼 비활성화 (다시 풀기 필요) */
              disabled={showResult || submitting}
              onClick={() => {
                setSelected(opt);
                setError(null);
              }}
            >
              <S.OptionNumber>{i + 1}</S.OptionNumber>
              <S.OptionText>{opt}</S.OptionText>
            </S.OptionButton>
          );
        })}
      </S.OptionList>

      {/* ── 에러 메시지 ── */}
      {error && <S.ErrorMsg>{error}</S.ErrorMsg>}

      {/* ── 채점 결과 영역 ── */}
      {result && (
        result._alreadySolved ? (
          <S.ResultBox $correct={false}>
            <S.ResultTitle>이미 참여한 퀴즈입니다.</S.ResultTitle>
            <S.ResultExplanation>이 퀴즈는 한 번만 풀 수 있어요.</S.ResultExplanation>
          </S.ResultBox>
        ) : (
          <S.ResultBox $correct={result.correct}>
            <S.ResultTitle>
              {result.correct ? '🎉 정답입니다!' : '😢 오답이에요'}
            </S.ResultTitle>
            {result.explanation && (
              <S.ResultExplanation>{result.explanation}</S.ResultExplanation>
            )}
            {result.rewardPoint > 0 && (
              <S.RewardEarned>+{result.rewardPoint}P 획득!</S.RewardEarned>
            )}
          </S.ResultBox>
        )
      )}

      {/* ── 액션 버튼 영역 — 결과가 나오면 버튼 없음 ── */}
      {!result && (
        <S.ActionRow>
          <S.SubmitButton
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {submitting ? '채점 중...' : '정답 제출'}
          </S.SubmitButton>
        </S.ActionRow>
      )}
    </S.Card>
  );
}
