/**
 * PostForm 컴포넌트 styled-components 정의.
 *
 * $error  — transient prop: 입력 필드 에러 테두리
 * $active — transient prop: 카테고리 버튼 활성 상태
 * $status — transient prop: DraftIndicator 상태 (saving | saved | idle)
 * $muted  — transient prop: DraftCheck 흐림 처리
 */

import styled, { keyframes } from 'styled-components';
import { fadeInUp } from '../../../shared/styles/animations';

/* ── 공통 애니메이션 ── */

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1;   transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.75); }
`;


/* ── 폼 루트 ── */

export const Wrapper = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: ${({ theme }) => theme.glass.blur};
  -webkit-backdrop-filter: ${({ theme }) => theme.glass.blur};
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  animation: ${fadeInUp} 0.4s ease forwards;
`;

/* ── 임시저장 상태 바 (상단) ── */

export const DraftStatusBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  animation: ${slideDown} 0.25s ease forwards;
  margin-bottom: -${({ theme }) => theme.spacing.sm};
`;

/* ── 임시저장 복원 배너 ── */

export const DraftBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.glass.bg};
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.lg};
  animation: ${slideDown} 0.3s ease forwards;
  position: relative;
`;

export const DraftBannerBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  flex: 1;
`;

export const DraftBannerTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

export const DraftBannerSub = styled.p`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`;

export const DraftBannerBtns = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

export const DraftRestoreBtn = styled.button`
  padding: 5px 14px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  background: ${({ theme }) => theme.gradients.primary};
  color: white;
  border: none;

  &:hover {
    box-shadow: ${({ theme }) => theme.glows.primary};
    transform: translateY(-1px);
  }
`;

export const DraftDiscardBtn = styled.button`
  padding: 5px 14px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};

  &:hover {
    background: ${({ theme }) => theme.colors.bgElevated};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

export const DraftBannerClose = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.sm};
  right: ${({ theme }) => theme.spacing.sm};
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radius.full};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.bgElevated};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

/* ── 필드 기본 ── */

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const Categories = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const CategoryBtn = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  color: ${({ $active, theme }) => $active ? 'white' : theme.colors.textSecondary};
  background: ${({ $active, theme }) => $active ? theme.gradients.primary : theme.colors.bgElevated};
  border: 1px solid ${({ $active }) => $active ? 'transparent' : 'var(--border-default)'};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ $active, theme }) => $active ? 'white' : theme.colors.primary};
  }
`;

export const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.bgInput};
  border: 1px solid ${({ $error, theme }) => $error ? theme.colors.error : theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textBase};
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.glows.primary};
    outline: none;
  }
`;

export const Textarea = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.bgInput};
  border: 1px solid ${({ $error, theme }) => $error ? theme.colors.error : theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textBase};
  line-height: ${({ theme }) => theme.typography.leadingRelaxed};
  resize: vertical;
  min-height: 200px;
  transition: border-color ${({ theme }) => theme.transitions.fast};
  font-family: ${({ theme }) => theme.typography.fontFamily};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.glows.primary};
    outline: none;
  }
`;

export const CharCount = styled.div`
  display: flex;
  justify-content: flex-end;

  span {
    font-size: ${({ theme }) => theme.typography.textXs};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const ErrorMsg = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.error};
`;

/* ── 버튼 영역 ── */

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const DraftDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.textMuted};
  display: inline-block;
  animation: ${pulse} 1.2s ease-in-out infinite;
  flex-shrink: 0;
`;

/* ── 폼 버튼 기본 ── */

const BtnBase = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  border: none;
`;

export const CancelBtn = styled(BtnBase)`
  background-color: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};

  &:hover {
    background-color: ${({ theme }) => theme.colors.bgElevated};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

export const SubmitBtn = styled(BtnBase)`
  background: ${({ theme }) => theme.gradients.primary};
  color: white;

  &:hover:not(:disabled) {
    box-shadow: ${({ theme }) => theme.glows.primary};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

/* ── 이미지 첨부 ── */

export const ImagePreviewList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
`;

export const ImagePreviewItem = styled.div`
  position: relative;
  width: 100px;
  height: 100px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  }
`;

export const ImageRemoveBtn = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover { background: rgba(0, 0, 0, 0.8); }
`;

export const ImageUploadLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px dashed ${({ theme }) => theme.colors.borderDefault};
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textSecondary};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export const UploadingMsg = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 4px;
`;