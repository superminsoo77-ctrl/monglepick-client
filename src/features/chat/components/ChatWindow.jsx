/**
 * 채팅 윈도우 메인 컴포넌트.
 *
 * 전체 채팅 UI를 구성한다:
 * - 헤더: 앱 제목 + 대화 초기화 버튼
 * - 포인트 정보 바: 잔액 + 사용량 표시
 * - 메시지 영역: 사용자/봇 메시지 + 영화 카드 + 상태 표시
 * - 입력 영역: 텍스트 입력 + 글자수 카운터 + 전송 버튼
 * - 쿼터 에러 배너: 포인트 부족/글자수 초과/한도 초과 안내
 *
 * SSE 스트리밍으로 실시간 응답을 표시하며,
 * 처리 상태(status)를 타이핑 인디케이터로 보여준다.
 */

import { useState, useRef, useEffect } from 'react';
/* react-router-dom — 뒤로가기 네비게이션 + URL 세션 ID 관리 */
import { useNavigate, useParams } from 'react-router-dom';
/* 커스텀 모달 훅 — window.confirm/alert 대체 */
import { useModal } from '../../../shared/components/Modal';
/* 인증 Context 훅 — app/providers에서 가져옴 (userId 전달용) */
import useAuthStore from '../../../shared/stores/useAuthStore';
/* 라우트 상수 — 유저 프로필 버튼 이동 경로용 */
import { ROUTES } from '../../../shared/constants/routes';
/* 채팅 상태 관리 훅 — 같은 feature 내의 hooks에서 가져옴 */
import { useChat } from '../hooks/useChat';
/* 채팅 이력 관리 훅 — 사이드바 세션 목록 */
import { useSessionHistory } from '../hooks/useSessionHistory';
/* 외부 지도 연동 — navigator.geolocation 권한/좌표 (Phase 6, 2026-04-23) */
import { useGeolocation } from '../hooks/useGeolocation';
/* 채팅 환영 화면 추천 칩 — DB 동적 풀 + 클릭 트래킹 (2026-04-23) */
import useChatSuggestions from '../hooks/useChatSuggestions';
import MovieCard from './MovieCard';
/* 외부 지도 카드/패널 — theater_card / now_showing SSE 이벤트 렌더 */
import TheaterCard from './TheaterCard';
import NowShowingPanel from './NowShowingPanel';
/* 후속 질문 + AI 생성 제안 카드 (Claude Code 스타일, 2026-04-15 신설) */
import ClarificationOptions from './ClarificationOptions';
/* 몽글이 캐릭터 애니메이션 컴포넌트 */
import MonggleCharacter from '../../../shared/components/MonggleCharacter/MonggleCharacter';
/* 채팅 이력 사이드바 */
import SessionSidebar from './SessionSidebar';
/* 게스트 평생 1회 쿼터 소진 시 노출되는 로그인 유도 모달 (2026-04-22 신규) */
import LoginRequiredModal from '../../auth/components/LoginRequiredModal';
import * as S from './ChatWindow.styled';

/** 이미지 최대 크기 (10MB) */
const IMAGE_MAX_SIZE_MB = 10;
/** 허용 이미지 MIME 타입 */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
/** 기본 최대 입력 글자수 (NORMAL 등급 '알갱이' 기본값 200자, 서버 쿼터 정보 수신 전 사용) */
const DEFAULT_MAX_INPUT_LENGTH = 200;

/**
 * 메시지에 영화관/예매 의도 키워드가 포함됐는지 휴리스틱 감지.
 * theater/booking 의도일 가능성이 높을 때만 좌표 권한을 요청해 사용자 마찰을 줄인다.
 * 추천(recommend) 의도까지 매번 위치를 묻지 않도록 보수적으로 매칭하되,
 * "근처/주변/가까운" 처럼 위치 기반 탐색을 암시하는 표현도 포함해 권한 유도 확률을 높인다.
 */
const THEATER_INTENT_RE = /(영화관|상영관|극장|cgv|롯데시네마|메가박스|예매|근처|주변|가까운|가까이)/i;
function detectsTheaterIntent(text) {
  if (!text) return false;
  return THEATER_INTENT_RE.test(text);
}

export default function ChatWindow() {
  /* 뒤로가기 네비게이션 + URL 세션 ID */
  const navigate = useNavigate();
  const { sessionId: urlSessionId } = useParams();
  /* 커스텀 모달 — window.confirm/alert 대체 */
  const { showAlert, showConfirm } = useModal();

  // 인증 상태에서 사용자 ID를 가져와 포인트 시스템 연동에 사용
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  // 채팅 상태 훅 — userId를 전달하여 포인트 차감/쿼터 검증이 동작하도록 한다
  const {
    messages,
    status,
    isLoading,
    error,
    clarification,
    pointInfo,
    quotaError,
    guestQuotaExceeded,
    sendMessage,
    clearMessages,
    cancelRequest,
    dismissQuotaError,
    dismissGuestQuotaModal,
    loadExistingSession,
    currentSessionId,
  } = useChat({ userId: user?.id || '' });

  // 외부 지도 연동 — 위치 권한/좌표 (theater/booking 의도용, 2026-04-23)
  // 좌표는 sendMessage 호출 단위에서만 사용되고 영구 저장하지 않는다.
  const geo = useGeolocation();

  // 채팅 환영 화면 추천 칩 — DB 동적 풀 + 클릭 트래킹 (2026-04-23)
  // 칩 클릭 시 sendMessage 로 바로 전송. isLoading 중에는 전송 억제.
  const { suggestions: welcomeSuggestions, handleSelect: handleSuggestionSelect } =
    useChatSuggestions({
      onSelect: (text) => {
        if (!isLoading) sendMessage(text);
      },
    });

  // 채팅 이력 훅 — 사이드바 세션 목록 관리
  const {
    sessions,
    isLoading: isHistoryLoading,
    hasMore,
    loadError: historyLoadError,
    loadSessions,
    loadMoreSessions,
    loadSessionMessages,
    removeSession,
    addSessionToTop,
  } = useSessionHistory();

  // 사이드바 열림 상태
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // 입력 필드 상태
  const [inputText, setInputText] = useState('');
  // 첨부 이미지 상태 (미리보기 URL + base64 데이터)
  const [attachedImage, setAttachedImage] = useState(null);
  // 이미지 드래그 오버 상태
  const [isDragging, setIsDragging] = useState(false);
  // 메시지 영역 스크롤 ref
  const messagesEndRef = useRef(null);
  // 입력 필드 ref (포커스 관리용)
  const inputRef = useRef(null);
  // 숨겨진 파일 입력 ref
  const fileInputRef = useRef(null);
  // 이전 isLoading 상태 추적 — 채팅 완료(true→false) 시 사이드바 자동 업데이트용
  const wasLoadingRef = useRef(false);

  /**
   * 사이드바 열 때 세션 목록 로드 (인증된 사용자만).
   */
  const handleOpenSidebar = async () => {
    setIsSidebarOpen(true);
    if (isAuthenticated) {
      await loadSessions(true);
    }
  };

  /**
   * 사이드바에서 세션 선택 시: 메시지 로드 + URL 업데이트.
   */
  const handleSelectSession = async (session) => {
    try {
      const detail = await loadSessionMessages(session.sessionId);
      loadExistingSession(detail.sessionId, detail.messages);
      navigate(`/chat/${detail.sessionId}`, { replace: true });
    } catch {
      showAlert({
        title: '로드 실패',
        message: '대화를 불러올 수 없습니다.',
        type: 'warning',
      });
    }
  };

  /**
   * 사이드바에서 세션 삭제.
   */
  const handleDeleteSession = async (sessionId) => {
    const confirmed = await showConfirm({
      title: '대화 삭제',
      message: '이 대화를 삭제할까요?',
      type: 'confirm',
      confirmLabel: '삭제',
      cancelLabel: '취소',
    });
    if (!confirmed) return;

    try {
      await removeSession(sessionId);
      // 현재 보고 있는 세션을 삭제한 경우 초기화
      if (currentSessionId === sessionId) {
        clearMessages();
        navigate('/chat', { replace: true });
      }
    } catch {
      showAlert({
        title: '삭제 실패',
        message: '대화 삭제에 실패했습니다.',
        type: 'warning',
      });
    }
  };

  /**
   * URL의 sessionId가 변경되면 해당 세션을 로드한다 (브라우저 뒤로가기/직접 접근).
   *
   * 2026-04-14 수정:
   *   1) deps 에 `isAuthenticated` 추가 — Zustand persist 하이드레이션이 렌더 이후에 완료되어
   *      첫 실행 시 false 로 평가된 뒤 true 로 바뀌어도 재실행되지 않던 레이스 해소.
   *   2) 실패 시 `/chat` 강제 리다이렉트 제거 — 백엔드 영속화 지연(방금 만든 세션이 아직 DB 에
   *      플러시되지 않음)이나 일시적 네트워크 오류로 메시지 전체가 사라지던 문제 방지.
   *      URL 은 유지하고 조용히 실패 — 다음 메시지 전송 시 동일 sessionId 로 이어진다.
   */
  useEffect(() => {
    if (urlSessionId && urlSessionId !== currentSessionId && isAuthenticated) {
      loadSessionMessages(urlSessionId)
        .then((detail) => {
          loadExistingSession(detail.sessionId, detail.messages);
        })
        .catch(() => {
          /* 복원 실패해도 URL 은 유지한다. 다음 sendMessage 호출 시
             sessionIdRef 가 비어있으면 서버가 새 세션을 발급하지만,
             URL 에 기존 id 가 남아있으면 onSession 콜백이 다시 동기화한다. */
        });
    }
  }, [urlSessionId, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * 새 메시지가 추가되면 자동 스크롤.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  /**
   * 채팅 완료(isLoading true→false) 시 사이드바에 현재 세션을 즉시 추가한다.
   * 사이드바를 닫고 다시 열지 않아도 방금 나눈 대화가 목록에 바로 보인다.
   */
  useEffect(() => {
    if (wasLoadingRef.current && !isLoading && currentSessionId && isAuthenticated) {
      const userMsgs = messages.filter((m) => m.role === 'user');
      addSessionToTop({
        sessionId: currentSessionId,
        title: userMsgs[0]?.content?.slice(0, 50) || '새 대화',
        turnCount: userMsgs.length,
        lastMessageAt: new Date().toISOString(),
      });
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * 메시지 전송 핸들러.
   * Enter 키 또는 전송 버튼 클릭 시 호출.
   * 첨부 이미지가 있으면 base64로 함께 전송.
   *
   * 외부 지도 연동 (2026-04-23):
   * - 메시지에 영화관/예매 키워드가 보이고 좌표가 아직 없으면 navigator.geolocation 권한을 요청.
   * - 사용자가 거부/타임아웃하더라도 메시지는 그대로 전송 (Agent 가 메시지에서 지명 추출 fallback).
   * - 좌표는 sendMessage 호출 단위에서만 body 에 첨부되고 영구 저장 X.
   */
  const handleSend = async () => {
    const hasText = inputText.trim();
    const hasImage = attachedImage !== null;
    if ((!hasText && !hasImage) || isLoading) return;

    const text = inputText.trim();

    // theater/booking 의도가 의심되고 좌표를 아직 못 받았으면 권한 요청.
    // 권한 거부/실패는 무시 — Agent 의 지명 추출 fallback 이 받아준다.
    let location = geo.coords;
    if (!location && detectsTheaterIntent(text)) {
      const requested = await geo.request();
      if (requested) {
        location = requested;
      }
    }

    sendMessage(text, attachedImage?.base64 || null, location || null);
    setInputText('');
    setAttachedImage(null);
    // 전송 후 입력 필드에 포커스 유지
    inputRef.current?.focus();
  };

  /**
   * 키보드 이벤트 핸들러.
   * Enter: 전송 / Shift+Enter: 줄바꿈
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * textarea 높이 자동 조절.
   * 입력 내용에 따라 높이가 늘어나고, 최대 높이를 초과하면 스크롤.
   */
  const handleInput = (e) => {
    setInputText(e.target.value);
    // textarea 높이 리셋 후 scrollHeight에 맞춤
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  /**
   * 이미지 파일을 검증하고 base64로 변환하여 미리보기 상태에 저장한다.
   * handleImageSelect, handleDrop, handlePaste에서 공통 호출.
   *
   * @param {File} file - 이미지 파일 객체
   */
  const processImageFile = (file) => {
    if (!file) return;

    // MIME 타입 검증
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showAlert({
        title: '지원하지 않는 형식',
        message: 'JPG, PNG, GIF, WebP 이미지만 업로드할 수 있습니다.',
        type: 'warning',
      });
      return;
    }

    // 파일 크기 검증 (10MB 제한)
    if (file.size > IMAGE_MAX_SIZE_MB * 1024 * 1024) {
      showAlert({
        title: '파일 크기 초과',
        message: `이미지 크기는 ${IMAGE_MAX_SIZE_MB}MB 이하여야 합니다.`,
        type: 'warning',
      });
      return;
    }

    // FileReader로 base64 변환
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result; // data:image/xxx;base64,...
      setAttachedImage({
        preview: base64,   // 미리보기 URL (data URI)
        base64: base64,    // API 전송용 base64 문자열
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  /**
   * 이미지 파일 선택 핸들러 (파일 input에서 호출).
   */
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    processImageFile(file);
    // 같은 파일 재선택 허용을 위해 input value 초기화
    e.target.value = '';
  };

  /**
   * 드래그 오버 핸들러.
   * Files 타입 데이터가 있을 때만 드래그 상태를 활성화한다.
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    // dataTransfer에 Files 타입이 있는 경우에만 드래그 UI 표시
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  /**
   * 드래그 떠남 핸들러.
   * 자식 요소로의 이동은 무시하여 깜빡임을 방지한다.
   */
  const handleDragLeave = (e) => {
    // 현재 요소의 자식으로 이동한 경우 무시 (깜빡임 방지)
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  /**
   * 드롭 핸들러.
   * 드롭된 파일 중 첫 번째 이미지를 처리한다.
   */
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  /**
   * 클립보드 붙여넣기 핸들러.
   * 클립보드에 이미지가 있으면 첨부하고, 텍스트는 기본 동작으로 처리한다.
   */
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // 클립보드 항목 중 이미지 탐색
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault(); // 이미지일 때만 기본 붙여넣기 방지
        const file = item.getAsFile();
        if (file) {
          processImageFile(file);
        }
        return;
      }
    }
    // 이미지가 아니면 기본 동작 (텍스트 붙여넣기) 유지
  };

  /**
   * 첨부 이미지 제거 핸들러.
   */
  const handleRemoveImage = () => {
    setAttachedImage(null);
  };

  // 글자수 카운터에 사용할 최대 글자수 (쿼터 에러 응답 기준 또는 기본값)
  const maxInputLength = quotaError?.max_input_length ?? DEFAULT_MAX_INPUT_LENGTH;
  // 글자수 비율 (0.0 ~ 1.0+) — CharCount $ratio prop 전달용
  const charRatio = inputText.length / maxInputLength;

  // 2026-04-24: 빈 상태(메시지 0건)일 때는 입력창을 하단 고정 대신 ChatWelcome 내부
  // (칩 바로 아래) 에 임베드해 "첫 질문 시작"의 시각적 초점을 중앙으로 모은다.
  // 메시지가 한 건이라도 생기면 하단 고정 모드로 복귀.
  const isEmpty = messages.length === 0;

  /**
   * 입력 영역 JSX — 빈 상태일 때 ChatWelcome 내부에, 아닐 때 하단 고정 영역에 재사용.
   * DOM 위치가 바뀌어도 inputText/attachedImage 는 상위 state 이므로 값 유지.
   * ref(inputRef/fileInputRef) 는 mount 시점의 textarea 에 자동 재할당된다.
   * $variant='embedded' 일 때 ChatInputWrapper 의 border-top 을 제거하고 카드 형태로 전환.
   */
  const inputSection = (
    <S.ChatInputWrapper $variant={isEmpty ? 'embedded' : 'bottom'}>
      {/* 이미지 미리보기 (첨부된 이미지가 있을 때) */}
      {attachedImage && (
        <S.ImagePreviewWrapper>
          <S.ImagePreviewImg
            src={attachedImage.preview}
            alt="첨부 이미지 미리보기"
          />
          <S.ImagePreviewRemoveBtn onClick={handleRemoveImage} title="이미지 제거">
            ✕
          </S.ImagePreviewRemoveBtn>
        </S.ImagePreviewWrapper>
      )}
      <S.InputContainer>
        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
        {/* 이미지 첨부 버튼 */}
        <S.InputBtn
          $variant="attach"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          title="이미지 첨부"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </S.InputBtn>
        {/* textarea 래퍼 (글자수 카운터를 우하단에 배치하기 위한 relative 컨테이너) */}
        <S.TextareaWrapper>
          <S.Textarea
            ref={inputRef}
            value={inputText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="영화에 대해 물어보세요..."
            rows={1}
            disabled={isLoading}
          />
          {/* 글자수 카운터 (입력 중일 때 표시, 비율에 따라 색상 변경) */}
          {inputText.length > 0 && (
            <S.CharCount $ratio={charRatio}>
              {inputText.length}/{maxInputLength}
            </S.CharCount>
          )}
        </S.TextareaWrapper>
        {isLoading ? (
          <S.InputBtn $variant="cancel" onClick={cancelRequest} title="요청 취소">
            ■
          </S.InputBtn>
        ) : (
          <S.InputBtn
            $variant="send"
            onClick={handleSend}
            disabled={
              (!inputText.trim() && !attachedImage) ||
              inputText.length > maxInputLength
            }
            title="전송"
          >
            ↑
          </S.InputBtn>
        )}
      </S.InputContainer>
    </S.ChatInputWrapper>
  );

  return (
    <S.ChatWindowWrapper
      $isDragging={isDragging}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ── 사이드바 (이전 대화 목록) ── */}
      <SessionSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onNewChat={() => {
          clearMessages();
          setInputText('');
          setAttachedImage(null);
          navigate('/chat', { replace: true });
          inputRef.current?.focus();
        }}
        isLoading={isHistoryLoading}
        hasMore={hasMore}
        onLoadMore={loadMoreSessions}
        loadError={historyLoadError}
        onRetry={() => loadSessions(true)}
      />

      {/* ── Floating 액션 (2026-04-23 도구바 최종 제거) ──
          기존 <S.ChatHeader> 풀 너비 도구바가 상단 MainLayout Header 와 이중 바를 만들어 UX 저해.
          → ChatHeader 전체 제거. 필요한 두 기능만 메시지 영역의 좌/우 상단 모서리에
          floating 으로 띄운다. 프로필 버튼은 상단 MainLayout Header 좌측에서 이미 제공. */}

      {/* 좌상단: 이전 대화 목록 토글 (인증 유저만) */}
      {isAuthenticated && (
        <S.ChatFloatingHamburger
          type="button"
          onClick={handleOpenSidebar}
          title="이전 대화 목록"
          aria-label="이전 대화 목록 열기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </S.ChatFloatingHamburger>
      )}

      {/*
        2026-04-23: 우상단 "+ 새 대화" 버튼 제거.
        대안 진입점:
          - 좌상단 햄버거로 열리는 이전 대화 사이드바 내부의 "새 대화" 진입
          - URL `/chat` 직접 이동 또는 상단 로고 → /home → 다시 채팅 진입
        showConfirm/clearMessages 등의 유틸 핸들러는 사이드바 측에서 그대로 재사용.
      */}

      {/* ── 포인트/쿼터 정보 바 (추천 완료 후 point_update 수신 시 표시) ──
           2026-04-15 확장: source(GRADE_FREE/SUB_BONUS/PURCHASED/BLOCKED)별로
           "오늘 N/M회" · 구독 보너스 잔여 · 이용권 잔여를 동시에 노출.
           balance === -1 은 "미조회 상태" 약속값이라 그대로 표시하지 않는다. */}
      {pointInfo && (
        <S.ChatPointBar>
          {/* 1) 잔액 — -1(미조회) 은 숨기고 0 이상만 노출 */}
          {typeof pointInfo.balance === 'number' && pointInfo.balance >= 0 && (
            <>
              <S.PointBalance>
                <S.PointIcon>&#x1F48E;</S.PointIcon>
                {pointInfo.balance.toLocaleString()}P
              </S.PointBalance>
              <S.PointDivider>|</S.PointDivider>
            </>
          )}

          {/* 2) 소스별 사용 현황 */}
          <S.PointUsage>
            {pointInfo.source === 'GRADE_FREE' && pointInfo.dailyLimit != null
              ? (pointInfo.dailyLimit === -1
                  ? `오늘 ${pointInfo.dailyUsed ?? 0}회 사용 (무제한)`
                  : `오늘 무료 ${pointInfo.dailyUsed ?? 0}/${pointInfo.dailyLimit}회`)
              : pointInfo.source === 'SUB_BONUS'
                ? `구독 보너스 잔여 ${pointInfo.subBonusRemaining}회`
                : pointInfo.source === 'PURCHASED'
                  ? `이용권 잔여 ${pointInfo.purchasedRemaining}회`
                  : pointInfo.deducted > 0
                    ? `오늘 ${pointInfo.deducted.toLocaleString()}P 사용`
                    : '오늘 사용 없음'}
          </S.PointUsage>

          {/* 3) 소스 배지 */}
          {pointInfo.source === 'GRADE_FREE' && (
            <S.FreeBadge>무료 이용</S.FreeBadge>
          )}
          {pointInfo.source === 'SUB_BONUS' && (
            <S.FreeBadge>구독 보너스</S.FreeBadge>
          )}
          {pointInfo.source === 'PURCHASED' && (
            <S.FreeBadge>이용권</S.FreeBadge>
          )}
        </S.ChatPointBar>
      )}

      {/* ── 쿼터/포인트 에러 배너 (에러 코드별 안내) ── */}
      {quotaError && (
        <S.ChatQuotaError>
          {/* 닫기 버튼 */}
          <S.QuotaErrorClose onClick={dismissQuotaError} title="닫기">
            &#x2715;
          </S.QuotaErrorClose>

          {/* INSUFFICIENT_POINT: 포인트 부족 OR 포인트 서비스 일시 오류
              2026-04-15: balance === -1 은 Agent 의 "Backend 포인트 서비스 연결 실패"
              폴백 약속값. 이전에는 "잔액 -1P / 필요 0P" 처럼 노출되어 사용자에게 오해를
              주었으므로, -1 감지 시 "포인트 시스템 일시 오류" 로 분기한다. */}
          {quotaError.error_code === 'INSUFFICIENT_POINT' && (
            <S.QuotaErrorContent>
              {quotaError.balance === -1 ? (
                <>
                  <S.QuotaErrorTitle>포인트 서비스 일시 오류</S.QuotaErrorTitle>
                  <S.QuotaErrorDesc>
                    잠시 후 다시 시도해주세요. 문제가 지속되면 고객센터로 문의해주세요.
                  </S.QuotaErrorDesc>
                </>
              ) : (
                <>
                  <S.QuotaErrorTitle>포인트가 부족합니다</S.QuotaErrorTitle>
                  <S.QuotaErrorDesc>
                    현재 잔액: {quotaError.balance?.toLocaleString() ?? 0}P / 필요: {quotaError.cost?.toLocaleString() ?? 0}P
                  </S.QuotaErrorDesc>
                  <S.QuotaErrorLink href="/account/point">
                    포인트 충전하기 &rarr;
                  </S.QuotaErrorLink>
                </>
              )}
            </S.QuotaErrorContent>
          )}

          {/* INPUT_TOO_LONG: 입력 글자수 초과 */}
          {quotaError.error_code === 'INPUT_TOO_LONG' && (
            <S.QuotaErrorContent>
              <S.QuotaErrorTitle>입력 글자수를 초과했습니다</S.QuotaErrorTitle>
              <S.QuotaErrorDesc>
                최대 {quotaError.max_input_length?.toLocaleString() ?? DEFAULT_MAX_INPUT_LENGTH}자까지 입력 가능합니다.
                (현재 {quotaError.current_length?.toLocaleString() ?? '?'}자)
              </S.QuotaErrorDesc>
            </S.QuotaErrorContent>
          )}

          {/* QUOTA_EXCEEDED: 일일/월간 이용 한도 초과 */}
          {quotaError.error_code === 'QUOTA_EXCEEDED' && (
            <S.QuotaErrorContent>
              <S.QuotaErrorTitle>이용 한도를 초과했습니다</S.QuotaErrorTitle>
              <S.QuotaErrorDesc>
                {quotaError.daily_limit != null && (
                  <>일일: {quotaError.daily_used ?? 0}/{quotaError.daily_limit}회</>
                )}
                {quotaError.daily_limit != null && quotaError.monthly_limit != null && ' · '}
                {quotaError.monthly_limit != null && (
                  <>월간: {quotaError.monthly_used ?? 0}/{quotaError.monthly_limit}회</>
                )}
              </S.QuotaErrorDesc>
              <S.QuotaErrorLink href="/account/point">
                등급 업그레이드 알아보기 &rarr;
              </S.QuotaErrorLink>
            </S.QuotaErrorContent>
          )}
        </S.ChatQuotaError>
      )}

      {/* ── 메시지 영역 ── */}
      <S.ChatMessages>
        {/* 초기 안내 메시지 (메시지가 없을 때) */}
        {messages.length === 0 && (
          <S.ChatWelcome>
            {/*
              환영 화면 몽글이: waving 애니메이션으로 인사.
              lg 크기(96px)로 중앙에 크게 표시한다.
            */}
            <MonggleCharacter animation="waving" size="lg" />
            <S.WelcomeTitle>안녕하세요! 몽글픽이에요</S.WelcomeTitle>
            <S.WelcomeDesc>
              어떤 영화를 찾고 계신가요? 기분, 장르, 좋아하는 영화 등
              무엇이든 말씀해 주세요!
            </S.WelcomeDesc>
            <S.WelcomeSuggestions>
              {/* 추천 질문 버튼 — DB 동적 풀 (fallback 4개로 즉시 렌더, fetch 후 자연 교체) */}
              {welcomeSuggestions.map((s) => (
                <S.WelcomeSuggestionBtn
                  key={s.id ?? s.text}
                  onClick={() => handleSuggestionSelect(s)}
                >
                  {s.text}
                </S.WelcomeSuggestionBtn>
              ))}
            </S.WelcomeSuggestions>
            {/* 2026-04-24: 빈 상태에서는 입력창을 칩 바로 아래에 임베드.
                ChatGPT/Claude 스타일로 "첫 질문 시작"의 시각적 초점을 중앙에 모은다. */}
            {inputSection}
          </S.ChatWelcome>
        )}

        {/* 메시지 목록 */}
        {messages.map((msg) => {
          // 사용자 메시지 (이미지 포함 가능)
          if (msg.role === 'user') {
            return (
              <S.ChatMsg key={msg.timestamp} $isUser>
                <S.MsgBubble $variant="user">
                  {/* 첨부 이미지 표시 */}
                  {msg.image && (
                    <S.MsgImage src={msg.image} alt="첨부 이미지" />
                  )}
                  {msg.content && <span>{msg.content}</span>}
                </S.MsgBubble>
              </S.ChatMsg>
            );
          }

          // 봇 텍스트 응답 (취소됨 표시 포함)
          if (msg.role === 'bot') {
            return (
              <S.ChatMsg key={`bot-${msg.timestamp}`}>
                {/*
                  봇 메시지 아바타: 현재 스트리밍 중인 마지막 메시지인지 확인.
                  - 마지막 봇 메시지이고 isLoading 중이면 → talking (입 오물오물)
                  - 완료된 메시지이면 → idle (둥실둥실)
                  - 취소된 메시지이면 → idle
                */}
                <S.MonggleAvatarWrapper>
                  <MonggleCharacter
                    animation={
                      !msg.cancelled &&
                      isLoading &&
                      messages[messages.length - 1]?.timestamp === msg.timestamp
                        ? 'talking'
                        : 'idle'
                    }
                    size="sm"
                  />
                </S.MonggleAvatarWrapper>
                <S.MsgBubble $variant="bot" $cancelled={msg.cancelled}>
                  {msg.content}
                </S.MsgBubble>
              </S.ChatMsg>
            );
          }

          // 영화 카드 목록
          if (msg.role === 'movie_cards') {
            return (
              <S.ChatMsg key={`bot-${msg.timestamp}`}>
                {/*
                  영화 카드 아바타: 항상 celebrating (추천 결과 등장 시 기뻐하기).
                  단, 이후에 더 많은 처리가 남아 있으면(isLoading) thinking으로 전환.
                */}
                <S.MonggleAvatarWrapper>
                  <MonggleCharacter
                    animation={isLoading ? 'thinking' : 'celebrating'}
                    size="sm"
                  />
                </S.MonggleAvatarWrapper>
                <S.ChatMovieCards>
                  {msg.movies.map((movie, mIdx) => (
                    <MovieCard
                      key={movie.id || mIdx}
                      movie={movie}
                      /* 리뷰 작성 시 reviewSource 로 기록되는 현재 세션 ID. 신규 세션이면 빈 문자열 → 'chat' fallback */
                      sessionId={currentSessionId}
                      /* "근처 영화관" 클릭 시 입력창에 자동 채움 + 포커스. NowShowingPanel 과 동일 패턴 — 자동 전송 X. */
                      onFindNearbyTheater={(text) => {
                        setInputText(text);
                        inputRef.current?.focus();
                      }}
                      /* SSE 도중 취소된 부분 데이터는 dimmed 시각화 (활성 결과와 혼동 방지) */
                      cancelled={msg.cancelled === true}
                    />
                  ))}
                </S.ChatMovieCards>
              </S.ChatMsg>
            );
          }

          // 외부 지도 결과 (영화관 + 박스오피스, 2026-04-23 외부 지도 연동)
          if (msg.role === 'external_map') {
            const hasTheaters = msg.theaters && msg.theaters.length > 0;
            const hasNowShowing = msg.nowShowing && msg.nowShowing.length > 0;
            return (
              <S.ChatMsg key={`map-${msg.timestamp}`}>
                <S.MonggleAvatarWrapper>
                  <MonggleCharacter
                    animation={isLoading ? 'thinking' : 'celebrating'}
                    size="sm"
                  />
                </S.MonggleAvatarWrapper>
                {/* ChatMovieCards 와 동일한 가로 스크롤 컨테이너 재사용 — 카드 세로 정렬 + 모바일 가로 스와이프 */}
                <S.ChatMovieCards>
                  {hasTheaters && msg.theaters.map((t, tIdx) => (
                    <TheaterCard
                      key={t.theater_id || `t-${tIdx}`}
                      theater={t}
                      userLocation={msg.userLocation}
                      /* SSE 도중 취소된 부분 데이터는 dimmed 시각화 (MovieCard 와 동일 패턴) */
                      cancelled={msg.cancelled === true}
                      /* 영화관이 1개뿐이면 미니맵 자동 펼침 — 사용자가 추가 클릭 없이 위치 즉시 확인 */
                      defaultOpen={msg.theaters.length === 1}
                    />
                  ))}
                  {hasNowShowing && (
                    <NowShowingPanel
                      movies={msg.nowShowing}
                      onPickMovie={(text) => {
                        // 박스오피스 영화명 클릭 → 입력창에 자동 채움 + 포커스 (사용자가 보낼지 결정).
                        setInputText(text);
                        inputRef.current?.focus();
                      }}
                    />
                  )}
                </S.ChatMovieCards>
              </S.ChatMsg>
            );
          }

          return null;
        })}

        {/* 처리 상태 인디케이터 */}
        {isLoading && status && (
          <S.ChatMsg>
            {/*
              상태 인디케이터 아바타: thinking (AI가 처리 중).
              status 텍스트가 표시될 때 고개 갸우뚱 + 눈 깜빡임.
            */}
            <S.MonggleAvatarWrapper>
              <MonggleCharacter animation="thinking" size="sm" />
            </S.MonggleAvatarWrapper>
            <S.ChatStatus>
              <S.StatusDots>
                {/* 각 점에 딜레이를 적용하여 순차 바운스 효과 */}
                <S.StatusDot $delay="-0.32s" />
                <S.StatusDot $delay="-0.16s" />
                <S.StatusDot $delay="0s" />
              </S.StatusDots>
              <S.StatusText>{status}</S.StatusText>
            </S.ChatStatus>
          </S.ChatMsg>
        )}

        {/*
          후속 질문 + AI 생성 제안 카드 (clarification 이벤트 수신 시, 로딩 중에는 숨김).
          2026-04-15: Claude Code 스타일 제안 카드 UI 를 별도 컴포넌트(ClarificationOptions)
          로 분리. payload 는 {question, hints, primary_field, suggestions, allow_custom}.
          카드/칩 클릭 시 해당 value 를 sendMessage 로 전송하고, sendMessage 내부에서
          setClarification(null) 이 호출되므로 UI 는 자동으로 사라진다.
        */}
        {!isLoading && clarification && (
          <ClarificationOptions
            clarification={clarification}
            onSelect={(value) => sendMessage(value)}
            disabled={isLoading}
          />
        )}

        {/* 에러 메시지 */}
        {error && (
          <S.ChatMsg>
            {/*
              에러 아바타: idle (에러 상황에서 차분하게 대기).
              celebrating/waving은 에러 맥락과 어울리지 않으므로 idle 고정.
            */}
            <S.MonggleAvatarWrapper>
              <MonggleCharacter animation="idle" size="sm" />
            </S.MonggleAvatarWrapper>
            <S.MsgBubble $variant="error">{error}</S.MsgBubble>
          </S.ChatMsg>
        )}

        {/* 자동 스크롤 앵커 */}
        <div ref={messagesEndRef} />
      </S.ChatMessages>

      {/* ── 입력 영역 ──
          2026-04-24: 빈 상태에서는 ChatWelcome 내부에 임베드되므로 여기서는 생략.
          메시지가 한 건이라도 있으면 하단 고정 모드로 복귀한다. */}
      {!isEmpty && inputSection}

      {/* 드래그 오버레이 (이미지 드래그 중 표시) */}
      {isDragging && (
        <S.DragOverlay>
          <S.DragOverlayContent>
            <S.DragOverlayIcon>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </S.DragOverlayIcon>
            <S.DragOverlayText>이미지를 놓으세요</S.DragOverlayText>
          </S.DragOverlayContent>
        </S.DragOverlay>
      )}

      {/* ── 게스트 평생 1회 쿼터 소진 → 로그인 유도 모달 (2026-04-22 신규) ── */}
      <LoginRequiredModal
        open={Boolean(guestQuotaExceeded)}
        onClose={dismissGuestQuotaModal}
        reason={guestQuotaExceeded?.reason}
      />
    </S.ChatWindowWrapper>
  );
}
