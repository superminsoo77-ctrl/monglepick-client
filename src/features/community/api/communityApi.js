/**
 * 커뮤니티(Community) API 모듈.
 *
 * 게시글의 CRUD 관련 HTTP 요청을 처리한다.
 * 리뷰 관련 API는 features/review/api/reviewApi.js로 분리되었다.
 * axios interceptor가 JWT 토큰을 자동 주입하며, 비인증 상태에서도 조회는 가능하다.
 */

import api from '../../../shared/api/axiosInstance';
import { COMMUNITY_ENDPOINTS } from '../../../shared/constants/api';

function normalizePost(post) {
  if (!post) return post;
  const nickname =
    (typeof post.author === 'string' ? post.author : post.author?.nickname) ||
    post.authorNickname  ||
    post.userNickname    ||
    post.nickname        ||
    null;
  return {
    ...post,
    author: { nickname },
  };
}

export async function getPosts({ page = 1, size = 20, sort = 'latest', category, keyword } = {}) {
  const zeroBasedPage = Math.max(0, page - 1);

  const params = { page: zeroBasedPage, size, sort };

  if (category && category !== 'all') {
    params.category = category;
  }

  if (keyword && keyword.trim()) {
    params.keyword = keyword.trim(); // ✅ keyword 추가
  }

  const pageData = await api.get(COMMUNITY_ENDPOINTS.POSTS, { params });

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

export async function getPostDetail(postId) {
  const data = await api.get(COMMUNITY_ENDPOINTS.POST_DETAIL(postId));
  return normalizePost(data);
}

export async function createPost({ title, content, category = 'FREE', imageUrls = [] }) {
  return api.post(COMMUNITY_ENDPOINTS.CREATE_POST, { title, content, category, imageUrls });
}

export async function updatePost(postId, { title, content, category }) {
  return api.put(COMMUNITY_ENDPOINTS.UPDATE_POST(postId), { title, content, category });
}

export async function deletePost(postId) {
  return api.delete(COMMUNITY_ENDPOINTS.UPDATE_POST(postId));
}


export async function togglePostLike(postId) {
  return api.post(COMMUNITY_ENDPOINTS.POST_LIKE(postId));
}

export async function getSharedPlaylists({ page = 1, size = 15 } = {}) {
  const data = await api.get(COMMUNITY_ENDPOINTS.SHARED_PLAYLISTS, {
    params: { page: Math.max(0, page - 1), size },
  });
  return {
    posts: data?.content ?? [],
    total: data?.totalElements ?? 0,
    page: (data?.number ?? 0) + 1,
    totalPages: data?.totalPages ?? 0,
  };
}

export async function sharePlaylist({ title, content, playlistId }) {
  return api.post(COMMUNITY_ENDPOINTS.CREATE_POST, {
    title,
    content,
    category: 'PLAYLIST_SHARE',
    playlistId,
  });
}

export async function uploadImages(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const data = await api.post('/api/v1/images/upload', formData, {
    headers: { 'Content-Type': undefined },
  });
  return data.urls;
}
/**
 * 플레이리스트를 비공개로 전환할 때 연결된 공유 게시글을 삭제한다.
 *
 * postId 대신 playlistId로 서버에서 게시글을 찾아 삭제하므로,
 * 페이지 새로고침으로 postId가 소실되어도 안전하게 삭제된다.
 *
 * @param {number} playlistId - 비공개로 전환할 플레이리스트 ID
 * @returns {Promise<void>}
 */
export async function deletePlaylistPost(playlistId) {
  return api.delete(`${COMMUNITY_ENDPOINTS.POSTS}/playlist/${playlistId}`);
}

/**
 * 커뮤니티 "실관람인증" 탭용 OCR 이벤트 공개 목록 조회 (2026-04-14 신규).
 *
 * - 비로그인 허용 (Backend SecurityConfig 에서 permitAll)
 * - 서버가 ACTIVE/READY 상태 + 아직 끝나지 않은 이벤트만 반환 (클라이언트에서 별도 필터 불필요)
 * - 응답 필드: eventId, movieId, movieTitle, moviePosterPath,
 *   title(이벤트 제목), memo(상세 설명), startDate, endDate, status
 *
 * @returns {Promise<Array>} OCR 이벤트 카드 배열. 없으면 빈 배열.
 */
export async function getOcrEvents() {
  /*
   * Backend OcrEventController 는 ApiResponse 래퍼를 사용하므로
   * axios interceptor 가 response.data 까지만 벗겨내고, 실제 페이로드는
   *   { success: true, data: [...], error: null }
   * 형태로 들어온다. 배열은 wrapper.data 에서 꺼낸다.
   */
  const wrapper = await api.get(COMMUNITY_ENDPOINTS.OCR_EVENTS);
  const list = wrapper?.data ?? wrapper; // 래퍼 유무와 관계없이 안전 fallback
  return Array.isArray(list) ? list : [];
}
