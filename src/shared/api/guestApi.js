/**
 * 비로그인(게스트) 쿠키 발급 / 상태 조회 API.
 *
 * 서버가 HttpOnly 쿠키 `mongle_guest` 를 세팅하므로 클라이언트 JavaScript 는
 * 쿠키 값 자체를 읽거나 저장할 필요가 없다 (XSS 방어). localStorage 를 쓰지 않는다.
 *
 * 채팅 요청은 `credentials: 'include'` 로 쿠키를 자동 동봉하며,
 * 서버에서 "평생 1회" 소비 이후의 재요청은 SSE `error` 이벤트
 * `{error_code: "GUEST_QUOTA_EXCEEDED"}` 로 차단된다.
 */

import { SERVICE_URLS } from './serviceUrls';

const BACKEND_BASE = SERVICE_URLS.BACKEND;

/**
 * 앱 진입 시 1회 호출하여 게스트 쿠키 발급/재확인.
 *
 * 이미 유효한 쿠키가 있으면 서버가 재발급 없이 그대로 유지하고,
 * 쿠키가 없거나 서명이 깨졌으면 신규 UUID 로 발급해 준다.
 *
 * @returns {Promise<{guestId: string, used: boolean} | null>}
 *   네트워크 오류 시 null 반환 (게스트 체험 자체가 실패해도 추천 서비스는 유지).
 */
export async function initGuestToken() {
  try {
    const response = await fetch(`${BACKEND_BASE}/api/v1/guest/token`, {
      method: 'POST',
      credentials: 'include', // HttpOnly 쿠키 수신/전송에 필수
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      // 서버가 쿠키 발급을 거부한 경우 — 운영 Nginx CORS 설정 누락이 흔한 원인
      // 로그만 남기고 null 반환해서 추천 UX 자체는 막지 않는다.
      if (import.meta.env.DEV) {
        console.warn('[guest] initGuestToken HTTP error:', response.status);
      }
      return null;
    }

    const data = await response.json();
    if (import.meta.env.DEV) {
      console.log('[guest] 쿠키 발급/확인 완료:', data);
    }
    return data;
  } catch (err) {
    // 네트워크 실패 — 오프라인/방화벽. UI 에는 영향 없음.
    if (import.meta.env.DEV) {
      console.warn('[guest] initGuestToken error:', err.message);
    }
    return null;
  }
}
