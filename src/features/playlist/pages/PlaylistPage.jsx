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

import { useState, useEffect, useCallback } from 'react';
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
} from '../api/playlistApi';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setShowForm(true);
  };

  /** 수정 폼 열기 */
  const openEditForm = (playlist, e) => {
    e.stopPropagation();
    setEditTarget(playlist);
    setFormTitle(playlist.title || '');
    setFormDesc(playlist.description || '');
    setShowForm(true);
  };

  /** 폼 제출 */
  const handleFormSubmit = async () => {
    if (!formTitle.trim()) return;
    setIsSubmitting(true);
    try {
      if (editTarget) {
        await updatePlaylist(editTarget.id, { title: formTitle.trim(), description: formDesc.trim() });
      } else {
        await createPlaylist({ title: formTitle.trim(), description: formDesc.trim() });
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
      message: `'${playlist.title}'을(를) 삭제할까요?`,
      type: 'confirm',
      confirmLabel: '삭제',
    });
    if (!confirmed) return;

    try {
      await deletePlaylist(playlist.id);
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
      await removeMovieFromPlaylist(detail.id, movieId);
      /* 로컬 상태에서 즉시 제거 */
      setDetail((prev) => ({
        ...prev,
        movies: (prev.movies || []).filter((m) => (m.movieId || m.id) !== movieId),
      }));
    } catch {
      showAlert({ title: '오류', message: '영화 제거에 실패했습니다.', type: 'error' });
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
                <S.PageTitle>{detail.title}</S.PageTitle>
                {detail.description && (
                  <S.CardDesc style={{ marginTop: 4 }}>{detail.description}</S.CardDesc>
                )}
              </div>
              <S.CardMeta>{(detail.movies || []).length}편</S.CardMeta>
            </S.Header>

            {(detail.movies || []).length > 0 ? (
              <S.MovieList>
                {detail.movies.map((movie) => {
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
            ) : (
              <S.EmptyState>
                <S.EmptyIcon>&#x1F4CB;</S.EmptyIcon>
                <S.EmptyText>
                  이 플레이리스트에 아직 영화가 없어요.
                  <br />
                  영화 상세 페이지에서 추가해 보세요!
                </S.EmptyText>
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
            <S.Card key={pl.id} onClick={() => navigate(buildPath(ROUTES.PLAYLIST_DETAIL, { id: pl.id }))}>
              <S.CardTitle>{pl.title}</S.CardTitle>
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
      {showForm && (
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
        </S.FormOverlay>
      )}
    </S.Container>
  );
}
