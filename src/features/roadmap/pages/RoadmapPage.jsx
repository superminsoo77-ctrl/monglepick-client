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
import { useNavigate, useParams } from 'react-router-dom';
import { useModal } from '../../../shared/components/Modal';
import { ROUTES, buildPath } from '../../../shared/constants/routes';
import {
  getCourses,
  getCourseDetail,
  startCourse,
  completeMovie,
} from '../api/roadmapApi';
import * as S from './RoadmapPage.styled';

/** TMDB 포스터 URL */
const TMDB_IMG = 'https://image.tmdb.org/t/p/w200';

/** 카테고리 정의 */
const CATEGORIES = [
  { key: '', label: '전체', icon: '&#x1F3AC;' },
  { key: 'GENRE', label: '장르별', icon: '&#x1F3AD;' },
  { key: 'DIRECTOR', label: '감독별', icon: '&#x1F3A5;' },
  { key: 'ERA', label: '시대별', icon: '&#x1F4C5;' },
  { key: 'COUNTRY', label: '국가별', icon: '&#x1F30D;' },
  { key: 'THEME', label: '테마별', icon: '&#x1F3AF;' },
];

/** 난이도 라벨 매핑 */
const DIFFICULTY_LABELS = {
  EASY: '입문',
  MEDIUM: '중급',
  HARD: '고급',
};

/** 카테고리별 기본 아이콘 */
const CATEGORY_ICONS = {
  GENRE: '&#x1F3AD;',
  DIRECTOR: '&#x1F3A5;',
  ERA: '&#x1F4C5;',
  COUNTRY: '&#x1F30D;',
  THEME: '&#x1F3AF;',
};

export default function RoadmapPage() {
  const navigate = useNavigate();
  const { id: detailId } = useParams();
  const { showAlert } = useModal();

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
   */
  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCourses({
        category: selectedCategory || undefined,
      });
      setCourses(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      console.error('[Roadmap] 코스 로드 실패:', err.message);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  /**
   * 코스 상세 로드.
   */
  const loadDetail = useCallback(async (courseId) => {
    setIsDetailLoading(true);
    try {
      const data = await getCourseDetail(courseId);
      setDetail(data);
      /* 완료된 영화 ID 세트 생성 */
      const completed = new Set(
        (data.completedMovies || []).map((m) => m.movieId || m.id || m),
      );
      setCompletedMovieIds(completed);
    } catch {
      showAlert({ title: '오류', message: '코스를 불러올 수 없습니다.', type: 'error' });
      navigate(ROUTES.ROADMAP, { replace: true });
    } finally {
      setIsDetailLoading(false);
    }
  }, [navigate, showAlert]);

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
   * 영화 시청 완료 토글.
   */
  const handleToggleComplete = async (movieId) => {
    if (!detail) return;
    try {
      await completeMovie(detail.id, movieId);
      setCompletedMovieIds((prev) => {
        const next = new Set(prev);
        if (next.has(movieId)) {
          next.delete(movieId);
        } else {
          next.add(movieId);
        }
        return next;
      });
    } catch {
      showAlert({ title: '오류', message: '처리에 실패했습니다.', type: 'error' });
    }
  };

  /* ── 상세 뷰 ── */
  if (detailId) {
    const movies = detail?.movies || [];
    const totalCount = movies.length;
    const completedCount = completedMovieIds.size;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
      <S.Container>
        <S.BackLink onClick={() => navigate(ROUTES.ROADMAP)}>
          ← 로드맵 목록
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
                      <S.Checkbox
                        $checked={isCompleted}
                        onClick={() => handleToggleComplete(mid)}
                        title={isCompleted ? '시청 취소' : '시청 완료'}
                      >
                        {isCompleted ? '✓' : ''}
                      </S.Checkbox>
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
  return (
    <S.Container>
      <S.PageTitle>영화 로드맵</S.PageTitle>
      <S.Subtitle>테마별 영화 코스를 따라가며 영화 지식을 넓혀보세요!</S.Subtitle>

      {/* 카테고리 필터 */}
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

      {/* 로딩 */}
      {isLoading && (
        <S.CourseGrid>
          {[1, 2, 3].map((i) => <S.SkeletonCard key={i} />)}
        </S.CourseGrid>
      )}

      {/* 코스 그리드 */}
      {!isLoading && courses.length > 0 && (
        <S.CourseGrid>
          {courses.map((course) => {
            const progress = course.progressPercent || 0;
            return (
              <S.CourseCard
                key={course.id}
                onClick={() => navigate(buildPath(ROUTES.ROADMAP_DETAIL, { id: course.id }))}
              >
                <S.CourseThumbnail
                  dangerouslySetInnerHTML={{
                    __html: course.thumbnailUrl || CATEGORY_ICONS[course.category] || '&#x1F3AC;',
                  }}
                />
                <S.CourseInfo>
                  <S.CourseTitle>{course.title}</S.CourseTitle>
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
                  {progress > 0 && (
                    <S.ProgressBarOuter>
                      <S.ProgressBarInner $percent={progress} />
                    </S.ProgressBarOuter>
                  )}
                </S.CourseInfo>
              </S.CourseCard>
            );
          })}
        </S.CourseGrid>
      )}

      {/* 빈 상태 */}
      {!isLoading && courses.length === 0 && (
        <S.EmptyState>
          <S.EmptyIcon>&#x1F4DA;</S.EmptyIcon>
          <S.EmptyText>
            아직 등록된 코스가 없어요.
            <br />
            곧 다양한 영화 코스가 추가될 예정이에요!
          </S.EmptyText>
        </S.EmptyState>
      )}
    </S.Container>
  );
}
