/**
 * 커뮤니티 "공지사항" 탭 피드 컴포넌트 (2026-04-15 신규).
 *
 * <p>앱 메인 BANNER/POPUP/MODAL 뿐 아니라 LIST_ONLY 공지까지 포함한
 * 전체 활성/기간 내 공지를 페이징 목록으로 노출한다. 유저가 공지 상세를
 * 보려면 아코디언 방식으로 인라인 펼침/접기 (모달/페이지 이동 없음).</p>
 *
 * <h3>딥링크 동작</h3>
 * <p>URL 쿼리 {@code ?tab=notices&noticeId={id}} 로 진입한 경우:</p>
 * <ol>
 *   <li>해당 공지가 현재 페이지 리스트에 있으면 → 자동 펼침 + 스크롤 + 하이라이트</li>
 *   <li>리스트에 없으면 → 별도 단건 조회 후 "딥링크 공지"로 상단 고정 표시</li>
 *   <li>존재하지 않거나 비공개/기간 외 → 안내 메시지 (리스트는 정상 표시)</li>
 * </ol>
 *
 * <p>홈 배너/슬라이드 클릭도 {@code linkUrl} 이 없으면 이 라우트로 진입해
 * 동일한 UX를 공유한다 (단일 진실 원본 원칙).</p>
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { getNoticeList, getNoticeDetail } from '../../../shared/api/noticeApi';
import EmptyState from '../../../shared/components/EmptyState/EmptyState';

/**
 * 노출 방식별 배지 라벨 (관리자 분류 가시화).
 * LIST_ONLY 는 기본 공지이므로 배지 생략.
 */
const DISPLAY_TYPE_BADGE = {
  BANNER: { label: '배너', color: '#3b82f6' },
  POPUP: { label: '팝업', color: '#8b5cf6' },
  MODAL: { label: '중요', color: '#ef4444' },
};

/**
 * 콘텐츠 카테고리 배지 (noticeType: NOTICE/UPDATE/MAINTENANCE/EVENT).
 * NOTICE 는 일반 공지라 별도 배지 생략.
 */
const NOTICE_TYPE_BADGE = {
  UPDATE: { label: '업데이트', color: '#10b981' },
  MAINTENANCE: { label: '점검', color: '#f59e0b' },
  EVENT: { label: '이벤트', color: '#ec4899' },
};

/** 페이지당 공지 수 — 공지는 읽기 위주라 20개 정도면 충분 */
const PAGE_SIZE = 20;

/**
 * ISO → "YYYY-MM-DD" 포맷. 시/분은 공지 목록에서는 생략해 가독성 확보.
 */
function formatDate(iso) {
  if (!iso) return '';
  return iso.substring(0, 10);
}

export default function NoticeFeed() {
  const [searchParams, setSearchParams] = useSearchParams();
  const deeplinkNoticeId = searchParams.get('noticeId');

  /** 공지 리스트 (현재 페이지) */
  const [notices, setNotices] = useState([]);
  /** 페이지 메타 (0-base page, totalPages) */
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /** 펼쳐진 공지 ID 집합 (복수 펼침 허용 — 사용자가 비교하며 읽기 편함) */
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  /** 딥링크 공지가 현재 페이지 리스트에 없을 때 단건 조회로 채워 상단 노출 */
  const [deeplinkedNotice, setDeeplinkedNotice] = useState(null);
  /** 딥링크 공지 로드 실패 메시지 (만료/비공개/존재 없음) */
  const [deeplinkError, setDeeplinkError] = useState(null);

  /** 하이라이트 스크롤 대상 DOM ref — Map<noticeId, element> */
  const cardRefs = useRef(new Map());

  /** 현재 페이지 공지 로드 */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getNoticeList({ page, size: PAGE_SIZE });
        if (cancelled) return;
        // Spring Data Page 직렬화 결과 — content/totalPages/number/size
        setNotices(Array.isArray(result?.content) ? result.content : []);
        setTotalPages(Math.max(result?.totalPages || 1, 1));
      } catch (err) {
        console.error('[NoticeFeed] 공지 리스트 로드 실패:', err);
        if (!cancelled) {
          setError(err?.message || '공지사항을 불러오지 못했습니다.');
          setNotices([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [page]);

  /**
   * 딥링크 처리.
   * 1) URL 에 noticeId 가 있고
   * 2) 현재 페이지 리스트 로드가 끝났을 때
   *    - 리스트에 있으면 → 그대로 펼침 + 스크롤
   *    - 없으면 → 단건 조회 후 deeplinkedNotice state 에 저장
   */
  useEffect(() => {
    if (!deeplinkNoticeId) {
      setDeeplinkedNotice(null);
      setDeeplinkError(null);
      return;
    }
    if (loading) return; // 리스트 로딩 중에는 보류

    const idNum = Number(deeplinkNoticeId);
    // 현재 페이지 리스트에 있는지 확인
    const inList = notices.some((n) => n.noticeId === idNum);
    if (inList) {
      // 리스트 내 카드로 스크롤 + 펼침
      setDeeplinkedNotice(null);
      setDeeplinkError(null);
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.add(idNum);
        return next;
      });
      // 레이아웃 반영 후 스크롤 (짧은 지연)
      requestAnimationFrame(() => {
        const el = cardRefs.current.get(idNum);
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      return;
    }

    // 리스트에 없으면 단건 조회
    let cancelled = false;
    (async () => {
      try {
        const detail = await getNoticeDetail(idNum);
        if (cancelled) return;
        setDeeplinkedNotice(detail);
        setDeeplinkError(null);
        setExpandedIds((prev) => {
          const next = new Set(prev);
          next.add(idNum);
          return next;
        });
      } catch (err) {
        console.warn('[NoticeFeed] 딥링크 공지 단건 조회 실패:', err);
        if (!cancelled) {
          setDeeplinkedNotice(null);
          setDeeplinkError(
            err?.response?.status === 404 || /찾을 수 없/i.test(err?.message || '')
              ? '요청하신 공지사항을 찾을 수 없습니다. 만료되었거나 비공개된 공지일 수 있어요.'
              : (err?.message || '공지 상세를 불러오지 못했습니다.')
          );
        }
      }
    })();
    return () => { cancelled = true; };
  }, [deeplinkNoticeId, loading, notices]);

  /** 카드 펼침/접기 토글 */
  const toggleExpand = useCallback((noticeId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(noticeId)) {
        next.delete(noticeId);
      } else {
        next.add(noticeId);
      }
      return next;
    });
  }, []);

  /**
   * 딥링크 배너 닫기 — URL 의 noticeId 쿼리 제거해 깔끔한 상태로 복귀.
   * tab 파라미터는 유지해 공지 탭에 머문다.
   */
  const closeDeeplink = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('noticeId');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  /** 카드 ref 수집용 — Map 에 (noticeId → element) 등록 */
  const registerCardRef = useCallback((noticeId) => (el) => {
    if (el) {
      cardRefs.current.set(noticeId, el);
    } else {
      cardRefs.current.delete(noticeId);
    }
  }, []);

  /**
   * 공지 카드 렌더 (공통 — 딥링크 섹션과 리스트 섹션에서 재사용).
   * @param {Object} notice 공지 DTO
   * @param {Object} options
   * @param {boolean} options.highlight - 하이라이트 애니메이션 적용 여부 (딥링크)
   */
  const renderCard = (notice, { highlight = false } = {}) => {
    const expanded = expandedIds.has(notice.noticeId);
    const displayBadge = DISPLAY_TYPE_BADGE[notice.displayType];
    const typeBadge = NOTICE_TYPE_BADGE[notice.noticeType];

    return (
      <Card
        key={notice.noticeId}
        ref={registerCardRef(notice.noticeId)}
        $highlight={highlight}
        $expanded={expanded}
      >
        <CardHeader
          type="button"
          onClick={() => toggleExpand(notice.noticeId)}
          aria-expanded={expanded}
        >
          <HeaderLeft>
            <BadgeRow>
              {notice.isPinned && <PinnedBadge>📌 고정</PinnedBadge>}
              {typeBadge && (
                <TypeBadge $color={typeBadge.color}>{typeBadge.label}</TypeBadge>
              )}
              {displayBadge && (
                <TypeBadge $color={displayBadge.color}>{displayBadge.label}</TypeBadge>
              )}
            </BadgeRow>
            <Title>{notice.title || '제목 없음'}</Title>
          </HeaderLeft>
          <HeaderRight>
            <DateText>{formatDate(notice.publishedAt || notice.createdAt)}</DateText>
            <ChevronIcon $expanded={expanded} aria-hidden="true">▾</ChevronIcon>
          </HeaderRight>
        </CardHeader>

        {expanded && (
          <CardBody>
            {notice.imageUrl && (
              <BodyImage src={notice.imageUrl} alt="" loading="lazy" />
            )}
            <BodyContent>{notice.content || '본문이 없습니다.'}</BodyContent>
            {notice.linkUrl && (
              <LinkRow>
                <BodyLink
                  href={notice.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  관련 링크 바로가기 →
                </BodyLink>
              </LinkRow>
            )}
          </CardBody>
        )}
      </Card>
    );
  };

  /* ── 렌더 분기 ── */

  if (loading) {
    return <LoadingMessage>공지사항을 불러오는 중...</LoadingMessage>;
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="공지사항을 불러오지 못했어요"
        description={error}
      />
    );
  }

  const showEmpty = notices.length === 0 && !deeplinkedNotice;

  return (
    <>
      <FeedHeader>
        <FeedTitle>공지사항</FeedTitle>
        <FeedDesc>서비스 운영/업데이트/이벤트 소식을 확인하세요.</FeedDesc>
      </FeedHeader>

      {/* 딥링크 섹션 — 현재 페이지에 없는 공지를 단건으로 상단에 표시 */}
      {deeplinkedNotice && (
        <DeeplinkSection>
          <DeeplinkHeader>
            <DeeplinkLabel>🔗 공유된 공지</DeeplinkLabel>
            <CloseDeeplinkBtn type="button" onClick={closeDeeplink}>닫기 ✕</CloseDeeplinkBtn>
          </DeeplinkHeader>
          {renderCard(deeplinkedNotice, { highlight: true })}
        </DeeplinkSection>
      )}

      {/* 딥링크 실패 안내 */}
      {deeplinkError && !deeplinkedNotice && (
        <DeeplinkErrorBox>
          <span>⚠️ {deeplinkError}</span>
          <CloseDeeplinkBtn type="button" onClick={closeDeeplink}>닫기 ✕</CloseDeeplinkBtn>
        </DeeplinkErrorBox>
      )}

      {showEmpty ? (
        <EmptyState
          icon="📣"
          title="등록된 공지사항이 없어요"
          description="새 공지가 등록되면 이곳에 표시됩니다."
        />
      ) : (
        <List>
          {notices.map((n) => renderCard(n, {
            // 딥링크 대상이 리스트 내에 있으면 그 카드에 하이라이트
            highlight: deeplinkNoticeId && Number(deeplinkNoticeId) === n.noticeId,
          }))}
        </List>
      )}

      {totalPages > 1 && (
        <Pagination>
          <PageBtn
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            ◀
          </PageBtn>
          {Array.from({ length: totalPages }, (_, i) => i).map((p) => (
            <PageBtn
              key={p}
              type="button"
              $active={p === page}
              onClick={() => setPage(p)}
            >
              {p + 1}
            </PageBtn>
          ))}
          <PageBtn
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            ▶
          </PageBtn>
        </Pagination>
      )}
    </>
  );
}

/* ────────────────────────────────────────────────
 * styled-components
 * 커뮤니티 다른 피드(OcrEventFeed/PlaylistShareFeed)의 톤과 맞춰
 * 토큰(theme.colors/typography/spacing/radius) 기반으로 작성.
 * ──────────────────────────────────────────────── */

/** 하이라이트 플래시 — 딥링크로 들어온 카드 잠시 강조 */
const highlightFlash = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.6); }
  40%  { box-shadow: 0 0 0 10px rgba(139, 92, 246, 0.25); }
  100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
`;

const FeedHeader = styled.div`
  margin-bottom: 16px;
`;

const FeedTitle = styled.h2`
  margin: 0 0 4px;
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const FeedDesc = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const LoadingMessage = styled.div`
  padding: 40px 0;
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/**
 * 공지 카드.
 * - 접힘: 헤더만 노출 (제목 + 배지 + 날짜)
 * - 펼침: 본문/이미지/링크 노출
 * - 딥링크 하이라이트: 진입 순간 펄스 애니메이션
 */
const Card = styled.div`
  border: 1px solid ${({ theme, $expanded }) =>
    $expanded ? theme.colors.primary : theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.bgElevated};
  transition: border-color ${({ theme }) => theme.transitions.fast};
  overflow: hidden;

  ${({ $highlight }) => $highlight && css`
    animation: ${highlightFlash} 1.8s ease-out 1;
  `}
`;

const CardHeader = styled.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  color: ${({ theme }) => theme.colors.textPrimary};

  &:hover {
    background: ${({ theme }) => theme.colors.bgTertiary};
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0; /* 제목 ellipsis 위해 flex 자식 min-width 해제 */
  flex: 1;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-shrink: 0;
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const PinnedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.4);
  border-radius: ${({ theme }) => theme.radius.full};
`;

const TypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}1a`}; /* alpha 0x1a = 10% */
  border: 1px solid ${({ $color }) => `${$color}55`};
  border-radius: ${({ theme }) => theme.radius.full};
`;

const Title = styled.div`
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const DateText = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
`;

const ChevronIcon = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  transition: transform 0.2s ease;
  transform: rotate(${({ $expanded }) => ($expanded ? '180deg' : '0deg')});
`;

const CardBody = styled.div`
  padding: ${({ theme }) => `0 ${theme.spacing.lg} ${theme.spacing.lg}`};
  border-top: 1px solid ${({ theme }) => theme.colors.borderDefault};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.md};
`;

const BodyImage = styled.img`
  max-width: 100%;
  border-radius: ${({ theme }) => theme.radius.md};
  object-fit: cover;
`;

const BodyContent = styled.div`
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: pre-wrap; /* 관리자 입력 줄바꿈 유지 */
  word-break: break-word;
`;

const LinkRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const BodyLink = styled.a`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

/** 딥링크 섹션 — 리스트 상단에 별도 카드로 분리 */
const DeeplinkSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.bgTertiary};
  border-radius: ${({ theme }) => theme.radius.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const DeeplinkHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DeeplinkLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.primary};
`;

const CloseDeeplinkBtn = styled.button`
  padding: 4px 10px;
  font-size: ${({ theme }) => theme.typography.textXs};
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const DeeplinkErrorBox = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: ${({ theme }) => theme.radius.lg};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textSm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

/* 페이지네이션 — CommunityPage.styled 의 Pagination 톤과 맞춤 */
const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const PageBtn = styled.button`
  min-width: 36px;
  height: 36px;
  padding: 0 ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.borderDefault};
  background: ${({ $active, theme }) =>
    $active ? theme.gradients.primary : 'transparent'};
  color: ${({ $active, theme }) =>
    $active ? '#fff' : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ $active, theme }) => ($active ? '#fff' : theme.colors.primary)};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
