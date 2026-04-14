/**
 * 영화 검색 및 선택 컴포넌트.
 *
 * 사용자가 텍스트를 입력하면 300ms 디바운스 후 searchMovies() API를 호출하여
 * 드롭다운 형태로 후보 영화 목록을 표시한다.
 * 영화를 선택하면 영화 카드 형태로 표시하고 "X" 버튼으로 선택을 해제할 수 있다.
 *
 * 동작 흐름:
 * 1. 사용자가 검색어 입력 (최소 2글자)
 * 2. 300ms 디바운스 후 searchMovies({query, size: 5}) 호출
 * 3. 드롭다운에 포스터 썸네일 + 제목 + 연도 + 평점 표시
 * 4. 항목 클릭 시 onSelect(movie) 호출 → 부모에서 상태 저장
 * 5. 선택 완료 후 영화 카드 표시 + "X" 버튼 → onClear() 호출
 * 6. 외부 클릭 시 드롭다운 자동 닫힘
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
/* 영화 검색 API — axios 기반 기존 movieApi 재사용 */
import { searchMovies } from '../../movie/api/movieApi';
/* 평점 포맷터 */
import { formatRating } from '../../../shared/utils/formatters';
/* 「빠른 선택」 후보 목록 훅 — 위시리스트/리뷰/인기영화 병합 */
import { useQuickPicks } from '../hooks/useQuickPicks';

// ── 애니메이션 정의 ──

/** 드롭다운 등장 애니메이션 */
const dropdownFadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

/** 선택 카드 등장 애니메이션 */
const cardSlideIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

// ── Styled Components ──

/** 컴포넌트 최상위 컨테이너 — 상대 위치(드롭다운 기준점) */
const SelectorContainer = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/** 레이블 텍스트 */
const SelectorLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

/** 검색 입력 필드 래퍼 — 포커스 링 효과 */
const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

/** 검색 입력창 */
const SearchInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  padding-left: 40px; /* 아이콘 공간 */
  background: ${({ theme }) => theme.colors.bgInput};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textBase};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  transition: border-color ${({ theme }) => theme.transitions.base},
              box-shadow ${({ theme }) => theme.transitions.base};
  outline: none;
  box-sizing: border-box;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primaryLight};
  }
`;

/** 검색 아이콘 — 입력창 왼쪽 절대 위치 */
const SearchIcon = styled.span`
  position: absolute;
  left: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textBase};
  pointer-events: none;
  user-select: none;
`;

/**
 * 검색 결과 드롭다운 목록.
 * 검색 입력창 바로 아래에 절대 위치로 표시된다.
 */
const Dropdown = styled.ul`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: ${({ theme }) => theme.zIndex.dropdown};
  list-style: none;
  margin: 0;
  padding: ${({ theme }) => theme.spacing.xs} 0;
  background: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  max-height: 320px;
  overflow-y: auto;
  animation: ${dropdownFadeIn} 200ms ease;

  /* 스크롤바 스타일 */
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.borderDefault};
    border-radius: ${({ theme }) => theme.radius.full};
  }
`;

/** 드롭다운 항목 하나 */
const DropdownItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryLight};
  }

  &:active {
    background: rgba(124, 108, 240, 0.25);
  }
`;

/** 드롭다운 항목의 포스터 썸네일 */
const ItemPoster = styled.img`
  width: 36px;
  height: 54px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bgSecondary};
  flex-shrink: 0;
`;

/** 드롭다운 항목의 텍스트 정보 영역 */
const ItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0; /* 텍스트 오버플로 처리 */
`;

/** 드롭다운 항목의 영화 제목 */
const ItemTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/** 드롭다운 항목의 메타 정보 (연도 · 평점) */
const ItemMeta = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/** 로딩/빈 상태 드롭다운 메시지 */
const DropdownMessage = styled.li`
  padding: ${({ theme }) => theme.spacing.md};
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
  list-style: none;
`;

/* ============================================================
 * 빠른 선택 섹션 — 수동 검색 없이 영화를 고를 수 있는 추천 카드 목록
 * ============================================================ */

/** 빠른 선택 섹션 전체 래퍼 — 검색창 바로 아래 배치 */
const QuickPicksSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.xs};
  animation: ${dropdownFadeIn} 300ms ease;
`;

/** 빠른 선택 섹션 상단 레이블 */
const QuickPicksLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  display: flex;
  align-items: center;
  gap: 4px;

  /* 장식용 그라데이션 점 */
  &::before {
    content: '';
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: ${({ theme }) => theme.gradients?.primary || theme.colors.primary};
  }
`;

/** 빠른 선택 카드 그리드 — 3열 × 2행 (6개), 모바일에서는 가로 스크롤 */
const QuickPicksGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.xs};
  list-style: none;
  margin: 0;
  padding: 0;

  @media (max-width: 480px) {
    /* 모바일: 2열로 축소 */
    grid-template-columns: repeat(2, 1fr);
  }
`;

/** 빠른 선택 카드 하나 — 포스터 + 제목 */
const QuickPickItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs};
  background: ${({ theme }) => theme.colors.bgSecondary || theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast},
              background ${({ theme }) => theme.transitions.fast},
              transform ${({ theme }) => theme.transitions.fast};
  min-width: 0; /* 텍스트 오버플로 처리 */

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primaryLight};
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

/** 빠른 선택 포스터 썸네일 */
const QuickPickPoster = styled.img`
  width: 32px;
  height: 48px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bgElevated};
  flex-shrink: 0;
`;

/** 빠른 선택 정보 영역 (제목/연도) */
const QuickPickInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`;

/** 빠른 선택 제목 — 1줄 말줄임 */
const QuickPickTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/** 빠른 선택 연도 메타 */
const QuickPickMeta = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

/** 빈 상태(로딩/결과 없음) 메시지 — 검색 드롭다운과 톤 맞춤 */
const QuickPicksEmptyHint = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.spacing.xs} 0;
`;

/**
 * 선택 완료 후 표시되는 영화 카드.
 * 글래스모피즘 스타일로 선택된 영화를 강조 표시한다.
 */
const SelectedCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: ${({ theme }) => theme.glass.blur};
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  animation: ${cardSlideIn} 300ms ease;
  transition: border-color ${({ theme }) => theme.transitions.base};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

/** 선택된 영화 포스터 */
const SelectedPoster = styled.img`
  width: 48px;
  height: 72px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bgSecondary};
  flex-shrink: 0;
`;

/** 선택된 영화 정보 텍스트 영역 */
const SelectedInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
`;

/** 선택된 영화 제목 */
const SelectedTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/** 선택된 영화 메타 정보 */
const SelectedMeta = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/** 선택 해제 버튼 */
const ClearButton = styled.button`
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(248, 113, 113, 0.15);
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.textBase};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background ${({ theme }) => theme.transitions.fast},
              transform ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(248, 113, 113, 0.3);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

// ── 헬퍼 함수 ──

/**
 * TMDB 포스터 이미지 URL을 생성한다.
 * poster_path가 없으면 플레이스홀더 이미지 URL을 반환한다.
 *
 * @param {string|null} posterPath - TMDB poster_path (예: '/abc.jpg')
 * @param {string} [size='w92'] - TMDB 이미지 사이즈 (드롭다운용 w92)
 * @returns {string} 이미지 URL
 */
function getPosterUrl(posterPath, size = 'w92') {
  if (!posterPath) {
    return 'https://placehold.co/36x54/1a1a2e/666?text=No';
  }
  return `https://image.tmdb.org/t/p/${size}${posterPath}`;
}

// ── 컴포넌트 ──

/**
 * 영화 검색/선택 컴포넌트.
 *
 * 선택 전 화면에서는 검색창 아래에 「빠른 선택」 섹션이 노출되어
 * 사용자가 위시리스트/평가 이력/인기 영화 중에서 바로 고를 수 있다.
 *
 * @param {Object} props
 * @param {string} props.label - 셀렉터 레이블 (예: '영화 A', '영화 B')
 * @param {Object|null} props.selectedMovie - 현재 선택된 영화 객체 (null이면 미선택)
 * @param {function} props.onSelect - 영화 선택 시 호출되는 콜백 (movie 객체 전달)
 * @param {function} props.onClear - 선택 해제 버튼 클릭 시 호출되는 콜백
 * @param {string} [props.userId=''] - 현재 로그인 사용자 ID. 빈 문자열이면 인기 영화만 빠른 선택 후보로 사용.
 * @param {string} [props.excludeMovieId=''] - 목록에서 숨길 영화 ID. 상대편 셀렉터에서 이미 고른 영화를 중복 노출하지 않기 위해 사용.
 */
export default function MovieSelector({
  label,
  selectedMovie,
  onSelect,
  onClear,
  userId = '',
  excludeMovieId = '',
}) {
  /** 검색 입력창 현재 값 */
  const [query, setQuery] = useState('');
  /** 드롭다운에 표시할 검색 결과 목록 */
  const [results, setResults] = useState([]);
  /** 검색 API 호출 중 여부 (드롭다운 로딩 스피너) */
  const [isSearching, setIsSearching] = useState(false);
  /** 드롭다운 표시 여부 */
  const [isOpen, setIsOpen] = useState(false);

  /** 컨테이너 ref — 외부 클릭 감지에 사용 */
  const containerRef = useRef(null);
  /** 디바운스 타이머 ref — 언마운트/재입력 시 클린업 */
  const debounceRef = useRef(null);

  // ── 외부 클릭 감지 — 드롭다운 닫기 ──
  useEffect(() => {
    /**
     * 문서 전체의 클릭 이벤트를 감지하여,
     * 컴포넌트 외부 클릭 시 드롭다운을 닫는다.
     *
     * @param {MouseEvent} event
     */
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ── 언마운트 시 디바운스 타이머 클린업 ──
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  /**
   * 검색어 입력 핸들러.
   * 300ms 디바운스 후 searchMovies() 호출.
   * 최소 2글자 미만이면 검색하지 않고 드롭다운을 닫는다.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);

    // 이전 디바운스 타이머 취소
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // 최소 2글자 미만이면 드롭다운 닫고 결과 초기화
    if (value.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // 300ms 디바운스 후 검색 API 호출
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setIsOpen(true);

      try {
        // 기존 movieApi의 searchMovies 재사용 (axios 기반)
        // size: 5 — 드롭다운에 최대 5개 표시
        const data = await searchMovies({ query: value.trim(), size: 5 });
        // API 응답 형태: { movies: [...] } 또는 배열 직접 반환
        const movies = data?.movies || data?.content || (Array.isArray(data) ? data : []);
        setResults(movies);
      } catch (err) {
        // 검색 실패 시 결과 초기화 (에러 표시 없이 조용히 처리)
        if (import.meta.env.DEV) {
          console.warn('[MovieSelector] 검색 실패:', err);
        }
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  /**
   * 드롭다운 항목 클릭 핸들러.
   * 선택된 영화를 부모에 전달하고 검색창을 초기화한다.
   *
   * @param {Object} movie - 선택된 영화 객체
   */
  const handleSelect = useCallback((movie) => {
    onSelect(movie);
    // 검색창 초기화 + 드롭다운 닫기
    setQuery('');
    setResults([]);
    setIsOpen(false);
  }, [onSelect]);

  // ── 「빠른 선택」 후보 목록 로드 ──
  // 위시리스트/내 리뷰/인기 영화를 병합하여 최대 6편. 훅 내부에서 Promise.allSettled 로 안전 처리.
  const { picks, source, isLoading: isPicksLoading } = useQuickPicks({ userId, limit: 6 });

  /**
   * 빠른 선택 섹션에 실제로 노출할 목록.
   * excludeMovieId 로 지정된 영화(상대편 셀렉터에서 이미 고른 영화)는 중복 방지를 위해 제외.
   * useMemo 로 picks/excludeMovieId 변경 시에만 재계산.
   */
  const visiblePicks = useMemo(() => {
    if (!Array.isArray(picks) || picks.length === 0) return [];
    if (!excludeMovieId) return picks;
    return picks.filter((m) => (m.movie_id || m.id) !== excludeMovieId);
  }, [picks, excludeMovieId]);

  /**
   * 빠른 선택 섹션 부제 — 데이터 소스에 따라 다른 문구 노출.
   * 사용자가 "왜 이 영화들이 뜨는지" 이해할 수 있도록 맥락을 제공.
   */
  const quickPicksLabel = useMemo(() => {
    switch (source) {
      case 'personal':
        return '내가 찜하거나 평가한 영화 중에서';
      case 'mixed':
        return '내 이력 + 인기 영화 중에서';
      case 'popular':
        return '요즘 인기 있는 영화 중에서';
      default:
        return '';
    }
  }, [source]);

  return (
    <SelectorContainer ref={containerRef}>
      {/* 레이블 — 빈 문자열이면 렌더링하지 않음 */}
      {label && <SelectorLabel>{label}</SelectorLabel>}

      {/* 영화가 선택된 경우: 선택 카드 표시 */}
      {selectedMovie ? (
        <SelectedCard>
          <SelectedPoster
            src={getPosterUrl(selectedMovie.poster_path, 'w92')}
            alt={`${selectedMovie.title} 포스터`}
            loading="lazy"
          />
          <SelectedInfo>
            <SelectedTitle>{selectedMovie.title}</SelectedTitle>
            <SelectedMeta>
              {selectedMovie.release_year || selectedMovie.release_date?.slice(0, 4) || ''}
              {(selectedMovie.rating || selectedMovie.vote_average) &&
                ` · ★ ${formatRating(selectedMovie.rating || selectedMovie.vote_average)}`
              }
            </SelectedMeta>
          </SelectedInfo>
          {/* 선택 해제 버튼 */}
          <ClearButton onClick={onClear} aria-label="선택 해제" title="선택 해제">
            ✕
          </ClearButton>
        </SelectedCard>
      ) : (
        /* 영화가 선택되지 않은 경우: 검색 입력창 표시 */
        <div style={{ position: 'relative' }}>
          <SearchInputWrapper>
            <SearchIcon>&#128269;</SearchIcon>
            <SearchInput
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={() => results.length > 0 && setIsOpen(true)}
              placeholder="영화 제목을 검색하세요..."
              aria-label={`${label} 검색`}
              autoComplete="off"
            />
          </SearchInputWrapper>

          {/* 드롭다운 — isOpen이고 검색 중이거나 결과가 있을 때 표시 */}
          {isOpen && (
            <Dropdown role="listbox" aria-label="검색 결과">
              {isSearching ? (
                <DropdownMessage>검색 중...</DropdownMessage>
              ) : results.length === 0 ? (
                <DropdownMessage>검색 결과가 없습니다.</DropdownMessage>
              ) : (
                results.map((movie) => {
                  // 영화 ID: movie_id, id 필드 순서로 확인
                  const movieId = movie.movie_id || movie.id;
                  const year = movie.release_year || movie.release_date?.slice(0, 4) || '';
                  const rating = formatRating(movie.rating || movie.vote_average);

                  return (
                    <DropdownItem
                      key={movieId}
                      role="option"
                      onClick={() => handleSelect(movie)}
                    >
                      <ItemPoster
                        src={getPosterUrl(movie.poster_path, 'w92')}
                        alt={`${movie.title} 포스터`}
                        loading="lazy"
                      />
                      <ItemInfo>
                        <ItemTitle>{movie.title}</ItemTitle>
                        <ItemMeta>
                          {year && `${year}`}
                          {rating !== '-' && ` · ★ ${rating}`}
                        </ItemMeta>
                      </ItemInfo>
                    </DropdownItem>
                  );
                })
              )}
            </Dropdown>
          )}

          {/* ── 「빠른 선택」 섹션 ──
              - 드롭다운이 열려있지 않고(사용자가 검색 중이 아님)
              - 사용자가 검색어를 2글자 미만으로 입력한 경우에만 노출 */}
          {!isOpen && query.trim().length < 2 && (
            isPicksLoading ? (
              // 로딩 상태: 깜빡임 방지를 위한 가벼운 힌트만 표시
              <QuickPicksEmptyHint>추천 영화 불러오는 중...</QuickPicksEmptyHint>
            ) : visiblePicks.length > 0 ? (
              <QuickPicksSection>
                <QuickPicksLabel>{quickPicksLabel}</QuickPicksLabel>
                <QuickPicksGrid role="list" aria-label="빠른 선택 후보">
                  {visiblePicks.map((movie) => {
                    const movieId = movie.movie_id || movie.id;
                    const year = movie.release_year || '';
                    return (
                      <QuickPickItem
                        key={`quick-${movieId}`}
                        role="listitem"
                        onClick={() => handleSelect(movie)}
                        title={`${movie.title}${year ? ` (${year})` : ''}`}
                        aria-label={`${movie.title} 선택`}
                      >
                        <QuickPickPoster
                          src={getPosterUrl(movie.poster_path, 'w92')}
                          alt=""
                          loading="lazy"
                        />
                        <QuickPickInfo>
                          <QuickPickTitle>{movie.title}</QuickPickTitle>
                          {year && <QuickPickMeta>{year}</QuickPickMeta>}
                        </QuickPickInfo>
                      </QuickPickItem>
                    );
                  })}
                </QuickPicksGrid>
              </QuickPicksSection>
            ) : null
          )}
        </div>
      )}
    </SelectorContainer>
  );
}
