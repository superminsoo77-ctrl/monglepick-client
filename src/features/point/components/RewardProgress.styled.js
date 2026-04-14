/**
 * RewardProgress 컴포넌트 styled-components 정의.
 *
 * <p>2026-04-14(재개편) 시각 디자인 원칙:</p>
 * <ul>
 *   <li><b>정보 위계 강화</b> — 요약 KPI(3칸) → 활동 → 진행중 마일스톤 → 접힌 달성목록
 *       순으로 정보를 깎아서 "한눈에 파악"을 우선시.</li>
 *   <li><b>시인성 확대</b> — 게이지 6→10px, 큰 숫자(text2xl) 도입, 상태 Pill
 *       컬러 팔레트로 idle/partial/full 명확 구분.</li>
 *   <li><b>컬러 톤</b> — primary(보라) / warning(노랑) / success(초록) 3톤을
 *       tone prop 으로 switch 하여 일관성 유지.</li>
 * </ul>
 */

import styled, { css, keyframes } from 'styled-components';
import { media } from '../../../shared/styles/media';

/* ═══════════════════════════════════════════════════════════════
 *  유틸: tone → 컬러 매핑 (SummaryCard / Pill / Gauge 공용)
 * ═══════════════════════════════════════════════════════════════ */

/**
 * tone prop 별 테마 토큰 선택.
 * - primary: 기본 강조(보라)
 * - warning: 주의/기회(노랑)
 * - success: 완료/달성(초록)
 * - idle: 비활성/대기(회색)
 */
const toneColor = (theme, tone) => {
  switch (tone) {
    case 'success':
      return { fg: theme.colors.success, bg: theme.colors.successBg };
    case 'warning':
      return { fg: theme.colors.warning, bg: theme.colors.warningBg };
    case 'primary':
      return { fg: theme.colors.primary, bg: theme.colors.primaryBg ?? 'rgba(124, 108, 240, 0.1)' };
    case 'idle':
    default:
      return { fg: theme.colors.textMuted, bg: theme.colors.bgTertiary };
  }
};

/* ═══════════════════════════════════════════════════════════════
 *  섹션 기본 레이아웃
 * ═══════════════════════════════════════════════════════════════ */

export const Section = styled.section``;

export const HeaderRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

export const Hint = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/**
 * Block — 서브 섹션(활동/마일스톤/달성완료)을 감싸는 컨테이너.
 * Block 간 간격을 통일해서 섹션 내부에서도 리듬감 유지.
 */
export const Block = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.lg};

  &:first-of-type {
    margin-top: ${({ theme }) => theme.spacing.md};
  }
`;

export const SubSectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.xs} 0;
`;

/* ═══════════════════════════════════════════════════════════════
 *  1) 오늘의 요약 KPI (3칸)
 * ═══════════════════════════════════════════════════════════════ */

/**
 * 요약 카드 그리드 — 데스크탑 3열 / 태블릿 3열(좁게) / 모바일 1열.
 * grid-template-columns 에 minmax 를 쓰지 않고 repeat(3,1fr) 로 고정해
 * 3카드가 항상 한 줄에 같은 너비로 정렬되도록 한다.
 */
export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};

  ${media.mobile} {
    grid-template-columns: 1fr;
  }
`;

/**
 * 각 요약 카드 — tone 별로 좌측 bar 색상을 달리하여 시각 구분.
 * 카드 내부는 surface 배경 유지(가독성), 좌측 4px 세로 bar 로 포인트.
 */
export const SummaryCard = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== '$tone',
})`
  position: relative;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  overflow: hidden;

  /* 좌측 4px accent bar — tone 색상으로 강조 */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${({ theme, $tone }) => toneColor(theme, $tone).fg};
  }
`;

export const SummaryLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

/**
 * 요약 카드 메인 수치 — 숫자 크기를 키워 지표로서의 무게감 부여.
 */
export const SummaryValue = styled.div`
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.1;
  display: flex;
  align-items: baseline;
  gap: 2px;
`;

export const SummaryUnit = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const SummaryFoot = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/* ═══════════════════════════════════════════════════════════════
 *  공통: 상태 Pill (완료/진행중/대기/임박)
 * ═══════════════════════════════════════════════════════════════ */

/**
 * 상태 라벨 Pill — tone prop 으로 색상 분기.
 * - success: 초록 (완료)
 * - warning: 노랑 (진행중/임박)
 * - idle: 회색 (대기/카운팅)
 */
export const StatusPill = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== '$tone',
})`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  white-space: nowrap;
  ${({ $tone, theme }) => {
    const c = toneColor(theme, $tone);
    return css`
      background: ${c.bg};
      color: ${c.fg};
    `;
  }}
`;

/* ═══════════════════════════════════════════════════════════════
 *  2) 오늘의 활동 카드 그리드
 * ═══════════════════════════════════════════════════════════════ */

/**
 * 활동 카드 그리드 — 데스크탑 3열 / 태블릿 2열 / 모바일 1열.
 * 240→260px 로 늘려 카드 내부 큰 숫자 표시 영역 확보.
 */
export const ActivityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};

  ${media.mobile} {
    grid-template-columns: 1fr;
  }
`;

/**
 * 활동 카드 — 상태에 따라 border/배경 강조 수준을 달리한다.
 * - idle/partial: 기본 surface
 * - full: 미묘한 successBg 로 "완료감" 부여
 * - counting: 살짝 투명도로 우선순위 낮춤
 */
export const ActivityCard = styled.article.withConfig({
  shouldForwardProp: (prop) => prop !== '$status',
})`
  background: ${({ theme, $status }) =>
    $status === 'full' ? theme.colors.successBg : theme.colors.surface};
  border: 1px solid
    ${({ theme, $status }) =>
      $status === 'full' ? theme.colors.success : theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  opacity: ${({ $status }) => ($status === 'counting' ? 0.7 : 1)};
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows?.sm ?? '0 2px 8px rgba(0,0,0,0.06)'};
  }
`;

export const ActivityHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const ActivityName = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * 큰 숫자 표시 — "3 / 3" 형태로 한도 대비 진행도를 즉시 전달.
 * 누적 전용 정책은 "12 누적" 형태로 sub 에 라벨.
 */
export const BigCount = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const BigCountMain = styled.span`
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1;
`;

export const BigCountSub = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

/* 게이지 — 10px 로 굵게, radius로 부드럽게 */
export const GaugeTrack = styled.div`
  width: 100%;
  height: 10px;
  background: ${({ theme }) => theme.colors.bgTertiary};
  border-radius: ${({ theme }) => theme.radius.full};
  overflow: hidden;
`;

export const GaugeFill = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'percent' && prop !== '$status',
})`
  width: ${({ percent }) => Math.min(100, Math.max(0, percent))}%;
  height: 100%;
  border-radius: ${({ theme }) => theme.radius.full};
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: ${({ theme, $status }) => {
    if ($status === 'full') return theme.colors.success;
    if ($status === 'partial') return theme.colors.warning;
    return theme.gradients?.primary ?? theme.colors.primary;
  }};
`;

export const ActivityMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/** 연속 출석 등 스트릭 태그 — 강조 배경 */
export const StreakTag = styled.span`
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.warningBg};
  color: ${({ theme }) => theme.colors.warning};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
`;

/* ═══════════════════════════════════════════════════════════════
 *  3) 진행 중인 마일스톤 그리드
 * ═══════════════════════════════════════════════════════════════ */

/**
 * 마일스톤 그리드 — 데스크탑 2열 / 모바일 1열.
 * 기존 세로 리스트보다 스크롤 길이를 절반으로 축약.
 */
export const MilestoneGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};

  ${media.mobile} {
    grid-template-columns: 1fr;
  }
`;

/**
 * 마일스톤 카드 — $near(80%+) 일 때 warning 테두리로 "곧 달성" 강조.
 */
export const MilestoneCard = styled.article.withConfig({
  shouldForwardProp: (prop) => prop !== '$near',
})`
  background: ${({ theme, $near }) =>
    $near ? theme.colors.warningBg : theme.colors.surface};
  border: 1px solid
    ${({ theme, $near }) =>
      $near ? theme.colors.warning : theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows?.sm ?? '0 2px 8px rgba(0,0,0,0.06)'};
  }
`;

export const MilestoneHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const MilestoneTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** 보상 배지 — primary 색 강조 */
export const RewardBadge = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.primary};
  white-space: nowrap;
`;

/** 마일스톤 진행 텍스트 행 — "누적 12 / 30" + 우측 퍼센트 */
export const MilestoneProgress = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};

  strong {
    color: ${({ theme }) => theme.colors.textPrimary};
    font-weight: ${({ theme }) => theme.typography.fontBold};
  }
`;

export const PercentText = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const MilestoneDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
  line-height: 1.4;
`;

/* ═══════════════════════════════════════════════════════════════
 *  4) 달성 완료 마일스톤 (접기)
 * ═══════════════════════════════════════════════════════════════ */

/**
 * 토글 행 — 접기/펼치기 버튼.
 * 전체 폭을 차지하며 hover 시 배경 변화.
 */
export const ToggleRow = styled.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.bgTertiary};
  }
`;

/** 토글 아이콘 — $open=true 일 때 180도 회전 */
export const Chevron = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== '$open',
})`
  display: inline-block;
  transition: transform 0.2s ease;
  font-size: ${({ theme }) => theme.typography.textBase};
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
`;

/* 달성 완료 항목 리스트 — 콤팩트한 가로 한 줄 단순 표시 */
const expandIn = keyframes`
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export const AchievedList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  animation: ${expandIn} 0.2s ease-out;
`;

export const AchievedRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.successBg};
  border-radius: ${({ theme }) => theme.radius.sm};
`;

export const AchievedIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.success};
  color: white;
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  flex-shrink: 0;
`;

export const AchievedTitle = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const AchievedReward = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.success};
`;

/* ═══════════════════════════════════════════════════════════════
 *  빈 상태
 * ═══════════════════════════════════════════════════════════════ */

export const Empty = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px dashed ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
`;
