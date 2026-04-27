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

import { useState, useCallback, useEffect, useRef } from 'react';
/* react-router-dom — 세션 ID 를 URL 에 반영하여 단일 진실 원본(SSOT)으로 관리 */
import { useNavigate } from 'react-router-dom';
/* SSE 채팅 API — 같은 feature 내의 chatApi에서 가져옴 */
import { sendChatMessage } from '../api/chatApi';
/* 포인트/쿼터 사전 조회 — 새로고침 후 사용 현황 바 hydrate 용 (2026-04-27) */
import { getQuotaCheck } from '../../point/api/pointApi';

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
  // 메시지 목록: [{role: 'user'|'bot'|'movie_cards'|'external_map',
  //                content?: string, movies?: array, theaters?: array, nowShowing?: array,
  //                userLocation?: {latitude, longitude, address?}, timestamp: number}]
  // - external_map: 외부 지도 연동(영화관 + 박스오피스 묶음, 2026-04-23 추가)
  //                 userLocation 은 그 턴에 보낸 사용자 좌표 — 미니맵 사용자 마커/길찾기에 사용
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
  // 게스트(비로그인) 평생 1회 쿼터 초과 — 로그인 유도 모달 노출 트리거.
  // error_code === 'GUEST_QUOTA_EXCEEDED' 수신 시 {reason, message} 저장.
  const [guestQuotaExceeded, setGuestQuotaExceeded] = useState(null);

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
  // 현재 스트리밍 중인 영화관 카드(theater_card)를 누적하는 ref — 외부 지도 연동
  const pendingTheatersRef = useRef([]);
  // 현재 스트리밍 중인 박스오피스 묶음(now_showing 1회) — 외부 지도 연동
  const pendingNowShowingRef = useRef(null);
  /**
   * 동기적 전송 중복 차단 ref (2026-04-27).
   *
   * `isLoading` (React state) 만으로는 같은 tick 안에 sendMessage 가 두 번 호출되는
   * 케이스를 막지 못한다. 예) ChatWindow.handleSend 가 `await geo.request()` 로 좌표
   * 권한 응답을 기다리는 동안 사용자가 Enter 를 한번 더 누르면 handleSend 가 두 번
   * 진입 → 두 번째도 isLoading 클로저가 false 로 남아있어 sendMessage 까지 그대로 도달.
   * useState 의 setter 는 다음 렌더에서야 새 값이 반영되므로 클로저 검증은 무력하다.
   *
   * ref 는 동기적으로 즉시 갱신되므로 같은 tick 의 재진입을 확실히 막아준다.
   * sendMessage 시작 시 set, finally 블록에서 reset.
   */
  const sendingInFlightRef = useRef(false);

  /**
   * 포인트/쿼터 hydrate (2026-04-27).
   *
   * 새로고침 시 SSE point_update 이벤트를 받기 전이라 ChatPointBar 가 사라지는 문제 해결용.
   * 인증 사용자에 한해 Backend POST /api/v1/point/check (cost=0, read-only) 를 호출해
   * 일일 무료 사용량/구독 보너스/구매 토큰 잔여를 즉시 채워 넣는다.
   *
   * - 차감 없는 read-only 호출 (consumePoint 와 분리됨, v3.0)
   * - 게스트(userId 없음)는 게스트 쿼터 클라이언트가 별도로 처리하므로 여기서는 스킵
   * - 호출 실패 시 조용히 무시 — 채팅 자체 흐름을 막지 않는다
   */
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getQuotaCheck(userId);
        if (cancelled || !data) return;
        setPointInfo({
          balance: data.balance ?? 0,
          deducted: 0,
          freeUsage: data.source === 'GRADE_FREE',
          source: data.source || 'GRADE_FREE',
          dailyUsed: data.dailyUsed ?? 0,
          dailyLimit: data.dailyLimit ?? null,
          subBonusRemaining: data.subBonusRemaining ?? -1,
          purchasedRemaining: data.purchasedRemaining ?? 0,
          message: data.message || '',
        });
      } catch (err) {
        // 인증 만료/네트워크 오류 등은 조용히 무시 — 차감 시점에 SSE 가 다시 채워준다
        if (import.meta.env.DEV) {
          console.warn('[useChat] 쿼터 hydrate 실패:', err?.message || err);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  /**
   * 메시지를 전송하고 SSE 스트리밍 응답을 처리한다.
   *
   * @param {string} messageText - 사용자 입력 메시지
   * @param {string|null} imageBase64 - base64 인코딩된 이미지 데이터 (선택)
   * @param {object|null} location - 사용자 위치 (외부 지도 연동, theater/booking 의도용)
   *                                 {latitude, longitude, address?} 또는 null.
   *                                 useGeolocation 훅의 coords 를 그대로 전달하면 됨.
   */
  const sendMessage = useCallback(async (messageText, imageBase64 = null, location = null) => {
    // 빈 메시지 무시 (이미지만 보내는 것은 허용)
    if (!messageText.trim() && !imageBase64) return;
    // 동기 ref 가드 — 같은 tick 의 중복 호출 차단 (2026-04-27).
    // 호출자(handleSend)가 `await geo.request()` 도중 두 번째 Enter 를 받아도
    // 두 번째 sendMessage 는 여기서 즉시 return → 사용자 메시지·API 모두 1회만 발생.
    if (sendingInFlightRef.current) return;
    sendingInFlightRef.current = true;
    // 이전 요청이 진행 중이면 무시 (state 기반 — UI 표시용 isLoading 과 일관성 유지)
    if (isLoading) {
      sendingInFlightRef.current = false;
      return;
    }

    // 상태 초기화
    setIsLoading(true);
    setError(null);
    setStatus('');
    setClarification(null);
    // pointInfo 는 의도적으로 null 로 비우지 않는다 (2026-04-27).
    // 새로고침 시 mount hydrate 로 채운 사용 현황 바가 매 요청마다 깜빡이는 문제 방지.
    // recommend 의도면 point_update SSE 가 도착해 새 값으로 교체되고,
    // 그 외 의도(일반대화/정보)는 쿼터가 변하지 않으므로 기존 값을 유지하는 게 옳다.
    setQuotaError(null);
    pendingResponseRef.current = '';
    pendingMoviesRef.current = [];
    pendingTheatersRef.current = [];
    pendingNowShowingRef.current = null;

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
          location,
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

          // theater_card 이벤트: 외부 지도 — 영화관 단건 누적 (theater 의도)
          onTheaterCard: (theaterData) => {
            pendingTheatersRef.current = [...pendingTheatersRef.current, theaterData];
          },

          // now_showing 이벤트: 외부 지도 — KOBIS 박스오피스 Top-N 묶음 (1회)
          // payload: {movies: [{rank, movie_cd, movie_nm, audi_acc, ...}]}
          onNowShowing: (data) => {
            pendingNowShowingRef.current = data?.movies || [];
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

            // 외부 지도 결과(영화관 + 박스오피스)가 있으면 봇 응답 앞에 단일 메시지로 삽입
            // (영화관과 박스오피스를 같은 메시지로 묶어 한 화면에 보여주는 게 UX 상 더 자연스럽다)
            // userLocation 도 함께 저장 → TheaterCard 미니맵에 사용자 위치 마커 + 길찾기 버튼 활성화.
            const hasTheaters = pendingTheatersRef.current.length > 0;
            const hasNowShowing = pendingNowShowingRef.current && pendingNowShowingRef.current.length > 0;
            if (hasTheaters || hasNowShowing) {
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastBotIdx = newMessages.findLastIndex((m) => m.role === 'bot');
                const externalMapMessage = {
                  role: 'external_map',
                  theaters: pendingTheatersRef.current,
                  nowShowing: pendingNowShowingRef.current || [],
                  // 이번 턴에 함께 보낸 사용자 좌표 — 메시지 단위 보존하여 이후 카드 재렌더링에서도 유지.
                  // null/undefined 인 경우는 그대로 빠짐 (TheaterCard 가 없는 것으로 처리).
                  userLocation: location || null,
                  timestamp: Date.now(),
                };
                if (lastBotIdx >= 0) {
                  newMessages.splice(lastBotIdx, 0, externalMapMessage);
                } else {
                  newMessages.push(externalMapMessage);
                }
                return newMessages;
              });
            }

            setStatus('');
            setIsLoading(false);
            sendingInFlightRef.current = false;
          },

          // error 이벤트: 에러 처리
          // error_code가 쿼터/포인트 관련이면 quotaError에 저장하고 일반 에러는 표시하지 않음
          onError: (data) => {
            const quotaErrorCodes = ['INSUFFICIENT_POINT', 'INPUT_TOO_LONG', 'QUOTA_EXCEEDED'];
            if (data.error_code === 'GUEST_QUOTA_EXCEEDED') {
              // 게스트 평생 1회 무료 체험 소진 — 로그인 유도 모달 트리거
              // (쿼터 배너 대신 모달을 띄워 이탈을 줄이고 가입 CTA 를 강조)
              setGuestQuotaExceeded({
                reason: data.reason ?? null,
                message: data.message ?? '',
              });
            } else if (data.error_code && quotaErrorCodes.includes(data.error_code)) {
              // 쿼터/포인트 에러: 전용 배너로 표시 (일반 에러 메시지 대신)
              setQuotaError(data);
            } else {
              // 일반 에러: 기존 에러 메시지로 표시
              setError(data.message || '알 수 없는 에러가 발생했습니다.');
            }
            setClarification(null);
            setStatus('');
            setIsLoading(false);
            sendingInFlightRef.current = false;
          },
        },
        abortControllerRef.current.signal,
      );
    } catch (err) {
      // AbortError는 사용자가 취소한 것이므로 에러로 처리하지 않음
      if (err.name === 'AbortError') {
        // ── 부분 복원 — 취소 직전까지 받은 영화/외부 지도 카드는 보존 ──
        // 사용자가 취소했더라도 이미 화면에 떠 있을 수 있는 카드는 메시지로 묶어둬야
        // 다음 턴 / 새로고침 후에도 일관성 유지된다 (Agent session 저장은 안 됐지만
        // 현재 화면 세션 내에서는 보존). pending refs 가 비어있으면 추가하지 않는다.
        const partialMovies = pendingMoviesRef.current.length > 0 ? [...pendingMoviesRef.current] : null;
        const partialTheaters = pendingTheatersRef.current.length > 0 ? [...pendingTheatersRef.current] : null;
        const partialNowShowing = pendingNowShowingRef.current && pendingNowShowingRef.current.length > 0
          ? [...pendingNowShowingRef.current]
          : null;
        const partialUserLocation = location || null;

        // 부분 응답이 있으면 "[취소됨]" 표시를 붙여서 보존
        const partialText = pendingResponseRef.current;

        setMessages((prev) => {
          const newMessages = [...prev];

          // 1) 영화 카드 부분 복원 (있으면 봇 응답 앞에 movie_cards 메시지 삽입)
          if (partialMovies) {
            newMessages.push({
              role: 'movie_cards',
              movies: partialMovies,
              cancelled: true,
              timestamp: Date.now(),
            });
          }

          // 2) 외부 지도 부분 복원 (영화관 또는 박스오피스 중 하나라도 있으면)
          if (partialTheaters || partialNowShowing) {
            newMessages.push({
              role: 'external_map',
              theaters: partialTheaters || [],
              nowShowing: partialNowShowing || [],
              userLocation: partialUserLocation,
              cancelled: true,
              timestamp: Date.now() + 1,  // movie_cards 보다 한 tick 뒤
            });
          }

          // 3) 텍스트 응답 보존
          if (partialText) {
            const lastMsg = newMessages[newMessages.length - 1];
            // 마지막 메시지가 bot 이면 취소 표시만 덧붙이고, 아니면 신규 봇 메시지 추가.
            // (token 핸들러가 이미 봇 메시지를 만들어둔 경우 그 인스턴스를 살린다.)
            if (lastMsg && lastMsg.role === 'bot') {
              newMessages[newMessages.length - 1] = {
                ...lastMsg,
                content: partialText + '\n\n[응답이 중단되었습니다]',
                cancelled: true,
              };
            } else {
              newMessages.push({
                role: 'bot',
                content: partialText + '\n\n[응답이 중단되었습니다]',
                cancelled: true,
                timestamp: Date.now() + 2,
              });
            }
          } else if (!partialMovies && !partialTheaters && !partialNowShowing) {
            // 어떤 부분 응답도 없으면 취소 안내 메시지 추가
            newMessages.push({
              role: 'bot',
              content: '요청이 취소되었습니다.',
              cancelled: true,
              timestamp: Date.now(),
            });
          }
          return newMessages;
        });

        setStatus('');
        setIsLoading(false);
        sendingInFlightRef.current = false;
        return;
      }

      setError(err.message || '서버 연결에 실패했습니다.');
      setStatus('');
      setIsLoading(false);
      sendingInFlightRef.current = false;
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
    // pointInfo 는 보존 (2026-04-27). 새 대화를 시작해도 사용자의 일일 쿼터는 그대로이며,
    // 사용 현황 바를 굳이 비웠다 다음 응답에 다시 채울 필요가 없다.
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
   * 게스트 평생 1회 쿼터 초과 모달을 닫는다.
   */
  const dismissGuestQuotaModal = useCallback(() => {
    setGuestQuotaExceeded(null);
  }, []);

  /**
   * 기존 세션을 로드하여 이전 대화를 이어서 진행한다.
   * 사이드바에서 세션을 선택했을 때 호출된다.
   *
   * @param {string} sessionId - 세션 UUID
   * @param {Array} sessionMessages - 파싱된 메시지 배열 [{role, content, ...}]
   */
  const loadExistingSession = useCallback((sessionId, sessionMessages) => {
    // 2026-04-27: 진행 중인 SSE 가 있으면 즉시 abort + pending refs 전부 클리어.
    // 이 가드가 없으면 다른 세션의 응답이 아직 stream 중일 때 사이드바에서 세션 전환을 하면
    // setMessages(formattedMessages) 로 새 세션 메시지를 덮어쓴 직후 늦게 도착한
    // onToken / onMovieCard / onDone 핸들러가 prev 함수로 새 세션 위에 누적된다 (사용자 보고 버그).
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    pendingResponseRef.current = '';
    pendingMoviesRef.current = [];
    pendingTheatersRef.current = [];
    pendingNowShowingRef.current = null;
    setIsLoading(false);
    setStatus('');

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
        // 외부 지도 결과(영화관 + 박스오피스 + 사용자 위치)가 있으면 external_map 메시지로 분리.
        // theaters 또는 nowShowing 둘 중 하나라도 있으면 복원 (Agent 가 같은 어시스턴트 턴에 묶어 저장).
        const hasArchivedTheaters = Array.isArray(msg.theaters) && msg.theaters.length > 0;
        const hasArchivedNowShowing = Array.isArray(msg.nowShowing) && msg.nowShowing.length > 0;
        if (hasArchivedTheaters || hasArchivedNowShowing) {
          formattedMessages.push({
            role: 'external_map',
            theaters: hasArchivedTheaters ? msg.theaters : [],
            nowShowing: hasArchivedNowShowing ? msg.nowShowing : [],
            // userLocation 은 옵셔널 — 미니맵 사용자 마커/길찾기에 사용
            userLocation: msg.userLocation || null,
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
    // pointInfo 는 보존 (2026-04-27). 세션 전환은 메시지 컨텍스트만 바뀌고
    // 사용자의 쿼터/잔여 횟수는 동일하므로 사용 현황 바를 유지한다.
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
    guestQuotaExceeded,
    sendMessage,
    clearMessages,
    cancelRequest,
    dismissQuotaError,
    dismissGuestQuotaModal,
    loadExistingSession,
    /** 현재 세션 ID (사이드바에서 활성 세션 강조 표시용, state로 관리하여 리렌더링 트리거) */
    currentSessionId,
  };
}
