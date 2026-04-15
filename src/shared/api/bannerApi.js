/**
 * 배너(Banner) API 모듈 — 2026-04-14 신규.
 *
 * 홈 화면 우측 슬라이드 배너 위젯이 활성 배너 목록을 조회한다.
 * Backend GET /api/v1/banners — 비로그인 허용 (Public API).
 *
 * 응답 형태: BannerResponse[]
 *   {
 *     id, title, imageUrl, linkUrl, position,
 *     sortOrder, isActive, startDate, endDate, createdAt
 *   }
 *
 * Backend 의 활성 조건:
 *   - is_active = true
 *   - (start_date IS NULL OR start_date <= NOW())
 *   - (end_date   IS NULL OR end_date   >= NOW())
 *   - 정렬: sort_order ASC
 */

import { backendApi } from './axiosInstance';
import { BANNER_ENDPOINTS } from '../constants/api';

/**
 * 현재 노출 중인 배너 목록을 조회한다.
 *
 * @param {string} [position] - 위치 필터 (예: "MAIN"). 생략 시 서버 기본값 "MAIN".
 * @returns {Promise<Array>} 활성 배너 목록 (sort_order ASC)
 */
export async function getActiveBanners(position) {
  const params = {};
  if (position) params.position = position;
  // backendApi 의 response interceptor 가 이미 response.data 를 추출해 반환한다
  // (axiosInstance.js:381 — `(response) => response.data`).
  // 따라서 여기서 다시 `const { data } = ...` 로 destructure 하면
  // 배열의 .data 프로퍼티(undefined)를 반환하게 되어 항상 빈 데이터가 된다.
  // 인터셉터 결과(=BannerResponse 배열)를 그대로 반환한다.
  return await backendApi.get(BANNER_ENDPOINTS.ACTIVE, { params });
}
