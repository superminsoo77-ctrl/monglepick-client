/**
 * 포인트 관리 페이지 컴포넌트.
 *
 * 사용자의 포인트 현황을 종합적으로 관리하는 단일 스크롤 페이지.
 * 4개 섹션으로 구성된다:
 *   1. 포인트 요약 — 잔액, 등급, 총 획득 포인트
 *   2. 출석 체크 — 달력 그리드, 연속 출석, 출석 버튼
 *   3. 아이템 교환 — 카테고리별 아이템 목록, 교환 기능
 *   4. 포인트 이력 — 적립/차감 내역 테이블 (페이징)
 *
 * 비인증 사용자는 로그인 페이지로 리다이렉트된다.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
/* 인증 Context 훅 — app/providers에서 가져옴 */
import { useAuth } from '../../../app/providers/AuthProvider';
/* 포인트 API — 같은 feature 내의 pointApi에서 가져옴 */
import {
  getBalance,
  getPointHistory,
  checkAttendance,
  getAttendanceStatus,
  getPointItems,
  exchangeItem,
} from '../api/pointApi';
/* 라우트 경로 상수 — shared/constants에서 가져옴 */
import { ROUTES } from '../../../shared/constants/routes';
/* 로딩 스피너 — shared/components에서 가져옴 */
import Loading from '../../../shared/components/Loading/Loading';
import './PointPage.css';

/* ── 상수 정의 ── */

/** 등급별 표시 설정 (색상, 라벨) */
const GRADE_CONFIG = {
  BRONZE: { label: 'Bronze', color: '#cd7f32', bg: 'rgba(205, 127, 50, 0.15)' },
  SILVER: { label: 'Silver', color: '#c0c0c0', bg: 'rgba(192, 192, 192, 0.15)' },
  GOLD: { label: 'Gold', color: '#ffd700', bg: 'rgba(255, 215, 0, 0.15)' },
  PLATINUM: { label: 'Platinum', color: '#e5e4e2', bg: 'rgba(229, 228, 226, 0.15)' },
};

/** 아이템 카테고리 필터 탭 목록 */
const ITEM_CATEGORIES = ['전체', 'AI', '쿠폰', '아바타'];

/** 한 페이지에 표시할 이력 건수 */
const HISTORY_PAGE_SIZE = 10;

/** 요일 라벨 (달력 그리드 헤더용) */
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 숫자를 천 단위 콤마가 포함된 문자열로 포맷팅한다.
 *
 * @param {number} num - 포맷팅할 숫자
 * @returns {string} 콤마가 포함된 문자열 (예: 1,500)
 */
function formatNumber(num) {
  if (num == null) return '0';
  return Number(num).toLocaleString('ko-KR');
}

/**
 * ISO 날짜 문자열을 'YYYY.MM.DD' 형식으로 변환한다.
 *
 * @param {string} dateString - ISO 날짜 문자열
 * @returns {string} 포맷팅된 날짜 문자열
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

/**
 * 이번 달의 달력 그리드 데이터를 생성한다.
 * 빈 셀(이전/다음 달)을 포함하여 7열 그리드를 구성한다.
 *
 * @param {number} year - 연도
 * @param {number} month - 월 (1-12)
 * @returns {Array<{day: number|null, dateStr: string|null}>} 달력 셀 배열
 */
function generateCalendarGrid(year, month) {
  /* 해당 월의 첫날과 마지막 날 계산 */
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDayOfWeek = firstDay.getDay(); // 0=일, 1=월, ...
  const totalDays = lastDay.getDate();

  const grid = [];

  /* 첫 주의 빈 셀 (이전 달) */
  for (let i = 0; i < startDayOfWeek; i++) {
    grid.push({ day: null, dateStr: null });
  }

  /* 해당 월의 날짜 셀 */
  for (let d = 1; d <= totalDays; d++) {
    const mm = String(month).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    grid.push({ day: d, dateStr: `${year}-${mm}-${dd}` });
  }

  return grid;
}

export default function PointPage() {
  /* ── 상태 관리 ── */

  /* 포인트 잔액 정보 (balance, grade, totalEarned) */
  const [balanceInfo, setBalanceInfo] = useState(null);
  /* 출석 현황 (currentStreak, totalDays, checkedToday, monthlyDates) */
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  /* 출석 체크 결과 (애니메이션 표시용) */
  const [attendanceResult, setAttendanceResult] = useState(null);
  /* 포인트 아이템 목록 */
  const [items, setItems] = useState([]);
  /* 현재 선택된 아이템 카테고리 */
  const [selectedCategory, setSelectedCategory] = useState('전체');
  /* 포인트 이력 (Spring Page 응답) */
  const [history, setHistory] = useState({ content: [], totalPages: 0, totalElements: 0 });
  /* 현재 이력 페이지 번호 (0-indexed) */
  const [historyPage, setHistoryPage] = useState(0);

  /* 로딩 상태 */
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  /* 출석 체크 처리 중 */
  const [isCheckingAttendance, setIsCheckingAttendance] = useState(false);
  /* 아이템 교환 처리 중 (itemId 별) */
  const [exchangingItemId, setExchangingItemId] = useState(null);

  /* 에러 메시지 */
  const [error, setError] = useState(null);

  /* 인증 상태 및 네비게이션 */
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  /* ── 인증 확인 ── */

  /**
   * 비인증 사용자를 로그인 페이지로 리다이렉트한다.
   */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(ROUTES.LOGIN);
    }
  }, [isAuthenticated, authLoading, navigate]);

  /* ── 데이터 로드 ── */

  /**
   * 포인트 잔액 정보를 로드한다.
   * 컴포넌트 마운트 시 및 포인트 변동 후 호출된다.
   */
  const loadBalance = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingBalance(true);
    try {
      const data = await getBalance(user.id);
      setBalanceInfo(data);
    } catch (err) {
      console.error('잔액 조회 실패:', err);
      /* API 미구현 시 기본값으로 처리 */
      setBalanceInfo({ balance: 0, grade: 'BRONZE', totalEarned: 0 });
    } finally {
      setIsLoadingBalance(false);
    }
  }, [user?.id]);

  /**
   * 출석 현황을 로드한다.
   */
  const loadAttendanceStatus = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingAttendance(true);
    try {
      const data = await getAttendanceStatus(user.id);
      setAttendanceStatus(data);
    } catch (err) {
      console.error('출석 현황 조회 실패:', err);
      /* 기본값 — 달력은 빈 상태로 표시 */
      setAttendanceStatus({
        currentStreak: 0,
        totalDays: 0,
        checkedToday: false,
        monthlyDates: [],
      });
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [user?.id]);

  /**
   * 포인트 아이템 목록을 로드한다.
   * 카테고리 변경 시 호출된다.
   */
  const loadItems = useCallback(async () => {
    setIsLoadingItems(true);
    try {
      /* '전체' 카테고리는 필터 없이 조회 */
      const category = selectedCategory === '전체' ? undefined : selectedCategory;
      const data = await getPointItems(category);
      setItems(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      console.error('아이템 목록 조회 실패:', err);
      setItems([]);
    } finally {
      setIsLoadingItems(false);
    }
  }, [selectedCategory]);

  /**
   * 포인트 이력을 로드한다.
   * 페이지 변경 시 호출된다.
   */
  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingHistory(true);
    try {
      const data = await getPointHistory(user.id, {
        page: historyPage,
        size: HISTORY_PAGE_SIZE,
      });
      setHistory({
        content: data?.content || [],
        totalPages: data?.totalPages || 0,
        totalElements: data?.totalElements || 0,
      });
    } catch (err) {
      console.error('포인트 이력 조회 실패:', err);
      setHistory({ content: [], totalPages: 0, totalElements: 0 });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user?.id, historyPage]);

  /* 컴포넌트 마운트 시 모든 데이터 로드 */
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadBalance();
      loadAttendanceStatus();
    }
  }, [isAuthenticated, user?.id, loadBalance, loadAttendanceStatus]);

  /* 카테고리 변경 시 아이템 재로드 */
  useEffect(() => {
    if (isAuthenticated) {
      loadItems();
    }
  }, [isAuthenticated, loadItems]);

  /* 페이지 변경 시 이력 재로드 */
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadHistory();
    }
  }, [isAuthenticated, user?.id, loadHistory]);

  /* ── 이벤트 핸들러 ── */

  /**
   * 출석 체크 버튼 클릭 핸들러.
   * 출석 성공 시 잔액과 출석 현황을 갱신한다.
   */
  const handleCheckAttendance = async () => {
    if (!user?.id || isCheckingAttendance) return;
    setIsCheckingAttendance(true);
    setAttendanceResult(null);
    setError(null);

    try {
      const result = await checkAttendance(user.id);
      /* 출석 결과를 애니메이션 표시용으로 저장 */
      setAttendanceResult(result);
      /* 잔액 및 출석 현황 갱신 */
      await Promise.all([loadBalance(), loadAttendanceStatus()]);

      /* 3초 후 애니메이션 숨김 */
      setTimeout(() => setAttendanceResult(null), 3000);
    } catch (err) {
      setError(err.message || '출석 체크에 실패했습니다.');
      /* 3초 후 에러 메시지 숨김 */
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsCheckingAttendance(false);
    }
  };

  /**
   * 아이템 교환 버튼 클릭 핸들러.
   * 확인 다이얼로그 후 교환을 수행한다.
   *
   * @param {Object} item - 교환할 아이템 객체
   */
  const handleExchangeItem = async (item) => {
    if (!user?.id || exchangingItemId) return;

    /* 교환 확인 다이얼로그 */
    const confirmed = window.confirm(
      `'${item.name}'을(를) ${formatNumber(item.price)}P로 교환하시겠습니까?`
    );
    if (!confirmed) return;

    setExchangingItemId(item.itemId);
    setError(null);

    try {
      const result = await exchangeItem(item.itemId, user.id);
      /* 교환 성공 알림 */
      alert(`'${result.itemName || item.name}' 교환 완료! 잔액: ${formatNumber(result.balanceAfter)}P`);
      /* 잔액 갱신 */
      await loadBalance();
    } catch (err) {
      setError(err.message || '아이템 교환에 실패했습니다.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setExchangingItemId(null);
    }
  };

  /**
   * 충전하기 버튼 클릭 — 결제 페이지로 이동.
   */
  const handleNavigatePayment = () => {
    navigate(ROUTES.PAYMENT);
  };

  /* ── 렌더링 ── */

  /* 인증 로딩 중 */
  if (authLoading) {
    return <Loading message="인증 확인 중..." fullPage />;
  }

  /* 현재 날짜 기준 달력 데이터 */
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const calendarGrid = generateCalendarGrid(currentYear, currentMonth);
  const todayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  /* 출석 날짜 Set (빠른 조회용) */
  const checkedDatesSet = new Set(attendanceStatus?.monthlyDates || []);

  /* 등급 설정 */
  const gradeKey = balanceInfo?.grade || 'BRONZE';
  const gradeConfig = GRADE_CONFIG[gradeKey] || GRADE_CONFIG.BRONZE;

  return (
    <div className="point-page">
      <div className="point-page__inner">
        {/* 페이지 제목 */}
        <h1 className="point-page__title">포인트 관리</h1>

        {/* 글로벌 에러 메시지 */}
        {error && (
          <div className="point-page__error" role="alert">
            {error}
          </div>
        )}

        {/* ═══════════════════════════════════════════
            섹션 1: 포인트 요약
            ═══════════════════════════════════════════ */}
        <section className="point-page__section point-page__summary">
          {isLoadingBalance ? (
            <Loading message="포인트 정보 로딩 중..." />
          ) : (
            <div className="point-page__summary-card">
              {/* 좌측: 잔액 정보 */}
              <div className="point-page__summary-left">
                <p className="point-page__summary-label">보유 포인트</p>
                <p className="point-page__summary-balance">
                  {formatNumber(balanceInfo?.balance)}
                  <span className="point-page__summary-unit">P</span>
                </p>
                <p className="point-page__summary-earned">
                  총 획득: {formatNumber(balanceInfo?.totalEarned)}P
                </p>
              </div>

              {/* 우측: 등급 배지 + 충전 버튼 */}
              <div className="point-page__summary-right">
                <div
                  className="point-page__grade-badge"
                  style={{
                    backgroundColor: gradeConfig.bg,
                    color: gradeConfig.color,
                    borderColor: gradeConfig.color,
                  }}
                >
                  {gradeConfig.label}
                </div>
                <button
                  className="point-page__charge-btn"
                  onClick={handleNavigatePayment}
                >
                  충전하기
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════
            섹션 2: 출석 체크
            ═══════════════════════════════════════════ */}
        <section className="point-page__section point-page__attendance">
          <h2 className="point-page__section-title">출석 체크</h2>

          {isLoadingAttendance ? (
            <Loading message="출석 현황 로딩 중..." />
          ) : (
            <div className="point-page__attendance-content">
              {/* 출석 통계 */}
              <div className="point-page__attendance-stats">
                <div className="point-page__attendance-stat">
                  <span className="point-page__attendance-stat-value">
                    {attendanceStatus?.currentStreak || 0}일
                  </span>
                  <span className="point-page__attendance-stat-label">연속 출석</span>
                </div>
                <div className="point-page__attendance-stat">
                  <span className="point-page__attendance-stat-value">
                    {attendanceStatus?.totalDays || 0}일
                  </span>
                  <span className="point-page__attendance-stat-label">총 출석</span>
                </div>
              </div>

              {/* 보너스 안내 */}
              <div className="point-page__attendance-bonus-info">
                <span className="point-page__attendance-bonus-tag">기본 10P</span>
                <span className="point-page__attendance-bonus-tag point-page__attendance-bonus-tag--highlight">
                  7일 연속 30P
                </span>
                <span className="point-page__attendance-bonus-tag point-page__attendance-bonus-tag--premium">
                  30일 연속 60P
                </span>
              </div>

              {/* 달력 그리드 */}
              <div className="point-page__calendar">
                {/* 달력 헤더 — 현재 월 표시 */}
                <div className="point-page__calendar-header">
                  <span className="point-page__calendar-month">
                    {currentYear}년 {currentMonth}월
                  </span>
                </div>

                {/* 요일 라벨 */}
                <div className="point-page__calendar-weekdays">
                  {WEEKDAY_LABELS.map((label) => (
                    <div key={label} className="point-page__calendar-weekday">
                      {label}
                    </div>
                  ))}
                </div>

                {/* 날짜 셀 */}
                <div className="point-page__calendar-grid">
                  {calendarGrid.map((cell, idx) => {
                    /* 빈 셀 (이전/다음 달) */
                    if (!cell.day) {
                      return <div key={`empty-${idx}`} className="point-page__calendar-cell point-page__calendar-cell--empty" />;
                    }

                    /* 출석 여부 */
                    const isChecked = checkedDatesSet.has(cell.dateStr);
                    /* 오늘 날짜 여부 */
                    const isToday = cell.dateStr === todayStr;

                    return (
                      <div
                        key={cell.dateStr}
                        className={[
                          'point-page__calendar-cell',
                          isChecked ? 'point-page__calendar-cell--checked' : '',
                          isToday ? 'point-page__calendar-cell--today' : '',
                        ].join(' ')}
                      >
                        <span className="point-page__calendar-day">{cell.day}</span>
                        {isChecked && (
                          <span className="point-page__calendar-check-icon" aria-label="출석 완료">
                            &#10003;
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 출석 체크 결과 애니메이션 */}
              {attendanceResult && (
                <div className="point-page__attendance-result" role="status">
                  <span className="point-page__attendance-result-points">
                    +{attendanceResult.earnedPoints}P
                  </span>
                  <span className="point-page__attendance-result-text">
                    {attendanceResult.streakCount}일 연속 출석!
                  </span>
                </div>
              )}

              {/* 출석 체크 버튼 */}
              <button
                className={[
                  'point-page__attendance-btn',
                  attendanceStatus?.checkedToday ? 'point-page__attendance-btn--disabled' : '',
                ].join(' ')}
                onClick={handleCheckAttendance}
                disabled={attendanceStatus?.checkedToday || isCheckingAttendance}
              >
                {isCheckingAttendance
                  ? '출석 체크 중...'
                  : attendanceStatus?.checkedToday
                    ? '오늘 출석 완료'
                    : '출석 체크'}
              </button>
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════
            섹션 3: 아이템 교환
            ═══════════════════════════════════════════ */}
        <section className="point-page__section point-page__items">
          <h2 className="point-page__section-title">아이템 교환</h2>

          {/* 카테고리 필터 탭 */}
          <div className="point-page__items-tabs">
            {ITEM_CATEGORIES.map((category) => (
              <button
                key={category}
                className={[
                  'point-page__items-tab',
                  selectedCategory === category ? 'point-page__items-tab--active' : '',
                ].join(' ')}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* 아이템 그리드 */}
          {isLoadingItems ? (
            <Loading message="아이템 로딩 중..." />
          ) : items.length === 0 ? (
            <div className="point-page__items-empty">
              <p>교환 가능한 아이템이 없습니다.</p>
            </div>
          ) : (
            <div className="point-page__items-grid">
              {items.map((item) => (
                <div key={item.itemId} className="point-page__item-card">
                  {/* 아이템 카테고리 태그 */}
                  <span className="point-page__item-category">{item.category}</span>
                  {/* 아이템 이름 */}
                  <h3 className="point-page__item-name">{item.name}</h3>
                  {/* 아이템 설명 */}
                  <p className="point-page__item-desc">{item.description}</p>
                  {/* 가격 및 교환 버튼 */}
                  <div className="point-page__item-footer">
                    <span className="point-page__item-price">
                      {formatNumber(item.price)}P
                    </span>
                    <button
                      className="point-page__item-exchange-btn"
                      onClick={() => handleExchangeItem(item)}
                      disabled={
                        exchangingItemId === item.itemId ||
                        (balanceInfo?.balance || 0) < item.price
                      }
                    >
                      {exchangingItemId === item.itemId
                        ? '교환 중...'
                        : (balanceInfo?.balance || 0) < item.price
                          ? '포인트 부족'
                          : '교환'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════
            섹션 4: 포인트 이력
            ═══════════════════════════════════════════ */}
        <section className="point-page__section point-page__history">
          <h2 className="point-page__section-title">
            포인트 이력
            {history.totalElements > 0 && (
              <span className="point-page__history-count">
                ({formatNumber(history.totalElements)}건)
              </span>
            )}
          </h2>

          {isLoadingHistory ? (
            <Loading message="이력 로딩 중..." />
          ) : history.content.length === 0 ? (
            <div className="point-page__history-empty">
              <p>포인트 이력이 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 이력 테이블 */}
              <div className="point-page__history-table-wrapper">
                <table className="point-page__history-table">
                  <thead>
                    <tr>
                      <th>내용</th>
                      <th>변동</th>
                      <th>잔액</th>
                      <th>일시</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.content.map((item, idx) => {
                      /* 양수(적립)는 초록색, 음수(차감)는 빨간색 */
                      const isPositive = item.pointChange > 0;
                      return (
                        <tr key={item.id || idx}>
                          <td className="point-page__history-desc">
                            {item.description || '-'}
                          </td>
                          <td
                            className={[
                              'point-page__history-change',
                              isPositive
                                ? 'point-page__history-change--positive'
                                : 'point-page__history-change--negative',
                            ].join(' ')}
                          >
                            {isPositive ? '+' : ''}{formatNumber(item.pointChange)}P
                          </td>
                          <td className="point-page__history-after">
                            {formatNumber(item.pointAfter)}P
                          </td>
                          <td className="point-page__history-date">
                            {formatDate(item.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {history.totalPages > 1 && (
                <div className="point-page__pagination">
                  {/* 이전 페이지 */}
                  <button
                    className="point-page__pagination-btn"
                    onClick={() => setHistoryPage((prev) => Math.max(0, prev - 1))}
                    disabled={historyPage === 0}
                  >
                    이전
                  </button>

                  {/* 페이지 번호 */}
                  <span className="point-page__pagination-info">
                    {historyPage + 1} / {history.totalPages}
                  </span>

                  {/* 다음 페이지 */}
                  <button
                    className="point-page__pagination-btn"
                    onClick={() =>
                      setHistoryPage((prev) => Math.min(history.totalPages - 1, prev + 1))
                    }
                    disabled={historyPage >= history.totalPages - 1}
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
