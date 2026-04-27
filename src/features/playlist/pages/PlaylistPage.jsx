/**
 * 플레이리스트 페이지.
 *
 * 사용자의 영화 플레이리스트를 관리한다.
 * - 목록 보기: 플레이리스트 카드 그리드
 * - 생성/수정: 인라인 모달 폼
 * - 상세 보기: 플레이리스트 내 영화 목록 + 공개/비공개 토글
 *
 * 공개 전환 시 커뮤니티에 자동 게시, 비공개 전환 시 자동 삭제.
 *
 * @module features/playlist/pages/PlaylistPage
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { useModal } from '../../../shared/components/Modal';
import { ROUTES, buildPath } from '../../../shared/constants/routes';
import {
  getPlaylists,
  getPlaylistDetail,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  removeMovieFromPlaylist,
  addMovieToPlaylist,
} from '../api/playlistApi';
import { searchMoviesByKeyword } from '../../movie/api/movieApi';
import { sharePlaylist, deletePlaylistPost } from '../../community/api/communityApi';
import * as S from './PlaylistPage.styled';

/** TMDB 포스터 URL */
const TMDB_IMG = 'https://image.tmdb.org/t/p/w200';

export default function PlaylistPage() {
  const navigate = useNavigate();
  const { id: detailId } = useParams();
  const { showAlert, showConfirm } = useModal();

  /* ── 목록 상태 ── */
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  /* ── 상세 상태 ── */
  const [detail, setDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  /* 이 플레이리스트의 커뮤니티 게시글 ID (공개 상태일 때).
   * 현재는 setter 만 호출되고 표시에 사용하지 않는다 — 향후 "커뮤니티에서 보기"
   * 버튼 구현 시 value 를 읽어 네비게이션에 사용할 예정. 미사용 lint 회피를 위해
   * 첫 요소를 생략 구조분해로 처리. */
  const [, setSharedPostId] = useState(null);

  /* ── 폼 모달 상태 ── */
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ── 생성 폼 공개 여부 ── */
  const [formIsPublic, setFormIsPublic] = useState(false);

  /* ── 생성 폼 영화 선택 상태 ── */
  const [formMovies, setFormMovies] = useState([]);       // 선택된 영화 배열
  const [formMovieQuery, setFormMovieQuery] = useState('');
  const [formSearchResults, setFormSearchResults] = useState([]);
  const [formIsSearching, setFormIsSearching] = useState(false);
  const formSearchTimerRef = useRef(null);

  /* ── 케밥 메뉴 상태 ── */
  const [openMenuId, setOpenMenuId] = useState(null);


  /* ── 영화 추가 모달 상태 ── */
  const [showAddMovie, setShowAddMovie] = useState(false);
  const [movieQuery, setMovieQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef(null);

  /**
   * 목록 로드.
   */
  const loadPlaylists = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPlaylists({ page: 0, size: 50 });
      const rawList = data?.content || data || [];
      // 백엔드가 snake_case(movie_count)로 반환할 경우도 대응
      setPlaylists(rawList.map((pl) => ({
        ...pl,
        movieCount: pl.movieCount ?? pl.movie_count ?? 0,
      })));
    } catch (err) {
      console.error('[Playlist] 목록 로드 실패:', err.message);
      setPlaylists([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 상세 로드.
   */
  const loadDetail = useCallback(async (playlistId) => {
    setIsDetailLoading(true);
    try {
      const data = await getPlaylistDetail(playlistId);
      setDetail(data);
      setSharedPostId(null);
    } catch {
      showAlert({ title: '오류', message: '플레이리스트를 불러올 수 없습니다.', type: 'error' });
      navigate(ROUTES.ACCOUNT_PLAYLIST, { replace: true });
    } finally {
      setIsDetailLoading(false);
    }
  }, [navigate, showAlert]);

  /* 마운트 시 목록 또는 상세 로드 */
  useEffect(() => {
    if (detailId) {
      loadDetail(detailId);
    } else {
      loadPlaylists();
      setDetail(null);
    }
  }, [detailId, loadPlaylists, loadDetail]);

  /* 케밥 메뉴 외부 클릭 시 닫기 */
  useEffect(() => {
    if (!openMenuId) return;
    const handler = () => setOpenMenuId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openMenuId]);

  /** 공개/비공개 토글 — 공개: 커뮤니티 게시 / 비공개: 커뮤니티 게시글 삭제 */
  const handleToggleShare = async (playlist, e) => {
    e.stopPropagation();
    setOpenMenuId(null);

    if (playlist.isPublic) {
      /* 공개 → 비공개 */
      const confirmed = await showConfirm({
        title: '비공개로 전환',
        message: `'${playlist.playlistName}'을(를) 비공개로 전환할까요?\n커뮤니티 공유도 함께 해제됩니다.`,
        confirmLabel: '비공개로 전환',
      });
      if (!confirmed) return;

      try {
        await updatePlaylist(playlist.playlistId, {
          title: playlist.playlistName,
          description: playlist.description || '',
          isPublic: false,
        });
        /* 커뮤니티 게시글 삭제 (best-effort) */
        try { await deletePlaylistPost(playlist.playlistId); } catch { /* 이미 삭제됐거나 없으면 무시 */ }
        setPlaylists((prev) =>
          prev.map((p) => p.playlistId === playlist.playlistId ? { ...p, isPublic: false } : p)
        );
        showAlert({ title: '완료', message: '비공개로 전환됐어요.', type: 'success' });
      } catch (err) {
        showAlert({ title: '오류', message: err?.message || '전환에 실패했습니다.', type: 'error' });
      }
    } else {
      /* 비공개 → 공개 */
      const confirmed = await showConfirm({
        title: '플레이리스트 공유',
        message: `'${playlist.playlistName}'을(를) 커뮤니티에 공유할까요?`,
        confirmLabel: '공유',
      });
      if (!confirmed) return;

      try {
        await updatePlaylist(playlist.playlistId, {
          title: playlist.playlistName,
          description: playlist.description || '',
          isPublic: true,
        });
        setPlaylists((prev) =>
          prev.map((p) => p.playlistId === playlist.playlistId ? { ...p, isPublic: true } : p)
        );
        try {
          await sharePlaylist({
            title: playlist.playlistName,
            content: `${playlist.playlistName} 플레이리스트를 공유합니다.`,
            playlistId: playlist.playlistId,
          });
        } catch { /* 커뮤니티 게시 실패 — isPublic은 이미 true이므로 롤백 안 함 */ }
        showAlert({ title: '공유 완료', message: '커뮤니티에 공유됐어요!', type: 'success' });
      } catch (err) {
        showAlert({ title: '오류', message: err?.message || '공유에 실패했습니다.', type: 'error' });
      }
    }
  };

  /* ── 생성/수정 폼 핸들러 ── */

  /** 생성 폼 열기 */
  const openCreateForm = () => {
    setEditTarget(null);
    setFormTitle('');
    setFormDesc('');
    setFormIsPublic(false);
    setFormMovies([]);
    setFormMovieQuery('');
    setFormSearchResults([]);
    setShowForm(true);
  };

  /** 생성 폼 영화 검색 (디바운스 300ms) */
  const handleFormMovieQueryChange = (e) => {
    const q = e.target.value;
    setFormMovieQuery(q);
    clearTimeout(formSearchTimerRef.current);
    if (!q.trim()) { setFormSearchResults([]); return; }
    formSearchTimerRef.current = setTimeout(async () => {
      setFormIsSearching(true);
      try {
        const res = await searchMoviesByKeyword(q.trim(), 12);
        setFormSearchResults(res || []);
      } catch { /* ignore */ } finally {
        setFormIsSearching(false);
      }
    }, 300);
  };

  /** 생성 폼에서 영화 선택 토글 */
  const handleFormMovieToggle = (movie) => {
    setFormMovies((prev) => {
      const exists = prev.some((m) => m.id === movie.id);
      return exists ? prev.filter((m) => m.id !== movie.id) : [...prev, movie];
    });
  };

  /** 수정 폼 열기 */
  const openEditForm = (playlist, e) => {
    e.stopPropagation();
    setEditTarget(playlist);
    setFormTitle(playlist.playlistName || '');
    setFormDesc(playlist.description || '');
    setShowForm(true);
  };

  /** 폼 제출 — isPublic은 기존 값 유지 (토글로만 변경) */
  const handleFormSubmit = async () => {
    if (!formTitle.trim()) return;
    setIsSubmitting(true);
    try {
      if (editTarget) {
        await updatePlaylist(editTarget.playlistId, {
          title: formTitle.trim(),
          description: formDesc.trim(),
          isPublic: editTarget.isPublic ?? false,
        });
        setShowForm(false);
        loadPlaylists();
      } else {
        /* 생성 후 선택한 영화 일괄 추가 → 상세 페이지로 이동 */
        const created = await createPlaylist({ title: formTitle.trim(), description: formDesc.trim(), isPublic: formIsPublic });
        const newId = created?.playlistId ?? created?.id ?? created?.data?.playlistId;
        if (newId && formMovies.length > 0) {
          await Promise.allSettled(
            formMovies.map((m) => addMovieToPlaylist(newId, String(m.id)))
          );
        }
        /* 공개로 생성했다면 커뮤니티에도 게시 (best-effort) */
        if (newId && formIsPublic) {
          try {
            await sharePlaylist({ title: formTitle.trim(), content: `${formTitle.trim()} 플레이리스트를 공유합니다.`, playlistId: newId });
          } catch { /* 커뮤니티 게시 실패는 무시 */ }
        }
        setShowForm(false);
        if (newId) {
          navigate(buildPath(ROUTES.ACCOUNT_PLAYLIST_DETAIL, { id: newId }));
        } else {
          loadPlaylists();
        }
      }
    } catch (err) {
      showAlert({ title: '오류', message: err.message || '저장에 실패했습니다.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /** 삭제 핸들러 */
  const handleDelete = async (playlist, e) => {
    e.stopPropagation();
    const confirmed = await showConfirm({
      title: '플레이리스트 삭제',
      message: `'${playlist.playlistName}'을(를) 삭제할까요?`,
      type: 'confirm',
      confirmLabel: '삭제',
    });
    if (!confirmed) return;

    try {
      await deletePlaylist(playlist.playlistId);
      loadPlaylists();
    } catch {
      showAlert({ title: '오류', message: '삭제에 실패했습니다.', type: 'error' });
    }
  };

  /** 영화 제거 핸들러 (상세 뷰) */
  const handleRemoveMovie = async (movieId) => {
    if (!detail) return;
    const confirmed = await showConfirm({
      title: '영화 제거',
      message: '이 영화를 플레이리스트에서 제거할까요?',
      type: 'confirm',
      confirmLabel: '제거',
    });
    if (!confirmed) return;

    try {
      await removeMovieFromPlaylist(detail.playlistId, movieId);
      setDetail((prev) => ({
        ...prev,
        items: (prev.items || []).filter((m) => m.movieId !== movieId),
      }));
      setPlaylists((prev) => prev.map((pl) =>
        pl.playlistId === detail.playlistId
          ? { ...pl, movieCount: Math.max(0, (pl.movieCount || 0) - 1) }
          : pl,
      ));
    } catch {
      showAlert({ title: '오류', message: '영화 제거에 실패했습니다.', type: 'error' });
    }
  };

  /** 영화 검색 (디바운스 300ms) */
  const handleMovieQueryChange = (e) => {
    const q = e.target.value;
    setMovieQuery(q);
    clearTimeout(searchTimerRef.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchMoviesByKeyword(q.trim(), 12);
        setSearchResults(res || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  /** 영화 추가 모달 닫기 */
  const closeAddMovie = () => {
    setShowAddMovie(false);
    setMovieQuery('');
    setSearchResults([]);
  };

  /** 플레이리스트에 영화 추가 */
  const handleAddMovie = async (movie) => {
    if (!detail) return;
    const alreadyAdded = (detail.items || []).some((m) => m.movieId === String(movie.id));
    if (alreadyAdded) return;
    try {
      await addMovieToPlaylist(detail.playlistId, String(movie.id));
      setDetail((prev) => ({
        ...prev,
        items: [...(prev.items || []), { movieId: String(movie.id), title: movie.title, posterPath: movie.posterUrl }],
      }));
      setPlaylists((prev) => prev.map((pl) =>
        pl.playlistId === detail.playlistId
          ? { ...pl, movieCount: (pl.movieCount || 0) + 1 }
          : pl,
      ));
    } catch (err) {
      showAlert({ title: '오류', message: err.message || '영화 추가에 실패했습니다.', type: 'error' });
    }
  };

  /* ── 상세 뷰 ── */
  if (detailId) {
    return (
      <S.Container>
        <S.BackLink onClick={() => navigate(ROUTES.ACCOUNT_PLAYLIST)}>
          ← 플레이리스트 목록
        </S.BackLink>

        {isDetailLoading && (
          <>
            <S.SkeletonCard />
            <S.SkeletonCard style={{ marginTop: 12, height: 200 }} />
          </>
        )}

        {!isDetailLoading && detail && (
          <>
            <S.Header>
              <div>
                <S.PageTitle>{detail.playlistName}</S.PageTitle>
                {detail.description && (
                  <S.CardDesc style={{ marginTop: 4 }}>{detail.description}</S.CardDesc>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <S.CardMeta>{(detail.items || []).length}편</S.CardMeta>
                <S.CardMeta style={{ fontSize: 12, opacity: 0.6 }}>
                  {detail.isPublic ? '🌐 공개' : '🔒 비공개'}
                </S.CardMeta>
              </div>
            </S.Header>

            {(detail.items || []).length > 0 ? (
              <>
                <S.MovieList>
                  {detail.items.map((movie) => {
                    const mid = movie.movieId || movie.id;
                    const poster = movie.posterPath ? `${TMDB_IMG}${movie.posterPath}` : null;
                    return (
                      <S.MovieItem key={mid} onClick={() => navigate(buildPath(ROUTES.MOVIE_DETAIL, { id: mid }))}>
                        {poster ? (
                          <S.MoviePoster src={poster} alt={movie.title} loading="lazy" />
                        ) : (
                          <S.MoviePosterPlaceholder>&#x1F3AC;</S.MoviePosterPlaceholder>
                        )}
                        <S.MovieTitle>{movie.title || '제목 없음'}</S.MovieTitle>
                        <S.RemoveMovieBtn
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveMovie(mid);
                          }}
                          title="제거"
                        >
                          ✕
                        </S.RemoveMovieBtn>
                      </S.MovieItem>
                    );
                  })}
                </S.MovieList>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                  <S.CreateBtn onClick={() => setShowAddMovie(true)}>+ 영화 추가</S.CreateBtn>
                </div>
              </>
            ) : (
              <S.EmptyState>
                <S.EmptyIcon>&#x1F4CB;</S.EmptyIcon>
                <S.EmptyText>
                  이 플레이리스트에 아직 영화가 없어요.
                </S.EmptyText>
                <div style={{ marginTop: 16 }}>
                  <S.CreateBtn onClick={() => setShowAddMovie(true)}>+ 영화 추가</S.CreateBtn>
                </div>
              </S.EmptyState>
            )}
          </>
        )}

        {/* 영화 추가 모달 */}
        {showAddMovie && createPortal(
          <S.FormOverlay onClick={closeAddMovie}>
            <S.FormPanel style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
              <S.FormTitle>영화 추가</S.FormTitle>
              <S.FormInput
                placeholder="영화 제목을 검색하세요"
                value={movieQuery}
                onChange={handleMovieQueryChange}
                autoFocus
              />

              {isSearching && <S.SearchHint>검색 중...</S.SearchHint>}

              {!isSearching && movieQuery.trim() && searchResults.length === 0 && (
                <S.SearchHint>검색 결과가 없어요.</S.SearchHint>
              )}

              {!isSearching && searchResults.length > 0 && (
                <S.SearchResultGrid>
                  {searchResults.map((movie) => {
                    const alreadyAdded = (detail?.items || []).some(
                      (m) => m.movieId === String(movie.id)
                    );
                    return (
                      <S.SearchMovieCard
                        key={movie.id}
                        className={alreadyAdded ? 'added' : ''}
                        onClick={() => !alreadyAdded && handleAddMovie(movie)}
                      >
                        {alreadyAdded && <S.AddedBadge>추가됨</S.AddedBadge>}
                        {movie.posterUrl ? (
                          <S.SearchMoviePoster src={movie.posterUrl} alt={movie.title} loading="lazy" />
                        ) : (
                          <S.SearchMoviePlaceholder>&#x1F3AC;</S.SearchMoviePlaceholder>
                        )}
                        <S.SearchMovieTitle>{movie.title}</S.SearchMovieTitle>
                      </S.SearchMovieCard>
                    );
                  })}
                </S.SearchResultGrid>
              )}

              {!movieQuery.trim() && (
                <S.SearchHint>영화 제목을 입력해 검색하세요.</S.SearchHint>
              )}

              <S.FormButtons>
                <S.FormBtn $variant="cancel" onClick={closeAddMovie}>닫기</S.FormBtn>
              </S.FormButtons>
            </S.FormPanel>
          </S.FormOverlay>,
          document.body
        )}
      </S.Container>
    );
  }

  /* ── 목록 뷰 ── */
  return (
    <S.Container>
      <S.Header>
        <S.PageTitle>플레이리스트</S.PageTitle>
        <S.CreateBtn onClick={openCreateForm}>+ 새 플레이리스트</S.CreateBtn>
      </S.Header>

      {/* 로딩 */}
      {isLoading && (
        <S.Grid>
          {[1, 2, 3].map((i) => <S.SkeletonCard key={i} />)}
        </S.Grid>
      )}

      {/* 목록 */}
      {!isLoading && playlists.length > 0 && (
        <S.Grid>
          {playlists.map((pl) => (
            <S.Card
              key={pl.playlistId}
              onClick={() => navigate(buildPath(ROUTES.ACCOUNT_PLAYLIST_DETAIL, { id: pl.playlistId }))}
            >
              {/* 제목 + 케밥 메뉴 */}
              <S.CardHeaderRow>
                <S.CardTitle>{pl.playlistName}</S.CardTitle>
                <S.KebabMenuWrap onClick={(e) => e.stopPropagation()}>
                  <S.KebabBtn
                    title="더 보기"
                    onClick={() =>
                      setOpenMenuId(openMenuId === pl.playlistId ? null : pl.playlistId)
                    }
                  >
                    ⋮
                  </S.KebabBtn>
                  {openMenuId === pl.playlistId && (
                    <S.DropdownMenu>
                      <S.DropdownItem onClick={(e) => openEditForm(pl, e)}>
                        ✏️ 수정
                      </S.DropdownItem>
                      <S.DropdownDivider />
                      <S.DropdownItem onClick={(e) => handleToggleShare(pl, e)}>
                        {pl.isPublic ? '🔒 비공개로 전환' : '🔗 공유'}
                      </S.DropdownItem>
                      <S.DropdownDivider />
                      <S.DropdownItem $danger onClick={(e) => handleDelete(pl, e)}>
                        🗑️ 삭제
                      </S.DropdownItem>
                    </S.DropdownMenu>
                  )}
                </S.KebabMenuWrap>
              </S.CardHeaderRow>

              {pl.description && <S.CardDesc>{pl.description}</S.CardDesc>}
              <S.CardMeta>
                <span>{pl.movieCount ?? 0}편</span>
                <span>{pl.isPublic ? '🌐 공개' : '🔒 비공개'}</span>
              </S.CardMeta>
            </S.Card>
          ))}
        </S.Grid>
      )}

      {/* 빈 상태 */}
      {!isLoading && playlists.length === 0 && (
        <S.EmptyState>
          <S.EmptyIcon>&#x1F3B5;</S.EmptyIcon>
          <S.EmptyText>
            아직 플레이리스트가 없어요.
            <br />
            나만의 영화 리스트를 만들어 보세요!
          </S.EmptyText>
        </S.EmptyState>
      )}

      {/* 생성/수정 폼 모달 */}
      {showForm && createPortal(
        <S.FormOverlay onClick={() => setShowForm(false)}>
          <S.FormPanel $wide={!editTarget} onClick={(e) => e.stopPropagation()}>
            <S.FormTitle>{editTarget ? '플레이리스트 수정' : '새 플레이리스트'}</S.FormTitle>
            <S.FormInput
              placeholder="제목을 입력하세요"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              maxLength={50}
              autoFocus
            />
            <S.FormTextarea
              placeholder="설명 (선택)"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              maxLength={200}
            />

            {/* 생성 모드에서만 공개/비공개 토글 + 영화 추가 섹션 표시 */}
            {!editTarget && (
              <>
                <S.ToggleRow>
                  <S.ToggleLabel>{formIsPublic ? '🌐 공개 — 커뮤니티에 공유됩니다' : '🔒 비공개'}</S.ToggleLabel>
                  <S.ToggleSwitch
                    type="button"
                    $on={formIsPublic}
                    onClick={() => setFormIsPublic((v) => !v)}
                    aria-label="공개/비공개 전환"
                  />
                </S.ToggleRow>

                <S.FormDivider>영화 추가 (선택)</S.FormDivider>

                {/* 선택된 영화 칩 목록 */}
                {formMovies.length > 0 && (
                  <S.FormMovieChipList>
                    {formMovies.map((m) => (
                      <S.FormMovieChip key={m.id}>
                        <S.FormMovieChipTitle>{m.title}</S.FormMovieChipTitle>
                        <S.FormMovieChipRemove
                          type="button"
                          onClick={() => handleFormMovieToggle(m)}
                          title="제거"
                        >
                          ×
                        </S.FormMovieChipRemove>
                      </S.FormMovieChip>
                    ))}
                  </S.FormMovieChipList>
                )}

                {/* 영화 검색 입력 */}
                <S.FormInput
                  placeholder="영화 제목으로 검색"
                  value={formMovieQuery}
                  onChange={handleFormMovieQueryChange}
                />

                {/* 검색 결과 — 리스트형 */}
                {formIsSearching && <S.SearchHint>검색 중...</S.SearchHint>}

                {!formIsSearching && formSearchResults.length > 0 && (
                  <S.FormSearchList>
                    {formSearchResults.map((movie) => {
                      const isSelected = formMovies.some((m) => m.id === movie.id);
                      const year = movie.release_year || movie.releaseYear || movie.year || null;
                      return (
                        <S.FormSearchItem
                          key={movie.id}
                          $selected={isSelected}
                          onClick={() => handleFormMovieToggle(movie)}
                        >
                          {movie.posterUrl ? (
                            <S.FormSearchPoster
                              src={movie.posterUrl}
                              alt={movie.title}
                              loading="lazy"
                            />
                          ) : (
                            <S.FormSearchPosterFallback>&#x1F3AC;</S.FormSearchPosterFallback>
                          )}
                          <S.FormSearchInfo>
                            <S.FormSearchTitle>{movie.title}</S.FormSearchTitle>
                            {year && <S.FormSearchMeta>{year}년</S.FormSearchMeta>}
                          </S.FormSearchInfo>
                          <S.FormSearchBtn
                            type="button"
                            $selected={isSelected}
                            onClick={(e) => { e.stopPropagation(); handleFormMovieToggle(movie); }}
                          >
                            {isSelected ? '✓ 선택됨' : '+ 추가'}
                          </S.FormSearchBtn>
                        </S.FormSearchItem>
                      );
                    })}
                  </S.FormSearchList>
                )}

                {!formIsSearching && formMovieQuery.trim() && formSearchResults.length === 0 && (
                  <S.SearchHint>검색 결과가 없어요.</S.SearchHint>
                )}
                {!formMovieQuery.trim() && (
                  <S.SearchHint>영화 제목을 입력하면 검색됩니다.</S.SearchHint>
                )}
              </>
            )}

            <S.FormButtons>
              <S.FormBtn $variant="cancel" onClick={() => setShowForm(false)}>
                취소
              </S.FormBtn>
              <S.FormBtn
                onClick={handleFormSubmit}
                disabled={!formTitle.trim() || isSubmitting}
              >
                {isSubmitting
                  ? '저장 중...'
                  : editTarget
                  ? '수정'
                  : formMovies.length > 0
                  ? `생성 (${formMovies.length}편 포함)`
                  : '생성'}
              </S.FormBtn>
            </S.FormButtons>
          </S.FormPanel>
        </S.FormOverlay>,
        document.body
      )}

    </S.Container>
  );
}
