/**
 * 채팅 상태 관리 커스텀 훅.
 *
 * SSE 스트리밍 채팅의 전체 상태를 관리한다:
 * - messages: 사용자/봇 메시지 목록
 * - status: 현재 처리 상태 메시지
 * - isLoading: 응답 대기 중 여부
 * - error: 에러 메시지
 *
 * 메시지 타입:
 * - user: 사용자가 보낸 메시지
 * - bot: 봇 응답 텍스트
 * - movie_cards: 추천 영화 카드 목록
 */

import { useState, useCallback, useRef } from 'react';
/* SSE 채팅 API — 같은 feature 내의 chatApi에서 가져옴 */
import { sendChatMessage } from '../api/chatApi';

/** localStorage에 세션 ID를 저장하는 키 */
const SESSION_STORAGE_KEY = 'monglepick_session_id';

/**
 * 채팅 상태 관리 훅.
 *
 * @returns {Object} 채팅 상태 및 액션
 * @returns {Array} messages - 메시지 목록 [{role, content, movies?, timestamp}]
 * @returns {string} status - 현재 처리 상태 메시지 (빈 문자열이면 대기 중)
 * @returns {boolean} isLoading - 응답 대기 중 여부
 * @returns {string|null} error - 에러 메시지
 * @returns {Object|null} clarification - 후속 질문 힌트 데이터 ({question, hints, primary_field})
 * @returns {function} sendMessage - 메시지 전송 함수
 * @returns {function} clearMessages - 대화 초기화 함수
 * @returns {function} cancelRequest - 진행 중인 요청 취소 함수
 */
export function useChat() {
  // 메시지 목록: [{role: 'user'|'bot'|'movie_cards', content: string, movies?: array, timestamp: number}]
  const [messages, setMessages] = useState([]);
  // 현재 처리 상태 메시지 (status 이벤트에서 수신)
  const [status, setStatus] = useState('');
  // 응답 대기 중 여부
  const [isLoading, setIsLoading] = useState(false);
  // 에러 메시지
  const [error, setError] = useState(null);
  // 후속 질문 힌트 데이터 ({question, hints: [{field, label, options}], primary_field})
  const [clarification, setClarification] = useState(null);

  // 요청 취소용 AbortController ref
  const abortControllerRef = useRef(null);
  // 세션 ID — localStorage에서 복원하여 대화 연속성 유지 (IIFE로 초기값 계산)
  const sessionIdRef = useRef((() => {
    try {
      return localStorage.getItem(SESSION_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  })());
  // 현재 스트리밍 중인 봇 응답을 누적하는 ref (토큰 스트리밍용)
  const pendingResponseRef = useRef('');
  // 현재 스트리밍 중인 영화 카드를 누적하는 ref
  const pendingMoviesRef = useRef([]);

  /**
   * 메시지를 전송하고 SSE 스트리밍 응답을 처리한다.
   *
   * @param {string} messageText - 사용자 입력 메시지
   * @param {string|null} imageBase64 - base64 인코딩된 이미지 데이터 (선택)
   */
  const sendMessage = useCallback(async (messageText, imageBase64 = null) => {
    // 빈 메시지 무시 (이미지만 보내는 것은 허용)
    if (!messageText.trim() && !imageBase64) return;
    // 이전 요청이 진행 중이면 무시
    if (isLoading) return;

    // 상태 초기화
    setIsLoading(true);
    setError(null);
    setStatus('');
    setClarification(null);
    pendingResponseRef.current = '';
    pendingMoviesRef.current = [];

    // 사용자 메시지를 목록에 추가 (이미지 포함)
    const userMessage = {
      role: 'user',
      content: messageText,
      image: imageBase64 || null,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // AbortController 생성 (요청 취소용)
    abortControllerRef.current = new AbortController();

    try {
      await sendChatMessage(
        {
          message: messageText,
          userId: '',
          sessionId: sessionIdRef.current,
          image: imageBase64,
        },
        {
          // session 이벤트: 세션 ID를 받아 ref + localStorage에 저장
          onSession: (data) => {
            if (data.session_id) {
              sessionIdRef.current = data.session_id;
              try {
                localStorage.setItem(SESSION_STORAGE_KEY, data.session_id);
              } catch {
                // localStorage 접근 실패 시 무시 (시크릿 모드 등)
              }
            }
          },

          // status 이벤트: 처리 상태 업데이트
          onStatus: (data) => {
            setStatus(data.message || '');
          },

          // movie_card 이벤트: 추천 영화 누적
          onMovieCard: (movieData) => {
            pendingMoviesRef.current = [...pendingMoviesRef.current, movieData];
          },

          // clarification 이벤트: 후속 질문 힌트 저장
          onClarification: (data) => {
            setClarification(data);
          },

          // token 이벤트: 응답 텍스트 누적 (스트리밍)
          onToken: (data) => {
            pendingResponseRef.current += data.delta || '';

            // 실시간으로 봇 메시지 업데이트 (마지막 봇 메시지를 교체)
            setMessages((prev) => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];

              // 마지막 메시지가 봇 응답이면 텍스트 업데이트
              if (lastMsg && lastMsg.role === 'bot') {
                newMessages[newMessages.length - 1] = {
                  ...lastMsg,
                  content: pendingResponseRef.current,
                };
              } else {
                // 새 봇 메시지 추가
                newMessages.push({
                  role: 'bot',
                  content: pendingResponseRef.current,
                  timestamp: Date.now(),
                });
              }
              return newMessages;
            });
          },

          // done 이벤트: 스트리밍 완료
          onDone: () => {
            // 영화 카드가 있으면 봇 응답 앞에 삽입
            if (pendingMoviesRef.current.length > 0) {
              setMessages((prev) => {
                const newMessages = [...prev];
                // 마지막 봇 메시지 찾기
                const lastBotIdx = newMessages.findLastIndex((m) => m.role === 'bot');

                // 영화 카드 메시지를 봇 응답 앞에 삽입
                const movieMessage = {
                  role: 'movie_cards',
                  movies: pendingMoviesRef.current,
                  timestamp: Date.now(),
                };

                if (lastBotIdx >= 0) {
                  // 봇 응답 바로 앞에 영화 카드 삽입
                  newMessages.splice(lastBotIdx, 0, movieMessage);
                } else {
                  // 봇 응답이 없으면 마지막에 추가
                  newMessages.push(movieMessage);
                }

                return newMessages;
              });
            }

            setStatus('');
            setIsLoading(false);
          },

          // error 이벤트: 에러 처리
          onError: (data) => {
            setError(data.message || '알 수 없는 에러가 발생했습니다.');
            setClarification(null);
            setStatus('');
            setIsLoading(false);
          },
        },
        abortControllerRef.current.signal,
      );
    } catch (err) {
      // AbortError는 사용자가 취소한 것이므로 에러로 처리하지 않음
      if (err.name === 'AbortError') {
        // 부분 응답이 있으면 "[취소됨]" 표시를 붙여서 보존
        const partialText = pendingResponseRef.current;
        if (partialText) {
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && lastMsg.role === 'bot') {
              newMessages[newMessages.length - 1] = {
                ...lastMsg,
                content: partialText + '\n\n[응답이 중단되었습니다]',
                cancelled: true,
              };
            }
            return newMessages;
          });
        } else {
          // 부분 응답이 없으면 취소 안내 메시지 추가
          setMessages((prev) => [
            ...prev,
            {
              role: 'bot',
              content: '요청이 취소되었습니다.',
              cancelled: true,
              timestamp: Date.now(),
            },
          ]);
        }
        setStatus('');
        setIsLoading(false);
        return;
      }

      setError(err.message || '서버 연결에 실패했습니다.');
      setStatus('');
      setIsLoading(false);
    }
  }, [isLoading]);

  /**
   * 대화 내용을 전부 초기화한다.
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setStatus('');
    setError(null);
    setClarification(null);
    // 세션 ID 초기화 + localStorage 삭제
    sessionIdRef.current = '';
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // localStorage 접근 실패 시 무시
    }
  }, []);

  /**
   * 진행 중인 SSE 요청을 취소한다.
   */
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    messages,
    status,
    isLoading,
    error,
    clarification,
    sendMessage,
    clearMessages,
    cancelRequest,
  };
}
