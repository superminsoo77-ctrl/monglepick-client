/**
 * CommentSection 컴포넌트 styled-components 정의.
 *
 * 게시글 상세 하단에 붙는 댓글 영역의 스타일을 담당한다.
 * - Section : 루트 컨테이너 (섹션 제목 + 폼 + 리스트)
 * - Form    : 댓글 작성 textarea + 제출 버튼
 * - List    : 댓글 리스트 래퍼
 * - Item    : 개별 댓글 카드 (삭제된 댓글은 흐릿하게)
 */

import styled from 'styled-components';
import { media } from '../../../shared/styles/media';

/** 섹션 루트 컨테이너 */
export const Section = styled.section`
  margin-top: ${({ theme }) => theme.spacing.xxl};
`;

/** 섹션 제목 */
export const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
`;

/** 댓글 작성 폼 래퍼 */
export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.glass.bg};
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

/** 댓글 입력 textarea */
export const Textarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-family: inherit;
  resize: vertical;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

/** 폼 하단 — 글자 수 + 제출 버튼 가로 배치 */
export const FormFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`;

/** 글자 수 카운터 */
export const CharCount = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/** 제출 버튼 */
export const SubmitBtn = styled.button`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.gradients.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    box-shadow: ${({ theme }) => theme.glows.primary};
    transform: translateY(-1px);
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.bgElevated};
    color: ${({ theme }) => theme.colors.textMuted};
    cursor: not-allowed;
  }
`;

/** 로그인 안내 박스 (비인증 사용자용) */
export const LoginNotice = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.bgElevated};
  border: 1px dashed ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

/** 댓글 리스트 컨테이너 */
export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/** 빈 상태 */
export const Empty = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

/**
 * 개별 댓글 아이템.
 *
 * $deleted 가 true 이면 본문을 연하게 표시한다.
 */
export const Item = styled.article`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.glass.bg};
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.md};
  opacity: ${({ $deleted }) => ($deleted ? 0.5 : 1)};
`;

/** 댓글 상단 — 작성자 + 작성 시간 + 액션 버튼 */
export const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

/** 작성자 + 시간 묶음 */
export const Author = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/** 작성자 닉네임/아이디 */
export const AuthorName = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

/** 댓글 본문 */
export const Body = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: ${({ theme }) => theme.typography.leadingNormal};
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

/** 댓글 하단 액션 묶음 (좋아요, 삭제) */
export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

/**
 * 액션 버튼 — 좋아요/삭제 공통 스타일.
 *
 * $liked 가 true 이면 primary 색상을 적용한다.
 */
export const ActionBtn = styled.button`
  padding: 2px ${({ theme }) => theme.spacing.sm};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ $liked, theme }) =>
    $liked ? theme.colors.primary : theme.colors.textSecondary};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${media.mobile} {
    padding: 2px ${({ theme }) => theme.spacing.xs};
  }
`;
