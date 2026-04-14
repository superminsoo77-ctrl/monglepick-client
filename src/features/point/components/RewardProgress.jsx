/**
 * RewardProgress 컴포넌트 — "내 리워드 진행 현황" 섹션.
 *
 * <p>2026-04-14(재개편) UX 원칙: "지금 내가 뭘 하면 포인트를 받을 수 있는지"
 * 한눈에 보이도록 정보 위계를 재구성한다.</p>
 *
 * <h3>섹션 구성</h3>
 * <ol>
 *   <li><b>오늘의 요약 카드 (3칸 KPI)</b> — 오늘 받은 P / 더 받을 수 있는 P / 마일스톤 진행
 *       카드별 톤(primary·warning·success)으로 상태 즉시 인지.</li>
 *   <li><b>오늘의 활동</b> — dailyLimit 기반 활동 목록을 우선순위 정렬한다.
 *       1) 미진행(idle) → 2) 진행중(partial) → 3) 완료(full) → 4) 카운팅 전용(포인트 0).
 *       큰 숫자(3/3) + 10px 게이지 + 상태 Pill 로 시인성 확보.</li>
 *   <li><b>진행 중인 마일스톤</b> — 미달성 목록을 progressPercent 내림차순(=임박 우선).
 *       80%+ 는 "임박" 뱃지로 강조. 2열 그리드.</li>
 *   <li><b>달성 완료 마일스톤</b> — 기본 접힘. 토글 펼침 시 콤팩트 리스트(체크마크+이름+보상).</li>
 * </ol>
 *
 * <p>데이터가 아예 없을 땐 "표시할 진행 현황이 없습니다" 빈 상태를 표시한다.
 * 포인트 요약(잔액/누적/등급)은 상단 BalanceCard 에 이미 있으므로 여기선
 * "벌기" 지표에만 집중한다.</p>
 *
 * @param {Object} props
 * @param {Object|null} props.progress - UserRewardStatusResponse
 *   - activities: ActivityProgressResponse[]
 *   - milestones: MilestoneProgressResponse[]
 * @param {boolean} props.isLoading - 로딩 상태
 * @param {Function} props.formatNumber - 숫자 포맷터
 */

import { useMemo, useState } from 'react';
import Loading from '../../../shared/components/Loading/Loading';
import * as S from './RewardProgress.styled';

/**
 * threshold_target 코드를 현재값 라벨로 변환한다.
 * 예) TOTAL → "누적", DAILY → "오늘", STREAK → "연속"
 */
function thresholdLabel(target) {
  switch (target) {
    case 'TOTAL':
      return '누적';
    case 'DAILY':
      return '오늘';
    case 'STREAK':
      return '연속';
    default:
      return '';
  }
}

/**
 * 활동 카드의 상태를 분류한다.
 * - counting: 포인트 0 (카운팅 전용 정책)
 * - full: 일일 한도 소진
 * - partial: 일부 진행 (0 < today < limit)
 * - idle: 아직 시작 안 함
 */
function activityStatus(act) {
  const limit = act.dailyLimit ?? 0;
  const today = act.rewardedTodayCount ?? 0;
  const pts = act.pointsAmount ?? 0;
  if (pts <= 0) return 'counting';
  if (limit > 0 && today >= limit) return 'full';
  if (today > 0) return 'partial';
  return 'idle';
}

/** 정렬 우선순위(낮을수록 앞) — 미진행부터 먼저 노출. */
const STATUS_WEIGHT = { idle: 0, partial: 1, full: 2, counting: 3 };

/** 상태별 Pill 라벨. */
const STATUS_PILL = {
  idle: { tone: 'idle', label: '대기' },
  partial: { tone: 'warning', label: '진행중' },
  full: { tone: 'success', label: '완료' },
  counting: { tone: 'idle', label: '카운팅' },
};

export default function RewardProgress({ progress, isLoading, formatNumber }) {
  /* 달성 완료 마일스톤 접기/펼치기 토글 상태 (기본 접힘) */
  const [showCompleted, setShowCompleted] = useState(false);

  /* 활동 / 마일스톤 안전 기본값 */
  const activities = progress?.activities ?? [];
  const milestones = progress?.milestones ?? [];

  /**
   * 활동 정렬 — 상태 우선순위 → 포인트 내림차순
   * 사용자가 "다음에 뭘 할지" 를 가장 위에서 바로 확인할 수 있도록.
   */
  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => {
      const sa = STATUS_WEIGHT[activityStatus(a)];
      const sb = STATUS_WEIGHT[activityStatus(b)];
      if (sa !== sb) return sa - sb;
      return (b.pointsAmount ?? 0) - (a.pointsAmount ?? 0);
    });
  }, [activities]);

  /**
   * 마일스톤 분리 — 진행 중(progressPercent 내림차순) / 달성 완료.
   * 진행 중에서는 "임박"(80%+) 항목이 자연스럽게 상단에 배치된다.
   */
  const { pendingMilestones, achievedMilestones } = useMemo(() => {
    const pending = milestones
      .filter((m) => !m.achieved)
      .sort((a, b) => (b.progressPercent ?? 0) - (a.progressPercent ?? 0));
    const achieved = milestones.filter((m) => m.achieved);
    return { pendingMilestones: pending, achievedMilestones: achieved };
  }, [milestones]);

  /**
   * 오늘의 요약 KPI 계산.
   * - earnedToday: 이미 적립한 포인트 합 (rewardedToday × pointsAmount)
   * - remainingToday: 오늘 더 받을 수 있는 포인트 합 ((limit - today) × pointsAmount)
   * - activeOpportunities: 오늘 아직 여유가 있는 활동 수
   * dailyLimit 이 0(무제한)이면 remainingToday 에 반영하지 않고 opportunities 에만 포함.
   */
  const summary = useMemo(() => {
    let earnedToday = 0;
    let remainingToday = 0;
    let activeOpportunities = 0;

    for (const act of activities) {
      const pts = act.pointsAmount ?? 0;
      if (pts <= 0) continue; // 카운팅 전용은 요약에서 제외
      const limit = act.dailyLimit ?? 0;
      const today = act.rewardedTodayCount ?? 0;
      earnedToday += pts * today;
      if (limit > 0) {
        const remain = Math.max(0, limit - today);
        remainingToday += pts * remain;
        if (remain > 0) activeOpportunities += 1;
      } else {
        /* 한도 없는 정책(cooldown-only 등)은 오늘 한 번도 안 했을 때만 기회로 집계 */
        if (today === 0) activeOpportunities += 1;
      }
    }
    return { earnedToday, remainingToday, activeOpportunities };
  }, [activities]);

  if (isLoading) {
    return (
      <S.Section>
        <S.HeaderRow>
          <S.SectionTitle>내 리워드 진행 현황</S.SectionTitle>
        </S.HeaderRow>
        <Loading message="진행 현황 불러오는 중..." />
      </S.Section>
    );
  }

  /* 활동/마일스톤 모두 비어있으면 완전 빈 상태 */
  const isCompletelyEmpty = activities.length === 0 && milestones.length === 0;

  return (
    <S.Section>
      <S.HeaderRow>
        <S.SectionTitle>내 리워드 진행 현황</S.SectionTitle>
        <S.Hint>오늘 받을 수 있는 포인트를 한눈에 확인하세요</S.Hint>
      </S.HeaderRow>

      {isCompletelyEmpty ? (
        <S.Empty>표시할 진행 현황이 없습니다.</S.Empty>
      ) : (
        <>
          {/* ── 1) 오늘의 요약 KPI 3칸 ── */}
          <S.SummaryGrid>
            <S.SummaryCard $tone="primary">
              <S.SummaryLabel>오늘 받은 포인트</S.SummaryLabel>
              <S.SummaryValue>
                +{formatNumber(summary.earnedToday)}
                <S.SummaryUnit>P</S.SummaryUnit>
              </S.SummaryValue>
            </S.SummaryCard>
            <S.SummaryCard $tone="warning">
              <S.SummaryLabel>더 받을 수 있는 포인트</S.SummaryLabel>
              <S.SummaryValue>
                +{formatNumber(summary.remainingToday)}
                <S.SummaryUnit>P</S.SummaryUnit>
              </S.SummaryValue>
              <S.SummaryFoot>남은 기회 {summary.activeOpportunities}개</S.SummaryFoot>
            </S.SummaryCard>
            <S.SummaryCard $tone="success">
              <S.SummaryLabel>마일스톤</S.SummaryLabel>
              <S.SummaryValue>
                {achievedMilestones.length}
                <S.SummaryUnit>/{milestones.length}</S.SummaryUnit>
              </S.SummaryValue>
              <S.SummaryFoot>
                {pendingMilestones.length > 0
                  ? `진행 중 ${pendingMilestones.length}개`
                  : milestones.length > 0
                  ? '전부 달성 🎉'
                  : '—'}
              </S.SummaryFoot>
            </S.SummaryCard>
          </S.SummaryGrid>

          {/* ── 2) 오늘의 활동 ── */}
          {sortedActivities.length > 0 && (
            <S.Block>
              <S.SubSectionTitle>오늘의 활동</S.SubSectionTitle>
              <S.ActivityGrid>
                {sortedActivities.map((act) => {
                  const status = activityStatus(act);
                  const limit = act.dailyLimit ?? 0;
                  const today = act.rewardedTodayCount ?? 0;
                  const percent =
                    limit > 0 ? Math.min(100, Math.round((today * 100) / limit)) : 0;
                  const pill = STATUS_PILL[status];

                  return (
                    <S.ActivityCard key={act.actionType} $status={status}>
                      <S.ActivityHead>
                        <S.ActivityName>{act.activityName}</S.ActivityName>
                        <S.StatusPill $tone={pill.tone}>{pill.label}</S.StatusPill>
                      </S.ActivityHead>

                      {/* 큰 숫자 표시 — 한도 있으면 today/limit, 없으면 누적 */}
                      {limit > 0 ? (
                        <S.BigCount>
                          <S.BigCountMain>{today}</S.BigCountMain>
                          <S.BigCountSub>/ {limit}</S.BigCountSub>
                        </S.BigCount>
                      ) : (
                        <S.BigCount>
                          <S.BigCountMain>
                            {formatNumber(act.totalCount ?? 0)}
                          </S.BigCountMain>
                          <S.BigCountSub>누적</S.BigCountSub>
                        </S.BigCount>
                      )}

                      {/* 게이지 바 (한도 있을 때만) */}
                      {limit > 0 && (
                        <S.GaugeTrack>
                          <S.GaugeFill percent={percent} $status={status} />
                        </S.GaugeTrack>
                      )}

                      <S.ActivityMeta>
                        <span>
                          {act.pointsAmount > 0
                            ? `+${formatNumber(act.pointsAmount)}P / 회`
                            : '카운팅 전용'}
                        </span>
                        {act.currentStreak > 0 && (
                          <S.StreakTag>🔥 {act.currentStreak}일</S.StreakTag>
                        )}
                      </S.ActivityMeta>
                    </S.ActivityCard>
                  );
                })}
              </S.ActivityGrid>
            </S.Block>
          )}

          {/* ── 3) 진행 중인 마일스톤 ── */}
          {pendingMilestones.length > 0 && (
            <S.Block>
              <S.SubSectionTitle>진행 중인 마일스톤</S.SubSectionTitle>
              <S.MilestoneGrid>
                {pendingMilestones.map((m) => {
                  const percent = m.progressPercent ?? 0;
                  const current = m.currentValue ?? 0;
                  const threshold = m.thresholdCount ?? 0;
                  const targetLabel = thresholdLabel(m.thresholdTarget);
                  const isNear = percent >= 80; // 임박 강조 임계

                  return (
                    <S.MilestoneCard key={m.actionType} $near={isNear}>
                      <S.MilestoneHead>
                        <S.MilestoneTitle>{m.activityName}</S.MilestoneTitle>
                        {isNear ? (
                          <S.StatusPill $tone="warning">임박</S.StatusPill>
                        ) : (
                          m.pointsAmount > 0 && (
                            <S.RewardBadge>
                              +{formatNumber(m.pointsAmount)}P
                            </S.RewardBadge>
                          )
                        )}
                      </S.MilestoneHead>

                      <S.MilestoneProgress>
                        <span>
                          {targetLabel && `${targetLabel} `}
                          <strong>{formatNumber(current)}</strong> / {formatNumber(threshold)}
                        </span>
                        <S.PercentText>{percent}%</S.PercentText>
                      </S.MilestoneProgress>

                      <S.GaugeTrack>
                        <S.GaugeFill
                          percent={percent}
                          $status={isNear ? 'partial' : 'idle'}
                        />
                      </S.GaugeTrack>

                      {m.description && <S.MilestoneDesc>{m.description}</S.MilestoneDesc>}
                    </S.MilestoneCard>
                  );
                })}
              </S.MilestoneGrid>
            </S.Block>
          )}

          {/* ── 4) 달성 완료 마일스톤 (접기) ── */}
          {achievedMilestones.length > 0 && (
            <S.Block>
              <S.ToggleRow
                type="button"
                onClick={() => setShowCompleted((v) => !v)}
                aria-expanded={showCompleted}
              >
                <span>달성 완료 마일스톤 ({achievedMilestones.length})</span>
                <S.Chevron $open={showCompleted} aria-hidden="true">
                  ▾
                </S.Chevron>
              </S.ToggleRow>
              {showCompleted && (
                <S.AchievedList>
                  {achievedMilestones.map((m) => (
                    <S.AchievedRow key={m.actionType}>
                      <S.AchievedIcon aria-hidden="true">✓</S.AchievedIcon>
                      <S.AchievedTitle>{m.activityName}</S.AchievedTitle>
                      {m.pointsAmount > 0 && (
                        <S.AchievedReward>+{formatNumber(m.pointsAmount)}P</S.AchievedReward>
                      )}
                    </S.AchievedRow>
                  ))}
                </S.AchievedList>
              )}
            </S.Block>
          )}
        </>
      )}
    </S.Section>
  );
}
