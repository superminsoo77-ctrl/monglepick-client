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
import {
  deleteAllRecentSearches,
  deleteRecentSearchKeyword,
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
const RECENT_HISTORY_PAGE_SIZE = 30;
const RECENT_HISTORY_SCROLL_THRESHOLD = 80;
const SEARCH_CACHE_STORAGE_KEY = 'monglepick_search_page_cache';

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

function createInitialRecentPagination() {
  return {
    offset: 0,
    limit: RECENT_HISTORY_PAGE_SIZE,
    has_more: false,
    next_offset: null,
  };
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

function buildSearchCacheKey({ query, searchType, genre, sort, selectedGenres = [] }) {
  return JSON.stringify({
    query: query || '',
    searchType: searchType || 'all',
    genre: genre || '전체',
    sort: sort || 'relevance',
    selectedGenres,
  });
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
  const [searchGenreOptions, setSearchGenreOptions] = useState([]);
  const [isSearchGenreOptionsLoading, setIsSearchGenreOptionsLoading] = useState(false);
  const [selectedSearchGenres, setSelectedSearchGenres] = useState(initialSelectedGenres);
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
  const loadMoreRef = useRef(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  const restoreSearchSnapshot = useCallback((snapshot) => {
    if (!snapshot) return;

    setMovies(snapshot.movies || []);
    setTotalCount(snapshot.totalCount || 0);
    setCurrentPage(snapshot.currentPage || 1);
    setHasMore(Boolean(snapshot.hasMore));
    setHasSearched(Boolean(snapshot.hasSearched));
    setLastSearchContext(snapshot.lastSearchContext || null);
    setSelectedSearchGenres(snapshot.lastSearchContext?.discoveryGenres || []);
    setIsLoading(false);
    setIsFetchingMore(false);
  }, []);

  /**
   * 검색을 실행하는 함수.
   * URL 파라미터도 동기화한다.
   */
  const executeSearch = useCallback(async (
    searchQuery,
    currentSearchType,
    searchGenre,
    searchSort,
    page = 1,
    append = false,
    discoveryGenres = selectedSearchGenres,
  ) => {
    const queryText = searchQuery.trim();
    const normalizedDiscoveryGenres = queryText ? [] : discoveryGenres.filter(Boolean);
    const isGenreDiscoverySearch = !queryText && normalizedDiscoveryGenres.length > 0;
    const effectiveSort = searchSort;

    /* 텍스트 검색어도, 선택 장르도 없으면 검색을 실행하지 않음 */
    if (!queryText && !isGenreDiscoverySearch) {
      setMovies([]);
      setHasSearched(false);
      setTotalCount(0);
      setCurrentPage(1);
      setHasMore(false);
      setLastSearchContext(null);
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
      const params = new URLSearchParams();
      if (queryText) {
        params.set('q', queryText);
        if (currentSearchType !== 'all') params.set('searchType', currentSearchType);
        if (searchGenre !== '전체') params.set('genre', searchGenre);
      }
      if (isGenreDiscoverySearch) {
        params.set('genres', normalizedDiscoveryGenres.join(','));
      }
      if (effectiveSort !== 'relevance') params.set('sort', effectiveSort);
      setSearchParams(params, { replace: true });
    }

    try {
      const result = await searchMovies({
        query: queryText,
        searchType: currentSearchType,
        genre: queryText && searchGenre !== '전체' ? searchGenre : '',
        genres: isGenreDiscoverySearch ? normalizedDiscoveryGenres : [],
        sort: effectiveSort,
        page,
        size: PAGE_SIZE,
      });

      const nextMovies = result?.movies || [];
      const nextTotal = result?.total || 0;

      setMovies((prev) => (append ? [...prev, ...nextMovies] : nextMovies));
      setTotalCount(nextTotal);
      setCurrentPage(page);
      setHasMore(page * PAGE_SIZE < nextTotal);
      setLastSearchContext({
        query: queryText,
        searchType: currentSearchType,
        genre: queryText ? searchGenre : '전체',
        sort: effectiveSort,
        discoveryGenres: normalizedDiscoveryGenres,
        searchMode: isGenreDiscoverySearch ? 'genre_discovery' : 'keyword',
        resultCount: nextTotal,
      });

      /* Phase 2: 검색 실행 이벤트 (첫 페이지만 기록) */
      if (!append) {
        trackEvent('search', null, {
          query: queryText || normalizedDiscoveryGenres.join(','),
          searchType: currentSearchType,
          genre: queryText ? searchGenre : normalizedDiscoveryGenres.join(','),
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
        clearSearchCache();
      }
    } finally {
      if (append) {
        setIsFetchingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [selectedSearchGenres, setSearchParams]);

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

    if (urlQuery || urlSelectedGenres.length > 0) {
      setQuery(urlQuery || '');
      setSearchType(urlSearchType);
      setGenre(urlGenre);
      setSort(urlSort);
      setSelectedSearchGenres(urlSelectedGenres);

      const cacheKey = buildSearchCacheKey({
        query: urlQuery || '',
        searchType: urlSearchType,
        genre: urlGenre,
        sort: urlSort,
        selectedGenres: urlSelectedGenres,
      });
      const cachedSearch = readSearchCache();

      if (cachedSearch?.key === cacheKey) {
        restoreSearchSnapshot(cachedSearch.snapshot);
        return;
      }

      executeSearch(urlQuery || '', urlSearchType, urlGenre, urlSort, 1, false, urlSelectedGenres);
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
   * 모달 첫 진입 시에는 30개를 새로 읽고, 스크롤 하단 도달 시에는 이어붙인다.
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

    if (!hasSearched || (!hasCachedQuery && !hasCachedGenres)) {
      return;
    }

    writeSearchCache({
      key: buildSearchCacheKey({
        query: lastSearchContext.query,
        searchType: lastSearchContext.searchType,
        genre: lastSearchContext.genre,
        sort: lastSearchContext.sort,
        selectedGenres: lastSearchContext.discoveryGenres || [],
      }),
      snapshot: {
        movies,
        totalCount,
        currentPage,
        hasMore,
        hasSearched,
        lastSearchContext,
      },
    });
  }, [
    currentPage,
    hasMore,
    hasSearched,
    lastSearchContext,
    movies,
    totalCount,
  ]);

  /**
   * 검색 폼 제출 핸들러.
   *
   * @param {Event} e - 폼 제출 이벤트
   */
  const handleSearch = (e) => {
    e.preventDefault();
    executeSearch(query, searchType, genre, sort, 1, false, selectedSearchGenres);
  };

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
   * 모달 하단에 가까워지면 더 오래된 검색 기록 30개를 이어서 불러온다.
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

    if (isGenreHistory) {
      const restoredSort = normalizeHistorySort(historyFilters.sort_by);
      setQuery('');
      setSearchType('all');
      setGenre('전체');
      setSort(restoredSort);
      setSelectedSearchGenres(historyGenres);
      setIsRecentModalOpen(false);
      executeSearch('', 'all', '전체', restoredSort, 1, false, historyGenres);
      return;
    }

    setQuery(item.keyword);
    setIsRecentModalOpen(false);
    executeSearch(item.keyword, searchType, genre, sort);
  }, [executeSearch, genre, searchType, sort]);

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
      executeSearch(query, searchType, genre, selectedSort, 1, false, selectedSearchGenres);
      return;
    }

    if (hasSearched && lastSearchContext?.discoveryGenres?.length) {
      executeSearch(
        '',
        'all',
        '전체',
        selectedSort,
        1,
        false,
        lastSearchContext.discoveryGenres,
      );
    }
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

    executeSearch(
      pagedQuery,
      pagedSearchType,
      pagedGenre,
      pagedSort,
      currentPage + 1,
      true,
      pagedDiscoveryGenres,
    );
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
                      <S.RecentPreviewKeyword>{item.keyword}</S.RecentPreviewKeyword>
                    </S.RecentPreviewButton>
                  </S.RecentPreviewItem>
                ))}
              </S.RecentPreviewList>
            )}
          </S.RecentSection>
        )}

        {!query.trim() && (
          <S.SearchGenreSection>
            <S.SearchGenreTitle>장르로 찾기</S.SearchGenreTitle>
            <S.SearchGenreDescription>
              관심있는 장르를 여러 개 선택해 검색할 수 있습니다.
            </S.SearchGenreDescription>

            {isSearchGenreOptionsLoading && (
              <S.SearchGenreEmpty>장르 목록을 불러오는 중입니다.</S.SearchGenreEmpty>
            )}

            {!isSearchGenreOptionsLoading && searchGenreOptions.length === 0 && (
              <S.SearchGenreEmpty>표시할 장르가 없습니다.</S.SearchGenreEmpty>
            )}

            {!isSearchGenreOptionsLoading && searchGenreOptions.length > 0 && (
              <S.SearchGenreGrid>
                {searchGenreOptions.map((item) => (
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
          </S.SearchGenreSection>
        )}

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
                중복 제거된 검색 기록을 최신순으로 30개씩 확인할 수 있습니다.
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
                            <S.RecentModalKeyword>{item.keyword}</S.RecentModalKeyword>
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
          {query.trim() ? (
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
            <S.FilterSpacer aria-hidden="true" />
          )}

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
