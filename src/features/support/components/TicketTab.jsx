/**
 * 문의하기 + 내 문의 내역 탭 컴포넌트.
 *
 * 활성 섹션에 따라 문의 폼 또는 티켓 내역을 렌더링한다.
 * - 'ticket' 섹션: 문의 등록 폼 (카테고리/제목/내용 입력)
 * - 'history' 섹션: 내 티켓 목록 + 페이지네이션
 *
 * @param {Object} props
 * @param {string} props.activeSection - 현재 활성 섹션 ('ticket' | 'history')
 * @param {boolean} props.isAuthenticated - 인증 상태
 * @param {string} props.ticketCategory - 선택된 문의 카테고리
 * @param {Function} props.onCategoryChange - 카테고리 변경 핸들러
 * @param {string} props.ticketTitle - 문의 제목
 * @param {Function} props.onTitleChange - 제목 변경 핸들러
 * @param {string} props.ticketContent - 문의 내용
 * @param {Function} props.onContentChange - 내용 변경 핸들러
 * @param {boolean} props.isSubmitting - 폼 제출 처리 중
 * @param {Object} props.formErrors - 폼 검증 에러 메시지
 * @param {boolean} props.ticketSuccess - 티켓 생성 성공 여부
 * @param {Function} props.onSubmit - 폼 제출 핸들러
 * @param {Function} props.onResetForm - 새 문의하기 핸들러
 * @param {Object} props.myTickets - 내 티켓 페이지 데이터
 * @param {number} props.ticketPage - 현재 페이지 번호
 * @param {boolean} props.isLoadingTickets - 티켓 로딩 상태
 * @param {Function} props.onPageChange - 페이지 변경 핸들러
 * @param {Array} props.ticketCategories - 문의 카테고리 옵션
 * @param {Object} props.categoryLabelMap - 카테고리 라벨 매핑
 * @param {Object} props.statusLabelMap - 티켓 상태 라벨 매핑
 * @param {Function} props.formatDate - 날짜 포맷팅 함수
 * @param {Function} props.onSelectTicket - 티켓 항목 클릭 시 호출되는 콜백 (ticketId 인자)
 */

import { ROUTES } from '../../../shared/constants/routes';
import Loading from '../../../shared/components/Loading/Loading';
import * as S from './TicketTab.styled';

export default function TicketTab({
  activeSection,
  isAuthenticated,
  ticketCategory,
  onCategoryChange,
  ticketTitle,
  onTitleChange,
  ticketContent,
  onContentChange,
  isSubmitting,
  formErrors,
  ticketSuccess,
  onSubmit,
  onResetForm,
  myTickets,
  ticketPage,
  isLoadingTickets,
  onPageChange,
  ticketCategories,
  categoryLabelMap,
  statusLabelMap,
  formatDate,
  onSelectTicket,
}) {
  /* ── 문의하기 섹션 ── */
  if (activeSection === 'ticket') {
    return (
      <S.SectionWrapper
        id="support-panel-ticket"
        role="tabpanel"
        aria-labelledby="ticket-tab"
      >
        <S.SectionTitle>문의하기</S.SectionTitle>

        {!isAuthenticated ? (
          /* 비인증 사용자 — 로그인 유도 */
          <S.LoginPrompt>
            <S.LoginPromptText>
              로그인 후 이용 가능합니다.
            </S.LoginPromptText>
            <S.LoginPromptLink to={ROUTES.LOGIN}>
              로그인하기
            </S.LoginPromptLink>
          </S.LoginPrompt>
        ) : ticketSuccess ? (
          /* 티켓 생성 성공 화면 */
          <S.Success>
            <S.SuccessIcon aria-hidden="true">
              &#10003;
            </S.SuccessIcon>
            <S.SuccessTitle>
              문의가 등록되었습니다
            </S.SuccessTitle>
            <S.SuccessText>
              담당자가 확인 후 빠르게 답변드리겠습니다.
              <br />
              "내 문의 내역" 탭에서 처리 상태를 확인할 수 있습니다.
            </S.SuccessText>
            <S.SuccessBtn onClick={onResetForm}>
              새 문의하기
            </S.SuccessBtn>
          </S.Success>
        ) : (
          /* 문의 등록 폼 */
          <S.Form onSubmit={onSubmit} noValidate>
            {/* 카테고리 선택 */}
            <S.FormGroup>
              <S.FormLabel htmlFor="ticket-category">
                카테고리
                <S.FormRequired aria-hidden="true">*</S.FormRequired>
              </S.FormLabel>
              <S.FormSelect
                id="ticket-category"
                value={ticketCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                aria-required="true"
                aria-invalid={!!formErrors.category}
                aria-describedby={formErrors.category ? 'ticket-category-error' : undefined}
              >
                {ticketCategories.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </S.FormSelect>
              {formErrors.category && (
                <S.FormError id="ticket-category-error" role="alert">
                  {formErrors.category}
                </S.FormError>
              )}
            </S.FormGroup>

            {/* 제목 입력 */}
            <S.FormGroup>
              <S.FormLabel htmlFor="ticket-title">
                제목
                <S.FormRequired aria-hidden="true">*</S.FormRequired>
              </S.FormLabel>
              <S.FormInput
                id="ticket-title"
                type="text"
                placeholder="문의 제목을 입력하세요"
                value={ticketTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                maxLength={100}
                aria-required="true"
                aria-invalid={!!formErrors.title}
                aria-describedby={formErrors.title ? 'ticket-title-error' : 'ticket-title-hint'}
              />
              <S.CharCount>
                <S.CharCountValue $over={ticketTitle.length > 100}>
                  {ticketTitle.length}
                </S.CharCountValue>
                /100
              </S.CharCount>
              {formErrors.title ? (
                <S.FormError id="ticket-title-error" role="alert">
                  {formErrors.title}
                </S.FormError>
              ) : (
                <S.FormHint id="ticket-title-hint">
                  2~100자 이내로 작성해주세요.
                </S.FormHint>
              )}
            </S.FormGroup>

            {/* 내용 입력 */}
            <S.FormGroup>
              <S.FormLabel htmlFor="ticket-content">
                내용
                <S.FormRequired aria-hidden="true">*</S.FormRequired>
              </S.FormLabel>
              <S.FormTextarea
                id="ticket-content"
                placeholder="문의 내용을 상세히 작성해주세요"
                value={ticketContent}
                onChange={(e) => onContentChange(e.target.value)}
                maxLength={2000}
                aria-required="true"
                aria-invalid={!!formErrors.content}
                aria-describedby={formErrors.content ? 'ticket-content-error' : 'ticket-content-hint'}
              />
              <S.CharCount>
                <S.CharCountValue $over={ticketContent.length > 2000}>
                  {ticketContent.length}
                </S.CharCountValue>
                /2,000
              </S.CharCount>
              {formErrors.content ? (
                <S.FormError id="ticket-content-error" role="alert">
                  {formErrors.content}
                </S.FormError>
              ) : (
                <S.FormHint id="ticket-content-hint">
                  10~2,000자 이내로 작성해주세요.
                </S.FormHint>
              )}
            </S.FormGroup>

            {/* 제출 버튼 */}
            <S.SubmitBtn type="submit" disabled={isSubmitting}>
              {isSubmitting ? '등록 중...' : '문의 등록'}
            </S.SubmitBtn>
          </S.Form>
        )}
      </S.SectionWrapper>
    );
  }

  /* ── 내 문의 내역 섹션 ── */
  if (activeSection === 'history' && isAuthenticated) {
    return (
      <S.SectionWrapper
        id="support-panel-history"
        role="tabpanel"
        aria-labelledby="history-tab"
      >
        <S.SectionTitle>
          내 문의 내역
          {myTickets.totalElements > 0 && (
            <S.SectionTitleCount>({myTickets.totalElements}건)</S.SectionTitleCount>
          )}
        </S.SectionTitle>

        {isLoadingTickets ? (
          <Loading message="문의 내역을 불러오는 중..." />
        ) : myTickets.content.length === 0 ? (
          <S.Empty>
            <S.EmptyIcon aria-hidden="true">?</S.EmptyIcon>
            <S.EmptyText>문의 내역이 없습니다.</S.EmptyText>
          </S.Empty>
        ) : (
          <>
            {/* 티켓 목록 — 항목 클릭 시 onSelectTicket(ticketId) 으로 상세 모달 오픈.
                onSelectTicket 이 없으면 기존처럼 정적 카드만 렌더한다 (storybook/테스트 호환). */}
            <S.List role="list">
              {myTickets.content.map((ticket) => {
                const clickable = typeof onSelectTicket === 'function';
                return (
                  <S.Item
                    key={ticket.ticketId}
                    role="listitem"
                    $clickable={clickable}
                    /* clickable 일 때만 button 시멘틱 적용 → 키보드 enter/space + 포커스 링 자동 지원 */
                    {...(clickable
                      ? {
                          as: 'button',
                          type: 'button',
                          onClick: () => onSelectTicket(ticket.ticketId),
                          'aria-label': `${ticket.title} 상세 보기`,
                        }
                      : {})}
                  >
                    <S.ItemInfo>
                      <S.ItemTitle>{ticket.title}</S.ItemTitle>
                      <S.ItemMeta>
                        <S.ItemCategoryBadge>
                          {categoryLabelMap[ticket.category] || ticket.category}
                        </S.ItemCategoryBadge>
                        <S.ItemDate>
                          {formatDate(ticket.createdAt)}
                        </S.ItemDate>
                      </S.ItemMeta>
                    </S.ItemInfo>
                    <S.StatusBadge $status={ticket.status}>
                      {statusLabelMap[ticket.status] || ticket.status}
                    </S.StatusBadge>
                  </S.Item>
                );
              })}
            </S.List>

            {/* 페이지네이션 */}
            {myTickets.totalPages > 1 && (
              <S.Pagination>
                <S.PaginationBtn
                  onClick={() => onPageChange((prev) => Math.max(0, prev - 1))}
                  disabled={ticketPage === 0}
                >
                  이전
                </S.PaginationBtn>
                <S.PaginationInfo>
                  {ticketPage + 1} / {myTickets.totalPages}
                </S.PaginationInfo>
                <S.PaginationBtn
                  onClick={() =>
                    onPageChange((prev) =>
                      Math.min(myTickets.totalPages - 1, prev + 1)
                    )
                  }
                  disabled={ticketPage >= myTickets.totalPages - 1}
                >
                  다음
                </S.PaginationBtn>
              </S.Pagination>
            )}
          </>
        )}
      </S.SectionWrapper>
    );
  }

  return null;
}
