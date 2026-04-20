import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPostDetail, deletePost, togglePostLike, reportPost } from '../api/communityApi';
import { formatRelativeTime } from '../../../shared/utils/formatters';
import Loading from '../../../shared/components/Loading/Loading';
import CommentSection from '../components/CommentSection';
import useAuthStore from '../../../shared/stores/useAuthStore';
import * as S from './PostDetailPage.styled';

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
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [reportDetail, setReportDetail] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportError, setReportError] = useState(null);

  const REPORT_PRESETS = ['혐오 발언', '욕설', '광고/스팸', '음란물', '개인정보 노출', '기타'];

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

  const handleDelete = async () => {
    const confirmed = window.confirm('게시글을 삭제하시겠습니까?');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deletePost(postId);
      navigate('/community');
    } catch {
      alert('삭제에 실패했습니다. 다시 시도해주세요.');
      setIsDeleting(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
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
      alert('좋아요 처리에 실패했습니다.');
    } finally {
      setIsLiking(false);
    }
  };

  const isOwner = user && post && user.id === post.authorId;

  const reportReason = selectedPreset
    ? selectedPreset === '기타'
      ? reportDetail.trim()
      : `${selectedPreset}${reportDetail.trim() ? ` - ${reportDetail.trim()}` : ''}`
    : '';

  const handleReport = async () => {
    if (!reportReason) return;
    setIsReporting(true);
    setReportError(null);
    try {
      await reportPost(postId, reportReason);
      setShowReportModal(false);
      setSelectedPreset(null);
      setReportDetail('');
      alert('신고가 접수되었습니다.');
    } catch (err) {
      const code = err?.code;
      if (code === 'DUPLICATE_REPORT') {
        setReportError('이미 신고한 게시글입니다.');
      } else {
        setReportError(err.message || '신고 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setIsReporting(false);
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
            {isOwner && (
              <S.DeleteButton onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? '삭제 중...' : '삭제'}
              </S.DeleteButton>
            )}
            {!isOwner && user && (
              <S.ReportButton onClick={() => { setShowReportModal(true); setReportError(null); }}>
                🚨 신고
              </S.ReportButton>
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

      {/* 신고 모달 */}
      {showReportModal && (
        <>
          <S.ModalOverlay onClick={() => { setShowReportModal(false); setSelectedPreset(null); setReportDetail(''); }} />
          <S.ModalBox>
            <S.ModalTitle>게시글 신고</S.ModalTitle>
            <S.ModalDesc>신고 사유를 선택해주세요.</S.ModalDesc>
            <S.PresetGrid>
              {REPORT_PRESETS.map((preset) => (
                <S.PresetChip
                  key={preset}
                  type="button"
                  $active={selectedPreset === preset}
                  onClick={() => { setSelectedPreset(preset); setReportDetail(''); setReportError(null); }}
                >
                  {preset}
                </S.PresetChip>
              ))}
            </S.PresetGrid>
            {selectedPreset && (
              <S.ModalTextarea
                placeholder={selectedPreset === '기타' ? '신고 사유를 직접 입력해주세요.' : '추가 설명 (선택)'}
                value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value)}
                rows={3}
                maxLength={300}
              />
            )}
            {reportError && <S.ModalError>{reportError}</S.ModalError>}
            <S.ModalButtonRow>
              <S.ModalCancelBtn type="button" onClick={() => { setShowReportModal(false); setSelectedPreset(null); setReportDetail(''); }}>
                취소
              </S.ModalCancelBtn>
              <S.ModalConfirmBtn
                type="button"
                onClick={handleReport}
                disabled={isReporting || !reportReason}
              >
                {isReporting ? '신고 중...' : '신고하기'}
              </S.ModalConfirmBtn>
            </S.ModalButtonRow>
          </S.ModalBox>
        </>
      )}
    </S.PageWrapper>
  );
}