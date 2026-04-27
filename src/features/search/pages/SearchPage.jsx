/*
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
import {
  deleteAllRecentSearches,
  deleteRecentSearchKeyword,
  getAutocompleteSuggestions,
  getRecentSearches,
  getSearchGenres,
  logSearchResultClick,
  searchMovies,
} from '../../movie/api/movieApi';
/* Phase 2: 사용자 행동 이벤트 추적 */
import { trackEvent } from '../../../shared/utils/eventTracker';
import useAuthStore from '../../../shared/stores/useAuthStore';
/* 영화 목록 컴포넌트 — shared/components에서 가져옴 */
import MovieList from '../../../shared/components/MovieList/MovieList';
/* 스켈레톤 로더 — shared/components에서 가져옴 */
import Skeleton from '../../../shared/components/Skeleton/Skeleton';
/* 빈 상태 컴포넌트 — shared/components에서 가져옴 */
import EmptyState from '../../../shared/components/EmptyState/EmptyState';
import * as S from './SearchPage.styled';

const PAGE_SIZE = 20;
const RECENT_PREVIEW_SIZE = 5;
const RECENT_HISTORY_PAGE_SIZE = 10;
const RECENT_HISTORY_SCROLL_THRESHOLD = 80;
const SEARCH_CACHE_STORAGE_KEY = 'monglepick_search_page_cache';
const AUTOCOMPLETE_DEBOUNCE_MS = 300;
const AUTOCOMPLETE_LIMIT = 8;

/** 장르 필터 옵션 */
const GENRE_FILTERS = [
  '전체', '액션', '코미디', '드라마', '로맨스', 'SF', '스릴러',
  '공포', '애니메이션', '판타지', '범죄', '다큐멘터리', '가족',
];

/**
 * 장르 발견형 검색에서 기본으로 먼저 노출할 주 장르 목록.
 * 사용자가 가장 자주 탐색할 장르를 상단에 고정해 세부 장르 펼침 전에도 빠르게 선택할 수 있게 한다.
 */
const PRIMARY_SEARCH_GENRE_LABELS = [
  '액션',
  '드라마',
  '애니메이션',
  '로맨스',
  '공포',
  '스릴러',
  '코미디',
  '판타지',
  'SF',
  '범죄',
  '가족',
  '다큐멘터리',
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

function createInitialRecentPagination() {
  return {
    offset: 0,
    limit: RECENT_HISTORY_PAGE_SIZE,
    has_more: false,
    next_offset: null,
  };
}

function splitSearchGenreOptions(options) {
  const optionMap = new Map(options.map((item) => [item.label, item]));
  const primaryOptions = PRIMARY_SEARCH_GENRE_LABELS
    .map((label) => optionMap.get(label))
    .filter(Boolean);
  const primaryLabelSet = new Set(primaryOptions.map((item) => item.label));
  const detailOptions = options.filter((item) => !primaryLabelSet.has(item.label));

  return { primaryOptions, detailOptions };
}

function hasSelectedDetailGenres(selectedGenres) {
  return selectedGenres.some((label) => !PRIMARY_SEARCH_GENRE_LABELS.includes(label));
}

/**
 * URL 쿼리스트링의 장르 목록을 배열로 변환한다.
 * `genres=액션,드라마` 형태를 `["액션", "드라마"]` 로 다룬다.
 */
function parseSelectedGenresParam(value) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * 최근 검색 시각을 `YYYY.MM.DD HH:MM` 형식으로 표시한다.
 * 모달 목록에서 키워드 아래 보조 정보로 사용한다.
 */
function formatRecentSearchTimestamp(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function isGenreDiscoveryRecentSearch(item) {
  const historyFilters = item?.filters || {};
  const historyGenres = Array.isArray(historyFilters.genres) ? historyFilters.genres : [];
  return historyFilters.search_mode === 'genre_discovery' && historyGenres.length > 0;
}

function getRecentSearchDisplayKeyword(item) {
  const historyFilters = item?.filters || {};
  const historyGenres = Array.isArray(historyFilters.genres) ? historyFilters.genres : [];

  if (!isGenreDiscoveryRecentSearch(item)) {
    return item?.keyword || '';
  }

  return historyGenres.join(' · ');
}

function parseOptionalIntegerFilter(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number.parseInt(String(value).trim(), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalFloatFilter(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number.parseFloat(String(value).trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function toFilterInputValue(value) {
  return value === null || value === undefined ? '' : String(value);
}

function normalizeAdvancedFilters({
  yearFrom,
  yearTo,
  ratingMin,
  ratingMax,
  popularityMin,
  popularityMax,
}) {
  return {
    yearFrom: parseOptionalIntegerFilter(yearFrom),
    yearTo: parseOptionalIntegerFilter(yearTo),
    ratingMin: parseOptionalFloatFilter(ratingMin),
    ratingMax: parseOptionalFloatFilter(ratingMax),
    popularityMin: parseOptionalFloatFilter(popularityMin),
    popularityMax: parseOptionalFloatFilter(popularityMax),
  };
}

function hasActiveAdvancedFilters(filters) {
  return Object.values(filters).some((value) => value !== null);
}

function getAdvancedFilterError(filters) {
  if (
    filters.yearFrom !== null
    && filters.yearTo !== null
    && filters.yearFrom > filters.yearTo
  ) {
    return '개봉 연도 범위를 확인해주세요.';
  }

  if (
    filters.ratingMin !== null
    && filters.ratingMax !== null
    && filters.ratingMin > filters.ratingMax
  ) {
    return '평점 범위를 확인해주세요.';
  }

  if (
    filters.popularityMin !== null
    && filters.popularityMax !== null
    && filters.popularityMin > filters.popularityMax
  ) {
    return '인기도 범위를 확인해주세요.';
  }

  return '';
}

function buildSearchCacheKey({
  query,
  searchType,
  genre,
  sort,
  selectedGenres = [],
  yearFrom,
  yearTo,
  ratingMin,
  ratingMax,
  popularityMin,
  popularityMax,
}) {
  return JSON.stringify({
    query: query || '',
    searchType: searchType || 'all',
    genre: genre || '전체',
    sort: sort || 'relevance',
    selectedGenres,
    yearFrom: yearFrom ?? null,
    yearTo: yearTo ?? null,
    ratingMin: ratingMin ?? null,
    ratingMax: ratingMax ?? null,
    popularityMin: popularityMin ?? null,
    popularityMax: popularityMax ?? null,
  });
}

function buildSearchSignature({
  query,
  searchType,
  genre,
  sort,
  selectedGenres = [],
  yearFrom,
  yearTo,
  ratingMin,
  ratingMax,
  popularityMin,
  popularityMax,
}) {
  return JSON.stringify({
    query: query || '',
    searchType: searchType || 'all',
    genre: genre || '전체',
    sort: sort || 'relevance',
    selectedGenres,
    yearFrom: yearFrom ?? null,
    yearTo: yearTo ?? null,
    ratingMin: ratingMin ?? null,
    ratingMax: ratingMax ?? null,
    popularityMin: popularityMin ?? null,
    popularityMax: popularityMax ?? null,
  });
}

function buildSearchParams({
  query,
  searchType,
  genre,
  sort,
  selectedGenres = [],
  yearFrom,
  yearTo,
  ratingMin,
  ratingMax,
  popularityMin,
  popularityMax,
}) {
  const params = new URLSearchParams();

  if (query) {
    params.set('q', query);
    if (searchType && searchType !== 'all') {
      params.set('searchType', searchType);
    }
    if (genre && genre !== '전체') {
      params.set('genre', genre);
    }
  }

  if (!query && selectedGenres.length > 0) {
    params.set('genres', selectedGenres.join(','));
  }

  if (sort && sort !== 'relevance') {
    params.set('sort', sort);
  }

  if (yearFrom !== null && yearFrom !== undefined) {
    params.set('yearFrom', String(yearFrom));
  }

  if (yearTo !== null && yearTo !== undefined) {
    params.set('yearTo', String(yearTo));
  }

  if (ratingMin !== null && ratingMin !== undefined) {
    params.set('ratingMin', String(ratingMin));
  }

  if (ratingMax !== null && ratingMax !== undefined) {
    params.set('ratingMax', String(ratingMax));
  }

  if (popularityMin !== null && popularityMin !== undefined) {
    params.set('popularityMin', String(popularityMin));
  }

  if (popularityMax !== null && popularityMax !== undefined) {
    params.set('popularityMax', String(popularityMax));
  }

  return params;
}

/**
 * 최근 검색 기록 필터의 서버 정렬값을 검색 페이지 정렬값으로 변환한다.
 */
function normalizeHistorySort(sortBy) {
  if (sortBy === 'rating') {
    return 'rating';
  }
  if (sortBy === 'release_date') {
    return 'date';
  }
  return 'relevance';
}

function readSearchCache() {
  try {
    const raw = window.sessionStorage.getItem(SEARCH_CACHE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSearchCache(payload) {
  try {
    window.sessionStorage.setItem(SEARCH_CACHE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage 저장 실패는 검색 UX를 막지 않음
  }
}

function clearSearchCache() {
  try {
    window.sessionStorage.removeItem(SEARCH_CACHE_STORAGE_KEY);
  } catch {
    // sessionStorage 접근 실패는 무시
  }
}

export default function SearchPage() {
  /* URL 쿼리 파라미터 연동 */
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSelectedGenres = parseSelectedGenresParam(searchParams.get('genres'));

  /* 검색 상태 */
  const [query, setQuery]         = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState(searchParams.get('searchType') || 'all');
  const [genre, setGenre]         = useState(searchParams.get('genre') || '전체');
  const [sort, setSort]           = useState(searchParams.get('sort') || 'relevance');
  const [isFilterAccordionOpen, setIsFilterAccordionOpen] = useState(true);
  const [yearFromInput, setYearFromInput] = useState(searchParams.get('yearFrom') || '');
  const [yearToInput, setYearToInput] = useState(searchParams.get('yearTo') || '');
  const [ratingMinInput, setRatingMinInput] = useState(searchParams.get('ratingMin') || '');
  const [ratingMaxInput, setRatingMaxInput] = useState(searchParams.get('ratingMax') || '');
  const [popularityMinInput, setPopularityMinInput] = useState(searchParams.get('popularityMin') || '');
  const [popularityMaxInput, setPopularityMaxInput] = useState(searchParams.get('popularityMax') || '');
  const [searchGenreOptions, setSearchGenreOptions] = useState([]);
  const [isSearchGenreOptionsLoading, setIsSearchGenreOptionsLoading] = useState(false);
  const [selectedSearchGenres, setSelectedSearchGenres] = useState(initialSelectedGenres);
  const [isDetailGenresExpanded, setIsDetailGenresExpanded] = useState(false);
  const [movies, setMovies]       = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  /* 검색 수행 여부 (초기 상태와 구분) */
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchContext, setLastSearchContext] = useState(null);
  const [recentPreviewSearches, setRecentPreviewSearches] = useState([]);
  const [isRecentPreviewLoading, setIsRecentPreviewLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [recentPagination, setRecentPagination] = useState(createInitialRecentPagination);
  const [isRecentLoading, setIsRecentLoading] = useState(false);
  const [isRecentLoadingMore, setIsRecentLoadingMore] = useState(false);
  const [deletingRecentKeyword, setDeletingRecentKeyword] = useState('');
  const [isDeletingAllRecent, setIsDeletingAllRecent] = useState(false);
  const [isRecentModalOpen, setIsRecentModalOpen] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [activeAutocompleteIndex, setActiveAutocompleteIndex] = useState(-1);
  const [autocompleteDidYouMean, setAutocompleteDidYouMean] = useState(null);
  const [searchDidYouMean, setSearchDidYouMean] = useState(null);
  const [relatedQueries, setRelatedQueries] = useState([]);
  const [searchSource, setSearchSource] = useState(null);
  const loadMoreRef = useRef(null);
  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const { primaryOptions: primarySearchGenreOptions, detailOptions: detailSearchGenreOptions } = (
    splitSearchGenreOptions(searchGenreOptions)
  );
  const normalizedAdvancedFilters = normalizeAdvancedFilters({
    yearFrom: yearFromInput,
    yearTo: yearToInput,
    ratingMin: ratingMinInput,
    ratingMax: ratingMaxInput,
    popularityMin: popularityMinInput,
    popularityMax: popularityMaxInput,
  });
  const advancedFilterError = getAdvancedFilterError(normalizedAdvancedFilters);
  const hasAdvancedFilters = hasActiveAdvancedFilters(normalizedAdvancedFilters);
  const hasInvalidAdvancedFilters = Boolean(advancedFilterError);
  const isKeywordSearchMode = Boolean(query.trim());
  const activeGenreFilterCount = isKeywordSearchMode
    ? (genre !== '전체' ? 1 : 0)
    : selectedSearchGenres.length;
  const filterSummaryParts = [];
  if (activeGenreFilterCount > 0) {
    filterSummaryParts.push(`장르 ${activeGenreFilterCount}개`);
  }
  if (hasAdvancedFilters) {
    filterSummaryParts.push('상세 필터 적용');
  }
  const filterSummaryText = filterSummaryParts.length > 0
    ? filterSummaryParts.join(' · ')
    : '필터 없이 전체 범위를 검색 중입니다.';

  const isAutocompleteSupportedSearchType = searchType === 'all' || searchType === 'title';

  /**
   * 자동완성 레이어 상태를 초기화한다.
   * 검색 제출/검색 타입 전환처럼 추천 목록을 닫아야 할 때 공통으로 사용한다.
   */
  const closeAutocomplete = useCallback(() => {
    setIsAutocompleteOpen(false);
    setActiveAutocompleteIndex(-1);
  }, []);

  const restoreSearchSnapshot = useCallback((snapshot) => {
    if (!snapshot) return;

    const restoredContext = snapshot.lastSearchContext || null;
    const restoredDiscoveryGenres = restoredContext?.discoveryGenres || [];

    setQuery(restoredContext?.query || '');
    setSearchType(restoredContext?.searchType || 'all');
    setGenre(restoredContext?.genre || '전체');
    setSort(restoredContext?.sort || 'relevance');
    setYearFromInput(toFilterInputValue(restoredContext?.yearFrom));
    setYearToInput(toFilterInputValue(restoredContext?.yearTo));
    setRatingMinInput(toFilterInputValue(restoredContext?.ratingMin));
    setRatingMaxInput(toFilterInputValue(restoredContext?.ratingMax));
    setPopularityMinInput(toFilterInputValue(restoredContext?.popularityMin));
    setPopularityMaxInput(toFilterInputValue(restoredContext?.popularityMax));
    setSelectedSearchGenres(restoredDiscoveryGenres);
    setIsDetailGenresExpanded(hasSelectedDetailGenres(restoredDiscoveryGenres));
    setMovies(snapshot.movies || []);
    setTotalCount(snapshot.totalCount || 0);
    setCurrentPage(snapshot.currentPage || 1);
    setHasMore(Boolean(snapshot.hasMore));
    setHasSearched(Boolean(snapshot.hasSearched));
    setLastSearchContext(restoredContext);
    setSearchDidYouMean(snapshot.searchDidYouMean || null);
    setRelatedQueries(snapshot.relatedQueries || []);
    setSearchSource(snapshot.searchSource || null);
    setIsLoading(false);
    setIsFetchingMore(false);
  }, []);

  /**
   * 검색을 실행하는 함수.
   * URL 파라미터도 동기화한다.
   */
  const executeSearch = useCallback(async ({
    query: searchQuery = query,
    searchType: currentSearchType = searchType,
    genre: searchGenre = genre,
    sort: searchSort = sort,
    page = 1,
    append = false,
    discoveryGenres = selectedSearchGenres,
    yearFromValue = yearFromInput,
    yearToValue = yearToInput,
    ratingMinValue = ratingMinInput,
    ratingMaxValue = ratingMaxInput,
    popularityMinValue = popularityMinInput,
    popularityMaxValue = popularityMaxInput,
  } = {}) => {
    const queryText = String(searchQuery || '').trim();
    const effectiveSearchType = currentSearchType || 'all';
    const effectiveGenre = queryText ? (searchGenre || '전체') : '전체';
    const effectiveSort = searchSort || 'relevance';
    const normalizedDiscoveryGenres = queryText ? [] : discoveryGenres.filter(Boolean);
    const normalizedFilters = normalizeAdvancedFilters({
      yearFrom: yearFromValue,
      yearTo: yearToValue,
      ratingMin: ratingMinValue,
      ratingMax: ratingMaxValue,
      popularityMin: popularityMinValue,
      popularityMax: popularityMaxValue,
    });
    const filterError = getAdvancedFilterError(normalizedFilters);
    const hasSearchFilters = hasActiveAdvancedFilters(normalizedFilters);
    const isGenreDiscoverySearch = !queryText && normalizedDiscoveryGenres.length > 0;
    const isFilterOnlySearch = !queryText && normalizedDiscoveryGenres.length === 0 && hasSearchFilters;
    const shouldRunSearch = Boolean(queryText) || isGenreDiscoverySearch || isFilterOnlySearch;

    if (filterError) {
      return;
    }

    if (!shouldRunSearch) {
      setMovies([]);
      setHasSearched(false);
      setTotalCount(0);
      setCurrentPage(1);
      setHasMore(false);
      setLastSearchContext(null);
      setSearchDidYouMean(null);
      setRelatedQueries([]);
      setSearchSource(null);
      setSearchParams(new URLSearchParams(), { replace: true });
      clearSearchCache();
      return;
    }

    if (append) {
      setIsFetchingMore(true);
    } else {
      setIsLoading(true);
      setHasSearched(true);
      if (effectiveSort !== searchSort) {
        setSort(effectiveSort);
      }
    }

    if (!append) {
      /* URL 쿼리 파라미터 업데이트 */
      const params = buildSearchParams({
        query: queryText,
        searchType: effectiveSearchType,
        genre: effectiveGenre,
        sort: effectiveSort,
        selectedGenres: normalizedDiscoveryGenres,
        yearFrom: normalizedFilters.yearFrom,
        yearTo: normalizedFilters.yearTo,
        ratingMin: normalizedFilters.ratingMin,
        ratingMax: normalizedFilters.ratingMax,
        popularityMin: normalizedFilters.popularityMin,
        popularityMax: normalizedFilters.popularityMax,
      });
      setSearchParams(params, { replace: true });
    }

    try {
      const result = await searchMovies({
        query: queryText,
        searchType: effectiveSearchType,
        genre: queryText && effectiveGenre !== '전체' ? effectiveGenre : '',
        genres: isGenreDiscoverySearch ? normalizedDiscoveryGenres : [],
        saveHistory: true,
        yearFrom: normalizedFilters.yearFrom,
        yearTo: normalizedFilters.yearTo,
        ratingMin: normalizedFilters.ratingMin,
        ratingMax: normalizedFilters.ratingMax,
        popularityMin: normalizedFilters.popularityMin,
        popularityMax: normalizedFilters.popularityMax,
        sort: effectiveSort,
        page,
        size: PAGE_SIZE,
      });

      const nextMovies = result?.movies || [];
      const nextTotal = result?.total || 0;
      const nextSearchSignature = buildSearchSignature({
        query: queryText,
        searchType: effectiveSearchType,
        genre: effectiveGenre,
        sort: effectiveSort,
        selectedGenres: normalizedDiscoveryGenres,
        yearFrom: normalizedFilters.yearFrom,
        yearTo: normalizedFilters.yearTo,
        ratingMin: normalizedFilters.ratingMin,
        ratingMax: normalizedFilters.ratingMax,
        popularityMin: normalizedFilters.popularityMin,
        popularityMax: normalizedFilters.popularityMax,
      });

      setMovies((prev) => (append ? [...prev, ...nextMovies] : nextMovies));
      setTotalCount(nextTotal);
      setCurrentPage(page);
      setHasMore(page * PAGE_SIZE < nextTotal);
      setSearchDidYouMean(result?.didYouMean || null);
      setRelatedQueries(result?.relatedQueries || []);
      setSearchSource(result?.searchSource || null);
      setLastSearchContext({
        query: queryText,
        searchType: effectiveSearchType,
        genre: effectiveGenre,
        sort: effectiveSort,
        discoveryGenres: normalizedDiscoveryGenres,
        searchMode: isGenreDiscoverySearch ? 'genre_discovery' : (isFilterOnlySearch ? 'filter_only' : 'keyword'),
        resultCount: nextTotal,
        signature: nextSearchSignature,
        yearFrom: normalizedFilters.yearFrom,
        yearTo: normalizedFilters.yearTo,
        ratingMin: normalizedFilters.ratingMin,
        ratingMax: normalizedFilters.ratingMax,
        popularityMin: normalizedFilters.popularityMin,
        popularityMax: normalizedFilters.popularityMax,
      });

      /* Phase 2: 검색 실행 이벤트 (첫 페이지만 기록) */
      if (!append) {
        trackEvent('search', null, {
          query: queryText || normalizedDiscoveryGenres.join(',') || '상세 필터 검색',
          searchType: effectiveSearchType,
          genre: queryText ? effectiveGenre : normalizedDiscoveryGenres.join(','),
          sort: effectiveSort,
          resultCount: nextTotal,
        });
      }
    } catch {
      if (!append) {
        setMovies([]);
        setTotalCount(0);
        setCurrentPage(1);
        setHasMore(false);
        setLastSearchContext(null);
        setSearchDidYouMean(null);
        setRelatedQueries([]);
        setSearchSource(null);
        clearSearchCache();
      }
    } finally {
      if (append) {
        setIsFetchingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [
    genre,
    popularityMaxInput,
    popularityMinInput,
    query,
    ratingMaxInput,
    ratingMinInput,
    searchType,
    selectedSearchGenres,
    setSearchParams,
    sort,
    yearFromInput,
    yearToInput,
  ]);

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
    const urlSort = searchParams.get('sort') || 'relevance';
    const urlSelectedGenres = parseSelectedGenresParam(searchParams.get('genres'));
    const urlYearFrom = searchParams.get('yearFrom') || '';
    const urlYearTo = searchParams.get('yearTo') || '';
    const urlRatingMin = searchParams.get('ratingMin') || '';
    const urlRatingMax = searchParams.get('ratingMax') || '';
    const urlPopularityMin = searchParams.get('popularityMin') || '';
    const urlPopularityMax = searchParams.get('popularityMax') || '';
    const normalizedUrlFilters = normalizeAdvancedFilters({
      yearFrom: urlYearFrom,
      yearTo: urlYearTo,
      ratingMin: urlRatingMin,
      ratingMax: urlRatingMax,
      popularityMin: urlPopularityMin,
      popularityMax: urlPopularityMax,
    });
    const hasUrlAdvancedFilters = hasActiveAdvancedFilters(normalizedUrlFilters);

    setQuery(urlQuery || '');
    setSearchType(urlSearchType);
    setGenre(urlGenre);
    setSort(urlSort);
    setYearFromInput(urlYearFrom);
    setYearToInput(urlYearTo);
    setRatingMinInput(urlRatingMin);
    setRatingMaxInput(urlRatingMax);
    setPopularityMinInput(urlPopularityMin);
    setPopularityMaxInput(urlPopularityMax);
    setSelectedSearchGenres(urlSelectedGenres);
    setIsDetailGenresExpanded(hasSelectedDetailGenres(urlSelectedGenres));

    if (urlQuery || urlSelectedGenres.length > 0 || hasUrlAdvancedFilters) {

      const cacheKey = buildSearchCacheKey({
        query: urlQuery || '',
        searchType: urlSearchType,
        genre: urlGenre,
        sort: urlSort,
        selectedGenres: urlSelectedGenres,
        yearFrom: normalizedUrlFilters.yearFrom,
        yearTo: normalizedUrlFilters.yearTo,
        ratingMin: normalizedUrlFilters.ratingMin,
        ratingMax: normalizedUrlFilters.ratingMax,
        popularityMin: normalizedUrlFilters.popularityMin,
        popularityMax: normalizedUrlFilters.popularityMax,
      });
      const cachedSearch = readSearchCache();

      if (cachedSearch?.key === cacheKey) {
        restoreSearchSnapshot(cachedSearch.snapshot);
        return;
      }

      executeSearch({
        query: urlQuery || '',
        searchType: urlSearchType,
        genre: urlGenre,
        sort: urlSort,
        page: 1,
        append: false,
        discoveryGenres: urlSelectedGenres,
        yearFromValue: urlYearFrom,
        yearToValue: urlYearTo,
        ratingMinValue: urlRatingMin,
        ratingMaxValue: urlRatingMax,
        popularityMinValue: urlPopularityMin,
        popularityMaxValue: urlPopularityMax,
      });
    }
  }, [executeSearch, restoreSearchSnapshot, searchParams]);

  /**
   * 텍스트 검색이 비어 있을 때 사용할 다중 장르 토글 옵션을 받아온다.
   * 검색 페이지 진입 직후 1회 로드해 장르 발견형 검색에 사용한다.
   */
  useEffect(() => {
    let isMounted = true;

    const fetchSearchGenres = async () => {
      setIsSearchGenreOptionsLoading(true);
      try {
        const genres = await getSearchGenres();
        if (isMounted) {
          setSearchGenreOptions(genres);
        }
      } catch {
        if (isMounted) {
          setSearchGenreOptions([]);
        }
      } finally {
        if (isMounted) {
          setIsSearchGenreOptionsLoading(false);
        }
      }
    };

    fetchSearchGenres();
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * 검색창 아래에 노출할 최근 검색 기록 미리보기 5개를 불러온다.
   * 모달을 열기 전에도 사용자가 최근 키워드를 빠르게 확인할 수 있게 한다.
   */
  const loadRecentPreview = useCallback(async () => {
    if (!isAuthenticated) {
      setRecentPreviewSearches([]);
      setIsRecentPreviewLoading(false);
      return;
    }

    setIsRecentPreviewLoading(true);
    try {
      const data = await getRecentSearches({
        offset: 0,
        limit: RECENT_PREVIEW_SIZE,
      });
      setRecentPreviewSearches(data.searches || []);
    } catch {
      setRecentPreviewSearches([]);
    } finally {
      setIsRecentPreviewLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * 최근 검색 기록을 페이지 단위로 불러온다.
   * 모달 첫 진입 시에는 10개를 새로 읽고, 스크롤 하단 도달 시에는 이어붙인다.
   */
  const loadRecentSearches = useCallback(async ({
    offset = 0,
    append = false,
  } = {}) => {
    if (!isAuthenticated) {
      setRecentSearches([]);
      setRecentPagination(createInitialRecentPagination());
      setIsRecentLoading(false);
      setIsRecentLoadingMore(false);
      return;
    }

    if (append) {
      setIsRecentLoadingMore(true);
    } else {
      setIsRecentLoading(true);
      setRecentSearches([]);
      setRecentPagination(createInitialRecentPagination());
    }

    try {
      const data = await getRecentSearches({
        offset,
        limit: RECENT_HISTORY_PAGE_SIZE,
      });

      setRecentSearches((prev) => (
        append ? [...prev, ...(data.searches || [])] : (data.searches || [])
      ));
      setRecentPagination({
        ...createInitialRecentPagination(),
        ...data.pagination,
      });
    } catch {
      if (!append) {
        setRecentSearches([]);
        setRecentPagination(createInitialRecentPagination());
      }
    } finally {
      if (append) {
        setIsRecentLoadingMore(false);
      } else {
        setIsRecentLoading(false);
      }
    }
  }, [isAuthenticated]);

  /**
   * 인증 상태가 사라지면 검색 기록 모달과 목록 상태를 함께 정리한다.
   */
  useEffect(() => {
    if (isAuthenticated) {
      return;
    }

    setIsRecentModalOpen(false);
    setRecentPreviewSearches([]);
    setRecentSearches([]);
    setRecentPagination(createInitialRecentPagination());
  }, [isAuthenticated]);

  /**
   * 로그인 사용자는 검색 페이지 진입 직후 최근 검색 기록 미리보기를 받아온다.
   */
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    loadRecentPreview();
  }, [isAuthenticated, loadRecentPreview]);

  useEffect(() => {
    const hasRecentSearchKeyword = Boolean(lastSearchContext?.query?.trim());
    const hasRecentSearchGenres = Boolean(lastSearchContext?.discoveryGenres?.length);

    if (!isAuthenticated || !hasSearched || currentPage !== 1 || (!hasRecentSearchKeyword && !hasRecentSearchGenres)) {
      return;
    }

    loadRecentPreview();
    if (isRecentModalOpen) {
      loadRecentSearches({ offset: 0 });
    }
  }, [
    currentPage,
    hasSearched,
    isRecentModalOpen,
    isAuthenticated,
    lastSearchContext?.discoveryGenres,
    lastSearchContext?.query,
    loadRecentPreview,
    loadRecentSearches,
  ]);

  /**
   * 모달이 열려 있는 동안에는 ESC 닫기와 body 스크롤 잠금을 적용한다.
   */
  useEffect(() => {
    if (!isRecentModalOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsRecentModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRecentModalOpen]);

  useEffect(() => {
    const hasCachedQuery = Boolean(lastSearchContext?.query?.trim());
    const hasCachedGenres = Boolean(lastSearchContext?.discoveryGenres?.length);
    const hasCachedAdvancedFilters = hasActiveAdvancedFilters({
      yearFrom: lastSearchContext?.yearFrom ?? null,
      yearTo: lastSearchContext?.yearTo ?? null,
      ratingMin: lastSearchContext?.ratingMin ?? null,
      ratingMax: lastSearchContext?.ratingMax ?? null,
      popularityMin: lastSearchContext?.popularityMin ?? null,
      popularityMax: lastSearchContext?.popularityMax ?? null,
    });

    if (!hasSearched || (!hasCachedQuery && !hasCachedGenres && !hasCachedAdvancedFilters)) {
      return;
    }

    writeSearchCache({
      key: buildSearchCacheKey({
        query: lastSearchContext.query,
        searchType: lastSearchContext.searchType,
        genre: lastSearchContext.genre,
        sort: lastSearchContext.sort,
        selectedGenres: lastSearchContext.discoveryGenres || [],
        yearFrom: lastSearchContext.yearFrom,
        yearTo: lastSearchContext.yearTo,
        ratingMin: lastSearchContext.ratingMin,
        ratingMax: lastSearchContext.ratingMax,
        popularityMin: lastSearchContext.popularityMin,
        popularityMax: lastSearchContext.popularityMax,
      }),
      snapshot: {
        movies,
        totalCount,
        currentPage,
        hasMore,
        hasSearched,
        lastSearchContext,
        searchDidYouMean,
        relatedQueries,
        searchSource,
      },
    });
  }, [
    currentPage,
    hasMore,
    hasSearched,
    lastSearchContext,
    movies,
    relatedQueries,
    searchDidYouMean,
    searchSource,
    totalCount,
  ]);

  /**
   * 입력 중인 제목을 debounce 하여 자동완성 후보를 가져온다.
   * 현재 자동완성 로직은 제목 기반이므로 title/all 검색 타입에서만 노출한다.
   */
  useEffect(() => {
    const queryText = query.trim();

    if (!queryText || !isAutocompleteSupportedSearchType) {
      setAutocompleteSuggestions([]);
      setAutocompleteDidYouMean(null);
      setIsAutocompleteLoading(false);
      closeAutocomplete();
      return undefined;
    }

    let isMounted = true;
    const timerId = window.setTimeout(async () => {
      setIsAutocompleteLoading(true);
      try {
        const autocompleteResult = await getAutocompleteSuggestions({
          query: queryText,
          limit: AUTOCOMPLETE_LIMIT,
        });
        if (!isMounted) {
          return;
        }

        const nextSuggestions = autocompleteResult?.suggestions || [];
        const nextDidYouMean = autocompleteResult?.didYouMean || null;

        setAutocompleteSuggestions(nextSuggestions);
        setAutocompleteDidYouMean(nextDidYouMean);
        // 기본 하이라이트 없음(-1): Enter 키는 사용자가 입력한 query 로 검색해야 하며,
        // 자동완성 추천어는 사용자가 ArrowDown/클릭으로 명시 선택했을 때만 반영한다.
        // (과거 첫 항목(0)을 자동 선택해 Enter 시 추천어로 치환되던 버그 수정)
        setActiveAutocompleteIndex(-1);
        setIsAutocompleteOpen(
          (nextSuggestions.length > 0 || Boolean(nextDidYouMean))
            && document.activeElement === searchInputRef.current
        );
      } catch {
        if (!isMounted) {
          return;
        }

        setAutocompleteSuggestions([]);
        setAutocompleteDidYouMean(null);
        setActiveAutocompleteIndex(-1);
        setIsAutocompleteOpen(false);
      } finally {
        if (isMounted) {
          setIsAutocompleteLoading(false);
        }
      }
    }, AUTOCOMPLETE_DEBOUNCE_MS);

    return () => {
      isMounted = false;
      window.clearTimeout(timerId);
    };
  }, [closeAutocomplete, isAutocompleteSupportedSearchType, query]);

  /**
   * 자동완성 레이어 바깥을 클릭하면 추천 목록을 닫는다.
   * 검색 페이지 다른 조작과 자연스럽게 공존하도록 outside click 패턴을 사용한다.
   */
  useEffect(() => {
    const handlePointerDown = (event) => {
      if (autocompleteRef.current?.contains(event.target)) {
        return;
      }

      closeAutocomplete();
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, [closeAutocomplete]);

  /**
   * 자동완성 후보를 선택한다.
   * 추천어를 입력창에 반영한 뒤 바로 동일 키워드로 검색 결과를 연다.
   */
  const handleSelectAutocomplete = useCallback((suggestion) => {
    if (!suggestion) {
      return;
    }

    setQuery(suggestion);
    setAutocompleteSuggestions([]);
    setAutocompleteDidYouMean(null);
    closeAutocomplete();
    executeSearch({
      query: suggestion,
      searchType,
      genre,
      sort,
      page: 1,
      append: false,
      discoveryGenres: selectedSearchGenres,
    });
  }, [closeAutocomplete, executeSearch, genre, searchType, selectedSearchGenres, sort]);

  /**
   * 검색 폼 제출 핸들러.
   *
   * @param {Event} e - 폼 제출 이벤트
   */
  const handleSearch = (e) => {
    e.preventDefault();
    closeAutocomplete();
    if (hasInvalidAdvancedFilters) {
      return;
    }

    executeSearch({
      query,
      searchType,
      genre,
      sort,
      page: 1,
      append: false,
      discoveryGenres: selectedSearchGenres,
    });
  };

  /**
   * 검색 입력 변경 핸들러.
   * 입력값을 갱신하면서, 제목 자동완성 가능 상태면 추천 목록을 다시 열 준비를 한다.
   */
  const handleQueryChange = useCallback((nextValue) => {
    setQuery(nextValue);
    setActiveAutocompleteIndex(-1);

    if (!nextValue.trim()) {
      setAutocompleteSuggestions([]);
      setAutocompleteDidYouMean(null);
      closeAutocomplete();
    }
  }, [closeAutocomplete]);

  /**
   * 검색 입력 키보드 조작을 처리한다.
   * 위/아래 화살표로 추천어 이동, Enter로 선택, Escape로 닫기를 지원한다.
   */
  const handleQueryKeyDown = useCallback((event) => {
    if (!isAutocompleteOpen || autocompleteSuggestions.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveAutocompleteIndex((prev) => (
        prev < autocompleteSuggestions.length - 1 ? prev + 1 : 0
      ));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveAutocompleteIndex((prev) => (
        prev > 0 ? prev - 1 : autocompleteSuggestions.length - 1
      ));
      return;
    }

    if (event.key === 'Enter' && activeAutocompleteIndex >= 0) {
      event.preventDefault();
      handleSelectAutocomplete(autocompleteSuggestions[activeAutocompleteIndex]);
      return;
    }

    if (event.key === 'Escape') {
      closeAutocomplete();
    }
  }, [
    activeAutocompleteIndex,
    autocompleteSuggestions,
    closeAutocomplete,
    handleSelectAutocomplete,
    isAutocompleteOpen,
  ]);

  /**
   * 텍스트 검색이 없을 때 사용하는 장르 발견형 토글을 켜고 끈다.
   * 다중 선택이 가능하며, 실제 검색 실행은 [검색] 버튼 클릭 시점에만 일어난다.
   */
  const handleSearchGenreToggle = useCallback((genreLabel) => {
    setSelectedSearchGenres((prev) => (
      prev.includes(genreLabel)
        ? prev.filter((item) => item !== genreLabel)
        : [...prev, genreLabel]
    ));
  }, []);

  /**
   * 세부 장르 영역을 펼치거나 닫는다.
   * 토글 텍스트를 클릭해 세부 장르 목록 노출 여부를 바로 전환할 수 있다.
   */
  const handleToggleDetailGenres = useCallback(() => {
    setIsDetailGenresExpanded((prev) => !prev);
  }, []);

  const handleToggleFilterAccordion = useCallback(() => {
    setIsFilterAccordionOpen((prev) => !prev);
  }, []);

  /**
   * 전체 검색 기록 모달을 연다.
   * 열리는 시점마다 첫 페이지를 다시 읽어 최신 상태를 보장한다.
   */
  const handleOpenRecentModal = useCallback(() => {
    setIsRecentModalOpen(true);
    loadRecentSearches({ offset: 0 });
  }, [loadRecentSearches]);

  /**
   * 전체 검색 기록 모달을 닫는다.
   */
  const handleCloseRecentModal = useCallback(() => {
    setIsRecentModalOpen(false);
  }, []);

  /**
   * 최근 검색 기록에서 특정 키워드를 삭제한다.
   * 삭제 후에는 미리보기와 모달 목록을 최신 상태로 다시 동기화한다.
   */
  const handleDeleteRecentKeyword = useCallback(async (keyword) => {
    if (!keyword) {
      return;
    }

    setDeletingRecentKeyword(keyword);
    try {
      await deleteRecentSearchKeyword(keyword);
      await loadRecentPreview();
      if (isRecentModalOpen) {
        await loadRecentSearches({ offset: 0 });
      }
    } catch {
      // 삭제 실패가 검색 페이지 전체 동작을 막지 않도록 UI 에러만 무시한다.
    } finally {
      setDeletingRecentKeyword('');
    }
  }, [isRecentModalOpen, loadRecentPreview, loadRecentSearches]);

  /**
   * 최근 검색 기록 전체를 삭제한다.
   * 실수 방지를 위해 브라우저 확인창을 한 번 거친다.
   */
  const handleDeleteAllRecentSearches = useCallback(async () => {
    const confirmed = window.confirm('최근 검색 기록을 전체 삭제할까요?');
    if (!confirmed) {
      return;
    }

    setIsDeletingAllRecent(true);
    try {
      await deleteAllRecentSearches();
      setRecentPreviewSearches([]);
      setRecentSearches([]);
      setRecentPagination(createInitialRecentPagination());
    } catch {
      // 전체 삭제 실패가 검색 페이지 전체 동작을 막지 않도록 UI 에러만 무시한다.
    } finally {
      setIsDeletingAllRecent(false);
    }
  }, []);

  /**
   * 모달 하단에 가까워지면 더 오래된 검색 기록 10개를 이어서 불러온다.
   */
  const loadMoreRecentSearches = useCallback(() => {
    if (!isRecentModalOpen || isRecentLoading || isRecentLoadingMore || !recentPagination.has_more) {
      return;
    }

    loadRecentSearches({
      offset: recentPagination.next_offset ?? recentSearches.length,
      append: true,
    });
  }, [
    isRecentLoading,
    isRecentLoadingMore,
    isRecentModalOpen,
    loadRecentSearches,
    recentPagination.has_more,
    recentPagination.next_offset,
    recentSearches.length,
  ]);

  /**
   * 모달 내부 스크롤이 바닥 근처에 도달하면 다음 페이지를 요청한다.
   */
  const handleRecentModalScroll = useCallback((event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const remainingScroll = scrollHeight - scrollTop - clientHeight;

    if (remainingScroll <= RECENT_HISTORY_SCROLL_THRESHOLD) {
      loadMoreRecentSearches();
    }
  }, [loadMoreRecentSearches]);

  /**
   * 최근 검색 기록에서 키워드를 다시 선택하면 모달을 닫고 동일 조건으로 재검색한다.
   */
  const handleRecentSearchClick = useCallback((item) => {
    const historyFilters = item?.filters || {};
    const historyGenres = Array.isArray(historyFilters.genres) ? historyFilters.genres : [];
    const isGenreHistory = historyFilters.search_mode === 'genre_discovery' && historyGenres.length > 0;
    const restoredSort = normalizeHistorySort(historyFilters.sort_by);
    const restoredSearchType = historyFilters.search_type || 'all';
    const restoredGenre = historyFilters.genre || '전체';
    const restoredYearFrom = toFilterInputValue(historyFilters.year_from);
    const restoredYearTo = toFilterInputValue(historyFilters.year_to);
    const restoredRatingMin = toFilterInputValue(historyFilters.rating_min);
    const restoredRatingMax = toFilterInputValue(historyFilters.rating_max);
    const restoredPopularityMin = toFilterInputValue(historyFilters.popularity_min);
    const restoredPopularityMax = toFilterInputValue(historyFilters.popularity_max);

    if (isGenreHistory) {
      setQuery('');
      setSearchType(restoredSearchType);
      setGenre('전체');
      setSort(restoredSort);
      setYearFromInput(restoredYearFrom);
      setYearToInput(restoredYearTo);
      setRatingMinInput(restoredRatingMin);
      setRatingMaxInput(restoredRatingMax);
      setPopularityMinInput(restoredPopularityMin);
      setPopularityMaxInput(restoredPopularityMax);
      setSelectedSearchGenres(historyGenres);
      setIsDetailGenresExpanded(hasSelectedDetailGenres(historyGenres));
      setIsRecentModalOpen(false);
      executeSearch({
        query: '',
        searchType: restoredSearchType,
        genre: '전체',
        sort: restoredSort,
        page: 1,
        append: false,
        discoveryGenres: historyGenres,
        yearFromValue: restoredYearFrom,
        yearToValue: restoredYearTo,
        ratingMinValue: restoredRatingMin,
        ratingMaxValue: restoredRatingMax,
        popularityMinValue: restoredPopularityMin,
        popularityMaxValue: restoredPopularityMax,
      });
      return;
    }

    setQuery(item.keyword);
    setSearchType(restoredSearchType);
    setGenre(restoredGenre);
    setSort(restoredSort);
    setYearFromInput(restoredYearFrom);
    setYearToInput(restoredYearTo);
    setRatingMinInput(restoredRatingMin);
    setRatingMaxInput(restoredRatingMax);
    setPopularityMinInput(restoredPopularityMin);
    setPopularityMaxInput(restoredPopularityMax);
    setSelectedSearchGenres([]);
    setIsDetailGenresExpanded(false);
    setIsRecentModalOpen(false);
    executeSearch({
      query: item.keyword,
      searchType: restoredSearchType,
      genre: restoredGenre,
      sort: restoredSort,
      page: 1,
      append: false,
      discoveryGenres: [],
      yearFromValue: restoredYearFrom,
      yearToValue: restoredYearTo,
      ratingMinValue: restoredRatingMin,
      ratingMaxValue: restoredRatingMax,
      popularityMinValue: restoredPopularityMin,
      popularityMaxValue: restoredPopularityMax,
    });
  }, [executeSearch]);

  /**
   * 장르 필터 변경 핸들러.
   *
   * @param {string} selectedGenre - 선택된 장르
   */
  const handleGenreChange = (selectedGenre) => {
    setGenre(selectedGenre);
    if (query.trim()) {
      executeSearch({
        query,
        searchType,
        genre: selectedGenre,
        sort,
        page: 1,
        append: false,
      });
    }
  };

  /**
   * 검색 대상 변경 핸들러.
   *
   * @param {string} selectedType - 선택된 검색 대상
   */
  const handleSearchTypeChange = (selectedType) => {
    setSearchType(selectedType);
    closeAutocomplete();
    if (query.trim()) {
      executeSearch({
        query,
        searchType: selectedType,
        genre,
        sort,
        page: 1,
        append: false,
      });
    }
  };

  const handleApplyAdvancedFilters = useCallback(() => {
    if (hasInvalidAdvancedFilters) {
      return;
    }

    executeSearch({
      query,
      searchType,
      genre,
      sort,
      page: 1,
      append: false,
      discoveryGenres: selectedSearchGenres,
    });
  }, [
    executeSearch,
    genre,
    hasInvalidAdvancedFilters,
    query,
    searchType,
    selectedSearchGenres,
    sort,
  ]);

  const handleResetAdvancedFilters = useCallback(() => {
    setYearFromInput('');
    setYearToInput('');
    setRatingMinInput('');
    setRatingMaxInput('');
    setPopularityMinInput('');
    setPopularityMaxInput('');

    if (!hasAdvancedFilters && !hasSearched) {
      return;
    }

    executeSearch({
      query,
      searchType,
      genre,
      sort,
      page: 1,
      append: false,
      discoveryGenres: selectedSearchGenres,
      yearFromValue: '',
      yearToValue: '',
      ratingMinValue: '',
      ratingMaxValue: '',
      popularityMinValue: '',
      popularityMaxValue: '',
    });
  }, [
    executeSearch,
    genre,
    hasAdvancedFilters,
    hasSearched,
    query,
    searchType,
    selectedSearchGenres,
    sort,
  ]);

  /**
   * 정렬 옵션 변경 핸들러.
   *
   * @param {string} selectedSort - 선택된 정렬 기준
   */
  const handleSortChange = (selectedSort) => {
    setSort(selectedSort);
    if (!hasSearched) {
      return;
    }

    const queryText = (lastSearchContext?.query || query).trim();
    const normalizedDiscoveryGenres = (
      lastSearchContext?.discoveryGenres || selectedSearchGenres
    );
    executeSearch({
      query: queryText,
      searchType: lastSearchContext?.searchType || searchType,
      genre: queryText ? (lastSearchContext?.genre || genre) : '전체',
      sort: selectedSort,
      page: 1,
      append: false,
      discoveryGenres: queryText ? [] : normalizedDiscoveryGenres,
      yearFromValue: yearFromInput,
      yearToValue: yearToInput,
      ratingMinValue: ratingMinInput,
      ratingMaxValue: ratingMaxInput,
      popularityMinValue: popularityMinInput,
      popularityMaxValue: popularityMaxInput,
    });
  };

  /**
   * 현재 조건으로 다음 페이지를 로드한다.
   */
  const loadMoreMovies = useCallback(() => {
    if (!hasSearched || isLoading || isFetchingMore || !hasMore) {
      return;
    }

    const pagedQuery = lastSearchContext?.query || query;
    const pagedSearchType = lastSearchContext?.searchType || searchType;
    const pagedGenre = lastSearchContext?.genre || genre;
    const pagedSort = lastSearchContext?.sort || sort;
    const pagedDiscoveryGenres = lastSearchContext?.discoveryGenres || selectedSearchGenres;

    executeSearch({
      query: pagedQuery,
      searchType: pagedSearchType,
      genre: pagedGenre,
      sort: pagedSort,
      page: currentPage + 1,
      append: true,
      discoveryGenres: pagedDiscoveryGenres,
      yearFromValue: lastSearchContext?.yearFrom ?? null,
      yearToValue: lastSearchContext?.yearTo ?? null,
      ratingMinValue: lastSearchContext?.ratingMin ?? null,
      ratingMaxValue: lastSearchContext?.ratingMax ?? null,
      popularityMinValue: lastSearchContext?.popularityMin ?? null,
      popularityMaxValue: lastSearchContext?.popularityMax ?? null,
    });
  }, [
    currentPage,
    executeSearch,
    genre,
    hasMore,
    hasSearched,
    isFetchingMore,
    isLoading,
    lastSearchContext?.discoveryGenres,
    lastSearchContext?.searchType,
    lastSearchContext?.genre,
    lastSearchContext?.query,
    lastSearchContext?.sort,
    lastSearchContext?.yearFrom,
    lastSearchContext?.yearTo,
    lastSearchContext?.ratingMin,
    lastSearchContext?.ratingMax,
    lastSearchContext?.popularityMin,
    lastSearchContext?.popularityMax,
    query,
    selectedSearchGenres,
    searchType,
    sort,
  ]);

  /**
   * 결과 목록 하단 sentinel이 화면에 들어오면 다음 페이지를 자동 요청한다.
   */
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasSearched || !hasMore) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMoreMovies();
        }
      },
      {
        rootMargin: '240px 0px',
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, hasSearched, loadMoreMovies]);

  const handleMovieClick = useCallback(async (movie) => {
    const searchKeyword = lastSearchContext?.query?.trim()
      || lastSearchContext?.discoveryGenres?.join(',');

    if (!searchKeyword) {
      return;
    }

    try {
      await logSearchResultClick({
        keyword: searchKeyword,
        clickedMovieId: movie.id || movie.movieId,
        resultCount: lastSearchContext.resultCount,
        filters: {
          search_type: lastSearchContext.searchType,
          genre: lastSearchContext.genre === '전체' ? null : lastSearchContext.genre,
          genres: lastSearchContext.discoveryGenres || [],
          search_mode: lastSearchContext.searchMode || 'keyword',
          sort: lastSearchContext.sort,
          year_from: lastSearchContext.yearFrom ?? null,
          year_to: lastSearchContext.yearTo ?? null,
          rating_min: lastSearchContext.ratingMin ?? null,
          rating_max: lastSearchContext.ratingMax ?? null,
          popularity_min: lastSearchContext.popularityMin ?? null,
          popularity_max: lastSearchContext.popularityMax ?? null,
        },
      });
    } catch {
      // 클릭 로그 저장 실패가 상세 페이지 이동을 막으면 안 됨
    }
  }, [lastSearchContext]);

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
            <S.InputField ref={autocompleteRef}>
              <S.InputIcon aria-hidden="true">🔍</S.InputIcon>
              <S.Input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={handleQueryKeyDown}
                onFocus={() => {
                  if (autocompleteSuggestions.length > 0 || autocompleteDidYouMean) {
                    setIsAutocompleteOpen(true);
                  }
                }}
                placeholder="영화 제목, 배우, 감독을 검색하세요..."
                aria-autocomplete="list"
                aria-expanded={isAutocompleteOpen}
                autoFocus
              />

              {(isAutocompleteLoading || isAutocompleteOpen) && (
                <S.AutocompletePanel>
                  {isAutocompleteLoading && (
                    <S.AutocompleteMessage>자동완성 후보를 불러오는 중입니다.</S.AutocompleteMessage>
                  )}

                  {!isAutocompleteLoading && autocompleteSuggestions.length > 0 && (
                    <S.AutocompleteList>
                      {autocompleteSuggestions.map((suggestion, index) => (
                        <S.AutocompleteItem key={`${suggestion}-${index}`}>
                          <S.AutocompleteButton
                            type="button"
                            $active={index === activeAutocompleteIndex}
                            onClick={() => handleSelectAutocomplete(suggestion)}
                          >
                            {suggestion}
                          </S.AutocompleteButton>
                        </S.AutocompleteItem>
                      ))}
                    </S.AutocompleteList>
                  )}

                  {!isAutocompleteLoading && autocompleteDidYouMean && (
                    <S.AutocompleteDidYouMeanWrap>
                      <S.AutocompleteDidYouMeanLabel>
                        혹시 {autocompleteDidYouMean}?
                      </S.AutocompleteDidYouMeanLabel>
                      <S.AutocompleteDidYouMeanButton
                        type="button"
                        onClick={() => handleSelectAutocomplete(autocompleteDidYouMean)}
                      >
                        {autocompleteDidYouMean}
                      </S.AutocompleteDidYouMeanButton>
                    </S.AutocompleteDidYouMeanWrap>
                  )}
                </S.AutocompletePanel>
              )}
            </S.InputField>
            <S.SearchButton type="submit" disabled={isLoading}>
              검색
            </S.SearchButton>
          </S.InputWrap>
        </S.Form>

        {isAuthenticated && (
          <S.RecentSection>
            <S.RecentHeader>
              <S.RecentTitle>최근 검색 기록</S.RecentTitle>
              <S.RecentActionButton
                type="button"
                onClick={handleOpenRecentModal}
              >
                전체보기
              </S.RecentActionButton>
            </S.RecentHeader>

            {isRecentPreviewLoading && (
              <S.RecentPreviewEmpty>최근 검색 기록을 불러오는 중입니다.</S.RecentPreviewEmpty>
            )}

            {!isRecentPreviewLoading && recentPreviewSearches.length === 0 && (
              <S.RecentPreviewEmpty>최근 검색 기록이 아직 없습니다.</S.RecentPreviewEmpty>
            )}

            {!isRecentPreviewLoading && recentPreviewSearches.length > 0 && (
              <S.RecentPreviewList>
                {recentPreviewSearches.map((item) => (
                  <S.RecentPreviewItem key={`preview-${item.keyword}-${item.searched_at}`}>
                    <S.RecentPreviewButton
                      type="button"
                      onClick={() => handleRecentSearchClick(item)}
                    >
                      <S.RecentPreviewKeyword $isGenreHistory={isGenreDiscoveryRecentSearch(item)}>
                        {getRecentSearchDisplayKeyword(item)}
                      </S.RecentPreviewKeyword>
                    </S.RecentPreviewButton>
                  </S.RecentPreviewItem>
                ))}
              </S.RecentPreviewList>
            )}
          </S.RecentSection>
        )}

        <S.FilterAccordion>
          <S.FilterAccordionHeader>
            <S.FilterAccordionHeading>
              <S.FilterAccordionTitle>장르 / 상세 필터</S.FilterAccordionTitle>
              <S.FilterAccordionSummary>{filterSummaryText}</S.FilterAccordionSummary>
            </S.FilterAccordionHeading>
            <S.FilterAccordionToggle
              type="button"
              onClick={handleToggleFilterAccordion}
              aria-expanded={isFilterAccordionOpen}
              aria-controls="search-filter-accordion"
            >
              {isFilterAccordionOpen ? '접기' : '펼치기'}
              <S.FilterAccordionIcon $expanded={isFilterAccordionOpen} aria-hidden="true">
                ▾
              </S.FilterAccordionIcon>
            </S.FilterAccordionToggle>
          </S.FilterAccordionHeader>

          {isFilterAccordionOpen && (
            <S.FilterAccordionContent id="search-filter-accordion">
              <S.SearchGenreSection>
                <S.SearchGenreTitle>
                  {isKeywordSearchMode ? '장르 필터' : '장르로 찾기'}
                </S.SearchGenreTitle>
                <S.SearchGenreDescription>
                  {isKeywordSearchMode
                    ? '키워드 검색 결과를 장르별로 더 좁혀볼 수 있습니다.'
                    : '관심있는 장르를 여러 개 선택해 검색할 수 있습니다.'}
                </S.SearchGenreDescription>

                {isKeywordSearchMode ? (
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
                ) : (
                  <>
                    {isSearchGenreOptionsLoading && (
                      <S.SearchGenreEmpty>장르 목록을 불러오는 중입니다.</S.SearchGenreEmpty>
                    )}

                    {!isSearchGenreOptionsLoading && searchGenreOptions.length === 0 && (
                      <S.SearchGenreEmpty>표시할 장르가 없습니다.</S.SearchGenreEmpty>
                    )}

                    {!isSearchGenreOptionsLoading && searchGenreOptions.length > 0 && (
                      <S.SearchGenreGroups>
                        <S.SearchGenreGrid>
                          {primarySearchGenreOptions.map((item) => (
                            <S.SearchGenreToggle
                              key={item.label}
                              type="button"
                              $active={selectedSearchGenres.includes(item.label)}
                              onClick={() => handleSearchGenreToggle(item.label)}
                            >
                              {item.label}
                            </S.SearchGenreToggle>
                          ))}
                        </S.SearchGenreGrid>

                        {detailSearchGenreOptions.length > 0 && (
                          <S.SearchGenreDetailSection>
                            <S.SearchGenreDetailToggle
                              type="button"
                              onClick={handleToggleDetailGenres}
                            >
                              {isDetailGenresExpanded ? '세부 장르 닫기' : '세부 장르 펼치기'}
                            </S.SearchGenreDetailToggle>

                            {isDetailGenresExpanded && (
                              <S.SearchGenreGrid>
                                {detailSearchGenreOptions.map((item) => (
                                  <S.SearchGenreToggle
                                    key={item.label}
                                    type="button"
                                    $active={selectedSearchGenres.includes(item.label)}
                                    onClick={() => handleSearchGenreToggle(item.label)}
                                  >
                                    {item.label}
                                  </S.SearchGenreToggle>
                                ))}
                              </S.SearchGenreGrid>
                            )}
                          </S.SearchGenreDetailSection>
                        )}
                      </S.SearchGenreGroups>
                    )}
                  </>
                )}
              </S.SearchGenreSection>

              <S.FilterSectionDivider />

              <S.AdvancedFilterSection>
                <S.AdvancedFilterHeader>
                  <S.AdvancedFilterTitle>상세 필터</S.AdvancedFilterTitle>
                  <S.AdvancedFilterDescription>
                    개봉 연도, 평점, 인기도 범위를 지정하면 해당 조건으로 다시 검색합니다.
                  </S.AdvancedFilterDescription>
                </S.AdvancedFilterHeader>

                <S.AdvancedFilterGrid>
                  <S.AdvancedFilterGroup>
                    <S.AdvancedFilterLabel htmlFor="search-year-from">개봉 연도</S.AdvancedFilterLabel>
                    <S.AdvancedFilterRange>
                      <S.AdvancedFilterInput
                        id="search-year-from"
                        type="number"
                        inputMode="numeric"
                        placeholder="시작 연도"
                        value={yearFromInput}
                        onChange={(e) => setYearFromInput(e.target.value)}
                      />
                      <S.AdvancedFilterDivider aria-hidden="true">-</S.AdvancedFilterDivider>
                      <S.AdvancedFilterInput
                        id="search-year-to"
                        type="number"
                        inputMode="numeric"
                        placeholder="종료 연도"
                        value={yearToInput}
                        onChange={(e) => setYearToInput(e.target.value)}
                      />
                    </S.AdvancedFilterRange>
                  </S.AdvancedFilterGroup>

                  <S.AdvancedFilterGroup>
                    <S.AdvancedFilterLabel htmlFor="search-rating-min">평점</S.AdvancedFilterLabel>
                    <S.AdvancedFilterRange>
                      <S.AdvancedFilterInput
                        id="search-rating-min"
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        placeholder="최소 평점"
                        value={ratingMinInput}
                        onChange={(e) => setRatingMinInput(e.target.value)}
                      />
                      <S.AdvancedFilterDivider aria-hidden="true">-</S.AdvancedFilterDivider>
                      <S.AdvancedFilterInput
                        id="search-rating-max"
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        placeholder="최대 평점"
                        value={ratingMaxInput}
                        onChange={(e) => setRatingMaxInput(e.target.value)}
                      />
                    </S.AdvancedFilterRange>
                  </S.AdvancedFilterGroup>

                  <S.AdvancedFilterGroup>
                    <S.AdvancedFilterLabel htmlFor="search-popularity-min">인기도</S.AdvancedFilterLabel>
                    <S.AdvancedFilterRange>
                      <S.AdvancedFilterInput
                        id="search-popularity-min"
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        placeholder="최소 인기도"
                        value={popularityMinInput}
                        onChange={(e) => setPopularityMinInput(e.target.value)}
                      />
                      <S.AdvancedFilterDivider aria-hidden="true">-</S.AdvancedFilterDivider>
                      <S.AdvancedFilterInput
                        id="search-popularity-max"
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        placeholder="최대 인기도"
                        value={popularityMaxInput}
                        onChange={(e) => setPopularityMaxInput(e.target.value)}
                      />
                    </S.AdvancedFilterRange>
                  </S.AdvancedFilterGroup>
                </S.AdvancedFilterGrid>

                <S.AdvancedFilterActions>
                  <S.AdvancedFilterApplyButton
                    type="button"
                    onClick={handleApplyAdvancedFilters}
                    disabled={isLoading || hasInvalidAdvancedFilters}
                  >
                    적용
                  </S.AdvancedFilterApplyButton>
                  <S.AdvancedFilterResetButton
                    type="button"
                    onClick={handleResetAdvancedFilters}
                    disabled={isLoading || (!hasAdvancedFilters && !hasSearched)}
                  >
                    초기화
                  </S.AdvancedFilterResetButton>
                </S.AdvancedFilterActions>

                {advancedFilterError && (
                  <S.AdvancedFilterError>{advancedFilterError}</S.AdvancedFilterError>
                )}
              </S.AdvancedFilterSection>
            </S.FilterAccordionContent>
          )}
        </S.FilterAccordion>

        {isAuthenticated && isRecentModalOpen && (
          <S.RecentModalOverlay onClick={handleCloseRecentModal}>
            <S.RecentModalContainer
              role="dialog"
              aria-modal="true"
              aria-labelledby="recent-search-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <S.RecentModalHeader>
                <S.RecentModalTitle id="recent-search-modal-title">최근 검색 기록</S.RecentModalTitle>
                <S.RecentModalActions>
                  <S.RecentModalDangerButton
                    type="button"
                    onClick={handleDeleteAllRecentSearches}
                    disabled={isDeletingAllRecent || isRecentLoading}
                  >
                    {isDeletingAllRecent ? '삭제 중...' : '전체삭제'}
                  </S.RecentModalDangerButton>
                  <S.RecentModalCloseButton
                    type="button"
                    onClick={handleCloseRecentModal}
                    aria-label="최근 검색 기록 모달 닫기"
                  >
                    ✕
                  </S.RecentModalCloseButton>
                </S.RecentModalActions>
              </S.RecentModalHeader>

              <S.RecentModalDescription>
                중복 제거된 검색 기록을 최신순으로 10개씩 확인할 수 있습니다.
              </S.RecentModalDescription>

              <S.RecentModalBody onScroll={handleRecentModalScroll}>
                {isRecentLoading && (
                  <S.RecentEmpty>최근 검색 기록을 불러오는 중입니다.</S.RecentEmpty>
                )}

                {!isRecentLoading && recentSearches.length === 0 && (
                  <S.RecentEmpty>아직 확인할 검색 기록이 없습니다.</S.RecentEmpty>
                )}

                {!isRecentLoading && recentSearches.length > 0 && (
                  <S.RecentModalList>
                    {recentSearches.map((item) => (
                      <S.RecentModalItem key={`${item.keyword}-${item.searched_at}`}>
                        <S.RecentModalRow>
                          <S.RecentModalKeywordButton
                            type="button"
                            onClick={() => handleRecentSearchClick(item)}
                          >
                            <S.RecentModalKeyword $isGenreHistory={isGenreDiscoveryRecentSearch(item)}>
                              {getRecentSearchDisplayKeyword(item)}
                            </S.RecentModalKeyword>
                            <S.RecentModalMeta>
                              {formatRecentSearchTimestamp(item.searched_at)}
                            </S.RecentModalMeta>
                          </S.RecentModalKeywordButton>
                          <S.RecentDeleteButton
                            type="button"
                            onClick={() => handleDeleteRecentKeyword(item.keyword)}
                            disabled={
                              deletingRecentKeyword === item.keyword || isDeletingAllRecent
                            }
                          >
                            {deletingRecentKeyword === item.keyword ? '삭제 중...' : '삭제'}
                          </S.RecentDeleteButton>
                        </S.RecentModalRow>
                      </S.RecentModalItem>
                    ))}
                  </S.RecentModalList>
                )}

                {isRecentLoadingMore && (
                  <S.RecentStatus>더 오래된 검색 기록을 불러오는 중입니다.</S.RecentStatus>
                )}

                {!isRecentLoading && !isRecentLoadingMore && recentSearches.length > 0 && !recentPagination.has_more && (
                  <S.RecentStatus>마지막 검색 기록까지 모두 확인했습니다.</S.RecentStatus>
                )}
              </S.RecentModalBody>
            </S.RecentModalContainer>
          </S.RecentModalOverlay>
        )}

        {/* 장르 필터 + 정렬 */}
        <S.Filters>
          <S.FilterSpacer aria-hidden="true" />

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
            <>
              <S.ResultCount>
                검색 결과 <strong>{totalCount}</strong>건
              </S.ResultCount>

              {(searchDidYouMean || relatedQueries.length > 0) && (
                <S.SearchSuggestionBanner>
                  <S.SearchSuggestionTitle>혹시 이 영화를 찾으셨나요?</S.SearchSuggestionTitle>
                  <S.SearchSuggestionActions>
                    {searchDidYouMean && (
                      <S.SearchSuggestionChip
                        type="button"
                        onClick={() => handleSelectAutocomplete(searchDidYouMean)}
                      >
                        {searchDidYouMean}
                      </S.SearchSuggestionChip>
                    )}
                    {relatedQueries.map((suggestion) => (
                      <S.SearchSuggestionChip
                        key={`related-${suggestion}`}
                        type="button"
                        onClick={() => handleSelectAutocomplete(suggestion)}
                      >
                        {suggestion}
                      </S.SearchSuggestionChip>
                    ))}
                  </S.SearchSuggestionActions>
                </S.SearchSuggestionBanner>
              )}
            </>
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
            <>
              <MovieList movies={movies} onMovieClick={handleMovieClick} />

              {isFetchingMore && (
                <S.LoadMoreGrid>
                  {[1, 2, 3, 4].map((n) => (
                    <Skeleton key={`load-more-${n}`} variant="card" />
                  ))}
                </S.LoadMoreGrid>
              )}

              {hasMore && (
                <S.LoadMoreSentinel ref={loadMoreRef} aria-hidden="true" />
              )}
            </>
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
