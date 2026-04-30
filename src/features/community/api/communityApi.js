/**
 * 커뮤니티(Community) API 모듈.
 *
 * 게시글의 CRUD 관련 HTTP 요청을 처리한다.
 * 리뷰 관련 API는 features/review/api/reviewApi.js로 분리되었다.
 * axios interceptor가 JWT 토큰을 자동 주입하며, 비인증 상태에서도 조회는 가능하다.
 */

import api from '../../../shared/api/axiosInstance';
import { COMMUNITY_ENDPOINTS } from '../../../shared/constants/api';
import { getDisplayNickname, isWithdrawnUser } from '../../../shared/utils/userDisplay';

function normalizePost(post) {
  if (!post) return post;
  const authorSource = {
    ...post,
    ...(typeof post.author === 'object' ? post.author : {}),
    nickname: typeof post.author === 'string' ? post.author : post.author?.nickname,
  };
  const withdrawn = isWithdrawnUser(authorSource);
  return {
    ...post,
    author: { nickname: getDisplayNickname(authorSource, null), withdrawn },
    authorEquippedAvatarUrl: withdrawn ? null : post.authorEquippedAvatarUrl,
    authorEquippedBadgeUrl: withdrawn ? null : post.authorEquippedBadgeUrl,
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

  return {
    posts: (pageData?.content ?? []).map(normalizePost),
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

export async function reportPost(postId, { reason, detail = '' }) {
  return api.post(COMMUNITY_ENDPOINTS.POST_REPORT(postId), { reason, detail });
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

/**
 * 특정 영화의 "현재 진행 중" OCR 실관람 인증 이벤트 단건 조회 (2026-04-14 신규).
 *
 * 영화 상세 페이지 상단 배너 노출 여부 판단에 사용한다.
 * 진행 중 이벤트가 없으면 null 을 반환하며, 이 때 배너를 렌더링하지 않는다.
 *
 * @param {string|number} movieId - 영화 ID
 * @returns {Promise<object|null>} 이벤트 상세(eventId/title/memo/startDate/endDate/status 등) 또는 null
 */
export async function getOcrEventByMovie(movieId) {
  if (!movieId) return null;
  try {
    // axios interceptor 가 response.data 를 벗겨주므로 wrapper = { success, data, error }
    const wrapper = await api.get(COMMUNITY_ENDPOINTS.OCR_EVENT_BY_MOVIE(movieId));
    const event = wrapper?.data ?? null;
    // 백엔드에서 없으면 data: null 로 내려온다.
    return event && typeof event === 'object' ? event : null;
  } catch (err) {
    // 404 등 네트워크 오류는 상세 페이지 렌더링을 막지 않도록 조용히 삼킨다.
    console.warn('[OCR 이벤트] by-movie 조회 실패:', err?.message || err);
    return null;
  }
}

/**
 * OCR 영수증 이미지 분석 — Python OCR 서비스 호출.
 *
 * 이미지 업로드 완료 후 서버 URL 을 전달하면, 백엔드가 Python FastAPI 로 분석을 위임하고
 * 추출 결과(영화명/관람일/인원수/신뢰도)를 반환한다.
 *
 * @param {string} imageUrl - 업로드된 영수증 이미지 서버 URL
 * @returns {Promise<{extractedMovieName:string|null, extractedWatchDate:string|null, extractedHeadcount:number|null, ocrConfidence:number|null}>}
 */
export async function analyzeOcrImage(imageUrl, eventId) {
  const wrapper = await api.post(COMMUNITY_ENDPOINTS.OCR_ANALYZE(eventId), { imageUrl }, { timeout: 150000 });
  return wrapper?.data ?? wrapper;
}

/**
 * OCR 실관람 인증 제출 (2026-04-14 신규).
 *
 * 1) `uploadImages()` 로 영수증 이미지를 먼저 업로드해 URL 을 얻는다.
 * 2) 얻은 URL 을 `imageUrl` 에 담아 본 함수로 제출한다.
 *
 * 서버는 이벤트가 ACTIVE 상태이고 종료되지 않았을 때만 허용하며,
 * 같은 유저가 같은 이벤트에 중복 제출 시 409 를 반환한다.
 *
 * @param {number} eventId - 대상 이벤트 PK
 * @param {{imageUrl: string, watchDate?: string, movieName?: string}} payload
 * @returns {Promise<{verificationId: number, eventId: number, message: string}>}
 */
export async function submitOcrVerification(eventId, payload) {
  const wrapper = await api.post(COMMUNITY_ENDPOINTS.OCR_VERIFY(eventId), payload);
  return wrapper?.data ?? wrapper;
}
