/**
 * 홈 진입 시 자동 표시되는 공지 팝업/모달 컴포넌트 (2026-04-15 신규).
 *
 * <p>관리자가 등록한 공지 중 {@code displayType === 'POPUP'} 또는
 * {@code 'MODAL'} 에 해당하는 것을 홈 진입 시 한 번에 하나씩 표시한다.
 * BANNER 는 홈 상단 카드로 별도 노출되며 이 컴포넌트 대상 아님.</p>
 *
 * <h3>variant 별 차이</h3>
 * <table>
 *   <tr><th></th><th>POPUP</th><th>MODAL (중요)</th></tr>
 *   <tr><td>배경 클릭/ESC/× 로 닫기</td><td>가능</td><td><b>불가</b> (확인 버튼만)</td></tr>
 *   <tr><td>강조 톤</td><td>기본</td><td>빨강 액센트 + "중요 공지" 배지</td></tr>
 *   <tr><td>주 버튼</td><td>[닫기]</td><td>[확인]</td></tr>
 *   <tr><td>보조 버튼</td><td>[다시 보지 않기]</td><td>[다시 보지 않기]</td></tr>
 * </table>
 *
 * <h3>닫기 정책 (noticeSuppression 유틸 연동)</h3>
 * <ul>
 *   <li><b>다시 보지 않기</b> → {@link suppressNoticePermanent} — localStorage 영구 기록</li>
 *   <li><b>닫기 / 확인</b>     → {@link suppressNoticeFor24h}   — 24시간 동안 억제</li>
 * </ul>
 *
 * <p>상위 HomePage 가 큐 형태로 공지를 순차 전달한다 (MODAL 우선, priority DESC).</p>
 */

import { useCallback, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  suppressNoticePermanent,
  suppressNoticeFor24h,
} from '../../../shared/utils/noticeSuppression';

/** 퇴장 애니메이션 지속 시간 (ms) — 타이머 기반 언마운트 대비 (현재는 즉시 onClose) */
// const CLOSE_ANIMATION_MS = 200;

/**
 * @param {Object} props
 * @param {Object} props.notice - NoticeResponse DTO
 * @param {'popup'|'modal'} props.variant - 노출 방식 (POPUP/MODAL)
 * @param {() => void} props.onClose - 닫기 후 호출 (부모가 다음 큐 아이템 표시)
 */
export default function NoticeAnnouncementModal({ notice, variant, onClose }) {
  const isModal = variant === 'modal';

  /**
   * "닫기" / "확인" — 24시간 억제 후 닫는다.
   * MODAL 도 "확인" 은 24시간 억제. (사용자가 "전부 다시보지 않음 버튼 존재" 라고 지시 →
   * "다시 보지 않기" 로 영구 억제가 별도 존재하므로, "확인" 은 24시간만 억제해 중복 없이
   * 다음 방문에 다시 볼 수 있게 한다.)
   */
  const handleSoftClose = useCallback(() => {
    suppressNoticeFor24h(notice.noticeId);
    onClose?.();
  }, [notice.noticeId, onClose]);

  /** "다시 보지 않기" — 영구 억제 후 닫는다. */
  const handlePermanentDismiss = useCallback(() => {
    suppressNoticePermanent(notice.noticeId);
    onClose?.();
  }, [notice.noticeId, onClose]);

  /** 오버레이 클릭 — POPUP 만 닫기 허용. MODAL 은 무시. */
  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target !== e.currentTarget) return;
      if (isModal) return; // MODAL 은 배경 클릭 비활성
      handleSoftClose();
    },
    [isModal, handleSoftClose],
  );

  /** ESC 키 — POPUP 만 닫기 허용 */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (isModal) return;
      handleSoftClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModal, handleSoftClose]);

  /** 공지 모달 열려 있는 동안 body 스크롤 잠금 */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!notice) return null;

  return (
    <>
      <Overlay onClick={handleOverlayClick} aria-hidden="true" />
      <Container
        role="dialog"
        aria-modal="true"
        aria-labelledby="notice-announcement-title"
        $modal={isModal}
      >
        <Header>
          {isModal ? (
            <ImportantBadge>⚠️ 중요 공지</ImportantBadge>
          ) : (
            <NoticeBadge>📣 공지</NoticeBadge>
          )}
          {/* POPUP 은 우상단 × 버튼으로도 닫을 수 있음. MODAL 은 × 미노출. */}
          {!isModal && (
            <CloseX
              type="button"
              aria-label="닫기 (24시간 동안 다시 표시되지 않음)"
              onClick={handleSoftClose}
            >
              ✕
            </CloseX>
          )}
        </Header>

        <Title id="notice-announcement-title">
          {notice.title || '공지사항'}
        </Title>

        {notice.imageUrl && (
          <BodyImage src={notice.imageUrl} alt="" loading="lazy" />
        )}

        <Body>{notice.content || ''}</Body>

        {notice.linkUrl && (
          <LinkRow>
            <ExternalLink
              href={notice.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              관련 링크 바로가기 →
            </ExternalLink>
          </LinkRow>
        )}

        <Footer>
          {/* 좌측: "다시 보지 않기" — 영구 억제 (POPUP/MODAL 공통) */}
          <SecondaryBtn type="button" onClick={handlePermanentDismiss}>
            다시 보지 않기
          </SecondaryBtn>

          {/* 우측: MODAL=확인 / POPUP=닫기 — 24시간 억제 */}
          <PrimaryBtn
            type="button"
            onClick={handleSoftClose}
            $modal={isModal}
            autoFocus
          >
            {isModal ? '확인했습니다' : '닫기'}
          </PrimaryBtn>
        </Footer>
      </Container>
    </>
  );
}

/* ────────────────────────────────────────────────
 * styled-components
 * Modal.styled 의 디자인 토큰 패턴을 따르되, 공지 전용으로
 * Header/Badge/ImageSlot 을 추가 구성.
 * ──────────────────────────────────────────────── */

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.96); }
  to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 9998;
  animation: ${fadeIn} 0.2s ease forwards;
`;

const Container = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;

  width: min(480px, calc(100vw - 32px));
  max-height: calc(100vh - 64px);
  overflow-y: auto;

  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.bgElevated};
  color: ${({ theme }) => theme.colors.textPrimary};
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);

  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};

  animation: ${scaleIn} 0.22s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;

  ${({ $modal }) => $modal && css`
    border: 2px solid rgba(239, 68, 68, 0.6); /* MODAL 빨강 액센트 */
  `}
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const badgeBase = css`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  border-radius: ${({ theme }) => theme.radius.full};
`;

const NoticeBadge = styled.span`
  ${badgeBase};
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.35);
`;

const ImportantBadge = styled.span`
  ${badgeBase};
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.45);
`;

const CloseX = styled.button`
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  background: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
    background: ${({ theme }) => theme.colors.bgTertiary};
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.4;
  word-break: keep-all;
`;

const BodyImage = styled.img`
  width: 100%;
  max-height: 280px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.radius.md};
`;

const Body = styled.div`
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: pre-wrap; /* 관리자 입력 줄바꿈 유지 */
  word-break: break-word;
  max-height: 40vh;
  overflow-y: auto;
`;

const LinkRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const ExternalLink = styled.a`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.borderDefault};
`;

const SecondaryBtn = styled.button`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
    border-color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const PrimaryBtn = styled.button`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: #fff;
  background: ${({ $modal, theme }) =>
    $modal
      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
      : theme.gradients.primary};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: transform ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;
