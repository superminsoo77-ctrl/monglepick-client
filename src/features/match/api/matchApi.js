/**
 * Movie Match SSE 스트리밍 API 레이어.
 *
 * AI Agent POST /api/v1/match 엔드포인트에 fetch 요청을 보내고,
 * ReadableStream으로 SSE 이벤트를 실시간 파싱하여 콜백으로 전달한다.
 *
 * SSE 이벤트 타입 (5종):
 * - status:          처리 단계 상태 메시지 ({phase, message})
 * - shared_features: 두 영화의 공통 특성 분석 결과 ({common_genres, common_moods, similarity_summary, ...})
 * - match_result:    추천 영화 목록 ({movies: [{movie_id, title, genres, rating, poster_path, score_detail, explanation, rank}, ...]})
 * - error:           에러 메시지 ({error_code, message})
 * - done:            완료 신호 ({})
 *
 * chatApi.js 패턴을 그대로 따른다:
 * - fetch + ReadableStream + TextDecoder
 * - \n\n 기준 SSE 블록 분리
 * - JWT Authorization 헤더 선택적 주입
 * - AbortController를 통한 스트림 취소 지원
 *
 * 자동 재연결:
 * - 네트워크 오류(TypeError) 발생 시 최대 3회 재시도
 * - 지수 백오프: 1초 → 2초 → 4초
 * - HTTP 4xx/5xx 에러는 재시도하지 않음 (서버 의도적 거부)
 * - AbortSignal이 abort된 경우 즉시 중단
 */

/* localStorage 래퍼 유틸 — 인증 토큰 안전 접근 */
import { getToken } from '../../../shared/utils/storage';
/* MATCH API 엔드포인트 상수 */
import { MATCH_ENDPOINTS } from '../../../shared/constants/api';
/* 서비스 URL — Agent 직접 호출 */
import { SERVICE_URLS } from '../../../shared/api/serviceUrls';

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
 * Movie Match SSE 스트리밍 요청을 보내고 이벤트를 콜백으로 전달한다 (단일 시도, 내부용).
 *
 * 이 함수는 재시도 로직을 포함하지 않는다.
 * 외부에서는 재시도 래퍼인 sendMatchRequest를 사용한다.
 *
 * @param {Object} params - 요청 파라미터
 * @param {string} params.movieId1 - 첫 번째 영화 ID (예: 'tmdb_550')
 * @param {string} params.movieId2 - 두 번째 영화 ID (예: 'tmdb_680')
 * @param {string} [params.userId=''] - 사용자 ID (빈 문자열이면 익명)
 * @param {Object} callbacks - SSE 이벤트 콜백 함수 객체
 * @param {function} [callbacks.onStatus] - status 이벤트 핸들러 ({phase, message})
 * @param {function} [callbacks.onSharedFeatures] - shared_features 이벤트 핸들러 ({common_genres, common_moods, ...})
 * @param {function} [callbacks.onMatchResult] - match_result 이벤트 핸들러 ({movies: [...]})
 * @param {function} [callbacks.onError] - error 이벤트 핸들러 ({error_code, message})
 * @param {function} [callbacks.onDone] - done 이벤트 핸들러 ({})
 * @param {AbortSignal} [signal] - 요청 취소용 AbortSignal (AbortController.signal)
 * @returns {Promise<void>}
 * @throws {Error} HTTP 에러 또는 네트워크 에러 발생 시
 */
async function _sendMatchRequestOnce(
  { movieId1, movieId2, userId = '' },
  { onStatus, onSharedFeatures, onMatchResult, onError, onDone } = {},
  signal,
) {
  // JWT 토큰 조회 — storage 래퍼를 통해 안전하게 접근
  // Match 기능은 인증 없이도 사용 가능하며, 토큰이 있으면 선택적으로 주입
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Agent(:8000)으로 POST 요청 전송
  // Vite 프록시 설정에서 /api/* → :8000(AI Agent)으로 전달됨
  const response = await fetch(`${SERVICE_URLS.AGENT}${MATCH_ENDPOINTS.STREAM}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      // Agent API 명세: snake_case 필드
      movie_id_1: movieId1,
      movie_id_2: movieId2,
      user_id: userId || undefined, // 빈 문자열이면 필드 자체를 생략
    }),
    signal,
  });

  // HTTP 에러 처리 — 응답 본문에서 에러 메시지 추출
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  // ReadableStream으로 SSE 이벤트 파싱
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  // 불완전한 청크를 누적하는 버퍼
  let buffer = '';

  // 개발 환경에서만 SSE 디버그 로그 출력 (프로덕션에서 민감 데이터 노출 방지)
  if (import.meta.env.DEV) {
    console.log('[Match SSE] 스트림 시작, Content-Type:', response.headers.get('content-type'));
  }

  try {
    while (true) {
      const { done, value } = await reader.read();

      // 스트림이 완전히 종료되었으면 루프 탈출
      if (done) {
        if (import.meta.env.DEV) {
          console.log('[Match SSE] 스트림 종료 (done=true)');
        }
        break;
      }

      // 수신된 청크를 버퍼에 추가
      // sse_starlette는 \r\n을 사용할 수 있으므로 LF로 정규화
      const chunk = decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      buffer += chunk;

      if (import.meta.env.DEV) {
        console.log('[Match SSE] 청크 수신:', chunk.length, '바이트, 내용:', chunk.substring(0, 200));
      }

      // 완성된 SSE 이벤트 블록(\n\n으로 구분) 추출 및 처리
      const blocks = buffer.split('\n\n');
      // 마지막 블록은 아직 불완전할 수 있으므로 버퍼에 보관
      buffer = blocks.pop() || '';

      for (const block of blocks) {
        if (!block.trim()) continue;
        parseMatchSSEBlock(block, { onStatus, onSharedFeatures, onMatchResult, onError, onDone });
      }
    }

    // 스트림 종료 후 잔여 버퍼 처리 (마지막 블록이 \n\n 없이 끝난 경우)
    if (buffer.trim()) {
      if (import.meta.env.DEV) {
        console.log('[Match SSE] 잔여 버퍼 처리:', buffer.substring(0, 200));
      }
      parseMatchSSEBlock(buffer, { onStatus, onSharedFeatures, onMatchResult, onError, onDone });
    }
  } finally {
    // 예외 발생 시에도 reader를 반드시 해제하여 스트림 리소스 누수 방지
    reader.cancel().catch(() => {});
  }
}

/**
 * Movie Match SSE 스트리밍 요청을 보내고 이벤트를 콜백으로 전달한다 (자동 재연결 래퍼).
 *
 * 네트워크 오류(TypeError) 발생 시 지수 백오프로 최대 3회 재시도한다.
 * HTTP 4xx/5xx 에러는 서버의 의도적 거부이므로 재시도하지 않는다.
 * AbortSignal이 abort된 경우 즉시 중단한다.
 *
 * 재시도 딜레이: 1초 → 2초 → 4초 (지수 백오프, BASE_RETRY_DELAY_MS * 2^(n-1))
 *
 * @param {Object} params - 요청 파라미터
 * @param {string} params.movieId1 - 첫 번째 영화 ID (예: 'tmdb_550')
 * @param {string} params.movieId2 - 두 번째 영화 ID (예: 'tmdb_680')
 * @param {string} [params.userId=''] - 사용자 ID (빈 문자열이면 익명)
 * @param {Object} callbacks - SSE 이벤트 콜백 함수 객체
 * @param {function} [callbacks.onStatus] - status 이벤트 핸들러 ({phase, message})
 * @param {function} [callbacks.onSharedFeatures] - shared_features 이벤트 핸들러 ({common_genres, common_moods, ...})
 * @param {function} [callbacks.onMatchResult] - match_result 이벤트 핸들러 ({movies: [...]})
 * @param {function} [callbacks.onError] - error 이벤트 핸들러 ({error_code, message})
 * @param {function} [callbacks.onDone] - done 이벤트 핸들러 ({})
 * @param {AbortSignal} [signal] - 요청 취소용 AbortSignal (AbortController.signal)
 * @returns {Promise<void>}
 */
export async function sendMatchRequest(
  { movieId1, movieId2, userId = '' },
  { onStatus, onSharedFeatures, onMatchResult, onError, onDone } = {},
  signal,
) {
  const callbacks = { onStatus, onSharedFeatures, onMatchResult, onError, onDone };

  // 재시도 루프: attempt는 0부터 시작하며 MAX_RETRY_COUNT까지 시도한다
  for (let attempt = 0; attempt <= MAX_RETRY_COUNT; attempt++) {
    try {
      await _sendMatchRequestOnce(
        { movieId1, movieId2, userId },
        callbacks,
        signal,
      );
      // 성공 시 루프 종료
      return;
    } catch (err) {
      // AbortError: 사용자가 명시적으로 취소한 경우 즉시 중단 (재시도 안 함)
      if (err.name === 'AbortError') {
        if (import.meta.env.DEV) {
          console.log('[Match SSE] 요청 취소됨 (AbortError), 재시도 중단');
        }
        throw err;
      }

      // HTTP 에러 (4xx/5xx): 서버의 의도적 거부이므로 재시도하지 않고 onError 콜백 호출
      if (err.message.startsWith('HTTP ')) {
        if (import.meta.env.DEV) {
          console.warn('[Match SSE] HTTP 에러 발생, 재시도 없음:', err.message);
        }
        onError?.({ message: err.message });
        return;
      }

      // 마지막 시도까지 실패한 경우: 최종 실패 처리
      if (attempt === MAX_RETRY_COUNT) {
        if (import.meta.env.DEV) {
          console.error('[Match SSE] 최대 재시도 횟수 초과, 최종 실패:', err.message);
        }
        onError?.({ message: '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.' });
        return;
      }

      // 네트워크 오류(TypeError 등): 재시도 전 사용자에게 상태 알림
      const nextAttempt = attempt + 1;
      const retryDelayMs = BASE_RETRY_DELAY_MS * Math.pow(2, attempt); // 지수 백오프

      if (import.meta.env.DEV) {
        console.warn(
          `[Match SSE] 네트워크 오류 발생 (${attempt + 1}/${MAX_RETRY_COUNT}회 시도),`,
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
 * sse-starlette 래핑 형식도 지원:
 *   data: {jsonPayload}  (event 없이 data만 있는 경우)
 *
 * @param {string} block - SSE 이벤트 블록 문자열 (줄바꿈으로 구분된 라인들)
 * @param {Object} callbacks - 이벤트 콜백 객체
 */
function parseMatchSSEBlock(block, callbacks) {
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

  // 데이터가 없으면 무시 (keep-alive ping 등)
  if (!dataStr) return;

  // JSON 파싱
  let data;
  try {
    data = JSON.parse(dataStr);
  } catch {
    // JSON 파싱 실패 시 무시 (keep-alive ping 또는 텍스트 형식)
    return;
  }

  // sse-starlette 래핑 형식 처리:
  // sse-starlette가 yield된 문자열을 data 필드로 감싸는 경우,
  // data 내부에 다시 "event: xxx\ndata: yyy" 형태가 올 수 있음
  if (typeof data === 'string' && data.includes('event:')) {
    parseMatchSSEBlock(data, callbacks);
    return;
  }

  // 이벤트 타입별 콜백 호출
  dispatchMatchEvent(eventType, data, callbacks);
}

/**
 * 파싱된 SSE 이벤트를 적절한 콜백으로 디스패치한다.
 *
 * Match 이벤트 타입 (5종):
 * - status:          진행 상태 업데이트
 * - shared_features: 두 영화의 공통 특성 분석 결과
 * - match_result:    추천 영화 목록 (최대 5편)
 * - error:           에러 메시지
 * - done:            완료 신호
 *
 * @param {string|null} eventType - 이벤트 타입
 * @param {Object} data - 파싱된 JSON 데이터
 * @param {Object} callbacks - 콜백 함수 객체
 */
function dispatchMatchEvent(eventType, data, callbacks) {
  if (import.meta.env.DEV) {
    console.log('[Match SSE] 이벤트 디스패치:', eventType, data);
  }

  const { onStatus, onSharedFeatures, onMatchResult, onError, onDone } = callbacks;

  switch (eventType) {
    // 처리 단계 상태 메시지 (phase, message)
    case 'status':
      onStatus?.(data);
      break;

    // 두 영화의 공통 특성 분석 결과 (공통 장르, 무드, 유사도 요약 등)
    case 'shared_features':
      onSharedFeatures?.(data);
      break;

    // 추천 영화 목록 — 최대 5편, score_detail 포함
    case 'match_result':
      onMatchResult?.(data);
      break;

    // 에러 메시지
    case 'error':
      onError?.(data);
      break;

    // 완료 신호 — SSE 스트림 정상 종료
    case 'done':
      onDone?.(data);
      break;

    default:
      // 알 수 없는 이벤트 타입은 조용히 무시
      if (import.meta.env.DEV) {
        console.warn('[Match SSE] 알 수 없는 이벤트 타입:', eventType, data);
      }
      break;
  }
}
