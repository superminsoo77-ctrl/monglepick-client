/**
 * 고객센터(Support) API 모듈.
 *
 * FAQ 조회, FAQ 피드백, 도움말 문서, 상담 티켓 관련 HTTP 요청을 처리한다.
 * FAQ/도움말은 비인증 사용자도 조회 가능하며,
 * 티켓 생성/조회와 FAQ 피드백은 인증이 필요하다.
 */

/* API 상수 — shared/constants에서 가져옴 */
import { API_BASE_URL, SUPPORT_ENDPOINTS } from '../../../shared/constants/api';
/* 인증 필수 fetch 래퍼 — shared/utils에서 가져옴 */
import { fetchWithAuthRequired } from '../../../shared/utils/fetchWithAuth';

// ── FAQ ──

/**
 * FAQ 목록을 조회한다.
 * 인증 없이 접근 가능한 공개 API.
 * 카테고리 필터가 없으면 전체 FAQ를 반환한다.
 *
 * @param {string} [category] - FAQ 카테고리 필터 (GENERAL, ACCOUNT, CHAT, RECOMMENDATION, COMMUNITY, PAYMENT)
 * @returns {Promise<Array<Object>>} FAQ 배열
 *   - id: FAQ ID
 *   - category: 카테고리
 *   - question: 질문 내용
 *   - answer: 답변 내용
 *   - helpfulCount: 도움됨 수
 *   - notHelpfulCount: 도움안됨 수
 *
 * @example
 * const faqs = await getFaqs('ACCOUNT');
 * faqs.forEach(faq => console.log(faq.question));
 */
export async function getFaqs(category) {
  const params = new URLSearchParams();
  if (category) {
    params.append('category', category);
  }
  const queryString = params.toString();
  const url = queryString
    ? `${API_BASE_URL}${SUPPORT_ENDPOINTS.FAQ}?${queryString}`
    : `${API_BASE_URL}${SUPPORT_ENDPOINTS.FAQ}`;

  /* 인증 없이 접근 가능 — plain fetch 사용 */
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.message || data?.detail || `FAQ 조회 실패 (${response.status})`;
    throw new Error(errorMessage);
  }

  return data;
}

/**
 * FAQ에 대한 피드백(도움됨/안됨)을 제출한다.
 * 인증된 사용자만 피드백을 남길 수 있다.
 *
 * @param {number|string} faqId - 피드백 대상 FAQ ID
 * @param {boolean} helpful - 도움이 되었는지 여부 (true: 도움됨, false: 안됨)
 * @returns {Promise<Object>} 피드백 결과
 *
 * @example
 * await submitFaqFeedback(1, true);  // 도움됨 피드백
 * await submitFaqFeedback(2, false); // 도움안됨 피드백
 */
export async function submitFaqFeedback(faqId, helpful) {
  return fetchWithAuthRequired(SUPPORT_ENDPOINTS.FAQ_FEEDBACK(faqId), {
    method: 'POST',
    body: JSON.stringify({ helpful }),
  });
}

// ── 도움말 ──

/**
 * 도움말 문서 목록을 조회한다.
 * 인증 없이 접근 가능한 공개 API.
 *
 * @param {string} [category] - 도움말 카테고리 필터
 * @returns {Promise<Array<Object>>} 도움말 문서 배열
 *   - id: 문서 ID
 *   - category: 카테고리
 *   - title: 문서 제목
 *   - content: 문서 내용
 *   - viewCount: 조회수
 *
 * @example
 * const articles = await getHelpArticles('CHAT');
 * articles.forEach(a => console.log(a.title, a.viewCount));
 */
export async function getHelpArticles(category) {
  const params = new URLSearchParams();
  if (category) {
    params.append('category', category);
  }
  const queryString = params.toString();
  const url = queryString
    ? `${API_BASE_URL}${SUPPORT_ENDPOINTS.HELP}?${queryString}`
    : `${API_BASE_URL}${SUPPORT_ENDPOINTS.HELP}`;

  /* 인증 없이 접근 가능 — plain fetch 사용 */
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.message || data?.detail || `도움말 조회 실패 (${response.status})`;
    throw new Error(errorMessage);
  }

  return data;
}

// ── 상담 티켓 ──

/**
 * 상담 티켓을 생성한다.
 * 인증된 사용자만 티켓을 생성할 수 있다.
 *
 * @param {Object} params - 티켓 생성 정보
 * @param {string} params.category - 문의 카테고리
 * @param {string} params.title - 문의 제목 (2~100자)
 * @param {string} params.content - 문의 내용 (10~2000자)
 * @returns {Promise<Object>} 생성된 티켓 정보
 *   - ticketId: 티켓 ID
 *   - status: 티켓 상태 (OPEN)
 *   - message: 성공 메시지
 *
 * @example
 * const result = await createTicket({
 *   category: 'ACCOUNT',
 *   title: '비밀번호 변경이 안 됩니다',
 *   content: '비밀번호 변경 시 오류가 발생합니다. 도와주세요.',
 * });
 * console.log(`티켓 #${result.ticketId} 생성 완료`);
 */
export async function createTicket({ category, title, content }) {
  return fetchWithAuthRequired(SUPPORT_ENDPOINTS.CREATE_TICKET, {
    method: 'POST',
    body: JSON.stringify({ category, title, content }),
  });
}

/**
 * 내 상담 티켓 목록을 조회한다 (페이징).
 * 인증된 사용자만 본인의 티켓을 조회할 수 있다.
 *
 * @param {number} [page=0] - 페이지 번호 (0부터 시작, Spring Page 규격)
 * @param {number} [size=10] - 페이지 크기
 * @returns {Promise<Object>} Spring Page 응답
 *   - content: 티켓 배열 [{ ticketId, category, title, status, createdAt }]
 *   - totalPages: 총 페이지 수
 *   - totalElements: 총 티켓 수
 *
 * @example
 * const result = await getMyTickets(0, 10);
 * result.content.forEach(t => console.log(t.title, t.status));
 */
export async function getMyTickets(page = 0, size = 10) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return fetchWithAuthRequired(`${SUPPORT_ENDPOINTS.MY_TICKETS}?${params.toString()}`);
}
