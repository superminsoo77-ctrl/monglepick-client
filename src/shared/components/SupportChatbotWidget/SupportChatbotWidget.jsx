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
 * {@code sendChatbotMessage()} 를 호출하여 백엔드 응답 포맷을 공유한다.</p>
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
/* 고객센터 API — features/support에서 가져옴 */
import { sendChatbotMessage } from '../../../features/support/api/supportApi';
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

/** 초기 환영 화면 추천 질문 칩 */
const SUGGESTIONS = [
  '포인트는 어떻게 충전하나요?',
  'AI 추천은 어떻게 사용하나요?',
  '비밀번호를 변경하고 싶어요',
  '환불은 어떻게 하나요?',
];

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

export default function SupportChatbotWidget() {
  const { pathname } = useLocation();

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

  /* 스크롤 앵커 */
  const messagesEndRef = useRef(null);

  /* 자동 스크롤 — 메시지 추가/로딩 변화 시 하단으로 이동 */
  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isOpen]);

  /* 경로 이동 시 패널 닫힘 유지 (대화 내용은 보존) */
  useEffect(() => {
    if (shouldHide && isOpen) setIsOpen(false);
  }, [shouldHide, isOpen]);

  /**
   * 메시지 전송 핸들러.
   * 사용자 메시지 추가 → API 호출 → 봇 응답 추가.
   * 실패 시 상담원 이관 배너를 포함한 폴백 메시지를 노출한다.
   */
  const handleSend = useCallback(
    async (text) => {
      const message = (text || input).trim();
      if (!message || isLoading) return;

      /* 사용자 메시지 추가 */
      setMessages((prev) => [...prev, { role: 'user', content: message }]);
      setInput('');
      setIsLoading(true);

      try {
        const data = await sendChatbotMessage({ message, sessionId });

        /* 세션 ID 보존 (서버가 최초 호출 시 UUID 발급) */
        if (data?.sessionId) setSessionId(data.sessionId);

        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            content: data?.answer || '죄송합니다. 잠시 후 다시 시도해 주세요.',
            matchedFaqs: data?.matchedFaqs || [],
            needsHumanAgent: Boolean(data?.needsHumanAgent),
          },
        ]);
      } catch {
        /* 네트워크/서버 오류 — 폴백 응답 + 상담원 이관 유도 */
        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            content:
              '네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.\n문제가 지속되면 아래 "상담원 연결" 버튼을 눌러 문의해 주세요.',
            needsHumanAgent: true,
          },
        ]);
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

          {/* 메시지 영역 */}
          <S.Messages>
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
                  {SUGGESTIONS.map((q) => (
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
                <S.MsgRow $isUser={msg.role === 'user'}>
                  <S.MsgBubble $isUser={msg.role === 'user'}>
                    {msg.content}
                  </S.MsgBubble>
                </S.MsgRow>

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

                {/* 상담원 이관 배너 */}
                {msg.role === 'bot' && msg.needsHumanAgent && (
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
