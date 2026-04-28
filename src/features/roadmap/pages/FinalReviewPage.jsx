/**
 * 도장깨기 코스 최종 감상평 작성 페이지.
 *
 * 마지막 영화가 AUTO_VERIFIED 되어 CourseCompleteResponse.requiresFinalReview=true 를 받은 뒤
 * StampReviewPage 에서 이 페이지로 이동한다.
 *
 * 제출 후 FinalReviewResponse.courseStatus === 'COMPLETED' 를 확인하면
 * 완주 완료 알림을 띄우고 코스 상세로 이동한다.
 *
 * URL: /account/stamp/:id/final-review
 */

import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useModal } from '../../../shared/components/Modal';
import { ROUTES, buildPath } from '../../../shared/constants/routes';
import { submitFinalReview } from '../api/roadmapApi';
import * as S from './StampReviewPage.styled';

const MAX_LENGTH = 1000;

export default function FinalReviewPage() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useModal();

  const courseTitle = location.state?.courseTitle || '코스';

  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => {
    navigate(buildPath(ROUTES.ACCOUNT_STAMP_DETAIL, { id: courseId }));
  };

  const handleSubmit = async () => {
    if (!reviewText.trim()) {
      showAlert({ title: '안내', message: '감상평을 작성해 주세요.', type: 'info' });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await submitFinalReview(courseId, reviewText.trim());

      if (result?.courseStatus === 'COMPLETED') {
        await showAlert({
          title: '🎉 코스 완주!',
          message: `'${courseTitle}' 코스를 완주했습니다! 리워드가 지급되었어요.`,
          type: 'success',
        });
      } else {
        await showAlert({
          title: '감상평 제출 완료',
          message: '감상평이 저장되었어요.',
          type: 'success',
        });
      }

      navigate(buildPath(ROUTES.ACCOUNT_STAMP_DETAIL, { id: courseId }), {
        replace: true,
        state: { finalReviewSubmitted: true },
      });
    } catch (err) {
      showAlert({
        title: '오류',
        message: err?.message || '감상평 제출에 실패했습니다.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <S.Container>
      <S.BackLink onClick={handleBack}>← 코스로 돌아가기</S.BackLink>

      <S.Header>
        <S.CourseName>{courseTitle}</S.CourseName>
        <S.PageTitle>최종 감상평</S.PageTitle>
        <S.MovieName>🏆 모든 영화를 완료했습니다! 코스 전체 감상을 남겨주세요.</S.MovieName>
      </S.Header>

      <S.Card>
        <S.Label>코스 전체 감상평</S.Label>
        <S.Hint>
          이 코스를 통해 느낀 점, 인상 깊었던 영화, 새로 발견한 것 등 자유롭게 적어주세요.
          감상평 제출 후 코스가 완주 처리되고 리워드가 지급됩니다.
        </S.Hint>
        <S.Textarea
          placeholder="예) 이 코스를 통해 봉준호 감독의 세계관을 깊이 이해하게 됐어요. 특히 기생충에서..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          maxLength={MAX_LENGTH}
          autoFocus
        />
        <S.CharCount $warn={reviewText.length > MAX_LENGTH * 0.9}>
          {reviewText.length} / {MAX_LENGTH}
        </S.CharCount>
      </S.Card>

      <S.Actions>
        <S.CancelBtn onClick={handleBack} disabled={isSubmitting}>
          취소
        </S.CancelBtn>
        <S.SubmitBtn
          onClick={handleSubmit}
          disabled={isSubmitting || !reviewText.trim()}
        >
          {isSubmitting ? '제출 중...' : '감상평 제출 및 완주하기'}
        </S.SubmitBtn>
      </S.Actions>
    </S.Container>
  );
}
