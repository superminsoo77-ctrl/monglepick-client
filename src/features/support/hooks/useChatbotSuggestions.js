/**
 * 고객센터 FAQ 챗봇 빈 상태 빠른 질문 풀을 Backend 에서 동적 조회하는 훅.
 *
 * Backend `GET /api/v1/chat/suggestions?surface=faq_chatbot&limit=4` 를 호출하고,
 * 빈 응답이거나 네트워크 오류이면 FALLBACK_PROMPTS 를 사용한다.
 *
 * 2026-04-23 신규 — ChatSuggestion.surface 컬럼 도입으로 3채널
 * (user_chat / admin_assistant / faq_chatbot) 을 단일 테이블 + 쿼리 파라미터로
 * 분리 관리하는 전략. 전역 플로팅 위젯(SupportChatbotWidget) 과 고객센터 페이지
 * ChatbotTab 의 하드코딩 SUGGESTIONS 배열을 대체한다.
 */

import { useEffect, useState } from 'react';
import { backendApi } from '../../../shared/api/axiosInstance';

/** Backend 에 faq_chatbot 시드가 없거나 네트워크 오류 시 쓰이는 최후 방어선. */
const FALLBACK_PROMPTS = [
  '포인트는 어떻게 충전하나요?',
  'AI 추천은 어떻게 사용하나요?',
  '비밀번호를 변경하고 싶어요',
  '환불은 어떻게 하나요?',
];

/**
 * @param {number} limit 반환할 칩 수 (기본 4)
 * @returns {Array<string>} 칩 텍스트 배열
 */
export default function useChatbotSuggestions(limit = 4) {
  const [prompts, setPrompts] = useState(FALLBACK_PROMPTS);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await backendApi.get('/api/v1/chat/suggestions', {
          params: { surface: 'faq_chatbot', limit },
        });
        if (cancelled) return;
        if (Array.isArray(data) && data.length > 0) {
          setPrompts(data.map((s) => s?.text).filter(Boolean));
        }
      } catch {
        /* 네트워크 오류 시 FALLBACK 유지 */
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return prompts;
}
