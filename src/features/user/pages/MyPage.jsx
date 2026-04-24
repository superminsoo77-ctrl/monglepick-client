import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../shared/stores/useAuthStore';
/* 라우팅 재설계 PR-3 (2026-04-23) — 탭·모달 상태 URL 동기화 공통 훅 */
import useTabParam from '../../../shared/hooks/useTabParam';
import useModalRoute from '../../../shared/hooks/useModalRoute';
import {
  getFavoriteGenres,
  getFavoriteMovies,
  getProfile,
  getWishlist,
  getMyReviews,
  getMyPosts,
  reorderFavoriteMovies,
  saveFavoriteGenres,
  saveFavoriteMovies,
  updateProfile,
} from '../api/userApi';
/* 착용 아이템 API — 2026-04-14 신설 (C 방향). 프로필 상단에 아바타·배지 표시용. */
import { getEquippedItems } from '../../point/api/userItemApi';
import { useModal } from '../../../shared/components/Modal';
import { searchMovies } from '../../movie/api/movieApi';
import { ROUTES, buildPath } from '../../../shared/constants/routes';
import { getGradeLabel } from '../../../shared/constants/grade';
import MovieList from '../../../shared/components/MovieList/MovieList';
import Loading from '../../../shared/components/Loading/Loading';
import EmptyState from '../../../shared/components/EmptyState/EmptyState';
import ReviewList from '../../review/components/ReviewList';
import * as S from './MyPage.styled';

const REVIEW_PAGE_SIZE = 20;
const PAGE_GROUP_SIZE = 10;
const MAX_FAVORITE_MOVIES = 9;
const FAVORITE_GRID_SIZE = 9;

const CATEGORY_LABEL = {
  FREE: '자유',
  DISCUSSION: '토론',
  RECOMMENDATION: '추천',
  NEWS: '뉴스',
  PLAYLIST_SHARE: '플리공유',
};

const TABS = [
  { id: 'profile', label: '프로필' },
  { id: 'watch-history', label: '시청 이력' },
  { id: 'my-posts', label: '내가 쓴 글' },
  { id: 'wishlist', label: '위시리스트' },
  { id: 'preferences', label: '선호 설정' },
];

/**
 * 유효한 탭 id 화이트리스트 — useTabParam 이 URL 쿼리값을 검증할 때 사용.
 * 외부 입력(?tab=xxx) 은 신뢰할 수 없으므로 반드시 이 Set 에 포함된 값만 허용하고,
 * 벗어나면 defaultTab('profile') 로 폴백한다.
 */
const VALID_TAB_IDS = new Set(TABS.map((t) => t.id));

function parseMovieGenres(genres) {
  if (Array.isArray(genres)) return genres;
  if (typeof genres === 'string') {
    try {
      const parsed = JSON.parse(genres);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function resolveMovieId(movie) {
  return movie?.movieId || movie?.movie_id || movie?.id || null;
}

function resolveMoviePosterSrc(movie) {
  const rawPoster = (
    movie?.posterUrl
    || movie?.poster_url
    || movie?.poster_path
    || movie?.posterPath
    || null
  );

  if (!rawPoster || typeof rawPoster !== 'string') {
    return null;
  }

  if (rawPoster.startsWith('http://') || rawPoster.startsWith('https://')) {
    return rawPoster;
  }

  if (rawPoster.startsWith('/')) {
    return `https://image.tmdb.org/t/p/w500${rawPoster}`;
  }

  return rawPoster;
}

function normalizeFavoriteMovieCandidate(movie) {
  const movieId = resolveMovieId(movie);
  if (!movie || !movieId) {
    return null;
  }

  return {
    ...movie,
    id: movieId,
    movieId,
    posterUrl: movie?.posterUrl || movie?.poster_url || resolveMoviePosterSrc(movie),
    releaseYear: movie?.releaseYear || movie?.release_year || null,
    genres: parseMovieGenres(movie?.genres),
  };
}

function areOrderedListsEqual(left, right) {
  if (left.length !== right.length) return false;
  return left.every((item, index) => item === right[index]);
}

function moveArrayItem(items, fromIndex, toIndex) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

/* ── 프로필 수정 모달 ── */
function EditProfileModal({ profile, onClose, onSaved }) {
  const user = useAuthStore((s) => s.user);

  const [nickname, setNickname] = useState(profile?.nickname || user?.nickname || '');
  const [profileImageUrl, setProfileImageUrl] = useState(profile?.profileImageUrl || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  /* ESC 키로 닫기 */
  const handleKeyDown = useCallback(
    (e) => { if (e.key === 'Escape') onClose(); },
    [onClose],
  );
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /* 스크롤 방지 */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  function validate() {
    const errors = {};
    if (nickname && (nickname.length < 2 || nickname.length > 20)) {
      errors.nickname = '닉네임은 2자 이상 20자 이하여야 합니다';
    }
    if (profileImageUrl && profileImageUrl.length > 500) {
      errors.profileImageUrl = '이미지 URL은 500자를 초과할 수 없습니다';
    }
    const isChangingPassword = newPassword || currentPassword;
    if (isChangingPassword) {
      if (!currentPassword) errors.currentPassword = '현재 비밀번호를 입력해주세요';
      if (!newPassword) {
        errors.newPassword = '새 비밀번호를 입력해주세요';
      } else if (newPassword.length < 8 || newPassword.length > 128) {
        errors.newPassword = '비밀번호는 8자 이상 128자 이하여야 합니다';
      }
      if (newPassword && newPassword !== confirmPassword) {
        errors.confirmPassword = '새 비밀번호가 일치하지 않습니다';
      }
    }
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    /* 변경된 필드만 포함 (null 필드는 백엔드에서 무시) */
    const payload = {};
    if (nickname !== (profile?.nickname || user?.nickname || '')) {
      payload.nickname = nickname || null;
    }
    if (profileImageUrl !== (profile?.profileImageUrl || '')) {
      payload.profileImageUrl = profileImageUrl || null;
    }
    if (newPassword && currentPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateProfile(payload);
      onSaved(updated);
    } catch (err) {
      setSubmitError(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayInitial = nickname?.charAt(0) || user?.nickname?.charAt(0) || 'U';

  const modalContent = (
    <>
      <S.ModalOverlay onClick={onClose} />
      <S.ModalContainer role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
        <S.ModalHeader>
          <S.ModalTitle id="edit-profile-title">프로필 수정</S.ModalTitle>
          <S.ModalCloseBtn onClick={onClose} aria-label="닫기">✕</S.ModalCloseBtn>
        </S.ModalHeader>

        {submitError && <S.ModalErrorBar role="alert">{submitError}</S.ModalErrorBar>}

        <form onSubmit={handleSubmit}>
          {/* 기본 정보 */}
          <S.ModalSection>
            <S.ModalSectionTitle>기본 정보</S.ModalSectionTitle>

            <S.FormField>
              <S.FormLabel htmlFor="edit-nickname">닉네임</S.FormLabel>
              <S.FormInput
                id="edit-nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임 (2~20자)"
                $error={!!fieldErrors.nickname}
              />
              {fieldErrors.nickname && (
                <S.FormHelperText $error>{fieldErrors.nickname}</S.FormHelperText>
              )}
            </S.FormField>

            <S.FormField>
              <S.FormLabel htmlFor="edit-image-url">프로필 이미지 URL</S.FormLabel>
              <S.AvatarPreviewRow>
                <S.AvatarPreviewImg $src={profileImageUrl || null}>
                  {!profileImageUrl && displayInitial}
                </S.AvatarPreviewImg>
                <S.FormInput
                  id="edit-image-url"
                  type="url"
                  value={profileImageUrl}
                  onChange={(e) => setProfileImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  $error={!!fieldErrors.profileImageUrl}
                  style={{ flex: 1 }}
                />
              </S.AvatarPreviewRow>
              {fieldErrors.profileImageUrl ? (
                <S.FormHelperText $error>{fieldErrors.profileImageUrl}</S.FormHelperText>
              ) : (
                <S.FormHelperText>이미지 URL을 입력하면 미리보기가 표시됩니다</S.FormHelperText>
              )}
            </S.FormField>
          </S.ModalSection>

          {/* 비밀번호 변경 */}
          <S.ModalSection>
            <S.ModalSectionTitle>비밀번호 변경</S.ModalSectionTitle>

            <S.FormField>
              <S.FormLabel htmlFor="edit-current-pw">현재 비밀번호</S.FormLabel>
              <S.FormInput
                id="edit-current-pw"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호"
                autoComplete="current-password"
                $error={!!fieldErrors.currentPassword}
              />
              {fieldErrors.currentPassword && (
                <S.FormHelperText $error>{fieldErrors.currentPassword}</S.FormHelperText>
              )}
            </S.FormField>

            <S.FormField>
              <S.FormLabel htmlFor="edit-new-pw">새 비밀번호</S.FormLabel>
              <S.FormInput
                id="edit-new-pw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 (8~128자)"
                autoComplete="new-password"
                $error={!!fieldErrors.newPassword}
              />
              {fieldErrors.newPassword && (
                <S.FormHelperText $error>{fieldErrors.newPassword}</S.FormHelperText>
              )}
            </S.FormField>

            <S.FormField>
              <S.FormLabel htmlFor="edit-confirm-pw">새 비밀번호 확인</S.FormLabel>
              <S.FormInput
                id="edit-confirm-pw"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호 재입력"
                autoComplete="new-password"
                $error={!!fieldErrors.confirmPassword}
              />
              {fieldErrors.confirmPassword && (
                <S.FormHelperText $error>{fieldErrors.confirmPassword}</S.FormHelperText>
              )}
            </S.FormField>
          </S.ModalSection>

          <S.ModalButtonRow>
            <S.ModalCancelBtn type="button" onClick={onClose}>취소</S.ModalCancelBtn>
            <S.ModalSaveBtn type="submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '저장'}
            </S.ModalSaveBtn>
          </S.ModalButtonRow>
        </form>
      </S.ModalContainer>
    </>
  );

  return createPortal(modalContent, document.body);
}

/* ── 최애 영화 선택 모달 ── */
function FavoriteMovieModal({ initialMovies = [], onClose, onSave }) {
  const { showAlert } = useModal();

  const initialSelectionRef = useRef(
    initialMovies.map(normalizeFavoriteMovieCandidate).filter(Boolean),
  );
  const initialSelection = initialSelectionRef.current;
  const initialMovieIds = useMemo(
    () => initialSelection.map((movie) => movie.movieId),
    [initialSelection],
  );

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState(initialSelection);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const selectedMovieIds = useMemo(
    () => selectedMovies.map((movie) => movie.movieId),
    [selectedMovies],
  );
  const isDirty = useMemo(
    () => !areOrderedListsEqual(initialMovieIds, selectedMovieIds),
    [initialMovieIds, selectedMovieIds],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return undefined;
    }

    let isCancelled = false;
    const timerId = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const result = await searchMovies({
          query: trimmedQuery,
          searchType: 'all',
          page: 1,
          size: 12,
        });

        if (!isCancelled) {
          setSearchResults(
            (result?.movies || [])
              .map(normalizeFavoriteMovieCandidate)
              .filter(Boolean),
          );
        }
      } catch (error) {
        if (!isCancelled) {
          setSearchError(error.message || '영화 검색에 실패했습니다.');
        }
      } finally {
        if (!isCancelled) {
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      isCancelled = true;
      window.clearTimeout(timerId);
    };
  }, [query]);

  const removeMovie = useCallback((movieId) => {
    setSelectedMovies((prevMovies) => prevMovies.filter((movie) => movie.movieId !== movieId));
  }, []);

  const toggleMovie = useCallback(async (movie) => {
    const normalizedMovie = normalizeFavoriteMovieCandidate(movie);
    if (!normalizedMovie) {
      return;
    }

    const isAlreadySelected = selectedMovieIds.includes(normalizedMovie.movieId);
    if (isAlreadySelected) {
      removeMovie(normalizedMovie.movieId);
      return;
    }

    if (selectedMovies.length >= MAX_FAVORITE_MOVIES) {
      await showAlert({
        title: '최대 등록 수 초과',
        message: `최애 영화는 최대 ${MAX_FAVORITE_MOVIES}편까지 등록할 수 있습니다.`,
        type: 'warning',
      });
      return;
    }

    setSelectedMovies((prevMovies) => [...prevMovies, normalizedMovie]);
  }, [removeMovie, selectedMovieIds, selectedMovies.length, showAlert]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSearchError(null);

    try {
      await onSave(selectedMovieIds);
      onClose();
    } catch (error) {
      setSearchError(error.message || '최애 영화 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }, [onClose, onSave, selectedMovieIds]);

  const renderSaveButton = (size = 'default') => (
    <S.ModalSaveBtn
      type="button"
      onClick={handleSave}
      disabled={!isDirty || isSaving}
      $compact={size === 'compact'}
    >
      {isSaving ? '저장 중...' : '저장하기'}
    </S.ModalSaveBtn>
  );

  const modalContent = (
    <>
      <S.ModalOverlay onClick={onClose} />
      <S.FavoriteMovieModalContainer
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorite-movie-modal-title"
      >
        <S.ModalHeader>
          <S.ModalTitle id="favorite-movie-modal-title">최애 영화 찾기</S.ModalTitle>
          <S.ModalCloseBtn onClick={onClose} aria-label="닫기">✕</S.ModalCloseBtn>
        </S.ModalHeader>

        <S.FavoriteMovieSearchRow>
          <S.FavoriteMovieSearchInput
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="영화 제목, 감독, 배우로 검색하세요"
            aria-label="영화 검색"
          />
          {renderSaveButton()}
        </S.FavoriteMovieSearchRow>

        {searchError && <S.ModalErrorBar role="alert">{searchError}</S.ModalErrorBar>}

        <S.FavoriteMovieSearchSummary>
          {isSearching
            ? '검색 중입니다...'
            : query.trim()
              ? `검색 결과 ${searchResults.length}편`
              : '검색어를 입력하면 제목, 감독, 배우 기준으로 영화를 찾습니다.'}
        </S.FavoriteMovieSearchSummary>

        <S.FavoriteMovieResultGrid>
          {!query.trim() && (
            <S.FavoriteMovieGuideCard>
              <strong>영화를 검색해 주세요.</strong>
              <span>검색 결과에서 `추가하기`를 누르면 아래 전당 리스트에 담깁니다.</span>
            </S.FavoriteMovieGuideCard>
          )}

          {query.trim() && !isSearching && searchResults.length === 0 && !searchError && (
            <S.FavoriteMovieGuideCard>
              <strong>검색 결과가 없습니다.</strong>
              <span>다른 제목이나 감독, 배우 이름으로 다시 검색해 주세요.</span>
            </S.FavoriteMovieGuideCard>
          )}

          {searchResults.map((movie) => {
            const posterSrc = resolveMoviePosterSrc(movie);
            const isSelected = selectedMovieIds.includes(movie.movieId);

            return (
              <S.FavoriteMovieResultCard key={movie.movieId}>
                <S.FavoriteMovieResultPoster>
                  {posterSrc ? (
                    <S.FavoriteMovieResultPosterImg
                      src={posterSrc}
                      alt={`${movie.title} 포스터`}
                      loading="lazy"
                    />
                  ) : (
                    <S.FavoriteMovieResultPosterFallback>🎬</S.FavoriteMovieResultPosterFallback>
                  )}
                  <S.FavoriteMovieResultAction
                    type="button"
                    $selected={isSelected}
                    onClick={() => {
                      void toggleMovie(movie);
                    }}
                  >
                    {isSelected ? '제외하기' : '추가하기'}
                  </S.FavoriteMovieResultAction>
                </S.FavoriteMovieResultPoster>

                <S.FavoriteMovieResultInfo>
                  <S.FavoriteMovieResultTitle>{movie.title}</S.FavoriteMovieResultTitle>
                  <S.FavoriteMovieResultMeta>
                    {[
                      movie.releaseYear,
                      ...(movie.genres || []).slice(0, 2),
                    ].filter(Boolean).join(' · ')}
                  </S.FavoriteMovieResultMeta>
                </S.FavoriteMovieResultInfo>
              </S.FavoriteMovieResultCard>
            );
          })}
        </S.FavoriteMovieResultGrid>

        <S.FavoriteMovieSelectedSection>
          <S.FavoriteMovieSelectedHeader>
            <S.FavoriteMovieSelectedTitleGroup>
              <span>전당 후보</span>
              <span>{selectedMovies.length} / {MAX_FAVORITE_MOVIES}</span>
            </S.FavoriteMovieSelectedTitleGroup>
            {renderSaveButton('compact')}
          </S.FavoriteMovieSelectedHeader>

          <S.FavoriteMovieSelectedList>
            {selectedMovies.length === 0 && (
              <S.FavoriteMovieSelectedEmpty>
                아직 추가된 영화가 없습니다.
              </S.FavoriteMovieSelectedEmpty>
            )}

            {selectedMovies.map((movie) => {
              const posterSrc = resolveMoviePosterSrc(movie);
              return (
                <S.FavoriteMovieSelectedItem
                  key={movie.movieId}
                  type="button"
                  onClick={() => removeMovie(movie.movieId)}
                >
                  <S.FavoriteMovieSelectedPoster>
                    {posterSrc ? (
                      <img src={posterSrc} alt={`${movie.title} 포스터`} loading="lazy" />
                    ) : (
                      <span>🎬</span>
                    )}
                  </S.FavoriteMovieSelectedPoster>
                  <S.FavoriteMovieSelectedTitle>{movie.title}</S.FavoriteMovieSelectedTitle>
                </S.FavoriteMovieSelectedItem>
              );
            })}
          </S.FavoriteMovieSelectedList>
        </S.FavoriteMovieSelectedSection>
      </S.FavoriteMovieModalContainer>
    </>
  );

  return createPortal(modalContent, document.body);
}

/* ── 마이페이지 ── */
export default function MyPagePage() {
  const navigate = useNavigate();
  const { showAlert } = useModal();
  const onboardingMission = location.state?.onboardingMission || null;

  /*
   * 2026-04-23 라우팅 재설계 PR-3:
   *   - 기존 `useState(location.state?.activeTab || 'profile')` 을 useTabParam 으로 교체.
   *     location.state 기반은 새로고침/공유 시 탭 상태를 잃었다.
   *   - URL: /mypage?tab=wishlist → activeTab='wishlist'.
   *   - 기본 탭(profile) 선택 시 쿼리 생략 → 캐노니컬 URL 유지.
   *   - 탭 전환은 내부적으로 replace:true → 뒤로가기는 "이전 페이지" 로 이동 (이전 탭 아님).
   */
  const [activeTab, setActiveTab] = useTabParam({
    validIds: VALID_TAB_IDS,
    defaultTab: 'profile',
  });

  const [profile, setProfile] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [favoriteGenreCatalog, setFavoriteGenreCatalog] = useState([]);
  const [selectedFavoriteGenres, setSelectedFavoriteGenres] = useState([]);
  const [savedFavoriteGenreIds, setSavedFavoriteGenreIds] = useState([]);
  const [isFavoriteGenreSaving, setIsFavoriteGenreSaving] = useState(false);
  const [draggedFavoriteGenreId, setDraggedFavoriteGenreId] = useState(null);
  const [dragOverFavoriteGenreId, setDragOverFavoriteGenreId] = useState(null);
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const [savedFavoriteMovieIds, setSavedFavoriteMovieIds] = useState([]);
  const [favoriteMovieMaxCount, setFavoriteMovieMaxCount] = useState(MAX_FAVORITE_MOVIES);
  /*
   * 2026-04-23 PR-3: "최애 영화 찾기" 모달의 열림/닫힘을 URL ?modal=favoriteMovies 와 동기화.
   * 브라우저 뒤로가기 시 페이지 이동이 아니라 모달만 닫히도록 히스토리 스택을 활용한다.
   */
  const [isFavoriteMovieModalOpen, openFavoriteMovieModal, closeFavoriteMovieModal] =
    useModalRoute('favoriteMovies');
  const [isFavoriteOrderSaving, setIsFavoriteOrderSaving] = useState(false);
  const [draggedFavoriteMovieId, setDraggedFavoriteMovieId] = useState(null);
  const [dragOverFavoriteMovieId, setDragOverFavoriteMovieId] = useState(null);
  /** 시청 이력 탭은 이제 사용자가 작성한 리뷰 목록을 의미한다. */
  const [myReviews, setMyReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPagination, setReviewPagination] = useState({
    page: 1,
    size: REVIEW_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [myPosts, setMyPosts] = useState([]);
  const [myPostsPage, setMyPostsPage] = useState(0);
  const [myPostsPagination, setMyPostsPagination] = useState({ totalPages: 0, totalElements: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  /*
   * 2026-04-23 PR-3: "프로필 수정" 모달도 URL ?modal=editProfile 와 동기화.
   * 동시에 두 모달이 열리지는 않으므로 단일 ?modal 키로 충분하다 (useModalRoute 규약).
   */
  const [isEditModalOpen, openEditModal, closeEditModal] = useModalRoute('editProfile');

  /**
   * 착용 아바타 / 배지 (2026-04-14 신설, C 방향).
   *
   * <p>Backend GET /api/v1/users/me/items/equipped 는 [avatar, badge] 2-원소 배열을 반환한다.
   * 각 원소는 UserItemResponse 또는 null (미착용).
   * 프로필 수정 이미지가 없을 때 아바타가, 항상 닉네임 옆에 배지가 표시된다.</p>
   */
  const [equippedAvatar, setEquippedAvatar] = useState(null);
  const [equippedBadge, setEquippedBadge] = useState(null);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const authLoading = useAuthStore((s) => s.isLoading);
  const favoriteGenreDragSuppressUntilRef = useRef(0);

  const favoriteMovieIds = useMemo(
    () => favoriteMovies.map((item) => item.movieId),
    [favoriteMovies],
  );
  const selectedFavoriteGenreIds = useMemo(
    () => selectedFavoriteGenres.map((genre) => genre.genreId),
    [selectedFavoriteGenres],
  );
  const availableFavoriteGenres = useMemo(
    () => favoriteGenreCatalog.filter((genre) => !selectedFavoriteGenreIds.includes(genre.genreId)),
    [favoriteGenreCatalog, selectedFavoriteGenreIds],
  );
  const isFavoriteGenreDirty = useMemo(
    () => !areOrderedListsEqual(savedFavoriteGenreIds, selectedFavoriteGenreIds),
    [savedFavoriteGenreIds, selectedFavoriteGenreIds],
  );
  const isFavoriteOrderDirty = useMemo(
    () => !areOrderedListsEqual(savedFavoriteMovieIds, favoriteMovieIds),
    [favoriteMovieIds, savedFavoriteMovieIds],
  );
  const shouldShowOnboardingReturn = useMemo(() => {
    if (activeTab !== 'preferences' || location.state?.returnTo !== ROUTES.ONBOARDING) {
      return false;
    }

    if (onboardingMission === 'favoriteGenres') {
      return savedFavoriteGenreIds.length > 0;
    }

    if (onboardingMission === 'favoriteMovies') {
      return savedFavoriteMovieIds.length > 0;
    }

    return savedFavoriteGenreIds.length > 0 || savedFavoriteMovieIds.length > 0;
  }, [
    activeTab,
    location.state?.returnTo,
    onboardingMission,
    savedFavoriteGenreIds.length,
    savedFavoriteMovieIds.length,
  ]);
  const onboardingReturnDescription = useMemo(() => {
    if (onboardingMission === 'favoriteGenres') {
      return '선호 장르 저장이 끝났다면 시작 미션 페이지로 돌아가 체크 상태를 확인하세요.';
    }

    if (onboardingMission === 'favoriteMovies') {
      return '최애 영화 저장이 끝났다면 시작 미션 페이지로 돌아가 체크 상태를 확인하세요.';
    }

    return '저장이 끝났다면 시작 미션 페이지로 돌아가 진행 상태를 확인하세요.';
  }, [onboardingMission]);
  const favoriteMovieSlots = useMemo(() => {
    const filledSlots = favoriteMovies.slice(0, FAVORITE_GRID_SIZE);
    const emptySlots = Array.from(
      { length: Math.max(0, FAVORITE_GRID_SIZE - filledSlots.length) },
      (_, index) => ({ slotId: `favorite-empty-slot-${index}` }),
    );
    return [...filledSlots, ...emptySlots];
  }, [favoriteMovies]);

  /**
   * 내 리뷰 목록을 페이지 단위로 불러온다.
   *
   * 마이페이지 하단 번호형 페이지네이션과 맞추기 위해
   * 현재 페이지 / 총 페이지 수를 함께 로컬 state로 저장한다.
   */
  /**
   * 착용 아이템 로드 — 2026-04-14 신설.
   *
   * <p>프로필 헤더의 아바타·배지 렌더링용. 마운트 시 1회 + 프로필 수정 완료 후 재호출.
   * 실패 시 조용히 무시(null 유지)하여 기존 프로필 렌더링에 영향을 주지 않는다.</p>
   */
  const loadEquippedItems = useCallback(async () => {
    try {
      const result = await getEquippedItems();
      /* Backend 는 [avatar, badge] 고정 순서로 반환. 타입 방어를 위해 null 체크 포함. */
      if (Array.isArray(result) && result.length >= 2) {
        setEquippedAvatar(result[0] || null);
        setEquippedBadge(result[1] || null);
      } else {
        setEquippedAvatar(null);
        setEquippedBadge(null);
      }
    } catch (err) {
      /* 비로그인 상태에서 호출되었거나 네트워크 오류 — 무시하고 fallback UI 유지 */
      console.debug('착용 아이템 조회 실패 (무시):', err?.message);
      setEquippedAvatar(null);
      setEquippedBadge(null);
    }
  }, []);

  const loadMyReviews = useCallback(async (page = 1) => {
    const reviewData = await getMyReviews({ page, size: REVIEW_PAGE_SIZE });
    setMyReviews(reviewData?.reviews || []);
    setReviewPagination({
      page: reviewData?.pagination?.page || page,
      size: reviewData?.pagination?.size || REVIEW_PAGE_SIZE,
      total: reviewData?.pagination?.total || 0,
      totalPages: reviewData?.pagination?.totalPages || 0,
    });
  }, []);

  const applyFavoriteGenreResponse = useCallback((response) => {
    const nextFavoriteGenreCatalog = response?.availableGenres || [];
    const nextSelectedFavoriteGenres = (response?.selectedGenres || [])
      .map((item) => item.genre)
      .filter(Boolean);

    setFavoriteGenreCatalog(nextFavoriteGenreCatalog);
    setSelectedFavoriteGenres(nextSelectedFavoriteGenres);
    setSavedFavoriteGenreIds(nextSelectedFavoriteGenres.map((genre) => genre.genreId));
  }, []);

  const applyFavoriteMovieResponse = useCallback((response) => {
    const nextFavoriteMovies = (response?.favoriteMovies || []).map((item) => ({
      ...item,
      movie: normalizeFavoriteMovieCandidate(item.movie),
    }));
    setFavoriteMovies(nextFavoriteMovies);
    setSavedFavoriteMovieIds(nextFavoriteMovies.map((item) => item.movieId));
    setFavoriteMovieMaxCount(response?.maxCount || MAX_FAVORITE_MOVIES);
  }, []);

  const loadFavoriteMovies = useCallback(async () => {
    const favoriteMovieData = await getFavoriteMovies();
    applyFavoriteMovieResponse(favoriteMovieData);
  }, [applyFavoriteMovieResponse]);

  const loadFavoriteGenres = useCallback(async () => {
    const favoriteGenreData = await getFavoriteGenres();
    applyFavoriteGenreResponse(favoriteGenreData);
  }, [applyFavoriteGenreResponse]);

  /* 마운트 시 착용 아이템 로드 — 탭 전환과 무관하게 항상 헤더에 반영 */
  useEffect(() => {
    if (location.state?.activeTab && location.state.activeTab !== activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [activeTab, location.state?.activeTab]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadEquippedItems();
  }, [isAuthenticated, loadEquippedItems]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadTabData() {
      setIsLoading(true);
      setError(null);
      try {
        switch (activeTab) {
          case 'profile': {
            const profileData = await getProfile();
            setProfile(profileData);
            break;
          }
          case 'watch-history': {
            await loadMyReviews(reviewPage);
            break;
          }
          case 'my-posts': {
            const postsData = await getMyPosts({ page: myPostsPage, size: 10 });
            setMyPosts(postsData?.content || []);
            setMyPostsPagination({
              totalPages: postsData?.totalPages ?? 0,
              totalElements: postsData?.totalElements ?? 0,
            });
            break;
          }
          case 'wishlist': {
            const wishlistData = await getWishlist();
            setWishlist(wishlistData?.wishlist || []);
            break;
          }
          case 'preferences': {
            await Promise.all([loadFavoriteGenres(), loadFavoriteMovies()]);
            break;
          }
          default:
            break;
        }
      } catch (err) {
        setError(err.message || '데이터를 불러오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    loadTabData();
  }, [activeTab, isAuthenticated, loadFavoriteGenres, loadFavoriteMovies, loadMyReviews, reviewPage, myPostsPage]);

  /**
   * 리뷰 수정/삭제 후에도 마이페이지 페이지네이션 숫자를 맞추기 위해
   * 상위에서 목록과 total 값을 함께 보정한다.
   */
  const handleMyReviewsChange = useCallback((updater) => {
    setMyReviews((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const removedCount = Math.max(0, prev.length - next.length);

      if (removedCount > 0) {
        setReviewPagination((prevPagination) => {
          const nextTotal = Math.max(0, prevPagination.total - removedCount);
          const nextTotalPages = nextTotal > 0
            ? Math.ceil(nextTotal / prevPagination.size)
            : 0;
          const fallbackPage = nextTotalPages > 0
            ? Math.min(prevPagination.page, nextTotalPages)
            : 1;

          if (next.length === 0 && fallbackPage !== prevPagination.page) {
            setReviewPage(fallbackPage);
          }

          return {
            ...prevPagination,
            total: nextTotal,
            totalPages: nextTotalPages,
            page: fallbackPage,
          };
        });
      }

      return next;
    });
  }, []);

  /* 페이지 번호는 10개 단위 묶음으로 표시한다. */
  const pageGroupStart = Math.floor((reviewPagination.page - 1) / PAGE_GROUP_SIZE) * PAGE_GROUP_SIZE + 1;
  const pageGroupEnd = Math.min(
    pageGroupStart + PAGE_GROUP_SIZE - 1,
    reviewPagination.totalPages,
  );
  const pageNumbers = Array.from(
    { length: Math.max(0, pageGroupEnd - pageGroupStart + 1) },
    (_, index) => pageGroupStart + index,
  );

  function handleProfileSaved(updated) {
    setProfile(updated);
    /* Zustand store + localStorage 동기화 */
    if (updated?.nickname || updated?.profileImageUrl) {
      updateUser({ ...user, ...updated });
    }
    /* 2026-04-23 PR-3: 로컬 state 가 아니라 URL 쿼리(?modal 제거) 로 모달 닫기 */
    closeEditModal();
  }

  const handleFavoriteMoviesSaved = useCallback(async (movieIds) => {
    const response = await saveFavoriteMovies(movieIds);
    applyFavoriteMovieResponse(response);
  }, [applyFavoriteMovieResponse]);

  const handleFavoriteGenreSelect = useCallback((genre) => {
    setSelectedFavoriteGenres((prevGenres) => {
      if (prevGenres.some((item) => item.genreId === genre.genreId)) {
        return prevGenres;
      }

      return [...prevGenres, genre];
    });
  }, []);

  const handleFavoriteGenreRemove = useCallback((genreId) => {
    setSelectedFavoriteGenres((prevGenres) =>
      prevGenres.filter((genre) => genre.genreId !== genreId));
  }, []);

  const handleFavoriteGenreChipClick = useCallback((genreId) => {
    if (Date.now() < favoriteGenreDragSuppressUntilRef.current) {
      return;
    }

    handleFavoriteGenreRemove(genreId);
  }, [handleFavoriteGenreRemove]);

  const handleFavoriteGenreDragStart = useCallback((genreId) => {
    favoriteGenreDragSuppressUntilRef.current = Date.now() + 250;
    setDraggedFavoriteGenreId(genreId);
    setDragOverFavoriteGenreId(genreId);
  }, []);

  const handleFavoriteGenreDrop = useCallback((targetGenreId) => {
    favoriteGenreDragSuppressUntilRef.current = Date.now() + 250;

    if (!draggedFavoriteGenreId || draggedFavoriteGenreId === targetGenreId) {
      setDraggedFavoriteGenreId(null);
      setDragOverFavoriteGenreId(null);
      return;
    }

    setSelectedFavoriteGenres((prevGenres) => {
      const fromIndex = prevGenres.findIndex((genre) => genre.genreId === draggedFavoriteGenreId);
      const toIndex = prevGenres.findIndex((genre) => genre.genreId === targetGenreId);

      if (fromIndex < 0 || toIndex < 0) {
        return prevGenres;
      }

      return moveArrayItem(prevGenres, fromIndex, toIndex);
    });

    setDraggedFavoriteGenreId(null);
    setDragOverFavoriteGenreId(null);
  }, [draggedFavoriteGenreId]);

  const handleFavoriteGenreDragEnd = useCallback(() => {
    favoriteGenreDragSuppressUntilRef.current = Date.now() + 250;
    setDraggedFavoriteGenreId(null);
    setDragOverFavoriteGenreId(null);
  }, []);

  const handleFavoriteGenreSave = useCallback(async () => {
    setIsFavoriteGenreSaving(true);
    try {
      const response = await saveFavoriteGenres(selectedFavoriteGenreIds);
      applyFavoriteGenreResponse(response);
    } catch (err) {
      await showAlert({
        title: '선호 장르 저장 실패',
        message: err.message || '선호 장르 저장에 실패했습니다.',
        type: 'error',
      });
    } finally {
      setIsFavoriteGenreSaving(false);
    }
  }, [applyFavoriteGenreResponse, selectedFavoriteGenreIds, showAlert]);

  const handleFavoriteOrderSave = useCallback(async () => {
    setIsFavoriteOrderSaving(true);
    try {
      const response = await reorderFavoriteMovies(favoriteMovieIds);
      applyFavoriteMovieResponse(response);
    } catch (err) {
      await showAlert({
        title: '순서 저장 실패',
        message: err.message || '최애 영화 순서 저장에 실패했습니다.',
        type: 'error',
      });
    } finally {
      setIsFavoriteOrderSaving(false);
    }
  }, [applyFavoriteMovieResponse, favoriteMovieIds, showAlert]);

  const handleFavoriteMovieClick = useCallback((movieId) => {
    /*
     * 2026-04-23 PR-3: backTab 필드를 폐기하고 backTo URL 에 직접 ?tab=preferences 포함.
     *   - 기존: { backTo: '/mypage', backTab: 'preferences' } 를 상세에서 읽어 state.activeTab 로 재전달
     *   - 신: { backTo: '/mypage?tab=preferences' } 만으로 완결 — MyPage 의 useTabParam 이 쿼리로 탭 복원
     *   useBackNavigation 공통 훅은 state.backTo 만 해석하므로 우회 로직이 사라져 단순/안전.
     */
    navigate(buildPath(ROUTES.MOVIE_DETAIL, { id: movieId }), {
      state: {
        /*
         * PR-3 라우팅 재설계: backTab 폐기 + URL 쿼리로 탭 복원.
         * MYPAGE → ACCOUNT_PROFILE 이관 (/account/profile?tab=preferences).
         * returnTo / onboardingMission 은 별개 플로우라 state 에 그대로 보존한다.
         */
        backTo: `${ROUTES.ACCOUNT_PROFILE}?tab=preferences`,
        returnTo: location.state?.returnTo,
        onboardingMission,
      },
    });
  }, [location.state?.returnTo, navigate, onboardingMission]);

  const handleFavoriteDragStart = useCallback((movieId) => {
    setDraggedFavoriteMovieId(movieId);
    setDragOverFavoriteMovieId(movieId);
  }, []);

  const handleFavoriteDrop = useCallback((targetMovieId) => {
    if (!draggedFavoriteMovieId || draggedFavoriteMovieId === targetMovieId) {
      setDraggedFavoriteMovieId(null);
      setDragOverFavoriteMovieId(null);
      return;
    }

    setFavoriteMovies((prevMovies) => {
      const fromIndex = prevMovies.findIndex((movie) => movie.movieId === draggedFavoriteMovieId);
      const toIndex = prevMovies.findIndex((movie) => movie.movieId === targetMovieId);

      if (fromIndex < 0 || toIndex < 0) {
        return prevMovies;
      }

      return moveArrayItem(prevMovies, fromIndex, toIndex);
    });

    setDraggedFavoriteMovieId(null);
    setDragOverFavoriteMovieId(null);
  }, [draggedFavoriteMovieId]);

  if (authLoading) {
    return <Loading message="인증 확인 중..." fullPage />;
  }

  return (
    <S.Wrapper>
      <S.Inner>
        {/* 페이지 헤더 */}
        <S.Header>
          <S.AvatarWrap>
            {/*
              착용 아바타 이미지가 있으면 그것을 최우선으로 표시.
              없으면 프로필 수정으로 업로드한 profileImageUrl, 그것도 없으면 닉네임 이니셜.
              2026-04-14 C 방향: equippedAvatar.imageUrl 우선순위 최상단.
            */}
            <S.Avatar>
              {equippedAvatar?.imageUrl ? (
                <img
                  src={equippedAvatar.imageUrl}
                  alt={equippedAvatar.itemName || '착용 아바타'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : profile?.profileImageUrl ? (
                <img
                  src={profile.profileImageUrl}
                  alt="프로필 이미지"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                user?.nickname?.charAt(0) || 'U'
              )}
            </S.Avatar>
          </S.AvatarWrap>
          <S.UserInfo>
            <S.NameRow>
              <S.Nickname>{user?.nickname || '사용자'}</S.Nickname>
              {/* 등급 배지 — 백엔드 코드(NORMAL/BRONZE/.../DIAMOND)를 팝콘 테마 한국어로 변환 */}
              <S.GradeBadge>{getGradeLabel(profile?.grade || user?.grade)}</S.GradeBadge>
              {/*
                착용 배지 — 2026-04-14 C 방향 신설.
                프리미엄 배지 1개월 등 포인트로 교환한 배지가 있으면 등급 배지 옆에 표시.
                GradeBadge 스타일을 재활용하여 통일감 유지.
              */}
              {equippedBadge && (
                <S.GradeBadge title={equippedBadge.itemName} style={{ background: '#ffd700', color: '#333' }}>
                  ⭐ {equippedBadge.itemName}
                </S.GradeBadge>
              )}
            </S.NameRow>
            <S.Email>{user?.email || ''}</S.Email>
            <S.EditBtn onClick={openEditModal}>
              ✏️ 프로필 수정
            </S.EditBtn>
          </S.UserInfo>
        </S.Header>

        {/* 탭 네비게이션 */}
        <S.Tabs role="tablist" aria-label="마이페이지 탭">
          {TABS.map((tab) => (
            <S.Tab
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`mypage-panel-${tab.id}`}
              $active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </S.Tab>
          ))}
        </S.Tabs>

        {error && (
          <S.ErrorBar role="alert">
            {error}
            <S.ErrorClose onClick={() => setError(null)}>닫기</S.ErrorClose>
          </S.ErrorBar>
        )}

        <S.Content key={activeTab}>
          {/* 프로필 탭 */}
          {activeTab === 'profile' && (
            <div>
              {isLoading ? (
                <Loading message="프로필 로딩 중..." />
              ) : (
                <S.ProfileCard>
                  <S.ProfileField>
                    <S.ProfileLabel>닉네임</S.ProfileLabel>
                    <S.ProfileValue>{profile?.nickname || user?.nickname || '-'}</S.ProfileValue>
                  </S.ProfileField>
                  <S.ProfileField>
                    <S.ProfileLabel>이메일</S.ProfileLabel>
                    <S.ProfileValue>{profile?.email || user?.email || '-'}</S.ProfileValue>
                  </S.ProfileField>
                  <S.ProfileField>
                    <S.ProfileLabel>가입일</S.ProfileLabel>
                    <S.ProfileValue>{profile?.createdAt || '-'}</S.ProfileValue>
                  </S.ProfileField>
                </S.ProfileCard>
              )}
            </div>
          )}

          {/* 시청 이력 탭 — watch_history 대신 내가 작성한 리뷰 목록을 노출한다. */}
          {activeTab === 'watch-history' && (
            <div>
              {isLoading ? (
                <Loading message="작성한 리뷰 로딩 중..." />
              ) : myReviews.length === 0 ? (
                <EmptyState
                  icon="✍️"
                  title="아직 작성한 리뷰가 없습니다"
                  description="영화 상세 페이지에서 첫 리뷰를 남겨보세요"
                  actionLabel="영화 둘러보기"
                  onAction={() => navigate(ROUTES.SEARCH)}
                />
              ) : (
                <S.MyReviewsSection>
                  <ReviewList
                    reviews={myReviews}
                    onReviewsChange={handleMyReviewsChange}
                    showMovieLink
                  />

                  {reviewPagination.totalPages > 1 && (
                    <S.PaginationBar>
                      {pageGroupStart > 1 && (
                        <S.PageJumpButton
                          type="button"
                          onClick={() => setReviewPage(pageGroupStart - PAGE_GROUP_SIZE)}
                        >
                          &lt;&lt;
                        </S.PageJumpButton>
                      )}

                      {pageNumbers.map((pageNumber) => (
                        <S.PageButton
                          key={pageNumber}
                          type="button"
                          $active={pageNumber === reviewPagination.page}
                          onClick={() => setReviewPage(pageNumber)}
                        >
                          {pageNumber}
                        </S.PageButton>
                      ))}

                      {pageGroupEnd < reviewPagination.totalPages && (
                        <S.PageJumpButton
                          type="button"
                          onClick={() => setReviewPage(pageGroupStart + PAGE_GROUP_SIZE)}
                        >
                          &gt;&gt;
                        </S.PageJumpButton>
                      )}
                    </S.PaginationBar>
                  )}
                </S.MyReviewsSection>
              )}
            </div>
          )}

          {/* 내가 쓴 글 탭 */}
          {activeTab === 'my-posts' && (
            <div>
              {isLoading ? (
                <Loading message="게시글 로딩 중..." />
              ) : myPosts.length === 0 ? (
                <EmptyState
                  icon="✏️"
                  title="아직 작성한 게시글이 없습니다"
                  description="커뮤니티에서 첫 글을 남겨보세요"
                  actionLabel="커뮤니티 가기"
                  onAction={() => navigate(ROUTES.COMMUNITY)}
                />
              ) : (
                <S.MyPostsSection>
                  {myPosts.map((post) => (
                    <S.PostItem
                      key={post.id}
                      onClick={() => navigate(`/community/${post.id}`)}
                    >
                      <S.PostItemHeader>
                        {post.category && (
                          <S.PostCategoryBadge>
                            {CATEGORY_LABEL[post.category] || post.category}
                          </S.PostCategoryBadge>
                        )}
                        <S.PostItemTime>{post.createdAt ? post.createdAt.slice(0, 10) : ''}</S.PostItemTime>
                      </S.PostItemHeader>
                      <S.PostItemTitle>{post.title}</S.PostItemTitle>
                      <S.PostItemMeta>
                        <span>👁 {post.viewCount ?? 0}</span>
                        <span>❤️ {post.likeCount ?? 0}</span>
                      </S.PostItemMeta>
                    </S.PostItem>
                  ))}

                  {myPostsPagination.totalPages > 1 && (
                    <S.PaginationBar>
                      {Array.from({ length: myPostsPagination.totalPages }, (_, i) => i).map((p) => (
                        <S.PageButton
                          key={p}
                          type="button"
                          $active={p === myPostsPage}
                          onClick={() => setMyPostsPage(p)}
                        >
                          {p + 1}
                        </S.PageButton>
                      ))}
                    </S.PaginationBar>
                  )}
                </S.MyPostsSection>
              )}
            </div>
          )}

          {/* 위시리스트 탭 */}
          {activeTab === 'wishlist' && (
            <div>
              {!isLoading && wishlist.length === 0 ? (
                <EmptyState
                  icon="💝"
                  title="위시리스트가 비어있습니다"
                  description="마음에 드는 영화를 찜해보세요"
                  actionLabel="영화 둘러보기"
                  onAction={() => navigate(ROUTES.SEARCH)}
                />
              ) : (
                <MovieList
                  movies={wishlist.map((item) => item.movie || item)}
                  loading={isLoading}
                  title="찜한 영화"
                />
              )}
            </div>
          )}

          {/* 선호 설정 탭 */}
          {activeTab === 'preferences' && (
            <S.PreferencesSection>
              {shouldShowOnboardingReturn && (
                <S.OnboardingReturnCard>
                  <div>
                    <S.PreferencesTitle as="h4">시작 미션으로 돌아가기</S.PreferencesTitle>
                    <S.PreferencesHint>{onboardingReturnDescription}</S.PreferencesHint>
                  </div>
                  <S.OnboardingReturnButton
                    type="button"
                    onClick={() => navigate(ROUTES.ONBOARDING)}
                  >
                    시작 미션 페이지로 돌아가기
                  </S.OnboardingReturnButton>
                </S.OnboardingReturnCard>
              )}

              <S.PreferencesCard>
                <S.FavoriteMoviesHeader>
                  <div>
                    <S.PreferencesTitle>선호 장르</S.PreferencesTitle>
                    <S.PreferencesHint>
                      장르를 고르면 아래 `선택된 장르` 영역으로 이동합니다. 순서를 조정한 뒤
                      오른쪽 `저장하기`를 눌러야 DB에 반영됩니다.
                    </S.PreferencesHint>
                  </div>
                  <S.FavoriteMoviesHeaderActions>
                    <S.FavoriteMoviesOrderSaveButton
                      type="button"
                      onClick={() => {
                        void handleFavoriteGenreSave();
                      }}
                      disabled={!isFavoriteGenreDirty || isFavoriteGenreSaving}
                    >
                      {isFavoriteGenreSaving ? '저장 중...' : '저장하기'}
                    </S.FavoriteMoviesOrderSaveButton>
                  </S.FavoriteMoviesHeaderActions>
                </S.FavoriteMoviesHeader>

                <S.PreferencesTitle as="h4">선택된 장르</S.PreferencesTitle>
                <S.PreferencesHint>
                  {selectedFavoriteGenres.length > 0
                    ? `${selectedFavoriteGenres.length}개 선택됨. 드래그해서 priority를 바꾸고, 다시 클릭하면 제거됩니다.`
                    : '아직 선택한 장르가 없습니다.'}
                </S.PreferencesHint>

                {selectedFavoriteGenres.length > 0 ? (
                  <S.PreferencesTags>
                    {selectedFavoriteGenres.map((genre) => {
                      const isDragging = draggedFavoriteGenreId === genre.genreId;
                      const isDragOver = dragOverFavoriteGenreId === genre.genreId
                        && draggedFavoriteGenreId
                        && draggedFavoriteGenreId !== genre.genreId;

                      return (
                        <S.PreferencesTag
                          key={genre.genreId}
                          type="button"
                          draggable={selectedFavoriteGenres.length > 1}
                          $active
                          $draggable={selectedFavoriteGenres.length > 1}
                          $dragging={isDragging}
                          $dragOver={Boolean(isDragOver)}
                          onClick={() => handleFavoriteGenreChipClick(genre.genreId)}
                          onDragStart={() => handleFavoriteGenreDragStart(genre.genreId)}
                          onDragEnd={handleFavoriteGenreDragEnd}
                          onDragOver={(event) => {
                            event.preventDefault();
                            setDragOverFavoriteGenreId(genre.genreId);
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            handleFavoriteGenreDrop(genre.genreId);
                          }}
                          aria-pressed="true"
                          title="드래그해서 순서 변경, 클릭해서 제거"
                        >
                          {genre.genreName}
                        </S.PreferencesTag>
                      );
                    })}
                  </S.PreferencesTags>
                ) : (
                  <S.SelectedGenreEmpty>
                    장르를 선택하면 이 영역으로 올라오고, 드래그로 우선순위를 조정할 수 있습니다.
                  </S.SelectedGenreEmpty>
                )}

                <S.PreferencesTitle as="h4">장르 목록</S.PreferencesTitle>
                <S.PreferencesHint>
                  선호하는 장르를 선택해주세요.
                </S.PreferencesHint>

                {availableFavoriteGenres.length > 0 ? (
                  <S.PreferencesTags>
                    {availableFavoriteGenres.map((genre) => (
                      <S.PreferencesTag
                        key={genre.genreId}
                        type="button"
                        onClick={() => handleFavoriteGenreSelect(genre)}
                        aria-pressed="false"
                      >
                        {genre.genreName}
                      </S.PreferencesTag>
                    ))}
                  </S.PreferencesTags>
                ) : (
                  <S.PreferencesHint>추가로 선택할 수 있는 장르가 없습니다.</S.PreferencesHint>
                )}
              </S.PreferencesCard>

              <S.PreferencesCard>
                <S.FavoriteMoviesHeader>
                  <div>
                    <S.PreferencesTitle>영화의 전당</S.PreferencesTitle>
                    <S.FavoriteMoviesSubtitle>
                      당신만의 최고의 영화를 전시하세요
                    </S.FavoriteMoviesSubtitle>
                  </div>
                  <S.FavoriteMoviesHeaderActions>
                    <S.FavoriteMoviesActionButton
                      type="button"
                      onClick={openFavoriteMovieModal}
                    >
                      영화 찾기
                    </S.FavoriteMoviesActionButton>
                    <S.FavoriteMoviesOrderSaveButton
                      type="button"
                      onClick={() => {
                        void handleFavoriteOrderSave();
                      }}
                      disabled={!isFavoriteOrderDirty || isFavoriteOrderSaving}
                    >
                      {isFavoriteOrderSaving ? '저장 중...' : '순서 저장하기'}
                    </S.FavoriteMoviesOrderSaveButton>
                  </S.FavoriteMoviesHeaderActions>
                </S.FavoriteMoviesHeader>

                <S.FavoriteMoviesGrid>
                  {favoriteMovieSlots.map((item, index) => {
                    if (!item.movieId) {
                      return (
                        <S.FavoriteMovieEmptySlot key={item.slotId}>
                          <span>{index + 1}</span>
                        </S.FavoriteMovieEmptySlot>
                      );
                    }

                    const posterSrc = resolveMoviePosterSrc(item.movie);
                    const isDragging = draggedFavoriteMovieId === item.movieId;
                    const isDragOver = dragOverFavoriteMovieId === item.movieId
                      && draggedFavoriteMovieId
                      && draggedFavoriteMovieId !== item.movieId;

                    return (
                      <S.FavoriteMoviePosterButton
                        key={item.movieId}
                        type="button"
                        draggable={favoriteMovies.length > 1}
                        $dragging={isDragging}
                        $dragOver={Boolean(isDragOver)}
                        onClick={() => handleFavoriteMovieClick(item.movieId)}
                        onDragStart={() => handleFavoriteDragStart(item.movieId)}
                        onDragEnd={() => {
                          setDraggedFavoriteMovieId(null);
                          setDragOverFavoriteMovieId(null);
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragOverFavoriteMovieId(item.movieId);
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          handleFavoriteDrop(item.movieId);
                        }}
                      >
                        {posterSrc ? (
                          <S.FavoriteMoviePosterImg
                            src={posterSrc}
                            alt={`${item.movie?.title || item.movieId} 포스터`}
                            loading="lazy"
                          />
                        ) : (
                          <S.FavoriteMoviePosterFallback>🎬</S.FavoriteMoviePosterFallback>
                        )}
                        <S.FavoriteMoviePosterOverlay>
                          <strong>{item.movie?.title}</strong>
                          <span>상세 보기</span>
                        </S.FavoriteMoviePosterOverlay>
                      </S.FavoriteMoviePosterButton>
                    );
                  })}
                </S.FavoriteMoviesGrid>

                <S.FavoriteMoviesFooter>
                  <S.FavoriteMoviesCount>
                    {favoriteMovies.length} / {favoriteMovieMaxCount} 편 등록됨
                  </S.FavoriteMoviesCount>
                </S.FavoriteMoviesFooter>
              </S.PreferencesCard>
            </S.PreferencesSection>
          )}
        </S.Content>
      </S.Inner>

      {/*
        2026-04-23 PR-3: 모달 열림/닫힘은 URL ?modal=editProfile / ?modal=favoriteMovies 에서
        전적으로 관리된다. 로컬 setIsXxxOpen 호출은 모두 제거 — close 는 URL 쿼리 제거로 통일.
      */}
      {isEditModalOpen && (
        <EditProfileModal
          profile={profile}
          onClose={closeEditModal}
          onSaved={handleProfileSaved}
        />
      )}

      {isFavoriteMovieModalOpen && (
        <FavoriteMovieModal
          initialMovies={favoriteMovies.map((item) => ({
            ...item.movie,
            movieId: item.movieId,
          }))}
          onClose={closeFavoriteMovieModal}
          onSave={handleFavoriteMoviesSaved}
        />
      )}
    </S.Wrapper>
  );
}
