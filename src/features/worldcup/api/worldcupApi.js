/**
 * 월드컵 API 모듈.
 *
 * Backend의 WorldcupController와 통신하여
 * 영화 이상형 월드컵 게임을 진행한다.
 *
 * @module features/worldcup/api/worldcupApi
 *
 * @변경이력
 * v2 — Backend DTO 필드명 정합성 수정
 *   - startWorldcup: round → roundSize, genre → genreFilter
 *   - submitPick: gameId → sessionId, winnerId → winnerMovieId
 */

import { backendApi, requireAuth } from '../../../shared/api/axiosInstance';
import { WORLDCUP_ENDPOINTS } from '../../../shared/constants/api';

/**
 * 월드컵 게임 시작.
 *
 * Backend {@code POST /api/v1/worldcup/start}를 호출한다.
 * candidateMovieIds를 전달하지 않으므로 서버가 DB에서 장르 기반 랜덤 선택을 수행한다.
 *
 * @param {Object} params
 * @param {number} [params.round=16] - 토너먼트 라운드 크기 (8, 16, 32)
 * @param {string} [params.genre]   - 장르 필터 (생략 시 전체 장르)
 * @returns {Promise<{sessionId: number, gameId: number, roundSize: number, currentRound: number, matches: Array}>}
 */
export async function startWorldcup({ round = 16, genre } = {}) {
  requireAuth();
  // Backend 필드명: roundSize (round 아님), genreFilter (genre 아님)
  const body = { roundSize: round };
  if (genre) body.genreFilter = genre;
  return backendApi.post(WORLDCUP_ENDPOINTS.START, body);
}

/**
 * 선택 제출 (한 매치 결과).
 *
 * Backend {@code POST /api/v1/worldcup/pick}를 호출한다.
 *
 * @param {Object} params
 * @param {number} params.gameId   - 게임 ID (Backend의 sessionId와 동일)
 * @param {number} params.matchId  - 매치 ID
 * @param {string} params.winnerId - 선택한 영화 ID
 * @returns {Promise<{
 *   sessionId: number,
 *   gameCompleted: boolean,
 *   isFinished: boolean,
 *   winnerMovieId: string|null,
 *   finalWinner: string|null,
 *   nextMatches: Array,
 *   nextMatch: Object|null
 * }>}
 */
export async function submitPick({ gameId, matchId, winnerId }) {
  requireAuth();
  // Backend 필드명: sessionId (gameId 아님), winnerMovieId (winnerId 아님)
  return backendApi.post(WORLDCUP_ENDPOINTS.PICK, {
    sessionId: gameId,       // Frontend gameId → Backend sessionId
    matchId,
    winnerMovieId: winnerId, // Frontend winnerId → Backend winnerMovieId
  });
}

/**
 * 게임 결과 조회.
 *
 * Backend {@code GET /api/v1/worldcup/result/{sessionId}}를 호출한다.
 * gameId는 sessionId와 동일한 값이다.
 *
 * @param {number} gameId - 게임 ID (sessionId와 동일)
 * @returns {Promise<{gameId: number, sessionId: number, winnerMovieId: string, winner: Object, completedAt: string}>}
 */
export async function getWorldcupResult(gameId) {
  requireAuth();
  return backendApi.get(WORLDCUP_ENDPOINTS.RESULT(gameId));
}

/**
 * 최근 월드컵 결과 이력.
 *
 * @param {Object} params
 * @param {number} [params.page=0]
 * @param {number} [params.size=10]
 * @returns {Promise<{content: Array, totalPages: number}>}
 */
export async function getWorldcupHistory({ page = 0, size = 10 } = {}) {
  requireAuth();
  return backendApi.get(WORLDCUP_ENDPOINTS.HISTORY, { params: { page, size } });
}
