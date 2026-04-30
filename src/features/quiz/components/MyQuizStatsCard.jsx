import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import useAuthStore from '../../../shared/stores/useAuthStore';
import { getMyQuizStats } from '../api/quizApi';

const EMPTY_STATS = {
  totalAttempts: 0,
  correctCount: 0,
  accuracyRate: 0,
  totalEarnedPoints: 0,
  lastAttemptedAt: null,
};

function formatLastAt(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const today = new Date();
    const sameDay =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
    if (sameDay) {
      return `오늘 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  } catch {
    return '—';
  }
}

function getMotivationText(accuracyPct, totalAttempts) {
  if (totalAttempts === 0) return '첫 퀴즈를 풀어보세요!';
  if (accuracyPct >= 90) return '영화 마스터! 대단해요';
  if (accuracyPct >= 70) return '꽤 잘 알고 있네요';
  if (accuracyPct >= 50) return '계속 도전해보세요';
  return '퀴즈로 영화 지식을 쌓아가세요';
}

export default function MyQuizStatsCard({ refreshKey }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setHidden(false);
      try {
        const res = await getMyQuizStats();
        if (cancelled) return;
        const payload = res?.totalAttempts !== undefined ? res : (res?.data ?? EMPTY_STATS);
        setStats({ ...EMPTY_STATS, ...payload });
      } catch {
        if (!cancelled) setHidden(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [isAuthenticated, refreshKey]);

  if (!isAuthenticated || hidden) return null;

  const accuracyPct =
    stats.totalAttempts === 0
      ? null
      : Math.round((stats.accuracyRate ?? 0) * 1000) / 10;

  const motivation = getMotivationText(accuracyPct, stats.totalAttempts);

  return (
    <Wrapper aria-label="내 퀴즈 응시 현황">
      <CardTop>
        <TopLeft>
          <TopLabel>내 퀴즈 현황</TopLabel>
          {!collapsed && (
            <Motivation>{loading ? '불러오는 중…' : motivation}</Motivation>
          )}
        </TopLeft>
        <ToggleBtn
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
        >
          {collapsed ? '펼치기' : '접기'}
          <Chevron $open={!collapsed}>›</Chevron>
        </ToggleBtn>
      </CardTop>

      {!collapsed && (
        <>
          <Divider />
          <Grid>
            <Cell>
              <CellLabel>총 응시</CellLabel>
              <CellValue>{loading ? '—' : stats.totalAttempts}</CellValue>
            </Cell>

            <Cell $accent>
              <CellLabel>정답률</CellLabel>
              <CellValue $accent>
                {loading || accuracyPct === null ? '—' : `${accuracyPct}%`}
              </CellValue>
              {!loading && stats.totalAttempts > 0 && (
                <ProgressBar>
                  <ProgressFill $pct={accuracyPct ?? 0} />
                </ProgressBar>
              )}
            </Cell>

            <Cell>
              <CellLabel>획득 포인트</CellLabel>
              <CellValue>{loading ? '—' : stats.totalEarnedPoints}</CellValue>
            </Cell>

            <Cell>
              <CellLabel>마지막 응시</CellLabel>
              <CellValue $sm>{loading ? '—' : formatLastAt(stats.lastAttemptedAt)}</CellValue>
            </Cell>
          </Grid>

          {!loading && stats.totalAttempts > 0 && (
            <CorrectChip>
              정답 {stats.correctCount}문제 · 오답 {stats.totalAttempts - stats.correctCount}문제
            </CorrectChip>
          )}
        </>
      )}
    </Wrapper>
  );
}

/* ── animations ─────────────────────────────────────── */
const fillAnim = keyframes`
  from { width: 0; }
`;

/* ── styled ──────────────────────────────────────────── */
const Wrapper = styled.section`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows?.sm || 'none'};
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const TopLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TopLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const Motivation = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
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

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.borderDefault};
  margin: ${({ theme }) => theme.spacing.md} 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const Cell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.xs};
  background: ${({ theme, $accent }) =>
    $accent ? theme.colors.primaryLight : theme.colors.bgSecondary};
  border: 1px solid ${({ theme, $accent }) =>
    $accent ? theme.colors.primary : theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  text-align: center;
`;

const CellValue = styled.span`
  font-size: ${({ $sm, theme }) =>
    $sm ? theme.typography.textSm : theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ $accent, theme }) =>
    $accent ? theme.colors.primary : theme.colors.textPrimary};
  word-break: break-all;
`;

const CellLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: ${({ theme }) => theme.colors.borderDefault};
  border-radius: 99px;
  overflow: hidden;
  margin-top: 2px;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${({ $pct }) => Math.min($pct, 100)}%;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 99px;
  animation: ${fillAnim} 0.8s ease;
`;

const CorrectChip = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
  text-align: center;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;
