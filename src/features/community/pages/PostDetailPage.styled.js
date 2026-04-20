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

import styled from 'styled-components';
import { media } from '../../../shared/styles/media';

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

export const DeleteButton = styled.button`
  margin-left: auto;
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

export const ReportButton = styled.button`
  margin-left: 8px;
  padding: 6px 14px;
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  color: ${({ theme }) => theme.colors.textMuted};
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.15s;

  &:hover {
    border-color: #e53e3e;
    color: #e53e3e;
  }
`;

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(3px);
  z-index: 200;
`;

export const ModalBox = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 201;
  width: 100%;
  max-width: 420px;
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: blur(16px);
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const ModalTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const ModalDesc = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const PresetGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const PresetChip = styled.button`
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textSm};
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.borderDefault};
  background: ${({ $active, theme }) => $active ? theme.colors.primaryLight : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textSecondary};
  font-weight: ${({ $active, theme }) => $active ? theme.typography.fontSemibold : 'normal'};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export const ModalTextarea = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textSm};
  resize: vertical;
  box-sizing: border-box;

  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; }
`;

export const ModalError = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.error};
`;

export const ModalButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
`;

export const ModalCancelBtn = styled.button`
  padding: 8px 18px;
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.textSm};
  &:hover { border-color: ${({ theme }) => theme.colors.textMuted}; }
`;

export const ModalConfirmBtn = styled.button`
  padding: 8px 18px;
  background: #e53e3e;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  color: white;
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  transition: opacity 0.15s;

  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
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