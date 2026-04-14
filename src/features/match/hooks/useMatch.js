/**
 * Movie Match 상태 관리 커스텀 훅.
 *
 * 두 영화를 선택하고 SSE 스트리밍으로 분석 결과를 받아오는
 * 전체 흐름의 상태를 관리한다.
 *
 * 관리 상태:
 * - selectedMovie1 / selectedMovie2: 선택된 두 영화 객체
 * - sharedFeatures: 두 영화의 공통 특성 분석 결과 (shared_features SSE 이벤트)
 * - matchResults: 추천 영화 목록 최대 5편 (match_result SSE 이벤트)
 * - currentStatus: 현재 처리 단계 메시지 (status SSE 이벤트)
 * - completedPhases: 완료된 처리 단계 목록 (체크마크 표시용)
 * - isLoading: SSE 스트리밍 진행 중 여부
 * - error: 에러 메시지
 *
 * useChat 훅 패턴을 따른다:
 * - AbortController ref로 요청 취소 지원
 * - 콜백 기반 SSE 이벤트 처리
 * - useCallback으로 함수 안정화
 */

import { useState, useCallback, useRef } from 'react';
/* Match SSE API — 같은 feature 내의 matchApi에서 가져옴 */
import { sendMatchRequest } from '../api/matchApi';

/**
 * Movie Match 상태 관리 훅.
 *
 * @param {Object} [config={}] - 훅 설정 옵션
 * @param {string} [config.userId=''] - 사용자 ID (인증된 사용자의 ID, 빈 문자열이면 익명)
 * @returns {Object} Match 상태 및 액션 함수 모음
 * @returns {Object|null} selectedMovie1 - 첫 번째로 선택된 영화 객체 (null이면 미선택)
 * @returns {Object|null} selectedMovie2 - 두 번째로 선택된 영화 객체 (null이면 미선택)
 * @returns {Object|null} sharedFeatures - 두 영화의 공통 특성 분석 결과 (null이면 미수신)
 * @returns {Object[]} matchResults - 추천 영화 목록 (최대 5편, 초기값 빈 배열)
 * @returns {string} currentStatus - 현재 처리 단계 상태 메시지
 * @returns {string[]} completedPhases - 완료된 처리 단계 phase 코드 목록
 * @returns {boolean} isLoading - SSE 스트리밍 진행 중 여부
 * @returns {string|null} error - 에러 메시지 (null이면 에러 없음)
 * @returns {function} selectMovie1 - 첫 번째 영화 선택 함수
 * @returns {function} selectMovie2 - 두 번째 영화 선택 함수
 * @returns {function} clearMovie1 - 첫 번째 영화 선택 해제 함수
 * @returns {function} clearMovie2 - 두 번째 영화 선택 해제 함수
 * @returns {function} startMatch - Match 분석 시작 함수 (SSE 스트리밍 개시)
 * @returns {function} reset - 전체 상태 초기화 함수
 * @returns {function} cancelRequest - 진행 중인 SSE 요청 취소 함수
 */
export function useMatch({ userId = '' } = {}) {
  // ── 영화 선택 상태 ──

  /** 첫 번째 선택 영화 — MovieSelector에서 선택 시 저장 */
  const [selectedMovie1, setSelectedMovie1] = useState(null);
  /** 두 번째 선택 영화 — MovieSelector에서 선택 시 저장 */
  const [selectedMovie2, setSelectedMovie2] = useState(null);

  // ── SSE 수신 데이터 상태 ──

  /** 두 영화의 공통 특성 분석 결과 (shared_features 이벤트) */
  const [sharedFeatures, setSharedFeatures] = useState(null);
  /** 추천 영화 목록 최대 5편 (match_result 이벤트) */
  const [matchResults, setMatchResults] = useState([]);

  // ── 진행 상태 ──

  /** 현재 처리 단계 메시지 — status 이벤트의 message 필드 */
  const [currentStatus, setCurrentStatus] = useState('');
  /**
   * 완료된 처리 단계 phase 코드 목록.
   * status 이벤트가 새로운 phase로 바뀔 때마다 이전 phase를 여기에 추가.
   * UI에서 체크마크(완료) 표시에 사용한다.
   */
  const [completedPhases, setCompletedPhases] = useState([]);
  /** SSE 스트리밍 진행 중 여부 */
  const [isLoading, setIsLoading] = useState(false);
  /** 에러 메시지 — null이면 에러 없음 */
  const [error, setError] = useState(null);

  // ── refs ──

  /** 요청 취소용 AbortController — cancelRequest에서 abort() 호출 */
  const abortControllerRef = useRef(null);
  /**
   * 현재 진행 중인 phase 코드를 추적하는 ref.
   * status 이벤트 수신 시 이전 phase를 completedPhases에 추가하기 위해 사용.
   * (setState 클로저 문제를 피하기 위해 ref 사용)
   */
  const currentPhaseRef = useRef('');

  // ── 영화 선택 액션 ──

  /**
   * 첫 번째 영화를 선택한다.
   * 이미 진행 중인 분석이 있으면 결과를 초기화한다.
   *
   * @param {Object} movie - 선택할 영화 객체 (searchMovies() 반환값)
   */
  const selectMovie1 = useCallback((movie) => {
    setSelectedMovie1(movie);
    // 영화가 바뀌면 이전 분석 결과 초기화
    setSharedFeatures(null);
    setMatchResults([]);
    setCompletedPhases([]);
    setCurrentStatus('');
    setError(null);
  }, []);

  /**
   * 두 번째 영화를 선택한다.
   * 이미 진행 중인 분석이 있으면 결과를 초기화한다.
   *
   * @param {Object} movie - 선택할 영화 객체 (searchMovies() 반환값)
   */
  const selectMovie2 = useCallback((movie) => {
    setSelectedMovie2(movie);
    // 영화가 바뀌면 이전 분석 결과 초기화
    setSharedFeatures(null);
    setMatchResults([]);
    setCompletedPhases([]);
    setCurrentStatus('');
    setError(null);
  }, []);

  /**
   * 첫 번째 영화 선택을 해제한다.
   */
  const clearMovie1 = useCallback(() => {
    setSelectedMovie1(null);
    // 분석 결과도 함께 초기화
    setSharedFeatures(null);
    setMatchResults([]);
    setCompletedPhases([]);
    setCurrentStatus('');
    setError(null);
  }, []);

  /**
   * 두 번째 영화 선택을 해제한다.
   */
  const clearMovie2 = useCallback(() => {
    setSelectedMovie2(null);
    // 분석 결과도 함께 초기화
    setSharedFeatures(null);
    setMatchResults([]);
    setCompletedPhases([]);
    setCurrentStatus('');
    setError(null);
  }, []);

  // ── Match 분석 액션 ──

  /**
   * 두 영화의 Match 분석을 시작한다.
   * Agent에 SSE 스트리밍 요청을 보내고 이벤트를 처리한다.
   *
   * 사전 조건: selectedMovie1과 selectedMovie2가 모두 선택된 상태여야 한다.
   * 이미 진행 중인 요청이 있으면 무시한다.
   *
   * @returns {Promise<void>}
   */
  const startMatch = useCallback(async () => {
    // 두 영화가 모두 선택되어야 분석 가능
    if (!selectedMovie1 || !selectedMovie2) return;
    // 이미 분석 진행 중이면 무시
    if (isLoading) return;

    // ── 상태 초기화 ──
    setIsLoading(true);
    setError(null);
    setSharedFeatures(null);
    setMatchResults([]);
    setCompletedPhases([]);
    setCurrentStatus('');
    currentPhaseRef.current = '';

    // AbortController 생성 (요청 취소용)
    abortControllerRef.current = new AbortController();

    try {
      await sendMatchRequest(
        {
          // 영화 ID 추출 — API 응답 형태에 따라 movie_id 또는 id 필드 사용
          movieId1: selectedMovie1.movie_id || selectedMovie1.id || String(selectedMovie1.id),
          movieId2: selectedMovie2.movie_id || selectedMovie2.id || String(selectedMovie2.id),
          userId,
        },
        {
          /**
           * status 이벤트 핸들러.
           * 새로운 phase 메시지를 받으면 현재 phase를 완료 목록에 추가하고
           * 새 phase를 currentStatus로 설정한다.
           *
           * @param {Object} data - {phase: string, message: string}
           */
          onStatus: (data) => {
            // 이전 phase가 있으면 완료 목록에 추가
            if (currentPhaseRef.current && currentPhaseRef.current !== data.phase) {
              setCompletedPhases((prev) =>
                prev.includes(currentPhaseRef.current)
                  ? prev
                  : [...prev, currentPhaseRef.current]
              );
            }
            // 현재 phase 업데이트
            currentPhaseRef.current = data.phase || '';
            setCurrentStatus(data.message || '');
          },

          /**
           * shared_features 이벤트 핸들러.
           * 두 영화의 공통 특성 분석 결과를 저장한다.
           *
           * @param {Object} data - {common_genres, common_moods, common_keywords, similarity_summary, ...}
           */
          onSharedFeatures: (data) => {
            setSharedFeatures(data);
          },

          /**
           * match_result 이벤트 핸들러.
           * 추천 영화 목록을 저장한다.
           *
           * @param {Object} data - {movies: [{movie_id, title, genres, rating, poster_path, score_detail, explanation, rank}, ...]}
           */
          onMatchResult: (data) => {
            // movies 배열이 있으면 저장, 없으면 빈 배열
            setMatchResults(data.movies || []);
          },

          /**
           * done 이벤트 핸들러.
           * 스트리밍이 정상 완료되었을 때 로딩 상태를 해제하고
           * 마지막 phase를 완료 목록에 추가한다.
           */
          onDone: () => {
            // 마지막 phase를 완료 목록에 추가
            if (currentPhaseRef.current) {
              setCompletedPhases((prev) =>
                prev.includes(currentPhaseRef.current)
                  ? prev
                  : [...prev, currentPhaseRef.current]
              );
            }
            setCurrentStatus('');
            setIsLoading(false);
          },

          /**
           * error 이벤트 핸들러.
           * SSE 스트림에서 에러가 발생했을 때 에러 메시지를 저장한다.
           *
           * @param {Object} data - {error_code: string, message: string}
           */
          onError: (data) => {
            setError(data.message || '영화 분석 중 오류가 발생했습니다.');
            // 에러 시 이전에 수신된 결과 데이터 클리어 — 에러 배너와 결과가 동시에 표시되는 문제 방지
            setMatchResults([]);
            setSharedFeatures(null);
            setCurrentStatus('');
            setIsLoading(false);
          },
        },
        abortControllerRef.current.signal,
      );
    } catch (err) {
      // AbortError는 사용자가 직접 취소한 것이므로 에러 메시지를 표시하지 않음
      if (err.name === 'AbortError') {
        setCurrentStatus('');
        setIsLoading(false);
        return;
      }

      // 그 외 네트워크 에러 / HTTP 에러 처리
      setError(err.message || '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
      setCurrentStatus('');
      setIsLoading(false);
    }
  }, [selectedMovie1, selectedMovie2, userId, isLoading]);

  /**
   * 진행 중인 SSE 요청을 취소한다.
   * AbortController.abort()를 호출하여 fetch 스트림을 즉시 중단한다.
   */
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * 전체 상태를 초기화한다.
   * 진행 중인 요청이 있으면 먼저 취소한다.
   */
  const reset = useCallback(() => {
    // 진행 중인 요청 취소
    cancelRequest();

    // 모든 상태 초기화
    setSelectedMovie1(null);
    setSelectedMovie2(null);
    setSharedFeatures(null);
    setMatchResults([]);
    setCurrentStatus('');
    setCompletedPhases([]);
    setIsLoading(false);
    setError(null);
    currentPhaseRef.current = '';
  }, [cancelRequest]);

  return {
    // 선택된 영화
    selectedMovie1,
    selectedMovie2,
    // SSE 수신 데이터
    sharedFeatures,
    matchResults,
    // 진행 상태
    currentStatus,
    completedPhases,
    isLoading,
    error,
    // 액션 함수
    selectMovie1,
    selectMovie2,
    clearMovie1,
    clearMovie2,
    startMatch,
    cancelRequest,
    reset,
  };
}
