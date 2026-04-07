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
/* 채팅 상태 관리 훅 — 같은 feature 내의 hooks에서 가져옴 */
import { useChat } from '../hooks/useChat';
/* 채팅 이력 관리 훅 — 사이드바 세션 목록 */
import { useSessionHistory } from '../hooks/useSessionHistory';
import MovieCard from './MovieCard';
/* 몽글이 캐릭터 애니메이션 컴포넌트 */
import MonggleCharacter from '../../../shared/components/MonggleCharacter/MonggleCharacter';
/* 채팅 이력 사이드바 */
import SessionSidebar from './SessionSidebar';
import * as S from './ChatWindow.styled';

/** 이미지 최대 크기 (10MB) */
const IMAGE_MAX_SIZE_MB = 10;
/** 허용 이미지 MIME 타입 */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
/** 기본 최대 입력 글자수 (BRONZE 등급 기본값, 서버 쿼터 정보 수신 전 사용) */
const DEFAULT_MAX_INPUT_LENGTH = 200;

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
    sendMessage,
    clearMessages,
    cancelRequest,
    dismissQuotaError,
    loadExistingSession,
    currentSessionId,
  } = useChat({ userId: user?.id || '' });

  // 채팅 이력 훅 — 사이드바 세션 목록 관리
  const {
    sessions,
    isLoading: isHistoryLoading,
    hasMore,
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
    } catch (err) {
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
    } catch (err) {
      showAlert({
        title: '삭제 실패',
        message: '대화 삭제에 실패했습니다.',
        type: 'warning',
      });
    }
  };

  /**
   * URL의 sessionId가 변경되면 해당 세션을 로드한다 (브라우저 뒤로가기/직접 접근).
   */
  useEffect(() => {
    if (urlSessionId && urlSessionId !== currentSessionId && isAuthenticated) {
      loadSessionMessages(urlSessionId)
        .then((detail) => {
          loadExistingSession(detail.sessionId, detail.messages);
        })
        .catch(() => {
          // 세션을 찾을 수 없으면 /chat으로 리다이렉트
          navigate('/chat', { replace: true });
        });
    }
  }, [urlSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

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
   */
  const handleSend = () => {
    const hasText = inputText.trim();
    const hasImage = attachedImage !== null;
    if ((!hasText && !hasImage) || isLoading) return;

    // 이미지 포함 전송
    sendMessage(inputText.trim(), attachedImage?.base64 || null);
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
      />

      {/* ── 헤더 ── */}
      <S.ChatHeader>
        <S.ChatHeaderLeft>
          {/* 이전 대화 목록 버튼 (인증된 사용자만 표시) */}
          {isAuthenticated && (
            <S.BackButton onClick={handleOpenSidebar} title="이전 대화 목록">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </S.BackButton>
          )}
          {/* 뒤로가기 버튼 — 이전 페이지로 이동 */}
          <S.BackButton onClick={() => navigate(-1)} title="뒤로가기">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </S.BackButton>
          {/*
            헤더 몽글이: idle 상태 고정.
            isLoading일 때 헤더 캐릭터까지 바뀌면 시선이 분산되므로
            헤더는 항상 idle(둥실둥실)을 유지한다.
          */}
          <MonggleCharacter animation="idle" size="sm" />
          <div>
            <S.HeaderTitle>몽글픽</S.HeaderTitle>
            <S.HeaderSubtitle>AI 영화 추천</S.HeaderSubtitle>
          </div>
        </S.ChatHeaderLeft>
        <S.HeaderClearBtn
          onClick={async () => {
            /* 대화 내역이 있을 때만 확인 요청 — 빈 상태에서는 바로 리셋 */
            if (messages.length > 0) {
              const confirmed = await showConfirm({
                title: '새 대화 시작',
                message: '현재 대화를 종료하고 새 대화를 시작할까요?',
                type: 'confirm',
                confirmLabel: '시작',
                cancelLabel: '취소',
              });
              if (!confirmed) return;
            }
            /* useChat 내부 상태 초기화 (messages, session, status, point 등) */
            clearMessages();
            /* ChatWindow 로컬 상태 초기화 */
            setInputText('');
            setAttachedImage(null);
            /* URL 리셋 */
            navigate('/chat', { replace: true });
            /* 입력 필드에 포커스 */
            inputRef.current?.focus();
          }}
          title="새 대화 시작"
        >
          + 새 대화
        </S.HeaderClearBtn>
      </S.ChatHeader>

      {/* ── 포인트 정보 바 (포인트 차감 결과 수신 시 표시) ── */}
      {pointInfo && (
        <S.ChatPointBar>
          <S.PointBalance>
            {/* 보석 이모지 + 잔액 표시 */}
            <S.PointIcon>&#x1F48E;</S.PointIcon>
            {pointInfo.balance.toLocaleString()}P
          </S.PointBalance>
          <S.PointDivider>|</S.PointDivider>
          <S.PointUsage>
            {/* 차감된 포인트가 0이 아닌 경우에만 사용량 표시 */}
            {pointInfo.deducted > 0
              ? `오늘 ${pointInfo.deducted.toLocaleString()}P 사용`
              : '오늘 사용 없음'
            }
          </S.PointUsage>
          {/* 무료 이용 배지 (free_usage=true일 때 표시) */}
          {pointInfo.freeUsage && (
            <S.FreeBadge>무료 이용</S.FreeBadge>
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

          {/* INSUFFICIENT_POINT: 포인트 부족 */}
          {quotaError.error_code === 'INSUFFICIENT_POINT' && (
            <S.QuotaErrorContent>
              <S.QuotaErrorTitle>포인트가 부족합니다</S.QuotaErrorTitle>
              <S.QuotaErrorDesc>
                현재 잔액: {quotaError.balance?.toLocaleString() ?? 0}P / 필요: {quotaError.cost?.toLocaleString() ?? 0}P
              </S.QuotaErrorDesc>
              <S.QuotaErrorLink href="/point">
                포인트 충전하기 &rarr;
              </S.QuotaErrorLink>
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
              <S.QuotaErrorLink href="/point">
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
              {/* 추천 질문 버튼 */}
              {[
                '오늘 기분이 우울한데 영화 추천해줘',
                '인터스텔라 같은 영화 보고 싶어',
                '가족이랑 볼 애니메이션 추천해줘',
                '요즘 인기 있는 한국 영화 뭐 있어?',
              ].map((suggestion) => (
                <S.WelcomeSuggestionBtn
                  key={suggestion}
                  onClick={() => {
                    if (!isLoading) sendMessage(suggestion);
                  }}
                >
                  {suggestion}
                </S.WelcomeSuggestionBtn>
              ))}
            </S.WelcomeSuggestions>
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
                    <MovieCard key={movie.id || mIdx} movie={movie} />
                  ))}
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

        {/* 후속 질문 힌트 칩 (clarification 이벤트 수신 시, 로딩 중에는 숨김) */}
        {!isLoading && clarification && (
          <S.ChatMsg>
            {/*
              clarification 아바타: waving (추가 정보를 요청하며 손 흔들기).
              isLoading이 false일 때만 렌더링하므로 항상 waving 고정.
            */}
            <S.MonggleAvatarWrapper>
              <MonggleCharacter animation="waving" size="sm" />
            </S.MonggleAvatarWrapper>

            {/*
              ClarificationWrapper: question + 칩 목록을 세로로 배치하는 외부 래퍼.
              fadeIn 애니메이션이 적용되어 부드럽게 등장한다.
            */}
            <S.ClarificationWrapper>
              {/* 후속 질문 텍스트 — clarification.question이 있을 때만 표시 */}
              {clarification.question && (
                <S.ClarificationQuestion>{clarification.question}</S.ClarificationQuestion>
              )}

              {/*
                힌트 칩 목록.
                SSE clarification 이벤트의 hints는 단순 string[] 배열이다.
                각 칩 클릭 시 해당 힌트 텍스트를 그대로 sendMessage에 전달하고
                clarification 상태를 초기화한다 (sendMessage 내부에서 setClarification(null) 호출됨).
              */}
              {Array.isArray(clarification.hints) && clarification.hints.length > 0 && (
                <S.ClarificationChips>
                  {clarification.hints.map((hint) => (
                    <S.ClarificationChip
                      key={hint}
                      onClick={() => {
                        // 힌트 칩 클릭: 해당 힌트 텍스트를 메시지로 전송.
                        // sendMessage 내부에서 setClarification(null)을 호출하므로
                        // 칩 UI는 자동으로 사라진다.
                        sendMessage(hint);
                      }}
                      disabled={isLoading}
                    >
                      {hint}
                    </S.ClarificationChip>
                  ))}
                </S.ClarificationChips>
              )}
            </S.ClarificationWrapper>
          </S.ChatMsg>
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

      {/* ── 입력 영역 ── */}
      <S.ChatInputWrapper>
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
    </S.ChatWindowWrapper>
  );
}
