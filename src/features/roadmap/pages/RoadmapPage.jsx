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
];

export default function RoadmapPage() {
  const navigate = useNavigate();
  const { id: detailId } = useParams();
  const { pathname } = useLocation();
  const { showAlert } = useModal();

  /**
   * 현재 경로가 /stamp 계열인지 여부.
   * - true  → 도장깨기 모드: STAMP / STAMP_DETAIL 사용
   * - false → 로드맵 모드:  ROADMAP / ROADMAP_DETAIL 사용
   */
  const isStampMode = pathname.startsWith(ROUTES.STAMP.replace('/:id', '').replace(':id', ''));

  /** 목록으로 돌아갈 경로 (진입 모드에 따라 분기) */
  const listRoute = isStampMode ? ROUTES.STAMP : ROUTES.ROADMAP;

  /** 상세 페이지 경로 빌더 (진입 모드에 따라 분기) */
  const detailRoute = isStampMode ? ROUTES.STAMP_DETAIL : ROUTES.ROADMAP_DETAIL;

  /* ── 탭 상태 ── */
  const [activeTab, setActiveTab] = useState('all');

  /* ── 목록 상태 ── */
  const [courses, setCourses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  /* ── 상세 상태 ── */
  const [detail, setDetail] = useState(null);
  const [completedMovieIds, setCompletedMovieIds] = useState(new Set());
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);


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
      setDetail(data);
      /* 완료된 영화 ID 세트 생성 — 백엔드 completedMovieIds 배열 (문자열 ID) */
      const completed = new Set(data.completedMovieIds || []);
      setCompletedMovieIds(completed);
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
      showAlert({ title: '시작!', message: `'${detail.title}' 코스를 시작합니다.`, type: 'success' });
      /* 상세 리로드 */
      loadDetail(detail.id);
    } catch (err) {
      showAlert({ title: '오류', message: err.message || '코스 시작에 실패했습니다.', type: 'error' });
    } finally {
      setIsStarting(false);
    }
  };

  /**
   * 체크박스 클릭.
   * - 미완료 → 리뷰 작성 페이지로 이동
   * - 이미 완료 → 아무 동작 없음 (완료 취소는 지원하지 않음)
   */
  const handleCheckboxClick = (movieId, movieTitle) => {
    if (!detail || completedMovieIds.has(movieId)) return;
    navigate(
      buildPath(ROUTES.STAMP_REVIEW, { courseId: detail.id, movieId }),
      { state: { movieTitle, courseTitle: detail.title } },
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
              {!detail.started && (
                <S.StartBtn onClick={handleStart} disabled={isStarting}>
                  {isStarting ? '시작 중...' : '코스 시작하기'}
                </S.StartBtn>
              )}
            </S.DetailHeader>

            {movies.length > 0 ? (
              <S.MovieList>
                {movies.map((movie, idx) => {
                  const mid = movie.movieId || movie.id;
                  const poster = movie.posterPath ? `${TMDB_IMG}${movie.posterPath}` : null;
                  const isCompleted = completedMovieIds.has(mid);

                  return (
                    <S.MovieItem key={mid || idx}>
                      {poster ? (
                        <S.MoviePoster src={poster} alt={movie.title} loading="lazy" />
                      ) : (
                        <S.MoviePosterPlaceholder>&#x1F3AC;</S.MoviePosterPlaceholder>
                      )}
                      <S.MovieInfo onClick={() => navigate(buildPath(ROUTES.MOVIE_DETAIL, { id: mid }))}>
                        <S.MovieTitle>{movie.title || '제목 없음'}</S.MovieTitle>
                        <S.MovieMeta>
                          {movie.releaseYear && `${movie.releaseYear}년`}
                          {movie.director && ` · ${movie.director}`}
                        </S.MovieMeta>
                      </S.MovieInfo>
                      <S.VerifyBtn
                        $done={isCompleted}
                        onClick={() => !isCompleted && detail.started && handleCheckboxClick(mid, movie.title)}
                        disabled={isCompleted || !detail.started}
                        title={isCompleted ? '시청 인증 완료' : !detail.started ? '코스를 먼저 시작해 주세요' : '시청 인증하기'}
                      >
                        {isCompleted ? '✓ 인증완료' : '시청 인증'}
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
  const visibleCourses = activeTab === 'inprogress'
    ? courses.filter((c) => (c.progressPercent || 0) > 0 || c.started)
    : courses;

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
            return (
              <S.CourseCard
                key={course.id}
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
                  {course.difficulty && (
                    <S.DifficultyBadge $level={course.difficulty}>
                      {DIFFICULTY_LABELS[course.difficulty] || course.difficulty}
                    </S.DifficultyBadge>
                  )}
                </S.CourseMeta>
                {/* 진행률 바는 진행 중 탭에서만 표시 */}
                {activeTab === 'inprogress' && progress > 0 && (
                  <>
                    <S.ProgressBarOuter>
                      <S.ProgressBarInner $percent={progress} />
                    </S.ProgressBarOuter>
                    <S.ProgressText>{Math.round(progress)}% 완료</S.ProgressText>
                  </>
                )}
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
            {activeTab === 'inprogress'
              ? <>진행 중인 코스가 없어요.<br />코스를 시작해보세요!</>
              : <>아직 등록된 코스가 없어요.<br />곧 다양한 영화 코스가 추가될 예정이에요!</>
            }
          </S.EmptyText>
        </S.EmptyState>
      )}
    </S.Container>
  );
}
