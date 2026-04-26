/**
 * PlaylistPage styled-components 정의.
 *
 * 플레이리스트 목록 + 생성 + 상세 보기 레이아웃.
 */

import styled, { keyframes } from 'styled-components';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

/** 페이지 컨테이너 */
export const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 32px 32px;
  animation: ${fadeInUp} 0.4s ease;
`;

/** 페이지 헤더 */
export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  gap: 12px;
  flex-wrap: wrap;
`;

/** 페이지 제목 */
export const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

/** 생성 버튼 */
export const CreateBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: none;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  &:hover { opacity: 0.85; }
`;

/** 플레이리스트 그리드 */
export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

/** 플레이리스트 카드 */
export const Card = styled.div`
  padding: 28px 24px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 140px;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
  }
`;

/** 카드 제목 */
export const CardTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

/** 카드 설명 */
export const CardDesc = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/** 카드 메타 */
export const CardMeta = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

/** 카드 액션 */
export const CardActions = styled.div`
  display: flex;
  gap: 8px;
`;

/** 작은 액션 버튼 */
export const SmallBtn = styled.button`
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textXs};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.bgElevated};
  }

  &.danger:hover {
    background: ${({ theme }) => theme.colors.error}15;
    border-color: ${({ theme }) => theme.colors.error};
    color: ${({ theme }) => theme.colors.error};
  }
`;

/** 모달 폼 오버레이 */
export const FormOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

/** 모달 폼 패널 — $wide: 영화 추가 섹션 포함 시 너비 확장 */
export const FormPanel = styled.div`
  background: ${({ theme }) => theme.colors.bgCard || theme.colors.bgSecondary};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 28px 24px;
  width: 100%;
  max-width: ${({ $wide }) => ($wide ? '640px' : '440px')};
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.borderDefault};
    border-radius: 4px;
  }
`;

/* ── 생성 폼 전용 영화 검색 결과 (리스트형) ── */

/** 검색 결과 리스트 컨테이너 */
export const FormSearchList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 2px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.borderDefault};
    border-radius: 4px;
  }
`;

/** 검색 결과 아이템 — 가로 행 */
export const FormSearchItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.primary : theme.colors.borderDefault};
  background: ${({ $selected, theme }) =>
    $selected ? `${theme.colors.primary}10` : theme.colors.bgSecondary};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => `${theme.colors.primary}08`};
  }
`;

/** 썸네일 이미지 */
export const FormSearchPoster = styled.img`
  width: 36px;
  height: 54px;
  border-radius: ${({ theme }) => theme.radius.sm};
  object-fit: cover;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.bgElevated};
`;

/** 썸네일 플레이스홀더 */
export const FormSearchPosterFallback = styled.div`
  width: 36px;
  height: 54px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bgElevated};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
`;

/** 영화 정보 (제목 + 연도) */
export const FormSearchInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const FormSearchTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const FormSearchMeta = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 2px;
`;

/** 추가/선택됨 버튼 */
export const FormSearchBtn = styled.button`
  flex-shrink: 0;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1.5px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.primary : theme.colors.borderDefault};
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.primary : 'transparent'};
  color: ${({ $selected, theme }) =>
    $selected ? '#fff' : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ $selected }) => $selected ? '#fff' : 'inherit'};
  }
`;

/** 생성 폼 내 영화 추가 섹션 구분선 */
export const FormDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textXs};

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.borderDefault};
  }
`;

/** 선택된 영화 칩 목록 (가로 스크롤) */
export const FormMovieChipList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 32px;
`;

/** 선택된 영화 칩 */
export const FormMovieChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary}20;
  border: 1px solid ${({ theme }) => theme.colors.primary}40;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  max-width: 160px;
`;

/** 칩 제목 */
export const FormMovieChipTitle = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** 칩 제거 버튼 */
export const FormMovieChipRemove = styled.button`
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: none;
  background: ${({ theme }) => theme.colors.primary}30;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.error};
    color: #fff;
  }
`;

/** 폼 제목 */
export const FormTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

/** 폼 입력 */
export const FormInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ theme }) => theme.colors.bgSecondary};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textBase};
  font-family: inherit;

  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

/** 폼 텍스트 영역 */
export const FormTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ theme }) => theme.colors.bgSecondary};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-family: inherit;
  resize: vertical;

  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

/** 공개/비공개 토글 행 */
export const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ theme }) => theme.colors.bgSecondary};
`;

export const ToggleLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const ToggleSwitch = styled.button`
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: ${({ $on, theme }) => $on ? theme.colors.primary : theme.colors.borderDefault};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${({ $on }) => $on ? '23px' : '3px'};
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    transition: left ${({ theme }) => theme.transitions.fast};
  }
`;

/** 폼 버튼 그룹 */
export const FormButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

/** 폼 버튼 */
export const FormBtn = styled.button`
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: ${({ $variant }) => ($variant === 'cancel' ? '1px solid' : 'none')};
  border-color: ${({ theme }) => theme.colors.borderDefault};
  background: ${({ $variant, theme }) =>
    $variant === 'cancel' ? 'transparent' : theme.colors.primary};
  color: ${({ $variant, theme }) =>
    $variant === 'cancel' ? theme.colors.textSecondary : '#fff'};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

/** 상세 뒤로가기 */
export const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 0;
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  cursor: pointer;
  margin-bottom: 16px;

  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`;

/** 상세 영화 목록 */
export const MovieList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 16px;
`;

/** 상세 영화 카드 */
export const MovieItem = styled.div`
  position: relative;
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
  }
`;

/** 영화 포스터 */
export const MoviePoster = styled.img`
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
  display: block;
`;

/** 영화 포스터 플레이스홀더 */
export const MoviePosterPlaceholder = styled.div`
  width: 100%;
  aspect-ratio: 2/3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.bgElevated};
`;

/** 영화 제목 */
export const MovieTitle = styled.div`
  padding: 8px;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** 영화 제거 버튼 */
export const RemoveMovieBtn = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  ${MovieItem}:hover & {
    opacity: 1;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.error};
  }
`;

/** 빈 상태 */
export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 20px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
`;

/** 빈 상태 아이콘 */
export const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

/** 빈 상태 텍스트 */
export const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  margin: 0;
  line-height: 1.5;
`;

/** 영화 검색 결과 그리드 */
export const SearchResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  max-height: 360px;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.borderDefault};
    border-radius: 4px;
  }
`;

/** 영화 검색 결과 카드 */
export const SearchMovieCard = styled.div`
  position: relative;
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
  }

  &.added {
    opacity: 0.5;
    cursor: default;
    &:hover { transform: none; border-color: ${({ theme }) => theme.colors.borderDefault}; }
  }
`;

/** 검색 결과 영화 포스터 */
export const SearchMoviePoster = styled.img`
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
  display: block;
`;

/** 검색 결과 포스터 플레이스홀더 */
export const SearchMoviePlaceholder = styled.div`
  width: 100%;
  aspect-ratio: 2/3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.bgElevated};
`;

/** 검색 결과 영화 제목 */
export const SearchMovieTitle = styled.div`
  padding: 6px;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** 추가됨 뱃지 */
export const AddedBadge = styled.div`
  position: absolute;
  top: 4px;
  left: 4px;
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
`;

/** 검색 안내 텍스트 */
export const SearchHint = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
  margin: 20px 0;
`;

/* ── 케밥 메뉴 ── */

/** 카드 헤더 행 (제목 + 케밥 버튼) */
export const CardHeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`;

/** ⋮ 버튼 래퍼 (relative 기준) */
export const KebabMenuWrap = styled.div`
  position: relative;
  flex-shrink: 0;
`;

/** ⋮ 케밥 버튼 */
export const KebabBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.bgElevated};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

/** 드롭다운 메뉴 */
export const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 120px;
  background: ${({ theme }) => theme.colors.bgCard || theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
  z-index: 200;
  overflow: hidden;
`;

/** 드롭다운 항목 */
export const DropdownItem = styled.button`
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: transparent;
  color: ${({ $danger, theme }) => ($danger ? theme.colors.error : theme.colors.textPrimary)};
  font-size: ${({ theme }) => theme.typography.textSm};
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ $danger, theme }) =>
      $danger ? `${theme.colors.error}12` : theme.colors.bgElevated};
  }
`;

/** 드롭다운 구분선 */
export const DropdownDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.borderDefault};
  margin: 2px 0;
`;

/* ── 공유 모달 ── */

/** 공유 링크 박스 */
export const ShareLinkBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ theme }) => theme.colors.bgSecondary};
`;

/** 링크 텍스트 */
export const ShareLinkText = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** 복사 버튼 */
export const CopyBtn = styled.button`
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ $copied, theme }) => ($copied ? theme.colors.success : theme.colors.borderDefault)};
  background: ${({ $copied, theme }) => ($copied ? `${theme.colors.success}15` : 'transparent')};
  color: ${({ $copied, theme }) => ($copied ? theme.colors.success : theme.colors.textSecondary)};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  white-space: nowrap;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.bgElevated};
  }
`;

/** 스켈레톤 카드 */
export const SkeletonCard = styled.div`
  padding: 20px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  height: 140px;
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
