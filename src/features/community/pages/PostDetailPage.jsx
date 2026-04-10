/**
 * 커뮤니티 게시글 상세 페이지 컴포넌트.
 *
 * <p>URL {@code /community/:postId}로 접근되며, PostList에서 클릭한 게시글을 상세 표시하고
 * 하단에 {@link CommentSection}을 포함해 댓글 작성/조회/삭제/좋아요 토글까지 수행한다.</p>
 *
 * <h3>데이터 로드</h3>
 * <ol>
 *   <li>마운트 시 {@code getPostDetail(postId)}로 게시글 상세 fetch</li>
 *   <li>성공 → Card 렌더링</li>
 *   <li>실패 → 에러 메시지 + 목록으로 돌아가기 버튼</li>
 * </ol>
 *
 * <h3>인증</h3>
 * <p>비로그인도 조회 가능하다. 댓글 작성/삭제는 CommentSection 내부에서 인증 분기한다.</p>
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPostDetail } from '../api/communityApi';
import { formatRelativeTime } from '../../../shared/utils/formatters';
import Loading from '../../../shared/components/Loading/Loading';
import CommentSection from '../components/CommentSection';
import * as S from './PostDetailPage.styled';

/** 카테고리 코드 → 한국어 라벨 */
const CATEGORY_LABEL = {
  general: '자유',
  free: '자유',
  review: '리뷰',
  question: '질문',
};

export default function PostDetailPage() {
  /* URL 파라미터에서 게시글 ID 추출 */
  const { id: postId } = useParams();
  const navigate = useNavigate();

  /* 게시글 상세 */
  const [post, setPost] = useState(null);
  /* 로딩 / 에러 상태 */
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPost() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getPostDetail(postId);
        if (!cancelled) setPost(data);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || '게시글을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    if (postId) loadPost();

    /* cleanup — 언마운트 시 비동기 응답이 이후 state 갱신에 영향 주지 않도록 차단 */
    return () => {
      cancelled = true;
    };
  }, [postId]);

  /* 로딩 중 */
  if (isLoading) {
    return (
      <S.PageWrapper>
        <S.PageInner>
          <Loading message="게시글 로딩 중..." />
        </S.PageInner>
      </S.PageWrapper>
    );
  }

  /* 에러 또는 미존재 */
  if (error || !post) {
    return (
      <S.PageWrapper>
        <S.PageInner>
          <S.BackButton onClick={() => navigate('/community')}>
            ← 목록으로
          </S.BackButton>
          <S.Status>{error || '게시글을 찾을 수 없습니다.'}</S.Status>
        </S.PageInner>
      </S.PageWrapper>
    );
  }

  return (
    <S.PageWrapper>
      <S.PageInner>
        {/* 상단 뒤로가기 */}
        <S.BackButton onClick={() => navigate('/community')}>
          ← 목록으로
        </S.BackButton>

        {/* 게시글 카드 */}
        <S.Card>
          {/* 카테고리 + 작성 시간 */}
          <S.Header>
            {post.category && (
              <S.CategoryBadge>
                {CATEGORY_LABEL[post.category] || post.category}
              </S.CategoryBadge>
            )}
            <S.Time>{formatRelativeTime(post.createdAt)}</S.Time>
          </S.Header>

          {/* 제목 */}
          <S.Title>{post.title}</S.Title>

          {/* 작성자 */}
          <S.AuthorBar>
            <span>작성자</span>
            <strong>{post.author?.nickname || '익명'}</strong>
          </S.AuthorBar>

          {/* 본문 */}
          <S.Body>{post.content}</S.Body>
        </S.Card>

        {/* 댓글 섹션 — postId를 넘겨 내부에서 독립적으로 fetch */}
        <CommentSection postId={postId} />
      </S.PageInner>
    </S.PageWrapper>
  );
}
