/**
 * 채팅 상태 관리 커스텀 훅.
 *
 * SSE 스트리밍 채팅의 전체 상태를 관리한다:
 * - messages: 사용자/봇 메시지 목록
 * - status: 현재 처리 상태 메시지
 * - isLoading: 응답 대기 중 여부
 * - error: 에러 메시지
 * - pointInfo: 포인트 차감/잔액 정보 ({balance, deducted, freeUsage})
 * - quotaError: 쿼터/포인트 관련 에러 (INSUFFICIENT_POINT / INPUT_TOO_LONG / QUOTA_EXCEEDED)
 *
 * 메시지 타입:
 * - user: 사용자가 보낸 메시지
 * - bot: 봇 응답 텍스트
 * - movie_cards: 추천 영화 카드 목록
 */

import { useState, useCallback, useRef } from 'react';
/* react-router-dom — 세션 ID 를 URL 에 반영하여 단일 진실 원본(SSOT)으로 관리 */
import { useNavigate } from 'react-router-dom';
/* SSE 채팅 API — 같은 feature 내의 chatApi에서 가져옴 */
import { sendChatMessage } from '../api/chatApi';

/**
 * 채팅 상태 관리 훅.
 *
 * @param {Object} [config={}] - 훅 설정 옵션
 * @param {string} [config.userId=''] - 사용자 ID (인증된 사용자의 ID, 빈 문자열이면 익명)
 * @returns {Object} 채팅 상태 및 액션
 * @returns {Array} messages - 메시지 목록 [{role, content, movies?, timestamp}]
 * @returns {string} status - 현재 처리 상태 메시지 (빈 문자열이면 대기 중)
 * @returns {boolean} isLoading - 응답 대기 중 여부
 * @returns {string|null} error - 에러 메시지
 * @returns {Object|null} clarification - 후속 질문 힌트 데이터
 *   ({question, hints, primary_field, suggestions: [{text, value, reason, tags}], allow_custom})
 *   - suggestions: Claude Code 스타일 AI 생성 제안 카드 (2026-04-15 추가)
 * @returns {Object|null} pointInfo - 포인트 정보 ({balance, deducted, freeUsage})
 * @returns {Object|null} quotaError - 쿼터/포인트 에러 ({error_code, message, ...상세 필드})
 * @returns {function} sendMessage - 메시지 전송 함수
 * @returns {function} clearMessages - 대화 초기화 함수
 * @returns {function} cancelRequest - 진행 중인 요청 취소 함수
 * @returns {function} dismissQuotaError - 쿼터 에러 배너 닫기 함수
 */
export function useChat({ userId = '' } = {}) {
  /*
   * 세션 ID 의 단일 진실 원본(SSOT)은 URL(`/chat/:sessionId`) 이다.
   * - 새 세션 발급 시 onSession 콜백에서 navigate 로 URL 을 교체한다.
   * - 새로고침/뒤로가기/홈 복귀 시 ChatWindow 의 urlSessionId 기반 복원 useEffect 가 동작한다.
   * - localStorage 에는 세션 ID 를 저장하지 않는다 (이중 관리 방지).
   */
  const navigate = useNavigate();
  // 메시지 목록: [{role: 'user'|'bot'|'movie_cards', content: string, movies?: array, timestamp: number}]
  const [messages, setMessages] = useState([]);
  // 현재 처리 상태 메시지 (status 이벤트에서 수신)
  const [status, setStatus] = useState('');
  // 응답 대기 중 여부
  const [isLoading, setIsLoading] = useState(false);
  // 에러 메시지
  const [error, setError] = useState(null);
  // 후속 질문 힌트 데이터
  // ({question, hints: [{field, label, options}], primary_field,
  //   suggestions: [{text, value, reason, tags}], allow_custom})
  // suggestions 는 Claude Code 스타일 AI 생성 제안 카드 (2026-04-15 추가).
  const [clarification, setClarification] = useState(null);
  // 포인트 차감/잔액 정보 ({balance: 잔액, deducted: 차감액, freeUsage: 무료 이용 여부})
  const [pointInfo, setPointInfo] = useState(null);
  // 쿼터/포인트 관련 에러 ({error_code, message, ...상세 필드})
  // error_code: "INSUFFICIENT_POINT" | "INPUT_TOO_LONG" | "QUOTA_EXCEEDED"
  const [quotaError, setQuotaError] = useState(null);

  // 요청 취소용 AbortController ref
  const abortControllerRef = useRef(null);
  // 세션 ID — URL 이 SSOT. ChatWindow 가 urlSessionId 로 loadExistingSession 을 호출할 때 채워진다.
  const sessionIdRef = useRef('');
  // 세션 ID state (사이드바 활성 세션 강조 표시 등 리렌더링 트리거용)
  const [currentSessionId, setCurrentSessionId] = useState('');
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
    setPointInfo(null);
    setQuotaError(null);
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
          userId,
          sessionId: sessionIdRef.current,
          image: imageBase64,
        },
        {
          // session 이벤트: 세션 ID 를 받으면 URL 을 /chat/:sessionId 로 교체하여 SSOT 유지.
          // 새로고침/뒤로가기/홈 복귀 후 재진입 시 ChatWindow 의 urlSessionId 복원 로직이
          // 자동으로 이전 대화를 복원한다.
          onSession: (data) => {
            if (data.session_id) {
              sessionIdRef.current = data.session_id;
              setCurrentSessionId(data.session_id);
              navigate(`/chat/${data.session_id}`, { replace: true });
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

          // point_update 이벤트: 포인트/쿼터 소비 결과 저장
          // 2026-04-15 확장: check/consume 분리 이후 source 별 잔여 정보까지 전파
          //   ({balance, deducted, source, daily_used, daily_limit,
          //     sub_bonus_remaining, purchased_remaining, free_usage, message})
          onPointUpdate: (data) => {
            setPointInfo({
              balance: data.balance,
              deducted: data.deducted,
              freeUsage: data.free_usage || false,
              source: data.source || 'GRADE_FREE',
              dailyUsed: data.daily_used ?? null,
              dailyLimit: data.daily_limit ?? null,
              subBonusRemaining: data.sub_bonus_remaining ?? -1,
              purchasedRemaining: data.purchased_remaining ?? 0,
              message: data.message || '',
            });
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
          // error_code가 쿼터/포인트 관련이면 quotaError에 저장하고 일반 에러는 표시하지 않음
          onError: (data) => {
            const quotaErrorCodes = ['INSUFFICIENT_POINT', 'INPUT_TOO_LONG', 'QUOTA_EXCEEDED'];
            if (data.error_code && quotaErrorCodes.includes(data.error_code)) {
              // 쿼터/포인트 에러: 전용 배너로 표시 (일반 에러 메시지 대신)
              setQuotaError(data);
            } else {
              // 일반 에러: 기존 에러 메시지로 표시
              setError(data.message || '알 수 없는 에러가 발생했습니다.');
            }
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
    // navigate 는 setSession 콜백(라인 127) 내부에서 sessionId 발급 시 사용되므로 deps 포함.
    // React Compiler 의 inferred dep 과 source dep 불일치(`navigate` 누락) 해결.
  }, [isLoading, userId, navigate]);

  /**
   * 대화 내용을 전부 초기화한다 (새 대화 시작).
   * URL 을 /chat 으로 이동하여 기존 sessionId 를 SSOT 에서 제거한다.
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setStatus('');
    setError(null);
    setClarification(null);
    setPointInfo(null);
    setQuotaError(null);
    sessionIdRef.current = '';
    setCurrentSessionId('');
    // URL 이 /chat/:sessionId 상태라면 /chat 으로 되돌려 새 대화 시작 상태로 만든다.
    navigate('/chat', { replace: true });
  }, [navigate]);

  /**
   * 진행 중인 SSE 요청을 취소한다.
   */
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * 쿼터/포인트 에러 배너를 닫는다.
   */
  const dismissQuotaError = useCallback(() => {
    setQuotaError(null);
  }, []);

  /**
   * 기존 세션을 로드하여 이전 대화를 이어서 진행한다.
   * 사이드바에서 세션을 선택했을 때 호출된다.
   *
   * @param {string} sessionId - 세션 UUID
   * @param {Array} sessionMessages - 파싱된 메시지 배열 [{role, content, ...}]
   */
  const loadExistingSession = useCallback((sessionId, sessionMessages) => {
    // messages 포맷 변환: Agent 저장 형식 → useChat 내부 형식
    const formattedMessages = [];
    for (const msg of sessionMessages) {
      if (msg.role === 'user') {
        formattedMessages.push({
          role: 'user',
          content: msg.content || '',
          image: msg.image || null,
          timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
        });
      } else if (msg.role === 'assistant') {
        // 영화 카드가 있으면 movie_cards 메시지로 분리
        if (msg.movies && msg.movies.length > 0) {
          formattedMessages.push({
            role: 'movie_cards',
            movies: msg.movies,
            timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
          });
        }
        // 텍스트 응답
        if (msg.content) {
          formattedMessages.push({
            role: 'bot',
            content: msg.content,
            timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
          });
        }
      }
    }

    setMessages(formattedMessages);
    setStatus('');
    setError(null);
    setClarification(null);
    setPointInfo(null);
    setQuotaError(null);
    sessionIdRef.current = sessionId;
    setCurrentSessionId(sessionId);
    // URL 동기화는 ChatWindow 의 handleSelectSession / urlSessionId useEffect 가 담당한다.
  }, []);

  return {
    messages,
    status,
    isLoading,
    error,
    clarification,
    pointInfo,
    quotaError,
    sendMessage,
    clearMessages,
    cancelRequest,
    dismissQuotaError,
    loadExistingSession,
    /** 현재 세션 ID (사이드바에서 활성 세션 강조 표시용, state로 관리하여 리렌더링 트리거) */
    currentSessionId,
  };
}
