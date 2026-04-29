/**
 * 정책 RAG 청크 출처 카드 (v4 신규).
 *
 * Agent 가 `policy_chunk` SSE 이벤트를 발행했을 때 봇 메시지 하단에 렌더된다.
 * narrator 가 lookup_policy 결과를 답변에 인용할 때, 어떤 정책 문서를
 * 근거로 답했는지 사용자에게 보조적으로 보여주는 역할이다.
 *
 * 렌더 규칙:
 *  - 카드 헤더: "참고 정책" 라벨 + 아이템 수
 *  - 각 항목: doc_id + section 제목, policy_topic 색상 배지, 점수(score) 색상
 *  - 본문(text) 100자 초과 시 ellipsis + "더 보기/접기" 토글
 *  - score >= 0.85 → 진한 색 / 0.6~0.85 → 보통 / < 0.6 → 옅은 색
 *  - policy_topic 별 배지 색상:
 *    grade_benefit=초록 / ai_quota=파랑 / subscription=보라 / refund=주황 / reward=금색 / payment=회색
 *
 * @param {Object} props
 * @param {Array<{
 *   doc_id: string,
 *   section: string,
 *   headings: string[],
 *   policy_topic: string,
 *   text: string,
 *   score: number
 * }>} props.items - 정책 청크 배열 (최대 5건)
 */

import { useState } from 'react';
import styled, { keyframes } from 'styled-components';

/* ── 상수 ── */

/** policy_topic 별 배지 색상 팔레트 */
const TOPIC_COLORS = {
  grade_benefit: { bg: 'rgba(74, 222, 128, 0.15)', border: 'rgba(74, 222, 128, 0.4)', text: '#4ade80' },
  ai_quota:      { bg: 'rgba(96, 165, 250, 0.15)', border: 'rgba(96, 165, 250, 0.4)', text: '#60a5fa' },
  subscription:  { bg: 'rgba(181, 165, 255, 0.15)', border: 'rgba(181, 165, 255, 0.4)', text: '#B5A5FF' },
  refund:        { bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)', text: '#fbbf24' },
  reward:        { bg: 'rgba(255, 215, 0, 0.15)', border: 'rgba(255, 215, 0, 0.4)', text: '#FFD700' },
  payment:       { bg: 'rgba(136, 136, 160, 0.15)', border: 'rgba(136, 136, 160, 0.4)', text: '#8888a0' },
};

/** policy_topic 한국어 라벨 */
const TOPIC_LABELS = {
  grade_benefit: '등급 혜택',
  ai_quota:      'AI 쿼터',
  subscription:  '구독',
  refund:        '환불',
  reward:        '리워드',
  payment:       '결제',
};

/** 본문 최대 표시 길이 (미리보기) */
const TEXT_PREVIEW_LEN = 100;

/* ── score 색상 헬퍼 ── */

/**
 * 점수(score) 에 따라 색상 강도 CSS 값을 반환한다.
 *
 * @param {number} score - 0~1 유사도 점수
 * @returns {string} color CSS 값
 */
function scoreColor(score) {
  if (score >= 0.85) return '#B5A5FF';      /* 진하게 — primary 계열 */
  if (score >= 0.60) return '#8888a0';      /* 보통 — textSecondary */
  return '#555570';                          /* 옅게 — textMuted */
}

/* ── 하위 컴포넌트 ── */

/**
 * 단일 정책 청크 항목 렌더.
 *
 * @param {Object} props
 * @param {{doc_id, section, headings, policy_topic, text, score}} props.item
 */
function PolicyChunkItem({ item }) {
  const [expanded, setExpanded] = useState(false);

  const { doc_id, section, policy_topic, text, score } = item;
  const isLong = (text || '').length > TEXT_PREVIEW_LEN;
  const displayText = isLong && !expanded
    ? text.slice(0, TEXT_PREVIEW_LEN) + '…'
    : (text || '');

  /* policy_topic 색상 팔레트 — 알 수 없는 토픽은 payment(회색) 폴백 */
  const palette = TOPIC_COLORS[policy_topic] || TOPIC_COLORS.payment;
  const topicLabel = TOPIC_LABELS[policy_topic] || policy_topic || '정책';

  return (
    <ChunkItem>
      {/* 항목 헤더: 제목 + 배지 + 스코어 */}
      <ChunkHeader>
        <ChunkTitle>
          <DocId>{doc_id}</DocId>
          {section && <Section>{section}</Section>}
        </ChunkTitle>
        <ChunkMeta>
          <TopicBadge $bg={palette.bg} $border={palette.border} $color={palette.text}>
            {topicLabel}
          </TopicBadge>
          <ScoreDot $color={scoreColor(score)} title={`유사도 ${(score * 100).toFixed(0)}%`}>
            {(score * 100).toFixed(0)}%
          </ScoreDot>
        </ChunkMeta>
      </ChunkHeader>

      {/* 본문 */}
      <ChunkText>{displayText}</ChunkText>

      {/* 더 보기/접기 */}
      {isLong && (
        <ExpandBtn
          type="button"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? '접기' : '더 보기'}
        </ExpandBtn>
      )}
    </ChunkItem>
  );
}

/* ── 메인 컴포넌트 ── */

export default function PolicyChunkCard({ items }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  /* 최대 5건만 렌더 */
  const displayItems = items.slice(0, 5);

  return (
    <Card>
      {/* 카드 헤더 */}
      <CardHeader>
        <HeaderIcon aria-hidden="true">📋</HeaderIcon>
        <HeaderText>참고 정책</HeaderText>
        <HeaderCount>{displayItems.length}건</HeaderCount>
      </CardHeader>

      {/* 청크 목록 */}
      <ChunkList>
        {displayItems.map((item, idx) => (
          <PolicyChunkItem
            key={item.doc_id ? `${item.doc_id}-${item.section}-${idx}` : idx}
            item={item}
          />
        ))}
      </ChunkList>
    </Card>
  );
}

/* ════════════════════════════════
   styled-components
   ════════════════════════════════ */

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Card = styled.div`
  margin-top: 8px;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.bgSecondary};
  animation: ${fadeIn} 0.25s ease;
  font-size: ${({ theme }) => theme.typography.textXs};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderDefault};
`;

const HeaderIcon = styled.span`
  font-size: 13px;
  flex-shrink: 0;
`;

const HeaderText = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  flex: 1;
`;

const HeaderCount = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ChunkList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const ChunkItem = styled.li`
  padding: 8px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  &:last-child {
    border-bottom: none;
  }
`;

const ChunkHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 4px;
`;

const ChunkTitle = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const DocId = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Section = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ChunkMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const TopicBadge = styled.span`
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  background: ${({ $bg }) => $bg};
  border: 1px solid ${({ $border }) => $border};
  color: ${({ $color }) => $color};
  white-space: nowrap;
`;

const ScoreDot = styled.span`
  font-size: 10px;
  color: ${({ $color }) => $color};
  white-space: nowrap;
`;

const ChunkText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  word-break: break-word;
`;

const ExpandBtn = styled.button`
  background: none;
  border: none;
  padding: 2px 0;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: #B5A5FF;
  cursor: pointer;
  line-height: 1;
  margin-top: 4px;

  &:hover {
    opacity: 0.8;
  }
`;
