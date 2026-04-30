/**
 * 커뮤니티 게시글 목록 컴포넌트.
 *
 * 게시글들을 리스트 형태로 표시한다.
 * 각 항목은 제목, 작성자, 작성일, 댓글 수 등을 보여준다.
 * 클릭 시 게시글 상세 페이지로 이동한다.
 *
 * 개선 사항:
 * - 좌측 카테고리 컬러 바 (4px border-left)
 * - 메타 정보에 이모지 아이콘 추가
 * - 빈 상태에 EmptyState 컴포넌트 적용
 * - 로딩 시 Skeleton 표시
 *
 * @param {Object} props
 * @param {Array} props.posts - 게시글 배열
 * @param {boolean} [props.loading=false] - 로딩 상태
 */

/* 포맷팅 유틸 — shared/utils에서 가져옴 */
import { formatRelativeTime, truncateText } from '../../../shared/utils/formatters';
/* 스켈레톤 로더 — shared/components에서 가져옴 */
import Skeleton from '../../../shared/components/Skeleton/Skeleton';
/* 빈 상태 컴포넌트 — shared/components에서 가져옴 */
import EmptyState from '../../../shared/components/EmptyState/EmptyState';
import * as S from './PostList.styled';

export default function PostList({ posts = [], loading = false }) {
  // 로딩 중 — 스켈레톤 3개 표시
  if (loading) {
    return (
      <S.Wrapper>
        {[1, 2, 3].map((n) => (
          <S.SkeletonItem key={n}>
            <Skeleton variant="text" height="16px" width="60px" />
            <Skeleton variant="text" height="20px" width="80%" />
            <Skeleton variant="text" height="14px" width="100%" />
            <Skeleton variant="text" height="12px" width="40%" />
          </S.SkeletonItem>
        ))}
      </S.Wrapper>
    );
  }

  // 게시글이 없을 때 — EmptyState 컴포넌트
  if (!posts || posts.length === 0) {
    return (
      <EmptyState
        icon="📝"
        title="아직 작성된 게시글이 없습니다"
        description="첫 번째 게시글을 작성해 보세요!"
      />
    );
  }

  return (
    <S.Wrapper>
      {posts.map((post) => (
        <S.Item
          key={post.id}
          $category={post.category || 'free'}
        >
          {/* S.ItemLink는 styled(Link)이므로 to prop 그대로 전달 */}
          <S.ItemLink to={`/community/${post.id}`}>
            {/* 게시글 헤더 — 카테고리 배지 + 작성 시간 */}
            <S.ItemHeader>
              {post.category && (
                <S.CategoryBadge $category={post.category}>
  {post.category === 'FREE' ? '자유' :
   post.category === 'DISCUSSION' ? '토론' :
   post.category === 'RECOMMENDATION' ? '추천' :
   post.category === 'NEWS' ? '뉴스' :
   post.category === 'free' ? '자유' :
   post.category === 'review' ? '리뷰' :
   post.category === 'question' ? '질문' : '자유'}
</S.CategoryBadge>
              )}
              <S.PostTime>
                📅 {formatRelativeTime(post.createdAt)}
              </S.PostTime>
            </S.ItemHeader>

            {/* 제목 */}
            <S.PostTitle>{post.title}</S.PostTitle>

            {/* 내용 미리보기 */}
            <S.Preview>
              {truncateText(post.content, 120)}
            </S.Preview>

            {/* 하단 메타 정보 */}
            <S.Meta>
              {/* 작성자 — 2026-04-27: 아바타 imageUrl + 배지 SVG 노출.
                  Backend PostResponse 는 author 를 string 닉네임 + authorEquippedAvatarUrl/BadgeUrl 로 분리.
                  레거시 author 객체(.nickname) 형태도 호환. */}
              <S.Author>
                {(post.authorProfileImageUrl || post.authorEquippedAvatarUrl) ? (
                  <S.AuthorAvatar
                    src={post.authorProfileImageUrl || post.authorEquippedAvatarUrl}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextSibling?.style && (e.currentTarget.nextSibling.style.display = 'inline-flex');
                    }}
                  />
                ) : null}
                <S.AuthorInitial
                  style={{ display: (post.authorProfileImageUrl || post.authorEquippedAvatarUrl) ? 'none' : 'inline-flex' }}
                >
                  {(post.author?.nickname || post.author || '?')[0]}
                </S.AuthorInitial>
                <span>{post.author?.nickname || post.author || '익명'}</span>
                {post.authorEquippedBadgeUrl && (
                  <S.AuthorBadge
                    src={post.authorEquippedBadgeUrl}
                    alt={post.authorEquippedBadgeName || '배지'}
                    title={post.authorEquippedBadgeName || '배지'}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
              </S.Author>

              {/* 통계 (좋아요, 댓글) */}
              {/* 통계 (좋아요, 댓글) */}
<S.Stats>
  <S.Stat>❤️ {post.likeCount ?? 0}</S.Stat>
  <S.Stat>💬 {post.commentCount ?? 0}</S.Stat>
  <S.Stat>👁 {post.viewCount ?? 0}</S.Stat>
</S.Stats>
            </S.Meta>
          </S.ItemLink>
        </S.Item>
      ))}
    </S.Wrapper>
  );
}
