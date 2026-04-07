/**
 * 퀴즈 API 모듈.
 *
 * Backend(:8080) /api/v1/quizzes 엔드포인트와 통신한다.
 *
 * 포함 함수:
 * - {@link getMovieQuizzes}  — 영화별 PUBLISHED 퀴즈 목록 조회 (공개)
 * - {@link getTodayQuizzes}  — 오늘의 퀴즈 목록 조회 (공개)
 * - {@link submitQuizAnswer} — 정답 제출 및 채점 (JWT 필수)
 *
 * 응답 형태 (백엔드 QuizDto 기준):
 * - QuizResponse  : { quizId, movieId, question, options: string[], rewardPoint }
 * - SubmitResponse: { correct: boolean, explanation: string|null, rewardPoint: number }
 *
 * @module features/quiz/api/quizApi
 */

import { backendApi, requireAuth } from '../../../shared/api/axiosInstance';
import { QUIZ_ENDPOINTS } from '../../../shared/constants/api';

/**
 * 특정 영화의 PUBLISHED 퀴즈 목록을 조회한다.
 *
 * 영화 상세 페이지 하단 "이 영화 퀴즈" 섹션에서 사용한다.
 * 비로그인 사용자도 조회 가능하나, 응답에 정답(correctAnswer)은 포함되지 않는다.
 *
 * @param {string} movieId - 퀴즈를 조회할 영화 ID (예: "tt0816692")
 * @returns {Promise<QuizResponse[]>} PUBLISHED 퀴즈 목록 (없으면 빈 배열)
 *
 * @example
 * const quizzes = await getMovieQuizzes('tt0816692');
 * // [{ quizId: 1, movieId: 'tt0816692', question: '...', options: [...], rewardPoint: 10 }]
 */
export async function getMovieQuizzes(movieId) {
  return backendApi.get(QUIZ_ENDPOINTS.BY_MOVIE(movieId));
}

/**
 * 오늘 날짜(quizDate = today)의 PUBLISHED 퀴즈 목록을 조회한다.
 *
 * 메인 페이지 또는 퀴즈 탭의 "오늘의 퀴즈" 섹션에서 사용한다.
 * quizDate가 오늘로 지정된 퀴즈만 반환한다.
 *
 * @returns {Promise<QuizResponse[]>} 오늘 날짜 PUBLISHED 퀴즈 목록 (없으면 빈 배열)
 *
 * @example
 * const todayQuizzes = await getTodayQuizzes();
 */
export async function getTodayQuizzes() {
  return backendApi.get(QUIZ_ENDPOINTS.TODAY);
}

/**
 * 퀴즈 정답을 제출하고 채점 결과를 받는다.
 *
 * JWT 인증 필수. 로그인되지 않은 경우 Error('로그인이 필요합니다.')를 즉시 던진다.
 * 동일 퀴즈를 여러 번 제출할 수 있으나 리워드(rewardPoint)는 최초 정답 1회에만 지급된다.
 *
 * @param {number} quizId  - 정답을 제출할 퀴즈 ID
 * @param {string} answer  - 사용자가 선택/입력한 답변 문자열
 * @returns {Promise<SubmitResponse>} 채점 결과
 *   - correct: boolean       — 정답 여부
 *   - explanation: string|null — 관리자가 작성한 정답 해설
 *   - rewardPoint: number    — 이번 제출로 지급된 포인트 (최초 정답 외에는 0)
 *
 * @throws {Error} 로그인되지 않은 경우 ('로그인이 필요합니다.')
 * @throws {Error} 퀴즈가 존재하지 않거나 출제 중이 아닌 경우 (404)
 *
 * @example
 * const result = await submitQuizAnswer(1, '크리스토퍼 놀란');
 * if (result.correct) {
 *   alert(`정답! ${result.rewardPoint}P 지급되었습니다.`);
 * } else {
 *   alert(`오답. 해설: ${result.explanation}`);
 * }
 */
export async function submitQuizAnswer(quizId, answer) {
  /* JWT 필수 가드 — 토큰 없으면 즉시 에러 throw */
  requireAuth();
  return backendApi.post(QUIZ_ENDPOINTS.SUBMIT(quizId), { answer });
}
