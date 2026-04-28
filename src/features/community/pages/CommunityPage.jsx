import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useModal } from '../../../shared/components/Modal';
import { useRewardToast } from '../../../shared/components/RewardToast';
import { getPosts, createPost } from '../api/communityApi';
import useAuthStore from '../../../shared/stores/useAuthStore';
import PostList from '../components/PostList';
import PostForm from '../components/PostForm';
import QuizPage from '../../quiz/pages/QuizPage';
import PlaylistShareFeed from '../components/PlaylistShareFeed';
// 2026-04-14 신규: 관리자가 등록한 OCR 실관람 인증 이벤트를 "실관람인증" 탭에 노출
import OcrEventFeed from '../components/OcrEventFeed';
// 2026-04-15 신규: 공지사항 탭 — 홈 배너 클릭 딥링크 대상. 상세는 아코디언 인라인 펼침.
import NoticeFeed from '../components/NoticeFeed';
import * as S from './CommunityPage.styled';

const TABS = [
  { id: 'posts', label: '영화' },
  { id: 'playlist-share', label: '플레이리스트 공유' },
  { id: 'reviews', label: '실관람인증' },
  { id: 'quiz', label: '오늘의 퀴즈' },
  // 2026-04-15: 공지사항 탭 추가. 홈 배너/슬라이드 클릭 시 이 탭으로 이동한다
  // (linkUrl 이 없는 경우 한정, URL ?tab=notices&noticeId={id} 로 딥링크).
  { id: 'notices', label: '공지사항' },
];

const VALID_TAB_IDS = new Set(TABS.map((t) => t.id));

const CATEGORY_FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'FREE', label: '자유' },
  { id: 'DISCUSSION', label: '토론' },
  { id: 'RECOMMENDATION', label: '추천' },
  { id: 'NEWS', label: '뉴스' },
];

const SORT_OPTIONS = [
  { id: 'latest', label: '최신순' },
  { id: 'likes', label: '좋아요순' },
  { id: 'views', label: '조회수순' },
];

export default function CommunityPage() {
  const { showAlert } = useModal();
  const { showReward } = useRewardToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const initialTab = tabFromUrl && VALID_TAB_IDS.has(tabFromUrl) ? tabFromUrl : 'posts';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('latest');
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(
    Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  );
  const [totalPages, setTotalPages] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // ✅ 추가

  const goToPage = (page) => {
    setCurrentPage(page);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (page > 1) next.set('page', String(page));
        else next.delete('page');
        return next;
      },
      { replace: true }
    );
  };

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentPage(1);
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

  useEffect(() => {
    async function loadPosts() {
      setIsLoading(true);
      try {
        const result = await getPosts({ page: currentPage, size: 5, category, keyword, sort });
        setPosts(result?.posts || []);
        setTotalPages(result?.totalPages || 1);
      } catch (err) {
        console.error('[CommunityPage] 게시글 로드 실패:', err);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (activeTab === 'posts') {
      loadPosts();
    }
  }, [activeTab, category, sort, currentPage, keyword, refreshTrigger]); // ✅ refreshTrigger 추가

  const handleCategoryChange = (id) => {
    setCategory(id);
    goToPage(1);
    setKeyword('');
    setSearchInput('');
  };

  const handleSortChange = (id) => {
    setSort(id);
    goToPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setKeyword(searchInput);
    goToPage(1);
  };

  const handleCreatePost = async (postData) => {
    setIsSubmitting(true);
    try {
      const newPost = await createPost(postData);
      setShowForm(false);
      goToPage(1);
      setKeyword('');
      setSearchInput('');
      setCategory('all');
      setRefreshTrigger((prev) => prev + 1); // ✅ 강제 새로고침
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
              <S.SearchForm onSubmit={handleSearch}>
                <S.SearchInput
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="제목 또는 내용으로 검색..."
                />
                <S.SearchBtn type="submit">🔍</S.SearchBtn>
              </S.SearchForm>

              <S.FilterRow>
                <S.CategoryChipRow role="tablist" aria-label="게시글 카테고리 필터">
                  {CATEGORY_FILTERS.map((c) => (
                    <S.CategoryChip
                      key={c.id}
                      type="button"
                      role="tab"
                      aria-selected={category === c.id}
                      $active={category === c.id}
                      onClick={() => handleCategoryChange(c.id)}
                    >
                      {c.label}
                    </S.CategoryChip>
                  ))}
                </S.CategoryChipRow>

                <S.SortChipRow aria-label="정렬 방식">
                  {SORT_OPTIONS.map((s) => (
                    <S.SortChip
                      key={s.id}
                      type="button"
                      $active={sort === s.id}
                      onClick={() => handleSortChange(s.id)}
                    >
                      {s.label}
                    </S.SortChip>
                  ))}
                </S.SortChipRow>
              </S.FilterRow>

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

              {totalPages > 1 && (
                <S.Pagination>
                  <S.PageBtn
                    onClick={() => goToPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    ◀
                  </S.PageBtn>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <S.PageBtn
                      key={page}
                      $active={page === currentPage}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </S.PageBtn>
                  ))}

                  <S.PageBtn
                    onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    ▶
                  </S.PageBtn>
                </S.Pagination>
              )}
            </>
          )}

          {activeTab === 'playlist-share' && <PlaylistShareFeed />}

          {activeTab === 'reviews' && <OcrEventFeed />}

          {activeTab === 'quiz' && <QuizPage embedded />}

          {/*
            2026-04-15 공지사항 탭.
            NoticeFeed 내부가 URL searchParams 의 noticeId 쿼리를 직접 읽어
            딥링크 공지 하이라이트를 처리한다.
          */}
          {activeTab === 'notices' && <NoticeFeed />}
        </S.Content>
      </S.PageInner>
    </S.PageWrapper>
  );
}