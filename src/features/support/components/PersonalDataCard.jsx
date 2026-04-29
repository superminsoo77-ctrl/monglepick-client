/**
 * 개인 데이터 카드 (Phase 2 후속 스텁).
 *
 * Agent 가 `personal_data_card` SSE 이벤트를 발행했을 때 봇 메시지 하단에 렌더된다.
 * Read tool 결과(포인트 이력 / 출석 기록 / 구독 상태 등)를 표 또는 정보 카드 형태로
 * 시각화하는 컴포넌트이다.
 *
 * !! Phase 2 후속 스텁 !!
 * support_assistant v4 graph 에서 아직 personal_data_card SSE 이벤트를 발행하지 않는다.
 * 이 컴포넌트는 ChatbotTab 에서 현재 미사용이며, Phase 2 완료 후 ChatbotTab 에서
 * import 및 조건부 렌더 한 줄만 추가하면 즉시 활성화된다.
 *
 * kind 별 컬럼 구성:
 *  - point_history  : 날짜 / 금액 / 구분 / 출처
 *  - attendance     : 날짜 / 포인트 / 연속 일수
 *  - subscription   : 플랜 / 상태 / 만료일 / 남은 AI 횟수
 *  - ai_quota       : 구분 / 잔여 / 한도 / 리셋 주기
 *  - grade          : 등급 / 포인트 / 일일 AI 횟수 / 리워드 배율
 *  - orders         : 날짜 / 금액 / 상태 / 상품명
 *  - tickets        : 번호 / 제목 / 상태 / 날짜
 *  - activity       : 날짜 / 활동 / 상세
 *
 * @param {Object} props
 * @param {string} props.kind - 데이터 종류
 *   ('point_history'|'attendance'|'subscription'|'ai_quota'|'grade'|'orders'|'tickets'|'activity')
 * @param {string} [props.summary] - 카드 상단 요약 문구
 * @param {Array<Object>} [props.items] - 렌더할 데이터 행 배열
 */

import { useState } from 'react';
import styled, { keyframes } from 'styled-components';

/* ── kind 별 컬럼 정의 ── */

/**
 * kind 에 따른 표 컬럼 설정.
 * 각 컬럼: { key: 데이터 키, label: 헤더 라벨 }
 */
const KIND_COLUMNS = {
  point_history: [
    { key: 'date', label: '날짜' },
    { key: 'amount', label: '금액' },
    { key: 'type', label: '구분' },
    { key: 'source', label: '출처' },
  ],
  attendance: [
    { key: 'date', label: '날짜' },
    { key: 'points', label: '포인트' },
    { key: 'streak', label: '연속' },
  ],
  subscription: [
    { key: 'plan', label: '플랜' },
    { key: 'status', label: '상태' },
    { key: 'expires_at', label: '만료일' },
    { key: 'remaining_ai', label: '잔여 AI' },
  ],
  ai_quota: [
    { key: 'type', label: '구분' },
    { key: 'remaining', label: '잔여' },
    { key: 'limit', label: '한도' },
    { key: 'reset_cycle', label: '리셋 주기' },
  ],
  grade: [
    { key: 'grade', label: '등급' },
    { key: 'points', label: '포인트' },
    { key: 'daily_ai', label: '일일 AI' },
    { key: 'reward_rate', label: '리워드 배율' },
  ],
  orders: [
    { key: 'date', label: '날짜' },
    { key: 'amount', label: '금액' },
    { key: 'status', label: '상태' },
    { key: 'product', label: '상품' },
  ],
  tickets: [
    { key: 'id', label: '번호' },
    { key: 'title', label: '제목' },
    { key: 'status', label: '상태' },
    { key: 'date', label: '날짜' },
  ],
  activity: [
    { key: 'date', label: '날짜' },
    { key: 'action', label: '활동' },
    { key: 'detail', label: '상세' },
  ],
};

/** kind 한국어 라벨 */
const KIND_LABELS = {
  point_history: '포인트 이력',
  attendance:    '출석 기록',
  subscription:  '구독 상태',
  ai_quota:      'AI 쿼터',
  grade:         '등급 정보',
  orders:        '주문 내역',
  tickets:       '문의 내역',
  activity:      '활동 기록',
};

/** 한 번에 표시할 최대 행 수 */
const PAGE_SIZE = 5;

/* ── 셀 값 포맷터 ── */

/**
 * 셀 값을 안전하게 표시용 문자열로 변환한다.
 *
 * @param {*} value - 원본 값
 * @returns {string} 표시 문자열
 */
function formatCell(value) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? '예' : '아니오';
  if (typeof value === 'object') {
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return String(value);
}

/* ── 메인 컴포넌트 ── */

export default function PersonalDataCard({ kind, summary, items }) {
  const [page, setPage] = useState(0);

  /* 유효하지 않은 데이터면 렌더 스킵 */
  if (!kind || !Array.isArray(items)) return null;

  /* kind 에 맞는 컬럼 설정, 없으면 항목 첫 행 키 기반으로 동적 생성 */
  const columns = KIND_COLUMNS[kind] || (
    items.length > 0
      ? Object.keys(items[0]).map((k) => ({ key: k, label: k }))
      : []
  );

  if (columns.length === 0) return null;

  /* 빈 결과 처리 */
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <HeaderIcon aria-hidden="true">📊</HeaderIcon>
          <HeaderText>{KIND_LABELS[kind] || kind}</HeaderText>
          {summary && <HeaderSummary>{summary}</HeaderSummary>}
        </CardHeader>
        <EmptyMsg>조회된 내역이 없어요.</EmptyMsg>
      </Card>
    );
  }

  /* 페이지네이션 */
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const pageItems = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;

  return (
    <Card>
      {/* 카드 헤더 */}
      <CardHeader>
        <HeaderIcon aria-hidden="true">📊</HeaderIcon>
        <HeaderText>{KIND_LABELS[kind] || kind}</HeaderText>
        <HeaderCount>{items.length}건</HeaderCount>
      </CardHeader>

      {/* 요약 문구 */}
      {summary && <SummaryBar>{summary}</SummaryBar>}

      {/* 표 */}
      <TableScroll>
        <Table>
          <thead>
            <tr>
              {columns.map((col) => (
                <Th key={col.key}>{col.label}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageItems.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {columns.map((col) => (
                  <Td key={col.key} title={formatCell(row[col.key])}>
                    {formatCell(row[col.key])}
                  </Td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </TableScroll>

      {/* 페이지네이션 (5건 초과 시) */}
      {totalPages > 1 && (
        <Pagination>
          <PageBtn
            type="button"
            onClick={() => setPage((p) => p - 1)}
            disabled={!hasPrev}
          >
            ‹
          </PageBtn>
          <PageInfo>
            {page + 1} / {totalPages}
          </PageInfo>
          <PageBtn
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext}
          >
            ›
          </PageBtn>
        </Pagination>
      )}
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

const HeaderSummary = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  flex: 1;
`;

const SummaryBar = styled.p`
  margin: 0;
  padding: 6px 12px;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textSecondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  background: ${({ theme }) => theme.colors.bgSecondary};
`;

const EmptyMsg = styled.p`
  margin: 0;
  padding: 16px 12px;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
`;

const TableScroll = styled.div`
  overflow-x: auto;
  max-height: 260px;
  overflow-y: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.typography.textXs};
`;

const Th = styled.th`
  text-align: left;
  padding: 6px 10px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderDefault};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
`;

const Td = styled.td`
  padding: 6px 10px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textPrimary};
  /* 긴 텍스트는 1줄로 잘라 표 형태 유지 + title 속성으로 전체 노출 */
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  tr:last-child & {
    border-bottom: none;
  }
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 12px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ theme }) => theme.colors.bgElevated};
`;

const PageBtn = styled.button`
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 2px 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  line-height: 1.4;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    border-color: #B5A5FF;
    color: #B5A5FF;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  min-width: 40px;
  text-align: center;
`;
