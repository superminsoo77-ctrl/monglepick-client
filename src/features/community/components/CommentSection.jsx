/**
 * 게시글 댓글 섹션 컴포넌트.
 *
 * <p>특정 게시글(postId)에 대한 댓글 목록 조회·작성·삭제·좋아요 토글을 제공한다.
 * Backend PostCommentController(/api/v1/posts/{postId}/comments)와 연동된다.</p>
 *
 * <h3>권한 UI</h3>
 * <ul>
 *   <li>비인증 사용자: 목록만 조회 가능, "로그인 필요" 안내 박스 표시</li>
 *   <li>인증 사용자: 작성 폼 노출, 본인 댓글은 삭제 버튼 노출</li>
 * </ul>
 *
 * <h3>상태 관리 전략</h3>
 * <p>서버 응답을 로컬 state에 저장하고, 작성·삭제·좋아요 토글 시
 * 로컬 state를 낙관적으로 갱신한 뒤 실패 시 재조회(fallback)한다.</p>
 *
 * @param {Object} props
 * @param {number|string} props.postId - 부모 게시글 ID
 */

import { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../../../shared/stores/useAuthStore';
import { useModal } from '../../../shared/components/Modal';
import Loading from '../../../shared/components/Loading/Loading';
import { formatRelativeTime } from '../../../shared/utils/formatters';
import {
  getComments,
  createComment,
  deleteComment,
  toggleCommentLike,
} from '../api/commentApi';
import * as S from './CommentSection.styled';

/** 댓글 최대 글자 수 (Backend Bean Validation과 일치) */
const MAX_LENGTH = 2000;

export default function CommentSection({ postId }) {
  /* 인증 상태 */
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const currentUser = useAuthStore((s) => s.user);

  /* 커스텀 모달 */
  const { showAlert, showConfirm } = useModal();

  /* 댓글 목록 (Spring Page content 배열) */
  const [comments, setComments] = useState([]);
  /* 로딩 상태 */
  const [isLoading, setIsLoading] = useState(true);
  /* 입력 중 댓글 내용 */
  const [content, setContent] = useState('');
  /* 제출 중 여부 */
  const [isSubmitting, setIsSubmitting] = useState(false);
  /* 삭제/좋아요 처리 중인 댓글 ID */
  const [processingId, setProcessingId] = useState(null);
  /* 현재 세션에서 좋아요를 누른 댓글 ID 집합 (낙관적 UI) */
  const [likedIds, setLikedIds] = useState(() => new Set());

  /**
   * 댓글 목록을 로드한다 (첫 페이지, size=50).
   */
  const loadComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getComments(postId, { page: 0, size: 50 });
      setComments(data?.content || []);
    } catch (err) {
      console.error('댓글 목록 조회 실패:', err);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (postId) loadComments();
  }, [postId, loadComments]);

  /**
   * 댓글 작성 제출 핸들러.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newComment = await createComment(postId, { content: trimmed });
      /* 작성 성공 시 목록 맨 아래에 추가 (서버 기본 정렬: createdAt ASC) */
      setComments((prev) => [...prev, newComment]);
      setContent('');
    } catch (err) {
      await showAlert({
        title: '댓글 작성 실패',
        message: err.message || '댓글 작성 중 오류가 발생했습니다.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 댓글 삭제 핸들러 — 본인만 가능.
   */
  const handleDelete = async (comment) => {
    if (processingId) return;

    const confirmed = await showConfirm({
      title: '댓글 삭제',
      message: '정말 이 댓글을 삭제하시겠습니까?',
      type: 'warning',
      confirmLabel: '삭제',
    });
    if (!confirmed) return;

    setProcessingId(comment.commentId);
    try {
      await deleteComment(postId, comment.commentId);
      /* 서버가 소프트 삭제로 처리하므로 목록은 재조회하여 "삭제된 댓글입니다" 마스킹 반영 */
      await loadComments();
    } catch (err) {
      await showAlert({
        title: '삭제 실패',
        message: err.message || '댓글 삭제 중 오류가 발생했습니다.',
        type: 'error',
      });
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * 댓글 좋아요 토글 핸들러.
   *
   * 서버 응답({ liked, likeCount })로 해당 댓글의 likeCount와 likedIds를 갱신한다.
   */
  const handleToggleLike = async (comment) => {
    if (processingId) return;
    setProcessingId(comment.commentId);
    try {
      const res = await toggleCommentLike(postId, comment.commentId);
      setComments((prev) =>
        prev.map((c) =>
          c.commentId === comment.commentId
            ? { ...c, likeCount: res.likeCount }
            : c,
        ),
      );
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (res.liked) next.add(comment.commentId);
        else next.delete(comment.commentId);
        return next;
      });
    } catch (err) {
      await showAlert({
        title: '좋아요 실패',
        message: err.message || '좋아요 처리 중 오류가 발생했습니다.',
        type: 'error',
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <S.Section>
      <S.Title>댓글 {comments.length > 0 && `(${comments.length})`}</S.Title>

      {/* 작성 폼 — 인증 상태에 따라 분기 */}
      {isAuthenticated ? (
        <S.Form onSubmit={handleSubmit}>
          <S.Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 입력하세요 (최대 2,000자)"
            maxLength={MAX_LENGTH}
            disabled={isSubmitting}
          />
          <S.FormFooter>
            <S.CharCount>
              {content.length} / {MAX_LENGTH.toLocaleString()}
            </S.CharCount>
            <S.SubmitBtn type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? '등록 중...' : '댓글 등록'}
            </S.SubmitBtn>
          </S.FormFooter>
        </S.Form>
      ) : (
        <S.LoginNotice>
          댓글을 작성하려면 로그인이 필요합니다.
        </S.LoginNotice>
      )}

      {/* 목록 */}
      {isLoading ? (
        <Loading message="댓글 불러오는 중..." />
      ) : comments.length === 0 ? (
        <S.Empty>첫 번째 댓글을 작성해 보세요.</S.Empty>
      ) : (
        <S.List>
          {comments.map((comment) => {
            /* 작성자 본인 여부 — 삭제 버튼 표시 조건 */
            const isOwner =
              isAuthenticated && currentUser?.id === comment.userId;
            /* 현재 세션에서 좋아요를 눌렀는지 여부 (낙관적 UI 상태) */
            const liked = likedIds.has(comment.commentId);

            return (
              <S.Item key={comment.commentId} $deleted={comment.isDeleted}>
                <S.ItemHeader>
                  <S.Author>
                    <S.AuthorName>
                      {comment.userId || '익명'}
                    </S.AuthorName>
                    <span>· {formatRelativeTime(comment.createdAt)}</span>
                  </S.Author>
                </S.ItemHeader>

                <S.Body>{comment.content}</S.Body>

                {/* 삭제된 댓글에는 액션 버튼 노출 안 함 */}
                {!comment.isDeleted && (
                  <S.Actions>
                    <S.ActionBtn
                      type="button"
                      $liked={liked}
                      disabled={!isAuthenticated || processingId === comment.commentId}
                      onClick={() => handleToggleLike(comment)}
                      aria-label="댓글 좋아요 토글"
                    >
                      {liked ? '♥' : '♡'} {comment.likeCount ?? 0}
                    </S.ActionBtn>

                    {isOwner && (
                      <S.ActionBtn
                        type="button"
                        disabled={processingId === comment.commentId}
                        onClick={() => handleDelete(comment)}
                      >
                        삭제
                      </S.ActionBtn>
                    )}
                  </S.Actions>
                )}
              </S.Item>
            );
          })}
        </S.List>
      )}
    </S.Section>
  );
}
