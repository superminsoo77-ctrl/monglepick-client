/**
 * 마이페이지 컴포넌트.
 *
 * 로그인한 사용자의 개인 정보를 관리하는 페이지.
 * 탭으로 구분된 다음 섹션을 포함한다:
 * - 프로필: 사용자 기본 정보 (닉네임, 이메일)
 * - 시청 이력: 시청한 영화 목록
 * - 위시리스트: 찜한 영화 목록
 * - 선호 설정: 선호 장르/분위기 설정
 *
 * 비인증 상태에서 접근 시 로그인 페이지로 리다이렉트한다.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
/* 인증 Context 훅 — app/providers에서 가져옴 */
import { useAuth } from '../../../app/providers/AuthProvider';
/* 마이페이지 API — 같은 feature 내의 userApi에서 가져옴 */
import { getProfile, getWatchHistory, getWishlist } from '../api/userApi';
/* 라우트 경로 상수 — shared/constants에서 가져옴 */
import { ROUTES } from '../../../shared/constants/routes';
/* 영화 목록 컴포넌트 — features/movie에서 가져옴 */
import MovieList from '../../movie/components/MovieList';
/* 로딩 스피너 — shared/components에서 가져옴 */
import Loading from '../../../shared/components/Loading/Loading';
import './MyPage.css';

/** 탭 정의 */
const TABS = [
  { id: 'profile', label: '프로필' },
  { id: 'history', label: '시청 이력' },
  { id: 'wishlist', label: '위시리스트' },
  { id: 'preferences', label: '선호 설정' },
];

export default function MyPagePage() {
  // 현재 활성 탭
  const [activeTab, setActiveTab] = useState('profile');
  // 프로필 정보
  const [profile, setProfile] = useState(null);
  // 시청 이력
  const [watchHistory, setWatchHistory] = useState([]);
  // 위시리스트
  const [wishlist, setWishlist] = useState([]);
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);

  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  /**
   * 인증 상태 확인 — 비인증 시 로그인 페이지로 리다이렉트.
   */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(ROUTES.LOGIN);
    }
  }, [isAuthenticated, authLoading, navigate]);

  /**
   * 탭 전환 시 해당 데이터를 로드한다.
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadTabData() {
      setIsLoading(true);
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
      } catch {
        // API 미구현 시 기본값 유지
      } finally {
        setIsLoading(false);
      }
    }

    loadTabData();
  }, [activeTab, isAuthenticated]);

  // 인증 로딩 중
  if (authLoading) {
    return <Loading message="인증 확인 중..." fullPage />;
  }

  return (
    <div className="mypage">
      <div className="mypage__inner">
        {/* 페이지 헤더 — 사용자 기본 정보 */}
        <div className="mypage__header">
          <div className="mypage__avatar">
            {user?.nickname?.charAt(0) || 'U'}
          </div>
          <div className="mypage__user-info">
            <h1 className="mypage__nickname">{user?.nickname || '사용자'}</h1>
            <p className="mypage__email">{user?.email || ''}</p>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mypage__tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`mypage__tab ${activeTab === tab.id ? 'mypage__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="mypage__content">
          {/* 프로필 탭 */}
          {activeTab === 'profile' && (
            <div className="mypage__profile">
              {isLoading ? (
                <Loading message="프로필 로딩 중..." />
              ) : (
                <div className="mypage__profile-card">
                  <div className="mypage__profile-field">
                    <span className="mypage__profile-label">닉네임</span>
                    <span className="mypage__profile-value">
                      {profile?.nickname || user?.nickname || '-'}
                    </span>
                  </div>
                  <div className="mypage__profile-field">
                    <span className="mypage__profile-label">이메일</span>
                    <span className="mypage__profile-value">
                      {profile?.email || user?.email || '-'}
                    </span>
                  </div>
                  <div className="mypage__profile-field">
                    <span className="mypage__profile-label">가입일</span>
                    <span className="mypage__profile-value">
                      {profile?.createdAt || '-'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 시청 이력 탭 */}
          {activeTab === 'history' && (
            <div className="mypage__history">
              <MovieList
                movies={watchHistory.map((item) => item.movie || item)}
                loading={isLoading}
                title="시청한 영화"
              />
            </div>
          )}

          {/* 위시리스트 탭 */}
          {activeTab === 'wishlist' && (
            <div className="mypage__wishlist">
              <MovieList
                movies={wishlist.map((item) => item.movie || item)}
                loading={isLoading}
                title="찜한 영화"
              />
            </div>
          )}

          {/* 선호 설정 탭 */}
          {activeTab === 'preferences' && (
            <div className="mypage__preferences">
              <div className="mypage__preferences-card">
                <h3 className="mypage__preferences-title">선호 장르</h3>
                <p className="mypage__preferences-hint">
                  좋아하는 장르를 선택하면 더 정확한 추천을 받을 수 있습니다.
                </p>
                <div className="mypage__preferences-tags">
                  {['액션', '코미디', '드라마', '로맨스', 'SF', '스릴러', '공포', '애니메이션', '판타지', '범죄', '다큐멘터리', '가족'].map(
                    (genre) => (
                      <button key={genre} className="mypage__preferences-tag">
                        {genre}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
