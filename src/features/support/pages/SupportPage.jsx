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

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
/* 인증 Context 훅 — app/providers에서 가져옴 */
import { useAuth } from '../../../app/providers/AuthProvider';
/* 고객센터 API — 같은 feature 내의 supportApi에서 가져옴 */
import {
  getFaqs,
  submitFaqFeedback,
  getHelpArticles,
  createTicket,
  getMyTickets,
} from '../api/supportApi';
/* 라우트 경로 상수 — shared/constants에서 가져옴 */
import { ROUTES } from '../../../shared/constants/routes';
/* 로딩 스피너 — shared/components에서 가져옴 */
import Loading from '../../../shared/components/Loading/Loading';
import './SupportPage.css';

/* ══════════════════════════════════════════
   상수 정의
   ══════════════════════════════════════════ */

/** 메인 섹션 탭 목록 */
const SECTION_TABS = [
  { key: 'faq', label: 'FAQ' },
  { key: 'help', label: '도움말' },
  { key: 'ticket', label: '문의하기' },
  { key: 'history', label: '내 문의 내역' },
];

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
  {
    id: 'fallback-1',
    category: 'GENERAL',
    question: '몽글픽은 무료인가요?',
    answer: '기본 기능은 무료이며, 프리미엄 AI 추천은 포인트가 필요합니다. 매일 출석 체크로 포인트를 모을 수 있고, 등급에 따라 무료 추천 횟수가 제공됩니다.',
    helpfulCount: 42,
    notHelpfulCount: 3,
  },
  {
    id: 'fallback-2',
    category: 'RECOMMENDATION',
    question: '추천은 어떻게 작동하나요?',
    answer: 'AI가 대화를 통해 취향을 파악하고, 117만건의 영화 데이터에서 최적의 영화를 찾아드립니다. 벡터 검색, 텍스트 검색, 그래프 검색을 결합한 하이브리드 추천 엔진을 사용합니다.',
    helpfulCount: 38,
    notHelpfulCount: 2,
  },
  {
    id: 'fallback-3',
    category: 'ACCOUNT',
    question: '회원가입은 어떻게 하나요?',
    answer: '이메일 회원가입과 소셜 로그인(카카오, 네이버, 구글)을 지원합니다. 우측 상단의 "회원가입" 버튼을 눌러 간편하게 가입할 수 있습니다.',
    helpfulCount: 25,
    notHelpfulCount: 1,
  },
  {
    id: 'fallback-4',
    category: 'CHAT',
    question: 'AI 채팅에서 이미지도 보낼 수 있나요?',
    answer: '네, 영화 포스터나 장면 이미지를 업로드하면 AI가 분석하여 비슷한 분위기의 영화를 추천해 드립니다. 이미지는 최대 10MB까지 업로드 가능합니다.',
    helpfulCount: 19,
    notHelpfulCount: 0,
  },
  {
    id: 'fallback-5',
    category: 'COMMUNITY',
    question: '커뮤니티 게시글은 어떻게 작성하나요?',
    answer: '로그인 후 커뮤니티 페이지에서 "글쓰기" 버튼을 눌러 게시글을 작성할 수 있습니다. 영화 리뷰, 추천 요청, 자유 토론 등 다양한 카테고리에서 글을 쓸 수 있습니다.',
    helpfulCount: 15,
    notHelpfulCount: 2,
  },
  {
    id: 'fallback-6',
    category: 'PAYMENT',
    question: '포인트는 어떻게 충전하나요?',
    answer: '포인트 페이지에서 충전하기 버튼을 누르면 결제 페이지로 이동합니다. Toss Payments를 통해 안전하게 결제할 수 있으며, 구독 상품을 이용하면 더 저렴하게 포인트를 받을 수 있습니다.',
    helpfulCount: 22,
    notHelpfulCount: 1,
  },
  {
    id: 'fallback-7',
    category: 'RECOMMENDATION',
    question: '추천 결과가 마음에 들지 않으면 어떻게 하나요?',
    answer: 'AI에게 더 구체적인 취향을 알려주세요. "좀 더 가벼운 영화", "반전이 있는 스릴러" 등으로 대화를 이어가면 취향에 맞는 추천을 받을 수 있습니다. 대화가 길어질수록 정확도가 올라갑니다.',
    helpfulCount: 30,
    notHelpfulCount: 4,
  },
  {
    id: 'fallback-8',
    category: 'GENERAL',
    question: '몽글픽에는 어떤 영화 데이터가 있나요?',
    answer: 'TMDB, KOBIS(영화진흥위원회), KMDb(한국영화데이터베이스) 등에서 수집한 약 117만건의 영화 데이터를 보유하고 있습니다. 한국 영화와 해외 영화를 모두 포함합니다.',
    helpfulCount: 17,
    notHelpfulCount: 0,
  },
];

/** API 실패 시 표시할 도움말 플레이스홀더 데이터 */
const FALLBACK_HELP_ARTICLES = [
  {
    id: 'help-1',
    category: 'GENERAL',
    title: '몽글픽 시작하기',
    content: '몽글픽은 AI 기반 영화 추천 서비스입니다.\n\n1. 회원가입 후 로그인합니다.\n2. AI 추천 채팅에서 원하는 영화 분위기를 설명합니다.\n3. AI가 분석하여 최적의 영화를 추천합니다.\n\n기본 기능은 무료이며, 매일 출석 체크를 하면 포인트를 받을 수 있습니다.',
    viewCount: 1250,
  },
  {
    id: 'help-2',
    category: 'CHAT',
    title: 'AI 채팅 사용법',
    content: 'AI 채팅은 자연어로 대화하면서 영화를 추천받는 기능입니다.\n\n- 기분, 상황, 좋아하는 장르 등을 자유롭게 이야기하세요.\n- 이미지를 업로드하면 비슷한 분위기의 영화를 찾아줍니다.\n- 대화를 이어갈수록 더 정확한 추천을 받을 수 있습니다.\n\n추천 1회당 포인트가 차감되며, 등급에 따라 무료 횟수가 주어집니다.',
    viewCount: 980,
  },
  {
    id: 'help-3',
    category: 'ACCOUNT',
    title: '계정 관리 가이드',
    content: '계정 관련 주요 기능 안내입니다.\n\n- 프로필 수정: 마이페이지에서 닉네임과 프로필 사진을 변경할 수 있습니다.\n- 선호 장르 설정: 온보딩 시 설정한 선호 장르를 마이페이지에서 수정할 수 있습니다.\n- 소셜 로그인: 카카오, 네이버, 구글 계정으로 간편 로그인이 가능합니다.',
    viewCount: 560,
  },
  {
    id: 'help-4',
    category: 'PAYMENT',
    title: '포인트 및 결제 안내',
    content: '포인트는 AI 추천, 아이템 교환 등에 사용됩니다.\n\n- 포인트 획득: 출석 체크(10P~60P), 구독 결제, 이벤트 등\n- 포인트 사용: AI 추천(100P), 아이템 교환\n- 결제 수단: Toss Payments (카드, 계좌이체 등)\n- 구독: 월간/연간 구독 상품으로 포인트를 저렴하게 충전할 수 있습니다.',
    viewCount: 430,
  },
  {
    id: 'help-5',
    category: 'COMMUNITY',
    title: '커뮤니티 이용 가이드',
    content: '커뮤니티에서 다른 사용자들과 영화에 대해 이야기할 수 있습니다.\n\n- 게시글 작성: 리뷰, 추천 요청, 자유 토론 등\n- 댓글: 게시글에 댓글을 남길 수 있습니다.\n- 신고: 부적절한 게시글은 신고할 수 있습니다.\n\n건전한 커뮤니티 문화를 위해 이용 규칙을 준수해 주세요.',
    viewCount: 320,
  },
  {
    id: 'help-6',
    category: 'RECOMMENDATION',
    title: '추천 시스템 이해하기',
    content: '몽글픽의 추천 시스템은 여러 기술을 결합하여 최적의 영화를 찾습니다.\n\n- 협업 필터링(CF): 비슷한 취향의 사용자 기반 추천\n- 콘텐츠 기반 필터링(CBF): 영화 특성 분석 기반 추천\n- 하이브리드 검색: 벡터 + 텍스트 + 그래프 검색 결합\n- MMR 다양성: 다양한 장르/분위기를 포함하도록 재정렬\n\n대화를 통해 AI가 취향을 파악할수록 추천 정확도가 향상됩니다.',
    viewCount: 680,
  },
];

/* ══════════════════════════════════════════
   유틸리티 함수
   ══════════════════════════════════════════ */

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

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

export default function SupportPage() {
  /* ── 인증 상태 ── */
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  /* ── 섹션/탭 상태 ── */
  /** 현재 활성 섹션 (faq / help / ticket / history) */
  const [activeSection, setActiveSection] = useState('faq');

  /* ── FAQ 상태 ── */
  /** FAQ 데이터 배열 */
  const [faqs, setFaqs] = useState([]);
  /** 현재 선택된 FAQ 카테고리 인덱스 */
  const [faqCategoryIdx, setFaqCategoryIdx] = useState(0);
  /** FAQ 검색 키워드 (클라이언트 측 필터링) */
  const [faqSearchKeyword, setFaqSearchKeyword] = useState('');
  /** 열린 FAQ 아코디언 ID들 */
  const [openFaqIds, setOpenFaqIds] = useState(new Set());
  /** FAQ 피드백 제출 상태 (faqId → 'helpful' | 'notHelpful') */
  const [faqFeedbackMap, setFaqFeedbackMap] = useState({});
  /** FAQ 피드백 처리 중인 faqId */
  const [feedbackLoadingId, setFeedbackLoadingId] = useState(null);
  /** FAQ 로딩 상태 */
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(true);

  /* ── 도움말 상태 ── */
  /** 도움말 문서 배열 */
  const [helpArticles, setHelpArticles] = useState([]);
  /** 현재 선택된 도움말 카테고리 인덱스 */
  const [helpCategoryIdx, setHelpCategoryIdx] = useState(0);
  /** 열려 있는 도움말 상세 문서 ID */
  const [openHelpId, setOpenHelpId] = useState(null);
  /** 도움말 로딩 상태 */
  const [isLoadingHelp, setIsLoadingHelp] = useState(true);

  /* ── 문의하기 폼 상태 ── */
  /** 선택된 문의 카테고리 */
  const [ticketCategory, setTicketCategory] = useState('');
  /** 문의 제목 */
  const [ticketTitle, setTicketTitle] = useState('');
  /** 문의 내용 */
  const [ticketContent, setTicketContent] = useState('');
  /** 폼 제출 처리 중 */
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  /** 폼 검증 에러 메시지들 */
  const [formErrors, setFormErrors] = useState({});
  /** 티켓 생성 성공 여부 */
  const [ticketSuccess, setTicketSuccess] = useState(false);

  /* ── 내 문의 내역 상태 ── */
  /** 내 티켓 목록 (Spring Page 응답) */
  const [myTickets, setMyTickets] = useState({ content: [], totalPages: 0, totalElements: 0 });
  /** 현재 티켓 목록 페이지 번호 (0-indexed) */
  const [ticketPage, setTicketPage] = useState(0);
  /** 티켓 목록 로딩 상태 */
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  /* ── 글로벌 에러 ── */
  const [error, setError] = useState(null);

  /* ══════════════════════════════════════════
     데이터 로드 함수
     ══════════════════════════════════════════ */

  /**
   * FAQ 목록을 API에서 로드한다.
   * API 실패 시 플레이스홀더 데이터로 대체한다.
   */
  const loadFaqs = useCallback(async () => {
    setIsLoadingFaqs(true);
    try {
      const categoryValue = CATEGORY_FILTERS[faqCategoryIdx]?.value;
      const data = await getFaqs(categoryValue);
      setFaqs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('FAQ 조회 실패, 플레이스홀더 데이터 사용:', err.message);
      /* API 실패 시 카테고리에 맞는 플레이스홀더 표시 */
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

  /**
   * 도움말 문서를 API에서 로드한다.
   * API 실패 시 플레이스홀더 데이터로 대체한다.
   */
  const loadHelpArticles = useCallback(async () => {
    setIsLoadingHelp(true);
    try {
      const categoryValue = CATEGORY_FILTERS[helpCategoryIdx]?.value;
      const data = await getHelpArticles(categoryValue);
      setHelpArticles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('도움말 조회 실패, 플레이스홀더 데이터 사용:', err.message);
      /* API 실패 시 카테고리에 맞는 플레이스홀더 표시 */
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

  /**
   * 내 티켓 목록을 API에서 로드한다.
   * API 실패 시 빈 목록으로 대체한다.
   */
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

  /** FAQ 섹션 진입 시 FAQ 로드 */
  useEffect(() => {
    if (activeSection === 'faq') {
      loadFaqs();
    }
  }, [activeSection, loadFaqs]);

  /** 도움말 섹션 진입 시 도움말 로드 */
  useEffect(() => {
    if (activeSection === 'help') {
      loadHelpArticles();
    }
  }, [activeSection, loadHelpArticles]);

  /** 내 문의 내역 섹션 진입 시 티켓 로드 */
  useEffect(() => {
    if (activeSection === 'history' && isAuthenticated) {
      loadMyTickets();
    }
  }, [activeSection, isAuthenticated, loadMyTickets]);

  /* ══════════════════════════════════════════
     이벤트 핸들러
     ══════════════════════════════════════════ */

  /**
   * FAQ 아코디언 토글 핸들러.
   * 해당 FAQ의 펼침/접힘 상태를 전환한다.
   *
   * @param {string|number} faqId - 토글할 FAQ의 ID
   */
  const handleToggleFaq = (faqId) => {
    setOpenFaqIds((prev) => {
      const next = new Set(prev);
      if (next.has(faqId)) {
        next.delete(faqId);
      } else {
        next.add(faqId);
      }
      return next;
    });
  };

  /**
   * FAQ 피드백 제출 핸들러.
   * 도움됨/안됨 피드백을 API로 전송한다.
   *
   * @param {string|number} faqId - 피드백 대상 FAQ ID
   * @param {boolean} helpful - 도움이 되었는지 여부
   */
  const handleFaqFeedback = async (faqId, helpful) => {
    if (!isAuthenticated || feedbackLoadingId) return;

    setFeedbackLoadingId(faqId);
    try {
      await submitFaqFeedback(faqId, helpful);
      /* 피드백 상태 업데이트 (중복 제출 방지) */
      setFaqFeedbackMap((prev) => ({
        ...prev,
        [faqId]: helpful ? 'helpful' : 'notHelpful',
      }));
    } catch (err) {
      console.warn('FAQ 피드백 제출 실패:', err.message);
      /* 실패 시에도 UI는 정상 표시 — 낙관적 업데이트 */
      setFaqFeedbackMap((prev) => ({
        ...prev,
        [faqId]: helpful ? 'helpful' : 'notHelpful',
      }));
    } finally {
      setFeedbackLoadingId(null);
    }
  };

  /**
   * 도움말 상세 보기 토글 핸들러.
   * 같은 문서 클릭 시 닫히고, 다른 문서 클릭 시 해당 문서가 열린다.
   *
   * @param {string|number} articleId - 열거나 닫을 도움말 문서 ID
   */
  const handleToggleHelp = (articleId) => {
    setOpenHelpId((prev) => (prev === articleId ? null : articleId));
  };

  /**
   * 문의하기 폼 검증 함수.
   * 모든 필드의 유효성을 검사하여 에러 메시지 객체를 반환한다.
   *
   * @returns {Object} 필드별 에러 메시지 (빈 객체면 유효)
   */
  const validateTicketForm = () => {
    const errors = {};

    if (!ticketCategory) {
      errors.category = '카테고리를 선택해주세요.';
    }
    if (!ticketTitle.trim()) {
      errors.title = '제목을 입력해주세요.';
    } else if (ticketTitle.trim().length < 2) {
      errors.title = '제목은 최소 2자 이상이어야 합니다.';
    } else if (ticketTitle.trim().length > 100) {
      errors.title = '제목은 100자 이내로 작성해주세요.';
    }
    if (!ticketContent.trim()) {
      errors.content = '내용을 입력해주세요.';
    } else if (ticketContent.trim().length < 10) {
      errors.content = '내용은 최소 10자 이상이어야 합니다.';
    } else if (ticketContent.trim().length > 2000) {
      errors.content = '내용은 2000자 이내로 작성해주세요.';
    }

    return errors;
  };

  /**
   * 문의하기 폼 제출 핸들러.
   * 검증 후 API를 호출하여 티켓을 생성한다.
   *
   * @param {Event} e - 폼 제출 이벤트
   */
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setError(null);

    /* 폼 검증 */
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

      /* 성공 — 폼 초기화 및 성공 화면 표시 */
      setTicketSuccess(true);
      setTicketCategory('');
      setTicketTitle('');
      setTicketContent('');
      setFormErrors({});
    } catch (err) {
      console.warn('티켓 생성 실패:', err.message);
      setError(err.message || '문의 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
      /* 3초 후 에러 메시지 숨김 */
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  /**
   * 티켓 생성 성공 후 "새 문의하기" 버튼 핸들러.
   * 성공 화면을 닫고 폼으로 돌아간다.
   */
  const handleResetTicketForm = () => {
    setTicketSuccess(false);
  };

  /* ══════════════════════════════════════════
     메모이제이션
     ══════════════════════════════════════════ */

  /**
   * FAQ 검색 키워드로 필터링된 FAQ 목록.
   * 질문과 답변 텍스트 모두에서 키워드를 검색한다.
   */
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

  /* 인증 로딩 중 */
  if (authLoading) {
    return <Loading message="로딩 중..." fullPage />;
  }

  return (
    <div className="support-page">
      <div className="support-page__inner">
        {/* ── 페이지 헤더 ── */}
        <header className="support-page__header">
          <h1 className="support-page__title">고객센터</h1>
          <p className="support-page__subtitle">
            무엇이든 물어보세요. 몽글픽이 도와드립니다.
          </p>
        </header>

        {/* ── 글로벌 에러 메시지 ── */}
        {error && (
          <div className="support-page__error" role="alert">
            {error}
          </div>
        )}

        {/* ── 섹션 탭 네비게이션 ── */}
        <nav className="support-page__nav" role="tablist" aria-label="고객센터 섹션">
          {SECTION_TABS.map((tab) => {
            /* 인증이 필요한 탭은 비인증 시 숨김 (문의 내역) */
            if (tab.key === 'history' && !isAuthenticated) return null;

            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeSection === tab.key}
                aria-controls={`support-panel-${tab.key}`}
                className={[
                  'support-page__nav-btn',
                  activeSection === tab.key ? 'support-page__nav-btn--active' : '',
                ].join(' ')}
                onClick={() => setActiveSection(tab.key)}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* ═══════════════════════════════════════
            섹션 1: FAQ (자주 묻는 질문)
            ═══════════════════════════════════════ */}
        {activeSection === 'faq' && (
          <section
            id="support-panel-faq"
            role="tabpanel"
            aria-labelledby="faq-tab"
            className="support-page__section"
          >
            <h2 className="support-page__section-title">자주 묻는 질문</h2>

            {/* 카테고리 필터 탭 */}
            <div className="support-page__category-tabs" role="group" aria-label="FAQ 카테고리 필터">
              {CATEGORY_FILTERS.map((cat, idx) => (
                <button
                  key={cat.label}
                  className={[
                    'support-page__category-tab',
                    faqCategoryIdx === idx ? 'support-page__category-tab--active' : '',
                  ].join(' ')}
                  onClick={() => {
                    setFaqCategoryIdx(idx);
                    setFaqSearchKeyword('');
                    setOpenFaqIds(new Set());
                  }}
                  aria-pressed={faqCategoryIdx === idx}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* 검색 바 */}
            <div className="support-page__search">
              <span className="support-page__search-icon" aria-hidden="true">
                &#128269;
              </span>
              <input
                type="text"
                className="support-page__search-input"
                placeholder="FAQ 검색..."
                value={faqSearchKeyword}
                onChange={(e) => setFaqSearchKeyword(e.target.value)}
                aria-label="FAQ 검색"
              />
            </div>

            {/* FAQ 목록 */}
            {isLoadingFaqs ? (
              <Loading message="FAQ를 불러오는 중..." />
            ) : filteredFaqs.length === 0 ? (
              <div className="support-page__empty">
                <div className="support-page__empty-icon" aria-hidden="true">?</div>
                <p className="support-page__empty-text">
                  {faqSearchKeyword
                    ? `"${faqSearchKeyword}"에 대한 검색 결과가 없습니다.`
                    : '등록된 FAQ가 없습니다.'}
                </p>
              </div>
            ) : (
              <div className="support-page__faq-list" role="list">
                {filteredFaqs.map((faq) => {
                  const isOpen = openFaqIds.has(faq.id);
                  const feedbackState = faqFeedbackMap[faq.id];

                  return (
                    <div
                      key={faq.id}
                      className="support-page__faq-item"
                      role="listitem"
                    >
                      {/* FAQ 질문 (아코디언 헤더) */}
                      <button
                        className="support-page__faq-question"
                        onClick={() => handleToggleFaq(faq.id)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-answer-${faq.id}`}
                      >
                        <span className="support-page__faq-category-badge">
                          {CATEGORY_LABEL_MAP[faq.category] || faq.category}
                        </span>
                        <span className="support-page__faq-question-text">
                          {faq.question}
                        </span>
                        <span
                          className={[
                            'support-page__faq-toggle',
                            isOpen ? 'support-page__faq-toggle--open' : '',
                          ].join(' ')}
                          aria-hidden="true"
                        >
                          &#9660;
                        </span>
                      </button>

                      {/* FAQ 답변 (아코디언 패널) */}
                      {isOpen && (
                        <div
                          id={`faq-answer-${faq.id}`}
                          className="support-page__faq-answer"
                          role="region"
                          aria-label={`${faq.question} 답변`}
                        >
                          <p className="support-page__faq-answer-text">{faq.answer}</p>

                          {/* 피드백 버튼 (인증 사용자만) */}
                          {isAuthenticated && (
                            <div className="support-page__faq-feedback">
                              <span className="support-page__faq-feedback-label">
                                도움이 되었나요?
                              </span>
                              <button
                                className={[
                                  'support-page__faq-feedback-btn',
                                  feedbackState === 'helpful'
                                    ? 'support-page__faq-feedback-btn--selected'
                                    : '',
                                ].join(' ')}
                                onClick={() => handleFaqFeedback(faq.id, true)}
                                disabled={!!feedbackState || feedbackLoadingId === faq.id}
                                aria-label="도움이 되었습니다"
                              >
                                &#128077; 네
                              </button>
                              <button
                                className={[
                                  'support-page__faq-feedback-btn',
                                  feedbackState === 'notHelpful'
                                    ? 'support-page__faq-feedback-btn--selected'
                                    : '',
                                ].join(' ')}
                                onClick={() => handleFaqFeedback(faq.id, false)}
                                disabled={!!feedbackState || feedbackLoadingId === faq.id}
                                aria-label="도움이 되지 않았습니다"
                              >
                                &#128078; 아니요
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ═══════════════════════════════════════
            섹션 2: 도움말 (Help Articles)
            ═══════════════════════════════════════ */}
        {activeSection === 'help' && (
          <section
            id="support-panel-help"
            role="tabpanel"
            aria-labelledby="help-tab"
            className="support-page__section"
          >
            <h2 className="support-page__section-title">도움말</h2>

            {/* 카테고리 필터 탭 */}
            <div className="support-page__category-tabs" role="group" aria-label="도움말 카테고리 필터">
              {CATEGORY_FILTERS.map((cat, idx) => (
                <button
                  key={cat.label}
                  className={[
                    'support-page__category-tab',
                    helpCategoryIdx === idx ? 'support-page__category-tab--active' : '',
                  ].join(' ')}
                  onClick={() => {
                    setHelpCategoryIdx(idx);
                    setOpenHelpId(null);
                  }}
                  aria-pressed={helpCategoryIdx === idx}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* 도움말 상세 패널 (열려있을 때) */}
            {openHelpArticle && (
              <div className="support-page__help-detail">
                <div className="support-page__help-detail-header">
                  <h3 className="support-page__help-detail-title">
                    {openHelpArticle.title}
                  </h3>
                  <button
                    className="support-page__help-detail-close"
                    onClick={() => setOpenHelpId(null)}
                    aria-label="도움말 상세 닫기"
                  >
                    &#10005;
                  </button>
                </div>
                <div className="support-page__help-detail-content">
                  {openHelpArticle.content}
                </div>
              </div>
            )}

            {/* 도움말 카드 그리드 */}
            {isLoadingHelp ? (
              <Loading message="도움말을 불러오는 중..." />
            ) : helpArticles.length === 0 ? (
              <div className="support-page__empty">
                <div className="support-page__empty-icon" aria-hidden="true">?</div>
                <p className="support-page__empty-text">등록된 도움말이 없습니다.</p>
              </div>
            ) : (
              <div className="support-page__help-grid">
                {helpArticles.map((article) => (
                  <article
                    key={article.id}
                    className="support-page__help-card"
                    onClick={() => handleToggleHelp(article.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggleHelp(article.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={openHelpId === article.id}
                    aria-label={`${article.title} 도움말 열기`}
                  >
                    <span className="support-page__help-card-category">
                      {CATEGORY_LABEL_MAP[article.category] || article.category}
                    </span>
                    <div className="support-page__help-card-header">
                      <h3 className="support-page__help-card-title">{article.title}</h3>
                      <span className="support-page__help-card-views">
                        {article.viewCount?.toLocaleString() || 0}회
                      </span>
                    </div>
                    <p className="support-page__help-card-preview">
                      {article.content}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ═══════════════════════════════════════
            섹션 3: 문의하기 (Submit Ticket)
            ═══════════════════════════════════════ */}
        {activeSection === 'ticket' && (
          <section
            id="support-panel-ticket"
            role="tabpanel"
            aria-labelledby="ticket-tab"
            className="support-page__section"
          >
            <h2 className="support-page__section-title">문의하기</h2>

            {!isAuthenticated ? (
              /* 비인증 사용자 — 로그인 유도 */
              <div className="support-page__login-prompt">
                <p className="support-page__login-prompt-text">
                  로그인 후 이용 가능합니다.
                </p>
                <Link to={ROUTES.LOGIN} className="support-page__login-prompt-link">
                  로그인하기
                </Link>
              </div>
            ) : ticketSuccess ? (
              /* 티켓 생성 성공 화면 */
              <div className="support-page__ticket-success">
                <div className="support-page__ticket-success-icon" aria-hidden="true">
                  &#10003;
                </div>
                <h3 className="support-page__ticket-success-title">
                  문의가 등록되었습니다
                </h3>
                <p className="support-page__ticket-success-text">
                  담당자가 확인 후 빠르게 답변드리겠습니다.
                  <br />
                  "내 문의 내역" 탭에서 처리 상태를 확인할 수 있습니다.
                </p>
                <button
                  className="support-page__ticket-success-btn"
                  onClick={handleResetTicketForm}
                >
                  새 문의하기
                </button>
              </div>
            ) : (
              /* 문의 등록 폼 */
              <form
                className="support-page__ticket-form"
                onSubmit={handleSubmitTicket}
                noValidate
              >
                {/* 카테고리 선택 */}
                <div className="support-page__form-group">
                  <label
                    htmlFor="ticket-category"
                    className="support-page__form-label"
                  >
                    카테고리
                    <span className="support-page__form-required" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="ticket-category"
                    className="support-page__form-select"
                    value={ticketCategory}
                    onChange={(e) => {
                      setTicketCategory(e.target.value);
                      setFormErrors((prev) => ({ ...prev, category: undefined }));
                    }}
                    aria-required="true"
                    aria-invalid={!!formErrors.category}
                    aria-describedby={formErrors.category ? 'ticket-category-error' : undefined}
                  >
                    {TICKET_CATEGORIES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.category && (
                    <p id="ticket-category-error" className="support-page__form-error" role="alert">
                      {formErrors.category}
                    </p>
                  )}
                </div>

                {/* 제목 입력 */}
                <div className="support-page__form-group">
                  <label
                    htmlFor="ticket-title"
                    className="support-page__form-label"
                  >
                    제목
                    <span className="support-page__form-required" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="ticket-title"
                    type="text"
                    className="support-page__form-input"
                    placeholder="문의 제목을 입력하세요"
                    value={ticketTitle}
                    onChange={(e) => {
                      setTicketTitle(e.target.value);
                      setFormErrors((prev) => ({ ...prev, title: undefined }));
                    }}
                    maxLength={100}
                    aria-required="true"
                    aria-invalid={!!formErrors.title}
                    aria-describedby={
                      formErrors.title ? 'ticket-title-error' : 'ticket-title-hint'
                    }
                  />
                  <div className="support-page__form-char-count">
                    <span
                      className={
                        ticketTitle.length > 100
                          ? 'support-page__form-char-count--over'
                          : ''
                      }
                    >
                      {ticketTitle.length}
                    </span>
                    /100
                  </div>
                  {formErrors.title ? (
                    <p id="ticket-title-error" className="support-page__form-error" role="alert">
                      {formErrors.title}
                    </p>
                  ) : (
                    <p id="ticket-title-hint" className="support-page__form-hint">
                      2~100자 이내로 작성해주세요.
                    </p>
                  )}
                </div>

                {/* 내용 입력 */}
                <div className="support-page__form-group">
                  <label
                    htmlFor="ticket-content"
                    className="support-page__form-label"
                  >
                    내용
                    <span className="support-page__form-required" aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="ticket-content"
                    className="support-page__form-textarea"
                    placeholder="문의 내용을 상세히 작성해주세요"
                    value={ticketContent}
                    onChange={(e) => {
                      setTicketContent(e.target.value);
                      setFormErrors((prev) => ({ ...prev, content: undefined }));
                    }}
                    maxLength={2000}
                    aria-required="true"
                    aria-invalid={!!formErrors.content}
                    aria-describedby={
                      formErrors.content ? 'ticket-content-error' : 'ticket-content-hint'
                    }
                  />
                  <div className="support-page__form-char-count">
                    <span
                      className={
                        ticketContent.length > 2000
                          ? 'support-page__form-char-count--over'
                          : ''
                      }
                    >
                      {ticketContent.length}
                    </span>
                    /2,000
                  </div>
                  {formErrors.content ? (
                    <p id="ticket-content-error" className="support-page__form-error" role="alert">
                      {formErrors.content}
                    </p>
                  ) : (
                    <p id="ticket-content-hint" className="support-page__form-hint">
                      10~2,000자 이내로 작성해주세요.
                    </p>
                  )}
                </div>

                {/* 제출 버튼 */}
                <button
                  type="submit"
                  className="support-page__submit-btn"
                  disabled={isSubmittingTicket}
                >
                  {isSubmittingTicket ? '등록 중...' : '문의 등록'}
                </button>
              </form>
            )}
          </section>
        )}

        {/* ═══════════════════════════════════════
            섹션 4: 내 문의 내역
            ═══════════════════════════════════════ */}
        {activeSection === 'history' && isAuthenticated && (
          <section
            id="support-panel-history"
            role="tabpanel"
            aria-labelledby="history-tab"
            className="support-page__section"
          >
            <h2 className="support-page__section-title">
              내 문의 내역
              {myTickets.totalElements > 0 && (
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginLeft: 'var(--space-sm)' }}>
                  ({myTickets.totalElements}건)
                </span>
              )}
            </h2>

            {isLoadingTickets ? (
              <Loading message="문의 내역을 불러오는 중..." />
            ) : myTickets.content.length === 0 ? (
              <div className="support-page__empty">
                <div className="support-page__empty-icon" aria-hidden="true">?</div>
                <p className="support-page__empty-text">문의 내역이 없습니다.</p>
              </div>
            ) : (
              <>
                {/* 티켓 목록 */}
                <div className="support-page__ticket-list" role="list">
                  {myTickets.content.map((ticket) => (
                    <div
                      key={ticket.ticketId}
                      className="support-page__ticket-item"
                      role="listitem"
                    >
                      <div className="support-page__ticket-info">
                        <p className="support-page__ticket-title">{ticket.title}</p>
                        <div className="support-page__ticket-meta">
                          <span className="support-page__ticket-category-badge">
                            {CATEGORY_LABEL_MAP[ticket.category] || ticket.category}
                          </span>
                          <span className="support-page__ticket-date">
                            {formatDate(ticket.createdAt)}
                          </span>
                        </div>
                      </div>
                      <span
                        className={[
                          'support-page__ticket-status',
                          `support-page__ticket-status--${ticket.status}`,
                        ].join(' ')}
                      >
                        {STATUS_LABEL_MAP[ticket.status] || ticket.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 페이지네이션 */}
                {myTickets.totalPages > 1 && (
                  <div className="support-page__pagination">
                    <button
                      className="support-page__pagination-btn"
                      onClick={() => setTicketPage((prev) => Math.max(0, prev - 1))}
                      disabled={ticketPage === 0}
                    >
                      이전
                    </button>
                    <span className="support-page__pagination-info">
                      {ticketPage + 1} / {myTickets.totalPages}
                    </span>
                    <button
                      className="support-page__pagination-btn"
                      onClick={() =>
                        setTicketPage((prev) =>
                          Math.min(myTickets.totalPages - 1, prev + 1)
                        )
                      }
                      disabled={ticketPage >= myTickets.totalPages - 1}
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
