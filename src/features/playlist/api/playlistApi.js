/**
 * 플레이리스트 API 모듈.
 *
 * Backend의 PlaylistController와 통신하여
 * 플레이리스트 CRUD 및 영화 추가/제거를 수행한다.
 *
 * @module features/playlist/api/playlistApi
 */

import { backendApi, requireAuth } from '../../../shared/api/axiosInstance';
import { PLAYLIST_ENDPOINTS } from '../../../shared/constants/api';

/**
 * 플레이리스트 목록 조회 (페이징).
 *
 * @param {Object} params
 * @param {number} [params.page=0]
 * @param {number} [params.size=20]
 * @returns {Promise<{content: Array, totalPages: number}>}
 */
export async function getPlaylists({ page = 0, size = 20 } = {}) {
  requireAuth();
  const res = await backendApi.get(PLAYLIST_ENDPOINTS.LIST, { params: { page, size } });
  return res?.data ?? res;
}

/**
 * 커뮤니티 공유 모달용 — 아직 공유하지 않은 내 플레이리스트만 조회.
 *
 * Backend `findShareableByUserId` 가 PLAYLIST_SHARE 미공유분만 반환하므로
 * 클라이언트에서 별도 필터링 불필요. 응답은 ShareablePlaylistResponse
 * (movieCount/isShared 포함) 의 페이지.
 *
 * @param {Object} params
 * @param {number} [params.page=0]
 * @param {number} [params.size=20]
 * @returns {Promise<{content: Array, totalPages: number, totalElements: number}>}
 */
export async function getShareablePlaylists({ page = 0, size = 20 } = {}) {
  requireAuth();
  const res = await backendApi.get(PLAYLIST_ENDPOINTS.SHAREABLE, { params: { page, size } });
  return res?.data ?? res;
}

/**
 * 플레이리스트 상세 조회 (영화 목록 포함).
 *
 * @param {string|number} playlistId
 * @returns {Promise<{id, title, description, movies: Array, movieCount}>}
 */
export async function getPlaylistDetail(playlistId) {
  requireAuth();
  const res = await backendApi.get(PLAYLIST_ENDPOINTS.DETAIL(playlistId));
  return res?.data ?? res;
}

/**
 * 플레이리스트 생성.
 *
 * @param {Object} data
 * @param {string} data.title - 제목
 * @param {string} [data.description] - 설명
 * @returns {Promise<{id, title, description}>}
 */
export async function createPlaylist({ title, description, isPublic = false }) {
  requireAuth();
  return backendApi.post(PLAYLIST_ENDPOINTS.CREATE, { playlistName: title, description, isPublic });
}

/**
 * 플레이리스트 수정.
 *
 * @param {string|number} playlistId
 * @param {Object} data - {title, description}
 * @returns {Promise<void>}
 */
export async function updatePlaylist(playlistId, { title, description, isPublic }) {
  requireAuth();
  return backendApi.put(PLAYLIST_ENDPOINTS.UPDATE(playlistId), { playlistName: title, description, isPublic });
}

/**
 * 플레이리스트 삭제.
 *
 * @param {string|number} playlistId
 * @returns {Promise<void>}
 */
export async function deletePlaylist(playlistId) {
  requireAuth();
  return backendApi.delete(PLAYLIST_ENDPOINTS.DELETE(playlistId));
}

/**
 * 플레이리스트에 영화 추가.
 *
 * @param {string|number} playlistId
 * @param {string} movieId
 * @returns {Promise<void>}
 */
export async function addMovieToPlaylist(playlistId, movieId) {
  requireAuth();
  return backendApi.post(PLAYLIST_ENDPOINTS.ADD_MOVIE(playlistId), { movieId });
}

/**
 * 플레이리스트에서 영화 제거.
 *
 * @param {string|number} playlistId
 * @param {string} movieId
 * @returns {Promise<void>}
 */
export async function removeMovieFromPlaylist(playlistId, movieId) {
  requireAuth();
  return backendApi.delete(PLAYLIST_ENDPOINTS.REMOVE_MOVIE(playlistId, movieId));
}

/**
 * 플레이리스트 좋아요 토글.
 * 이미 좋아요면 취소(DELETE), 없으면 추가(POST).
 *
 * @param {string|number} playlistId
 * @param {boolean} liked - 현재 좋아요 상태 (true면 취소, false면 추가)
 * @returns {Promise<void>}
 */
export async function togglePlaylistLike(playlistId, liked) {
  requireAuth();
  if (liked) {
    return backendApi.delete(PLAYLIST_ENDPOINTS.LIKE(playlistId));
  }
  return backendApi.post(PLAYLIST_ENDPOINTS.LIKE(playlistId));
}

/**
 * 공유된 플레이리스트를 내 플레이리스트로 가져오기(복사).
 *
 * @param {string|number} playlistId - 원본 플레이리스트 ID
 * @returns {Promise<{newPlaylistId: number}>}
 */
export async function importPlaylist(playlistId) {
  requireAuth();
  const res = await backendApi.post(PLAYLIST_ENDPOINTS.IMPORT(playlistId));
  return res?.data ?? res;
}
