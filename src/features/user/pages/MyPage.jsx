import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../shared/stores/useAuthStore';
import { getProfile, getWatchHistory, getWishlist, updateProfile } from '../api/userApi';
import { ROUTES } from '../../../shared/constants/routes';
import MovieList from '../../../shared/components/MovieList/MovieList';
import Loading from '../../../shared/components/Loading/Loading';
import EmptyState from '../../../shared/components/EmptyState/EmptyState';
import * as S from './MyPage.styled';

const TABS = [
  { id: 'profile', label: '프로필' },
  { id: 'history', label: '시청 이력' },
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
  const [watchHistory, setWatchHistory] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const authLoading = useAuthStore((s) => s.isLoading);
  const navigate = useNavigate();

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
          case 'history': {
            const historyData = await getWatchHistory();
            setWatchHistory(historyData?.watchHistory || []);
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
  }, [activeTab, isAuthenticated]);

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
            <S.Avatar>
              {user?.nickname?.charAt(0) || 'U'}
            </S.Avatar>
          </S.AvatarWrap>
          <S.UserInfo>
            <S.NameRow>
              <S.Nickname>{user?.nickname || '사용자'}</S.Nickname>
              <S.GradeBadge>{profile?.grade || user?.grade || 'BRONZE'}</S.GradeBadge>
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

          {/* 시청 이력 탭 */}
          {activeTab === 'history' && (
            <div>
              {!isLoading && watchHistory.length === 0 ? (
                <EmptyState
                  icon="🎬"
                  title="시청 이력이 없습니다"
                  description="영화를 시청하면 여기에 기록됩니다"
                  actionLabel="영화 검색하기"
                  onAction={() => navigate(ROUTES.SEARCH)}
                />
              ) : (
                <MovieList
                  movies={watchHistory.map((item) => item.movie || item)}
                  loading={isLoading}
                  title="시청한 영화"
                />
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
