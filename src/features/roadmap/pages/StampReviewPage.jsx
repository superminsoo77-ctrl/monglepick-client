/**
 * 도장깨기 리뷰 작성/조회/재인증 페이지.
 *
 * 모드 분기 (location.state 기준):
 * - 작성    (readOnly=false, resubmit=false): 리뷰 제출 → AI 검증 → 결과 표시
 * - 읽기    (readOnly=true):                  기존 리뷰 불러와 읽기 전용 표시
 * - 재인증  (resubmit=true):                  관리자 반려 사유 표시 + 재제출 → AI 검증
 *
 * AI 검증 결과 (handleSubmit):
 * - AUTO_VERIFIED  → 성공 알림 + 코스 상세로 이동
 * - NEEDS_REVIEW   → 검토 중 안내 + 코스 상세로 이동 (pending 상태)
 * - AUTO_REJECTED  → 페이지에 AI 반려 사유 배너 표시, 수정 후 재제출 가능
 *
 * URL: /stamp/:courseId/review/:movieId
 *
 * @module features/roadmap/pages/StampReviewPage
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useModal } from '../../../shared/components/Modal';
import { ROUTES, buildPath } from '../../../shared/constants/routes';
import { completeMovie, getMovieReview } from '../api/roadmapApi';
import * as S from './StampReviewPage.styled';

const MAX_LENGTH = 500;

export default function StampReviewPage() {
  const { courseId, movieId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useModal();

  /* navigate 시 state로 영화 제목/코스 제목/모드 전달받음 */
  const movieTitle = location.state?.movieTitle || '영화';
  const courseTitle = location.state?.courseTitle || '코스';
  const readOnly = location.state?.readOnly === true;
  const resubmit = location.state?.resubmit === true;
  const rejectionReason = location.state?.rejectionReason || '';

  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  /* readOnly 또는 resubmit(이전 리뷰 프리필)일 때 로딩 */
  const [isLoadingReview, setIsLoadingReview] = useState(readOnly || resubmit);
  const [reviewLoadError, setReviewLoadError] = useState(false);
  /** AI 자동 반려 시 페이지에 표시할 사유 (AUTO_REJECTED) */
  const [aiRationale, setAiRationale] = useState('');

  /** 읽기/재인증 모드 진입 시 기존 리뷰 로드 */
  useEffect(() => {
    if (!readOnly && !resubmit) return;
    let cancelled = false;
    async function load() {
      setIsLoadingReview(true);
      setReviewLoadError(false);
      try {
        const data = await getMovieReview(courseId, movieId);
        if (!cancelled) {
          /* 백엔드 응답 필드명이 다를 수 있으므로 여러 키를 시도 */
          const text =
            data?.review ??
            data?.content ??
            data?.reviewText ??
            data?.text ??
            (typeof data === 'string' ? data : '');
          setReviewText(text);
        }
      } catch (err) {
        if (!cancelled) {
          setReviewLoadError(true);
          if (readOnly) {
            showAlert({
              title: '리뷰 불러오기 실패',
              message: err?.message || '리뷰를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
              type: 'error',
            });
          }
          /* 재인증 모드는 이전 리뷰 로드 실패해도 빈 상태로 작성 가능 */
        }
      } finally {
        if (!cancelled) setIsLoadingReview(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [readOnly, resubmit, courseId, movieId, showAlert]);

  /** 뒤로가기 — 코스 상세 페이지 */
  const handleBack = () => {
    navigate(buildPath(ROUTES.STAMP_DETAIL, { id: courseId }));
  };

  /**
   * 리뷰 제출 (작성/재인증 모드) — Backend 단일 호출 플로우.
   *
   * 2026-04-22 보안 패치: 기존 3-step (Client→Backend→Agent→Backend) 플로우는
   * 사용자가 AUTO_VERIFIED 결과를 위조해서 전달하면 AI 우회가 가능한 취약점이 있었다.
   * 이제 Backend 가 트랜잭션 내부에서 Agent 를 직접 호출하고 판정까지 완료해서 돌려준다.
   */
  const handleSubmit = async () => {
    if (!reviewText.trim()) {
      showAlert({ title: '안내', message: '리뷰를 작성해 주세요.', type: 'info' });
      return;
    }
    setIsSubmitting(true);
    setAiRationale('');
    try {
      const result = await completeMovie(courseId, movieId, reviewText.trim());

      const reviewStatus = result?.reviewStatus ?? 'PENDING';
      const agentAvailable = result?.agentAvailable !== false;

      if (reviewStatus === 'AUTO_VERIFIED') {
        showAlert({
          title: resubmit ? '재인증 완료!' : '도장 완료!',
          message: `'${movieTitle}' 영화 도장을 찍었어요!`,
          type: 'success',
        });
        navigate(buildPath(ROUTES.STAMP_DETAIL, { id: courseId }));

      } else if (reviewStatus === 'NEEDS_REVIEW') {
        showAlert({
          title: '검토 중',
          message: '리뷰가 제출되었어요. AI 판단이 애매하여 관리자가 확인 중이에요. 잠시 후 반영됩니다.',
          type: 'info',
        });
        navigate(buildPath(ROUTES.STAMP_DETAIL, { id: courseId }));

      } else if (reviewStatus === 'AUTO_REJECTED') {
        const rationale =
          result?.rationale ||
          '영화 내용과 관련 없는 리뷰로 판단되었어요. 영화의 인물, 장면, 줄거리를 바탕으로 다시 작성해 주세요.';
        setAiRationale(rationale);
        showAlert({
          title: 'AI 검증 반려',
          message: '리뷰가 영화 내용과 맞지 않아 반려되었어요. 아래 사유를 확인하고 수정해 주세요.',
          type: 'error',
        });

      } else {
        // PENDING — Agent 장애 또는 이미 인증된 영화
        showAlert({
          title: '제출 완료',
          message: agentAvailable
            ? '리뷰가 제출되었어요. 검토 후 인증이 반영될 예정이에요.'
            : '리뷰가 제출되었어요. AI 검토가 일시적으로 불가능해 잠시 후 관리자가 확인할 예정이에요.',
          type: 'info',
        });
        navigate(buildPath(ROUTES.STAMP_DETAIL, { id: courseId }));
      }
    } catch (err) {
      showAlert({
        title: '오류',
        message: err?.message || '저장에 실패했습니다.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageTitle = readOnly ? '내 리뷰 보기' : resubmit ? '시청 재인증' : '도장깨기 리뷰';
  const isEditable = !readOnly;

  return (
    <S.Container>
      <S.BackLink onClick={handleBack}>← 코스로 돌아가기</S.BackLink>

      <S.Header>
        <S.CourseName>{courseTitle}</S.CourseName>
        <S.PageTitle>{pageTitle}</S.PageTitle>
        <S.MovieName>🎬 {movieTitle}</S.MovieName>
      </S.Header>

      {/* 관리자 반려 사유 배너 (재인증 모드) */}
      {resubmit && (
        <S.RejectionBanner>
          <S.RejectionTitle>반려 사유</S.RejectionTitle>
          <S.RejectionReason>
            {rejectionReason || '관리자가 별도 사유를 남기지 않았습니다.'}
          </S.RejectionReason>
        </S.RejectionBanner>
      )}

      {/* AI 자동 반려 사유 배너 (제출 후 AUTO_REJECTED) */}
      {aiRationale && (
        <S.RejectionBanner>
          <S.RejectionTitle>AI 검증 반려 사유</S.RejectionTitle>
          <S.RejectionReason>{aiRationale}</S.RejectionReason>
        </S.RejectionBanner>
      )}

      <S.Card>
        <S.Label>
          {readOnly
            ? '작성한 리뷰'
            : resubmit
            ? '수정할 리뷰를 작성해 주세요.'
            : aiRationale
            ? '리뷰를 수정하여 다시 제출해 주세요.'
            : '이 영화를 보고 느낀 점을 자유롭게 적어주세요.'}
        </S.Label>
        {isEditable && !resubmit && !aiRationale && (
          <S.Hint>
            줄거리, 인상적인 장면, 감독의 연출 방식, 배우의 연기 등
            영화와 관련된 내용이라면 무엇이든 좋아요.
          </S.Hint>
        )}
        {resubmit && (
          <S.Hint>반려 사유를 참고하여 리뷰를 보완한 후 다시 제출해 주세요.</S.Hint>
        )}
        {aiRationale && (
          <S.Hint>위 AI 반려 사유를 참고하여 영화 내용을 구체적으로 작성해 주세요.</S.Hint>
        )}

        {isLoadingReview ? (
          <S.Textarea
            value="불러오는 중..."
            readOnly
            style={{ color: 'var(--text-muted)', minHeight: 120 }}
          />
        ) : reviewLoadError && readOnly ? (
          <S.Textarea
            value="리뷰를 불러오지 못했습니다."
            readOnly
            style={{ color: 'var(--color-error, #e57373)', minHeight: 120, cursor: 'default' }}
          />
        ) : (
          <S.Textarea
            placeholder={
              readOnly
                ? '작성한 리뷰가 없어요.'
                : '예) 봉준호 감독의 계단 연출이 인상적이었어요. 빈부격차를 공간으로 표현한 방식이 탁월했습니다...'
            }
            value={reviewText}
            onChange={isEditable ? (e) => setReviewText(e.target.value) : undefined}
            readOnly={!isEditable}
            maxLength={isEditable ? MAX_LENGTH : undefined}
            autoFocus={isEditable && !aiRationale}
            style={!isEditable ? { cursor: 'default', opacity: 0.85 } : undefined}
          />
        )}

        {isEditable && (
          <S.CharCount $warn={reviewText.length > MAX_LENGTH * 0.9}>
            {reviewText.length} / {MAX_LENGTH}
          </S.CharCount>
        )}
      </S.Card>

      <S.Actions>
        <S.CancelBtn onClick={handleBack} disabled={isSubmitting}>
          {readOnly ? '돌아가기' : '취소'}
        </S.CancelBtn>
        {isEditable && (
          <S.SubmitBtn
            onClick={handleSubmit}
            disabled={isSubmitting || !reviewText.trim()}
          >
            {isSubmitting
              ? 'AI 검증 중...'
              : resubmit || aiRationale
              ? '재제출'
              : '도장 찍기 완료'}
          </S.SubmitBtn>
        )}
      </S.Actions>
    </S.Container>
  );
}
