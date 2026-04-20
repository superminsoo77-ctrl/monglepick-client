import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../shared/stores/useAuthStore';
import {
  getProfile,
  getWishlist,
  getMyReviews,
  getMyPosts,
  updateProfile,
} from '../api/userApi';
/* 착용 아이템 API — 2026-04-14 신설 (C 방향). 프로필 상단에 아바타·배지 표시용. */
import { getEquippedItems } from '../../point/api/userItemApi';
import { ROUTES, buildPath } from '../../../shared/constants/routes';
import { getGradeLabel } from '../../../shared/constants/grade';
import MovieList from '../../../shared/components/MovieList/MovieList';
import Loading from '../../../shared/components/Loading/Loading';
import EmptyState from '../../../shared/components/EmptyState/EmptyState';
import ReviewList from '../../review/components/ReviewList';
import * as S from './MyPage.styled';

const REVIEW_PAGE_SIZE = 20;
const PAGE_GROUP_SIZE = 10;

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

  return (
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
}

/* ── 마이페이지 ── */
export default function MyPagePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [wishlist, setWishlist] = useState([]);
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
  const navigate = useNavigate();

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

  /* 마운트 시 착용 아이템 로드 — 탭 전환과 무관하게 항상 헤더에 반영 */
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
  }, [activeTab, isAuthenticated, loadMyReviews, reviewPage, myPostsPage]);

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
    setIsEditModalOpen(false);
  }

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
            <S.EditBtn onClick={() => setIsEditModalOpen(true)}>
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
            <div>
              <S.PreferencesCard>
                <S.PreferencesTitle>선호 장르</S.PreferencesTitle>
                <S.PreferencesHint>
                  좋아하는 장르를 선택하면 더 정확한 추천을 받을 수 있습니다.
                  <br />
                  <span style={{ fontSize: '0.85em' }}>이 기능은 준비 중입니다.</span>
                </S.PreferencesHint>
                <S.PreferencesTags>
                  {['액션', '코미디', '드라마', '로맨스', 'SF', '스릴러', '공포', '애니메이션', '판타지', '범죄', '다큐멘터리', '가족'].map(
                    (genre) => (
                      <S.PreferencesTag key={genre} disabled title="준비 중">
                        {genre}
                      </S.PreferencesTag>
                    ),
                  )}
                </S.PreferencesTags>
              </S.PreferencesCard>
            </div>
          )}
        </S.Content>
      </S.Inner>

      {/* 프로필 수정 모달 */}
      {isEditModalOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setIsEditModalOpen(false)}
          onSaved={handleProfileSaved}
        />
      )}
    </S.Wrapper>
  );
}
