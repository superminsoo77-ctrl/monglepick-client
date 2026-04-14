/**
 * 채팅 이력 사이드바 컴포넌트.
 *
 * 좌측에서 슬라이드인하여 이전 채팅 세션 목록을 표시한다.
 * 세션을 선택하면 이전 대화를 로드하여 이어서 대화할 수 있다.
 *
 * @param {boolean} isOpen - 사이드바 열림 상태
 * @param {function} onClose - 사이드바 닫기 콜백
 * @param {Array} sessions - 세션 목록
 * @param {string} currentSessionId - 현재 활성 세션 ID
 * @param {function} onSelectSession - 세션 선택 콜백 (session 객체 전달)
 * @param {function} onDeleteSession - 세션 삭제 콜백 (sessionId 전달)
 * @param {function} onNewChat - 새 대화 시작 콜백
 * @param {boolean} isLoading - 목록 로딩 중 여부
 * @param {boolean} hasMore - 추가 페이지 존재 여부
 * @param {function} onLoadMore - 더 보기 콜백
 */

import * as S from './SessionSidebar.styled';

/**
 * 상대 시간 포맷.
 * "방금", "n분 전", "n시간 전", "n일 전" 형태로 표시한다.
 *
 * @param {string} dateStr - ISO 날짜 문자열
 * @returns {string} 상대 시간 텍스트
 */
function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 30) return `${diffDay}일 전`;
  /* 30일 이상이면 날짜 표시 */
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function SessionSidebar({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onNewChat,
  isLoading,
  hasMore,
  onLoadMore,
  loadError,
  onRetry,
}) {
  return (
    <S.SidebarOverlay $isOpen={isOpen} onClick={onClose}>
      {/* 패널 클릭은 오버레이 닫기를 전파하지 않음 */}
      <S.SidebarPanel onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <S.SidebarHeader>
          <S.SidebarTitle>이전 대화</S.SidebarTitle>
          <S.NewChatBtn
            onClick={() => {
              onNewChat();
              onClose();
            }}
          >
            + 새 대화
          </S.NewChatBtn>
        </S.SidebarHeader>

        {/* 세션 목록 */}
        <S.SessionList>
          {/* [FIX] 로드 에러 시 에러 메시지 + 재시도 버튼 표시.
              기존에는 에러가 console.error만 남기고 빈 목록을 보여줘서
              사용자가 "이력이 없는 것"으로 오인했음. */}
          {loadError && (
            <S.EmptyState>
              <S.EmptyIcon>&#x26A0;</S.EmptyIcon>
              <S.EmptyText>{loadError}</S.EmptyText>
              {onRetry && (
                <S.LoadMoreBtn onClick={onRetry} style={{ marginTop: 12, width: 'auto' }}>
                  다시 시도
                </S.LoadMoreBtn>
              )}
            </S.EmptyState>
          )}

          {!loadError && sessions.length === 0 && !isLoading && (
            <S.EmptyState>
              <S.EmptyIcon>&#x1F4AC;</S.EmptyIcon>
              <S.EmptyText>
                아직 대화 이력이 없어요.
                <br />
                새 대화를 시작해 보세요!
              </S.EmptyText>
            </S.EmptyState>
          )}

          {sessions.map((session) => (
            <S.SessionItem
              key={session.sessionId}
              $isActive={session.sessionId === currentSessionId}
              onClick={() => {
                onSelectSession(session);
                onClose();
              }}
            >
              <S.SessionInfo>
                <S.SessionTitle>
                  {session.title || '제목 없음'}
                </S.SessionTitle>
                <S.SessionMeta>
                  {session.turnCount}턴 · {formatRelativeTime(session.lastMessageAt)}
                </S.SessionMeta>
              </S.SessionInfo>
              <S.DeleteBtn
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.sessionId);
                }}
                title="삭제"
              >
                &#x2715;
              </S.DeleteBtn>
            </S.SessionItem>
          ))}

          {/* 더 보기 버튼 */}
          {hasMore && (
            <S.LoadMoreBtn onClick={onLoadMore} disabled={isLoading}>
              {isLoading ? '로딩 중...' : '더 보기'}
            </S.LoadMoreBtn>
          )}
        </S.SessionList>
      </S.SidebarPanel>
    </S.SidebarOverlay>
  );
}
