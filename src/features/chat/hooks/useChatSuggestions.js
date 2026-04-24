/**
 * 채팅 환영 화면 추천 칩 커스텀 훅.
 *
 * 마운트 시 Backend에서 활성 추천 칩 목록을 1회 fetch하여 상태에 저장한다.
 * fetch 전까지는 FALLBACK_SUGGESTIONS 4개를 즉시 렌더링해 빈 화면 없이 칩을 보여준다.
 * fetch 성공 시 DB 목록으로 자연스럽게 교체되고, 실패 시 fallback을 그대로 유지한다.
 *
 * 클릭 핸들러는 id가 있는 칩에 한해 Backend 클릭 트래킹을 fire-and-forget으로 전송하고,
 * onSelect 콜백으로 칩 텍스트를 상위 컴포넌트(ChatWindow)에 전달한다.
 *
 * @module features/chat/hooks/useChatSuggestions
 */

import { useState, useEffect } from 'react';
import { fetchChatSuggestions, trackChatSuggestionClick } from '../api/chatApi';

/**
 * fetch 실패 또는 빈 응답 시 즉시 표시할 fallback 추천 칩.
 * id=null 이므로 클릭 트래킹 전송은 생략된다.
 *
 * @type {Array<{id: null, text: string}>}
 */
const FALLBACK_SUGGESTIONS = [
  { id: null, text: '오늘 기분이 우울한데 영화 추천해줘' },
  { id: null, text: '인터스텔라 같은 영화 보고 싶어' },
  { id: null, text: '가족이랑 볼 애니메이션 추천해줘' },
  { id: null, text: '요즘 인기 있는 한국 영화 뭐 있어?' },
];

/**
 * 채팅 환영 화면 추천 칩 훅.
 *
 * @param {Object} [options] - 옵션
 * @param {Function} [options.onSelect] - 칩 선택 시 호출되는 콜백. text(string)를 인자로 받는다.
 * @param {number} [options.limit=4] - Backend에서 가져올 칩 수 (1~10)
 * @returns {{ suggestions: Array<{id: number|null, text: string}>, handleSelect: Function }}
 */
export default function useChatSuggestions({ onSelect, limit = 4 } = {}) {
  /**
   * 추천 칩 목록.
   * 초기값을 FALLBACK으로 설정해 fetch 완료 전에도 칩이 즉시 렌더된다.
   */
  const [suggestions, setSuggestions] = useState(FALLBACK_SUGGESTIONS);

  useEffect(() => {
    // 언마운트 후 상태 갱신을 방지하는 취소 플래그
    let cancelled = false;

    (async () => {
      const list = await fetchChatSuggestions(limit);
      if (cancelled) return;
      // 빈 배열이면 fallback 유지, 항목이 있으면 DB 목록으로 교체
      if (Array.isArray(list) && list.length > 0) {
        setSuggestions(list);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  /**
   * 추천 칩 클릭 핸들러.
   *
   * id가 있는 칩은 Backend에 클릭 카운트를 fire-and-forget으로 전송한다.
   * 이후 onSelect 콜백으로 칩 텍스트를 상위 컴포넌트에 전달한다.
   *
   * @param {{ id: number|null, text: string }} suggestion - 클릭된 칩 객체
   */
  const handleSelect = (suggestion) => {
    // id가 있는 경우에만 클릭 트래킹 전송 (fire-and-forget)
    if (suggestion.id != null) {
      trackChatSuggestionClick(suggestion.id);
    }
    onSelect?.(suggestion.text);
  };

  return { suggestions, handleSelect };
}
