/**
 * MovieDetailPage styled-components 정의.
 *
 * fadeInUp 페이지 등장 + 내부 컨테이너 narrow 너비 제한.
 * 에러 상태와 리뷰 섹션 제목 스타일을 포함한다.
 */

import styled, { css } from 'styled-components';
import { fadeInUp } from '../../../shared/styles/animations';

/** 페이지 전체 컨테이너 — fadeInUp 등장 애니메이션 */
export const MovieDetailPageWrapper = styled.div`
  width: 100%;
  min-height: 60vh;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
  animation: ${fadeInUp} 0.5s ease forwards;
`;

/** 내부 콘텐츠 컨테이너 — narrow 너비 + 세로 flex */
export const InnerContainer = styled.div`
  max-width: ${({ theme }) => theme.layout.contentNarrow};
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxl};
`;

/**
 * 상단 "← 이전" 버튼.
 *
 * 2026-04-14 추가: 둘이 영화 고르기(Match) / 검색 결과 / 커뮤니티 등
 * 어떤 경로로 진입했든 뒤로가기를 직관적으로 제공한다.
 * navigate(-1) 로 브라우저 히스토리를 한 단계 뒤로 이동한다.
 *
 * 키보드 포커스 및 hover 상태를 별도 색상으로 주어 접근성 확보.
 */
export const BackButton = styled.button`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.bgElevated};
    color: ${({ theme }) => theme.colors.textPrimary};
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  /* 좌측 화살표 — svg 크기 고정 */
  svg {
    width: 16px;
    height: 16px;
  }
`;

/** 리뷰 섹션 — 세로 flex */
export const ReviewsSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

export const ReviewsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`;

/** 섹션 제목 */
export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;

  /* 리뷰 수 표시 span — 보조 텍스트 크기/색상 */
  span {
    font-weight: ${({ theme }) => theme.typography.fontNormal};
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.typography.textBase};
  }
`;

export const ReviewWriteButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  color: ${({ theme }) => theme.colors.textSecondary};
  background-color: transparent;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.gradients.primary};
    border-color: transparent;
    color: white;
    box-shadow: ${({ theme }) => theme.glows.primary};
  }

  ${({ $completed, theme }) =>
    $completed &&
    css`
      background-color: ${theme.colors.primaryLight};
      border-color: ${theme.colors.primary};
      color: ${theme.colors.primary};

      &:hover {
        background: ${theme.gradients.primary};
        border-color: transparent;
        color: white;
        box-shadow: ${theme.glows.primary};
      }
    `}
`;

/** 에러 상태 컨테이너 — 중앙 정렬 */
export const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  gap: ${({ theme }) => theme.spacing.md};
  text-align: center;
`;

/** 에러 제목 */
export const ErrorTitle = styled.h2`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textXl};
`;

/** 에러 설명 텍스트 */
export const ErrorDescription = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
`;
