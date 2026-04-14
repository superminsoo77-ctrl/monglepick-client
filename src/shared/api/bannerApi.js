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
  const { data } = await backendApi.get(BANNER_ENDPOINTS.ACTIVE, { params });
  return data;
}
