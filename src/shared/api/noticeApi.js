/**
 * 공지사항(Notice) API 모듈.
 *
 * 앱 메인 화면에 노출되는 활성 공지(BANNER/POPUP/MODAL)를 조회한다.
 * Backend GET /api/v1/notices — 비로그인 허용 (Public API).
 *
 * 응답 형태: NoticeResponse[]
 *   { noticeId, title, content, noticeType, displayType,
 *     linkUrl, imageUrl, startAt, endAt, priority, isActive, ... }
 */

import { backendApi } from './axiosInstance';
import { NOTICE_ENDPOINTS } from '../constants/api';

/**
 * 현재 노출 중인 앱 메인 공지 목록을 조회한다.
 *
 * <p>호출 시그니처:</p>
 * <ul>
 *   <li>{@code getActiveNotices()} — 전체 (하위 호환)</li>
 *   <li>{@code getActiveNotices('BANNER')} — type 필터 단일 인자 (하위 호환)</li>
 *   <li>{@code getActiveNotices({ type, pinned })} — 권장. 객체로 옵션 전달</li>
 * </ul>
 *
 * <p>2026-04-15: {@code pinned} 옵션 추가. 홈 화면에서 {@code pinned: true} 로 호출해
 * "고정" 된 공지만 노출한다. 고정되지 않은 공지는 커뮤니티 공지 탭에서만 확인할 수 있다.</p>
 *
 * @param {string|{type?: string, pinned?: boolean}} [options]
 *   - string 을 넘기면 type 필터로 취급 (레거시 호환)
 *   - 객체면 type/pinned 옵션 조합
 * @returns {Promise<Array>} 활성 공지 목록 (priority DESC, createdAt DESC)
 */
export async function getActiveNotices(options) {
  // 레거시 호환 — 문자열은 type 으로 해석
  const normalized =
    typeof options === 'string'
      ? { type: options }
      : (options && typeof options === 'object') ? options : {};

  const params = {};
  if (normalized.type) params.type = normalized.type;
  // boolean 그대로 전달 — axios 는 true/false 를 문자열 'true'/'false' 로 직렬화
  if (typeof normalized.pinned === 'boolean') params.pinned = normalized.pinned;

  // backendApi 의 response interceptor 가 이미 response.data 를 추출해 반환한다
  // (axiosInstance.js:381 — `(response) => response.data`).
  // 따라서 여기서 다시 `const { data } = ...` 로 destructure 하면
  // 배열의 .data 프로퍼티(undefined)를 반환하게 되어 항상 빈 데이터가 된다.
  // 인터셉터 결과(=NoticeResponse 배열)를 그대로 반환한다.
  return await backendApi.get(NOTICE_ENDPOINTS.ACTIVE, { params });
}

/**
 * 커뮤니티 공지 탭용 전체 활성 공지 페이징 조회.
 *
 * <p>홈 메인의 {@link getActiveNotices} 와 달리 LIST_ONLY 포함 모든 노출 방식의
 * 활성/기간 내 공지를 반환한다. 정렬: isPinned DESC (고정 우선), createdAt DESC.</p>
 *
 * @param {Object} [params]
 * @param {number} [params.page=0] - 페이지 번호 (0-base)
 * @param {number} [params.size=20] - 페이지 크기 (1~100)
 * @returns {Promise<Object>} Spring Data Page 응답
 *   {
 *     content: NoticeResponse[],
 *     totalPages: number,
 *     totalElements: number,
 *     number: number,        // 현재 페이지 (0-base)
 *     size: number,
 *     ...
 *   }
 */
export async function getNoticeList({ page = 0, size = 20 } = {}) {
  return await backendApi.get(NOTICE_ENDPOINTS.LIST, {
    params: { page, size },
  });
}

/**
 * 공지 단건 상세 조회 (활성/기간 내 공지만).
 *
 * <p>커뮤니티 공지 탭 딥링크(`?tab=notices&noticeId={id}`) 진입 시 사용.
 * 비활성/기간 외 공지는 백엔드에서 "찾을 수 없음"으로 동일 응답.</p>
 *
 * @param {number|string} noticeId - 공지 PK
 * @returns {Promise<Object>} NoticeResponse
 */
export async function getNoticeDetail(noticeId) {
  if (noticeId === null || noticeId === undefined || noticeId === '') {
    throw new Error('noticeId 가 필요합니다.');
  }
  return await backendApi.get(NOTICE_ENDPOINTS.DETAIL(noticeId));
}
