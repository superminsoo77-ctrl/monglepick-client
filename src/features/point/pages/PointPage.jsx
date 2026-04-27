/**
 * 포인트 관리 페이지 컴포넌트.
 *
 * 사용자의 포인트 현황을 종합적으로 관리하는 탭 기반 페이지 (2026-04-14 탭 재구성).
 *
 * <p>상단에는 BalanceCard(잔액/등급/누적 획득)를 고정 헤더로 두어 어느 탭에서도
 * 즉시 잔액을 확인할 수 있도록 하고, 그 아래 4개 탭으로 나머지 섹션을 분리한다.</p>
 *
 * 탭 구성:
 *   1. overview  — AttendanceCalendar + RewardProgress + RewardPolicyGuide
 *      (현재 활동 카운터 + 스트릭 + 지급 기준 카탈로그, "벌기" 흐름)
 *   2. shop      — PointShopSection + ItemExchange
 *      (AI 이용권 상점 + 일반 아이템 교환, "쓰기" 흐름)
 *   3. inventory — MyItemsSection
 *      (보유 아이템 인벤토리, 착용/사용)
 *   4. history   — PointHistory
 *      (적립/차감 내역 페이징 테이블)
 *
 * <p>데이터 로드 타이밍은 기존과 동일하게 마운트 시 일괄 수행한다.
 * (탭별 지연 로드 도입은 refresh 호출부가 여러 곳에 있어 별도 이슈로 분리)</p>
 *
 * 비인증 사용자는 PrivateRoute에 의해 로그인 페이지로 리다이렉트된다.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
/* 커스텀 모달 훅 — window.confirm/alert 대체 */
import { useModal } from '../../../shared/components/Modal';
/* 2026-04-23 라우팅 재설계 PR-3 — 탭 상태 URL 동기화 공통 훅 */
import useTabParam from '../../../shared/hooks/useTabParam';
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
  /* 2026-04-14 신설 — 리워드 지급 기준/진행 현황 */
  getRewardPolicies,
  getRewardProgress,
} from '../api/pointApi';
/* 포인트 상점 API — AI 이용권 구매 전용 (Backend PointShopController) */
import {
  getShopItems,
  purchaseAiTokens,
} from '../api/pointShopApi';
/* 보유 아이템 API — 2026-04-14 신규 (C 방향 인벤토리 연동)
 * `useItem` 은 React Hook 네이밍 컨벤션(use*)과 충돌해 react-hooks/rules-of-hooks 가 오인하므로
 * 컴포넌트 내부에서는 `consumeItemApi` 로 별칭하여 사용한다. (API 모듈 export 명은 그대로 유지) */
import {
  getMyItems,
  getMyItemsSummary,
  equipItem,
  unequipItem,
  useItem as consumeItemApi,
} from '../api/userItemApi';
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
/* 2026-04-14 신설 — "내 아이템" 인벤토리 섹션 (C 방향) */
import MyItemsSection from '../components/MyItemsSection';
/* 2026-04-14 신설 — 리워드 지급 기준 카탈로그 + 내 진행 현황 */
import RewardPolicyGuide from '../components/RewardPolicyGuide';
import RewardProgress from '../components/RewardProgress';
/* 포맷 유틸 — shared/utils에서 가져옴 */
import { formatDate, formatNumberWithComma as formatNumber } from '../../../shared/utils/formatters';
import * as S from './PointPage.styled';

/** 한 페이지에 표시할 이력 건수 */
const HISTORY_PAGE_SIZE = 10;

/**
 * 탭 정의 — 라벨/식별자를 단일 진실 원본으로 관리한다.
 *
 * 2026-04-23 PR-3: 탭 상태를 URL 쿼리 `?tab={id}` 와 동기화하도록 전환 (useTabParam).
 * 다른 페이지에서 `/point?tab=history` 같은 딥링크로 특정 탭에 바로 진입 가능.
 */
const TABS = [
  { id: 'overview', label: '현황' },
  { id: 'shop', label: '상점' },
  { id: 'inventory', label: '내 아이템' },
  { id: 'history', label: '이력' },
];

/**
 * 유효한 탭 id 화이트리스트 — URL 쿼리 값 검증용.
 * 벗어난 값이 들어오면 defaultTab('overview') 으로 폴백.
 */
const VALID_TAB_IDS = new Set(TABS.map((t) => t.id));

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
  /* 현재 선택된 아이템 카테고리 — 백엔드 PointItemCategory 정규값(소문자 5종) 또는 'all'.
   * 과거 한글 라벨('전체'/'쿠폰'/'아바타')을 그대로 쿼리 파라미터로 보내 backend 필터가
   * 항상 0건을 반환하던 버그를 해소하기 위해 ItemExchange 의 cat.key 값과 동일한 키로 통일. */
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  /* ── "내 아이템" 인벤토리 상태 (2026-04-14 신설, C 방향) ── */
  /* UserItemSummaryResponse — 카테고리별 개수 + 착용 정보 */
  const [myItemsSummary, setMyItemsSummary] = useState(null);
  /* UserItemPageResponse — 페이지 기반 목록 */
  const [myItemsPage, setMyItemsPage] = useState(null);
  /* 현재 선택된 인벤토리 카테고리 필터 ("all"|"avatar"|"badge"|"apply"|"hint"|"coupon") */
  const [myItemsCategory, setMyItemsCategory] = useState('all');
  /* 현재 인벤토리 페이지 번호 (0-indexed) */
  const [myItemsPageIndex, setMyItemsPageIndex] = useState(0);
  /* 인벤토리 로딩 플래그 */
  const [isLoadingMyItems, setIsLoadingMyItems] = useState(true);
  /* 현재 처리 중인 userItemId (착용/해제/사용 버튼 비활성화용) */
  const [processingUserItemId, setProcessingUserItemId] = useState(null);

  /* ── 리워드 지급 기준 / 진행 현황 상태 (2026-04-14 신설) ── */
  /* 활성 리워드 정책 목록 (RewardPolicyGuide 표시용) */
  const [rewardPolicies, setRewardPolicies] = useState([]);
  /* 리워드 정책 화면에서 선택된 카테고리 코드 (ALL/CONTENT/ENGAGEMENT/MILESTONE/ATTENDANCE) */
  const [policyCategory, setPolicyCategory] = useState('ALL');
  /* 내 리워드 진행 현황 (UserRewardStatusResponse) */
  const [rewardProgress, setRewardProgress] = useState(null);

  /* 로딩 상태 */
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  /* 리워드 지급 기준/진행 현황 로딩 플래그 */
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(true);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  /* 출석 체크 처리 중 */
  const [isCheckingAttendance, setIsCheckingAttendance] = useState(false);
  /* 아이템 교환 처리 중 (itemId 별) */
  const [exchangingItemId, setExchangingItemId] = useState(null);

  /* 에러 메시지 */
  const [error, setError] = useState(null);

  /* ── 탭 상태 (2026-04-14 신설 / 2026-04-23 PR-3 URL 동기화로 전환) ──
   * 기본은 '현황' 탭. BalanceCard 는 탭과 무관하게 상단에 항상 표시된다.
   * useTabParam 이 ?tab= 쿼리 ↔ activeTab state 를 양방향 동기화하므로
   *   - 새로고침 시 탭 보존
   *   - 공유 링크로 특정 탭 바로 진입
   *   - 기본 탭(overview) 선택 시 쿼리 생략
   * 이 자동으로 보장된다. 기존 useState('overview') 와 API 호환 (tuple 동일). */
  const [activeTab, setActiveTab] = useTabParam({
    validIds: VALID_TAB_IDS,
    defaultTab: 'overview',
  });

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
      /* fallback grade — 가입 직후 기본 등급(NORMAL/알갱이) (v3.2 6등급 체계) */
      setBalanceInfo({ balance: 0, grade: 'NORMAL', totalEarned: 0 });
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
      /* 'all' 이면 필터 미적용 — 그 외는 backend 정규값(coupon/avatar/badge/apply/hint) 그대로 전달 */
      const category = selectedCategory === 'all' ? undefined : selectedCategory;
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
   * "내 아이템" 인벤토리 요약을 로드한다 (2026-04-14 신설, C 방향).
   *
   * <p>Backend GET /api/v1/users/me/items/summary — 카테고리별 개수 + 착용 아이템.
   * 목록 조회({@link loadMyItemsPage})와는 별도로 호출하여 요약/목록 각각의 refresh
   * 라이프사이클을 분리한다. 요약은 마운트 시 1회 + 착용/해제/사용 후에만 재로드.</p>
   */
  const loadMyItemsSummary = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getMyItemsSummary();
      setMyItemsSummary(data);
    } catch (err) {
      console.error('보유 아이템 요약 조회 실패:', err);
      setMyItemsSummary(null);
    }
  }, [user?.id]);

  /**
   * "내 아이템" 인벤토리 페이지를 로드한다.
   *
   * <p>카테고리 필터 또는 페이지 인덱스가 바뀌면 재조회한다.
   * category === 'all' 이면 서버에 파라미터를 보내지 않아 전체 조회.</p>
   */
  const loadMyItemsPage = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingMyItems(true);
    try {
      const category = myItemsCategory === 'all' ? undefined : myItemsCategory;
      const data = await getMyItems({
        category,
        page: myItemsPageIndex,
        size: 12,
      });
      setMyItemsPage(data);
    } catch (err) {
      console.error('보유 아이템 목록 조회 실패:', err);
      setMyItemsPage({ content: [], page: 0, size: 12, totalElements: 0, totalPages: 0 });
    } finally {
      setIsLoadingMyItems(false);
    }
  }, [user?.id, myItemsCategory, myItemsPageIndex]);

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

  /**
   * 리워드 지급 기준(정책 카탈로그) 을 로드한다. (2026-04-14 신설)
   *
   * <p>카테고리가 바뀌면 재조회. 'ALL' 이면 서버에 필터 파라미터를 보내지 않아
   * 전체 활성 정책을 가져온 뒤 컴포넌트 내에서 표시한다. (카테고리 전환 시
   * 매번 서버 왕복하는 대신 전체를 한 번에 캐싱 후 클라이언트 필터링해도 되지만,
   * 단순성을 위해 현재는 서버 필터링 방식 사용)</p>
   */
  const loadRewardPolicies = useCallback(async () => {
    setIsLoadingPolicies(true);
    try {
      const category = policyCategory === 'ALL' ? undefined : policyCategory;
      const data = await getRewardPolicies(category);
      setRewardPolicies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('리워드 정책 조회 실패:', err);
      setRewardPolicies([]);
    } finally {
      setIsLoadingPolicies(false);
    }
  }, [policyCategory]);

  /**
   * 내 리워드 진행 현황을 로드한다. (2026-04-14 신설)
   * 포인트 변동 후 재조회해 마일스톤/활동 카운터가 즉시 반영되도록 한다.
   */
  const loadRewardProgress = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingProgress(true);
    try {
      const data = await getRewardProgress();
      setRewardProgress(data);
    } catch (err) {
      console.error('리워드 진행 현황 조회 실패:', err);
      setRewardProgress(null);
    } finally {
      setIsLoadingProgress(false);
    }
  }, [user?.id]);

  /* 컴포넌트 마운트 시 모든 데이터 로드 */
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadBalance();
      loadAttendanceStatus();
      loadShopState();
      loadRewardProgress();
      /* "내 아이템" 요약도 함께 프리페치 (요약은 자주 바뀌지 않으므로 마운트 시 1회) */
      loadMyItemsSummary();
    }
  }, [isAuthenticated, user?.id, loadBalance, loadAttendanceStatus, loadShopState, loadRewardProgress, loadMyItemsSummary]);

  /* 인벤토리 카테고리/페이지 변경 시 목록 재로드 */
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadMyItemsPage();
    }
  }, [isAuthenticated, user?.id, loadMyItemsPage]);

  /* 리워드 정책 카테고리 변경 시 재로드 (미인증에서도 표시 가능하도록 분리) */
  useEffect(() => {
    if (isAuthenticated) {
      loadRewardPolicies();
    }
  }, [isAuthenticated, loadRewardPolicies]);

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
      /* 출석 보너스는 활동 카운터 + 스트릭 마일스톤 양쪽을 갱신하므로 진행 현황도 재동기화 */
      await Promise.all([loadBalance(), loadAttendanceStatus(), loadRewardProgress()]);

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

      /*
       * 2026-04-14 v2: Backend exchange 응답이 카테고리별로 분기된다.
       *   - AI 이용권(coupon + AI_TOKEN_*): addedAiTokens / totalAiTokens 포함
       *   - 인벤토리(avatar/badge/apply/hint): userItemId 포함
       * 사용자에게 "무엇이 지급되었는지" 카테고리별로 다른 메시지를 보여준다.
       */
      let alertMessage = `'${result.itemName || item.name}' 교환 완료!\n잔액: ${formatNumber(result.balanceAfter)}P`;
      if (result.addedAiTokens != null && result.totalAiTokens != null) {
        alertMessage += `\n추가된 이용권: ${result.addedAiTokens}회\n총 이용권: ${result.totalAiTokens}회`;
      } else if (result.userItemId) {
        alertMessage += `\n"내 아이템" 섹션에서 확인 및 착용/사용할 수 있습니다.`;
      }

      await showAlert({
        title: '교환 완료',
        message: alertMessage,
        type: 'success',
      });

      /* 잔액 + 상점(이용권 잔여) + 인벤토리(카테고리 지급) 모두 재동기화 */
      await Promise.all([
        loadBalance(),
        loadShopState(),
        loadMyItemsSummary(),
        loadMyItemsPage(),
      ]);
    } catch (err) {
      setError(err.message || '아이템 교환에 실패했습니다.');
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setError(null), 3000);
    } finally {
      setExchangingItemId(null);
    }
  };

  // ──────────────────────────────────────────────
  // "내 아이템" 인벤토리 핸들러 (2026-04-14 신설)
  // ──────────────────────────────────────────────

  /**
   * 인벤토리 카테고리 필터 변경 — 카테고리 바꾸면 페이지를 0으로 리셋.
   */
  const handleMyItemsCategoryChange = (nextCategory) => {
    setMyItemsCategory(nextCategory);
    setMyItemsPageIndex(0);
  };

  /**
   * 인벤토리 페이지 변경.
   */
  const handleMyItemsPageChange = (nextPage) => {
    if (nextPage < 0) return;
    setMyItemsPageIndex(nextPage);
  };

  /**
   * 아이템 착용 — 아바타/배지만 가능. 같은 카테고리 기존 착용은 백엔드에서 자동 해제.
   *
   * @param {Object} userItem - MyItemsSection 의 UserItemResponse
   */
  const handleEquipItem = async (userItem) => {
    if (!user?.id || processingUserItemId) return;
    setProcessingUserItemId(userItem.userItemId);
    setError(null);
    try {
      await equipItem(userItem.userItemId);
      /* 착용은 즉각 프로필에도 반영되어야 하므로 요약+목록 모두 재로드 */
      await Promise.all([loadMyItemsSummary(), loadMyItemsPage()]);
    } catch (err) {
      setError(err.message || '아이템 착용에 실패했습니다.');
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setError(null), 3000);
    } finally {
      setProcessingUserItemId(null);
    }
  };

  /**
   * 아이템 착용 해제.
   */
  const handleUnequipItem = async (userItem) => {
    if (!user?.id || processingUserItemId) return;
    setProcessingUserItemId(userItem.userItemId);
    setError(null);
    try {
      await unequipItem(userItem.userItemId);
      await Promise.all([loadMyItemsSummary(), loadMyItemsPage()]);
    } catch (err) {
      setError(err.message || '아이템 해제에 실패했습니다.');
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setError(null), 3000);
    } finally {
      setProcessingUserItemId(null);
    }
  };

  /**
   * 아이템 1회 사용 — 힌트/응모권 소비.
   *
   * <p>응모권은 사용 시 응모 처리(현재는 기록만), 힌트는 퀴즈 화면에서 자동 소비되지만
   * 사용자가 수동으로 잔여량을 확인/조정할 수도 있다.</p>
   */
  const handleUseItem = async (userItem) => {
    if (!user?.id || processingUserItemId) return;
    const confirmed = await showConfirm({
      title: '아이템 사용',
      message: `'${userItem.itemName}'을(를) 사용하시겠습니까?`,
      type: 'confirm',
      confirmLabel: '사용',
    });
    if (!confirmed) return;
    setProcessingUserItemId(userItem.userItemId);
    setError(null);
    try {
      await consumeItemApi(userItem.userItemId);
      await Promise.all([loadMyItemsSummary(), loadMyItemsPage()]);
    } catch (err) {
      setError(err.message || '아이템 사용에 실패했습니다.');
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setError(null), 3000);
    } finally {
      setProcessingUserItemId(null);
    }
  };

  /**
   * AI 이용권 구매 버튼 클릭 핸들러.
   *
   * <p>설계서 v3.2 기준 4종 상품(AI_TOKEN_1/5/20/50)을
   * POST /point/shop/ai-tokens (query: packType) 단일 엔드포인트로 구매한다.
   * 구매된 이용권은 등급 일일 무료 한도를 우회하여 사용 가능하다.</p>
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
      const result = await purchaseAiTokens(item.itemId);

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
    navigate(ROUTES.ACCOUNT_PAYMENT);
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

        {/* 상단 고정 헤더: BalanceCard (어느 탭에서도 잔액/등급 즉시 확인) */}
        <BalanceCard
          balanceInfo={balanceInfo}
          isLoading={isLoadingBalance}
          onNavigatePayment={handleNavigatePayment}
          formatNumber={formatNumber}
        />

        {/* 탭 네비게이션 — MyPage 와 동일한 패턴 (S.Tabs + S.Tab) */}
        <S.Tabs role="tablist" aria-label="포인트 페이지 탭">
          {TABS.map((tab) => (
            <S.Tab
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`point-panel-${tab.id}`}
              $active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </S.Tab>
          ))}
        </S.Tabs>

        {/* 탭 콘텐츠 — key={activeTab} 로 전환 시 fadeInUp 재실행 */}
        <S.TabContent
          key={activeTab}
          role="tabpanel"
          id={`point-panel-${activeTab}`}
          aria-labelledby={`point-tab-${activeTab}`}
        >
          {/* 탭 1 · 현황: 출석 + 리워드 진행 현황 + 지급 기준 카탈로그 */}
          {activeTab === 'overview' && (
            <>
              <AttendanceCalendar
                attendanceStatus={attendanceStatus}
                attendanceResult={attendanceResult}
                isLoading={isLoadingAttendance}
                isCheckingAttendance={isCheckingAttendance}
                onCheckAttendance={handleCheckAttendance}
              />

              <RewardProgress
                progress={rewardProgress}
                isLoading={isLoadingProgress}
                formatNumber={formatNumber}
              />

              {/* 2026-04-14 현황 탭 재개편 — 지급 기준은 기본 접힘으로 전환.
                  진행 현황(RewardProgress) 과의 정보 중복/밀도 과다를 해소하고,
                  사용자가 "필요할 때만" 카탈로그를 펼쳐보도록 한다. */}
              <RewardPolicyGuide
                policies={rewardPolicies}
                isLoading={isLoadingPolicies}
                selectedCategory={policyCategory}
                onCategoryChange={setPolicyCategory}
                formatNumber={formatNumber}
                defaultCollapsed
              />
            </>
          )}

          {/* 탭 2 · 상점: AI 이용권 + 일반 아이템 교환 (구매 흐름 통합) */}
          {activeTab === 'shop' && (
            <>
              <PointShopSection
                shopState={shopState}
                isLoading={isLoadingShop}
                purchasingItemId={purchasingItemId}
                onPurchase={handlePurchaseShopItem}
                formatNumber={formatNumber}
              />

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
            </>
          )}

          {/* 탭 3 · 내 아이템: 인벤토리 (착용/해제/사용) */}
          {activeTab === 'inventory' && (
            <MyItemsSection
              summary={myItemsSummary}
              itemsPage={myItemsPage}
              selectedCategory={myItemsCategory}
              onCategoryChange={handleMyItemsCategoryChange}
              currentPage={myItemsPageIndex}
              onPageChange={handleMyItemsPageChange}
              isLoading={isLoadingMyItems}
              processingItemId={processingUserItemId}
              onEquip={handleEquipItem}
              onUnequip={handleUnequipItem}
              onUse={handleUseItem}
              formatNumber={formatNumber}
              formatDate={formatDate}
            />
          )}

          {/* 탭 4 · 이력: 적립/차감 내역 페이징 테이블 */}
          {activeTab === 'history' && (
            <PointHistory
              history={history}
              historyPage={historyPage}
              isLoading={isLoadingHistory}
              onPageChange={setHistoryPage}
              formatNumber={formatNumber}
              formatDate={formatDate}
            />
          )}
        </S.TabContent>
      </S.PageInner>
    </S.PageWrapper>
  );
}
