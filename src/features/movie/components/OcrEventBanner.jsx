/**
 * 영화 상세 페이지 상단 "실관람 인증 진행 중" 배너 (2026-04-14 신규).
 *
 * <p>관리자가 등록한 OCR 이벤트가 현재 진행 중인 영화(ACTIVE + endDate > now)에
 * 대해서만 영화 상세 페이지 상단에 배너를 노출한다. 이벤트가 없으면
 * 상위에서 본 컴포넌트를 렌더링하지 않으므로 내부에서 따로 조건 분기하지 않는다.</p>
 *
 * <h3>목적</h3>
 * AI 추천·검색·찜·커뮤니티 등 어디서 영화 상세로 진입했든 해당 영화에
 * 실관람 인증 이벤트가 걸려있다면 즉시 인증하러 갈 수 있도록 상단에 고정 노출한다.
 *
 * <h3>Props</h3>
 * <ul>
 *   <li>{@code event} — {@code getOcrEventByMovie()} 응답 객체
 *       (eventId/title/memo/startDate/endDate/status 등)</li>
 *   <li>{@code onVerifyClick} — "인증하러 가기" 클릭 핸들러 (모달 오픈 용)</li>
 * </ul>
 */

import styled, { keyframes } from 'styled-components';

/**
 * ISO 문자열 → "YYYY.MM.DD HH:mm" 포맷.
 * null/undefined 방어.
 */
function formatDateTime(iso) {
  if (!iso) return '';
  return iso.replace('T', ' ').substring(0, 16).replaceAll('-', '.');
}

export default function OcrEventBanner({ event, onVerifyClick }) {
  if (!event) return null;

  // 상태 배지 라벨 — ACTIVE(진행 중) / READY(시작 예정)
  // 배너 노출 조건이 "진행 중 영화"이므로 READY 는 사실상 등장하지 않지만,
  // 백엔드 레이스 컨디션 대비로 기본 값을 남겨둔다.
  const statusLabel = event.status === 'ACTIVE' ? '진행 중' : '시작 예정';
  const canVerify = event.status === 'ACTIVE';

  return (
    <Banner role="region" aria-label="실관람 인증 이벤트 안내">
      <LeftCol>
        <TopRow>
          <TicketIcon aria-hidden="true">🎟️</TicketIcon>
          <StatusBadge $active={canVerify}>{statusLabel}</StatusBadge>
          <EventTitle title={event.title}>{event.title || '실관람 인증 이벤트'}</EventTitle>
        </TopRow>

        <Description>
          <strong>현재 실관람 인증이 진행 중인 영화예요.</strong>
          <br />
          영화관 티켓(영수증)으로 관람을 인증하고 리워드를 받아보세요!
        </Description>

        {event.memo && <Memo>{event.memo}</Memo>}

        <Period>
          📅 {formatDateTime(event.startDate)} ~ {formatDateTime(event.endDate)}
        </Period>
      </LeftCol>

      <RightCol>
        <VerifyButton
          type="button"
          onClick={onVerifyClick}
          disabled={!canVerify}
          aria-label="실관람 인증하러 가기"
        >
          인증하러 가기
          <ArrowIcon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                     strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </ArrowIcon>
        </VerifyButton>
        {!canVerify && <ReadyHint>시작 전입니다</ReadyHint>}
      </RightCol>
    </Banner>
  );
}

/* ── styled-components ── */

const shimmer = keyframes`
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

/**
 * 전체 배너 — primary 그라데이션 + 좌/우 2단 레이아웃.
 * 모바일에서는 세로 스택으로 전환.
 */
const Banner = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.xl}`};
  background: linear-gradient(
    110deg,
    ${({ theme }) => theme.colors.primaryLight} 0%,
    ${({ theme }) => theme.colors.bgElevated} 60%,
    ${({ theme }) => theme.colors.primaryLight} 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 12s ease-in-out infinite;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};

  /* 모바일 — 세로 스택 */
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const LeftCol = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`;

const TicketIcon = styled.span`
  font-size: 22px;
  line-height: 1;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.success : theme.colors.warning};
  border-radius: 10px;
  white-space: nowrap;
`;

const EventTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
`;

const Description = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;

  strong {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: ${({ theme }) => theme.typography.fontSemibold};
  }
`;

const Memo = styled.p`
  margin: 2px 0 0;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: pre-wrap;
`;

const Period = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
`;

const RightCol = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;

  @media (max-width: 640px) {
    align-items: stretch;
  }
`;

const VerifyButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  white-space: nowrap;

  &:hover:not(:disabled) {
    filter: brightness(1.08);
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.16);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const ArrowIcon = styled.svg`
  width: 16px;
  height: 16px;
`;

const ReadyHint = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
`;
