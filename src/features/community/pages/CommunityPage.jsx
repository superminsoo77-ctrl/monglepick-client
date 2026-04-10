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

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
/* 커스텀 모달 훅 — window.alert 대체 */
import { useModal } from '../../../shared/components/Modal';
/* 커뮤니티 API — 같은 feature 내의 communityApi에서 가져옴 */
import { getPosts, createPost } from '../api/communityApi';
/* 인증 Context 훅 — app/providers에서 가져옴 */
import useAuthStore from '../../../shared/stores/useAuthStore';
/* 게시글 목록/작성 컴포넌트 — 같은 feature 내의 components에서 가져옴 */
import PostList from '../components/PostList';
import PostForm from '../components/PostForm';
/* 빈 상태 컴포넌트 — shared/components에서 가져옴 */
import EmptyState from '../../../shared/components/EmptyState/EmptyState';
/*
 * 오늘의 퀴즈 페이지 — features/quiz 의 QuizPage 컴포넌트를 그대로 import 하여
 * 커뮤니티의 한 탭으로 임베드한다. v2 개편으로 헤더 메뉴에서 제거된 퀴즈를
 * 커뮤니티 카테고리로 이관하기 위한 변경 (2026-04-08).
 */
import QuizPage from '../../quiz/pages/QuizPage';
import PlaylistShareFeed from '../components/PlaylistShareFeed';
import * as S from './CommunityPage.styled';

/** 탭 정의 */
const TABS = [
  { id: 'posts', label: '영화' },
  { id: 'playlist-share', label: '플레이리스트 공유' },
  { id: 'reviews', label: '실관람인증' },
  { id: 'quiz', label: '오늘의 퀴즈' },
];

/** TABS 의 id 집합 — URL 파라미터 검증용 */
const VALID_TAB_IDS = new Set(TABS.map((t) => t.id));

/**
 * 게시글 카테고리 필터 정의.
 *
 * 'all' 은 전체 보기 가상 카테고리(백엔드 미전송).
 * 나머지는 백엔드 PostController.getPosts(@RequestParam category) 와 1:1 매칭.
 *
 * 코드 값은 PostForm 의 CATEGORY_OPTIONS 와 동일하게 유지(general/review/question)
 * — 작성된 게시글의 category 컬럼 값과 필터 코드가 일치해야 조회된다.
 */
const CATEGORY_FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'general', label: '자유' },
  { id: 'review', label: '리뷰' },
  { id: 'question', label: '질문' },
];

export default function CommunityPage() {
  /* 커스텀 모달 — window.alert 대체 */
  const { showAlert } = useModal();

  /*
   * URL 의 ?tab= 파라미터를 활성 탭으로 사용.
   * useSearchParams 로 읽고 setSearchParams 로 쓰면 브라우저 히스토리에도 반영되어
   * 뒤로가기/공유 링크 모두 자연스럽게 동작한다.
   */
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const initialTab = tabFromUrl && VALID_TAB_IDS.has(tabFromUrl) ? tabFromUrl : 'posts';

  // 현재 활성 탭 (URL 파라미터로 초기화)
  const [activeTab, setActiveTab] = useState(initialTab);

  /**
   * 탭 변경 핸들러 — 상태 + URL 동시 갱신.
   *
   * URL 동기화 이유:
   *   1) 사용자가 페이지를 새로고침해도 같은 탭으로 복귀
   *   2) 외부에서 ?tab=quiz 링크 공유 시 바로 그 탭으로 진입
   *   3) 헤더 NAV "커뮤니티" 클릭(쿼리 없음)은 자연스럽게 'posts' 로 진입
   *
   * replace: true 로 히스토리 스택을 더럽히지 않음 (탭 클릭마다 새 entry 쌓이는 것 방지).
   */
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    /* posts 는 기본값이라 ?tab=posts 를 굳이 URL 에 남기지 않음 — 깔끔한 URL 유지 */
    if (tabId === 'posts') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab: tabId }, { replace: true });
    }
  };

  /*
   * URL 의 ?tab= 가 외부에서 변경된 경우(예: 브라우저 뒤로가기, /quiz 리다이렉트 진입)
   * 활성 탭 상태도 그에 맞춰 동기화한다.
   */
  useEffect(() => {
    if (tabFromUrl && VALID_TAB_IDS.has(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
    // activeTab 의존성 제외 — 무한 루프 방지(handleTabChange 가 URL 갱신 → effect 재실행)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabFromUrl]);
  // 게시글 목록
  const [posts, setPosts] = useState([]);
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);
  // 글 작성 폼 표시 여부
  const [showForm, setShowForm] = useState(false);
  // 글 작성 중 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  /*
   * 카테고리 필터 (게시글 탭 전용).
   *
   * 'all'  = 전체, 'general' = 자유, 'review' = 리뷰, 'question' = 질문.
   * 백엔드 PostController.getPosts 의 @RequestParam(category) 와 1:1 매칭되며,
   * 'all' 일 때는 communityApi.getPosts 가 category 파라미터 자체를 전송하지 않는다.
   */
  const [category, setCategory] = useState('all');

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  /**
   * 게시글 목록을 로드한다.
   *
   * activeTab 이 'posts' 일 때 또는 카테고리 필터가 변경될 때 재실행된다.
   * 카테고리 변경 시 즉시 재조회로 사용자 의도에 빠르게 반응한다.
   */
  useEffect(() => {
    async function loadPosts() {
      setIsLoading(true);
      try {
        const result = await getPosts({ page: 1, size: 20, category });
        setPosts(result?.posts || []);
      } catch (err) {
        /* 에러도 콘솔에 남겨 진단 가능하도록 — 빈 화면만 보여서는 원인 추적 어려움 */
        console.error('[CommunityPage] 게시글 로드 실패:', err);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (activeTab === 'posts') {
      loadPosts();
    }
  }, [activeTab, category]);

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
        {/* 페이지 헤더 */}
        <S.Header>
          <S.Title>커뮤니티</S.Title>
          <S.Desc>영화에 대한 이야기를 나눠보세요</S.Desc>
        </S.Header>

        {/* 탭 네비게이션 — 활성 탭에 gradient 하단 바 */}
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

        {/* 탭 콘텐츠 — key 변경 시 fadeIn 재실행 */}
        <S.Content key={activeTab}>
          {activeTab === 'posts' && (
            <>
              {/*
                카테고리 필터 칩 — v2 개편 (2026-04-08).

                기존엔 카테고리 필터 UI 자체가 없어 사용자가 카테고리별로 게시글을
                탐색할 수 없었다. 본문 상단에 칩 형태로 필터를 제공하여 한 번에
                자유/리뷰/질문/전체를 전환할 수 있도록 한다.

                필터 변경 시 useEffect dependency 에 의해 자동 재조회된다.
                작성 폼이 열린 상태에서도 필터는 유지(다음 작성에 영향 없음).
              */}
              <S.CategoryChipRow role="tablist" aria-label="게시글 카테고리 필터">
                {CATEGORY_FILTERS.map((c) => (
                  <S.CategoryChip
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={category === c.id}
                    $active={category === c.id}
                    onClick={() => setCategory(c.id)}
                  >
                    {c.label}
                  </S.CategoryChip>
                ))}
              </S.CategoryChipRow>

              {/*
                게시글 작성 진입 영역 — v2 개편 (2026-04-08).

                기존: 우하단 FAB(`+` 만 있는 floating 버튼) → 의도가 모호하고 모바일에서 콘텐츠를 가림.
                개선: 본문(목록 위)에 라벨이 명확한 "게시글 작성" 버튼.
                  - 인증 사용자: gradient WriteButton 으로 작성 폼 열기
                  - 비로그인:    "로그인 후 작성 가능" dashed 안내 박스
                  - 작성 폼 열린 상태(showForm=true): 둘 다 숨김 (PostForm 만 노출)
              */}
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

          {activeTab === 'playlist-share' && <PlaylistShareFeed />}

          {activeTab === 'reviews' && (
            <EmptyState
              icon="📝"
              title="리뷰를 작성해보세요"
              description="영화 상세 페이지에서 리뷰를 작성할 수 있습니다"
            />
          )}

          {/*
            오늘의 퀴즈 탭 — features/quiz 의 QuizPage 컴포넌트를 임베드 모드로 렌더링.

            embedded=true 로 호출하여 QuizPage 의 자체 페이지 헤더(PageTitle/PageDesc)와
            Container 폭 제한을 생략한다. 이렇게 하지 않으면 CommunityPage 의 페이지 헤더
            (커뮤니티 / 영화에 대한 이야기를 나눠보세요) 와 QuizPage 의 페이지 헤더
            (오늘의 영화 퀴즈 / 영화에 대한 퀴즈를 풀고...) 가 동시에 노출되어
            "두 개의 페이지 타이틀이 한 화면에 보이는" 시각적 중복이 발생한다.

            embedded 모드에서는 통계바·로딩·에러·빈 상태·카드 목록만 부모 흐름에 노출되어,
            CommunityPage 의 탭 본문으로 자연스럽게 통합된다 (2026-04-08 추가).
          */}
          {activeTab === 'quiz' && <QuizPage embedded />}
        </S.Content>
      </S.PageInner>
    </S.PageWrapper>
  );
}
