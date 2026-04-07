/**
 * 포인트 관리 페이지 컴포넌트.
 *
 * 사용자의 포인트 현황을 종합적으로 관리하는 단일 스크롤 페이지.
 * 4개 섹션으로 구성된다:
 *   1. BalanceCard — 잔액, 등급, 총 획득 포인트
 *   2. AttendanceCalendar — 달력 그리드, 연속 출석, 출석 버튼
 *   3. ItemExchange — 카테고리별 아이템 목록, 교환 기능
 *   4. PointHistory — 적립/차감 내역 테이블 (페이징)
 *
 * 비인증 사용자는 PrivateRoute에 의해 로그인 페이지로 리다이렉트된다.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
/* 커스텀 모달 훅 — window.confirm/alert 대체 */
import { useModal } from '../../../shared/components/Modal';
/* 인증 Context 훅 — app/providers에서 가져옴 */
import useAuthStore from '../../../shared/stores/useAuthStore';
/* 포인트 API — 같은 feature 내의 pointApi에서 가져옴 */
import {
  getBalance,
  getPointHistory,
  checkAttendance,
  getAttendanceStatus,
  getPointItems,
  exchangeItem,
} from '../api/pointApi';
/* 포인트 상점 API — AI 이용권 구매 전용 (Backend PointShopController) */
import {
  getShopItems,
  purchaseAiTokens,
  purchaseAiDailyExtend,
} from '../api/pointShopApi';
/* 라우트 경로 상수 — shared/constants에서 가져옴 */
import { ROUTES } from '../../../shared/constants/routes';
/* 로딩 스피너 — shared/components에서 가져옴 */
import Loading from '../../../shared/components/Loading/Loading';
/* 하위 컴포넌트 — 같은 feature 내의 components에서 가져옴 */
import BalanceCard from '../components/BalanceCard';
import AttendanceCalendar from '../components/AttendanceCalendar';
import ItemExchange from '../components/ItemExchange';
import PointShopSection from '../components/PointShopSection';
import PointHistory from '../components/PointHistory';
/* 포맷 유틸 — shared/utils에서 가져옴 */
import { formatDate, formatNumberWithComma as formatNumber } from '../../../shared/utils/formatters';
import * as S from './PointPage.styled';

/** 한 페이지에 표시할 이력 건수 */
const HISTORY_PAGE_SIZE = 10;

export default function PointPage() {
  /* 커스텀 모달 — window.confirm/alert 대체 */
  const { showAlert, showConfirm } = useModal();

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
  /* 포인트 상점(AI 이용권) 상태 — PointShopController 응답 ({ currentBalance, currentAiTokens, items }) */
  const [shopState, setShopState] = useState(null);
  /* 포인트 상점 로딩 플래그 */
  const [isLoadingShop, setIsLoadingShop] = useState(true);
  /* 현재 구매 처리 중인 상점 아이템 ID (AI_TOKEN_5 등) */
  const [purchasingItemId, setPurchasingItemId] = useState(null);
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

  /* setTimeout cleanup 용 ref (메모리 누수 방지) */
  const attendanceTimerRef = useRef(null);
  const errorTimerRef = useRef(null);
  useEffect(() => {
    return () => {
      if (attendanceTimerRef.current) clearTimeout(attendanceTimerRef.current);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  /* 인증 상태 및 네비게이션 */
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.isLoading);
  const navigate = useNavigate();

  /* ── 데이터 로드 ── */

  /**
   * 포인트 잔액 정보를 로드한다.
   * 컴포넌트 마운트 시 및 포인트 변동 후 호출된다.
   */
  const loadBalance = useCallback(async () => {
    if (!user?.id) {
      setIsLoadingBalance(false);
      return;
    }
    setIsLoadingBalance(true);
    try {
      const data = await getBalance();
      setBalanceInfo(data);
    } catch (err) {
      console.error('잔액 조회 실패:', err);
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
      const data = await getAttendanceStatus();
      setAttendanceStatus(data);
    } catch (err) {
      console.error('출석 현황 조회 실패:', err);
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
   * 포인트 상점(AI 이용권) 상태를 로드한다.
   *
   * Backend GET /api/v1/point/shop/items를 호출해
   * 현재 잔액 · AI 이용권 잔여 횟수 · 판매 상품 3종을 한 번에 가져온다.
   * 실패 시 shopState=null로 두어 섹션에서 에러 메시지를 표시한다.
   */
  const loadShopState = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingShop(true);
    try {
      const data = await getShopItems();
      setShopState(data);
    } catch (err) {
      console.error('포인트 상점 조회 실패:', err);
      setShopState(null);
    } finally {
      setIsLoadingShop(false);
    }
  }, [user?.id]);

  /**
   * 포인트 이력을 로드한다.
   * 페이지 변경 시 호출된다.
   */
  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingHistory(true);
    try {
      const data = await getPointHistory({
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
      loadShopState();
    }
  }, [isAuthenticated, user?.id, loadBalance, loadAttendanceStatus, loadShopState]);

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
      const result = await checkAttendance();
      setAttendanceResult(result);
      await Promise.all([loadBalance(), loadAttendanceStatus()]);

      /* 3초 후 애니메이션 숨김 */
      if (attendanceTimerRef.current) clearTimeout(attendanceTimerRef.current);
      attendanceTimerRef.current = setTimeout(() => setAttendanceResult(null), 3000);
    } catch (err) {
      setError(err.message || '출석 체크에 실패했습니다.');
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setError(null), 3000);
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

    const confirmed = await showConfirm({
      title: '아이템 교환',
      message: `'${item.name}'을(를) ${formatNumber(item.price)}P로 교환하시겠습니까?`,
      type: 'confirm',
      confirmLabel: '교환',
    });
    if (!confirmed) return;

    setExchangingItemId(item.itemId);
    setError(null);

    try {
      const result = await exchangeItem(item.itemId);
      await showAlert({
        title: '교환 완료',
        message: `'${result.itemName || item.name}' 교환 완료!\n잔액: ${formatNumber(result.balanceAfter)}P`,
        type: 'success',
      });
      await loadBalance();
    } catch (err) {
      setError(err.message || '아이템 교환에 실패했습니다.');
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setError(null), 3000);
    } finally {
      setExchangingItemId(null);
    }
  };

  /**
   * AI 이용권 구매 버튼 클릭 핸들러.
   *
   * <p>상품 itemId를 분기해 PointShopController의 두 엔드포인트 중
   * 알맞은 것을 호출한다.</p>
   *
   * <ul>
   *   <li>AI_TOKEN_5 / AI_TOKEN_20 → POST /point/shop/ai-tokens (query: packType)</li>
   *   <li>AI_DAILY_EXTEND           → POST /point/shop/ai-extend</li>
   * </ul>
   *
   * 구매 성공 후 잔액과 상점 상태를 재로드하여 UI를 갱신한다.
   *
   * @param {Object} item - 구매 대상 상품 ({ itemId, name, cost, amount, description })
   */
  const handlePurchaseShopItem = async (item) => {
    if (!user?.id || purchasingItemId) return;

    const confirmed = await showConfirm({
      title: 'AI 이용권 구매',
      message: `'${item.name}'을(를) ${formatNumber(item.cost)}P로 구매하시겠습니까?`,
      type: 'confirm',
      confirmLabel: '구매',
    });
    if (!confirmed) return;

    setPurchasingItemId(item.itemId);
    setError(null);

    try {
      let result;
      if (item.itemId === 'AI_DAILY_EXTEND') {
        result = await purchaseAiDailyExtend();
      } else {
        result = await purchaseAiTokens(item.itemId);
      }

      await showAlert({
        title: '구매 완료',
        message:
          `'${item.name}' 구매 완료!\n` +
          `추가된 이용권: ${result.addedTokens}회\n` +
          `잔액: ${formatNumber(result.remainingBalance)}P\n` +
          `총 이용권: ${result.totalPurchasedTokens}회`,
        type: 'success',
      });

      /* 잔액/상점 상태/이력 재동기화 */
      await Promise.all([loadBalance(), loadShopState(), loadHistory()]);
    } catch (err) {
      setError(err.message || 'AI 이용권 구매에 실패했습니다.');
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setError(null), 3000);
    } finally {
      setPurchasingItemId(null);
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

  return (
    <S.PageWrapper>
      <S.PageInner>
        {/* 페이지 제목 */}
        <S.PageTitle>포인트 관리</S.PageTitle>

        {/* 글로벌 에러 메시지 */}
        {error && (
          <S.ErrorBanner role="alert">
            {error}
          </S.ErrorBanner>
        )}

        {/* 섹션 1: 포인트 요약 */}
        <BalanceCard
          balanceInfo={balanceInfo}
          isLoading={isLoadingBalance}
          onNavigatePayment={handleNavigatePayment}
          formatNumber={formatNumber}
        />

        {/* 섹션 2: 출석 체크 */}
        <AttendanceCalendar
          attendanceStatus={attendanceStatus}
          attendanceResult={attendanceResult}
          isLoading={isLoadingAttendance}
          isCheckingAttendance={isCheckingAttendance}
          onCheckAttendance={handleCheckAttendance}
        />

        {/* 섹션 2-B: AI 이용권 상점 (PointShopController) */}
        <PointShopSection
          shopState={shopState}
          isLoading={isLoadingShop}
          purchasingItemId={purchasingItemId}
          onPurchase={handlePurchaseShopItem}
          formatNumber={formatNumber}
        />

        {/* 섹션 3: 아이템 교환 */}
        <ItemExchange
          items={items}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          isLoading={isLoadingItems}
          exchangingItemId={exchangingItemId}
          balance={balanceInfo?.balance || 0}
          onExchangeItem={handleExchangeItem}
          formatNumber={formatNumber}
        />

        {/* 섹션 4: 포인트 이력 */}
        <PointHistory
          history={history}
          historyPage={historyPage}
          isLoading={isLoadingHistory}
          onPageChange={setHistoryPage}
          formatNumber={formatNumber}
          formatDate={formatDate}
        />
      </S.PageInner>
    </S.PageWrapper>
  );
}
