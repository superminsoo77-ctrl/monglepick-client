/**
 * 채팅 이력 상태 관리 커스텀 훅.
 *
 * 이전 채팅 세션 목록을 조회/삭제하고, 세션을 선택하여 메시지를 로드한다.
 * SessionSidebar 컴포넌트와 ChatWindow에서 사용한다.
 *
 * @module features/chat/hooks/useSessionHistory
 */

import { useState, useCallback } from 'react';
import {
  fetchSessionList,
  fetchSessionDetail,
  deleteSessionApi,
} from '../api/sessionHistoryApi';

/** 페이지 크기 */
const PAGE_SIZE = 20;

/**
 * 채팅 이력 훅.
 *
 * @returns {Object} 이력 상태 및 액션
 * @returns {Array} sessions - 세션 목록 [{id, sessionId, title, turnCount, lastMessageAt, startedAt}]
 * @returns {boolean} isLoading - 로딩 중 여부
 * @returns {boolean} hasMore - 추가 페이지 존재 여부
 * @returns {function} loadSessions - 세션 목록 로드 (reset=true면 처음부터)
 * @returns {function} loadMoreSessions - 다음 페이지 로드
 * @returns {function} loadSessionMessages - 세션 상세 조회 (메시지 포함)
 * @returns {function} removeSession - 세션 삭제
 * @returns {function} addSessionToTop - 새 세션을 목록 맨 위에 추가
 */
export function useSessionHistory() {
  /* 세션 목록 */
  const [sessions, setSessions] = useState([]);
  /* 로딩 상태 */
  const [isLoading, setIsLoading] = useState(false);
  /* 추가 페이지 존재 여부 */
  const [hasMore, setHasMore] = useState(true);
  /* 현재 페이지 번호 */
  const [page, setPage] = useState(0);
  /* [FIX] 로드 에러 메시지 — 사이드바에서 에러 상태를 표시하기 위해 추가 */
  const [loadError, setLoadError] = useState(null);

  /**
   * 세션 목록을 로드한다.
   * reset=true이면 첫 페이지부터 다시 로드, false이면 현재 page 기준 로드.
   *
   * @param {boolean} [reset=true] - true이면 목록을 리셋하고 첫 페이지 로드
   */
  const loadSessions = useCallback(async (reset = true) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const targetPage = reset ? 0 : page;
      const data = await fetchSessionList(targetPage, PAGE_SIZE);

      // [FIX] Backend 응답 구조 검증 — data가 null이거나 content가 없으면 빈 배열로 처리
      const content = data?.content ?? [];
      const isLast = data?.last ?? true;

      if (reset) {
        setSessions(content);
        setPage(1);
      } else {
        setSessions((prev) => [...prev, ...content]);
        setPage((prev) => prev + 1);
      }
      /* 마지막 페이지인지 확인 */
      setHasMore(!isLast);
    } catch (err) {
      console.error('[SessionHistory] 목록 로드 실패:', err.message, err.status);
      // [FIX] 에러 상태를 사이드바에 표시하여 사용자에게 원인을 알림.
      // 기존에는 console.error만 남겨 에러가 완전히 무시됨.
      setLoadError(
        err.status === 401
          ? '로그인이 만료되었습니다. 다시 로그인해주세요.'
          : '대화 이력을 불러오지 못했습니다.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  /**
   * 다음 페이지를 로드한다 (더 보기 버튼용).
   */
  const loadMoreSessions = useCallback(async () => {
    if (isLoading || !hasMore) return;
    await loadSessions(false);
  }, [isLoading, hasMore, loadSessions]);

  /**
   * 세션 상세를 조회하여 메시지 배열을 반환한다.
   * 이전 대화를 이어서 진행할 때 사용한다.
   *
   * @param {string} sessionId - 세션 UUID
   * @returns {Promise<{sessionId, title, messages: Array, turnCount}>} 세션 상세 데이터
   */
  const loadSessionMessages = useCallback(async (sessionId) => {
    const data = await fetchSessionDetail(sessionId);
    return {
      sessionId: data.sessionId,
      title: data.title,
      /* messages는 JSON 문자열로 저장되어 있으므로 파싱 */
      messages: typeof data.messages === 'string'
        ? JSON.parse(data.messages)
        : data.messages,
      turnCount: data.turnCount,
    };
  }, []);

  /**
   * 세션을 삭제하고 목록에서 제거한다.
   *
   * @param {string} sessionId - 세션 UUID
   */
  const removeSession = useCallback(async (sessionId) => {
    await deleteSessionApi(sessionId);
    setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
  }, []);

  /**
   * 새 세션을 목록 맨 위에 추가한다.
   * 새 대화 시작 후 사이드바 목록을 즉시 갱신할 때 사용한다.
   *
   * @param {Object} session - 세션 메타데이터 {sessionId, title, turnCount, lastMessageAt}
   */
  const addSessionToTop = useCallback((session) => {
    setSessions((prev) => {
      /* 이미 존재하면 맨 위로 이동 */
      const filtered = prev.filter((s) => s.sessionId !== session.sessionId);
      return [session, ...filtered];
    });
  }, []);

  return {
    sessions,
    isLoading,
    hasMore,
    loadError,
    loadSessions,
    loadMoreSessions,
    loadSessionMessages,
    removeSession,
    addSessionToTop,
  };
}
