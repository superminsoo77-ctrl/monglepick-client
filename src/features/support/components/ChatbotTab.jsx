/**
 * AI 고객센터 챗봇 탭 컴포넌트.
 *
 * LLM 기반 자동응답 + FAQ 매칭 + 상담원 이관 기능을 제공한다.
 * 세션 ID로 대화 맥락을 유지하며,
 * needsHumanAgent=true 시 상담원 연결 버튼을 표시한다.
 *
 * @param {function} onSwitchToTicket - 상담원 이관 시 문의하기 탭으로 전환하는 콜백
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { sendChatbotMessage } from '../api/supportApi';
import * as S from './ChatbotTab.styled';

/** 추천 질문 목록 */
const SUGGESTIONS = [
  '포인트는 어떻게 충전하나요?',
  'AI 추천은 어떻게 사용하나요?',
  '비밀번호를 변경하고 싶어요',
  '환불은 어떻게 하나요?',
];

export default function ChatbotTab({ onSwitchToTicket }) {
  /* 메시지 목록: [{role: 'user'|'bot', content, matchedFaqs?, needsHumanAgent?}] */
  const [messages, setMessages] = useState([]);
  /* 입력 텍스트 */
  const [input, setInput] = useState('');
  /* 로딩 상태 */
  const [isLoading, setIsLoading] = useState(false);
  /* 세션 ID */
  const [sessionId, setSessionId] = useState(null);

  /* 메시지 영역 스크롤 ref */
  const messagesEndRef = useRef(null);

  /** 자동 스크롤 */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /**
   * 메시지 전송 핸들러.
   */
  const handleSend = useCallback(async (text) => {
    const message = (text || input).trim();
    if (!message || isLoading) return;

    /* 사용자 메시지 추가 */
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await sendChatbotMessage({ message, sessionId });

      /* 세션 ID 저장 */
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      /* 봇 응답 추가 */
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: data.answer || '죄송합니다. 잠시 후 다시 시도해 주세요.',
          matchedFaqs: data.matchedFaqs || [],
          needsHumanAgent: data.needsHumanAgent || false,
        },
      ]);
    } catch {
      /* API 실패 시 폴백 응답 */
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.\n문제가 지속되면 "문의하기" 탭에서 직접 문의해 주세요.',
          needsHumanAgent: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, sessionId]);

  /**
   * Enter 키 핸들러.
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * FAQ 카드 클릭 → 해당 질문을 전송.
   */
  const handleFaqClick = (faqQuestion) => {
    handleSend(faqQuestion);
  };

  return (
    <S.Container>
      {/* 헤더 */}
      <S.Header>
        <S.BotAvatar>&#x1F916;</S.BotAvatar>
        <S.HeaderText>
          <S.BotName>몽글봇 고객센터</S.BotName>
          <S.BotStatus>온라인</S.BotStatus>
        </S.HeaderText>
      </S.Header>

      {/* 메시지 영역 */}
      <S.Messages>
        {/* 환영 메시지 (대화 시작 전) */}
        {messages.length === 0 && (
          <S.WelcomeMsg>
            <S.WelcomeIcon>&#x1F916;</S.WelcomeIcon>
            <S.WelcomeText>
              안녕하세요! 몽글봇이에요.
              <br />
              궁금한 점을 편하게 물어보세요!
            </S.WelcomeText>
            <S.SuggestionChips>
              {SUGGESTIONS.map((q) => (
                <S.SuggestionChip key={q} onClick={() => handleSend(q)}>
                  {q}
                </S.SuggestionChip>
              ))}
            </S.SuggestionChips>
          </S.WelcomeMsg>
        )}

        {/* 메시지 목록 */}
        {messages.map((msg, idx) => (
          <div key={idx}>
            <S.MsgRow $isUser={msg.role === 'user'}>
              <S.MsgBubble $isUser={msg.role === 'user'}>
                {msg.content}
              </S.MsgBubble>
            </S.MsgRow>

            {/* 매칭 FAQ 카드 (봇 응답에 포함된 경우) */}
            {msg.role === 'bot' && msg.matchedFaqs && msg.matchedFaqs.length > 0 && (
              <S.FaqMatches>
                {msg.matchedFaqs.map((faq, fIdx) => (
                  <S.FaqMatchCard
                    key={faq.id || fIdx}
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
                  추가 도움이 필요하시면 상담원에게 문의해 주세요.
                </S.HumanAgentText>
                <S.HumanAgentBtn onClick={onSwitchToTicket}>
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

        {/* 자동 스크롤 앵커 */}
        <div ref={messagesEndRef} />
      </S.Messages>

      {/* 입력 영역 */}
      <S.InputArea>
        <S.Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="궁금한 점을 물어보세요..."
          disabled={isLoading}
        />
        <S.SendBtn
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
        >
          전송
        </S.SendBtn>
      </S.InputArea>
    </S.Container>
  );
}
