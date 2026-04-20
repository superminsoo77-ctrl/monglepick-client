import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPostDetail, deletePost, togglePostLike, reportPost } from '../api/communityApi';
import { formatRelativeTime } from '../../../shared/utils/formatters';
import Loading from '../../../shared/components/Loading/Loading';
import CommentSection from '../components/CommentSection';
import ReportModal from '../components/ReportModal';
import useAuthStore from '../../../shared/stores/useAuthStore';
import * as S from './PostDetailPage.styled';

const TOAST_DURATION = 3000;
const TOAST_LEAVE_MS = 350;

const CATEGORY_LABEL = {
  FREE: '자유',
  DISCUSSION: '토론',
  RECOMMENDATION: '추천',
  NEWS: '뉴스',
  PLAYLIST_SHARE: '플리공유',
};

export default function PostDetailPage() {
  const { id: postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const showToast = (message, type = 'success') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type, leaving: false }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, leaving: true } : t));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, TOAST_LEAVE_MS);
    }, TOAST_DURATION);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadPost() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getPostDetail(postId);
        if (!cancelled) {
          setPost(data);
          setLikeCount(data.likeCount ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || '게시글을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    if (postId) loadPost();
    return () => { cancelled = true; };
  }, [postId]);

  const handleDeleteConfirmed = async () => {
    setDeleteConfirm(false);
    setIsDeleting(true);
    try {
      await deletePost(postId);
      navigate('/community');
    } catch {
      showToast('삭제에 실패했습니다. 다시 시도해주세요.', 'error');
      setIsDeleting(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      showToast('로그인이 필요합니다.', 'warning');
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    setLiked((prev) => !prev);
    setLikeCount((prev) => liked ? prev - 1 : prev + 1);

    try {
      const result = await togglePostLike(postId);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      setLiked((prev) => !prev);
      setLikeCount((prev) => liked ? prev + 1 : prev - 1);
      showToast('좋아요 처리에 실패했습니다.', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  const isOwner = user && post && user.id === post.authorId;

  const handleReport = async ({ reason, detail }) => {
    try {
      await reportPost(postId, { reason, detail });
      showToast('신고가 접수되었습니다. 검토 후 조치하겠습니다.', 'success');
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      if (status === 409) {
        showToast('이미 신고한 게시글입니다.', 'warning');
      } else {
        showToast('신고 접수에 실패했습니다. 다시 시도해주세요.', 'error');
      }
      throw err;
    }
  };

  if (isLoading) {
    return (
      <S.PageWrapper>
        <S.PageInner>
          <Loading message="게시글 로딩 중..." />
        </S.PageInner>
      </S.PageWrapper>
    );
  }

  if (error || !post) {
    return (
      <S.PageWrapper>
        <S.PageInner>
          <S.BackButton onClick={() => navigate('/community')}>← 목록으로</S.BackButton>
          <S.Status>{error || '게시글을 찾을 수 없습니다.'}</S.Status>
        </S.PageInner>
      </S.PageWrapper>
    );
  }

  return (
    <S.PageWrapper>
      <S.PageInner>
        <S.BackButton onClick={() => navigate('/community')}>← 목록으로</S.BackButton>

        <S.Card>
          {/* 헤더 — 카테고리, 시간, 삭제 버튼 */}
          <S.Header>
            {post.category && (
              <S.CategoryBadge>
                {CATEGORY_LABEL[post.category] || post.category}
              </S.CategoryBadge>
            )}
            <S.Time>{formatRelativeTime(post.createdAt)}</S.Time>
            {user && !isOwner && (
              <S.ReportButton onClick={() => setReportOpen(true)}>
                신고
              </S.ReportButton>
            )}
            {isOwner && (
              <S.DeleteButton onClick={() => setDeleteConfirm(true)} disabled={isDeleting}>
                {isDeleting ? '삭제 중...' : '삭제'}
              </S.DeleteButton>
            )}
          </S.Header>

          {/* 제목 */}
          <S.Title>{post.title}</S.Title>

          {/* 작성자 */}
          <S.AuthorBar>
            <span>작성자</span>
            <strong>{post.author?.nickname || '익명'}</strong>
            <S.ViewCount>👁 {post.viewCount ?? 0}</S.ViewCount>
          </S.AuthorBar>

          {/* 본문 */}
          <S.Body>{post.content}</S.Body>

          {/* 첨부 이미지
              로컬: http://localhost:8080/images/userId/파일명.jpg
              서버: http://210.109.15.187/images/userId/파일명.jpg
              추후 S3 전환 시 URL 형식만 바뀌고 이 코드는 그대로 유지 */}
          {post.imageUrls && post.imageUrls.length > 0 && (
            <S.ImageList>
              {post.imageUrls.map((url, i) => (
                <S.ImageItem key={i}>
                  <img src={url} alt={`첨부 이미지 ${i + 1}`} />
                </S.ImageItem>
              ))}
            </S.ImageList>
          )}

          {/* 좋아요 버튼 */}
          <S.LikeBar>
            <S.LikeButton onClick={handleLike} $liked={liked} disabled={isLiking}>
              {liked ? '❤️' : '🤍'} {likeCount}
            </S.LikeButton>
          </S.LikeBar>
        </S.Card>

        {/* 댓글 */}
        <CommentSection postId={postId} />
      </S.PageInner>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReport}
      />

      {deleteConfirm && (
        <S.ConfirmOverlay onClick={() => setDeleteConfirm(false)}>
          <S.ConfirmBox onClick={(e) => e.stopPropagation()}>
            <S.ConfirmText>게시글을 삭제하시겠습니까?</S.ConfirmText>
            <S.ConfirmButtons>
              <S.ConfirmCancelBtn onClick={() => setDeleteConfirm(false)}>취소</S.ConfirmCancelBtn>
              <S.ConfirmDeleteBtn onClick={handleDeleteConfirmed} disabled={isDeleting}>
                {isDeleting ? '삭제 중...' : '삭제'}
              </S.ConfirmDeleteBtn>
            </S.ConfirmButtons>
          </S.ConfirmBox>
        </S.ConfirmOverlay>
      )}

      {toasts.length > 0 && (
        <S.ToastContainer>
          {toasts.map((t) => (
            <S.Toast key={t.id} $type={t.type} $leaving={t.leaving}>
              {t.message}
            </S.Toast>
          ))}
        </S.ToastContainer>
      )}
    </S.PageWrapper>
  );
}