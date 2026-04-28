/**
 * TicketDetailModal 스타일.
 *
 * 설계 결정:
 *   - Overlay 는 createPortal 로 document.body 에 마운트되어 부모의
 *     transform/backdrop-filter 영향을 받지 않는다 (containing block 격리).
 *     SupportPage 내부에는 backdrop-filter 가 걸린 글래스 카드들이 있어,
 *     그 자식으로 position:fixed 를 두면 fixed 가 viewport 가 아닌 그 부모
 *     기준으로 잡혀 모달이 화면 일부에만 떠 보이는 버그가 발생했다.
 *   - 컨테이너 배경은 glass 가 아닌 단색(bgSecondary)을 사용해 본문과 명확히
 *     구분되도록 한다 — 글래스 효과는 ancestor 글래스 위에 겹치면 거의 보이지
 *     않는 문제가 있었다 (QA 2026-04-28).
 *   - 본문이 길어지면 Body 영역만 내부 스크롤하고, viewport 가 매우 작은
 *     모바일에서는 Overlay 자체에 스크롤을 허용해 잘림 없이 표시한다.
 *
 * 답변 말풍선:
 *   - $authorType="ADMIN" → 좌측, 회색 카드
 *   - $authorType="USER"  → 우측, primary 톤
 */

import styled from 'styled-components';
import { fadeInUp } from '../../../shared/styles/animations';
import { media } from '../../../shared/styles/media';

/* ── 상태 배지 색상 매핑 (TicketTab.styled 와 동일) ── */

function statusBg(status, theme) {
  switch (status) {
    case 'OPEN':        return theme.colors.infoBg;
    case 'IN_PROGRESS': return theme.colors.warningBg;
    case 'RESOLVED':    return theme.colors.successBg;
    case 'CLOSED':      return 'rgba(85, 85, 112, 0.15)';
    default:            return 'transparent';
  }
}

function statusColor(status, theme) {
  switch (status) {
    case 'OPEN':        return theme.colors.info;
    case 'IN_PROGRESS': return theme.colors.warning;
    case 'RESOLVED':    return theme.colors.success;
    case 'CLOSED':      return theme.colors.textMuted;
    default:            return theme.colors.textMuted;
  }
}

/* ── 오버레이/컨테이너 ── */

/**
 * 화면 전체를 덮는 dim 오버레이 — Portal 로 body 직속에 렌더된다.
 *
 * Container 가 viewport 보다 클 수도 있는 작은 화면 대응을 위해 자체에
 * overflow-y:auto 를 주고, 세로 가운데 정렬은 align-items:center 가 아닌
 * padding-top + min-height 조합으로 처리해 컨테이너 위쪽이 잘리지 않도록 한다.
 */
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  z-index: 1100;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: ${({ theme }) => theme.spacing.lg};
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;

  ${media.tablet} {
    padding: ${({ theme }) => theme.spacing.sm};
    align-items: stretch;
  }
`;

export const Container = styled.div`
  position: relative;
  width: 100%;
  max-width: 640px;
  margin: auto;
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
  overflow: hidden; /* 자식 border-radius 가 깔끔하게 잘리도록 */
  animation: ${fadeInUp} 0.22s ease forwards;
  /* viewport 가 충분히 클 때는 컨테이너 자체 높이를 90vh 로 제한해
     Body 영역이 내부 스크롤되도록 한다. */
  max-height: 90vh;

  ${media.tablet} {
    max-height: none;
    border-radius: ${({ theme }) => theme.radius.lg};
  }
`;

export const CloseButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.sm};
  right: ${({ theme }) => theme.spacing.sm};
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radius.full};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease;
  z-index: 2;

  &:hover {
    background: ${({ theme }) => theme.colors.bgCard};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

/* ── 헤더 ── */

export const Header = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  padding-right: 56px; /* CloseButton 과 겹치지 않도록 우측 여백 확보 */
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background-color: ${({ theme }) => theme.colors.bgCard};
`;

export const HeaderTopRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

export const CategoryBadge = styled.span`
  padding: 2px ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

export const StatusBadge = styled.span`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  background-color: ${({ $status, theme }) => statusBg($status, theme)};
  color: ${({ $status, theme }) => statusColor($status, theme)};
`;

export const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
  word-break: break-word;
  line-height: 1.45;
`;

export const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  margin-top: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

export const MetaLabel = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

/* ── 본문 영역 (스크롤 가능) ── */

export const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.lg};
`;

export const SectionLabel = styled.h4`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
`;

export const ContentBlock = styled.div`
  background-color: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

/* ── 답변 이력 ── */

export const ReplyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const ReplyItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: ${({ $authorType }) =>
    $authorType === 'USER' ? 'flex-end' : 'flex-start'};
`;

export const ReplyAuthorRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const ReplyAuthorBadge = styled.span`
  padding: 2px ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  background-color: ${({ $authorType, theme }) =>
    $authorType === 'ADMIN'
      ? theme.colors.primaryLight
      : 'rgba(85, 85, 112, 0.18)'};
  color: ${({ $authorType, theme }) =>
    $authorType === 'ADMIN' ? theme.colors.primary : theme.colors.textSecondary};
`;

export const ReplyBubble = styled.div`
  max-width: 86%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;

  background-color: ${({ $authorType, theme }) =>
    $authorType === 'ADMIN' ? theme.colors.bgCard : theme.colors.primaryLight};
  border: 1px solid
    ${({ $authorType, theme }) =>
      $authorType === 'ADMIN' ? theme.colors.borderDefault : 'transparent'};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const NoReplyHint = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.bgCard};
  border: 1px dashed ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.7;
`;

/* ── 로딩/에러 ── */

export const StateWrap = styled.div`
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.lg};
  text-align: center;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.error};
`;
