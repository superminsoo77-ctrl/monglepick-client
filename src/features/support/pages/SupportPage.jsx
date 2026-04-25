/**
 * 고객센터(Support) 페이지 컴포넌트.
 *
 * 사용자가 도움을 받을 수 있는 종합 고객센터 페이지.
 * 4개 섹션(탭)으로 구성된다:
 *   1. FAQ (자주 묻는 질문) — 카테고리 필터 + 검색 + 아코디언 + 피드백
 *   2. 도움말 — 카테고리별 도움말 문서 카드 그리드
 *   3. 문의하기 — 상담 티켓 생성 폼 (인증 필요)
 *   4. 내 문의 내역 — 내 티켓 목록 + 상태 배지 (인증 필요)
 *
 * 백엔드 API가 미구현인 경우, 플레이스홀더 데이터로 대체하여 UI가 정상 표시된다.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
/* 인증 Context 훅 — app/providers에서 가져옴 */
import useAuthStore from '../../../shared/stores/useAuthStore';
/* 2026-04-23 라우팅 재설계 PR-3 — 섹션 탭 URL 동기화 */
import useTabParam from '../../../shared/hooks/useTabParam';
/* 고객센터 API — 같은 feature 내의 supportApi에서 가져옴 */
import {
  getFaqs,
  submitFaqFeedback,
  getHelpArticles,
  createTicket,
  getMyTickets,
} from '../api/supportApi';
/* 로딩 스피너 — shared/components에서 가져옴 */
import Loading from '../../../shared/components/Loading/Loading';

/* ── 하위 컴포넌트 ── */
import FaqTab from '../components/FaqTab';
import HelpTab from '../components/HelpTab';
import TicketTab from '../components/TicketTab';
import ChatbotTab from '../components/ChatbotTab';

/* 포맷 유틸 — shared/utils에서 가져옴 */
import { formatDate } from '../../../shared/utils/formatters';
import * as S from './SupportPage.styled';

/* ══════════════════════════════════════════
   상수 정의
   ══════════════════════════════════════════ */

/** 메인 섹션 탭 목록 */
const SECTION_TABS = [
  { key: 'chatbot', label: 'AI 챗봇' },
  { key: 'faq', label: 'FAQ' },
  { key: 'help', label: '도움말' },
  { key: 'ticket', label: '문의하기' },
  { key: 'history', label: '내 문의 내역' },
];

/**
 * 유효한 섹션 key 화이트리스트 — URL ?tab= 쿼리 검증용.
 * 벗어나면 defaultTab('chatbot') 으로 폴백.
 */
const VALID_SECTION_KEYS = new Set(SECTION_TABS.map((t) => t.key));

/** FAQ/도움말 카테고리 필터 탭 (라벨 → API 값 매핑) */
const CATEGORY_FILTERS = [
  { label: '전체', value: undefined },
  { label: '일반', value: 'GENERAL' },
  { label: '계정', value: 'ACCOUNT' },
  { label: '채팅', value: 'CHAT' },
  { label: '추천', value: 'RECOMMENDATION' },
  { label: '커뮤니티', value: 'COMMUNITY' },
  { label: '결제', value: 'PAYMENT' },
];

/** 카테고리 API 값 → 한국어 라벨 매핑 */
const CATEGORY_LABEL_MAP = {
  GENERAL: '일반',
  ACCOUNT: '계정',
  CHAT: '채팅',
  RECOMMENDATION: '추천',
  COMMUNITY: '커뮤니티',
  PAYMENT: '결제',
};

/** 티켓 상태 → 한국어 라벨 매핑 */
const STATUS_LABEL_MAP = {
  OPEN: '접수',
  IN_PROGRESS: '처리중',
  RESOLVED: '해결됨',
  CLOSED: '종료',
};

/** 문의하기 카테고리 드롭다운 옵션 */
const TICKET_CATEGORIES = [
  { label: '카테고리를 선택하세요', value: '' },
  { label: '일반 문의', value: 'GENERAL' },
  { label: '계정/로그인', value: 'ACCOUNT' },
  { label: 'AI 채팅', value: 'CHAT' },
  { label: '영화 추천', value: 'RECOMMENDATION' },
  { label: '커뮤니티', value: 'COMMUNITY' },
  { label: '결제/포인트', value: 'PAYMENT' },
];

/** 한 페이지에 표시할 티켓 건수 */
const TICKETS_PAGE_SIZE = 10;

/* ══════════════════════════════════════════
   플레이스홀더 데이터 (API 실패 시 대체)
   ══════════════════════════════════════════ */

/** API 실패 시 표시할 FAQ 플레이스홀더 데이터 */
const FALLBACK_FAQS = [
  { id: 'fallback-1', category: 'GENERAL', question: '몽글픽은 무료인가요?', answer: '기본 기능은 무료이며, 프리미엄 AI 추천은 포인트가 필요합니다. 매일 출석 체크로 포인트를 모을 수 있고, 등급에 따라 무료 추천 횟수가 제공됩니다.', helpfulCount: 42, notHelpfulCount: 3 },
  { id: 'fallback-2', category: 'RECOMMENDATION', question: '추천은 어떻게 작동하나요?', answer: 'AI가 대화를 통해 취향을 파악하고, 117만건의 영화 데이터에서 최적의 영화를 찾아드립니다. 벡터 검색, 텍스트 검색, 그래프 검색을 결합한 하이브리드 추천 엔진을 사용합니다.', helpfulCount: 38, notHelpfulCount: 2 },
  { id: 'fallback-3', category: 'ACCOUNT', question: '회원가입은 어떻게 하나요?', answer: '이메일 회원가입과 소셜 로그인(카카오, 네이버, 구글)을 지원합니다. 우측 상단의 "회원가입" 버튼을 눌러 간편하게 가입할 수 있습니다.', helpfulCount: 25, notHelpfulCount: 1 },
  { id: 'fallback-4', category: 'CHAT', question: 'AI 채팅에서 이미지도 보낼 수 있나요?', answer: '네, 영화 포스터나 장면 이미지를 업로드하면 AI가 분석하여 비슷한 분위기의 영화를 추천해 드립니다. 이미지는 최대 10MB까지 업로드 가능합니다.', helpfulCount: 19, notHelpfulCount: 0 },
  { id: 'fallback-5', category: 'COMMUNITY', question: '커뮤니티 게시글은 어떻게 작성하나요?', answer: '로그인 후 커뮤니티 페이지에서 "글쓰기" 버튼을 눌러 게시글을 작성할 수 있습니다. 영화 리뷰, 추천 요청, 자유 토론 등 다양한 카테고리에서 글을 쓸 수 있습니다.', helpfulCount: 15, notHelpfulCount: 2 },
  { id: 'fallback-6', category: 'PAYMENT', question: '포인트는 어떻게 충전하나요?', answer: '포인트 페이지에서 충전하기 버튼을 누르면 결제 페이지로 이동합니다. Toss Payments를 통해 안전하게 결제할 수 있으며, 구독 상품을 이용하면 더 저렴하게 포인트를 받을 수 있습니다.', helpfulCount: 22, notHelpfulCount: 1 },
  { id: 'fallback-7', category: 'RECOMMENDATION', question: '추천 결과가 마음에 들지 않으면 어떻게 하나요?', answer: 'AI에게 더 구체적인 취향을 알려주세요. "좀 더 가벼운 영화", "반전이 있는 스릴러" 등으로 대화를 이어가면 취향에 맞는 추천을 받을 수 있습니다. 대화가 길어질수록 정확도가 올라갑니다.', helpfulCount: 30, notHelpfulCount: 4 },
  { id: 'fallback-8', category: 'GENERAL', question: '몽글픽에는 어떤 영화 데이터가 있나요?', answer: 'TMDB, KOBIS(영화진흥위원회), KMDb(한국영화데이터베이스) 등에서 수집한 약 117만건의 영화 데이터를 보유하고 있습니다. 한국 영화와 해외 영화를 모두 포함합니다.', helpfulCount: 17, notHelpfulCount: 0 },
];

/** API 실패 시 표시할 도움말 플레이스홀더 데이터 */
const FALLBACK_HELP_ARTICLES = [
  { id: 'help-1', category: 'GENERAL', title: '몽글픽 시작하기', content: '몽글픽은 AI 기반 영화 추천 서비스입니다.\n\n1. 회원가입 후 로그인합니다.\n2. AI 추천 채팅에서 원하는 영화 분위기를 설명합니다.\n3. AI가 분석하여 최적의 영화를 추천합니다.\n\n기본 기능은 무료이며, 매일 출석 체크를 하면 포인트를 받을 수 있습니다.', viewCount: 1250 },
  { id: 'help-2', category: 'CHAT', title: 'AI 채팅 사용법', content: 'AI 채팅은 자연어로 대화하면서 영화를 추천받는 기능입니다.\n\n- 기분, 상황, 좋아하는 장르 등을 자유롭게 이야기하세요.\n- 이미지를 업로드하면 비슷한 분위기의 영화를 찾아줍니다.\n- 대화를 이어갈수록 더 정확한 추천을 받을 수 있습니다.\n\n추천 1회당 포인트가 차감되며, 등급에 따라 무료 횟수가 주어집니다.', viewCount: 980 },
  { id: 'help-3', category: 'ACCOUNT', title: '계정 관리 가이드', content: '계정 관련 주요 기능 안내입니다.\n\n- 프로필 수정: 마이페이지에서 닉네임과 프로필 사진을 변경할 수 있습니다.\n- 선호 장르 설정: 온보딩 시 설정한 선호 장르를 마이페이지에서 수정할 수 있습니다.\n- 소셜 로그인: 카카오, 네이버, 구글 계정으로 간편 로그인이 가능합니다.', viewCount: 560 },
  { id: 'help-4', category: 'PAYMENT', title: '포인트 및 결제 안내', content: '포인트는 AI 추천, 아이템 교환 등에 사용됩니다.\n\n- 포인트 획득: 출석 체크(10P~60P), 구독 결제, 이벤트 등\n- 포인트 사용: AI 추천(100P), 아이템 교환\n- 결제 수단: Toss Payments (카드, 계좌이체 등)\n- 구독: 월간/연간 구독 상품으로 포인트를 저렴하게 충전할 수 있습니다.', viewCount: 430 },
  { id: 'help-5', category: 'COMMUNITY', title: '커뮤니티 이용 가이드', content: '커뮤니티에서 다른 사용자들과 영화에 대해 이야기할 수 있습니다.\n\n- 게시글 작성: 리뷰, 추천 요청, 자유 토론 등\n- 댓글: 게시글에 댓글을 남길 수 있습니다.\n- 신고: 부적절한 게시글은 신고할 수 있습니다.\n\n건전한 커뮤니티 문화를 위해 이용 규칙을 준수해 주세요.', viewCount: 320 },
  { id: 'help-6', category: 'RECOMMENDATION', title: '추천 시스템 이해하기', content: '몽글픽의 추천 시스템은 여러 기술을 결합하여 최적의 영화를 찾습니다.\n\n- 협업 필터링(CF): 비슷한 취향의 사용자 기반 추천\n- 콘텐츠 기반 필터링(CBF): 영화 특성 분석 기반 추천\n- 하이브리드 검색: 벡터 + 텍스트 + 그래프 검색 결합\n- MMR 다양성: 다양한 장르/분위기를 포함하도록 재정렬\n\n대화를 통해 AI가 취향을 파악할수록 추천 정확도가 향상됩니다.', viewCount: 680 },
];

/* ══════════════════════════════════════════
   유틸리티 함수
   ══════════════════════════════════════════ */


/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

export default function SupportPage() {
  /* ── 인증 상태 ── */
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const authLoading = useAuthStore((s) => s.isLoading);

  /* ── 섹션/탭 상태 ── */
  /*
   * 2026-04-23 PR-3: 섹션 탭을 URL ?tab= 쿼리와 동기화.
   *   - /support?tab=faq 같은 딥링크 지원 (기존 홈 배너/챗봇 링크에서 이미 `?tab=` 형식)
   *   - 새로고침 시 섹션 보존
   *   - 기본 섹션(chatbot) 은 쿼리 생략 — 캐노니컬 URL `/support` 유지
   * useTabParam 반환 튜플은 [string, (id)=>void] 라 기존 useState API 와 호환.
   */
  const [activeSection, setActiveSection] = useTabParam({
    validIds: VALID_SECTION_KEYS,
    defaultTab: 'chatbot',
  });

  /* ── FAQ 상태 ── */
  const [faqs, setFaqs] = useState([]);
  const [faqCategoryIdx, setFaqCategoryIdx] = useState(0);
  const [faqSearchKeyword, setFaqSearchKeyword] = useState('');
  const [openFaqIds, setOpenFaqIds] = useState(new Set());
  const [faqFeedbackMap, setFaqFeedbackMap] = useState({});
  const [feedbackLoadingId, setFeedbackLoadingId] = useState(null);
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(true);

  /* ── 도움말 상태 ── */
  const [helpArticles, setHelpArticles] = useState([]);
  const [helpCategoryIdx, setHelpCategoryIdx] = useState(0);
  const [openHelpId, setOpenHelpId] = useState(null);
  const [isLoadingHelp, setIsLoadingHelp] = useState(true);

  /* ── 문의하기 폼 상태 ── */
  const [ticketCategory, setTicketCategory] = useState('');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketContent, setTicketContent] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [ticketSuccess, setTicketSuccess] = useState(false);

  /* ── 내 문의 내역 상태 ── */
  const [myTickets, setMyTickets] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [ticketPage, setTicketPage] = useState(0);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  /* ── 글로벌 에러 ── */
  const [error, setError] = useState(null);

  /* setTimeout cleanup 용 ref (메모리 누수 방지) */
  const errorTimerRef = useRef(null);
  useEffect(() => {
    return () => { if (errorTimerRef.current) clearTimeout(errorTimerRef.current); };
  }, []);

  /* ══════════════════════════════════════════
     데이터 로드 함수
     ══════════════════════════════════════════ */

  const loadFaqs = useCallback(async () => {
    setIsLoadingFaqs(true);
    try {
      const categoryValue = CATEGORY_FILTERS[faqCategoryIdx]?.value;
      const data = await getFaqs(categoryValue);
      /*
       * 응답 형태 방어 (2026-04-24):
       * Backend 는 List<FaqResponse> 를 직접 반환하지만, 운영 중 다음 케이스가 관측됨:
       *   - ApiResponse 래핑 변경으로 {content: [...]} 페이징 형태로 전달되는 경우
       *   - axios 인터셉터 경로 차이로 data 가 {success, data} 형태로 한번 더 감싸지는 경우
       *   - 네트워크/프록시 오류 시 null/undefined/빈 문자열 반환
       * 모든 케이스에서 안전하게 리스트를 추출하고, 실패 시 빈 배열로 fallback 한다.
       */
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
          ? data.content
          : Array.isArray(data?.data)
            ? data.data
            : [];
      setFaqs(list);

      /*
       * 서버 응답에 포함된 userFeedback 을 피드백 맵에 병합.
       *
       * 로그인 사용자가 이미 피드백한 FAQ 는 백엔드가 "helpful"/"not_helpful" 을 내려주며,
       * 이를 UI 상태 코드("helpful"/"notHelpful") 로 변환해 faqFeedbackMap 에 주입한다.
       * 새로고침 후에도 이미 남긴 피드백 FAQ 는 감사 메시지로 표시되어 재클릭 → 409 Conflict
       * 를 구조적으로 차단한다. (서버가 단일 진실 원본)
       *
       * 카테고리 변경 시 응답에 포함되지 않은 FAQ 는 기존 맵 항목을 보존해야 하므로
       * spread 로 병합한다. 비로그인 호출이거나 미제출 FAQ 는 userFeedback=null 이 오므로
       * 굳이 null 을 맵에 쓰지 않는다(기존 값이 있으면 유지).
       */
      setFaqFeedbackMap((prev) => {
        const next = { ...prev };
        for (const faq of list) {
          if (faq?.userFeedback === 'helpful') {
            next[faq.id] = 'helpful';
          } else if (faq?.userFeedback === 'not_helpful') {
            next[faq.id] = 'notHelpful';
          }
        }
        return next;
      });
    } catch (err) {
      console.warn('FAQ 조회 실패, 플레이스홀더 데이터 사용:', err.message);
      const categoryValue = CATEGORY_FILTERS[faqCategoryIdx]?.value;
      if (categoryValue) {
        setFaqs(FALLBACK_FAQS.filter((f) => f.category === categoryValue));
      } else {
        setFaqs(FALLBACK_FAQS);
      }
    } finally {
      setIsLoadingFaqs(false);
    }
  }, [faqCategoryIdx]);

  const loadHelpArticles = useCallback(async () => {
    setIsLoadingHelp(true);
    try {
      const categoryValue = CATEGORY_FILTERS[helpCategoryIdx]?.value;
      const data = await getHelpArticles(categoryValue);
      /* loadFaqs 와 동일 응답 형태 방어 (2026-04-24): 리스트/페이징/래핑/null 모두 대응 */
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
          ? data.content
          : Array.isArray(data?.data)
            ? data.data
            : [];
      setHelpArticles(list);
    } catch (err) {
      console.warn('도움말 조회 실패, 플레이스홀더 데이터 사용:', err.message);
      const categoryValue = CATEGORY_FILTERS[helpCategoryIdx]?.value;
      if (categoryValue) {
        setHelpArticles(FALLBACK_HELP_ARTICLES.filter((a) => a.category === categoryValue));
      } else {
        setHelpArticles(FALLBACK_HELP_ARTICLES);
      }
    } finally {
      setIsLoadingHelp(false);
    }
  }, [helpCategoryIdx]);

  const loadMyTickets = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingTickets(true);
    try {
      const data = await getMyTickets(ticketPage, TICKETS_PAGE_SIZE);
      setMyTickets({
        content: data?.content || [],
        totalPages: data?.totalPages || 0,
        totalElements: data?.totalElements || 0,
      });
    } catch (err) {
      console.warn('티켓 목록 조회 실패:', err.message);
      setMyTickets({ content: [], totalPages: 0, totalElements: 0 });
    } finally {
      setIsLoadingTickets(false);
    }
  }, [isAuthenticated, ticketPage]);

  /* ── 데이터 로드 Effect ── */
  useEffect(() => {
    if (activeSection === 'faq') loadFaqs();
  }, [activeSection, loadFaqs]);

  useEffect(() => {
    if (activeSection === 'help') loadHelpArticles();
  }, [activeSection, loadHelpArticles]);

  useEffect(() => {
    if (activeSection === 'history' && isAuthenticated) loadMyTickets();
  }, [activeSection, isAuthenticated, loadMyTickets]);

  /* ══════════════════════════════════════════
     이벤트 핸들러
     ══════════════════════════════════════════ */

  /** FAQ 아코디언 토글 */
  const handleToggleFaq = (faqId) => {
    setOpenFaqIds((prev) => {
      const next = new Set(prev);
      if (next.has(faqId)) { next.delete(faqId); } else { next.add(faqId); }
      return next;
    });
  };

  /** FAQ 카테고리 변경 */
  const handleFaqCategoryChange = (idx) => {
    setFaqCategoryIdx(idx);
    setFaqSearchKeyword('');
    setOpenFaqIds(new Set());
  };

  /**
   * FAQ 피드백 제출.
   *
   * 정상 응답 시: 피드백 맵을 업데이트해 감사 메시지로 치환한다.
   * 409 Conflict (FAQ_FEEDBACK_DUPLICATE) 수신 시: 서버 기준 이미 피드백이 존재한다는
   * 뜻이므로 에러로 처리하지 않고 UI 도 완료 상태로 전환한다. 이는 서버가 단일 진실 원본
   * 이며, 다른 세션/기기에서 이미 피드백을 제출한 뒤 현재 탭이 오래된 상태를 보여주던
   * 경우를 방어한다. helpful 방향은 응답에 없지만 클릭한 버튼을 그대로 반영한다 —
   * loadFaqs 가 다음 렌더 시 서버 상태로 정합성을 보정한다.
   * 나머지 에러는 기존대로 재시도 안내.
   */
  const handleFaqFeedback = async (faqId, helpful) => {
    if (!isAuthenticated || feedbackLoadingId) return;
    setFeedbackLoadingId(faqId);
    try {
      await submitFaqFeedback(faqId, helpful);
      setFaqFeedbackMap((prev) => ({ ...prev, [faqId]: helpful ? 'helpful' : 'notHelpful' }));
    } catch (err) {
      if (err?.status === 409) {
        /* 서버에 이미 기록된 피드백 — UI 만 완료 상태로 맞춰 중복 시도를 차단한다 */
        setFaqFeedbackMap((prev) => ({ ...prev, [faqId]: helpful ? 'helpful' : 'notHelpful' }));
      } else {
        /* 실패 시 UI 업데이트 하지 않음 — 사용자가 재시도 가능 */
        setError('피드백 제출에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setFeedbackLoadingId(null);
    }
  };

  /** 도움말 토글 */
  const handleToggleHelp = (articleId) => {
    setOpenHelpId((prev) => (prev === articleId ? null : articleId));
  };

  /** 도움말 카테고리 변경 */
  const handleHelpCategoryChange = (idx) => {
    setHelpCategoryIdx(idx);
    setOpenHelpId(null);
  };

  /** 폼 검증 */
  const validateTicketForm = () => {
    const errors = {};
    if (!ticketCategory) errors.category = '카테고리를 선택해주세요.';
    if (!ticketTitle.trim()) errors.title = '제목을 입력해주세요.';
    else if (ticketTitle.trim().length < 2) errors.title = '제목은 최소 2자 이상이어야 합니다.';
    else if (ticketTitle.trim().length > 100) errors.title = '제목은 100자 이내로 작성해주세요.';
    if (!ticketContent.trim()) errors.content = '내용을 입력해주세요.';
    else if (ticketContent.trim().length < 10) errors.content = '내용은 최소 10자 이상이어야 합니다.';
    else if (ticketContent.trim().length > 2000) errors.content = '내용은 2000자 이내로 작성해주세요.';
    return errors;
  };

  /** 문의하기 폼 제출 */
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setError(null);
    const errors = validateTicketForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmittingTicket(true);
    try {
      await createTicket({
        category: ticketCategory,
        title: ticketTitle.trim(),
        content: ticketContent.trim(),
      });
      setTicketSuccess(true);
      setTicketCategory('');
      setTicketTitle('');
      setTicketContent('');
      setFormErrors({});
    } catch (err) {
      console.warn('티켓 생성 실패:', err.message);
      setError(err.message || '문의 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  /** 티켓 생성 성공 후 폼 초기화 */
  const handleResetTicketForm = () => { setTicketSuccess(false); };

  /* ══════════════════════════════════════════
     메모이제이션
     ══════════════════════════════════════════ */

  /** FAQ 검색 키워드 필터링 */
  const filteredFaqs = useMemo(() => {
    if (!faqSearchKeyword.trim()) return faqs;
    const keyword = faqSearchKeyword.trim().toLowerCase();
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(keyword) ||
        faq.answer.toLowerCase().includes(keyword)
    );
  }, [faqs, faqSearchKeyword]);

  /** 현재 열려 있는 도움말 문서 객체 */
  const openHelpArticle = useMemo(() => {
    if (!openHelpId) return null;
    return helpArticles.find((a) => a.id === openHelpId) || null;
  }, [helpArticles, openHelpId]);

  /* ══════════════════════════════════════════
     렌더링
     ══════════════════════════════════════════ */

  if (authLoading) {
    return <Loading message="로딩 중..." fullPage />;
  }

  return (
    <S.Page>
      <S.Inner>
        {/* 페이지 헤더 */}
        <S.Header>
          <S.Title>고객센터</S.Title>
          <S.Subtitle>
            무엇이든 물어보세요. 몽글픽이 도와드립니다.
          </S.Subtitle>
        </S.Header>

        {/* 글로벌 에러 메시지 */}
        {error && (
          <S.ErrorMsg role="alert">
            {error}
          </S.ErrorMsg>
        )}

        {/* 섹션 탭 네비게이션 */}
        <S.Nav role="tablist" aria-label="고객센터 섹션">
          {SECTION_TABS.map((tab) => {
            if (tab.key === 'history' && !isAuthenticated) return null;
            return (
              <S.NavBtn
                key={tab.key}
                role="tab"
                aria-selected={activeSection === tab.key}
                aria-controls={`support-panel-${tab.key}`}
                $isActive={activeSection === tab.key}
                onClick={() => setActiveSection(tab.key)}
              >
                {tab.label}
              </S.NavBtn>
            );
          })}
        </S.Nav>

        {/* AI 챗봇 탭 */}
        {activeSection === 'chatbot' && (
          <ChatbotTab
            onSwitchToTicket={() => setActiveSection('ticket')}
          />
        )}

        {/* FAQ 탭 */}
        {activeSection === 'faq' && (
          <FaqTab
            faqs={filteredFaqs}
            isLoading={isLoadingFaqs}
            categoryIdx={faqCategoryIdx}
            onCategoryChange={handleFaqCategoryChange}
            searchKeyword={faqSearchKeyword}
            onSearchChange={setFaqSearchKeyword}
            openFaqIds={openFaqIds}
            onToggleFaq={handleToggleFaq}
            feedbackMap={faqFeedbackMap}
            feedbackLoadingId={feedbackLoadingId}
            onFeedback={handleFaqFeedback}
            isAuthenticated={isAuthenticated}
            categoryFilters={CATEGORY_FILTERS}
            categoryLabelMap={CATEGORY_LABEL_MAP}
          />
        )}

        {/* 도움말 탭 */}
        {activeSection === 'help' && (
          <HelpTab
            articles={helpArticles}
            isLoading={isLoadingHelp}
            categoryIdx={helpCategoryIdx}
            onCategoryChange={handleHelpCategoryChange}
            openArticle={openHelpArticle}
            openHelpId={openHelpId}
            onToggleHelp={handleToggleHelp}
            categoryFilters={CATEGORY_FILTERS}
            categoryLabelMap={CATEGORY_LABEL_MAP}
          />
        )}

        {/* 문의하기 / 내 문의 내역 탭 */}
        {(activeSection === 'ticket' || activeSection === 'history') && (
          <TicketTab
            activeSection={activeSection}
            isAuthenticated={isAuthenticated}
            ticketCategory={ticketCategory}
            onCategoryChange={(val) => {
              setTicketCategory(val);
              setFormErrors((prev) => ({ ...prev, category: undefined }));
            }}
            ticketTitle={ticketTitle}
            onTitleChange={(val) => {
              setTicketTitle(val);
              setFormErrors((prev) => ({ ...prev, title: undefined }));
            }}
            ticketContent={ticketContent}
            onContentChange={(val) => {
              setTicketContent(val);
              setFormErrors((prev) => ({ ...prev, content: undefined }));
            }}
            isSubmitting={isSubmittingTicket}
            formErrors={formErrors}
            ticketSuccess={ticketSuccess}
            onSubmit={handleSubmitTicket}
            onResetForm={handleResetTicketForm}
            myTickets={myTickets}
            ticketPage={ticketPage}
            isLoadingTickets={isLoadingTickets}
            onPageChange={setTicketPage}
            ticketCategories={TICKET_CATEGORIES}
            categoryLabelMap={CATEGORY_LABEL_MAP}
            statusLabelMap={STATUS_LABEL_MAP}
            formatDate={formatDate}
          />
        )}
      </S.Inner>
    </S.Page>
  );
}
