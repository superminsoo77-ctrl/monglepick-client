/**
 * 검색 페이지 컴포넌트.
 *
 * 영화 검색 기능을 제공한다:
 * - 검색 대상 선택 (통합검색/제목/감독/출연진)
 * - 키워드 검색 입력 (확대된 입력창 + 검색 아이콘)
 * - 장르 필터 ($active prop으로 활성 상태 강조)
 * - 정렬 옵션 (커스텀 셀렉트 스타일)
 * - 검색 결과를 MovieList 그리드로 표시
 * - 로딩 중 Skeleton 카드 6개 표시
 * - 결과 없을 때 EmptyState 컴포넌트 사용
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
/* 영화 검색 API — features/movie에서 가져옴 */
import { searchMovies } from '../../movie/api/movieApi';
/* 영화 목록 컴포넌트 — shared/components에서 가져옴 */
import MovieList from '../../../shared/components/MovieList/MovieList';
/* 스켈레톤 로더 — shared/components에서 가져옴 */
import Skeleton from '../../../shared/components/Skeleton/Skeleton';
/* 빈 상태 컴포넌트 — shared/components에서 가져옴 */
import EmptyState from '../../../shared/components/EmptyState/EmptyState';
import * as S from './SearchPage.styled';

/** 장르 필터 옵션 */
const GENRE_FILTERS = [
  '전체', '액션', '코미디', '드라마', '로맨스', 'SF', '스릴러',
  '공포', '애니메이션', '판타지', '범죄', '다큐멘터리', '가족',
];

/** 정렬 옵션 */
const SORT_OPTIONS = [
  { value: 'relevance', label: '관련도순' },
  { value: 'rating',    label: '평점순' },
  { value: 'date',      label: '최신순' },
];

/** 검색 대상 옵션 */
const SEARCH_TYPE_OPTIONS = [
  { value: 'all', label: '통합검색' },
  { value: 'title', label: '제목' },
  { value: 'director', label: '감독' },
  { value: 'actor', label: '출연진' },
];

export default function SearchPage() {
  /* URL 쿼리 파라미터 연동 */
  const [searchParams, setSearchParams] = useSearchParams();

  /* 검색 상태 */
  const [query, setQuery]         = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState(searchParams.get('searchType') || 'all');
  const [genre, setGenre]         = useState(searchParams.get('genre') || '전체');
  const [sort, setSort]           = useState(searchParams.get('sort') || 'relevance');
  const [movies, setMovies]       = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  /* 검색 수행 여부 (초기 상태와 구분) */
  const [hasSearched, setHasSearched] = useState(false);

  /**
   * 검색을 실행하는 함수.
   * URL 파라미터도 동기화한다.
   */
  const executeSearch = useCallback(async (searchQuery, currentSearchType, searchGenre, searchSort) => {
    /* 검색어가 없으면 실행하지 않음 */
    if (!searchQuery.trim()) {
      setMovies([]);
      setHasSearched(false);
      setTotalCount(0);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    /* URL 쿼리 파라미터 업데이트 */
    const params = new URLSearchParams();
    params.set('q', searchQuery);
    if (currentSearchType !== 'all') params.set('searchType', currentSearchType);
    if (searchGenre !== '전체') params.set('genre', searchGenre);
    if (searchSort !== 'relevance') params.set('sort', searchSort);
    setSearchParams(params, { replace: true });

    try {
      const result = await searchMovies({
        query: searchQuery,
        searchType: currentSearchType,
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
   * URL 파라미터에 검색어가 있으면 마운트 시 1회 자동 검색 실행.
   * useRef 가드로 Strict Mode 이중 실행 방지.
   */
  const initialLoadRef = useRef(false);
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    const urlQuery = searchParams.get('q');
    const urlSearchType = searchParams.get('searchType') || 'all';
    const urlGenre = searchParams.get('genre') || '전체';
    const urlSort  = searchParams.get('sort') || 'relevance';
    if (urlQuery) {
      setQuery(urlQuery);
      setSearchType(urlSearchType);
      setGenre(urlGenre);
      setSort(urlSort);
      executeSearch(urlQuery, urlSearchType, urlGenre, urlSort);
    }
  }, [searchParams, executeSearch]);

  /**
   * 검색 폼 제출 핸들러.
   *
   * @param {Event} e - 폼 제출 이벤트
   */
  const handleSearch = (e) => {
    e.preventDefault();
    executeSearch(query, searchType, genre, sort);
  };

  /**
   * 장르 필터 변경 핸들러.
   *
   * @param {string} selectedGenre - 선택된 장르
   */
  const handleGenreChange = (selectedGenre) => {
    setGenre(selectedGenre);
    if (query.trim()) {
      executeSearch(query, searchType, selectedGenre, sort);
    }
  };

  /**
   * 검색 대상 변경 핸들러.
   *
   * @param {string} selectedType - 선택된 검색 대상
   */
  const handleSearchTypeChange = (selectedType) => {
    setSearchType(selectedType);
    if (query.trim()) {
      executeSearch(query, selectedType, genre, sort);
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
      executeSearch(query, searchType, genre, selectedSort);
    }
  };

  return (
    <S.Wrapper>
      <S.Inner>
        {/* 페이지 제목 */}
        <S.Title>영화 검색</S.Title>

        {/* 검색 입력 폼 */}
        <S.Form onSubmit={handleSearch}>
          <S.InputWrap>
            {/* 검색 대상 선택 드롭다운 */}
            <S.SearchTypeWrap>
              <S.SearchTypeSelect
                value={searchType}
                onChange={(e) => handleSearchTypeChange(e.target.value)}
                aria-label="검색 대상 선택"
              >
                {SEARCH_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </S.SearchTypeSelect>
              <S.SearchTypeArrow aria-hidden="true">▾</S.SearchTypeArrow>
            </S.SearchTypeWrap>

            {/* 검색 입력 필드 */}
            <S.InputField>
              <S.InputIcon aria-hidden="true">🔍</S.InputIcon>
              <S.Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="영화 제목, 배우, 감독을 검색하세요..."
                autoFocus
              />
            </S.InputField>
            <S.SearchButton type="submit" disabled={isLoading}>
              검색
            </S.SearchButton>
          </S.InputWrap>
        </S.Form>

        {/* 장르 필터 + 정렬 */}
        <S.Filters>
          <S.Genres>
            {GENRE_FILTERS.map((g) => (
              <S.GenreButton
                key={g}
                $active={genre === g}
                onClick={() => handleGenreChange(g)}
              >
                {g}
              </S.GenreButton>
            ))}
          </S.Genres>

          {/* 정렬 옵션 — 커스텀 셀렉트 래퍼 */}
          <S.SortWrap>
            <S.SortSelect
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </S.SortSelect>
            {/* 커스텀 화살표 아이콘 */}
            <S.SortArrow aria-hidden="true">▾</S.SortArrow>
          </S.SortWrap>
        </S.Filters>

        {/* 검색 결과 */}
        <S.Results>
          {hasSearched && !isLoading && (
            <S.ResultCount>
              검색 결과 <strong>{totalCount}</strong>건
            </S.ResultCount>
          )}

          {/* 로딩 중 — Skeleton 카드 6개 그리드 */}
          {isLoading && (
            <S.SkeletonGrid>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Skeleton key={n} variant="card" />
              ))}
            </S.SkeletonGrid>
          )}

          {/* 검색 완료 — 결과 표시 */}
          {hasSearched && !isLoading && movies.length > 0 && (
            <MovieList movies={movies} />
          )}

          {/* 검색 완료 — 결과 없음 */}
          {hasSearched && !isLoading && movies.length === 0 && (
            <EmptyState
              icon="🔍"
              title="검색 결과가 없습니다"
              description="다른 키워드로 검색해보세요"
            />
          )}

          {/* 초기 상태 — 검색 안내 */}
          {!hasSearched && !isLoading && (
            <EmptyState
              icon="🎬"
              title="영화를 검색해보세요"
              description="통합검색, 제목, 감독, 출연진 기준으로 검색할 수 있습니다"
            />
          )}
        </S.Results>
      </S.Inner>
    </S.Wrapper>
  );
}
