import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useModal } from '../../../shared/components/Modal';
import { buildPath, ROUTES } from '../../../shared/constants/routes';
import {
  getWorldcupCategories,
  getWorldcupGenres,
  getWorldcupResult,
  getWorldcupStartOptions,
  startWorldcup,
  submitWorldcupRound,
} from '../api/worldcupApi';
import * as S from './WorldcupPage.styled';

const PHASE = {
  LANDING: 'landing',
  BATTLE: 'battle',
  RESULT: 'result',
};

function formatRoundLabel(roundSize) {
  if (roundSize === 2) return '결승';
  return `${roundSize}강`;
}

function formatMovieMeta(movie) {
  if (!movie) return '';
  const parts = [];
  if (movie.releaseYear) parts.push(movie.releaseYear);
  if (Array.isArray(movie.genres) && movie.genres.length > 0) {
    parts.push(movie.genres.slice(0, 2).join(' · '));
  }
  return parts.join(' · ');
}

function getLandingSubtitle(phase) {
  if (phase === PHASE.BATTLE) return '더 마음에 드는 영화를 골라주세요';
  if (phase === PHASE.RESULT) return '당신만의 넘버 원 영화는 . . .';
  return '넘버 원 영화를 픽! 해보세요';
}

export default function WorldcupPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showAlert } = useModal();

  const [phase, setPhase] = useState(PHASE.LANDING);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  const [customGenres, setCustomGenres] = useState([]);
  const [customGenresLoading, setCustomGenresLoading] = useState(false);
  const [customGenresError, setCustomGenresError] = useState('');

  const [selectedSourceType, setSelectedSourceType] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [availableRoundSizes, setAvailableRoundSizes] = useState([]);
  const [selectedRoundSize, setSelectedRoundSize] = useState(null);
  const [genreCandidatePoolSize, setGenreCandidatePoolSize] = useState(0);
  const [builderError, setBuilderError] = useState('');
  const [isLoadingGenreOptions, setIsLoadingGenreOptions] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);

  const [currentRoundSize, setCurrentRoundSize] = useState(null);
  const [currentMatches, setCurrentMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [roundSelections, setRoundSelections] = useState([]);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const [result, setResult] = useState(null);

  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError('');
      const data = await getWorldcupCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setCategories([]);
      setCategoriesError(err.message || '월드컵 카테고리를 불러오지 못했습니다.');
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const loadCustomGenres = useCallback(async () => {
    try {
      setCustomGenresLoading(true);
      setCustomGenresError('');
      const data = await getWorldcupGenres();
      setCustomGenres(Array.isArray(data) ? data : []);
    } catch (err) {
      setCustomGenres([]);
      setCustomGenresError(err.message || '커스텀 월드컵 장르를 불러오지 못했습니다.');
    } finally {
      setCustomGenresLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (showCustomBuilder && customGenres.length === 0 && !customGenresLoading && !customGenresError) {
      loadCustomGenres();
    }
  }, [customGenres.length, customGenresError, customGenresLoading, loadCustomGenres, showCustomBuilder]);

  const orderedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      if ((a.displayOrder ?? 0) !== (b.displayOrder ?? 0)) {
        return (b.displayOrder ?? 0) - (a.displayOrder ?? 0);
      }
      return a.categoryName.localeCompare(b.categoryName, 'ko');
    });
  }, [categories]);

  const featuredCategories = useMemo(() => orderedCategories.slice(0, 5), [orderedCategories]);

  const filteredModalCategories = useMemo(() => {
    const keyword = categorySearchQuery.trim().toLocaleLowerCase('ko-KR');
    if (!keyword) return orderedCategories;
    return orderedCategories.filter((category) => (
      category.categoryName?.toLocaleLowerCase('ko-KR').includes(keyword)
    ));
  }, [categorySearchQuery, orderedCategories]);

  const currentMatch = currentMatches[currentMatchIndex] ?? null;
  const currentRoundProgress = currentMatches.length > 0
    ? ((currentMatchIndex + 1) / currentMatches.length) * 100
    : 0;

  useEffect(() => {
    if (!showCustomBuilder) {
      return undefined;
    }

    if (selectedGenres.length === 0) {
      setBuilderError('');
      setGenreCandidatePoolSize(0);
      setAvailableRoundSizes([]);
      setSelectedRoundSize(null);
      return undefined;
    }

    let cancelled = false;

    async function loadGenreOptions() {
      try {
        setIsLoadingGenreOptions(true);
        setBuilderError('');
        const options = await getWorldcupStartOptions({
          sourceType: 'GENRE',
          selectedGenres,
        });
        if (cancelled) return;
        setSelectedSourceType('GENRE');
        setGenreCandidatePoolSize(options.candidatePoolSize);
        setAvailableRoundSizes(options.availableRoundSizes);
        setSelectedRoundSize((prev) => (
          options.availableRoundSizes.includes(prev)
            ? prev
            : (options.availableRoundSizes[0] ?? null)
        ));
      } catch (err) {
        if (cancelled) return;
        setBuilderError(err.message || '장르 기반 월드컵 옵션을 불러오지 못했습니다.');
        setGenreCandidatePoolSize(0);
        setAvailableRoundSizes([]);
        setSelectedRoundSize(null);
      } finally {
        if (!cancelled) {
          setIsLoadingGenreOptions(false);
        }
      }
    }

    loadGenreOptions();
    return () => {
      cancelled = true;
    };
  }, [selectedGenres, showCustomBuilder]);

  const applyBracket = useCallback((bracket) => {
    setCurrentRoundSize(bracket.roundSize);
    setCurrentMatches(bracket.matches);
    setCurrentMatchIndex(0);
    setRoundSelections([]);
    setResult(null);
    setPhase(PHASE.BATTLE);
  }, []);

  const resetLandingSelection = useCallback(() => {
    setSelectedSourceType(null);
    setSelectedCategory(null);
    setSelectedGenres([]);
    setAvailableRoundSizes([]);
    setSelectedRoundSize(null);
    setGenreCandidatePoolSize(0);
    setBuilderError('');
    setShowCustomBuilder(false);
    setCategorySearchQuery('');
    setIsCategoryModalOpen(false);
  }, []);

  const handleCategorySelect = useCallback((category) => {
    if (!category.isReady) return;
    setSelectedSourceType('CATEGORY');
    setSelectedCategory(category);
    setSelectedGenres([]);
    setShowCustomBuilder(false);
    setBuilderError('');
    setGenreCandidatePoolSize(0);
    setAvailableRoundSizes(category.availableRoundSizes ?? []);
    setSelectedRoundSize(category.availableRoundSizes?.[0] ?? null);
    setIsCategoryModalOpen(false);
  }, []);

  const handleToggleCustomBuilder = useCallback(() => {
    setShowCustomBuilder((prev) => {
      const next = !prev;
      if (next) {
        setSelectedSourceType('GENRE');
        setSelectedCategory(null);
        setAvailableRoundSizes([]);
        setSelectedRoundSize(null);
        setBuilderError('');
      } else {
        setSelectedGenres([]);
        setAvailableRoundSizes([]);
        setSelectedRoundSize(null);
        setGenreCandidatePoolSize(0);
        setBuilderError('');
      }
      return next;
    });
  }, []);

  const handleToggleGenre = useCallback((genreName) => {
    setSelectedCategory(null);
    setSelectedSourceType('GENRE');
    setSelectedGenres((prev) => (
      prev.includes(genreName)
        ? prev.filter((item) => item !== genreName)
        : [...prev, genreName]
    ));
  }, []);

  const handleStart = useCallback(async () => {
    if (!selectedSourceType || !selectedRoundSize || isStarting) return;

    try {
      setIsStarting(true);
      const bracket = await startWorldcup({
        sourceType: selectedSourceType,
        categoryId: selectedSourceType === 'CATEGORY' ? selectedCategory?.categoryId : null,
        selectedGenres: selectedSourceType === 'GENRE' ? selectedGenres : [],
        roundSize: selectedRoundSize,
      });
      applyBracket(bracket);
    } catch (err) {
      showAlert({
        title: '시작 실패',
        message: err.message || '월드컵을 시작할 수 없습니다.',
        type: 'error',
      });
    } finally {
      setIsStarting(false);
    }
  }, [
    applyBracket,
    isStarting,
    selectedCategory,
    selectedGenres,
    selectedRoundSize,
    selectedSourceType,
    showAlert,
  ]);

  const handleBattlePick = useCallback(async (winnerId) => {
    if (!winnerId || isAdvancing || !currentMatch) return;

    const nextSelections = [...roundSelections, winnerId];
    const isLastMatchInRound = currentMatchIndex === currentMatches.length - 1;

    if (!isLastMatchInRound) {
      setRoundSelections(nextSelections);
      setCurrentMatchIndex((prev) => prev + 1);
      return;
    }

    try {
      setIsAdvancing(true);
      const response = await submitWorldcupRound({
        roundSize: currentRoundSize,
        selections: nextSelections,
        isFinal: currentRoundSize === 2,
      });

      if (response.nextRound && response.nextMatches.length > 0) {
        setCurrentRoundSize(response.nextRound);
        setCurrentMatches(response.nextMatches);
        setCurrentMatchIndex(0);
        setRoundSelections([]);
        return;
      }

      const finalResult = await getWorldcupResult();
      setResult(finalResult);
      setPhase(PHASE.RESULT);
    } catch (err) {
      showAlert({
        title: '진행 실패',
        message: err.message || '다음 라운드를 준비하지 못했습니다.',
        type: 'error',
      });
    } finally {
      setIsAdvancing(false);
    }
  }, [
    currentMatch,
    currentMatchIndex,
    currentMatches.length,
    currentRoundSize,
    isAdvancing,
    roundSelections,
    showAlert,
  ]);

  const handleRestart = useCallback(() => {
    setPhase(PHASE.LANDING);
    setCurrentRoundSize(null);
    setCurrentMatches([]);
    setCurrentMatchIndex(0);
    setRoundSelections([]);
    setResult(null);
    resetLandingSelection();
    loadCategories();
  }, [loadCategories, resetLandingSelection]);

  const selectedCategoryRoundSummary = selectedCategory?.availableRoundSizes
    ?.map(formatRoundLabel)
    ?.join(', ') || '';
  const shouldShowOnboardingReturn = location.state?.returnTo === ROUTES.ONBOARDING;

  return (
    <S.Container>
      <S.Header>
        <S.PageTitle>영화 월드컵</S.PageTitle>
        <S.Subtitle>{getLandingSubtitle(phase)}</S.Subtitle>
      </S.Header>

      {phase === PHASE.LANDING && (
        <>
          <S.FeaturedSection>
            {categoriesLoading ? (
              <S.StatusText>카테고리를 불러오는 중입니다...</S.StatusText>
            ) : categoriesError ? (
              <S.ErrorText>{categoriesError}</S.ErrorText>
            ) : featuredCategories.length === 0 ? (
              <S.EmptyState>노출 가능한 월드컵 카테고리가 없습니다.</S.EmptyState>
            ) : (
              <>
                <S.CategoryGrid>
                  {featuredCategories.map((category) => (
                    <S.CategoryItem key={category.categoryId}>
                      <S.CategoryCard
                        type="button"
                        $disabled={!category.isReady}
                        onClick={() => handleCategorySelect(category)}
                      >
                        {category.previewPosterUrl ? (
                          <S.CategoryPoster
                            src={category.previewPosterUrl}
                            alt={category.categoryName}
                          />
                        ) : (
                          <S.CategoryPosterFallback aria-hidden="true">🎬</S.CategoryPosterFallback>
                        )}
                        <S.CategoryOverlay $disabled={!category.isReady} />
                        <S.CategoryTitle>{category.categoryName}</S.CategoryTitle>
                      </S.CategoryCard>
                      <S.CategoryDescription title={category.description || ''}>
                        {category.isReady
                          ? (category.description?.trim() || '설명이 준비 중입니다')
                          : '준비 중인 월드컵입니다'}
                      </S.CategoryDescription>
                    </S.CategoryItem>
                  ))}
                </S.CategoryGrid>

                {selectedSourceType === 'CATEGORY' && selectedCategory && (
                  <S.SelectionPanel>
                    <S.SelectionTitle>{selectedCategory.categoryName}</S.SelectionTitle>
                    <S.SelectionMeta>
                      후보 {selectedCategory.candidatePoolSize}편 · 가능한 라운드 {selectedCategoryRoundSummary}
                    </S.SelectionMeta>
                    <S.RoundChoiceRow>
                      {selectedCategory.availableRoundSizes.map((roundSize) => (
                        <S.RoundChoiceButton
                          key={roundSize}
                          type="button"
                          $active={selectedRoundSize === roundSize}
                          onClick={() => setSelectedRoundSize(roundSize)}
                        >
                          {formatRoundLabel(roundSize)}
                        </S.RoundChoiceButton>
                      ))}
                    </S.RoundChoiceRow>
                    <S.PrimaryActionButton type="button" onClick={handleStart} disabled={!selectedRoundSize || isStarting}>
                      {isStarting ? '대진표 준비 중...' : '이 카테고리로 시작하기'}
                    </S.PrimaryActionButton>
                  </S.SelectionPanel>
                )}

                <S.MoreLinkButton
                  type="button"
                  onClick={() => {
                    setCategorySearchQuery('');
                    setIsCategoryModalOpen(true);
                  }}
                >
                  더 많은 매치 보러가기
                </S.MoreLinkButton>
              </>
            )}
          </S.FeaturedSection>

          <S.DividerRow>
            <S.DividerLine />
            <S.DividerText>혹은</S.DividerText>
            <S.DividerLine />
          </S.DividerRow>

          <S.CustomEntrySection>
            <S.CustomBuilderToggle
              type="button"
              $active={showCustomBuilder}
              onClick={handleToggleCustomBuilder}
            >
              나만의 월드컵 만들기
            </S.CustomBuilderToggle>

            {showCustomBuilder && (
              <S.CustomBuilderPanel>
                <S.SelectionTitle>장르로 직접 구성하기</S.SelectionTitle>
                <S.SelectionMeta>
                  선택한 장르를 많이 만족하는 영화부터 우선 선출됩니다.
                </S.SelectionMeta>

                {customGenresLoading ? (
                  <S.StatusText>장르 목록을 불러오는 중입니다...</S.StatusText>
                ) : customGenresError ? (
                  <S.ErrorText>{customGenresError}</S.ErrorText>
                ) : customGenres.length === 0 ? (
                  <S.StatusText>선택 가능한 장르가 없습니다.</S.StatusText>
                ) : (
                  <>
                    <S.GenreChipGrid>
                      {customGenres.map((genre) => (
                        <S.GenreChip
                          key={genre.genreCode}
                          type="button"
                          $active={selectedGenres.includes(genre.genreName)}
                          onClick={() => handleToggleGenre(genre.genreName)}
                        >
                          {genre.genreName}
                        </S.GenreChip>
                      ))}
                    </S.GenreChipGrid>

                    {selectedGenres.length > 0 && (
                      <S.BuilderSummary>
                        선택 장르: {selectedGenres.join(', ')}
                      </S.BuilderSummary>
                    )}

                    {isLoadingGenreOptions ? (
                      <S.StatusText>가능한 라운드를 계산 중입니다...</S.StatusText>
                    ) : builderError ? (
                      <S.ErrorText>{builderError}</S.ErrorText>
                    ) : selectedGenres.length > 0 ? (
                      <>
                        <S.SelectionMeta>
                          후보 {genreCandidatePoolSize}편 · 가능한 라운드 {availableRoundSizes.length > 0 ? availableRoundSizes.join(', ') : '없음'}
                        </S.SelectionMeta>
                        <S.RoundChoiceRow>
                          {availableRoundSizes.map((roundSize) => (
                            <S.RoundChoiceButton
                              key={roundSize}
                              type="button"
                              $active={selectedRoundSize === roundSize}
                              onClick={() => setSelectedRoundSize(roundSize)}
                            >
                              {formatRoundLabel(roundSize)}
                            </S.RoundChoiceButton>
                          ))}
                        </S.RoundChoiceRow>
                        <S.PrimaryActionButton
                          type="button"
                          onClick={handleStart}
                          disabled={!selectedRoundSize || availableRoundSizes.length === 0 || isStarting}
                        >
                          {isStarting ? '대진표 준비 중...' : '이 조합으로 시작하기'}
                        </S.PrimaryActionButton>
                      </>
                    ) : (
                      <S.StatusText>장르를 하나 이상 선택하면 가능한 라운드를 계산합니다.</S.StatusText>
                    )}
                  </>
                )}
              </S.CustomBuilderPanel>
            )}
          </S.CustomEntrySection>
        </>
      )}

      {phase === PHASE.BATTLE && currentMatch && (
        <S.BattleSection>
          <S.RoundStatus>
            <S.RoundBadge>{formatRoundLabel(currentRoundSize)}</S.RoundBadge>
            <S.RoundCounter>{currentMatchIndex + 1} / {currentMatches.length} 매치</S.RoundCounter>
          </S.RoundStatus>
          <S.ProgressTrack>
            <S.ProgressFill style={{ width: `${currentRoundProgress}%` }} />
          </S.ProgressTrack>
          {isAdvancing && <S.StatusText>다음 라운드를 준비 중입니다...</S.StatusText>}

          <S.BattleGrid>
            <S.MovieCard
              type="button"
              onClick={() => handleBattlePick(currentMatch.leftMovie?.movieId)}
              disabled={isAdvancing}
            >
              <S.MoviePosterFrame>
                <S.MoviePoster src={currentMatch.leftMovie?.posterUrl || undefined} alt={currentMatch.leftMovie?.title} />
                <S.MovieOverviewOverlay>
                  <S.MovieOverviewLabel>줄거리</S.MovieOverviewLabel>
                  <S.MovieOverviewText>
                    {currentMatch.leftMovie?.overview?.trim() || '줄거리 정보가 아직 준비되지 않았습니다.'}
                  </S.MovieOverviewText>
                </S.MovieOverviewOverlay>
              </S.MoviePosterFrame>
              <S.MovieInfo>
                <S.MovieName>{currentMatch.leftMovie?.title || '영화 정보 없음'}</S.MovieName>
                <S.MovieMeta>{formatMovieMeta(currentMatch.leftMovie)}</S.MovieMeta>
              </S.MovieInfo>
            </S.MovieCard>

            <S.VsBadge>VS</S.VsBadge>

            <S.MovieCard
              type="button"
              onClick={() => handleBattlePick(currentMatch.rightMovie?.movieId)}
              disabled={isAdvancing}
            >
              <S.MoviePosterFrame>
                <S.MoviePoster src={currentMatch.rightMovie?.posterUrl || undefined} alt={currentMatch.rightMovie?.title} />
                <S.MovieOverviewOverlay>
                  <S.MovieOverviewLabel>줄거리</S.MovieOverviewLabel>
                  <S.MovieOverviewText>
                    {currentMatch.rightMovie?.overview?.trim() || '줄거리 정보가 아직 준비되지 않았습니다.'}
                  </S.MovieOverviewText>
                </S.MovieOverviewOverlay>
              </S.MoviePosterFrame>
              <S.MovieInfo>
                <S.MovieName>{currentMatch.rightMovie?.title || '영화 정보 없음'}</S.MovieName>
                <S.MovieMeta>{formatMovieMeta(currentMatch.rightMovie)}</S.MovieMeta>
              </S.MovieInfo>
            </S.MovieCard>
          </S.BattleGrid>
        </S.BattleSection>
      )}

      {phase === PHASE.RESULT && result && (
        <S.ResultSection>
          <S.ResultHero>
            <S.ResultLabel>당신의 넘버 원 영화</S.ResultLabel>
            <S.WinnerCard>
              <S.ResultPoster src={result.winner?.posterUrl || undefined} alt={result.winner?.title} />
              <S.ResultInfo>
                <S.ResultMovieTitle>{result.winner?.title || '우승 영화'}</S.ResultMovieTitle>
                <S.MovieMeta>{formatMovieMeta(result.winner)}</S.MovieMeta>
              </S.ResultInfo>
            </S.WinnerCard>
          </S.ResultHero>

          {result.runnerUp && (
            <S.RunnerUpSection>
              <S.SectionTitle>준우승</S.SectionTitle>
              <S.RunnerUpCard>
                <S.ResultPoster src={result.runnerUp.posterUrl || undefined} alt={result.runnerUp.title} />
                <S.ResultInfo>
                  <S.ResultMovieTitle>{result.runnerUp.title}</S.ResultMovieTitle>
                  <S.MovieMeta>{formatMovieMeta(result.runnerUp)}</S.MovieMeta>
                </S.ResultInfo>
              </S.RunnerUpCard>
            </S.RunnerUpSection>
          )}

          {result.topGenres.length > 0 && (
            <S.PreferenceSection>
              <S.SectionTitle>상위 선호 장르</S.SectionTitle>
              <S.TagRow>
                {result.topGenres.map((genre) => (
                  <S.PreferenceTag key={genre}>{genre}</S.PreferenceTag>
                ))}
              </S.TagRow>
            </S.PreferenceSection>
          )}

          {result.genrePreferences.length > 0 && (
            <S.PreferenceSection>
              <S.SectionTitle>장르 성향</S.SectionTitle>
              <S.PreferenceList>
                {result.genrePreferences.map((item) => (
                  <S.PreferenceItem key={item.genre}>
                    <S.PreferenceGenre>{item.genre}</S.PreferenceGenre>
                    <S.PreferenceBarTrack>
                      <S.PreferenceBarFill style={{ width: `${Math.max(item.score * 100, 6)}%` }} />
                    </S.PreferenceBarTrack>
                    <S.PreferenceScore>{Math.round(item.score * 100)}%</S.PreferenceScore>
                  </S.PreferenceItem>
                ))}
              </S.PreferenceList>
            </S.PreferenceSection>
          )}

          <S.ResultActionRow>
            {shouldShowOnboardingReturn && (
              <S.SecondaryActionButton
                type="button"
                onClick={() => navigate(ROUTES.ONBOARDING)}
              >
                시작 미션 페이지로 돌아가기
              </S.SecondaryActionButton>
            )}
            <S.SecondaryActionButton type="button" onClick={handleRestart}>
              다시 하기
            </S.SecondaryActionButton>
            <S.PrimaryActionButton
              type="button"
              onClick={() => {
                if (result.winner?.movieId) {
                  navigate(buildPath(ROUTES.MOVIE_DETAIL, { id: result.winner.movieId }));
                }
              }}
            >
              우승 영화 보러가기
            </S.PrimaryActionButton>
          </S.ResultActionRow>
        </S.ResultSection>
      )}

      {isCategoryModalOpen && (
        <S.CategoryModalOverlay
          onClick={() => {
            setIsCategoryModalOpen(false);
            setCategorySearchQuery('');
          }}
        >
          <S.CategoryModalCard onClick={(event) => event.stopPropagation()}>
            <S.CategoryModalHeader>
              <div>
                <S.CategoryModalTitle>몽글픽 영화 월드컵</S.CategoryModalTitle>
                <S.CategoryModalDesc>검색으로 원하는 월드컵을 찾아보세요.</S.CategoryModalDesc>
              </div>
              <S.CategoryModalCloseButton
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setCategorySearchQuery('');
                }}
              >
                닫기
              </S.CategoryModalCloseButton>
            </S.CategoryModalHeader>

            <S.CategorySearchInput
              type="text"
              value={categorySearchQuery}
              onChange={(event) => setCategorySearchQuery(event.target.value)}
              placeholder="카테고리 명 검색"
            />

            {filteredModalCategories.length === 0 ? (
              <S.EmptyState>검색 조건에 맞는 카테고리가 없습니다.</S.EmptyState>
            ) : (
              <S.CategoryModalGrid>
                {filteredModalCategories.map((category) => (
                  <S.CategoryItem key={category.categoryId}>
                    <S.CategoryCard
                      type="button"
                      $disabled={!category.isReady}
                      onClick={() => handleCategorySelect(category)}
                    >
                      {category.previewPosterUrl ? (
                        <S.CategoryPoster
                          src={category.previewPosterUrl}
                          alt={category.categoryName}
                        />
                      ) : (
                        <S.CategoryPosterFallback aria-hidden="true">🎬</S.CategoryPosterFallback>
                      )}
                      <S.CategoryOverlay $disabled={!category.isReady} />
                      <S.CategoryTitle>{category.categoryName}</S.CategoryTitle>
                    </S.CategoryCard>
                    <S.CategoryDescription title={category.description || ''}>
                      {category.isReady
                        ? (category.description?.trim() || '설명이 준비 중입니다')
                        : '준비 중인 월드컵입니다'}
                    </S.CategoryDescription>
                  </S.CategoryItem>
                ))}
              </S.CategoryModalGrid>
            )}
          </S.CategoryModalCard>
        </S.CategoryModalOverlay>
      )}
    </S.Container>
  );
}
