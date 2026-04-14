/**
 * 포인트(Point) API 모듈.
 *
 * 포인트 잔액 조회, 변동 이력, 출석 체크, 아이템 교환 등
 * 포인트 관련 HTTP 요청을 처리한다.
 * 모든 요청에 인증 토큰이 필요하다.
 */

/* 공용 axios 인스턴스 + 인증 필수 가드 */
import api, { requireAuth } from '../../../shared/api/axiosInstance';
/* API 상수 — shared/constants에서 가져옴 */
import { POINT_ENDPOINTS } from '../../../shared/constants/api';

// ── 포인트 잔액 ──

/**
 * 포인트 잔액 정보를 조회한다.
 * 현재 잔액, 등급, 누적 포인트를 반환한다.
 * JWT 토큰에서 userId를 추출하므로 별도 전달 불필요.
 *
 * @returns {Promise<Object>} 포인트 잔액 정보
 *   - balance: 현재 잔액
 *   - grade: 등급 코드 (NORMAL/BRONZE/SILVER/GOLD/PLATINUM/DIAMOND, v3.2 6등급 팝콘 테마)
 *   - totalEarned: 누적 적립 포인트
 */
export async function getBalance() {
  requireAuth();
  return api.get(POINT_ENDPOINTS.BALANCE);
}

// ── 포인트 이력 ──

/**
 * 포인트 변동 이력을 조회한다 (페이징).
 * 적립, 차감, 교환 등 모든 포인트 변동 기록을 확인할 수 있다.
 *
 * JWT 토큰에서 userId를 추출하므로 별도 전달 불필요.
 *
 * @param {Object} [options={}] - 조회 옵션
 * @param {number} [options.page=0] - 페이지 번호 (0부터 시작, Spring Page 규격)
 * @param {number} [options.size=20] - 페이지 크기
 * @returns {Promise<Object>} Spring Page 응답
 *   - content: 이력 배열 [{ id, pointChange, pointAfter, pointType, description, createdAt }]
 *   - totalPages, totalElements, number
 */
export async function getPointHistory({ page = 0, size = 20 } = {}) {
  requireAuth();
  return api.get(POINT_ENDPOINTS.HISTORY, { params: { page, size } });
}

// ── 출석 체크 ──

/**
 * 출석 체크를 수행한다.
 * 하루에 한 번만 가능하며, 연속 출석 시 보너스 포인트를 받을 수 있다.
 * - 기본: 10P, 7일 연속: 30P, 30일 연속: 60P
 *
 * @returns {Promise<Object>} 출석 체크 결과
 *   - checkDate, streakCount, earnedPoints, currentBalance
 * @throws {Error} 이미 출석 완료 시 409 에러 (코드: P003)
 */
export async function checkAttendance() {
  requireAuth();
  return api.post(POINT_ENDPOINTS.ATTENDANCE);
}

/**
 * 출석 현황을 조회한다.
 * 연속 출석 일수, 총 출석 일수, 오늘 출석 여부, 월간 출석 날짜 목록을 반환한다.
 *
 * @returns {Promise<Object>} 출석 현황 정보
 *   - currentStreak, totalDays, checkedToday, monthlyDates
 */
export async function getAttendanceStatus() {
  requireAuth();
  return api.get(POINT_ENDPOINTS.ATTENDANCE_STATUS);
}

// ── 아이템 교환 ──

/**
 * 교환 가능한 아이템 목록을 조회한다.
 * 카테고리 필터를 지정하면 해당 카테고리의 아이템만 반환한다.
 *
 * @param {string} [category] - 아이템 카테고리 필터 (선택)
 * @returns {Promise<Array<Object>>} 아이템 목록
 */
export async function getPointItems(category) {
  requireAuth();
  const params = {};
  if (category) params.category = category;
  return api.get(POINT_ENDPOINTS.ITEMS, { params });
}

/**
 * 아이템을 포인트로 교환한다.
 * 보유 포인트에서 아이템 가격만큼 차감된다.
 *
 * @param {number|string} itemId - 교환할 아이템 ID
 * @returns {Promise<Object>} 교환 결과
 *   - success, balanceAfter, itemName
 * @throws {Error} 포인트 부족 시 402 에러 (코드: P001)
 * @throws {Error} 아이템 미존재 시 404 에러 (코드: P004)
 */
export async function exchangeItem(itemId) {
  requireAuth();
  return api.post(POINT_ENDPOINTS.EXCHANGE(itemId));
}

// ── 리워드 지급 기준 / 진행 현황 (2026-04-14 신설) ──

/**
 * 활성 리워드 정책(지급 기준) 목록을 조회한다.
 *
 * Backend GET /api/v1/point/policies 와 1:1 매핑.
 * "어떤 활동이 얼마의 포인트를 주는지" 카탈로그를 반환한다.
 *
 * @param {string} [category] - 카테고리 필터 (CONTENT/ENGAGEMENT/MILESTONE/ATTENDANCE)
 * @returns {Promise<Array<Object>>} 정책 배열
 *   - policyId, actionType, activityName, actionCategory
 *   - pointsAmount, pointType, dailyLimit, maxCount, cooldownSeconds
 *   - thresholdCount, thresholdTarget, parentActionType, description
 */
export async function getRewardPolicies(category) {
  requireAuth();
  const params = {};
  if (category) params.category = category;
  return api.get(POINT_ENDPOINTS.POLICIES, { params });
}

/**
 * 내 리워드 진행 현황을 조회한다.
 *
 * Backend GET /api/v1/point/progress 와 1:1 매핑.
 * 활동별 카운터(오늘 n/m), 마일스톤 진행률, 포인트 요약을 종합 반환한다.
 *
 * @returns {Promise<Object>} 종합 진행 현황
 *   - userId, totalEarned, earnedByActivity, currentBalance, gradeCode
 *   - activities: ActivityProgressResponse[] (일반 활동)
 *   - milestones: MilestoneProgressResponse[] (임계치 기반)
 */
export async function getRewardProgress() {
  requireAuth();
  return api.get(POINT_ENDPOINTS.PROGRESS);
}
