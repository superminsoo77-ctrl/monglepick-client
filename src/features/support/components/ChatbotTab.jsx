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
/* 2026-04-23: LLM 몽글이(Agent SSE) 로 전환. 레거시 sendChatbotMessage 는 rollback 폴백. */
import { sendSupportChatSse } from '../api/supportApi';
/* 2026-04-23: 추천 질문 칩 동적 조회 (chat_suggestions.surface='faq_chatbot') */
import useChatbotSuggestions from '../hooks/useChatbotSuggestions';
/* v4 신규 카드 컴포넌트 */
import PolicyChunkCard from './PolicyChunkCard';
import NavigationCard from './NavigationCard';
/* PersonalDataCard 는 Phase 2 후속 활성화 대기 — import 준비만 해둠 */
// import PersonalDataCard from './PersonalDataCard';
import * as S from './ChatbotTab.styled';

/* 추천 질문 목록은 더 이상 하드코딩하지 않는다 — Backend 에서 surface=faq_chatbot 으로 조회 */

export default function ChatbotTab({ onSwitchToTicket }) {
  /* 추천 질문 풀 — Backend 에서 surface=faq_chatbot 으로 조회 (기본 4개) */
  const suggestions = useChatbotSuggestions(4);
  /* 메시지 목록: [{role: 'user'|'bot', content, matchedFaqs?, needsHumanAgent?}] */
  const [messages, setMessages] = useState([]);
  /* 입력 텍스트 */
  const [input, setInput] = useState('');
  /* 로딩 상태 */
  const [isLoading, setIsLoading] = useState(false);
  /* 세션 ID */
  const [sessionId, setSessionId] = useState(null);

  /* 메시지 영역 스크롤 ref — 컨테이너 자체에 ref 를 걸어 내부 scrollTop 만 조정한다.
     scrollIntoView 를 쓰면 앵커 div 가 viewport 안에 들어오도록 부모 window 까지
     스크롤되어, 고객센터 페이지에 진입하자마자 페이지 전체가 챗봇 영역 끝으로
     강제 이동하는 버그가 발생했다 (QA 2026-04-28). */
  const messagesContainerRef = useRef(null);

  /** 메시지 추가/로딩 시 채팅창 내부만 하단으로 스크롤. */
  useEffect(() => {
    /* 대화 시작 전(메시지 0건 + 로딩 X) 에는 스크롤 자체를 skip — 첫 진입 시
       페이지 스크롤이 의도치 않게 이동하지 않도록 한다. */
    if (messages.length === 0 && !isLoading) return;
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

  /**
   * 메시지 전송 핸들러 (SSE 기반).
   *
   * 진행 흐름은 {@link SupportChatbotWidget} 과 동일한 규약을 사용한다.
   *   - 봇 자리표시자 pending 메시지 삽입
   *   - session/matched_faq/token/needs_human/error 이벤트로 해당 메시지 patch
   *   - done 시 pending 해제
   * 빈 본문 자리표시자 버블은 렌더 쪽에서 숨긴다(타이핑 인디케이터가 대체).
   */
  const handleSend = useCallback(async (text) => {
    const message = (text || input).trim();
    if (!message || isLoading) return;

    /* 사용자 + 봇 자리표시자를 동시 삽입.
       v4 신규 필드(policyChunks / navigation / personalData)를 초기값으로 포함한다.
       기존 v3 필드(matchedFaqs / needsHumanAgent)는 그대로 유지. */
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: message },
      {
        role: 'bot',
        content: '',
        matchedFaqs: [],
        needsHumanAgent: false,
        pending: true,
        /* v4 신규 */
        policyChunks: [],
        navigation: null,
        personalData: null,
      },
    ]);
    setInput('');
    setIsLoading(true);

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

    /* Agent v3 matched_faq 페이로드 {faq_id, category, question} → UI {id, question} 매핑.
       question 이 비어 있으면 FaqMatchCard 가 "📋 "만 찍힌 빈 박스로 노출되므로
       방어적으로 필터링한다 (QA 2026-04-28). */
    const mapMatchedFaqs = (items) =>
      (items || [])
        .filter((m) => (m?.question || '').trim().length > 0)
        .map((m) => ({
          id: m.faq_id,
          category: m.category,
          question: m.question,
        }));

    try {
      await sendSupportChatSse(
        { message, sessionId: sessionId || '' },
        {
          /* ── v3 기존 콜백 (변경 없음) ── */
          onSession: (data) => {
            if (data?.session_id) setSessionId(data.session_id);
          },
          onMatchedFaq: (data) => {
            updateLastBot({ matchedFaqs: mapMatchedFaqs(data?.items) });
          },
          onToken: (data) => {
            if (data?.delta) updateLastBot({ content: data.delta });
          },
          onNeedsHuman: (data) => {
            updateLastBot({ needsHumanAgent: Boolean(data?.value) });
          },
          onError: (data) => {
            updateLastBot({
              content: data?.message || '잠시 문제가 있었어요. 잠시 후 다시 시도해 주세요.',
              needsHumanAgent: true,
            });
          },
          onDone: () => {
            updateLastBot({ pending: false });
          },

          /* ── v4 신규 콜백 ── */

          /**
           * policy_chunk: 정책 RAG 청크 인용 이벤트.
           * 페이로드: {items: [{doc_id, section, headings, policy_topic, text, score}]}
           * policyChunks 배열에 누적한다 (복수 이벤트 발행 가능성 대비).
           * updateLastBot 은 객체 패치만 지원하므로 setMessages 로 직접 누적한다.
           */
          onPolicyChunk: (data) => {
            if (!Array.isArray(data?.items) || data.items.length === 0) return;
            setMessages((prev) => {
              const next = [...prev];
              for (let i = next.length - 1; i >= 0; i--) {
                if (next[i].role === 'bot' && next[i].pending) {
                  next[i] = {
                    ...next[i],
                    policyChunks: [...(next[i].policyChunks || []), ...data.items],
                  };
                  break;
                }
              }
              return next;
            });
          },

          /**
           * navigation: 화면 이동 안내 이벤트.
           * 페이로드: {target_path, label, candidates: []}
           * 마지막으로 수신한 navigation 데이터를 그대로 보관한다.
           */
          onNavigation: (data) => {
            updateLastBot({ navigation: data || null });
          },

          /**
           * personal_data_card: Read tool 결과 시각화 (Phase 2 후속).
           * 현재 Agent 미발행 — 수신 시 personalData 필드에 보관만 한다.
           * ChatbotTab 렌더에서 PersonalDataCard 는 주석 처리 상태이므로
           * 이벤트가 오더라도 화면에 노출되지 않는다.
           */
          onPersonalDataCard: (data) => {
            updateLastBot({ personalData: data || null });
          },
        },
      );
    } catch {
      /* 네트워크/서버 오류 폴백 — pending 봇 메시지에 에러 본문 주입 */
      updateLastBot({
        content: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.\n문제가 지속되면 "문의하기" 탭에서 직접 문의해 주세요.',
        needsHumanAgent: true,
        pending: false,
      });
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
      <S.Messages ref={messagesContainerRef}>
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
              {suggestions.map((q) => (
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
            {/* SSE 자리표시자(토큰 수신 전) 또는 본문이 비어 있는 봇 메시지는 렌더하지 않는다 —
                자리표시자 단계에서는 타이핑 인디케이터가 시각적 자리 표시를 대체하고,
                token 미수신·SSE 에러 등으로 pending 이 클리어됐지만 content 가 빈 예외
                상황에서도 빈 말풍선이 남지 않도록 방어한다 (QA 2026-04-28). */}
            {!(msg.role === 'bot' && !(msg.content || '').trim()) && (
              <S.MsgRow $isUser={msg.role === 'user'}>
                <S.MsgBubble $isUser={msg.role === 'user'}>
                  {msg.content}
                </S.MsgBubble>
              </S.MsgRow>
            )}

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

            {/* v4 신규: 정책 RAG 청크 카드 — 자리표시자 단계에서는 숨김 */}
            {msg.role === 'bot' && !msg.pending && msg.policyChunks?.length > 0 && (
              <PolicyChunkCard items={msg.policyChunks} />
            )}

            {/* v4 신규: 화면 이동 CTA 카드 — 자리표시자 단계에서는 숨김 */}
            {msg.role === 'bot' && !msg.pending && msg.navigation && (
              <NavigationCard
                target_path={msg.navigation.target_path}
                label={msg.navigation.label}
                candidates={msg.navigation.candidates}
              />
            )}

            {/* Phase 2 후속: PersonalDataCard — Agent 가 personal_data_card 이벤트 발행 시 활성화
            {msg.role === 'bot' && !msg.pending && msg.personalData && (
              <PersonalDataCard
                kind={msg.personalData.kind}
                summary={msg.personalData.summary}
                items={msg.personalData.items}
              />
            )}
            */}

            {/* 상담원 이관 배너 — 자리표시자 단계에서는 숨김 */}
            {msg.role === 'bot' && msg.needsHumanAgent && msg.content && (
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
