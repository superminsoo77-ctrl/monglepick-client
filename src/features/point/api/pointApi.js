/**
 * 포인트(Point) API 모듈.
 *
 * 포인트 잔액 조회, 변동 이력, 출석 체크, 아이템 교환 등
 * 포인트 관련 HTTP 요청을 처리한다.
 * 모든 요청에 인증 토큰이 필요하다.
 */

/* API 상수 — shared/constants에서 가져옴 */
import { POINT_ENDPOINTS } from '../../../shared/constants/api';
/* 공통 인증 fetch 래퍼 — shared/utils에서 가져옴 */
import { fetchWithAuthRequired } from '../../../shared/utils/fetchWithAuth';

// ── 포인트 잔액 ──

/**
 * 포인트 잔액 정보를 조회한다.
 * 현재 잔액, 등급, 누적 포인트를 반환한다.
 *
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 포인트 잔액 정보
 *   - balance: 현재 잔액
 *   - grade: 등급 (BRONZE, SILVER, GOLD, PLATINUM)
 *   - totalEarned: 누적 적립 포인트
 *
 * @example
 * const info = await getBalance('user123');
 * console.log(info.balance); // 1500
 * console.log(info.grade);   // 'SILVER'
 */
export async function getBalance(userId) {
  const params = new URLSearchParams({ userId });
  return fetchWithAuthRequired(`${POINT_ENDPOINTS.BALANCE}?${params.toString()}`);
}

// ── 포인트 이력 ──

/**
 * 포인트 변동 이력을 조회한다 (페이징).
 * 적립, 차감, 교환 등 모든 포인트 변동 기록을 확인할 수 있다.
 *
 * @param {string} userId - 사용자 ID
 * @param {Object} [options={}] - 조회 옵션
 * @param {number} [options.page=0] - 페이지 번호 (0부터 시작, Spring Page 규격)
 * @param {number} [options.size=20] - 페이지 크기
 * @returns {Promise<Object>} Spring Page 응답
 *   - content: 이력 배열 [{ id, pointChange, pointAfter, pointType, description, createdAt }]
 *   - totalPages: 총 페이지 수
 *   - totalElements: 총 이력 건수
 *   - number: 현재 페이지 번호
 *
 * @example
 * const result = await getPointHistory('user123', { page: 0, size: 10 });
 * result.content.forEach(item => {
 *   console.log(item.description, item.pointChange);
 * });
 */
export async function getPointHistory(userId, { page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({
    userId,
    page: String(page),
    size: String(size),
  });
  return fetchWithAuthRequired(`${POINT_ENDPOINTS.HISTORY}?${params.toString()}`);
}

// ── 출석 체크 ──

/**
 * 출석 체크를 수행한다.
 * 하루에 한 번만 가능하며, 연속 출석 시 보너스 포인트를 받을 수 있다.
 * - 기본: 10P, 7일 연속: 30P, 30일 연속: 60P
 *
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 출석 체크 결과
 *   - checkDate: 출석 일자 (YYYY-MM-DD)
 *   - streakCount: 현재 연속 출석 일수
 *   - earnedPoints: 획득 포인트
 *   - currentBalance: 출석 후 잔액
 *
 * @throws {Error} 이미 출석 완료 시 409 에러 (코드: P003)
 *
 * @example
 * const result = await checkAttendance('user123');
 * console.log(`${result.streakCount}일 연속 출석! +${result.earnedPoints}P`);
 */
export async function checkAttendance(userId) {
  const params = new URLSearchParams({ userId });
  return fetchWithAuthRequired(`${POINT_ENDPOINTS.ATTENDANCE}?${params.toString()}`, {
    method: 'POST',
  });
}

/**
 * 출석 현황을 조회한다.
 * 연속 출석 일수, 총 출석 일수, 오늘 출석 여부, 월간 출석 날짜 목록을 반환한다.
 *
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 출석 현황 정보
 *   - currentStreak: 현재 연속 출석 일수
 *   - totalDays: 총 출석 일수
 *   - checkedToday: 오늘 출석 여부 (boolean)
 *   - monthlyDates: 이번 달 출석 날짜 배열 ['2026-03-01', '2026-03-02', ...]
 *
 * @example
 * const status = await getAttendanceStatus('user123');
 * if (!status.checkedToday) {
 *   console.log('아직 출석하지 않았습니다!');
 * }
 */
export async function getAttendanceStatus(userId) {
  const params = new URLSearchParams({ userId });
  return fetchWithAuthRequired(`${POINT_ENDPOINTS.ATTENDANCE_STATUS}?${params.toString()}`);
}

// ── 아이템 교환 ──

/**
 * 교환 가능한 아이템 목록을 조회한다.
 * 카테고리 필터를 지정하면 해당 카테고리의 아이템만 반환한다.
 *
 * @param {string} [category] - 아이템 카테고리 필터 (선택)
 * @returns {Promise<Array<Object>>} 아이템 목록
 *   - [{ itemId, name, description, price, category }]
 *
 * @example
 * // 전체 아이템 조회
 * const items = await getPointItems();
 *
 * // 특정 카테고리 아이템만 조회
 * const aiItems = await getPointItems('AI_RECOMMENDATION');
 */
export async function getPointItems(category) {
  const params = new URLSearchParams();
  if (category) {
    params.append('category', category);
  }
  const queryString = params.toString();
  const url = queryString
    ? `${POINT_ENDPOINTS.ITEMS}?${queryString}`
    : POINT_ENDPOINTS.ITEMS;
  return fetchWithAuthRequired(url);
}

/**
 * 아이템을 포인트로 교환한다.
 * 보유 포인트에서 아이템 가격만큼 차감된다.
 *
 * @param {number|string} itemId - 교환할 아이템 ID
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 교환 결과
 *   - success: 교환 성공 여부 (boolean)
 *   - balanceAfter: 교환 후 잔액
 *   - itemName: 교환한 아이템 이름
 *
 * @throws {Error} 포인트 부족 시 402 에러 (코드: P001)
 * @throws {Error} 아이템 미존재 시 404 에러 (코드: P004)
 *
 * @example
 * const result = await exchangeItem(1, 'user123');
 * console.log(`${result.itemName} 교환 완료! 잔액: ${result.balanceAfter}P`);
 */
export async function exchangeItem(itemId, userId) {
  const params = new URLSearchParams({ userId });
  return fetchWithAuthRequired(`${POINT_ENDPOINTS.EXCHANGE(itemId)}?${params.toString()}`, {
    method: 'POST',
  });
}
