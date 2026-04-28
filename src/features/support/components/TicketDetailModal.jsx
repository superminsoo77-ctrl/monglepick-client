/**
 * 문의 내역 상세 보기 모달.
 *
 * "내 문의 내역" 탭에서 티켓 항목을 클릭하면 본 모달이 열려
 *   - 문의 본문(content)
 *   - 관리자/사용자 답변 이력(replies)
 *   - 처리 상태/카테고리/생성·해결·종료 시각
 * 을 한 화면에서 확인할 수 있다.
 *
 * 렌더링 전략 (createPortal):
 *   SupportPage 내부에는 backdrop-filter 글래스 카드가 있어, 그 자식 트리에
 *   position:fixed 를 두면 fixed 가 viewport 가 아닌 ancestor 기준으로 잡혀
 *   오버레이가 화면 일부에만 적용되는 버그가 발생한다. 이를 막기 위해 모달 전체를
 *   document.body 직속에 portal 로 마운트한다.
 *
 * 추가 UX 처리:
 *   - body scroll lock: 모달 열린 동안 배경 페이지가 스크롤되지 않도록
 *     overflow:hidden 을 잠시 걸고, 닫힐 때 원복한다 (StrictMode 의 effect 2회
 *     실행에도 안전하도록 cleanup 에서 원본 값을 복원).
 *   - 데이터 페칭: ticketId 변경 시 stale 표시 방지를 위해 detail 을 즉시 비우고,
 *     race condition 방지를 위해 cancel 플래그로 setState 가드를 둔다.
 *
 * @param {Object}   props
 * @param {number|string|null} props.ticketId - 열려 있는 티켓 ID. null/undefined 면 닫힘.
 * @param {Function} props.onClose - 닫기 콜백
 * @param {Object}   props.categoryLabelMap - 카테고리 코드 → 한국어 라벨 매핑
 * @param {Object}   props.statusLabelMap   - 상태 코드 → 한국어 라벨 매핑
 * @param {Function} props.formatDate       - 날짜 포맷팅 함수
 */

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getTicketDetail } from '../api/supportApi';
import * as S from './TicketDetailModal.styled';

export default function TicketDetailModal({
  ticketId,
  onClose,
  categoryLabelMap,
  statusLabelMap,
  formatDate,
}) {
  const isOpen = ticketId != null;

  /* ── 상세 데이터 로컬 상태 ── */
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ESC 키로 닫기 */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && isOpen) onClose?.();
    },
    [isOpen, onClose],
  );

  /* keydown 리스너는 모달 열려있는 동안만 등록 */
  useEffect(() => {
    if (!isOpen) return undefined;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  /* body scroll lock — 모달 열림 시 배경 스크롤 차단.
     이전 overflow 값을 보관 후 cleanup 에서 원복해 다른 컴포넌트와의 충돌을 막는다. */
  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  /* 티켓 상세 조회.
     - ticketId 변경 시 이전 응답을 즉시 비우고 새로 fetch
     - StrictMode/빠른 재오픈 race 방지를 위해 cancel 플래그로 setState 가드 */
  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelled = false;
    setDetail(null);
    setError(null);
    setIsLoading(true);

    (async () => {
      try {
        const data = await getTicketDetail(ticketId);
        if (cancelled) return;
        setDetail(data);
      } catch (err) {
        if (cancelled) return;
        console.warn('티켓 상세 조회 실패:', err?.message);
        setError(
          err?.status === 403
            ? '본인의 문의 내역만 조회할 수 있습니다.'
            : '문의 상세를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, ticketId]);

  if (!isOpen) return null;

  /* 오버레이 클릭 시 닫기 (컨테이너 내부 클릭은 버블링 차단) */
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  /* 답변 작성자 라벨 — 운영 화면 일관성을 위해 한국어 */
  const authorLabel = (authorType) =>
    authorType === 'ADMIN' ? '관리자' : '나';

  /* 모달 트리. createPortal 로 document.body 직속에 마운트한다. */
  const modalTree = (
    <S.Overlay onClick={handleOverlayClick}>
      <S.Container role="dialog" aria-modal="true" aria-labelledby="ticket-detail-title">
        <S.CloseButton onClick={onClose} aria-label="닫기" type="button">
          &#x2715;
        </S.CloseButton>

        {isLoading ? (
          <S.StateWrap>문의 상세를 불러오는 중...</S.StateWrap>
        ) : error ? (
          <S.StateWrap>
            <S.ErrorText>{error}</S.ErrorText>
          </S.StateWrap>
        ) : detail ? (
          <>
            {/* ── 헤더: 카테고리/상태 배지 + 제목 + 메타 ── */}
            <S.Header>
              <S.HeaderTopRow>
                <S.CategoryBadge>
                  {categoryLabelMap?.[detail.category] || detail.category}
                </S.CategoryBadge>
                <S.StatusBadge $status={detail.status}>
                  {statusLabelMap?.[detail.status] || detail.status}
                </S.StatusBadge>
              </S.HeaderTopRow>

              <S.Title id="ticket-detail-title">{detail.title}</S.Title>

              <S.MetaRow>
                <S.MetaItem>
                  <S.MetaLabel>접수</S.MetaLabel>
                  {formatDate ? formatDate(detail.createdAt) : detail.createdAt}
                </S.MetaItem>
                {detail.resolvedAt && (
                  <S.MetaItem>
                    <S.MetaLabel>해결</S.MetaLabel>
                    {formatDate ? formatDate(detail.resolvedAt) : detail.resolvedAt}
                  </S.MetaItem>
                )}
                {detail.closedAt && (
                  <S.MetaItem>
                    <S.MetaLabel>종료</S.MetaLabel>
                    {formatDate ? formatDate(detail.closedAt) : detail.closedAt}
                  </S.MetaItem>
                )}
              </S.MetaRow>
            </S.Header>

            {/* ── 본문 + 답변 이력 ── */}
            <S.Body>
              <S.SectionLabel>문의 내용</S.SectionLabel>
              <S.ContentBlock>{detail.content}</S.ContentBlock>

              <S.SectionLabel>
                답변 이력
                {Array.isArray(detail.replies) && detail.replies.length > 0
                  ? ` (${detail.replies.length})`
                  : ''}
              </S.SectionLabel>

              {Array.isArray(detail.replies) && detail.replies.length > 0 ? (
                <S.ReplyList>
                  {detail.replies.map((reply) => (
                    <S.ReplyItem key={reply.replyId} $authorType={reply.authorType}>
                      <S.ReplyAuthorRow>
                        <S.ReplyAuthorBadge $authorType={reply.authorType}>
                          {authorLabel(reply.authorType)}
                        </S.ReplyAuthorBadge>
                        <span>{formatDate ? formatDate(reply.createdAt) : reply.createdAt}</span>
                      </S.ReplyAuthorRow>
                      <S.ReplyBubble $authorType={reply.authorType}>
                        {reply.content}
                      </S.ReplyBubble>
                    </S.ReplyItem>
                  ))}
                </S.ReplyList>
              ) : (
                <S.NoReplyHint>
                  아직 관리자의 답변이 등록되지 않았습니다.
                  <br />
                  담당자가 확인 후 빠르게 답변드리겠습니다.
                </S.NoReplyHint>
              )}
            </S.Body>
          </>
        ) : (
          /* detail 이 null 인데 로딩/에러도 아닌 방어적 폴백 */
          <S.StateWrap>표시할 내용이 없습니다.</S.StateWrap>
        )}
      </S.Container>
    </S.Overlay>
  );

  /* SSR 환경 가드 — document 가 없으면 portal 생성 불가하므로 inline 렌더로 폴백.
     CRA/Vite SPA 환경에서는 항상 document 가 존재한다. */
  if (typeof document === 'undefined') return modalTree;
  return createPortal(modalTree, document.body);
}
