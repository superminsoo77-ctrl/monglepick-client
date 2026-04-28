/**
 * 영화 학습 로드맵 페이지.
 *
 * 두 가지 뷰:
 * - 목록 뷰: 카테고리별 코스 카드 그리드
 * - 상세 뷰: 코스 내 영화 체크리스트 + 진행률
 *
 * @module features/roadmap/pages/RoadmapPage
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useModal } from '../../../shared/components/Modal';
import { ROUTES, buildPath } from '../../../shared/constants/routes';
import {
  getCourses,
  getCourseDetail,
  startCourse,
} from '../api/roadmapApi';
import * as S from './RoadmapPage.styled';

/** TMDB 포스터 URL */
const TMDB_IMG = 'https://image.tmdb.org/t/p/w200';

/** 카테고리 정의 — key는 백엔드 theme 필드 값과 동일한 한국어 문자열 */
const CATEGORIES = [
  { key: '', label: '전체', icon: '&#x1F3AC;' },
  { key: '장르별', label: '장르별', icon: '&#x1F3AD;' },
  { key: '감독별', label: '감독별', icon: '&#x1F3A5;' },
  { key: '시대별', label: '시대별', icon: '&#x1F4C5;' },
  { key: '국가별', label: '국가별', icon: '&#x1F30D;' },
  { key: '테마별', label: '테마별', icon: '&#x1F3AF;' },
];

/** 난이도 라벨 매핑 — 백엔드 Difficulty enum (beginner/intermediate/advanced) */
const DIFFICULTY_LABELS = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '고급',
};

/** 테마별 기본 아이콘 */
const CATEGORY_ICONS = {
  '장르별': '&#x1F3AD;',
  '감독별': '&#x1F3A5;',
  '시대별': '&#x1F4C5;',
  '국가별': '&#x1F30D;',
  '테마별': '&#x1F3AF;',
};

/** 탭 정의 */
const TABS = [
  { key: 'all', label: '전체 코스' },
  { key: 'inprogress', label: '진행 중' },
  { key: 'completed', label: '완료' },
];

export default function RoadmapPage() {
  const navigate = useNavigate();
  const { id: detailId } = useParams();
  const location = useLocation();
  const { pathname } = location;
  const { showAlert } = useModal();

  /**
   * 현재 경로가 /account/stamp 계열인지 여부 (2026-04-23 PR-4: /account 하위로 이관).
   * - true  → 도장깨기 모드: ACCOUNT_STAMP / ACCOUNT_STAMP_DETAIL 사용
   * - false → 로드맵 모드:  ACCOUNT_ROADMAP / ACCOUNT_ROADMAP_DETAIL 사용
   *
   * pathname 검사는 "/account/stamp" prefix 로 판정 — /account/stamp/123, /account/stamp 모두 true.
   */
  const isStampMode = pathname.startsWith(ROUTES.ACCOUNT_STAMP);
  const { state: locationState } = location;

  /** 목록으로 돌아갈 경로 (진입 모드에 따라 분기) */
  const listRoute = isStampMode ? ROUTES.ACCOUNT_STAMP : ROUTES.ACCOUNT_ROADMAP;

  /** 상세 페이지 경로 빌더 (진입 모드에 따라 분기) */
  const detailRoute = isStampMode ? ROUTES.ACCOUNT_STAMP_DETAIL : ROUTES.ACCOUNT_ROADMAP_DETAIL;

  /* ── 탭 상태 — 코스 시작 후 목록으로 돌아올 때 locationState.defaultTab 으로 복원 ── */
  const [activeTab, setActiveTab] = useState(locationState?.defaultTab || 'all');

  /* ── 목록 상태 ── */
  const [courses, setCourses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  /* ── 상세 상태 ── */
  const [detail, setDetail] = useState(null);
  const [completedMovieIds, setCompletedMovieIds] = useState(new Set());
  /** 반려된 영화 맵: movieId(string) → rejectionReason(string) */
  const [rejectedMovieMap, setRejectedMovieMap] = useState({});
  /** 관리자 검토 대기 중인 영화 ID 세트 */
  const [pendingMovieIds, setPendingMovieIds] = useState(new Set());
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  /**
   * 코스가 완주(완료)로 처리되었는지 여부를 안정적으로 판정.
   * Backend 응답에서 필드명이 snake_case/camelCase 또는 boolean/string 등으로 달라질 수 있으므로
   * 다양한 케이스를 포괄적으로 검사한다.
   * @param {object} c - course/detail 객체
   * @returns {boolean}
   */
  const isCourseCompletedFlag = (c) => {
    if (!c) return false;
    const strEqCompleted = (v) => typeof v === 'string' && v.toLowerCase() === 'completed';
    if (strEqCompleted(c.status) || strEqCompleted(c.courseStatus) || strEqCompleted(c.course_status)) return true;
    if (c.completedFinalReview === true || c.completed_final_review === true) return true;
    if (c.isCompleted === true || c.completed === true) return true;
    // 숫자 1로 표현되는 경우까지 방어적으로 체크
    if (c.completed === 1 || c.completedFinalReview === 1) return true;
    return false;
  };


  /**
   * 코스 목록 로드.
   * 진행 중 탭에서는 카테고리 필터 없이 전체 코스를 가져와 프론트에서 필터링한다.
   */
  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCourses({
        theme: activeTab === 'all' ? (selectedCategory || undefined) : undefined,
      });
      console.log('[DEBUG] getCourses response:', data);
      setCourses(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      console.error('[Roadmap] 코스 로드 실패:', err.message);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, activeTab]);

  /**
   * 코스 상세 로드.
   */
  const loadDetail = useCallback(async (courseId) => {
    setIsDetailLoading(true);
    try {
      const data = await getCourseDetail(courseId);
      console.log('[DEBUG] getCourseDetail response:', data);
      setDetail(data);
      /* 완료된 영화 ID 세트 생성 — 백엔드 completedMovieIds 배열 (문자열 ID) */
      const completed = new Set((data.completedMovieIds || []).map(String));
      setCompletedMovieIds(completed);
      /* 반려된 영화: { movieId → rejectionReason } 맵 생성 */
      const rejectedMap = {};
      (data.rejectedMovies || []).forEach((item) => {
        const id = String(item.movieId ?? item.id ?? '');
        if (id) rejectedMap[id] = item.rejectionReason ?? item.reason ?? '';
      });
      setRejectedMovieMap(rejectedMap);
      /* 검토 대기 중인 영화 ID 세트 */
      const pending = new Set((data.pendingMovieIds || []).map(String));
      setPendingMovieIds(pending);
    } catch {
      showAlert({ title: '오류', message: '코스를 불러올 수 없습니다.', type: 'error' });
      /* 진입 경로에 따라 목록으로 복귀 (stamp 모드면 /stamp, 아니면 /roadmap) */
      navigate(listRoute, { replace: true });
    } finally {
      setIsDetailLoading(false);
    }
  }, [navigate, showAlert, listRoute]);

  /* 마운트 시 목록 또는 상세 로드 */
  useEffect(() => {
    if (detailId) {
      loadDetail(detailId);
    } else {
      loadCourses();
      setDetail(null);
    }
  }, [detailId, loadCourses, loadDetail]);

  /**
   * 코스 시작 핸들러.
   */
  const handleStart = async () => {
    if (!detail) return;
    setIsStarting(true);
    try {
      await startCourse(detail.id);
      await showAlert({ title: '시작!', message: `'${detail.title}' 코스를 시작합니다.`, type: 'success' });
      /* 시작 완료 후 목록으로 이동하며 "진행 중" 탭을 활성화 */
      navigate(listRoute, { state: { defaultTab: 'inprogress' }, replace: true });
    } catch (err) {
      showAlert({ title: '오류', message: err.message || '코스 시작에 실패했습니다.', type: 'error' });
    } finally {
      setIsStarting(false);
    }
  };

  /**
   * 인증 버튼 클릭.
   * - 미완료      → 리뷰 작성 페이지로 이동
   * - 완료        → 작성한 리뷰 조회 페이지로 이동 (읽기 전용)
   * - 반려(rejected) → 반려 사유 + 재인증 폼 페이지로 이동
   * - 검토 중(pending) → 제출한 리뷰 읽기 전용 조회
   */
  const handleCheckboxClick = (movieId, movieTitle, isCompleted, isRejected, rejectionReason, isPending) => {
    if (!detail) return;
    navigate(
      buildPath(ROUTES.ACCOUNT_STAMP_REVIEW, { courseId: detail.id, movieId }),
      {
        state: {
          movieTitle,
          courseTitle: detail.title,
          readOnly: (isCompleted && !isRejected) || isPending,
          resubmit: isRejected,
          rejectionReason: rejectionReason || '',
        },
      },
    );
  };

  /* ── 상세 뷰 ── */
  if (detailId) {
    const movies = detail?.movies || [];
    /* movieCount는 백엔드 roadmap_courses.movie_count (목록 API와 동일한 분모) */
    const totalCount = detail?.movieCount || movies.length;
    const completedCount = completedMovieIds.size;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
      <S.Container>
        <S.BackLink onClick={() => navigate(listRoute)}>
          {isStampMode ? '← 도장깨기 목록' : '← 로드맵 목록'}
        </S.BackLink>

        {isDetailLoading && <S.SkeletonCard $h={300} />}

        {!isDetailLoading && detail && (
          <>
            <S.DetailHeader>
              <S.PageTitle>{detail.title}</S.PageTitle>
              {detail.description && (
                <S.Subtitle>{detail.description}</S.Subtitle>
              )}
              <S.DetailProgress>
                <S.ProgressBarOuter style={{ flex: 1 }}>
                  <S.ProgressBarInner $percent={progressPercent} />
                </S.ProgressBarOuter>
                <S.ProgressText>
                  {completedCount} / {totalCount}편 ({progressPercent}%)
                </S.ProgressText>
              </S.DetailProgress>
              {/* 진행률 100%이지만 최종 감상평 미작성 시 상세 헤더 안내 */}
              {(progressPercent >= 100 && !isCourseCompletedFlag(detail) && locationState?.finalReviewSubmitted !== true && detail?.requiresFinalReview !== false) && (
                <S.HeaderHint>
                  🎉 진행률이 모두 완료되었어요! 최종 감상평을 작성하시면 도장깨기가 완료됩니다. 지금 작성해 보세요.
                </S.HeaderHint>
              )}
              {/* 최종 감상평 버튼: 진행도 100% 또는 서버에서 requiresFinalReview를 전달했을 때 표시 (완주 전인 경우에만) */}
              {(() => {
                const isCourseFullyCompleted = isCourseCompletedFlag(detail) || locationState?.finalReviewSubmitted === true;
                if (isStampMode && (progressPercent >= 100 || detail?.requiresFinalReview) && !isCourseFullyCompleted) {
                  return (
                    <S.StartBtn onClick={() => navigate(buildPath(ROUTES.ACCOUNT_STAMP_FINAL_REVIEW, { id: detail.id }), { state: { courseTitle: detail.title } })}>
                      최종 감상평 작성하기
                    </S.StartBtn>
                  );
                }
                if (!detail.started) {
                  return (
                    <>
                      <S.StartBtn onClick={handleStart} disabled={isStarting}>
                        {isStarting ? '시작 중...' : '코스 시작하기'}
                      </S.StartBtn>
                      <S.StartHint>
                        ※ 코스 시작하기 버튼을 눌러야 시청 인증을 진행할 수 있습니다.
                      </S.StartHint>
                    </>
                  );
                }
                return null;
              })()}
            </S.DetailHeader>

            {movies.length > 0 ? (
              <S.MovieList>
                {movies.map((movie, idx) => {
                  const mid = movie.movieId || movie.id;
                  const poster = movie.posterPath ? `${TMDB_IMG}${movie.posterPath}` : null;
                  const isCompleted = completedMovieIds.has(String(mid));
                  const rejectionReason = rejectedMovieMap[String(mid)];
                  const isRejected = !!rejectionReason;
                  const isPending = pendingMovieIds.has(String(mid));

                  const btnLabel = isCompleted
                    ? '✓ 인증완료'
                    : isRejected
                    ? '✗ 반려됨'
                    : isPending
                    ? '⏳ 검토 중'
                    : '시청 인증';
                  const btnTitle = isCompleted
                    ? '내 리뷰 보기'
                    : isRejected
                    ? '반려 사유 확인 및 재인증'
                    : isPending
                    ? '관리자 검토 중 — 클릭하여 제출한 리뷰 보기'
                    : !detail.started
                    ? '코스를 먼저 시작해 주세요'
                    : '시청 인증하기';

                  return (
                    <S.MovieItem key={mid || idx}>
                      {poster ? (
                        <S.MoviePoster src={poster} alt={movie.title} loading="lazy" />
                      ) : (
                        <S.MoviePosterPlaceholder>&#x1F3AC;</S.MoviePosterPlaceholder>
                      )}
                      <S.MovieInfo>
                        <S.MovieTitle>{movie.title || '제목 없음'}</S.MovieTitle>
                        <S.MovieMeta>
                          {movie.releaseYear && `${movie.releaseYear}년`}
                          {movie.director && ` · ${movie.director}`}
                        </S.MovieMeta>
                      </S.MovieInfo>
                      <S.VerifyBtn
                        $done={isCompleted}
                        $rejected={isRejected}
                        $pending={isPending}
                        onClick={() => (detail.started || isPending || isRejected) && handleCheckboxClick(mid, movie.title, isCompleted, isRejected, rejectionReason, isPending)}
                        disabled={!detail.started && !isPending && !isRejected}
                        title={btnTitle}
                      >
                        {btnLabel}
                      </S.VerifyBtn>
                    </S.MovieItem>
                  );
                })}
              </S.MovieList>
            ) : (
              <S.EmptyState>
                <S.EmptyIcon>&#x1F4D6;</S.EmptyIcon>
                <S.EmptyText>이 코스에 아직 영화가 등록되지 않았어요.</S.EmptyText>
              </S.EmptyState>
            )}
          </>
        )}
      </S.Container>
    );
  }

  /* ── 목록 뷰 ── */
  const visibleCourses = (() => {
    if (activeTab === 'inprogress') {
      return courses.filter((c) => {
        const p = c.progressPercent || 0;
        const done = p >= 100 || c.status === 'COMPLETED';
        return !done && (p > 0 || c.started);
      });
    }
    if (activeTab === 'completed') {
      return courses.filter((c) => (c.progressPercent || 0) >= 100 || c.status === 'COMPLETED');
    }
    // 전체: 완료된 코스를 뒤로 정렬
    return [...courses].sort((a, b) => {
      const aDone = (a.progressPercent || 0) >= 100 || a.status === 'COMPLETED';
      const bDone = (b.progressPercent || 0) >= 100 || b.status === 'COMPLETED';
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;
      return 0;
    });
  })();

  return (
    <S.Container>
      <S.PageTitle>도장깨기</S.PageTitle>
      <S.Subtitle>테마별 영화 코스를 따라가며 영화 지식을 넓혀보세요!</S.Subtitle>

      {/* 탭 */}
      <S.Tabs>
        {TABS.map((tab) => (
          <S.Tab
            key={tab.key}
            $active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </S.Tab>
        ))}
      </S.Tabs>

      {/* 카테고리 필터 (전체 탭에서만) */}
      {activeTab === 'all' && (
        <S.CategoryFilters>
          {CATEGORIES.map((cat) => (
            <S.CategoryBtn
              key={cat.key}
              $active={selectedCategory === cat.key}
              onClick={() => setSelectedCategory(cat.key)}
            >
              {cat.label}
            </S.CategoryBtn>
          ))}
        </S.CategoryFilters>
      )}

      {/* 로딩 */}
      {isLoading && (
        <S.CourseGrid>
          {[1, 2, 3].map((i) => <S.SkeletonCard key={i} />)}
        </S.CourseGrid>
      )}

      {/* 코스 그리드 */}
      {!isLoading && visibleCourses.length > 0 && (
        <S.CourseGrid>
          {visibleCourses.map((course) => {
            const progress = course.progressPercent || 0;
            const isCompleted = progress >= 100 || course.status === 'COMPLETED';
            const isInProgress = !isCompleted && (progress > 0 || course.started);

            return (
              <S.CourseCard
                key={course.id}
                $completed={isCompleted}
                onClick={() => navigate(buildPath(detailRoute, { id: course.id }))}
              >
                <S.CourseHeaderRow>
                  <S.CourseThumbnail
                    dangerouslySetInnerHTML={{
                      __html: course.thumbnailUrl || CATEGORY_ICONS[course.theme] || '&#x1F3AC;',
                    }}
                  />
                  <S.CourseTitle>{course.title}</S.CourseTitle>
                </S.CourseHeaderRow>
                    {course.description && (
                      <S.CourseDesc>{course.description}</S.CourseDesc>
                    )}
                <S.CourseMeta>
                      <span>{course.movieCount || 0}편</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isCompleted && (
                      <S.CompletedBadge>✓ 완료</S.CompletedBadge>
                    )}
                        {!isCompleted && isInProgress && (
                          <S.InProgressBadge>● 진행 중</S.InProgressBadge>
                        )}
                        {/* 최종 감상평만 남음 배지 (옵션1) */}
                        {activeTab === 'inprogress' && progress >= 100 && !isCourseCompletedFlag(course) && course.requiresFinalReview !== false && (
                          <S.SmallBadge>✍️ 최종 감상평만 남음</S.SmallBadge>
                        )}
                    {course.difficulty && (
                      <S.DifficultyBadge $level={course.difficulty}>
                        {DIFFICULTY_LABELS[course.difficulty] || course.difficulty}
                      </S.DifficultyBadge>
                    )}
                  </div>
                </S.CourseMeta>
                {/* 진행률 바 — 전체/진행 중/완료 탭 모두 progress > 0이면 표시 */}
                {progress > 0 && (
                  <>
                    <S.ProgressBarOuter>
                      <S.ProgressBarInner $percent={progress} />
                    </S.ProgressBarOuter>
                    <S.ProgressText>
                      {isCompleted ? '완료' : `${Math.round(progress)}% 완료`}
                    </S.ProgressText>
                  </>
                )}
                {/* 진행률이 100%이지만 최종 감상평이 작성되지 않은 경우 안내 문구 표시 (진행중 탭 내) */}
                {activeTab === 'inprogress' && progress >= 100 && !isCourseCompletedFlag(course) && course.requiresFinalReview !== false && (
                  <S.WarningText>
                    🎉 진행률이 100%에 도달했어요. 마지막 감상평을 작성하여 도장깨기를 완료해 주세요.
                  </S.WarningText>
                )}
                {/* 진행률이 100%이지만 최종 감상평이 작성되지 않은 경우 안내 문구 표시 (진행중 탭 내) */}
                
              </S.CourseCard>
            );
          })}
        </S.CourseGrid>
      )}

      {/* 빈 상태 */}
      {!isLoading && visibleCourses.length === 0 && (
        <S.EmptyState>
          <S.EmptyIcon>&#x1F4DA;</S.EmptyIcon>
          <S.EmptyText>
            {activeTab === 'inprogress' ? (
              <>진행 중인 코스가 없어요.<br />코스를 시작해보세요!</>
            ) : activeTab === 'completed' ? (
              <>완료된 코스가 없어요.<br />먼저 코스를 완료해 보세요!</>
            ) : (
              <>아직 등록된 코스가 없어요.<br />곧 다양한 영화 코스가 추가될 예정이에요!</>
            )}
          </S.EmptyText>
        </S.EmptyState>
      )}
    </S.Container>
  );
}
