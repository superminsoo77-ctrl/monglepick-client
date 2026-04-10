/**
 * 커뮤니티(Community) API 모듈.
 *
 * 게시글의 CRUD 관련 HTTP 요청을 처리한다.
 * 리뷰 관련 API는 features/review/api/reviewApi.js로 분리되었다.
 * axios interceptor가 JWT 토큰을 자동 주입하며, 비인증 상태에서도 조회는 가능하다.
 */

/* 공용 axios 인스턴스 — JWT 자동 주입 + 401 갱신 */
import api from '../../../shared/api/axiosInstance';
/* API 상수 — shared/constants에서 가져옴 */
import { COMMUNITY_ENDPOINTS } from '../../../shared/constants/api';

// ── 정규화 헬퍼 ──

/**
 * 백엔드 게시글 응답을 프론트 표시 형식으로 정규화한다.
 *
 * 백엔드가 평면 필드(authorNickname, userNickname 등)로 반환하는 경우에도
 * author.nickname 으로 일관되게 접근할 수 있도록 보장한다.
 */
function normalizePost(post) {
  if (!post) return post;
  const nickname =
    post.author?.nickname ||
    post.authorNickname  ||
    post.userNickname    ||
    post.nickname        ||
    null;
  return {
    ...post,
    author: { ...(post.author ?? {}), nickname },
  };
}

// ── 게시글 (Posts) ──

/**
 * 게시글 목록을 조회한다.
 *
 * <h3>응답 정합성 (2026-04-08 수정)</h3>
 * <p>Backend PostController.getPosts 는 Spring {@code Page<PostResponse>} 를 반환하므로,
 * 응답 구조는 {@code { content: [...], totalElements, totalPages, number, ... }} 이다.
 * 기존 코드는 {@code result.posts} 를 찾았으나 백엔드는 {@code content} 키를 사용한다.
 * 이 함수는 호출 측이 한 번에 사용하기 편하도록 응답을 normalize 하여 반환한다.</p>
 *
 * <h3>페이지 인덱스</h3>
 * <p>Spring Page 는 0-indexed 이다 (page=0 이 첫 페이지). 호출 측은 1-indexed 로
 * 사용해도 되도록 이 함수가 내부에서 1→0 변환을 수행한다.</p>
 *
 * @param {Object} [params={}] - 조회 파라미터
 * @param {number} [params.page=1] - 페이지 번호 (1-indexed, 사용자 친화적)
 * @param {number} [params.size=20] - 페이지 크기
 * @param {string} [params.sort='latest'] - 정렬 기준 (latest, popular) — 현재 백엔드 미사용
 * @param {string} [params.category] - 카테고리 필터 (general/review/question, 미지정 시 전체)
 * @returns {Promise<{ posts: Array, total: number, page: number, totalPages: number }>}
 *          정규화된 게시글 목록 응답
 */
export async function getPosts({ page = 1, size = 20, sort = 'latest', category } = {}) {
  /* Spring Page 는 0-indexed → 1-indexed UI 와의 변환 (음수 방지 가드) */
  const zeroBasedPage = Math.max(0, page - 1);

  const params = { page: zeroBasedPage, size, sort };
  /* 카테고리는 선택 — 비었거나 'all' 이면 백엔드에 전달하지 않음(전체 조회) */
  if (category && category !== 'all') {
    params.category = category;
  }

  /* axios 응답 인터셉터가 response.data 를 unwrap → Spring Page 객체가 그대로 도착 */
  const pageData = await api.get(COMMUNITY_ENDPOINTS.POSTS, { params });

  /* 호출 측 친화적인 형태로 normalize */
  /* PLAYLIST_SHARE 는 전용 탭에서만 노출 — 일반 게시글 피드에서 제외 */
  const filtered = (pageData?.content ?? []).filter(
    (p) => p.category !== 'PLAYLIST_SHARE'
  );
  return {
    posts: filtered.map(normalizePost),
    total: pageData?.totalElements ?? 0,
    page: (pageData?.number ?? 0) + 1,
    totalPages: pageData?.totalPages ?? 0,
  };
}

/**
 * 게시글 상세 정보를 조회한다.
 *
 * @param {number|string} postId - 게시글 ID
 * @returns {Promise<Object>} 게시글 상세 (id, title, content, author, createdAt, comments 등)
 */
export async function getPostDetail(postId) {
  const data = await api.get(COMMUNITY_ENDPOINTS.POST_DETAIL(postId));
  return normalizePost(data);
}

/**
 * 새 게시글을 작성한다.
 * 인증이 필요하다 (interceptor가 Authorization 헤더 자동 포함).
 *
 * @param {Object} postData - 게시글 데이터
 * @param {string} postData.title - 게시글 제목
 * @param {string} postData.content - 게시글 내용
 * @param {string} [postData.category='general'] - 카테고리 (general, review, question)
 * @returns {Promise<Object>} 생성된 게시글 정보
 */
export async function createPost({ title, content, category = 'general' }) {
  return api.post(COMMUNITY_ENDPOINTS.CREATE_POST, { title, content, category });
}

/**
 * 게시글을 수정한다.
 * 인증이 필요하며 본인 게시글만 수정 가능하다.
 *
 * @param {number|string} postId - 게시글 ID
 * @param {Object} postData - 수정할 데이터
 * @param {string} postData.title - 게시글 제목
 * @param {string} postData.content - 게시글 내용
 * @param {string} [postData.category] - 카테고리
 * @returns {Promise<Object>} 수정된 게시글 정보
 */
export async function updatePost(postId, { title, content, category }) {
  return api.put(COMMUNITY_ENDPOINTS.UPDATE_POST(postId), { title, content, category });
}

/**
 * 게시글을 삭제한다.
 * 인증이 필요하며 본인 게시글만 삭제 가능하다.
 *
 * @param {number|string} postId - 게시글 ID
 * @returns {Promise<void>}
 */
export async function deletePost(postId) {
  return api.delete(COMMUNITY_ENDPOINTS.UPDATE_POST(postId));
}

/**
 * 게시글 좋아요를 토글한다 (인스타그램 스타일).
 *
 * @param {number|string} postId
 * @returns {Promise<{liked: boolean, likeCount: number}>}
 */
export async function togglePostLike(postId) {
  return api.post(COMMUNITY_ENDPOINTS.POST_LIKE(postId));
}

/**
 * 플레이리스트 공유 피드를 조회한다 (비로그인 허용).
 *
 * @param {Object} [params]
 * @param {number} [params.page=1]
 * @param {number} [params.size=15]
 * @returns {Promise<{ posts: Array, totalPages: number, total: number, page: number }>}
 */
export async function getSharedPlaylists({ page = 1, size = 15 } = {}) {
  const data = await api.get(COMMUNITY_ENDPOINTS.SHARED_PLAYLISTS, {
    params: { page: Math.max(0, page - 1), size },
  });
  console.log('[getSharedPlaylists] raw data:', data);
  return {
    posts: data?.content ?? [],
    total: data?.totalElements ?? 0,
    page: (data?.number ?? 0) + 1,
    totalPages: data?.totalPages ?? 0,
  };
}

/**
 * 내 플레이리스트를 커뮤니티에 공유하는 게시글을 작성한다.
 *
 * @param {Object} params
 * @param {string} params.title - 게시글 제목
 * @param {string} params.content - 게시글 본문
 * @param {number} params.playlistId - 공유할 플레이리스트 ID
 * @returns {Promise<Object>}
 */
export async function sharePlaylist({ title, content, playlistId }) {
  return api.post(COMMUNITY_ENDPOINTS.CREATE_POST, {
    title,
    content,
    category: 'PLAYLIST_SHARE',
    playlistId,
  });
}
