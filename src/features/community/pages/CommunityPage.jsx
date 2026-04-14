import { useState, useEffect } from 'react';
/**
 * 커뮤니티 페이지 컴포넌트.
 *
 * 게시글/리뷰/오늘의 퀴즈를 탭으로 전환하여 표시한다.
 * - 게시글 탭: PostList + PostForm (새 글 작성)
 * - 리뷰 탭:   안내 메시지 (EmptyState)
 * - 퀴즈 탭:   QuizPage 본문 — 오늘의 퀴즈 카드 목록 + 리워드 (v2 개편으로 헤더에서 이관)
 *
 * 개선 사항:
 * - 탭 활성 시 하단 3px 그라데이션 바
 * - 탭 호버 시 배경색 변화
 * - 게시글 작성 버튼을 본문 내 명확한 라벨 버튼으로 변경 (v2 개편: 우하단 FAB 폐기)
 * - 리뷰 탭에 EmptyState 컴포넌트 적용
 *
 * 인증된 사용자는 새 게시글을 작성할 수 있으며,
 * 비로그인 사용자에게는 "로그인 후 작성 가능" 안내를 노출한다.
 *
 * URL 파라미터:
 *   ?tab=posts|reviews|quiz — 진입 시 활성 탭 지정 (외부 링크/즐겨찾기 호환)
 *   잘못된 값이거나 누락 시 기본값은 'posts'.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useModal } from '../../../shared/components/Modal';
import { useRewardToast } from '../../../shared/components/RewardToast';
import { getPosts, createPost } from '../api/communityApi';
import useAuthStore from '../../../shared/stores/useAuthStore';
import PostList from '../components/PostList';
import PostForm from '../components/PostForm';
import EmptyState from '../../../shared/components/EmptyState/EmptyState';
import QuizPage from '../../quiz/pages/QuizPage';
import PlaylistShareFeed from '../components/PlaylistShareFeed';
import * as S from './CommunityPage.styled';

const TABS = [
  { id: 'posts', label: '영화' },
  { id: 'playlist-share', label: '플레이리스트 공유' },
  { id: 'reviews', label: '실관람인증' },
  { id: 'quiz', label: '오늘의 퀴즈' },
];

const VALID_TAB_IDS = new Set(TABS.map((t) => t.id));

const CATEGORY_FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'FREE', label: '자유' },
  { id: 'DISCUSSION', label: '토론' },
  { id: 'RECOMMENDATION', label: '추천' },
  { id: 'NEWS', label: '뉴스' },
];

export default function CommunityPage() {
  const { showAlert } = useModal();
  const { showReward } = useRewardToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const initialTab = tabFromUrl && VALID_TAB_IDS.has(tabFromUrl) ? tabFromUrl : 'posts';

  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'posts') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab: tabId }, { replace: true });
    }
  };

  useEffect(() => {
    if (tabFromUrl && VALID_TAB_IDS.has(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabFromUrl]);

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState('all');

  // ✅ 검색어 상태 추가
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // ✅ 페이지네이션 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  useEffect(() => {
    async function loadPosts() {
      setIsLoading(true);
      
      try {
        const result = await getPosts({ page: currentPage, size: 5, category, keyword }); // ✅ size: 5
        setPosts(result?.posts || []);
        setTotalPages(result?.totalPages || 1); // ✅ 전체 페이지 수 저장
      } catch (err) {
        console.error('[CommunityPage] 게시글 로드 실패:', err);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
      
  /**
   * 게시글 목록을 로드한다.
   *
   * activeTab 이 'posts' 일 때 또는 카테고리 필터가 변경될 때 재실행된다.
   * 카테고리 변경 시 즉시 재조회로 사용자 의도에 빠르게 반응한다.
   */
  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getPosts({ page: 1, size: 20, category });
      setPosts(result?.posts || []);
    } catch (err) {
      console.error('[CommunityPage] 게시글 로드 실패:', err);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    if (activeTab === 'posts') {
      loadPosts();
      
    }
  }, [activeTab, category, currentPage, keyword]); // ✅ currentPage 추가

  // ✅ 카테고리 변경 시 1페이지로 리셋
  const handleCategoryChange = (id) => {
    setCategory(id);
    setCurrentPage(1);
    setKeyword('');       // ✅ 추가
    setSearchInput('');   // ✅ 추가
  };
  }, [activeTab, loadPosts]);

  const handleSearch = (e) => {
  e.preventDefault();
  setKeyword(searchInput);
  setCurrentPage(1);
  };
  
  const handleCreatePost = async (postData) => {
    setIsSubmitting(true);
    try {
      const newPost = await createPost(postData);
      setPosts((prev) => [newPost, ...prev]);
      setShowForm(false);
      setShowForm(false);
      await loadPosts();
      // 리워드 지급 시 토스트 알림
      if (newPost?.rewardPoints > 0) {
        showReward(newPost.rewardPoints, '게시글 작성');
      }
    } catch (err) {
      await showAlert({
        title: '작성 실패',
        message: err.message || '게시글 작성에 실패했습니다.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <S.PageWrapper>
      <S.PageInner>
        <S.Header>
          <S.Title>커뮤니티</S.Title>
          <S.Desc>영화에 대한 이야기를 나눠보세요</S.Desc>
        </S.Header>

        <S.Tabs>
          {TABS.map((tab) => (
            <S.Tab
              key={tab.id}
              $active={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </S.Tab>
          ))}
        </S.Tabs>

        <S.Content key={activeTab}>
          {activeTab === 'posts' && (
            <>
              {/* 검색창 */}
<S.SearchForm onSubmit={handleSearch}>
  <S.SearchInput
    type="text"
    value={searchInput}
    onChange={(e) => setSearchInput(e.target.value)}
    placeholder="제목 또는 내용으로 검색..."
  />
  <S.SearchBtn type="submit">🔍</S.SearchBtn>
</S.SearchForm>
              <S.CategoryChipRow role="tablist" aria-label="게시글 카테고리 필터">
                {CATEGORY_FILTERS.map((c) => (
                  <S.CategoryChip
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={category === c.id}
                    $active={category === c.id}
                    onClick={() => handleCategoryChange(c.id)} // ✅ 수정
                  >
                    {c.label}
                  </S.CategoryChip>
                ))}
              </S.CategoryChipRow>

              {!showForm && isAuthenticated && (
                <S.WriteButtonRow>
                  <S.WriteButton
                    type="button"
                    onClick={() => setShowForm(true)}
                    aria-label="새 게시글 작성"
                  >
                    <S.WriteIcon aria-hidden="true">✏️</S.WriteIcon>
                    게시글 작성
                  </S.WriteButton>
                </S.WriteButtonRow>
              )}
              {!showForm && !isAuthenticated && (
                <S.LoginPromptRow>
                  로그인 후 게시글을 작성할 수 있습니다.
                </S.LoginPromptRow>
              )}

              {showForm && (
                <PostForm
                  onSubmit={handleCreatePost}
                  isSubmitting={isSubmitting}
                  onCancel={() => setShowForm(false)}
                />
              )}

              <PostList posts={posts} loading={isLoading} />

              {/* ✅ 페이지네이션 */}
              {totalPages > 1 && (
                <S.Pagination>
                  <S.PageBtn
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    ◀
                  </S.PageBtn>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <S.PageBtn
                      key={page}
                      $active={page === currentPage}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </S.PageBtn>
                  ))}

                  <S.PageBtn
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    ▶
                  </S.PageBtn>
                </S.Pagination>
              )}
            </>
          )}

          {activeTab === 'playlist-share' && <PlaylistShareFeed />}

          {activeTab === 'reviews' && (
            <EmptyState
              icon="📝"
              title="리뷰를 작성해보세요"
              description="영화 상세 페이지에서 리뷰를 작성할 수 있습니다"
            />
          )}

          {activeTab === 'quiz' && <QuizPage embedded />}
        </S.Content>
      </S.PageInner>
    </S.PageWrapper>
  );
}