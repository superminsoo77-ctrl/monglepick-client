/**
 * PostDetailPage 컴포넌트 styled-components 정의.
 *
 * 게시글 상세 페이지의 레이아웃 스타일을 담당한다.
 * - PageWrapper: 페이지 외곽 + 최대 폭 760px 제약
 * - Header: 상단 뒤로가기 + 카테고리 배지 + 작성 시간
 * - Title: 게시글 제목
 * - Body: 게시글 본문 (white-space: pre-wrap)
 * - AuthorBar: 작성자 + 액션 버튼 (수정/삭제)
 */

import styled, { keyframes } from 'styled-components';
import { media } from '../../../shared/styles/media';

const slideDown = keyframes`
  from { transform: translateY(-100%) translateX(-50%); opacity: 0; }
  to   { transform: translateY(0)     translateX(-50%); opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(0)     translateX(-50%); opacity: 1; }
  to   { transform: translateY(-100%) translateX(-50%); opacity: 0; }
`;

const TYPE_COLORS = {
  success: { bg: 'rgba(72,187,120,0.15)', border: 'rgba(72,187,120,0.4)', text: '#276749' },
  warning: { bg: 'rgba(237,137,54,0.15)', border: 'rgba(237,137,54,0.4)', text: '#7b341e' },
  error:   { bg: 'rgba(229,62,62,0.15)',  border: 'rgba(229,62,62,0.4)',  text: '#742a2a' },
};

export const ToastContainer = styled.div`
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
`;

export const Toast = styled.div`
  pointer-events: auto;
  padding: 12px 20px;
  border-radius: ${({ theme }) => theme.radius?.lg || '12px'};
  background: ${({ $type }) => TYPE_COLORS[$type]?.bg || TYPE_COLORS.success.bg};
  border: 1px solid ${({ $type }) => TYPE_COLORS[$type]?.border || TYPE_COLORS.success.border};
  color: ${({ $type }) => TYPE_COLORS[$type]?.text || TYPE_COLORS.success.text};
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  font-size: ${({ theme }) => theme.typography?.textSm || '0.875rem'};
  font-weight: ${({ theme }) => theme.typography?.fontSemibold || 600};
  min-width: 220px;
  max-width: 360px;
  text-align: center;
  animation: ${({ $leaving }) => ($leaving ? slideUp : slideDown)} 0.35s ease forwards;
`;

/** 페이지 외곽 래퍼 */
export const PageWrapper = styled.main`
  min-height: calc(100vh - 120px);
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.bgPage};

  ${media.mobile} {
    padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.sm};
  }
`;

/** 내부 컨텐츠 컨테이너 */
export const PageInner = styled.div`
  max-width: 760px;
  margin: 0 auto;
`;

/** 상단 네비게이션 — 뒤로가기 버튼 */
export const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  cursor: pointer;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

/** 게시글 상세 카드 */
export const Card = styled.article`
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: blur(8px) saturate(1.4);
  -webkit-backdrop-filter: blur(8px) saturate(1.4);
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.lg};

  ${media.mobile} {
    padding: ${({ theme }) => theme.spacing.lg};
  }
`;

/** 헤더 — 카테고리 배지 + 작성 시간 */
export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

/** 카테고리 배지 */
export const CategoryBadge = styled.span`
  display: inline-block;
  padding: 2px ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
`;

/** 작성 시간 */
export const Time = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/** 게시글 제목 */
export const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
  line-height: ${({ theme }) => theme.typography.leadingTight};
`;

/** 작성자 표시 바 */
export const AuthorBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding-bottom: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/** 게시글 본문 — 줄바꿈 보존 */
export const Body = styled.div`
  font-size: ${({ theme }) => theme.typography.textBase};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: ${({ theme }) => theme.typography.leadingRelaxed};
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 120px;
`;

/** 로딩/에러 상태 박스 */
export const Status = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxl};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

export const ReportButton = styled.button`
  margin-left: auto;
  padding: 6px 14px;
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  color: ${({ theme }) => theme.colors.textMuted};
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: #e53e3e;
    color: #e53e3e;
  }
`;

export const DeleteButton = styled.button`
  padding: 6px 14px;
  background: none;
  border: 1px solid #e53e3e;
  color: #e53e3e;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;

  &:hover:not(:disabled) {
    background: #e53e3e;
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const LikeBar = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

export const LikeButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background: ${({ $liked, theme }) => $liked ? theme.colors.primaryLight : 'transparent'};
  border: 1px solid ${({ $liked, theme }) => $liked ? theme.colors.primary : theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.full};
  color: ${({ $liked, theme }) => $liked ? theme.colors.primary : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const ViewCount = styled.span`
  margin-left: auto;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const ImageList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

export const ImageItem = styled.div`
  img {
    max-width: 100%;
    max-height: 400px;
    border-radius: 8px;
    object-fit: contain;
    border: 1px solid ${({ theme }) => theme.colors.borderLight};
  }
`;

export const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ConfirmBox = styled.div`
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: blur(12px);
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  width: 320px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

export const ConfirmText = styled.p`
  font-size: ${({ theme }) => theme.typography.textBase};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
  line-height: 1.5;
`;

export const ConfirmButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: center;
`;

export const ConfirmCancelBtn = styled.button`
  flex: 1;
  padding: 10px 0;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export const ConfirmDeleteBtn = styled.button`
  flex: 1;
  padding: 10px 0;
  background: #e53e3e;
  border: 1px solid #e53e3e;
  border-radius: ${({ theme }) => theme.radius.md};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: #c53030;
    border-color: #c53030;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;