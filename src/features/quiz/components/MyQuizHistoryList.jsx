import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import useAuthStore from '../../../shared/stores/useAuthStore';
import { getMyQuizHistory } from '../api/quizApi';

const PAGE_SIZE = 5;

function formatSubmittedAt(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const today = new Date();
    const sameDay =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    if (sameDay) return `오늘 ${hh}:${mm}`;
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${hh}:${mm}`;
  } catch {
    return '—';
  }
}

function buildPageRange(currentPage, totalPages) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i);
  const half = 2;
  let start = Math.max(0, currentPage - half);
  let end = Math.min(totalPages - 1, currentPage + half);
  if (end - start < 4) {
    if (start === 0) end = Math.min(4, totalPages - 1);
    else start = Math.max(0, end - 4);
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default function MyQuizHistoryList({ refreshKey }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState(true);

  const fetchPage = useCallback(async (targetPage) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyQuizHistory({ page: targetPage, size: PAGE_SIZE });
      const payload = res?.content ? res : (res?.data ?? {});
      setItems(payload?.content ?? []);
      setPage(targetPage);
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

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchPage(0);
  }, [isAuthenticated, refreshKey, fetchPage]);

  if (!isAuthenticated) return null;

  const pageRange = buildPageRange(page, totalPages);

  return (
    <Wrapper aria-label="내 퀴즈 응시 이력">
      <SectionHeader>
        <HeaderLeft>
          <SectionTitle>응시 이력</SectionTitle>
          {totalElements > 0 && (
            <TotalBadge>총 {totalElements}건</TotalBadge>
          )}
        </HeaderLeft>
        <ToggleBtn
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
        >
          {collapsed ? '펼치기' : '접기'}
          <Chevron $open={!collapsed}>›</Chevron>
        </ToggleBtn>
      </SectionHeader>

      {!collapsed && (
        <>
          {/* 로딩 스켈레톤 */}
          {loading && (
            <SkeletonList>
              {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
            </SkeletonList>
          )}

          {/* 에러 */}
          {!loading && error && (
            <ErrorRow>
              {error}
              <RetryBtn type="button" onClick={() => fetchPage(page)}>
                다시 시도
              </RetryBtn>
            </ErrorRow>
          )}

          {/* 빈 상태 */}
          {!loading && !error && items.length === 0 && (
            <Empty>
              <EmptyText>아직 응시한 퀴즈가 없어요.</EmptyText>
              <EmptyText>위에서 첫 퀴즈를 풀어보세요!</EmptyText>
            </Empty>
          )}

          {/* 이력 목록 */}
          {!loading && items.length > 0 && (
            <List>
              {items.map((it, i) => (
                <Row key={`${it.quizId}-${i}`} $correct={it.isCorrect === true}>
                  <RowLeft>
                    <ResultBadge $correct={it.isCorrect}>
                      {it.isCorrect ? '정답' : '오답'}
                    </ResultBadge>
                    <QuestionText>{it.question || '문제 정보 없음'}</QuestionText>
                    {it.explanation && (
                      <Explanation>{it.explanation}</Explanation>
                    )}
                  </RowLeft>
                  <RowRight>
                    <AnswerBox $correct={it.isCorrect}>
                      <AnswerLabel>내 답</AnswerLabel>
                      <AnswerValue>{it.selectedOption ?? '—'}</AnswerValue>
                    </AnswerBox>
                    {!it.isCorrect && it.correctAnswer && (
                      <AnswerBox $isCorrectAnswer>
                        <AnswerLabel>정답</AnswerLabel>
                        <AnswerValue $highlight>{it.correctAnswer}</AnswerValue>
                      </AnswerBox>
                    )}
                    <TimeStamp>{formatSubmittedAt(it.submittedAt)}</TimeStamp>
                  </RowRight>
                </Row>
              ))}
            </List>
          )}

          {/* 페이지네이션 */}
          {!loading && !error && totalPages > 1 && (
            <Pagination>
              <PageBtn
                type="button"
                onClick={() => fetchPage(page - 1)}
                disabled={page === 0}
                aria-label="이전 페이지"
              >
                ‹
              </PageBtn>

              {pageRange.map((p) => (
                <PageBtn
                  key={p}
                  type="button"
                  $active={p === page}
                  onClick={() => fetchPage(p)}
                >
                  {p + 1}
                </PageBtn>
              ))}

              <PageBtn
                type="button"
                onClick={() => fetchPage(page + 1)}
                disabled={page >= totalPages - 1}
                aria-label="다음 페이지"
              >
                ›
              </PageBtn>
            </Pagination>
          )}
        </>
      )}
    </Wrapper>
  );
}

/* ── styled ──────────────────────────────────────────── */
const Wrapper = styled.section`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows?.sm || 'none'};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const TotalBadge = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
`;

const ToggleBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: transparent;
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Chevron = styled.span`
  display: inline-block;
  font-size: 14px;
  transform: rotate(${({ $open }) => ($open ? '-90deg' : '90deg')});
  transition: transform 0.2s;
  line-height: 1;
`;

const SkeletonList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const SkeletonRow = styled.div`
  height: 72px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.bgSecondary};
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme, $correct }) =>
    $correct ? theme.colors.success : theme.colors.error};
  background: ${({ theme, $correct }) =>
    $correct
      ? (theme.colors.successBg ?? 'rgba(72,187,120,0.06)')
      : (theme.colors.errorBg ?? 'rgba(229,62,62,0.06)')};

  @media (max-width: 540px) {
    flex-direction: column;
  }
`;

const RowLeft = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const RowRight = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
`;

const ResultBadge = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme, $correct }) =>
    $correct ? theme.colors.success : theme.colors.error};
  color: #fff;
  width: fit-content;
`;

const QuestionText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.5;
  word-break: keep-all;
`;

const Explanation = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  word-break: keep-all;
`;

const AnswerBox = styled.div`
  text-align: right;
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme, $isCorrectAnswer }) =>
    $isCorrectAnswer
      ? (theme.colors.successBg ?? 'rgba(72,187,120,0.1)')
      : theme.colors.bgSecondary};
  border: 1px solid ${({ theme, $isCorrectAnswer }) =>
    $isCorrectAnswer ? theme.colors.success : theme.colors.borderDefault};
`;

const AnswerLabel = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const AnswerValue = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme, $highlight }) =>
    $highlight ? theme.colors.success : theme.colors.textPrimary};
`;

const TimeStamp = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: ${({ theme }) => theme.spacing.xl} 0;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const EmptyText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ErrorRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.errorBg};
  border: 1px solid ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.error};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const RetryBtn = styled.button`
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

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.borderDefault};
`;

const PageBtn = styled.button`
  min-width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ $active, theme }) =>
    $active ? theme.typography.fontBold : theme.typography.fontMedium};
  border: 1px solid ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.borderDefault};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active, theme }) =>
    $active ? '#fff' : theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ $active, theme }) => ($active ? '#fff' : theme.colors.primary)};
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;
