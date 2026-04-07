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
