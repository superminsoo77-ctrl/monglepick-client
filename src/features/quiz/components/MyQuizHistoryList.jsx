/**
 * 내 퀴즈 응시 이력 리스트 컴포넌트 (2026-04-29 신규).
 *
 * <p>QuizPage 의 "내 응시 현황" 카드 아래에 마운트되어 사용자 본인의 응시 이력을
 * 펼치기/접기 토글로 보여준다. 페이지당 5건씩, "더보기" 버튼으로 추가 페이지 누적 로드.</p>
 *
 * <h3>기능</h3>
 * <ul>
 *   <li>토글 버튼: 접힘 상태에서 "이력 보기 (N건)" → 펼치면 첫 페이지 자동 로드</li>
 *   <li>페이지 누적: "더보기" 버튼 클릭 시 다음 페이지 fetch 후 기존 리스트에 append</li>
 *   <li>각 row: 정답/오답 색상 구분 + 사용자 답 + 정답 + 해설 표시</li>
 *   <li>비로그인 시 null 렌더 — useAuthStore 가드</li>
 *   <li>refreshKey 변경 시 리스트 초기화 + 첫 페이지 재로드 (정답 제출 후 갱신용)</li>
 * </ul>
 *
 * <h3>로딩/에러</h3>
 * <p>로딩 중: skeleton 텍스트.
 * 에러 발생: 한 줄 에러 메시지 + "다시 시도" 버튼 (사용자 흐름 비방해).</p>
 *
 * @param {Object} [props]
 * @param {number|string} [props.refreshKey] 강제 리페치 트리거 (변경 시 첫 페이지부터 재로드)
 */

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import useAuthStore from '../../../shared/stores/useAuthStore';
import { getMyQuizHistory } from '../api/quizApi';

/** 페이지당 항목 수 — 한 화면에 너무 많으면 인지 부하 ↑ */
const PAGE_SIZE = 5;

/**
 * 제출 시각을 친근한 한국어 포맷으로 변환.
 * - 오늘이면 'HH:mm'
 * - 그 외 'M월 D일 HH:mm'
 */
function formatSubmittedAt(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const today = new Date();
    const sameDay =
      d.getFullYear() === today.getFullYear()
      && d.getMonth() === today.getMonth()
      && d.getDate() === today.getDate();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    if (sameDay) return `오늘 ${hh}:${mm}`;
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${hh}:${mm}`;
  } catch {
    return '—';
  }
}

export default function MyQuizHistoryList({ refreshKey }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  /** 펼침 여부 — 닫힘이 기본. 사용자가 직접 클릭해야 fetch 시작 */
  const [expanded, setExpanded] = useState(false);
  /** 누적된 응시 이력 row 배열 */
  const [items, setItems] = useState([]);
  /** 현재까지 로드된 페이지 번호 */
  const [page, setPage] = useState(0);
  /** 백엔드 응답의 totalElements (배지 카운트로 노출) */
  const [totalElements, setTotalElements] = useState(0);
  /** 백엔드 응답의 totalPages (다음 페이지 존재 여부 판단) */
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /** 첫 페이지 fetch — 펼침 / refreshKey 변경 시 호출 */
  const fetchFirstPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyQuizHistory({ page: 0, size: PAGE_SIZE });
      const payload = res?.content ? res : (res?.data ?? {});
      setItems(payload?.content ?? []);
      setPage(0);
      setTotalElements(payload?.totalElements ?? 0);
      setTotalPages(payload?.totalPages ?? 0);
    } catch (err) {
      const msg = err?.message?.includes('로그인')
        ? '로그인이 필요해요.'
        : err?.message || '이력을 불러오지 못했어요.';
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /** 다음 페이지 fetch — "더보기" 버튼 */
  const fetchNextPage = useCallback(async () => {
    if (loading) return;
    const next = page + 1;
    setLoading(true);
    setError(null);
    try {
      const res = await getMyQuizHistory({ page: next, size: PAGE_SIZE });
      const payload = res?.content ? res : (res?.data ?? {});
      /* 기존 리스트에 append 누적 — 무한 스크롤 대신 명시적 클릭 */
      setItems((prev) => [...prev, ...(payload?.content ?? [])]);
      setPage(next);
      setTotalPages(payload?.totalPages ?? totalPages);
    } catch (err) {
      setError(err?.message || '다음 페이지를 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, [page, loading, totalPages]);

  /* 펼치기 클릭 시 첫 페이지 로드 + refreshKey 변경 시 재로드 */
  useEffect(() => {
    if (!isAuthenticated) return;
    if (expanded) {
      fetchFirstPage();
    }
  }, [isAuthenticated, expanded, refreshKey, fetchFirstPage]);

  /* 미로그인 — 카드 자체 숨김 */
  if (!isAuthenticated) return null;

  const hasMore = page + 1 < totalPages;

  return (
    <Wrapper aria-label="내 퀴즈 응시 이력">
      {/* 헤더 토글 — 클릭 시 펼침/접힘 */}
      <Header onClick={() => setExpanded((v) => !v)} role="button" tabIndex={0}>
        <Title>내 응시 이력</Title>
        <RightSlot>
          {totalElements > 0 && <Count>{totalElements}건</Count>}
          <Caret aria-hidden $open={expanded}>▾</Caret>
        </RightSlot>
      </Header>

      {/* 펼침 시에만 본문 렌더 */}
      {expanded && (
        <Body>
          {/* 로딩 — 첫 페이지 fetching 중 */}
          {loading && items.length === 0 && (
            <Skeleton>불러오는 중…</Skeleton>
          )}

          {/* 에러 */}
          {!loading && error && (
            <ErrorRow>
              {error}
              <RetryButton type="button" onClick={fetchFirstPage}>
                다시 시도
              </RetryButton>
            </ErrorRow>
          )}

          {/* 빈 상태 */}
          {!loading && !error && items.length === 0 && (
            <Empty>
              아직 응시한 퀴즈가 없어요. 위에서 한 문제 풀어보세요!
            </Empty>
          )}

          {/* 응시 이력 row 들 */}
          {items.length > 0 && (
            <List>
              {items.map((it, i) => (
                <Row
                  key={`${it.quizId}-${i}`}
                  $correct={it.isCorrect === true}
                  $wrong={it.isCorrect === false}
                >
                  <RowHead>
                    <RowTitle>{it.question || '문제 정보 없음'}</RowTitle>
                    <RowBadge $correct={it.isCorrect === true}>
                      {it.isCorrect ? '정답' : '오답'}
                    </RowBadge>
                  </RowHead>
                  <RowMeta>
                    <span>내 답: <strong>{it.selectedOption ?? '—'}</strong></span>
                    {!it.isCorrect && it.correctAnswer && (
                      <span>정답: <strong>{it.correctAnswer}</strong></span>
                    )}
                    <span>{formatSubmittedAt(it.submittedAt)}</span>
                  </RowMeta>
                  {it.explanation && (
                    <Explanation>{it.explanation}</Explanation>
                  )}
                </Row>
              ))}
            </List>
          )}

          {/* 더보기 버튼 — 다음 페이지가 있을 때만 */}
          {!error && hasMore && (
            <MoreButton type="button" onClick={fetchNextPage} disabled={loading}>
              {loading ? '불러오는 중…' : '더보기'}
            </MoreButton>
          )}
        </Body>
      )}
    </Wrapper>
  );
}

/* ── styled-components ────────────────────────────────────── */

/* 주의: 디자인 시스템 토큰은 typography.text(Xs/Sm/Base/Lg/Xl/...), typography.font(Medium/Semibold/Bold),
 * colors.borderDefault, radius.* 형태를 쓴다.
 * fontSizes.* / fontWeights.* / colors.border / layout.cardRadius / colors.bgHover 는
 * 이 프로젝트에 정의되어 있지 않으므로 참조 시 undefined → 화면 흰색(런타임 TypeError) 사고가 난다.
 * 모두 정상 토큰으로 대체한다.
 */
const Wrapper = styled.section`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  cursor: pointer;
  user-select: none;
  &:hover {
    background: ${({ theme }) => theme.colors.bgSecondary};
  }
`;

const Title = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const RightSlot = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Count = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Caret = styled.span`
  display: inline-block;
  transition: transform 0.2s ease;
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Body = styled.div`
  padding: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.borderDefault};
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

/* 정/오답 row 는 의미 색을 강조하기 위해 success/error 토큰의 Bg/본색을 사용한다.
 * 라이트/다크 모두에서 자연스럽게 보이며, 이전의 하드코딩 hex(#ecfdf5 등)는 다크모드에서 가독성 문제. */
const Row = styled.div`
  border: 1px solid
    ${({ theme, $correct, $wrong }) => {
      if ($correct) return theme.colors.success;
      if ($wrong) return theme.colors.error;
      return theme.colors.borderDefault;
    }};
  background: ${({ theme, $correct, $wrong }) => {
    if ($correct) return theme.colors.successBg;
    if ($wrong) return theme.colors.errorBg;
    return 'transparent';
  }};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
`;

const RowHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: 4px;
`;

const RowTitle = styled.div`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const RowBadge = styled.span`
  flex-shrink: 0;
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme, $correct }) => ($correct ? theme.colors.success : theme.colors.error)};
  color: #fff;
`;

const RowMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  strong {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-weight: ${({ theme }) => theme.typography.fontMedium};
  }
`;

const Explanation = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
`;

const Skeleton = styled.div`
  padding: ${({ theme }) => theme.spacing.md} 0;
  text-align: center;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Empty = styled.div`
  padding: ${({ theme }) => theme.spacing.lg} 0;
  text-align: center;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ErrorRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.errorBg};
  border: 1px solid ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.error};
`;

const RetryButton = styled.button`
  flex-shrink: 0;
  padding: 4px 10px;
  background: ${({ theme }) => theme.colors.error};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.textXs};
  cursor: pointer;
  &:hover { opacity: 0.9; }
`;

const MoreButton = styled.button`
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: ${({ theme }) => theme.colors.bgTertiary};
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
