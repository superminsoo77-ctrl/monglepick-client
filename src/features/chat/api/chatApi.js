/**
 * SSE 기반 채팅 API 레이어.
 *
 * 백엔드 POST /api/v1/chat 엔드포인트에 fetch 요청을 보내고,
 * ReadableStream으로 SSE 이벤트를 실시간 파싱하여 콜백으로 전달한다.
 *
 * SSE 이벤트 타입 (8종):
 * - session: 세션 ID 발행 ({session_id})
 * - status: 처리 단계 (phase, message)
 * - movie_card: 추천 영화 데이터 (RankedMovie)
 * - clarification: 후속 질문 힌트 ({question, hints, primary_field})
 * - token: 응답 텍스트 스트리밍 (delta)
 * - point_update: 포인트 차감 결과 ({balance, deducted, free_usage})
 * - done: 완료 신호
 * - error: 에러 메시지 ({message, error_code?, balance?, cost?, ...})
 *
 * 자동 재연결:
 * - 네트워크 오류(TypeError) 발생 시 최대 3회 재시도
 * - 지수 백오프: 1초 → 2초 → 4초
 * - HTTP 4xx/5xx 에러는 재시도하지 않음 (서버 의도적 거부)
 * - AbortSignal이 abort된 경우 즉시 중단
 */

/* localStorage 래퍼 유틸 — 인증 토큰 안전 접근 */
import { getToken } from '../../../shared/utils/storage';
/* 서비스 URL — Agent 직접 호출 */
import { SERVICE_URLS } from '../../../shared/api/serviceUrls';

/** API 베이스 경로 (Agent 서비스 직접 호출) */
const API_BASE = `${SERVICE_URLS.AGENT}/api/v1`;

/**
 * 최대 재시도 횟수 (네트워크 오류 한정).
 * @constant {number}
 */
const MAX_RETRY_COUNT = 3;

/**
 * 지수 백오프 기저 딜레이 (밀리초).
 * n번째 재시도의 대기 시간: BASE_RETRY_DELAY_MS * 2^(n-1)
 * 예: 1회→1000ms, 2회→2000ms, 3회→4000ms
 * @constant {number}
 */
const BASE_RETRY_DELAY_MS = 1000;

/**
 * 지정된 밀리초만큼 비동기 대기한다.
 * AbortSignal이 전달된 경우 abort 시 즉시 reject된다.
 *
 * @param {number} ms - 대기 시간 (밀리초)
 * @param {AbortSignal} [signal] - 취소 신호
 * @returns {Promise<void>}
 */
function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    // abort 이벤트가 발생하면 즉시 reject하여 대기를 중단한다
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timerId = setTimeout(resolve, ms);

    // 대기 중 abort가 발생하면 타이머를 취소하고 reject
    signal?.addEventListener('abort', () => {
      clearTimeout(timerId);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

/**
 * SSE 스트리밍 채팅 요청을 보내고 이벤트를 콜백으로 전달한다 (단일 시도, 내부용).
 *
 * 이 함수는 재시도 로직을 포함하지 않는다.
 * 외부에서는 재시도 래퍼인 sendChatMessage를 사용한다.
 *
 * @param {Object} params - 요청 파라미터
 * @param {string} params.message - 사용자 입력 메시지 (필수, 1~2000자)
 * @param {string} [params.userId=''] - 사용자 ID (빈 문자열이면 익명)
 * @param {string} [params.sessionId=''] - 세션 ID (빈 문자열이면 신규 세션)
 * @param {string|null} [params.image=null] - base64 인코딩된 이미지 데이터
 * @param {Object} callbacks - SSE 이벤트 콜백
 * @param {function} [callbacks.onSession] - session 이벤트 핸들러 ({session_id})
 * @param {function} [callbacks.onStatus] - status 이벤트 핸들러 ({phase, message})
 * @param {function} [callbacks.onMovieCard] - movie_card 이벤트 핸들러 (RankedMovie)
 * @param {function} [callbacks.onClarification] - clarification 이벤트 핸들러 ({question, hints, primary_field})
 * @param {function} [callbacks.onToken] - token 이벤트 핸들러 ({delta})
 * @param {function} [callbacks.onPointUpdate] - point_update 이벤트 핸들러 ({balance, deducted, free_usage})
 * @param {function} [callbacks.onDone] - done 이벤트 핸들러
 * @param {function} [callbacks.onError] - error 이벤트 핸들러 ({message, error_code?, ...})
 * @param {AbortSignal} [signal] - 요청 취소용 AbortSignal
 * @returns {Promise<void>}
 */
async function _sendChatMessageOnce(
  { message, userId = '', sessionId = '', image = null },
  { onSession, onStatus, onMovieCard, onClarification, onToken, onPointUpdate, onDone, onError } = {},
  signal,
) {
  // JWT 토큰 조회 — storage 래퍼를 통해 안전하게 접근 (시크릿 모드 등 대응)
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // POST 요청 전송
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_id: userId,
      session_id: sessionId,
      message,
      image,
    }),
    signal,
  });

  // HTTP 에러 처리
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  // ReadableStream으로 SSE 이벤트 파싱
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // 개발 환경에서만 SSE 디버그 로그 출력 (프로덕션에서 민감 데이터 노출 방지)
  if (import.meta.env.DEV) {
    console.log('[SSE] 스트림 시작, Content-Type:', response.headers.get('content-type'));
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (import.meta.env.DEV) {
          console.log('[SSE] 스트림 종료 (done=true)');
        }
        break;
      }

      // 수신된 청크를 버퍼에 추가 (CRLF → LF 정규화: sse_starlette는 \r\n 사용)
      const chunk = decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      buffer += chunk;
      if (import.meta.env.DEV) {
        console.log('[SSE] 청크 수신:', chunk.length, '바이트, 내용:', chunk.substring(0, 200));
      }

      // 완성된 SSE 이벤트 블록(\n\n으로 구분) 추출 및 처리
      const blocks = buffer.split('\n\n');
      // 마지막 블록은 아직 불완전할 수 있으므로 버퍼에 보관
      buffer = blocks.pop() || '';

      for (const block of blocks) {
        if (!block.trim()) continue;
        parseSSEBlock(block, { onSession, onStatus, onMovieCard, onClarification, onToken, onPointUpdate, onDone, onError });
      }
    }

    // 잔여 버퍼 처리
    if (buffer.trim()) {
      if (import.meta.env.DEV) {
        console.log('[SSE] 잔여 버퍼 처리:', buffer.substring(0, 200));
      }
      parseSSEBlock(buffer, { onSession, onStatus, onMovieCard, onClarification, onToken, onPointUpdate, onDone, onError });
    }
  } finally {
    // 예외 발생 시에도 reader를 반드시 해제하여 스트림 리소스 누수 방지
    reader.cancel().catch(() => {});
  }
}

/**
 * SSE 스트리밍 채팅 요청을 보내고 이벤트를 콜백으로 전달한다 (자동 재연결 래퍼).
 *
 * 네트워크 오류(TypeError) 발생 시 지수 백오프로 최대 3회 재시도한다.
 * HTTP 4xx/5xx 에러는 서버의 의도적 거부이므로 재시도하지 않는다.
 * AbortSignal이 abort된 경우 즉시 중단한다.
 *
 * 재시도 딜레이: 1초 → 2초 → 4초 (지수 백오프, BASE_RETRY_DELAY_MS * 2^(n-1))
 *
 * @param {Object} params - 요청 파라미터
 * @param {string} params.message - 사용자 입력 메시지 (필수, 1~2000자)
 * @param {string} [params.userId=''] - 사용자 ID (빈 문자열이면 익명)
 * @param {string} [params.sessionId=''] - 세션 ID (빈 문자열이면 신규 세션)
 * @param {string|null} [params.image=null] - base64 인코딩된 이미지 데이터
 * @param {Object} callbacks - SSE 이벤트 콜백
 * @param {function} [callbacks.onSession] - session 이벤트 핸들러 ({session_id})
 * @param {function} [callbacks.onStatus] - status 이벤트 핸들러 ({phase, message})
 * @param {function} [callbacks.onMovieCard] - movie_card 이벤트 핸들러 (RankedMovie)
 * @param {function} [callbacks.onClarification] - clarification 이벤트 핸들러 ({question, hints, primary_field})
 * @param {function} [callbacks.onToken] - token 이벤트 핸들러 ({delta})
 * @param {function} [callbacks.onPointUpdate] - point_update 이벤트 핸들러 ({balance, deducted, free_usage})
 * @param {function} [callbacks.onDone] - done 이벤트 핸들러
 * @param {function} [callbacks.onError] - error 이벤트 핸들러 ({message, error_code?, ...})
 * @param {AbortSignal} [signal] - 요청 취소용 AbortSignal
 * @returns {Promise<void>}
 */
export async function sendChatMessage(
  { message, userId = '', sessionId = '', image = null },
  { onSession, onStatus, onMovieCard, onClarification, onToken, onPointUpdate, onDone, onError } = {},
  signal,
) {
  const callbacks = { onSession, onStatus, onMovieCard, onClarification, onToken, onPointUpdate, onDone, onError };

  // 재시도 루프: attempt는 0부터 시작하며 MAX_RETRY_COUNT까지 시도한다
  for (let attempt = 0; attempt <= MAX_RETRY_COUNT; attempt++) {
    try {
      await _sendChatMessageOnce(
        { message, userId, sessionId, image },
        callbacks,
        signal,
      );
      // 성공 시 루프 종료
      return;
    } catch (err) {
      // AbortError: 사용자가 명시적으로 취소한 경우 즉시 중단 (재시도 안 함)
      if (err.name === 'AbortError') {
        if (import.meta.env.DEV) {
          console.log('[SSE] 요청 취소됨 (AbortError), 재시도 중단');
        }
        throw err;
      }

      // HTTP 에러 (4xx/5xx): 서버의 의도적 거부이므로 재시도하지 않고 onError 콜백 호출
      if (err.message.startsWith('HTTP ')) {
        if (import.meta.env.DEV) {
          console.warn('[SSE] HTTP 에러 발생, 재시도 없음:', err.message);
        }
        onError?.({ message: err.message });
        return;
      }

      // 마지막 시도까지 실패한 경우: 최종 실패 처리
      if (attempt === MAX_RETRY_COUNT) {
        if (import.meta.env.DEV) {
          console.error('[SSE] 최대 재시도 횟수 초과, 최종 실패:', err.message);
        }
        onError?.({ message: '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.' });
        return;
      }

      // 네트워크 오류(TypeError 등): 재시도 전 사용자에게 상태 알림
      const nextAttempt = attempt + 1;
      const retryDelayMs = BASE_RETRY_DELAY_MS * Math.pow(2, attempt); // 지수 백오프

      if (import.meta.env.DEV) {
        console.warn(
          `[SSE] 네트워크 오류 발생 (${attempt + 1}/${MAX_RETRY_COUNT}회 시도),`,
          `${retryDelayMs}ms 후 재시도:`,
          err.message,
        );
      }

      // 재연결 진행 중임을 사용자에게 알림 (onStatus 콜백 재활용)
      onStatus?.({
        phase: 'retry',
        message: `연결이 끊어졌습니다. 재연결 중... (${nextAttempt}/${MAX_RETRY_COUNT})`,
      });

      // 지수 백오프 대기 (AbortSignal 전달하여 대기 중 취소 가능)
      await delay(retryDelayMs, signal);
    }
  }
}

/**
 * SSE 이벤트 블록 1개를 파싱하여 적절한 콜백을 호출한다.
 *
 * SSE 표준 형식:
 *   event: {eventType}
 *   data: {jsonPayload}
 *
 * sse-starlette가 발행하는 형식도 지원:
 *   data: {jsonPayload}  (event 없이 data만 있는 경우)
 *
 * @param {string} block - SSE 이벤트 블록 문자열
 * @param {Object} callbacks - 이벤트 콜백 객체
 */
function parseSSEBlock(block, callbacks) {
  const lines = block.split('\n');
  let eventType = null;
  let dataStr = '';

  for (const line of lines) {
    // "event: xxx" 라인에서 이벤트 타입 추출
    if (line.startsWith('event:')) {
      eventType = line.slice(6).trim();
    }
    // "data: xxx" 라인에서 JSON 데이터 추출
    else if (line.startsWith('data:')) {
      dataStr += line.slice(5).trim();
    }
    // SSE 주석(: 으로 시작) 또는 빈 줄은 무시
  }

  // 데이터가 없으면 무시 (keep-alive 등)
  if (!dataStr) return;

  // JSON 파싱
  let data;
  try {
    data = JSON.parse(dataStr);
  } catch {
    // JSON 파싱 실패 시 무시 (keep-alive ping 등)
    return;
  }

  // sse-starlette 래핑 형식 처리:
  // sse-starlette는 yield된 문자열을 data 필드로 감싸므로,
  // data 내부에 다시 "event: xxx\ndata: yyy" 형태가 올 수 있음.
  // 이 경우 내부 이벤트를 재파싱한다.
  if (typeof data === 'string' && data.includes('event:')) {
    parseSSEBlock(data, callbacks);
    return;
  }

  // 이벤트 타입별 콜백 호출
  dispatchEvent(eventType, data, callbacks);
}

/**
 * 파싱된 SSE 이벤트를 적절한 콜백으로 디스패치한다.
 *
 * @param {string|null} eventType - 이벤트 타입 (session/status/movie_card/clarification/token/point_update/done/error)
 * @param {Object} data - 파싱된 JSON 데이터
 * @param {Object} callbacks - 콜백 함수 객체
 */
function dispatchEvent(eventType, data, callbacks) {
  if (import.meta.env.DEV) {
    console.log('[SSE] dispatchEvent:', eventType, data);
  }
  const { onSession, onStatus, onMovieCard, onClarification, onToken, onPointUpdate, onDone, onError } = callbacks;

  switch (eventType) {
    // 세션 ID 발행 (스트리밍 시작 직후)
    case 'session':
      onSession?.(data);
      break;
    case 'status':
      onStatus?.(data);
      break;
    case 'movie_card':
      onMovieCard?.(data);
      break;
    // 후속 질문 힌트 (선호 부족/검색 품질 미달 시)
    case 'clarification':
      onClarification?.(data);
      break;
    case 'token':
      onToken?.(data);
      break;
    // 포인트 차감 결과 (추천 완료 후 전달)
    case 'point_update':
      onPointUpdate?.(data);
      break;
    case 'done':
      onDone?.(data);
      break;
    case 'error':
      onError?.(data);
      break;
    default:
      // 알 수 없는 이벤트 타입 — token으로 fallback (delta 필드가 있으면)
      if (data.delta) {
        onToken?.(data);
      }
      break;
  }
}
