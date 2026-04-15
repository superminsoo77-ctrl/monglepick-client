/**
 * 플레이리스트 공유 피드 컴포넌트.
 *
 * 커뮤니티 "플레이리스트 공유" 탭에 표시되는 피드.
 * - 공유된 플레이리스트 카드 목록 (이름, 설명, 영화수, 좋아요수)
 * - 좋아요 토글 (게시글 좋아요)
 * - 가져오기 버튼 (내 플레이리스트로 복사)
 * - 공유하기 버튼 (내 플레이리스트를 커뮤니티에 공유)
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { getSharedPlaylists, sharePlaylist, togglePostLike } from '../api/communityApi';
import { getPlaylists, importPlaylist } from '../../playlist/api/playlistApi';
import useAuthStore from '../../../shared/stores/useAuthStore';
import { useModal } from '../../../shared/components/Modal';
import { buildPath, ROUTES } from '../../../shared/constants/routes';

import { formatRelativeTime } from '../../../shared/utils/formatters';

/* ── 스타일 ── */

/*
 * 카드 그리드.
 * - 데스크톱: minmax(300px, 1fr) 로 자동 다열
 * - 모바일(≤480px): 1열 강제
 *   기존 minmax(300px, 1fr) 는 320~360px 폭 기기에서 카드 최소폭(300px) 이
 *   컨테이너보다 커져 가로 스크롤이 발생하던 버그가 있었다.
 */
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all ${({ theme }) => theme.transitions.base};
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`;

const PlaylistName = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.3;
`;

const Description = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const MetaChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const AuthorRow = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: auto;
`;

const ActionBtn = styled.button`
  flex: 1;
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ $variant, theme }) =>
    $variant === 'like' && $variant !== 'liked'
      ? theme.colors.borderDefault
      : $variant === 'liked'
      ? theme.colors.primary
      : theme.colors.primary};
  background: ${({ $variant, theme }) =>
    $variant === 'liked'
      ? theme.colors.primaryLight
      : $variant === 'import'
      ? theme.colors.primary
      : 'transparent'};
  color: ${({ $variant, theme }) =>
    $variant === 'import' ? '#fff' : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    opacity: 0.85;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LikeBtn = styled(ActionBtn)`
  color: ${({ $liked, theme }) => $liked ? theme.colors.primary : theme.colors.textSecondary};
  border-color: ${({ $liked, theme }) => $liked ? theme.colors.primary : theme.colors.borderDefault};
  background: ${({ $liked, theme }) => $liked ? theme.colors.primaryLight : 'transparent'};
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
`;

const ShareBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: none;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  &:hover { opacity: 0.85; }
`;

const EmptyWrap = styled.div`
  text-align: center;
  padding: 64px 20px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: 1.6;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;

  /*
   * 모바일에서는 overlay padding 을 줄여 패널 가용 너비 확보.
   * (기존 20px → 12px) — 320px 폭 기기에서 모달 좌우 여백이 너무 커서
   * 본문 입력폼이 비좁아 보이던 문제 해소.
   */
  @media (max-width: 480px) {
    padding: 12px;
    /* iOS safe-area 회피 */
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  }
`;

const ModalPanel = styled.div`
  background: ${({ theme }) => theme.colors.bg || theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 28px;
  width: 100%;
  max-width: 480px;
  /* 패널이 화면을 넘기면 내부에서 스크롤되도록 */
  max-height: calc(100vh - 40px);
  max-height: calc(100dvh - 40px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;

  @media (max-width: 480px) {
    padding: 20px;
    border-radius: ${({ theme }) => theme.radius.lg};
  }
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ theme }) => theme.colors.bgSecondary};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textBase};
  font-family: inherit;
  box-sizing: border-box;

  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ theme }) => theme.colors.bgSecondary};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;

  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; }
`;

const SelectBox = styled.select`
  width: 100%;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ theme }) => theme.colors.bgSecondary};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textBase};
  font-family: inherit;

  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; }
`;

const FormLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

const BtnRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const Btn = styled.button`
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: ${({ $cancel }) => $cancel ? `1px solid ${({ theme }) => theme.colors.borderDefault}` : 'none'};
  background: ${({ $cancel, theme }) => $cancel ? 'transparent' : theme.colors.primary};
  color: ${({ $cancel, theme }) => $cancel ? theme.colors.textSecondary : '#fff'};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { opacity: 0.85; }
`;

/* ── 컴포넌트 ── */

export default function PlaylistShareFeed() {
  const { showAlert } = useModal();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const currentUser = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 좋아요 낙관적 업데이트용 상태: { [postId]: { liked, likeCount } }
  const [likeState, setLikeState] = useState({});

  // 가져오기 진행중 postId 집합
  const [importing, setImporting] = useState(new Set());

  // 공유 모달
  const [showShareModal, setShowShareModal] = useState(false);
  const [myPlaylists, setMyPlaylists] = useState([]);
  const [shareForm, setShareForm] = useState({ title: '', content: '', playlistId: '' });
  const [isSharing, setIsSharing] = useState(false);

  const loadFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getSharedPlaylists({ page: 1, size: 30 });
      setPosts(res.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  /** 게시글 좋아요 토글 */
  const handleLike = async (post) => {
    if (!isAuthenticated) {
      await showAlert({ title: '로그인 필요', message: '로그인 후 좋아요를 누를 수 있어요.', type: 'info' });
      return;
    }
    const cur = likeState[post.id] ?? { liked: false, likeCount: post.likeCount ?? 0 };
    // 낙관적 업데이트
    setLikeState((prev) => ({
      ...prev,
      [post.id]: { liked: !cur.liked, likeCount: cur.liked ? cur.likeCount - 1 : cur.likeCount + 1 },
    }));
    try {
      const res = await togglePostLike(post.id);
      if (res) {
        setLikeState((prev) => ({
          ...prev,
          [post.id]: { liked: res.liked, likeCount: res.likeCount },
        }));
      }
    } catch {
      // 롤백
      setLikeState((prev) => ({ ...prev, [post.id]: cur }));
    }
  };

  /** 플레이리스트 가져오기 */
  const handleImport = async (post) => {
    if (!isAuthenticated) {
      await showAlert({ title: '로그인 필요', message: '로그인 후 플레이리스트를 가져올 수 있어요.', type: 'info' });
      return;
    }
    const playlistId = post.playlistInfo?.playlistId ?? post.playlistId;
    if (!playlistId) return;

    setImporting((prev) => new Set([...prev, post.id]));
    try {
      await importPlaylist(playlistId);
      await showAlert({ title: '완료', message: '내 플레이리스트에 추가됐어요!', type: 'success' });
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err.message || '가져오기에 실패했습니다.';
      await showAlert({ title: '오류', message: msg, type: 'error' });
    } finally {
      setImporting((prev) => { const s = new Set(prev); s.delete(post.id); return s; });
    }
  };

  /** 공유 모달 열기 — 내 플레이리스트 로드 */
  const openShareModal = async () => {
    if (!isAuthenticated) {
      await showAlert({ title: '로그인 필요', message: '로그인 후 공유할 수 있어요.', type: 'info' });
      return;
    }
    try {
      const res = await getPlaylists({ page: 0, size: 50 });
      const list = res?.content ?? res ?? [];
      // 공개 플레이리스트만 공유 가능
      const publicOnes = list.filter((pl) => pl.isPublic);
      if (publicOnes.length === 0) {
        await showAlert({
          title: '공개 플레이리스트 없음',
          message: '공유하려면 먼저 내 플레이리스트를 공개로 설정해야 해요.',
          type: 'info',
        });
        return;
      }
      setMyPlaylists(publicOnes);
      setShareForm({ title: '', content: '', playlistId: String(publicOnes[0].playlistId) });
      setShowShareModal(true);
    } catch {
      await showAlert({ title: '오류', message: '플레이리스트를 불러올 수 없습니다.', type: 'error' });
    }
  };

  /** 공유 제출 */
  const handleShareSubmit = async () => {
    if (!shareForm.title.trim() || !shareForm.playlistId) return;
    setIsSharing(true);
    try {
      await sharePlaylist({
        title: shareForm.title.trim(),
        content: shareForm.content.trim() || ' ',
        playlistId: Number(shareForm.playlistId),
      });
      setShowShareModal(false);
      await loadFeed();
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err.message || '공유에 실패했습니다.';
      await showAlert({ title: '오류', message: msg, type: 'error' });
    } finally {
      setIsSharing(false);
    }
  };

  if (isLoading) {
    return <EmptyWrap>불러오는 중...</EmptyWrap>;
  }

  return (
    <>
      <TopBar>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          다른 사용자들의 플레이리스트를 둘러보세요
        </span>
        <ShareBtn onClick={openShareModal}>+ 내 플레이리스트 공유</ShareBtn>
      </TopBar>

      {posts.length === 0 ? (
        <EmptyWrap>
          아직 공유된 플레이리스트가 없어요.<br />
          첫 번째로 공유해보세요!
        </EmptyWrap>
      ) : (
        <Grid>
          {posts.map((post) => {
            const info = post.playlistInfo ?? {};
            const like = likeState[post.id] ?? { liked: false, likeCount: post.likeCount ?? 0 };
            const isImporting = importing.has(post.id);

            const playlistId = info.playlistId ?? post.playlistId;
            const isMyPost =
              currentUser != null &&
              String(post.userId ?? post.authorId ?? '') ===
                String(currentUser.id ?? currentUser.userId ?? '');

            return (
              <Card
                key={post.id}
                onClick={() => playlistId && navigate(buildPath(ROUTES.SHARED_PLAYLIST_DETAIL, { playlistId }))}
              >
                <CardHeader>
                  <PlaylistName>{info.playlistName || post.title}</PlaylistName>
                </CardHeader>

                {info.description && <Description>{info.description}</Description>}

                <Meta>
                  <MetaChip>🎬 {info.movieCount ?? 0}편</MetaChip>
                  <MetaChip>❤️ {like.likeCount}</MetaChip>
                </Meta>

                <AuthorRow>
                  {post.author} · {formatRelativeTime(post.createdAt)}
                </AuthorRow>

                <Actions>
                  <LikeBtn
                    $liked={like.liked}
                    onClick={(e) => { e.stopPropagation(); handleLike(post); }}
                  >
                    {like.liked ? '❤️ 좋아요' : '🤍 좋아요'}
                  </LikeBtn>
                  {!isMyPost && (
                    <ActionBtn
                      $variant="import"
                      disabled={isImporting}
                      onClick={(e) => { e.stopPropagation(); handleImport(post); }}
                    >
                      {isImporting ? '가져오는 중...' : '📥 가져오기'}
                    </ActionBtn>
                  )}
                </Actions>
              </Card>
            );
          })}
        </Grid>
      )}

      {/* 공유 모달 */}
      {showShareModal && (
        <ModalOverlay onClick={() => setShowShareModal(false)}>
          <ModalPanel onClick={(e) => e.stopPropagation()}>
            <ModalTitle>플레이리스트 공유</ModalTitle>

            <div>
              <FormLabel>공유할 플레이리스트</FormLabel>
              <SelectBox
                value={shareForm.playlistId}
                onChange={(e) => setShareForm((p) => ({ ...p, playlistId: e.target.value }))}
                style={{ marginTop: 6 }}
              >
                {myPlaylists.map((pl) => (
                  <option key={pl.playlistId} value={String(pl.playlistId)}>
                    {pl.playlistName}
                  </option>
                ))}
              </SelectBox>
            </div>

            <div>
              <FormLabel>제목</FormLabel>
              <FormInput
                style={{ marginTop: 6 }}
                placeholder="게시글 제목을 입력하세요"
                value={shareForm.title}
                onChange={(e) => setShareForm((p) => ({ ...p, title: e.target.value }))}
                maxLength={100}
                autoFocus
              />
            </div>

            <div>
              <FormLabel>한마디 (선택)</FormLabel>
              <FormTextarea
                style={{ marginTop: 6 }}
                placeholder="이 플레이리스트에 대해 한마디 남겨보세요"
                value={shareForm.content}
                onChange={(e) => setShareForm((p) => ({ ...p, content: e.target.value }))}
                maxLength={500}
              />
            </div>

            <BtnRow>
              <Btn $cancel onClick={() => setShowShareModal(false)}>취소</Btn>
              <Btn
                disabled={!shareForm.title.trim() || isSharing}
                onClick={handleShareSubmit}
              >
                {isSharing ? '공유 중...' : '공유하기'}
              </Btn>
            </BtnRow>
          </ModalPanel>
        </ModalOverlay>
      )}
    </>
  );
}
