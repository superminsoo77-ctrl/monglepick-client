/**
 * 후속 질문 + AI 생성 제안 카드 렌더링 컴포넌트 (2026-04-15 신설).
 *
 * SSE `clarification` 이벤트로 내려오는 payload 를 받아
 * Claude Code 스타일의 "질문 + 선택 카드 2~4개" UI 를 그린다.
 *
 * payload 스키마 (Agent `ClarificationResponse.model_dump()`):
 *   {
 *     question: string,                          // 후속 질문 텍스트
 *     hints:   [{field, label, options[]}],      // 필드별 옵션 칩 (기존 UX)
 *     primary_field: string,                     // 가장 중요한 부족 필드명
 *     suggestions: [{text, value, reason, tags}],// AI 생성 제안 카드 (신규)
 *     allow_custom: boolean,                     // 자유 입력 허용 여부
 *   }
 *
 * 렌더링 우선순위:
 *   1) suggestions 가 1개 이상이면: 카드 UI 를 메인으로 표시.
 *   2) suggestions 가 비어있으면: 기존 hints 칩만 표시 (하위 호환).
 *   3) 카드 클릭 → onSelect(value) 호출 → ChatWindow 가 sendMessage 로 전송.
 *
 * Props:
 *   - clarification: Object  (SSE payload 원본, falsy 면 아무것도 렌더링하지 않음)
 *   - onSelect:      Function(value: string)  — 카드/칩 클릭 시 호출
 *   - disabled:      boolean                  — 로딩 중 상호작용 차단
 */

import MonggleCharacter from '../../../shared/components/MonggleCharacter/MonggleCharacter';
import * as S from './ChatWindow.styled';

export default function ClarificationOptions({ clarification, onSelect, disabled = false }) {
  // payload 없으면 렌더링 안 함
  if (!clarification) return null;

  const {
    question,
    hints = [],
    suggestions = [],
    allow_custom: allowCustom = true,
  } = clarification;

  // 질문도 없고 카드/칩도 없는 빈 payload 는 렌더링 생략
  const hasSuggestions = Array.isArray(suggestions) && suggestions.length > 0;
  const hasHints = Array.isArray(hints) && hints.length > 0;
  if (!question && !hasSuggestions && !hasHints) return null;

  return (
    <S.ChatMsg>
      {/*
        아바타: waving (추가 정보를 요청하며 손 흔들기).
        본 컴포넌트는 항상 "대기 상태"에서만 렌더링되므로 animation 고정.
      */}
      <S.MonggleAvatarWrapper>
        <MonggleCharacter animation="waving" size="sm" />
      </S.MonggleAvatarWrapper>

      <S.ClarificationWrapper>
        {/* 질문 텍스트 */}
        {question && <S.ClarificationQuestion>{question}</S.ClarificationQuestion>}

        {/*
          AI 생성 제안 카드 (신규).
          각 카드 클릭 시 value (또는 text) 를 onSelect 로 전달 → ChatWindow 가 sendMessage 호출.
          text 는 카드 타이틀(짧은 라벨), value 는 채팅창에 삽입될 자연어 문장.
          reason 은 선택적 부제 (있을 때만 표시).
        */}
        {hasSuggestions && (
          <S.SuggestionCards>
            {suggestions.map((opt, idx) => {
              const title = opt?.text || opt?.value || '';
              const sendValue = opt?.value || opt?.text || '';
              const reason = opt?.reason || '';
              // 빈 옵션은 건너뛴다 (LLM 이 일부 항목을 비워 리턴한 경우 방어)
              if (!sendValue) return null;
              return (
                <S.SuggestionCard
                  key={`${title}-${idx}`}
                  type="button"
                  onClick={() => onSelect?.(sendValue)}
                  disabled={disabled}
                  title={reason || title}
                >
                  <S.SuggestionTitle>{title}</S.SuggestionTitle>
                  {reason && <S.SuggestionReason>{reason}</S.SuggestionReason>}
                </S.SuggestionCard>
              );
            })}
            {allowCustom && (
              <S.SuggestionHelperText>
                원하는 답을 직접 입력하셔도 돼요.
              </S.SuggestionHelperText>
            )}
          </S.SuggestionCards>
        )}

        {/*
          기존 필드별 옵션 칩 (하위 호환).
          ClarificationHint = {field, label, options[]} 구조라서
          options 를 펼쳐서 개별 칩으로 렌더링한다.
          suggestions 가 없는 경우에만 전면 노출하고, 있으면 "세부 옵션" 보조 UI 로 축소한다.
        */}
        {hasHints && !hasSuggestions && (
          <S.ClarificationChips>
            {hints.flatMap((hint) => {
              const options = Array.isArray(hint?.options) ? hint.options : [];
              return options.map((opt) => (
                <S.ClarificationChip
                  key={`${hint.field}-${opt}`}
                  type="button"
                  onClick={() => onSelect?.(String(opt))}
                  disabled={disabled}
                >
                  {opt}
                </S.ClarificationChip>
              ));
            })}
          </S.ClarificationChips>
        )}
      </S.ClarificationWrapper>
    </S.ChatMsg>
  );
}
