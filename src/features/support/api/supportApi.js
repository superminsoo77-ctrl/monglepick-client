/**
 * 고객센터(Support) API 모듈.
 *
 * FAQ 조회, FAQ 피드백, 도움말 문서, 상담 티켓 관련 HTTP 요청을 처리한다.
 * FAQ/도움말은 비인증 사용자도 조회 가능하며,
 * 티켓 생성/조회와 FAQ 피드백은 인증이 필요하다.
 */

/* 공용 axios 인스턴스 + 인증 필수 가드 */
import api, { requireAuth } from '../../../shared/api/axiosInstance';
/* Agent 서비스 URL — 고객센터 챗봇 SSE 가 Agent :8000 을 직접 때림 */
import { SERVICE_URLS } from '../../../shared/api/serviceUrls';
/* localStorage JWT 래퍼 — SSE fetch 의 Authorization 헤더 주입용 */
import { getToken } from '../../../shared/utils/storage';
/* API 상수 — shared/constants에서 가져옴 */
import { SUPPORT_ENDPOINTS } from '../../../shared/constants/api';

// ── FAQ ──

/**
 * FAQ 목록을 조회한다.
 * 인증 없이 접근 가능한 공개 API.
 *
 * @param {string} [category] - FAQ 카테고리 필터 (GENERAL, ACCOUNT, CHAT, RECOMMENDATION, COMMUNITY, PAYMENT)
 * @returns {Promise<Array<Object>>} FAQ 배열
 */
export async function getFaqs(category) {
  const params = {};
  if (category) params.category = category;
  return api.get(SUPPORT_ENDPOINTS.FAQ, { params });
}

/**
 * FAQ에 대한 피드백(도움됨/안됨)을 제출한다.
 * 인증된 사용자만 피드백을 남길 수 있다.
 *
 * @param {number|string} faqId - 피드백 대상 FAQ ID
 * @param {boolean} helpful - 도움이 되었는지 여부
 * @returns {Promise<Object>} 피드백 결과
 */
export async function submitFaqFeedback(faqId, helpful) {
  requireAuth();
  return api.post(SUPPORT_ENDPOINTS.FAQ_FEEDBACK(faqId), { helpful });
}

// ── 도움말 ──

/**
 * 도움말 문서 목록을 조회한다.
 * 인증 없이 접근 가능한 공개 API.
 *
 * @param {string} [category] - 도움말 카테고리 필터
 * @returns {Promise<Array<Object>>} 도움말 문서 배열
 */
export async function getHelpArticles(category) {
  const params = {};
  if (category) params.category = category;
  return api.get(SUPPORT_ENDPOINTS.HELP, { params });
}

// ── 상담 티켓 ──

/**
 * 상담 티켓을 생성한다.
 * 인증된 사용자만 티켓을 생성할 수 있다.
 *
 * @param {Object} ticketData - 티켓 생성 정보
 * @param {string} ticketData.category - 문의 카테고리
 * @param {string} ticketData.title - 문의 제목 (2~100자)
 * @param {string} ticketData.content - 문의 내용 (10~2000자)
 * @returns {Promise<Object>} 생성된 티켓 정보
 */
export async function createTicket({ category, title, content }) {
  requireAuth();
  return api.post(SUPPORT_ENDPOINTS.CREATE_TICKET, { category, title, content });
}

/**
 * 내 상담 티켓 목록을 조회한다 (페이징).
 *
 * @param {number} [page=0] - 페이지 번호 (0부터 시작, Spring Page 규격)
 * @param {number} [size=10] - 페이지 크기
 * @returns {Promise<Object>} Spring Page 응답
 */
export async function getMyTickets(page = 0, size = 10) {
  requireAuth();
  return api.get(SUPPORT_ENDPOINTS.MY_TICKETS, { params: { page, size } });
}

/**
 * 상담 티켓 상세 정보를 조회한다 (답변 이력 포함).
 * 인증된 사용자만 본인 티켓을 조회할 수 있다.
 *
 * @param {number|string} ticketId - 티켓 ID
 * @returns {Promise<Object>} 티켓 상세 (ticket 정보 + replies 배열)
 */
export async function getTicketDetail(ticketId) {
  requireAuth();
  return api.get(SUPPORT_ENDPOINTS.TICKET_DETAIL(ticketId));
}

// ── AI 챗봇 ──

/**
 * (레거시) Backend 키워드 매칭 기반 챗봇에 메시지를 전송한다.
 *
 * 2026-04-23 이후로는 {@link sendSupportChatSse} (Agent SSE) 를 기본으로 사용한다.
 * 본 함수는 Client SSE 연결이 불가능한 환경(예: 관리자 E2E 회귀 테스트)을
 * 위한 레거시 폴백 창구로 남겨둔다. 백엔드 라우트는 당분간 유지.
 *
 * @param {Object} params
 * @param {string} params.message - 사용자 메시지
 * @param {string} [params.sessionId] - 세션 ID (맥락 유지용)
 * @returns {Promise<{answer: string, matchedFaqs: Array, needsHumanAgent: boolean, sessionId: string}>}
 */
export async function sendChatbotMessage({ message, sessionId }) {
  return api.post(SUPPORT_ENDPOINTS.CHATBOT, { message, sessionId });
}

/**
 * 고객센터 AI 챗봇 SSE — Agent(:8000) 의 EXAONE 1.2B 몽글이 + FAQ RAG 엔드포인트 호출.
 *
 * POST /api/v1/support/chat 에 fetch 요청을 보내고 ReadableStream 으로 SSE 이벤트를
 * 실시간 파싱해 콜백으로 전달한다. chat SSE 와 달리 자동 재연결은 포함하지 않는다
 * (고객센터 챗봇은 요청당 수명이 짧아 재시도 가치가 낮고, 네트워크 실패는 즉시
 *  onError 로 끌어올려 '상담원 연결' 배너를 띄우는 편이 UX 상 자연스럽다).
 *
 * 이벤트 (10종 — v3 7종 + v4 신규 3종):
 *  - session            : {session_id}
 *  - status             : {phase, message, keepalive?}
 *  - matched_faq        : {items: [{faq_id, category, question, score}]}
 *  - token              : {delta} — 최종 응답 텍스트 (현재 MVP 는 1회 전송)
 *  - needs_human        : {value: boolean}
 *  - done               : {}
 *  - error              : {message}
 *  - policy_chunk       : (v4) {items: [{doc_id, section, headings, policy_topic, text, score}]}
 *  - navigation         : (v4) {target_path, label, candidates: []}
 *  - personal_data_card : (v4, Phase 2) {kind, summary, items[]}
 *
 * v4 콜백은 미지정 시 이벤트를 파싱만 하고 조용히 무시한다 (graceful degradation).
 * 이 함수를 호출하는 구 코드(콜백 3개 미지정)는 v4 이벤트 수신 시에도 정상 동작한다.
 *
 * @param {Object} params
 * @param {string} params.message - 사용자 입력 (1~1500자)
 * @param {string} [params.sessionId=''] - 세션 ID (빈 문자열이면 Agent 가 발급)
 * @param {Object} [callbacks={}] - SSE 이벤트 콜백 모음
 * @param {(data: {session_id: string}) => void} [callbacks.onSession]
 * @param {(data: {phase: string, message: string, keepalive?: boolean}) => void} [callbacks.onStatus]
 * @param {(data: {items: Array<{faq_id: number, category: string, question: string, score: number}>}) => void} [callbacks.onMatchedFaq]
 * @param {(data: {delta: string}) => void} [callbacks.onToken]
 * @param {(data: {value: boolean}) => void} [callbacks.onNeedsHuman]
 * @param {() => void} [callbacks.onDone]
 * @param {(data: {message: string}) => void} [callbacks.onError]
 * @param {(data: {items: Array<{doc_id: string, section: string, headings: string[], policy_topic: string, text: string, score: number}>}) => void} [callbacks.onPolicyChunk]
 *   v4 신규 — narrator 가 lookup_policy 결과를 인용할 때 발행. 미지정 시 무시.
 * @param {(data: {target_path: string, label: string, candidates: Array}) => void} [callbacks.onNavigation]
 *   v4 신규 — redirect 의도 또는 화면 이동 안내 시 발행. 미지정 시 무시.
 * @param {(data: {kind: string, summary: string, items: Array}) => void} [callbacks.onPersonalDataCard]
 *   v4 Phase 2 후속 — Read tool 결과 시각화. 현재 Agent 미발행. 미지정 시 무시.
 * @param {AbortSignal} [signal] - 요청 취소용 AbortSignal (UI 언마운트/재질문 시 호출)
 * @returns {Promise<void>}
 */
export async function sendSupportChatSse(
  { message, sessionId = '' },
  {
    onSession,
    onStatus,
    onMatchedFaq,
    onToken,
    onNeedsHuman,
    onDone,
    onError,
    /* v4 신규 콜백 — 미지정 시 undefined, 파서에서 optional chaining 으로 안전 호출 */
    onPolicyChunk,
    onNavigation,
    onPersonalDataCard,
  } = {},
  signal,
) {
  /* JWT 가 있으면 헤더에 실어 유저 식별 — 없으면 게스트로 처리된다 */
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', Accept: 'text/event-stream' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${SERVICE_URLS.AGENT}${SUPPORT_ENDPOINTS.SUPPORT_CHAT_SSE}`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    /* 게스트 쿼터는 챗봇에 적용되지 않지만 chat SSE 와 일관되게 쿠키 전송을 허용 */
    credentials: 'include',
    body: JSON.stringify({ message, session_id: sessionId }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    // ReadableStream 으로 SSE 프레임 수신
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // CRLF → LF 정규화 (sse_starlette 는 \r\n 사용)
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

      // \n\n 단위 블록 분리 후 마지막(불완전)만 버퍼에 잔존
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';
      for (const block of blocks) {
        if (!block.trim()) continue;
        _parseSupportSseBlock(block, {
          onSession, onStatus, onMatchedFaq, onToken, onNeedsHuman, onDone, onError,
          onPolicyChunk, onNavigation, onPersonalDataCard,
        });
      }
    }

    // 스트림 종료 후 잔여 버퍼 (네트워크 flush 경계상 드물게 발생)
    if (buffer.trim()) {
      _parseSupportSseBlock(buffer, {
        onSession, onStatus, onMatchedFaq, onToken, onNeedsHuman, onDone, onError,
        onPolicyChunk, onNavigation, onPersonalDataCard,
      });
    }
  } finally {
    // 예외가 나도 reader 를 반드시 해제해 스트림 리소스 누수 방지
    reader.cancel().catch(() => {});
  }
}

/**
 * 단일 SSE 블록을 파싱하여 대응 콜백을 호출한다.
 *
 * chatApi 의 parseSSEBlock 과 구조는 동일하되 고객센터 전용 10종(v3 7종 + v4 3종)을 디스패치한다.
 * v4 콜백(onPolicyChunk / onNavigation / onPersonalDataCard)은 미지정 시 optional chaining 으로
 * 안전하게 무시되므로, 이 함수를 호출하는 구 코드는 수정 없이 그대로 동작한다 (graceful degradation).
 *
 * @param {string} block - "event: xxx\ndata: {...}" 형태 블록
 * @param {Object} callbacks - 콜백 모음 (v3 7종 + v4 3종)
 * @private
 */
function _parseSupportSseBlock(block, callbacks) {
  const lines = block.split('\n');
  let eventType = null;
  let dataStr = '';
  for (const line of lines) {
    if (line.startsWith('event:')) eventType = line.slice(6).trim();
    else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
  }
  if (!dataStr) return;

  let data;
  try {
    data = JSON.parse(dataStr);
  } catch {
    /* keep-alive 주석/비-JSON 블록은 무시 */
    return;
  }

  /* sse_starlette 래핑 — data 안에 다시 "event:.../data:..." 가 올 수 있어 재귀 파싱 */
  if (typeof data === 'string' && data.includes('event:')) {
    _parseSupportSseBlock(data, callbacks);
    return;
  }

  const {
    /* v3 기존 7종 */
    onSession, onStatus, onMatchedFaq, onToken, onNeedsHuman, onDone, onError,
    /* v4 신규 3종 — 미지정 시 undefined, optional chaining 으로 안전 무시 */
    onPolicyChunk, onNavigation, onPersonalDataCard,
  } = callbacks;

  switch (eventType) {
    /* ── v3 기존 이벤트 (변경 없음) ── */
    case 'session':
      onSession?.(data);
      break;
    case 'status':
      onStatus?.(data);
      break;
    case 'matched_faq':
      onMatchedFaq?.(data);
      break;
    case 'token':
      onToken?.(data);
      break;
    case 'needs_human':
      onNeedsHuman?.(data);
      break;
    case 'done':
      onDone?.();
      break;
    case 'error':
      onError?.(data);
      break;

    /* ── v4 신규 이벤트 ── */

    /**
     * policy_chunk: narrator 가 lookup_policy 결과를 답변에 인용할 때 발행.
     * 페이로드: {items: [{doc_id, section, headings, policy_topic, text, score}]}
     * onPolicyChunk 미지정 시 무시.
     */
    case 'policy_chunk':
      onPolicyChunk?.(data);
      break;

    /**
     * navigation: redirect 의도 또는 narrator 가 화면 이동을 안내할 때 발행.
     * 페이로드: {target_path, label, candidates: []}
     * onNavigation 미지정 시 무시.
     */
    case 'navigation':
      onNavigation?.(data);
      break;

    /**
     * personal_data_card: Read tool 결과를 표/카드로 시각화 (Phase 2 후속).
     * 페이로드: {kind, summary, items[]}
     * 현재 Agent 미발행. onPersonalDataCard 미지정 시 무시.
     */
    case 'personal_data_card':
      onPersonalDataCard?.(data);
      break;

    default:
      /* 알 수 없는 이벤트는 조용히 무시 (forward-compat) */
      break;
  }
}
