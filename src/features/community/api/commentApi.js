/**
 * 커뮤니티 게시글 댓글(PostComment) API 모듈.
 *
 * Backend PostCommentController(/api/v1/posts/{postId}/comments)와 1:1 대응.
 * 작성·삭제·좋아요 토글은 JWT가 필요하며, 목록 조회는 비로그인도 가능하다.
 *
 * <h3>응답 구조</h3>
 * <p>목록은 Spring Page 응답({ content, totalPages, totalElements, number })이며,
 * 개별 댓글은 { commentId, postId, userId, content, parentCommentId, likeCount, isDeleted, createdAt }
 * 형태이다. 소프트 삭제된 댓글은 content가 "삭제된 댓글입니다"로 마스킹되어 전달된다.</p>
 */

/* 공용 axios 인스턴스 — JWT 자동 주입 + 401 갱신 */
import api, { requireAuth } from '../../../shared/api/axiosInstance';
/* API 상수 — shared/constants에서 가져옴 */
import { COMMUNITY_ENDPOINTS } from '../../../shared/constants/api';

/** 게시글 댓글 기본 경로 빌더 — /api/v1/posts/{postId}/comments */
const commentsBase = (postId) => `/api/v1/posts/${postId}/comments`;

/**
 * 특정 게시글의 댓글 목록을 페이징으로 조회한다 (비로그인 허용).
 *
 * @param {number|string} postId - 게시글 ID
 * @param {Object} [params={}] - 조회 파라미터
 * @param {number} [params.page=0] - Spring Page 규격 페이지 번호 (0-indexed)
 * @param {number} [params.size=20] - 페이지 크기
 * @returns {Promise<Object>} Spring Page 응답
 */
export async function getComments(postId, { page = 0, size = 20 } = {}) {
  return api.get(commentsBase(postId), { params: { page, size } });
}

/**
 * 게시글에 댓글을 작성한다 (JWT 필요).
 *
 * @param {number|string} postId - 게시글 ID
 * @param {Object} body - 작성 요청 바디
 * @param {string} body.content - 댓글 내용 (1~2000자)
 * @param {number|null} [body.parentCommentId] - 대댓글 부모 ID (null이면 최상위)
 * @returns {Promise<Object>} 생성된 댓글 응답 DTO
 */
export async function createComment(postId, { content, parentCommentId = null }) {
  requireAuth();
  return api.post(commentsBase(postId), { content, parentCommentId });
}

/**
 * 댓글을 소프트 삭제한다 (본인만, JWT 필요).
 *
 * @param {number|string} postId - 게시글 ID (라우팅용)
 * @param {number|string} commentId - 삭제할 댓글 ID
 * @returns {Promise<void>}
 */
export async function deleteComment(postId, commentId) {
  requireAuth();
  return api.delete(`${commentsBase(postId)}/${commentId}`);
}

/**
 * 댓글 좋아요 토글 (인스타그램 스타일 — 한 번 호출로 등록/취소 자동 전환, JWT 필요).
 *
 * @param {number|string} postId - 게시글 ID
 * @param {number|string} commentId - 댓글 ID
 * @returns {Promise<{liked: boolean, likeCount: number}>} 토글 후 상태
 */
export async function toggleCommentLike(postId, commentId) {
  requireAuth();
  return api.post(COMMUNITY_ENDPOINTS.COMMENT_LIKE(postId, commentId));
}
