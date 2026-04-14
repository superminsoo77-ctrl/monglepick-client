/**
 * 커뮤니티 "실관람인증" 탭 피드 컴포넌트 (2026-04-14 신규).
 *
 * <p>관리자 페이지 "콘텐츠·이벤트 → OCR 이벤트"에서 등록한 실관람 인증 이벤트를
 * 유저에게 카드 그리드로 노출한다. 서버 측에서 이미 공개 조건(ACTIVE/READY + 종료되지 않음)으로
 * 필터링된 목록을 받아 그대로 렌더링한다.</p>
 *
 * <h3>표시 필드</h3>
 * <ul>
 *   <li>영화 포스터 + 제목 — movies 테이블 조인 결과 (없으면 placeholder 이모지)</li>
 *   <li>이벤트 제목(title) — 관리자 등록 시 입력</li>
 *   <li>이벤트 메모(memo) — 상세 설명, 선택</li>
 *   <li>이벤트 기간 — startDate ~ endDate</li>
 *   <li>상태 배지 — ACTIVE(진행 중) / READY(시작 예정)</li>
 * </ul>
 *
 * <p>카드 클릭 시 해당 영화 상세 페이지로 이동해 리뷰 작성으로 자연스럽게 유도한다
 * ("봤다 = 리뷰" 원칙, 2026-04-08 재정의).</p>
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { getOcrEvents } from '../api/communityApi';
import { buildPath, ROUTES } from '../../../shared/constants/routes';
import EmptyState from '../../../shared/components/EmptyState/EmptyState';

/** TMDB 포스터 기준 URL — 커뮤니티 공유 피드(PlaylistShareFeed)와 동일 사이즈 정책 */
const TMDB_IMG = 'https://image.tmdb.org/t/p/w200';

/**
 * 상태별 표시 라벨 및 배지 색.
 * ACTIVE: 진행 중(녹색) / READY: 시작 예정(주황).
 * CLOSED 는 서버에서 내려오지 않으므로 제외.
 */
const STATUS_BADGE = {
  ACTIVE: { label: '진행 중', color: '#10b981' },
  READY: { label: '시작 예정', color: '#f59e0b' },
};

/**
 * ISO 문자열 → "YYYY-MM-DD HH:mm" 포맷으로 변환.
 * null/undefined 는 빈 문자열로 방어.
 */
function formatDateTime(iso) {
  if (!iso) return '';
  return iso.replace('T', ' ').substring(0, 16);
}

export default function OcrEventFeed() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await getOcrEvents();
        if (!cancelled) setEvents(list);
      } catch (err) {
        console.error('[OcrEventFeed] 이벤트 로드 실패:', err);
        if (!cancelled) {
          setError(err.message || '이벤트를 불러오지 못했습니다.');
          setEvents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // 카드 클릭 → 해당 영화 상세 페이지로 이동 (리뷰 작성 유도)
  const handleCardClick = (movieId) => {
    if (!movieId) return;
    navigate(buildPath(ROUTES.MOVIE_DETAIL, { id: movieId }));
  };

  if (loading) {
    return <LoadingMessage>이벤트를 불러오는 중...</LoadingMessage>;
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="이벤트를 불러오지 못했습니다"
        description={error}
      />
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon="🎟️"
        title="현재 진행 중인 실관람 인증 이벤트가 없어요"
        description="새 이벤트가 오픈되면 이곳에 표시됩니다."
      />
    );
  }

  return (
    <>
      <FeedHeader>
        <FeedTitle>실관람 인증 이벤트</FeedTitle>
        <FeedDesc>영화관 영수증으로 관람을 인증하고 리워드를 받아보세요.</FeedDesc>
      </FeedHeader>

      <Grid>
        {events.map((event) => {
          const badge = STATUS_BADGE[event.status] ?? null;
          const posterUrl = event.moviePosterPath
            ? `${TMDB_IMG}${event.moviePosterPath}`
            : null;

          return (
            <Card
              key={event.eventId}
              onClick={() => handleCardClick(event.movieId)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(event.movieId);
                }
              }}
            >
              <PosterWrap>
                {posterUrl ? (
                  <Poster src={posterUrl} alt={event.movieTitle || '영화 포스터'} loading="lazy" />
                ) : (
                  <PosterPlaceholder aria-hidden="true">🎬</PosterPlaceholder>
                )}
                {badge && (
                  <StatusBadge $color={badge.color}>{badge.label}</StatusBadge>
                )}
              </PosterWrap>

              <CardBody>
                {/* 관리자가 입력한 이벤트 제목 */}
                <EventTitle>{event.title || '제목 없음'}</EventTitle>

                {/* 인증 대상 영화 제목 (movies 조인 결과) */}
                {event.movieTitle && (
                  <MovieTitle title={event.movieTitle}>
                    🎞️ {event.movieTitle}
                  </MovieTitle>
                )}

                {/* 이벤트 상세 메모 — 최대 3줄 미리보기 */}
                {event.memo && <Memo>{event.memo}</Memo>}

                <Period>
                  {formatDateTime(event.startDate)} ~ {formatDateTime(event.endDate)}
                </Period>
              </CardBody>
            </Card>
          );
        })}
      </Grid>
    </>
  );
}

/* ── styled-components ── */

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

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};
  outline: none;

  &:hover,
  &:focus-visible {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
  }
`;

const PosterWrap = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: ${({ theme }) => theme.colors.bgHover};
  overflow: hidden;
`;

const Poster = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* 와이드 비율 포스터에서 상단 이미지가 잘려도 제목/얼굴이 보이도록 살짝 아래쪽 중심 */
  object-position: center 30%;
`;

const PosterPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const StatusBadge = styled.span`
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: ${({ $color }) => $color};
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
`;

const CardBody = styled.div`
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const EventTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const MovieTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Memo = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.45;
  white-space: pre-wrap;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Period = styled.div`
  margin-top: 4px;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
`;

const LoadingMessage = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
`;
