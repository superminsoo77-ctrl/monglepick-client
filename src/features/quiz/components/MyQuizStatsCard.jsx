/**
 * 내 퀴즈 응시 현황 카드 (2026-04-29 신규).
 *
 * <p>QuizPage 상단에 마운트되어 로그인 사용자의 응시 KPI 4종을 보여준다.</p>
 *
 * <h3>KPI</h3>
 * <ul>
 *   <li>총 응시</li>
 *   <li>정답률 (모수 0 시 '—')</li>
 *   <li>획득 포인트</li>
 *   <li>마지막 응시 (없으면 '—')</li>
 * </ul>
 *
 * <h3>비로그인 처리</h3>
 * <p>useAuthStore 의 isAuthenticated 가 false 면 컴포넌트 자체를 null 렌더 — 부모 페이지에
 * 영향 없이 자연스럽게 숨김. 로그인 후 페이지 재방문 시 자동 노출된다.</p>
 *
 * <h3>로딩/에러</h3>
 * <p>마운트 직후 1회 GET /api/v1/quizzes/me/stats 호출.
 * 로딩 중에는 placeholder('—'), 에러 발생 시에는 카드 자체를 숨겨 사용자 흐름을 방해하지 않는다.</p>
 *
 * <h3>refreshKey</h3>
 * <p>QuizPage 가 정답 제출 후 카드를 강제 갱신하고 싶다면 prop 으로 키를 변경하면 된다
 * (현재 단계에선 마운트 시 1회만 갱신).</p>
 *
 * @module features/quiz/components/MyQuizStatsCard
 *
 * @param {Object} [props]
 * @param {number|string} [props.refreshKey] 강제 리페치용 키 (변경 시 useEffect 재실행)
 */

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import useAuthStore from '../../../shared/stores/useAuthStore';
import { getMyQuizStats } from '../api/quizApi';

/** 비로그인 / 로딩 / 에러 상태에서 사용할 fallback 값 */
const EMPTY_STATS = {
  totalAttempts: 0,
  correctCount: 0,
  accuracyRate: 0,
  totalEarnedPoints: 0,
  lastAttemptedAt: null,
};

/**
 * 마지막 응시 시각을 친근한 한국어 포맷으로 변환한다.
 * - 없으면 '—'
 * - 오늘이면 'HH:mm'
 * - 그 외 'YYYY.MM.DD'
 */
function formatLastAttemptedAt(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const today = new Date();
    const sameDay =
      d.getFullYear() === today.getFullYear()
      && d.getMonth() === today.getMonth()
      && d.getDate() === today.getDate();
    if (sameDay) {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `오늘 ${hh}:${mm}`;
    }
    const yyyy = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${yyyy}.${mo}.${day}`;
  } catch {
    return '—';
  }
}

export default function MyQuizStatsCard({ refreshKey }) {
  /* 인증 여부 — getter 형태이므로 selector 안에서 호출 */
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  /* 에러 시 카드 자체를 숨기기 위한 플래그 */
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    /* 비로그인 사용자는 호출 자체를 하지 않는다 — null 렌더 가드가 처리.
       react-hooks/set-state-in-effect 규칙: effect body 의 직접 setState 금지.
       모든 setState 는 async 함수 안에서 호출하여 lint 통과 + cascading render 방지. */
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
        /* 인증 만료 등 — 카드 숨겨 사용자 흐름을 방해하지 않음 */
        if (!cancelled) setHidden(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [isAuthenticated, refreshKey]);

  /* 비로그인 또는 에러로 숨김 */
  if (!isAuthenticated || hidden) return null;

  const accuracyPct = stats.totalAttempts === 0
    ? null
    : Math.round((stats.accuracyRate ?? 0) * 1000) / 10;

  return (
    <Wrapper aria-label="내 퀴즈 응시 현황">
      <Title>내 응시 현황</Title>
      <Grid>
        <Cell>
          <Label>총 응시</Label>
          <Value>{loading ? '—' : stats.totalAttempts}</Value>
          <Sub>회</Sub>
        </Cell>
        <Cell>
          <Label>정답률</Label>
          <Value>{loading || accuracyPct === null ? '—' : `${accuracyPct}%`}</Value>
          <Sub>
            {accuracyPct === null
              ? '응시 전'
              : `${stats.correctCount}/${stats.totalAttempts}`}
          </Sub>
        </Cell>
        <Cell>
          <Label>획득 포인트</Label>
          <Value>{loading ? '—' : stats.totalEarnedPoints}</Value>
          <Sub>P</Sub>
        </Cell>
        <Cell>
          <Label>마지막 응시</Label>
          <ValueSm>{loading ? '—' : formatLastAttemptedAt(stats.lastAttemptedAt)}</ValueSm>
        </Cell>
      </Grid>
    </Wrapper>
  );
}

/* ── styled-components ────────────────────────────────────── */

/* 주의: 이 프로젝트의 디자인 시스템 토큰은 다음 키 모양을 사용한다.
 *   - 폰트 크기: theme.typography.text{Xs,Sm,Base,Lg,Xl,2xl,...}
 *   - 폰트 두께: theme.typography.font{Normal,Medium,Semibold,Bold}
 *   - 테두리 색: theme.colors.borderDefault
 *   - 라운딩  : theme.radius.{sm,md,lg,xl,full}
 * `theme.fontSizes.*` / `theme.fontWeights.*` / `theme.colors.border` /
 * `theme.layout.cardRadius` 등은 이 프로젝트에 존재하지 않으며, 참조하면
 * undefined → "Cannot read properties of undefined" 로 화면 전체가 흰색이 된다.
 */
const Wrapper = styled.section`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Title = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

/* 셀 — 카드의 KPI 1개 박스. bgHover 토큰이 없어 bgSecondary 로 대체 */
const Cell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border-radius: ${({ theme }) => theme.radius.md};
`;

const Label = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

const Value = styled.span`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.primary};
`;

/* 마지막 응시는 길어질 수 있어 폰트를 살짝 줄인다 */
const ValueSm = styled.span`
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Sub = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;
