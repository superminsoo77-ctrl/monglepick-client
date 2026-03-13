/**
 * SSE 기반 채팅 API 레이어.
 *
 * 백엔드 POST /api/v1/chat 엔드포인트에 fetch 요청을 보내고,
 * ReadableStream으로 SSE 이벤트를 실시간 파싱하여 콜백으로 전달한다.
 *
 * SSE 이벤트 타입 (7종):
 * - session: 세션 ID 발행 ({session_id})
 * - status: 처리 단계 (phase, message)
 * - movie_card: 추천 영화 데이터 (RankedMovie)
 * - clarification: 후속 질문 힌트 ({question, hints, primary_field})
 * - token: 응답 텍스트 스트리밍 (delta)
 * - done: 완료 신호
 * - error: 에러 메시지
 */

/** API 베이스 경로 (Vite 프록시가 localhost:8000으로 전달) */
const API_BASE = '/api/v1';

/**
 * SSE 스트리밍 채팅 요청을 보내고 이벤트를 콜백으로 전달한다.
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
 * @param {function} [callbacks.onDone] - done 이벤트 핸들러
 * @param {function} [callbacks.onError] - error 이벤트 핸들러 ({message})
 * @param {AbortSignal} [signal] - 요청 취소용 AbortSignal
 * @returns {Promise<void>}
 */
export async function sendChatMessage(
  { message, userId = '', sessionId = '', image = null },
  { onSession, onStatus, onMovieCard, onClarification, onToken, onDone, onError } = {},
  signal,
) {
  // POST 요청 전송
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

  console.log('[SSE] 스트림 시작, Content-Type:', response.headers.get('content-type'));

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      console.log('[SSE] 스트림 종료 (done=true)');
      break;
    }

    // 수신된 청크를 버퍼에 추가 (CRLF → LF 정규화: sse_starlette는 \r\n 사용)
    const chunk = decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
    buffer += chunk;
    console.log('[SSE] 청크 수신:', chunk.length, '바이트, 내용:', chunk.substring(0, 200));

    // 완성된 SSE 이벤트 블록(\n\n으로 구분) 추출 및 처리
    const blocks = buffer.split('\n\n');
    // 마지막 블록은 아직 불완전할 수 있으므로 버퍼에 보관
    buffer = blocks.pop() || '';

    for (const block of blocks) {
      if (!block.trim()) continue;
      parseSSEBlock(block, { onSession, onStatus, onMovieCard, onClarification, onToken, onDone, onError });
    }
  }

  // 잔여 버퍼 처리
  if (buffer.trim()) {
    console.log('[SSE] 잔여 버퍼 처리:', buffer.substring(0, 200));
    parseSSEBlock(buffer, { onStatus, onMovieCard, onToken, onDone, onError });
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
 * @param {string|null} eventType - 이벤트 타입 (session/status/movie_card/clarification/token/done/error)
 * @param {Object} data - 파싱된 JSON 데이터
 * @param {Object} callbacks - 콜백 함수 객체
 */
function dispatchEvent(eventType, data, callbacks) {
  console.log('[SSE] dispatchEvent:', eventType, data);
  const { onSession, onStatus, onMovieCard, onClarification, onToken, onDone, onError } = callbacks;

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
