/**
 * 플레이리스트 페이지.
 *
 * 사용자의 영화 플레이리스트를 관리한다.
 * - 목록 보기: 플레이리스트 카드 그리드
 * - 생성/수정: 인라인 모달 폼
 * - 상세 보기: 플레이리스트 내 영화 목록 + 영화 제거
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
import { searchMovies } from '../../movie/api/movieApi';
import { sharePlaylist } from '../../community/api/communityApi';
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

  /* ── 폼 모달 상태 ── */
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIsPublic, setFormIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ── 영화 추가 모달 상태 ── */
  const [showAddMovie, setShowAddMovie] = useState(false);
  const [movieQuery, setMovieQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef(null);

  /* ── 커뮤니티 공유 모달 상태 ── */
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTitle, setShareTitle] = useState('');
  const [shareContent, setShareContent] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  /**
   * 목록 로드.
   */
  const loadPlaylists = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPlaylists({ page: 0, size: 50 });
      setPlaylists(data?.content || data || []);
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
    } catch {
      showAlert({ title: '오류', message: '플레이리스트를 불러올 수 없습니다.', type: 'error' });
      navigate(ROUTES.PLAYLIST, { replace: true });
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

  /* ── 생성/수정 폼 핸들러 ── */

  /** 생성 폼 열기 */
  const openCreateForm = () => {
    setEditTarget(null);
    setFormTitle('');
    setFormDesc('');
    setFormIsPublic(false);
    setShowForm(true);
  };

  /** 수정 폼 열기 */
  const openEditForm = (playlist, e) => {
    e.stopPropagation();
    setEditTarget(playlist);
    setFormTitle(playlist.playlistName || '');
    setFormDesc(playlist.description || '');
    setFormIsPublic(playlist.isPublic ?? false);
    setShowForm(true);
  };

  /** 폼 제출 */
  const handleFormSubmit = async () => {
    if (!formTitle.trim()) return;
    setIsSubmitting(true);
    try {
      if (editTarget) {
        await updatePlaylist(editTarget.playlistId, { title: formTitle.trim(), description: formDesc.trim(), isPublic: formIsPublic });
      } else {
        await createPlaylist({ title: formTitle.trim(), description: formDesc.trim(), isPublic: formIsPublic });
      }
      setShowForm(false);
      loadPlaylists();
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
      /* 로컬 상태에서 즉시 제거 */
      setDetail((prev) => ({
        ...prev,
        items: (prev.items || []).filter((m) => m.movieId !== movieId),
      }));
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
        const res = await searchMovies({ query: q.trim(), size: 12 });
        setSearchResults(res.movies || []);
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
    } catch (err) {
      showAlert({ title: '오류', message: err.message || '영화 추가에 실패했습니다.', type: 'error' });
    }
  };

  /** 커뮤니티 공유 모달 열기 */
  const openShareModal = () => {
    if (!detail) return;
    if (!detail.isPublic) {
      showAlert({
        title: '공개 설정 필요',
        message: '비공개 플레이리스트는 공유할 수 없어요.\n플레이리스트를 공개로 설정한 후 공유해 주세요.',
        type: 'info',
      });
      return;
    }
    setShareTitle(detail.playlistName || '');
    setShareContent('');
    setShowShareModal(true);
  };

  /** 커뮤니티 공유 제출 */
  const handleShareSubmit = async () => {
    if (!shareTitle.trim() || !detail) return;
    setIsSharing(true);
    try {
      await sharePlaylist({
        title: shareTitle.trim(),
        content: shareContent.trim(),
        playlistId: detail.playlistId,
      });
      setShowShareModal(false);
      showAlert({ title: '공유 완료', message: '커뮤니티에 플레이리스트가 공유됐어요!', type: 'success' });
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err.message || '공유에 실패했습니다.';
      showAlert({ title: '오류', message: msg, type: 'error' });
    } finally {
      setIsSharing(false);
    }
  };

  /* ── 상세 뷰 ── */
  if (detailId) {
    return (
      <S.Container>
        <S.BackLink onClick={() => navigate(ROUTES.PLAYLIST)}>
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
              <S.CardMeta>{(detail.items || []).length}편</S.CardMeta>
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
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 24 }}>
                  <S.SmallBtn onClick={openShareModal}>공유하기</S.SmallBtn>
                  <S.CreateBtn onClick={() => setShowAddMovie(true)}>+ 영화 추가</S.CreateBtn>
                </div>
              </>
            ) : (
              <S.EmptyState>
                <S.EmptyIcon>&#x1F4CB;</S.EmptyIcon>
                <S.EmptyText>
                  이 플레이리스트에 아직 영화가 없어요.
                </S.EmptyText>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <S.SmallBtn onClick={openShareModal}>공유하기</S.SmallBtn>
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

        {/* 커뮤니티 공유 모달 */}
        {showShareModal && createPortal(
          <S.FormOverlay onClick={() => setShowShareModal(false)}>
            <S.FormPanel onClick={(e) => e.stopPropagation()}>
              <S.FormTitle>커뮤니티에 공유</S.FormTitle>
              <S.FormInput
                placeholder="게시글 제목을 입력하세요"
                value={shareTitle}
                onChange={(e) => setShareTitle(e.target.value)}
                maxLength={100}
                autoFocus
              />
              <S.FormTextarea
                placeholder="이 플레이리스트에 대해 한마디 남겨보세요 (필수)"
                value={shareContent}
                onChange={(e) => setShareContent(e.target.value)}
                maxLength={500}
              />
              <S.FormButtons>
                <S.FormBtn $variant="cancel" onClick={() => setShowShareModal(false)}>취소</S.FormBtn>
                <S.FormBtn
                  disabled={!shareTitle.trim() || !shareContent.trim() || isSharing}
                  onClick={handleShareSubmit}
                >
                  {isSharing ? '공유 중...' : '공유하기'}
                </S.FormBtn>
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
            <S.Card key={pl.playlistId} onClick={() => navigate(buildPath(ROUTES.PLAYLIST_DETAIL, { id: pl.playlistId }))}>
              <S.CardTitle>{pl.playlistName}</S.CardTitle>
              {pl.description && <S.CardDesc>{pl.description}</S.CardDesc>}
              <S.CardMeta>
                <span>{pl.movieCount ?? 0}편</span>
                <S.CardActions>
                  <S.SmallBtn onClick={(e) => openEditForm(pl, e)}>수정</S.SmallBtn>
                  <S.SmallBtn className="danger" onClick={(e) => handleDelete(pl, e)}>삭제</S.SmallBtn>
                </S.CardActions>
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
          <S.FormPanel onClick={(e) => e.stopPropagation()}>
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
            <S.ToggleRow>
              <S.ToggleLabel>
                {formIsPublic ? '🌐 공개 — 다른 사람들이 볼 수 있어요' : '🔒 비공개 — 나만 볼 수 있어요'}
              </S.ToggleLabel>
              <S.ToggleSwitch
                $on={formIsPublic}
                onClick={() => setFormIsPublic((v) => !v)}
                type="button"
              />
            </S.ToggleRow>
            <S.FormButtons>
              <S.FormBtn $variant="cancel" onClick={() => setShowForm(false)}>
                취소
              </S.FormBtn>
              <S.FormBtn
                onClick={handleFormSubmit}
                disabled={!formTitle.trim() || isSubmitting}
              >
                {isSubmitting ? '저장 중...' : editTarget ? '수정' : '생성'}
              </S.FormBtn>
            </S.FormButtons>
          </S.FormPanel>
        </S.FormOverlay>,
        document.body
      )}
    </S.Container>
  );
}
