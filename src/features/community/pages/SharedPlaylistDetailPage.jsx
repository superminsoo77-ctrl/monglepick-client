/**
 * 커뮤니티 공유 플레이리스트 상세 페이지 (읽기 전용).
 *
 * /community/playlist/:playlistId 로 접근.
 * 퍼가기(내 플레이리스트로 복사) 버튼만 제공한다.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { getPlaylistDetail } from '../../playlist/api/playlistApi';
import { importPlaylist } from '../../playlist/api/playlistApi';
import { useModal } from '../../../shared/components/Modal';
import useAuthStore from '../../../shared/stores/useAuthStore';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w200';

/* ── 스타일 ── */
const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 32px 32px;
`;

const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 0;
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  cursor: pointer;
  margin-bottom: 16px;

  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
`;

const TitleWrap = styled.div``;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 6px;
`;

const Desc = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

const Meta = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 8px;
`;

const ImportBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: none;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: opacity ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const MovieGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 16px;
`;

const MovieItem = styled.div`
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
  }
`;

const MoviePoster = styled.img`
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
  display: block;
`;

const MoviePosterPlaceholder = styled.div`
  width: 100%;
  aspect-ratio: 2/3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.bgElevated};
`;

const MovieTitle = styled.div`
  padding: 8px;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 64px 20px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

const SkeletonBlock = styled.div`
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.bgSecondary};
  height: ${({ $h }) => $h || '200px'};
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

/* ── 컴포넌트 ── */
export default function SharedPlaylistDetailPage() {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useModal();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await getPlaylistDetail(playlistId);
        setDetail(data);
      } catch {
        showAlert({ title: '오류', message: '플레이리스트를 불러올 수 없습니다.', type: 'error' });
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [playlistId, navigate, showAlert]);

  const handleImport = async () => {
    if (!isAuthenticated) {
      await showAlert({ title: '로그인 필요', message: '로그인 후 가져올 수 있어요.', type: 'info' });
      return;
    }
    setIsImporting(true);
    try {
      await importPlaylist(playlistId);
      await showAlert({ title: '완료', message: '내 플레이리스트에 추가됐어요!', type: 'success' });
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err.message || '가져오기에 실패했습니다.';
      await showAlert({ title: '오류', message: msg, type: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Container>
      <BackLink onClick={() => navigate(-1)}>← 돌아가기</BackLink>

      {isLoading && (
        <>
          <SkeletonBlock $h="80px" style={{ marginBottom: 16 }} />
          <SkeletonBlock $h="300px" />
        </>
      )}

      {!isLoading && detail && (
        <>
          <Header>
            <TitleWrap>
              <PageTitle>{detail.playlistName}</PageTitle>
              {detail.description && <Desc>{detail.description}</Desc>}
              <Meta>{(detail.items || []).length}편</Meta>
            </TitleWrap>
            <ImportBtn onClick={handleImport} disabled={isImporting}>
              {isImporting ? '가져오는 중...' : '📥 내 플레이리스트에 퍼가기'}
            </ImportBtn>
          </Header>

          {(detail.items || []).length > 0 ? (
            <MovieGrid>
              {detail.items.map((movie) => {
                const poster = movie.posterPath ? `${TMDB_IMG}${movie.posterPath}` : null;
                return (
                  <MovieItem key={movie.movieId}>
                    {poster
                      ? <MoviePoster src={poster} alt={movie.title} loading="lazy" />
                      : <MoviePosterPlaceholder>🎬</MoviePosterPlaceholder>
                    }
                    <MovieTitle>{movie.title || '제목 없음'}</MovieTitle>
                  </MovieItem>
                );
              })}
            </MovieGrid>
          ) : (
            <EmptyState>이 플레이리스트에는 아직 영화가 없어요.</EmptyState>
          )}
        </>
      )}
    </Container>
  );
}
