/**
 * 홈 페이지 (랜딩 페이지) 컴포넌트.
 *
 * 앱의 메인 진입점으로 다음 섹션들을 포함한다:
 * - 히어로 섹션: 서비스 소개 + AI 채팅 시작 버튼
 * - 추천 영화 섹션: 인기/최신 영화 그리드
 * - 빠른 채팅 진입: 추천 질문 카드
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
/* 라우트 경로 상수 — shared/constants에서 가져옴 */
import { ROUTES } from '../../../shared/constants/routes';
/* 영화 목록 컴포넌트 — shared/components에서 가져옴 */
import MovieList from '../../../shared/components/MovieList/MovieList';
/* 인기/최신 영화 API — features/movie에서 가져옴 */
import { getPopularMovies, getLatestMovies } from '../../movie/api/movieApi';
/* 공지사항 API — shared/api에서 가져옴 */
import { getActiveNotices } from '../../../shared/api/noticeApi';
/* 히어로 우측 슬라이드 배너 위젯 — 관리자 등록 배너를 작게 노출 (2026-04-14 신규) */
import SideSlideBanner from '../components/SideSlideBanner';
/*
  2026-04-15 신규:
  - displayType=POPUP/MODAL 공지를 홈 진입 시 자동 표시하는 모달.
  - localStorage 기반 "24시간 억제" / "영구 억제" 로 UX 방해 최소화.
*/
import NoticeAnnouncementModal from '../components/NoticeAnnouncementModal';
import { isNoticeSuppressed } from '../../../shared/utils/noticeSuppression';
/* styled-components — HomePage.styled.js */
import * as S from './HomePage.styled';

/** 히어로 섹션에 표시할 추천 질문 카드 목록 */
const SUGGESTION_CARDS = [
  {
    icon: '🎭',
    title: '기분에 맞는 영화',
    description: 'AI가 당신의 감정을 분석해 딱 맞는 영화를 추천해요',
    query: '오늘 기분이 좀 우울한데 힐링되는 영화 추천해줘',
  },
  {
    icon: '🎬',
    title: '비슷한 영화 찾기',
    description: '좋아하는 영화와 비슷한 작품을 찾아드려요',
    query: '인터스텔라 같은 우주 SF 영화 추천해줘',
  },
  {
    icon: '👨‍👩‍👧‍👦',
    title: '상황별 추천',
    description: '누구와, 어떤 상황에서 볼지 알려주세요',
    query: '주말에 가족이랑 볼 만한 애니메이션 추천해줘',
  },
  {
    icon: '📸',
    title: '이미지로 추천',
    description: '영화 장면이나 포스터를 보여주면 비슷한 영화를 찾아요',
    query: '요즘 넷플릭스에서 볼 만한 한국 영화 추천해줘',
  },
];

export default function HomePage() {
  /**
   * 2026-04-23 신규: 홈 상단 검색 입력 상태.
   * 상단 NAV 에서 "검색" 탭을 제거하는 대신 홈 본문 상단에 검색창을 노출한다.
   * 제출 시 `/search?q=...` 로 이동해 SearchPage 가 결과를 렌더.
   */
  const [searchQuery, setSearchQuery] = useState('');
  /** 인기 영화 목록 (backend /movies/popular) */
  const [popularMovies, setPopularMovies] = useState([]);
  /** 인기 영화 로딩 상태 */
  const [isPopularLoading, setIsPopularLoading] = useState(true);
  /** 인기 영화 로드 실패 메시지 */
  const [popularError, setPopularError] = useState(null);

  /** 최신 영화 목록 (backend /movies/latest) */
  const [latestMovies, setLatestMovies] = useState([]);
  /** 최신 영화 로딩 상태 */
  const [isLatestLoading, setIsLatestLoading] = useState(true);
  /** 최신 영화 로드 실패 메시지 */
  const [latestError, setLatestError] = useState(null);

  /** 앱 공지사항 목록 (backend GET /api/v1/notices — BANNER/POPUP/MODAL) */
  const [notices, setNotices] = useState([]);

  /**
   * 현재 세션에서 이미 닫은 공지 ID 목록.
   *
   * 공지 큐는 notices 로부터 파생 계산하고, 닫기 동작만 별도 상태로 관리한다.
   * 이렇게 하면 effect 내부의 동기 setState 없이도 동일한 UI 흐름을 유지할 수 있다.
   */
  const [dismissedAnnouncementIds, setDismissedAnnouncementIds] = useState([]);

  const navigate = useNavigate();

  /**
   * 인기/최신 영화 + 공지사항 목록을 병렬로 로드한다.
   *
   * `Promise.allSettled` 를 사용하여 한쪽이 실패해도 다른 섹션은 정상 표시되도록 한다.
   * 각 섹션은 독립적인 loading/error 상태를 가지며, 재시도 버튼으로 개별 재호출할 수 있다.
   */
  const loadMovies = useCallback(async () => {
    setIsPopularLoading(true);
    setIsLatestLoading(true);
    setPopularError(null);
    setLatestError(null);

    const [popularResult, latestResult, noticeResult] = await Promise.allSettled([
      getPopularMovies(1, 8),
      getLatestMovies(1, 8),
      // 2026-04-15: pinned=true 로 제한. 고정된 BANNER/POPUP/MODAL 만 홈에 노출한다.
      // 고정되지 않은 공지는 커뮤니티 공지사항 탭에서만 조회 가능.
      getActiveNotices({ pinned: true }),
    ]);

    /* 인기 영화 처리 */
    if (popularResult.status === 'fulfilled') {
      setPopularMovies(popularResult.value?.movies || []);
    } else {
      console.error('[HomePage] 인기 영화 로드 실패:', popularResult.reason);
      setPopularError(
        popularResult.reason?.message || '인기 영화를 불러올 수 없습니다.',
      );
      setPopularMovies([]);
    }
    setIsPopularLoading(false);

    /* 최신 영화 처리 */
    if (latestResult.status === 'fulfilled') {
      setLatestMovies(latestResult.value?.movies || []);
    } else {
      console.error('[HomePage] 최신 영화 로드 실패:', latestResult.reason);
      setLatestError(
        latestResult.reason?.message || '최신 영화를 불러올 수 없습니다.',
      );
      setLatestMovies([]);
    }
    setIsLatestLoading(false);

    /* 공지사항 처리 — 실패해도 무시 (공지가 없어도 홈은 정상 작동) */
    if (noticeResult.status === 'fulfilled') {
      setDismissedAnnouncementIds([]);
      setNotices(noticeResult.value ?? []);
    } else {
      console.error('[HomePage] 공지사항 로드 실패:', noticeResult.reason);
      setDismissedAnnouncementIds([]);
      setNotices([]);
    }
  }, []);

  /*
   * 최초 마운트 시 1회 로드.
   *
   * eslint-disable react-hooks/set-state-in-effect — loadMovies 는 fetch + setState 를
   * 묶은 사용자 액션 콜백이며, useEffect 안에서 외부 데이터(인기/최신 영화)를 가져오는
   * 합법적 사용 사례이다. fetch 응답 도착 후 setState 가 일어나므로 cascading 렌더와는
   * 의미가 다르며, React 공식 docs 의 "fetching data in effect" 패턴과 일치한다.
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMovies();
  }, [loadMovies]);

  /**
   * 홈에 노출할 BANNER 공지만 추출 — 상단 카드 섹션용.
   * 2026-04-15: 기존에는 displayType 구분 없이 전부 배너로 렌더해 "모달로
   * 저장해도 배너로 뜸" 버그가 있었음. 이제 BANNER 만 여기로 분기된다.
   * (Task 5 에서 isPinned=true 필터가 추가로 결합될 예정)
   */
  const bannerNotices = useMemo(
    () => notices.filter((n) => n.displayType === 'BANNER'),
    [notices],
  );

  /**
   * POPUP/MODAL 공지 큐 생성 — notices 변경 시 파생 계산.
   *
   * <ol>
   *   <li>POPUP/MODAL 만 필터</li>
   *   <li>localStorage 억제(영구/24시간) 대상 제거</li>
   *   <li>현재 세션에서 이미 닫은 공지 제거</li>
   *   <li>정렬: MODAL 먼저(중요) → 같은 타입 안에선 priority DESC</li>
   * </ol>
   */
  const announcementQueue = useMemo(() => {
    if (!Array.isArray(notices) || notices.length === 0) {
      return [];
    }

    return notices
      .filter((n) => n.displayType === 'POPUP' || n.displayType === 'MODAL')
      .filter((n) => !isNoticeSuppressed(n.noticeId))
      .filter((n) => !dismissedAnnouncementIds.includes(n.noticeId))
      .sort((a, b) => {
        // MODAL 을 우선 노출 (중요 공지). 동일 displayType 내에서는 priority DESC.
        if (a.displayType !== b.displayType) {
          return a.displayType === 'MODAL' ? -1 : 1;
        }
        return (b.priority ?? 0) - (a.priority ?? 0);
      });
  }, [dismissedAnnouncementIds, notices]);

  /**
   * 현재 화면에 노출 중인 공지 (큐의 0번). 없으면 null.
   * variant 는 displayType 을 소문자로 변환해 NoticeAnnouncementModal 로 전달.
   */
  const currentAnnouncement = announcementQueue[0] ?? null;

  /**
   * 공지 팝업/모달 닫기 콜백 — 현재 공지를 닫힘 목록에 추가해 다음 공지를 띄운다.
   * 실제 localStorage 억제 처리는 NoticeAnnouncementModal 내부에서 수행.
   */
  const handleAnnouncementClose = useCallback(() => {
    if (!currentAnnouncement?.noticeId) {
      return;
    }

    setDismissedAnnouncementIds((prev) => [...prev, currentAnnouncement.noticeId]);
  }, [currentAnnouncement]);

  /**
   * 추천 질문 카드 클릭 시 채팅 페이지로 이동.
   * 쿼리를 state로 전달하여 자동 입력되도록 한다.
   *
   * @param {string} query - 추천 질문 텍스트
   */
  const handleSuggestionClick = (query) => {
    navigate(ROUTES.CHAT, { state: { initialQuery: query } });
  };

  /**
   * 2026-04-23: 홈 상단 검색 제출 핸들러.
   * 공백만 입력된 경우 이동하지 않는다 (SearchPage 가 빈 쿼리로 로드되지 않도록).
   */
  const handleHomeSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(q)}`);
  };

  return (
    <S.Wrapper>
      {/*
        ── 홈 상단 검색창 (2026-04-23 신규, 2026-04-23 위치 수정) ──
        상단 NAV 에서 "검색" 탭을 제거하는 대신 본문 최상단(헤더 바로 아래)에 전용
        검색 input 을 노출한다. Hero 섹션보다 먼저 렌더해 페이지 진입 즉시 검색 가능.
        엔터 또는 "검색" 버튼 클릭 시 /search?q=... 로 이동 — SearchPage 의 useSearchParams 로 수신.
      */}
      <S.HomeSearch>
        <S.HomeSearchForm onSubmit={handleHomeSearchSubmit} role="search">
          <S.HomeSearchInput
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="보고 싶은 영화·감독·배우를 검색해보세요"
            aria-label="영화 검색"
          />
          <S.HomeSearchBtn type="submit">
            검색
          </S.HomeSearchBtn>
        </S.HomeSearchForm>
      </S.HomeSearch>

      {/* ── 히어로 섹션 ── */}
      <S.Hero>
        <S.HeroContent>
          {/* 로고 배지 */}
          <S.HeroBadge>
            <S.HeroBadgeIcon src="/mongle-transparent.png" alt="몽글픽" />
            <span>AI 영화 추천 서비스</span>
          </S.HeroBadge>

          {/* 메인 타이틀 */}
          <S.HeroTitle>
            당신의 취향을 아는
            <br />
            <S.HeroTitleAccent>AI 영화 추천</S.HeroTitleAccent>
          </S.HeroTitle>

          {/* 설명 텍스트 */}
          <S.HeroDesc>
            기분, 장르, 좋아하는 영화를 말씀해 주세요.
            <br />
            몽글픽 AI가 15만 편 이상의 영화 중에서 딱 맞는 작품을 찾아드립니다.
          </S.HeroDesc>

          {/* CTA 버튼 — Link 컴포넌트를 as prop으로 위임 */}
          <S.HeroCta>
            <S.HeroBtnPrimary as={Link} to={ROUTES.CHAT}>
              AI에게 추천받기
            </S.HeroBtnPrimary>
            <S.HeroBtnSecondary as={Link} to={ROUTES.SEARCH}>
              영화 검색하기
            </S.HeroBtnSecondary>
          </S.HeroCta>
        </S.HeroContent>

        {/* 배경 글로우 효과 */}
        <S.HeroGlow aria-hidden="true" />
        {/* Floating Orb 배경 장식 */}
        <S.HeroOrb1 aria-hidden="true" />
        <S.HeroOrb2 aria-hidden="true" />
      </S.Hero>

      {/*
        우측하단 플로팅 슬라이드 배너 — 관리자 페이지에서 등록한 활성 배너를
        220×140 카드로 자동 회전시키며 viewport 에 고정 노출한다(2026-04-14 placement v2).
        Hero 의 overflow:hidden 에 영향받지 않도록 Wrapper 레벨 + position:fixed 로 분리.
        모바일(≤480px)에서만 숨김이며, 활성 배너가 0개이면 자체적으로 렌더되지 않는다.
      */}
      <SideSlideBanner position="MAIN" />

      {/* ── 추천 질문 카드 섹션 ── */}
      <S.Suggestions>
        <S.SuggestionsInner>
          <S.SuggestionsTitle>이런 것도 물어볼 수 있어요</S.SuggestionsTitle>
          <S.SuggestionsGrid>
            {SUGGESTION_CARDS.map((card, index) => (
              <S.SuggestionsCard
                key={card.title}
                /* $index: 1-based, stagger 딜레이 계산에 사용 */
                $index={index + 1}
                onClick={() => handleSuggestionClick(card.query)}
              >
                <S.CardIcon>{card.icon}</S.CardIcon>
                <S.CardTitle>{card.title}</S.CardTitle>
                <S.CardDesc>{card.description}</S.CardDesc>
              </S.SuggestionsCard>
            ))}
          </S.SuggestionsGrid>
        </S.SuggestionsInner>
      </S.Suggestions>

      {/* ── 공지사항 배너 섹션 (2026-04-23: Suggestions 밑, 인기영화 위로 이동) ──
         displayType === 'BANNER' 만 카드 노출. POPUP/MODAL 은 announcementQueue 로
         넘어가 NoticeAnnouncementModal 로 노출된다.
         클릭: linkUrl 있으면 외부 새창, 없으면 커뮤니티 공지 탭 딥링크로 navigate. */}
      {bannerNotices.length > 0 && (
        <S.NoticeBanner>
          {bannerNotices.map((notice) => {
            const communityDeeplink = `${ROUTES.COMMUNITY}?tab=notices&noticeId=${notice.noticeId}`;
            const hasExternalLink = Boolean(notice.linkUrl);
            const href = hasExternalLink ? notice.linkUrl : communityDeeplink;

            const handleClick = (e) => {
              if (hasExternalLink) return;
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
              e.preventDefault();
              navigate(communityDeeplink);
            };

            return (
              <S.NoticeCard
                key={notice.noticeId}
                href={href}
                target={hasExternalLink ? '_blank' : undefined}
                rel={hasExternalLink ? 'noopener noreferrer' : undefined}
                onClick={handleClick}
              >
                <S.NoticeTypeBadge>
                  {notice.displayType === 'MODAL' ? '중요' : '공지'}
                </S.NoticeTypeBadge>
                <S.NoticeTitle>{notice.title}</S.NoticeTitle>
                <S.NoticeDate>
                  {notice.createdAt ? String(notice.createdAt).slice(0, 10) : ''}
                </S.NoticeDate>
              </S.NoticeCard>
            );
          })}
        </S.NoticeBanner>
      )}

      {/* ── 인기 영화 섹션 ── */}
      <S.Movies>
        <S.MoviesInner>
          <S.MoviesHeader>
            <S.MoviesTitle>인기 영화</S.MoviesTitle>
            <S.MoviesMore as={Link} to={ROUTES.SEARCH}>
              더 보기 →
            </S.MoviesMore>
          </S.MoviesHeader>
          {/*
            popularError 가 있으면 간단한 재시도 안내를 표시하되, 스켈레톤/그리드도
            그대로 살려둠 — 시각적 깨짐 방지.
          */}
          {popularError && (
            <S.SectionError role="alert">
              {popularError}
              <S.SectionRetry type="button" onClick={loadMovies}>
                다시 시도
              </S.SectionRetry>
            </S.SectionError>
          )}
          <MovieList movies={popularMovies} loading={isPopularLoading} />
        </S.MoviesInner>
      </S.Movies>

      {/* ── 최신 영화 섹션 ── */}
      <S.Movies>
        <S.MoviesInner>
          <S.MoviesHeader>
            <S.MoviesTitle>최신 영화</S.MoviesTitle>
            <S.MoviesMore as={Link} to={ROUTES.SEARCH}>
              더 보기 →
            </S.MoviesMore>
          </S.MoviesHeader>
          {latestError && (
            <S.SectionError role="alert">
              {latestError}
              <S.SectionRetry type="button" onClick={loadMovies}>
                다시 시도
              </S.SectionRetry>
            </S.SectionError>
          )}
          <MovieList movies={latestMovies} loading={isLatestLoading} />
        </S.MoviesInner>
      </S.Movies>

      {/*
        ── 홈 진입 시 자동 표시되는 POPUP/MODAL 공지 (2026-04-15 신규) ──
        큐의 맨 앞 공지 하나만 표시되며, 닫으면 다음 항목으로 shift.
        - POPUP: 배경/ESC/× 로 닫기 가능, [다시 보지 않기] / [닫기] 버튼
        - MODAL: 배경/ESC 무시, [다시 보지 않기] / [확인했습니다] 버튼만 허용
        - 억제 정책: "다시 보지 않기" = 영구 / "닫기·확인" = 24시간 (localStorage)
      */}
      {currentAnnouncement && (
        <NoticeAnnouncementModal
          key={currentAnnouncement.noticeId}
          notice={currentAnnouncement}
          variant={currentAnnouncement.displayType === 'MODAL' ? 'modal' : 'popup'}
          onClose={handleAnnouncementClose}
        />
      )}
    </S.Wrapper>
  );
}
