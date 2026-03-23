/**
 * 검색 페이지 컴포넌트.
 *
 * 영화 검색 기능을 제공한다:
 * - 키워드 검색 입력
 * - 장르 필터
 * - 정렬 옵션 (관련도, 평점, 최신순)
 * - 검색 결과를 MovieList 그리드로 표시
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
/* 영화 검색 API — features/movie에서 가져옴 */
import { searchMovies } from '../../movie/api/movieApi';
/* 영화 목록 컴포넌트 — features/movie에서 가져옴 */
import MovieList from '../../movie/components/MovieList';
import './SearchPage.css';

/** 장르 필터 옵션 */
const GENRE_FILTERS = [
  '전체', '액션', '코미디', '드라마', '로맨스', 'SF', '스릴러',
  '공포', '애니메이션', '판타지', '범죄', '다큐멘터리', '가족',
];

/** 정렬 옵션 */
const SORT_OPTIONS = [
  { value: 'relevance', label: '관련도순' },
  { value: 'rating', label: '평점순' },
  { value: 'date', label: '최신순' },
];

export default function SearchPage() {
  // URL 쿼리 파라미터 연동
  const [searchParams, setSearchParams] = useSearchParams();

  // 검색 상태
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [genre, setGenre] = useState(searchParams.get('genre') || '전체');
  const [sort, setSort] = useState(searchParams.get('sort') || 'relevance');
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  // 검색 수행 여부 (초기 상태와 구분)
  const [hasSearched, setHasSearched] = useState(false);

  /**
   * 검색을 실행하는 함수.
   * URL 파라미터도 동기화한다.
   */
  const executeSearch = useCallback(async (searchQuery, searchGenre, searchSort) => {
    // 검색어가 없으면 실행하지 않음
    if (!searchQuery.trim()) {
      setMovies([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    // URL 쿼리 파라미터 업데이트
    const params = new URLSearchParams();
    params.set('q', searchQuery);
    if (searchGenre !== '전체') params.set('genre', searchGenre);
    if (searchSort !== 'relevance') params.set('sort', searchSort);
    setSearchParams(params, { replace: true });

    try {
      const result = await searchMovies({
        query: searchQuery,
        genre: searchGenre === '전체' ? '' : searchGenre,
        sort: searchSort,
        page: 1,
        size: 20,
      });
      setMovies(result?.movies || []);
      setTotalCount(result?.total || 0);
    } catch {
      setMovies([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [setSearchParams]);

  /**
   * URL 파라미터에 검색어가 있으면 자동 검색 실행.
   */
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery) {
      setQuery(urlQuery);
      executeSearch(urlQuery, genre, sort);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 검색 폼 제출 핸들러.
   *
   * @param {Event} e - 폼 제출 이벤트
   */
  const handleSearch = (e) => {
    e.preventDefault();
    executeSearch(query, genre, sort);
  };

  /**
   * 장르 필터 변경 핸들러.
   *
   * @param {string} selectedGenre - 선택된 장르
   */
  const handleGenreChange = (selectedGenre) => {
    setGenre(selectedGenre);
    if (query.trim()) {
      executeSearch(query, selectedGenre, sort);
    }
  };

  /**
   * 정렬 옵션 변경 핸들러.
   *
   * @param {string} selectedSort - 선택된 정렬 기준
   */
  const handleSortChange = (selectedSort) => {
    setSort(selectedSort);
    if (query.trim()) {
      executeSearch(query, genre, selectedSort);
    }
  };

  return (
    <div className="search-page">
      <div className="search-page__inner">
        {/* 페이지 헤더 */}
        <h1 className="search-page__title">영화 검색</h1>

        {/* 검색 입력 폼 */}
        <form className="search-page__form" onSubmit={handleSearch}>
          <div className="search-page__input-wrap">
            <input
              type="text"
              className="search-page__input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="영화 제목, 배우, 감독을 검색하세요..."
              autoFocus
            />
            <button type="submit" className="search-page__search-btn" disabled={isLoading}>
              검색
            </button>
          </div>
        </form>

        {/* 장르 필터 */}
        <div className="search-page__filters">
          <div className="search-page__genres">
            {GENRE_FILTERS.map((g) => (
              <button
                key={g}
                className={`search-page__genre-btn ${genre === g ? 'search-page__genre-btn--active' : ''}`}
                onClick={() => handleGenreChange(g)}
              >
                {g}
              </button>
            ))}
          </div>

          {/* 정렬 옵션 */}
          <div className="search-page__sort">
            <select
              className="search-page__sort-select"
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 검색 결과 */}
        <div className="search-page__results">
          {hasSearched && !isLoading && (
            <p className="search-page__result-count">
              검색 결과 <strong>{totalCount}</strong>건
            </p>
          )}
          {hasSearched ? (
            <MovieList movies={movies} loading={isLoading} />
          ) : (
            <div className="search-page__empty">
              <p className="search-page__empty-text">
                검색어를 입력하여 영화를 찾아보세요.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
