/**
 * 커뮤니티 페이지 컴포넌트.
 *
 * 게시글과 리뷰를 탭으로 전환하여 표시한다.
 * - 게시글 탭: PostList + PostForm (새 글 작성)
 * - 리뷰 탭: ReviewList (최신 리뷰)
 *
 * 인증된 사용자는 새 게시글을 작성할 수 있다.
 */

import { useState, useEffect } from 'react';
/* 커뮤니티 API — 같은 feature 내의 communityApi에서 가져옴 */
import { getPosts, createPost } from '../api/communityApi';
/* 인증 Context 훅 — app/providers에서 가져옴 */
import { useAuth } from '../../../app/providers/AuthProvider';
/* 게시글 목록/작성 컴포넌트 — 같은 feature 내의 components에서 가져옴 */
import PostList from '../components/PostList';
import PostForm from '../components/PostForm';
import './CommunityPage.css';

/** 탭 정의 */
const TABS = [
  { id: 'posts', label: '게시글' },
  { id: 'reviews', label: '리뷰' },
];

export default function CommunityPage() {
  // 현재 활성 탭
  const [activeTab, setActiveTab] = useState('posts');
  // 게시글 목록
  const [posts, setPosts] = useState([]);
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);
  // 글 작성 폼 표시 여부
  const [showForm, setShowForm] = useState(false);
  // 글 작성 중 상태
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isAuthenticated } = useAuth();

  /**
   * 게시글 목록을 로드한다.
   */
  useEffect(() => {
    async function loadPosts() {
      setIsLoading(true);
      try {
        const result = await getPosts({ page: 1, size: 20 });
        setPosts(result?.posts || []);
      } catch {
        // API 미구현 시 빈 배열
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (activeTab === 'posts') {
      loadPosts();
    }
  }, [activeTab]);

  /**
   * 게시글 작성 제출 핸들러.
   *
   * @param {Object} postData - 게시글 데이터 ({ title, content, category })
   */
  const handleCreatePost = async (postData) => {
    setIsSubmitting(true);
    try {
      const newPost = await createPost(postData);
      // 새 게시글을 목록 맨 앞에 추가
      setPosts((prev) => [newPost, ...prev]);
      setShowForm(false);
    } catch (err) {
      alert(err.message || '게시글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="community-page">
      <div className="community-page__inner">
        {/* 페이지 헤더 */}
        <div className="community-page__header">
          <h1 className="community-page__title">커뮤니티</h1>
          <p className="community-page__desc">영화에 대한 이야기를 나눠보세요</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="community-page__tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`community-page__tab ${activeTab === tab.id ? 'community-page__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="community-page__content">
          {activeTab === 'posts' && (
            <>
              {/* 새 글 작성 버튼 (인증된 사용자만) */}
              {isAuthenticated && !showForm && (
                <button
                  className="community-page__write-btn"
                  onClick={() => setShowForm(true)}
                >
                  + 새 글 작성
                </button>
              )}

              {/* 글 작성 폼 */}
              {showForm && (
                <PostForm
                  onSubmit={handleCreatePost}
                  isSubmitting={isSubmitting}
                  onCancel={() => setShowForm(false)}
                />
              )}

              {/* 게시글 목록 */}
              <PostList posts={posts} loading={isLoading} />
            </>
          )}

          {activeTab === 'reviews' && (
            <div className="community-page__reviews-placeholder">
              <p className="community-page__placeholder-text">
                영화 상세 페이지에서 리뷰를 작성할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
