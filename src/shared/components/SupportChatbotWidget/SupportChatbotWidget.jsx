/**
 * 전역 플로팅 챗봇 위젯 컴포넌트.
 *
 * 우측 하단에 항상 떠 있는 FAB(Floating Action Button) 형태로 배치되며,
 * 클릭하면 챗봇 패널이 열려 AI 고객센터 챗봇과 대화할 수 있다.
 *
 * <h3>노출 정책 (사용자 요구사항)</h3>
 * <ul>
 *   <li>AI 채팅 추천 페이지(/chat, /chat/:sessionId)를 <b>제외한 모든 화면</b>에 노출된다.</li>
 *   <li>랜딩/홈/검색/마이페이지/고객센터/로그인 등 어디에서나 우측 하단에 따라다닌다.</li>
 * </ul>
 *
 * <h3>재사용 구조</h3>
 * <p>SupportPage 내 {@code ChatbotTab} 과 별도로 독립 구현하되, 동일 API
 * {@code sendSupportChatSse()} (Agent EXAONE 몽글이 + FAQ RAG) 를 호출한다.
 * 2026-04-23 에 기존 Backend 키워드 LIKE 기반 {@code sendChatbotMessage} 에서 전환.</p>
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
/* 고객센터 AI 챗봇 SSE — Agent(EXAONE 1.2B 몽글이 + FAQ RAG) */
import { sendSupportChatSse } from '../../../features/support/api/supportApi';
/* 2026-04-23: 추천 질문 칩 동적 조회 (chat_suggestions.surface='faq_chatbot') */
import useChatbotSuggestions from '../../../features/support/hooks/useChatbotSuggestions';
/* 라우트 상수 — 상담원 이관 버튼의 '/support' 경로용 */
import { ROUTES } from '../../constants/routes';
import * as S from './SupportChatbotWidget.styled';

/* ══════════════════════════════════════════
   상수 정의
   ══════════════════════════════════════════ */

/**
 * 현재 경로가 AI 채팅 추천 화면(/chat, /chat/:sessionId)인지 판정한다.
 *
 * <p>사용자 요구사항상 AI 채팅 추천 화면만 위젯을 숨긴다.
 * 단순히 {@code startsWith('/chat')} 으로 하면 향후 {@code /chatbot} 등 다른 경로가
 * 생겼을 때 오탐될 수 있으므로, 정확히 {@code /chat} 또는 {@code /chat/...} 만 매칭한다.</p>
 *
 * @param {string} pathname - 현재 라우터 pathname
 * @returns {boolean} AI 채팅 페이지이면 true
 */
function isAiChatPath(pathname) {
  return pathname === '/chat' || pathname.startsWith('/chat/');
}

/* 초기 환영 화면 추천 질문 칩은 더 이상 하드코딩하지 않는다 —
   2026-04-23: Backend `chat_suggestions` (surface=faq_chatbot) 에서 동적 조회.
   빈 응답·네트워크 오류 시에는 훅 내부 FALLBACK_PROMPTS 가 기본값을 제공한다. */

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

export default function SupportChatbotWidget() {
  const { pathname } = useLocation();
  /* 추천 질문 풀 — Backend 에서 surface=faq_chatbot 으로 조회 (기본 4개) */
  const suggestions = useChatbotSuggestions(4);

  /* 현재 경로가 AI 채팅 추천 화면인지 판정 — 숨김이면 렌더 전에 조기 리턴 */
  const shouldHide = isAiChatPath(pathname);

  /* 패널 열림/닫힘 */
  const [isOpen, setIsOpen] = useState(false);
  /* 대화 메시지: [{role: 'user'|'bot', content, matchedFaqs?, needsHumanAgent?}] */
  const [messages, setMessages] = useState([]);
  /* 입력 텍스트 */
  const [input, setInput] = useState('');
  /* 전송 로딩 상태 */
  const [isLoading, setIsLoading] = useState(false);
  /* 세션 ID (서버가 최초 호출 시 발급) */
  const [sessionId, setSessionId] = useState(null);

  /* 스크롤 앵커 + 메시지 컨테이너 ref */
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  /**
   * 자동 스크롤 — 메시지 추가/로딩 변화 시 챗봇 *내부* 메시지 컨테이너만 하단으로 이동.
   *
   * QA #169 (2026-04-23): 기존 `scrollIntoView()` 는 요소가 화면에 보이도록 *모든* 상위
   * 스크롤 컨테이너를 조정해 페이지 전체가 챗봇 위치까지 튀는 현상이 있었다. 챗봇 패널은
   * fixed 위치라 화면 스크롤 없이도 항상 보이므로, 내부 컨테이너의 `scrollTop` 만
   * 직접 조정해 페이지 스크롤을 유발하지 않도록 전환한다.
   */
  useEffect(() => {
    if (!isOpen) return;
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  /* 경로 이동 시 패널 닫힘 유지 (대화 내용은 보존) */
  useEffect(() => {
    if (shouldHide && isOpen) setIsOpen(false);
  }, [shouldHide, isOpen]);

  /**
   * 메시지 전송 핸들러 (SSE 기반).
   *
   * Agent `POST /api/v1/support/chat` SSE 로 이벤트를 수신하면서
   *   - session: sessionId 를 보존 (후속 턴 맥락 유지용)
   *   - matched_faq: 봇 메시지 객체에 매칭 FAQ 카드 데이터로 주입
   *   - token: 최종 응답 본문 (현재 MVP 는 1회 전송)
   *   - needs_human: '상담원 연결' 배너 노출 여부
   *   - error: 메시지 본문 폴백 + 상담원 배너 강제 노출
   *   - done: 로딩 종료
   * 의 단계를 거쳐 봇 메시지 한 개를 업데이트한다.
   *
   * 봇 메시지 객체 shape 은 기존 REST 응답과 호환되게 유지한다
   * (matchedFaqs: [{id, question}], needsHumanAgent: boolean).
   */
  const handleSend = useCallback(
    async (text) => {
      const message = (text || input).trim();
      if (!message || isLoading) return;

      /* 사용자 메시지 추가 + 봇 자리표시자 — 수신 이벤트에 따라 자리표시자를 갱신한다 */
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: message },
        {
          role: 'bot',
          content: '',
          matchedFaqs: [],
          needsHumanAgent: false,
          /* 자리표시자 식별자 — 같은 턴의 봇 메시지만 정확히 갱신하도록 */
          pending: true,
        },
      ]);
      setInput('');
      setIsLoading(true);

      /**
       * 마지막 pending 봇 메시지를 patch 업데이트한다.
       * SSE 이벤트마다 이 헬퍼를 통해 부분 갱신한다.
       */
      const updateLastBot = (patch) => {
        setMessages((prev) => {
          const next = [...prev];
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].role === 'bot' && next[i].pending) {
              next[i] = { ...next[i], ...patch };
              break;
            }
          }
          return next;
        });
      };

      /* Agent v3 matched_faq 페이로드 shape: {faq_id, category, question}
         → UI 는 {id, question} 키를 사용하므로 여기서 매핑한다. (점수는 더 이상
         전송되지 않음 — LLM 이 직접 '관련 FAQ' 선정하므로 점수 개념 없음) */
      const mapMatchedFaqs = (items) =>
        (items || []).map((m) => ({
          id: m.faq_id,
          category: m.category,
          question: m.question,
        }));

      try {
        await sendSupportChatSse(
          { message, sessionId: sessionId || '' },
          {
            onSession: (data) => {
              if (data?.session_id) setSessionId(data.session_id);
            },
            onMatchedFaq: (data) => {
              updateLastBot({ matchedFaqs: mapMatchedFaqs(data?.items) });
            },
            onToken: (data) => {
              /* MVP: token 은 1회 전체 본문 전송. 후속에서 스트리밍이 되면 append 로 교체 */
              if (data?.delta) updateLastBot({ content: data.delta });
            },
            onNeedsHuman: (data) => {
              updateLastBot({ needsHumanAgent: Boolean(data?.value) });
            },
            onError: (data) => {
              updateLastBot({
                content:
                  data?.message ||
                  '잠시 문제가 있었어요. 잠시 후 다시 시도해 주세요.',
                needsHumanAgent: true,
              });
            },
            onDone: () => {
              /* 자리표시자 해제 — 이후 새 턴에서 다시 pending 봇이 추가된다 */
              updateLastBot({ pending: false });
            },
          },
        );
      } catch {
        /* 네트워크/서버 오류 — 폴백 응답 + 상담원 이관 유도 */
        updateLastBot({
          content:
            '네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.\n문제가 지속되면 아래 "상담원 연결" 버튼을 눌러 문의해 주세요.',
          needsHumanAgent: true,
          pending: false,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, sessionId],
  );

  /** Enter 전송 (Shift+Enter 는 줄바꿈 예약이나 현재 Input 은 단일 라인) */
  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  /** 추천 질문 칩 클릭 → 즉시 전송 */
  const handleSuggestion = (question) => handleSend(question);

  /** 매칭 FAQ 카드 클릭 → 해당 질문을 재전송하여 상세 답변 재노출 */
  const handleFaqClick = (faqQuestion) => handleSend(faqQuestion);

  /** 패널 토글 */
  const toggle = () => setIsOpen((prev) => !prev);

  /* 숨김 페이지에서는 아예 렌더하지 않음 — DOM 노드/이벤트 리스너 오염 방지 */
  if (shouldHide) return null;

  return (
    <S.Root>
      {/* 열린 상태 — 패널 */}
      {isOpen && (
        <S.Panel role="dialog" aria-label="고객센터 챗봇">
          {/* 헤더 */}
          <S.Header>
            <S.BotAvatar>&#x1F916;</S.BotAvatar>
            <S.HeaderText>
              <S.BotName>몽글봇 고객센터</S.BotName>
              <S.BotStatus>온라인 · 평균 즉시 응답</S.BotStatus>
            </S.HeaderText>
            <S.CloseBtn onClick={toggle} aria-label="챗봇 닫기">
              &times;
            </S.CloseBtn>
          </S.Header>

          {/* 메시지 영역 — QA #169: ref 부착으로 내부 스크롤만 조정 (페이지 스크롤 방지) */}
          <S.Messages ref={messagesContainerRef}>
            {/* 환영 메시지 (대화 시작 전) */}
            {messages.length === 0 && (
              <S.WelcomeMsg>
                <S.WelcomeIcon>&#x1F44B;</S.WelcomeIcon>
                <S.WelcomeText>
                  안녕하세요! 몽글봇이에요.
                  <br />
                  궁금한 점을 편하게 물어보세요!
                </S.WelcomeText>
                <S.SuggestionChips>
                  {suggestions.map((q) => (
                    <S.SuggestionChip
                      key={q}
                      type="button"
                      onClick={() => handleSuggestion(q)}
                    >
                      {q}
                    </S.SuggestionChip>
                  ))}
                </S.SuggestionChips>
              </S.WelcomeMsg>
            )}

            {/* 대화 메시지 */}
            {messages.map((msg, idx) => (
              <div key={idx}>
                {/* SSE 자리표시자(아직 token 수신 전) 의 빈 봇 버블은 숨긴다 —
                    타이핑 인디케이터가 시각적으로 대체 역할을 수행한다. */}
                {!(msg.role === 'bot' && msg.pending && !msg.content) && (
                  <S.MsgRow $isUser={msg.role === 'user'}>
                    <S.MsgBubble $isUser={msg.role === 'user'}>
                      {msg.content}
                    </S.MsgBubble>
                  </S.MsgRow>
                )}

                {/* 매칭 FAQ 카드 */}
                {msg.role === 'bot' &&
                  msg.matchedFaqs &&
                  msg.matchedFaqs.length > 0 && (
                    <S.FaqMatches>
                      {msg.matchedFaqs.map((faq, fIdx) => (
                        <S.FaqMatchCard
                          key={faq.id || fIdx}
                          type="button"
                          onClick={() => handleFaqClick(faq.question)}
                        >
                          &#x1F4CB; {faq.question}
                        </S.FaqMatchCard>
                      ))}
                    </S.FaqMatches>
                  )}

                {/* 상담원 이관 배너 — 본문이 비어있는 자리표시자 단계에서는 아직 숨긴다 */}
                {msg.role === 'bot' && msg.needsHumanAgent && msg.content && (
                  <S.HumanAgentBanner>
                    <S.HumanAgentText>
                      상담원 연결이 필요하신가요?
                    </S.HumanAgentText>
                    <S.HumanAgentBtn
                      as={Link}
                      to={`${ROUTES.SUPPORT}?tab=ticket`}
                      onClick={toggle}
                    >
                      상담원 연결
                    </S.HumanAgentBtn>
                  </S.HumanAgentBanner>
                )}
              </div>
            ))}

            {/* 타이핑 인디케이터 */}
            {isLoading && (
              <S.MsgRow>
                <S.TypingIndicator>
                  <S.TypingDot $delay="-0.32s" />
                  <S.TypingDot $delay="-0.16s" />
                  <S.TypingDot $delay="0s" />
                </S.TypingIndicator>
              </S.MsgRow>
            )}

            {/* 스크롤 앵커 */}
            <div ref={messagesEndRef} />
          </S.Messages>

          {/* 입력 영역 */}
          <S.InputArea onSubmit={handleSubmit}>
            <S.Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="궁금한 점을 입력하세요..."
              disabled={isLoading}
              aria-label="챗봇 메시지 입력"
            />
            <S.SendBtn
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="메시지 전송"
            >
              전송
            </S.SendBtn>
          </S.InputArea>
        </S.Panel>
      )}

      {/* 닫힌 상태 — FAB */}
      {!isOpen && (
        <S.Fab
          type="button"
          onClick={toggle}
          aria-label="고객센터 챗봇 열기"
          title="몽글봇에게 물어보기"
        >
          &#x1F4AC;
        </S.Fab>
      )}
    </S.Root>
  );
}
