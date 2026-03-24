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
/* 인증 Context 훅 — app/providers에서 가져옴 (userId 전달용) */
import { useAuth } from '../../../app/providers/AuthProvider';
/* 채팅 상태 관리 훅 — 같은 feature 내의 hooks에서 가져옴 */
import { useChat } from '../hooks/useChat';
import MovieCard from './MovieCard';
import './ChatWindow.css';

/** 이미지 최대 크기 (10MB) */
const IMAGE_MAX_SIZE_MB = 10;
/** 허용 이미지 MIME 타입 */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
/** 기본 최대 입력 글자수 (BRONZE 등급 기본값, 서버 쿼터 정보 수신 전 사용) */
const DEFAULT_MAX_INPUT_LENGTH = 200;

/**
 * 글자수 비율에 따른 CSS 수정자 클래스를 반환한다.
 * - 70% 미만: 기본 (녹색)
 * - 70~90%: --warning (노란색)
 * - 90% 초과: --error (빨간색)
 *
 * @param {number} current - 현재 글자수
 * @param {number} max - 최대 글자수
 * @returns {string} CSS 수정자 문자열 (빈 문자열 / ' chat-input__char-count--warning' / ' chat-input__char-count--error')
 */
function getCharCountModifier(current, max) {
  const ratio = current / max;
  if (ratio > 0.9) return ' chat-input__char-count--error';
  if (ratio >= 0.7) return ' chat-input__char-count--warning';
  return '';
}

export default function ChatWindow() {
  // 인증 상태에서 사용자 ID를 가져와 포인트 시스템 연동에 사용
  const { user } = useAuth();

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
  } = useChat({ userId: user?.id || '' });

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

  /**
   * 새 메시지가 추가되면 자동 스크롤.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

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
      alert('JPG, PNG, GIF, WebP 이미지만 업로드할 수 있습니다.');
      return;
    }

    // 파일 크기 검증 (10MB 제한)
    if (file.size > IMAGE_MAX_SIZE_MB * 1024 * 1024) {
      alert(`이미지 크기는 ${IMAGE_MAX_SIZE_MB}MB 이하여야 합니다.`);
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

  return (
    <div
      className={`chat-window${isDragging ? ' chat-window--dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ── 헤더 ── */}
      <header className="chat-header">
        <div className="chat-header__left">
          <img src="/mongle-transparent.png" alt="몽글픽" className="chat-header__avatar" />
          <div>
            <h1 className="chat-header__title">몽글픽</h1>
            <p className="chat-header__subtitle">AI 영화 추천</p>
          </div>
        </div>
        <button
          className="chat-header__clear"
          onClick={clearMessages}
          title="대화 초기화"
        >
          새 대화
        </button>
      </header>

      {/* ── 포인트 정보 바 (포인트 차감 결과 수신 시 표시) ── */}
      {pointInfo && (
        <div className="chat-point-bar">
          <span className="chat-point-bar__balance">
            {/* 보석 이모지 + 잔액 표시 */}
            <span className="chat-point-bar__icon">&#x1F48E;</span>
            {pointInfo.balance.toLocaleString()}P
          </span>
          <span className="chat-point-bar__divider">|</span>
          <span className="chat-point-bar__usage">
            {/* 차감된 포인트가 0이 아닌 경우에만 사용량 표시 */}
            {pointInfo.deducted > 0
              ? `오늘 ${pointInfo.deducted.toLocaleString()}P 사용`
              : '오늘 사용 없음'
            }
          </span>
          {/* 무료 이용 배지 (free_usage=true일 때 표시) */}
          {pointInfo.freeUsage && (
            <span className="chat-point-bar__free-badge">무료 이용</span>
          )}
        </div>
      )}

      {/* ── 쿼터/포인트 에러 배너 (에러 코드별 안내) ── */}
      {quotaError && (
        <div className="chat-quota-error">
          {/* 닫기 버튼 */}
          <button
            className="chat-quota-error__close"
            onClick={dismissQuotaError}
            title="닫기"
          >
            &#x2715;
          </button>

          {/* INSUFFICIENT_POINT: 포인트 부족 */}
          {quotaError.error_code === 'INSUFFICIENT_POINT' && (
            <div className="chat-quota-error__content">
              <span className="chat-quota-error__title">포인트가 부족합니다</span>
              <p className="chat-quota-error__desc">
                현재 잔액: {quotaError.balance?.toLocaleString() ?? 0}P / 필요: {quotaError.cost?.toLocaleString() ?? 0}P
              </p>
              <a href="/point" className="chat-quota-error__link">
                포인트 충전하기 &rarr;
              </a>
            </div>
          )}

          {/* INPUT_TOO_LONG: 입력 글자수 초과 */}
          {quotaError.error_code === 'INPUT_TOO_LONG' && (
            <div className="chat-quota-error__content">
              <span className="chat-quota-error__title">입력 글자수를 초과했습니다</span>
              <p className="chat-quota-error__desc">
                최대 {quotaError.max_input_length?.toLocaleString() ?? DEFAULT_MAX_INPUT_LENGTH}자까지 입력 가능합니다.
                (현재 {quotaError.current_length?.toLocaleString() ?? '?'}자)
              </p>
            </div>
          )}

          {/* QUOTA_EXCEEDED: 일일/월간 이용 한도 초과 */}
          {quotaError.error_code === 'QUOTA_EXCEEDED' && (
            <div className="chat-quota-error__content">
              <span className="chat-quota-error__title">이용 한도를 초과했습니다</span>
              <p className="chat-quota-error__desc">
                {quotaError.daily_limit != null && (
                  <>일일: {quotaError.daily_used ?? 0}/{quotaError.daily_limit}회</>
                )}
                {quotaError.daily_limit != null && quotaError.monthly_limit != null && ' · '}
                {quotaError.monthly_limit != null && (
                  <>월간: {quotaError.monthly_used ?? 0}/{quotaError.monthly_limit}회</>
                )}
              </p>
              <a href="/point" className="chat-quota-error__link">
                등급 업그레이드 알아보기 &rarr;
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── 메시지 영역 ── */}
      <main className="chat-messages">
        {/* 초기 안내 메시지 (메시지가 없을 때) */}
        {messages.length === 0 && (
          <div className="chat-welcome">
            <img src="/mongle-transparent.png" alt="몽글픽" className="chat-welcome__icon" />
            <h2 className="chat-welcome__title">안녕하세요! 몽글픽이에요</h2>
            <p className="chat-welcome__desc">
              어떤 영화를 찾고 계신가요? 기분, 장르, 좋아하는 영화 등
              무엇이든 말씀해 주세요!
            </p>
            <div className="chat-welcome__suggestions">
              {/* 추천 질문 버튼 */}
              {[
                '오늘 기분이 우울한데 영화 추천해줘',
                '인터스텔라 같은 영화 보고 싶어',
                '가족이랑 볼 애니메이션 추천해줘',
                '요즘 인기 있는 한국 영화 뭐 있어?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  className="chat-welcome__suggestion"
                  onClick={() => {
                    setInputText(suggestion);
                    sendMessage(suggestion);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 메시지 목록 */}
        {messages.map((msg, idx) => {
          // 사용자 메시지 (이미지 포함 가능)
          if (msg.role === 'user') {
            return (
              <div key={idx} className="chat-msg chat-msg--user">
                <div className="chat-msg__bubble chat-msg__bubble--user">
                  {/* 첨부 이미지 표시 */}
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="첨부 이미지"
                      className="chat-msg__image"
                    />
                  )}
                  {msg.content && <span>{msg.content}</span>}
                </div>
              </div>
            );
          }

          // 봇 텍스트 응답 (취소됨 표시 포함)
          if (msg.role === 'bot') {
            return (
              <div key={idx} className="chat-msg chat-msg--bot">
                <img src="/mongle-transparent.png" alt="몽글픽" className="chat-msg__avatar" />
                <div className={`chat-msg__bubble chat-msg__bubble--bot${msg.cancelled ? ' chat-msg__bubble--cancelled' : ''}`}>
                  {msg.content}
                </div>
              </div>
            );
          }

          // 영화 카드 목록
          if (msg.role === 'movie_cards') {
            return (
              <div key={idx} className="chat-msg chat-msg--bot">
                <img src="/mongle-transparent.png" alt="몽글픽" className="chat-msg__avatar" />
                <div className="chat-movie-cards">
                  {msg.movies.map((movie, mIdx) => (
                    <MovieCard key={movie.id || mIdx} movie={movie} />
                  ))}
                </div>
              </div>
            );
          }

          return null;
        })}

        {/* 처리 상태 인디케이터 */}
        {isLoading && status && (
          <div className="chat-msg chat-msg--bot">
            <img src="/mongle-transparent.png" alt="몽글픽" className="chat-msg__avatar" />
            <div className="chat-status">
              <div className="chat-status__dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="chat-status__text">{status}</span>
            </div>
          </div>
        )}

        {/* 후속 질문 힌트 칩 (clarification 이벤트 수신 시) */}
        {clarification?.hints?.length > 0 && (
          <div className="chat-msg chat-msg--bot">
            <img src="/mongle-transparent.png" alt="몽글픽" className="chat-msg__avatar" />
            <div className="chat-clarification">
              {clarification.hints.map((hint) => (
                <div key={hint.field} className="chat-clarification__group">
                  <span className="chat-clarification__label">{hint.label}</span>
                  <div className="chat-clarification__chips">
                    {hint.options.map((option) => (
                      <button
                        key={option}
                        className="chat-clarification__chip"
                        onClick={() => {
                          // 칩 클릭 시 label(장르/분위기 등) + 선택값을 포함한 구조화된 메시지를 전송하여
                          // LLM이 맥락을 명확히 파악할 수 있도록 한다.
                          // 예: "음악" → "장르는 음악 좋아해" / "힐링" → "분위기는 힐링 좋아해"
                          const contextMessage = `${hint.label}는 ${option} 좋아해`;
                          sendMessage(contextMessage);
                        }}
                        disabled={isLoading}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="chat-msg chat-msg--bot">
            <img src="/mongle-transparent.png" alt="몽글픽" className="chat-msg__avatar" />
            <div className="chat-msg__bubble chat-msg__bubble--error">
              {error}
            </div>
          </div>
        )}

        {/* 자동 스크롤 앵커 */}
        <div ref={messagesEndRef} />
      </main>

      {/* ── 입력 영역 ── */}
      <footer className="chat-input">
        {/* 이미지 미리보기 (첨부된 이미지가 있을 때) */}
        {attachedImage && (
          <div className="chat-input__image-preview">
            <img
              src={attachedImage.preview}
              alt="첨부 이미지 미리보기"
              className="chat-input__image-preview-img"
            />
            <button
              className="chat-input__image-preview-remove"
              onClick={handleRemoveImage}
              title="이미지 제거"
            >
              ✕
            </button>
          </div>
        )}
        <div className="chat-input__container">
          {/* 숨겨진 파일 입력 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
          {/* 이미지 첨부 버튼 */}
          <button
            className="chat-input__btn chat-input__btn--attach"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title="이미지 첨부"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>
          {/* textarea 래퍼 (글자수 카운터를 우하단에 배치하기 위한 relative 컨테이너) */}
          <div className="chat-input__textarea-wrapper">
            <textarea
              ref={inputRef}
              className="chat-input__textarea"
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
              <span
                className={`chat-input__char-count${getCharCountModifier(
                  inputText.length,
                  quotaError?.max_input_length ?? DEFAULT_MAX_INPUT_LENGTH,
                )}`}
              >
                {inputText.length}/{quotaError?.max_input_length ?? DEFAULT_MAX_INPUT_LENGTH}
              </span>
            )}
          </div>
          {isLoading ? (
            <button
              className="chat-input__btn chat-input__btn--cancel"
              onClick={cancelRequest}
              title="요청 취소"
            >
              ■
            </button>
          ) : (
            <button
              className="chat-input__btn chat-input__btn--send"
              onClick={handleSend}
              disabled={!inputText.trim() && !attachedImage}
              title="전송"
            >
              ↑
            </button>
          )}
        </div>
      </footer>

      {/* 드래그 오버레이 (이미지 드래그 중 표시) */}
      {isDragging && (
        <div className="chat-drag-overlay">
          <div className="chat-drag-overlay__content">
            <span className="chat-drag-overlay__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </span>
            <span className="chat-drag-overlay__text">이미지를 놓으세요</span>
          </div>
        </div>
      )}
    </div>
  );
}
