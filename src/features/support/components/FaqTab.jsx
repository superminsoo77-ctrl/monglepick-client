/**
 * FAQ 탭 컴포넌트.
 *
 * 카테고리 필터, 검색 바, FAQ 아코디언 목록, 피드백 기능을 제공한다.
 *
 * @param {Object} props
 * @param {Array} props.faqs - 필터링된 FAQ 배열
 * @param {boolean} props.isLoading - 로딩 상태
 * @param {number} props.categoryIdx - 현재 선택된 카테고리 인덱스
 * @param {Function} props.onCategoryChange - 카테고리 변경 핸들러
 * @param {string} props.searchKeyword - 검색 키워드
 * @param {Function} props.onSearchChange - 검색어 변경 핸들러
 * @param {Set} props.openFaqIds - 열린 FAQ ID Set
 * @param {Function} props.onToggleFaq - FAQ 아코디언 토글 핸들러
 * @param {Object} props.feedbackMap - FAQ 피드백 상태 맵
 * @param {string|null} props.feedbackLoadingId - 피드백 처리 중인 FAQ ID
 * @param {Function} props.onFeedback - 피드백 제출 핸들러
 * @param {boolean} props.isAuthenticated - 인증 상태
 * @param {Array} props.categoryFilters - 카테고리 필터 목록
 * @param {Object} props.categoryLabelMap - 카테고리 라벨 매핑
 */

import Loading from '../../../shared/components/Loading/Loading';
import * as S from './FaqTab.styled';

export default function FaqTab({
  faqs,
  isLoading,
  categoryIdx,
  onCategoryChange,
  searchKeyword,
  onSearchChange,
  openFaqIds,
  onToggleFaq,
  feedbackMap,
  feedbackLoadingId,
  onFeedback,
  isAuthenticated,
  categoryFilters,
  categoryLabelMap,
}) {
  return (
    <S.SectionWrapper
      id="support-panel-faq"
      role="tabpanel"
      aria-labelledby="faq-tab"
    >
      <S.SectionTitle>자주 묻는 질문</S.SectionTitle>

      <S.CategoryTabs role="group" aria-label="FAQ 카테고리 필터">
        {categoryFilters.map((cat, idx) => (
          <S.CategoryTab
            key={cat.label}
            $isActive={categoryIdx === idx}
            onClick={() => onCategoryChange(idx)}
            aria-pressed={categoryIdx === idx}
          >
            {cat.label}
          </S.CategoryTab>
        ))}
      </S.CategoryTabs>

      {/* 검색 바 */}
      <S.SearchBar>
        <S.SearchIcon aria-hidden="true">&#128269;</S.SearchIcon>
        <S.SearchInput
          type="text"
          placeholder="FAQ 검색..."
          value={searchKeyword}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="FAQ 검색"
        />
      </S.SearchBar>

      {/* FAQ 목록 */}
      {isLoading ? (
        <Loading message="FAQ를 불러오는 중..." />
      ) : faqs.length === 0 ? (
        <S.Empty>
          <S.EmptyIcon aria-hidden="true">?</S.EmptyIcon>
          <S.EmptyText>
            {searchKeyword
              ? `"${searchKeyword}"에 대한 검색 결과가 없습니다.`
              : '등록된 FAQ가 없습니다.'}
          </S.EmptyText>
        </S.Empty>
      ) : (
        <S.List role="list">
          {faqs.map((faq) => {
            const isOpen = openFaqIds.has(faq.id);
            const feedbackState = feedbackMap[faq.id];

            return (
              <S.Item key={faq.id} role="listitem">
                {/* FAQ 질문 (아코디언 헤더) */}
                <S.Question
                  onClick={() => onToggleFaq(faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${faq.id}`}
                >
                  <S.CategoryBadge>
                    {categoryLabelMap[faq.category] || faq.category}
                  </S.CategoryBadge>
                  <S.QuestionText>{faq.question}</S.QuestionText>
                  <S.Toggle $isOpen={isOpen} aria-hidden="true">
                    &#9660;
                  </S.Toggle>
                </S.Question>

                {/* FAQ 답변 (아코디언 패널) */}
                {isOpen && (
                  <S.Answer
                    id={`faq-answer-${faq.id}`}
                    role="region"
                    aria-label={`${faq.question} 답변`}
                  >
                    <S.AnswerText>{faq.answer}</S.AnswerText>

                    {/* 피드백 영역 (인증 사용자만)
                     *  - 미제출 상태: "도움이 되었나요?" 라벨 + 네/아니요 버튼
                     *  - 제출 완료 상태: 감사 메시지로 치환 (버튼 숨김)
                     *    리워드 정책 FAQ_FEEDBACK: 1회당 3P, 일일 5회까지 자동 지급
                     */}
                    {isAuthenticated && (
                      <S.Feedback>
                        {feedbackState ? (
                          <S.FeedbackThanks role="status" aria-live="polite">
                            &#128151; 피드백을 해주셔서 감사합니다!
                          </S.FeedbackThanks>
                        ) : (
                          <>
                            <S.FeedbackLabel>도움이 되었나요?</S.FeedbackLabel>
                            <S.FeedbackBtn
                              onClick={() => onFeedback(faq.id, true)}
                              disabled={feedbackLoadingId === faq.id}
                              aria-label="도움이 되었습니다"
                            >
                              &#128077; 네
                            </S.FeedbackBtn>
                            <S.FeedbackBtn
                              onClick={() => onFeedback(faq.id, false)}
                              disabled={feedbackLoadingId === faq.id}
                              aria-label="도움이 되지 않았습니다"
                            >
                              &#128078; 아니요
                            </S.FeedbackBtn>
                          </>
                        )}
                      </S.Feedback>
                    )}
                  </S.Answer>
                )}
              </S.Item>
            );
          })}
        </S.List>
      )}
    </S.SectionWrapper>
  );
}
