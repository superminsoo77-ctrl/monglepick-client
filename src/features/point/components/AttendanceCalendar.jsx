/**
 * 출석 체크 섹션 컴포넌트.
 *
 * 출석 통계(연속/총 출석), 보너스 안내, 달력 그리드,
 * 출석 결과 애니메이션, 출석 체크 버튼을 표시한다.
 *
 * @param {Object} props
 * @param {Object|null} props.attendanceStatus - 출석 현황 {currentStreak, totalDays, checkedToday, monthlyDates}
 * @param {Object|null} props.attendanceResult - 출석 결과 {earnedPoints, streakCount}
 * @param {boolean} props.isLoading - 로딩 상태
 * @param {boolean} props.isCheckingAttendance - 출석 체크 처리 중
 * @param {Function} props.onCheckAttendance - 출석 체크 핸들러
 */

import Loading from '../../../shared/components/Loading/Loading';
import * as S from './AttendanceCalendar.styled';

/** 요일 라벨 (달력 그리드 헤더용) */
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

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
  const startDayOfWeek = firstDay.getDay();
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

export default function AttendanceCalendar({
  attendanceStatus,
  attendanceResult,
  isLoading,
  isCheckingAttendance,
  onCheckAttendance,
}) {
  /* 현재 날짜 기준 달력 데이터 */
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const calendarGrid = generateCalendarGrid(currentYear, currentMonth);
  const todayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  /* 출석 날짜 Set (빠른 조회용) */
  const checkedDatesSet = new Set(attendanceStatus?.monthlyDates || []);

  return (
    <section className="point-page__section point-page__attendance">
      <h2 className="point-page__section-title">출석 체크</h2>

      {isLoading ? (
        <Loading message="출석 현황 로딩 중..." />
      ) : (
        <S.AttendanceContent>
          {/* 출석 통계 */}
          <S.AttendanceStats>
            <S.AttendanceStat>
              <S.AttendanceStatValue>
                {attendanceStatus?.currentStreak || 0}일
              </S.AttendanceStatValue>
              <S.AttendanceStatLabel>연속 출석</S.AttendanceStatLabel>
            </S.AttendanceStat>
            <S.AttendanceStat>
              <S.AttendanceStatValue>
                {attendanceStatus?.totalDays || 0}일
              </S.AttendanceStatValue>
              <S.AttendanceStatLabel>총 출석</S.AttendanceStatLabel>
            </S.AttendanceStat>
          </S.AttendanceStats>

          {/* 보너스 안내 */}
          <S.BonusInfo>
            <S.BonusTag>기본 10P</S.BonusTag>
            <S.BonusTag $variant="highlight">7일 연속 50P</S.BonusTag>
            <S.BonusTag $variant="premium">30일 연속 300P</S.BonusTag>
          </S.BonusInfo>

          {/* 달력 그리드 */}
          <S.Calendar>
            {/* 달력 헤더 — 현재 월 표시 */}
            <S.CalendarHeader>
              <S.CalendarMonth>
                {currentYear}년 {currentMonth}월
              </S.CalendarMonth>
            </S.CalendarHeader>

            {/* 요일 라벨 */}
            <S.CalendarWeekdays>
              {WEEKDAY_LABELS.map((label) => (
                <S.CalendarWeekday key={label}>{label}</S.CalendarWeekday>
              ))}
            </S.CalendarWeekdays>

            {/* 날짜 셀 */}
            <S.CalendarGrid>
              {calendarGrid.map((cell, idx) => {
                /* 빈 셀 (이전/다음 달) */
                if (!cell.day) {
                  return <S.CalendarCell key={`empty-${idx}`} $isEmpty />;
                }

                /* 출석 여부 */
                const isChecked = checkedDatesSet.has(cell.dateStr);
                /* 오늘 날짜 여부 */
                const isToday = cell.dateStr === todayStr;

                return (
                  <S.CalendarCell
                    key={cell.dateStr}
                    $isChecked={isChecked}
                    $isToday={isToday}
                  >
                    <S.CalendarDay>{cell.day}</S.CalendarDay>
                    {isChecked && (
                      <S.CalendarCheckIcon aria-label="출석 완료">
                        &#10003;
                      </S.CalendarCheckIcon>
                    )}
                  </S.CalendarCell>
                );
              })}
            </S.CalendarGrid>
          </S.Calendar>

          {/* 출석 체크 결과 애니메이션 */}
          {attendanceResult && (
            <S.AttendanceResult role="status">
              <S.AttendanceResultPoints>
                +{attendanceResult.earnedPoints}P
              </S.AttendanceResultPoints>
              <S.AttendanceResultText>
                {attendanceResult.streakCount}일 연속 출석!
              </S.AttendanceResultText>
            </S.AttendanceResult>
          )}

          {/* 출석 체크 버튼 */}
          <S.AttendanceButton
            onClick={onCheckAttendance}
            disabled={attendanceStatus?.checkedToday || isCheckingAttendance}
          >
            {isCheckingAttendance
              ? '출석 체크 중...'
              : attendanceStatus?.checkedToday
                ? '오늘 출석 완료'
                : '출석 체크'}
          </S.AttendanceButton>
        </S.AttendanceContent>
      )}
    </section>
  );
}
