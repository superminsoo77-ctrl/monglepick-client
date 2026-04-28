/**
 * TicketTab 컴포넌트 styled-components 정의.
 *
 * TicketTab.css의 모든 규칙을 styled-components로 이관한다.
 * BEM 클래스(.ticket-tab__*) → 개별 컴포넌트로 매핑.
 * SupportPage가 소유하는 공통 클래스(.support-page__section 등)는
 * JSX에서 그대로 유지하며, 해당 스타일은 SupportPage.css에서 관리한다.
 *
 * $status — transient prop (DOM에 전달하지 않음)
 *   - 티켓 상태(OPEN / IN_PROGRESS / RESOLVED / CLOSED)에 따라
 *     StatusBadge의 배경색과 글자색을 조건부로 적용한다.
 *
 * $over — transient prop (DOM에 전달하지 않음)
 *   - true 이면 글자수 카운터를 error 색상으로 강조한다.
 *
 * 공유 리소스:
 *   - media.js : media.tablet
 */

import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { media } from '../../../shared/styles/media';

/* ── 섹션 레이아웃 ── */

export const SectionWrapper = styled.section``;

export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const SectionTitleCount = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontNormal};
`;

export const Empty = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const EmptyIcon = styled.div`
  font-size: ${({ theme }) => theme.typography.text4xl};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  opacity: 0.5;
`;

export const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.textBase};
  margin: 0;
`;

/* ── 상태 배지 색상 매핑 헬퍼 ── */

/**
 * 티켓 상태에 따른 배경색을 반환한다.
 * @param {string} status - OPEN | IN_PROGRESS | RESOLVED | CLOSED
 * @param {Object} theme
 */
function statusBg(status, theme) {
  switch (status) {
    case 'OPEN':        return theme.colors.infoBg;
    case 'IN_PROGRESS': return theme.colors.warningBg;
    case 'RESOLVED':    return theme.colors.successBg;
    case 'CLOSED':      return 'rgba(85, 85, 112, 0.15)';
    default:            return 'transparent';
  }
}

/**
 * 티켓 상태에 따른 글자색을 반환한다.
 * @param {string} status - OPEN | IN_PROGRESS | RESOLVED | CLOSED
 * @param {Object} theme
 */
function statusColor(status, theme) {
  switch (status) {
    case 'OPEN':        return theme.colors.info;
    case 'IN_PROGRESS': return theme.colors.warning;
    case 'RESOLVED':    return theme.colors.success;
    case 'CLOSED':      return theme.colors.textMuted;
    default:            return theme.colors.textMuted;
  }
}

/* ── 로그인 유도 ── */

/**
 * 비인증 사용자에게 로그인을 유도하는 안내 박스.
 */
export const LoginPrompt = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
`;

/**
 * 로그인 유도 안내 텍스트.
 */
export const LoginPromptText = styled.p`
  font-size: ${({ theme }) => theme.typography.textBase};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
`;

/**
 * 로그인 페이지로 이동하는 링크 버튼.
 * react-router-dom Link를 styled로 감싼다.
 * hover 시 primaryHover 배경으로 전환.
 */
export const LoginPromptLink = styled(Link)`
  display: inline-block;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.md};
  color: white;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  text-decoration: none;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover};
  }
`;

/* ── 티켓 생성 성공 화면 ── */

/**
 * 문의 등록 성공 안내 박스.
 * 상단 테두리를 success 색상으로 강조.
 */
export const Success = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.success};
  border-radius: ${({ theme }) => theme.radius.md};
`;

/**
 * 성공 체크 아이콘 — success 색상 대형 텍스트.
 */
export const SuccessIcon = styled.div`
  font-size: ${({ theme }) => theme.typography.text4xl};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.success};
`;

/**
 * 성공 안내 제목.
 */
export const SuccessTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
`;

/**
 * 성공 안내 본문 텍스트.
 */
export const SuccessText = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
`;

/**
 * "새 문의하기" 버튼.
 * hover 시 primaryHover 배경으로 전환.
 */
export const SuccessBtn = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.primary};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  color: white;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover};
  }
`;

/* ── 문의 등록 폼 ── */

/**
 * 문의 등록 폼 컨테이너 — glass-card 스타일.
 * 태블릿(768px) 이하에서 패딩을 md로 줄인다.
 */
export const Form = styled.form`
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: blur(8px) saturate(1.4);
  -webkit-backdrop-filter: blur(8px) saturate(1.4);
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.lg};

  ${media.tablet} {
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

/**
 * 폼 필드 그룹 — 라벨 + 입력 요소 + 에러/힌트 메시지를 묶는 컨테이너.
 */
export const FormGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

/**
 * 폼 필드 라벨.
 */
export const FormLabel = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

/**
 * 필수 입력 표시 별표(*).
 * error 색상으로 강조.
 */
export const FormRequired = styled.span`
  color: ${({ theme }) => theme.colors.error};
  margin-left: 2px;
`;

/**
 * 카테고리 선택 드롭다운.
 * 커스텀 화살표 SVG를 배경 이미지로 삽입한다.
 * 포커스 시 primary 테두리 + glow 효과.
 */
export const FormSelect = styled.select`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  padding-right: ${({ theme }) => theme.spacing.xl};
  background-color: ${({ theme }) => theme.colors.bgInput};
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238888a0' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right ${({ theme }) => theme.spacing.sm} center;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textBase};
  outline: none;
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast};
  appearance: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.glows.primary};
  }
`;

/**
 * 제목 입력 필드.
 * 포커스 시 primary 테두리 + glow 효과.
 */
export const FormInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.bgInput};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textBase};
  outline: none;
  transition: border-color ${({ theme }) => theme.transitions.fast};
  box-sizing: border-box;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.glows.primary};
  }
`;

/**
 * 내용 입력 텍스트에어리어.
 * 최소 높이 150px, 세로 방향으로만 리사이즈 허용.
 * 포커스 시 primary 테두리 + glow 효과.
 */
export const FormTextarea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.bgInput};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textBase};
  font-family: inherit;
  outline: none;
  resize: vertical;
  transition: border-color ${({ theme }) => theme.transitions.fast};
  box-sizing: border-box;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.glows.primary};
  }
`;

/**
 * 폼 힌트 텍스트 — 입력 규칙 안내 (xs, muted).
 */
export const FormHint = styled.p`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

/**
 * 폼 에러 메시지 — 유효성 실패 시 표시 (xs, error).
 */
export const FormError = styled.p`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.error};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

/**
 * 글자수 카운터 행 — 우측 정렬.
 *
 * $over 가 true 이면 error 색상으로 강조한다.
 */
export const CharCount = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: right;
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

/**
 * 글자수 카운터의 현재값 span.
 *
 * $over 가 true 이면 error 색상으로 강조한다.
 */
export const CharCountValue = styled.span`
  color: ${({ $over, theme }) =>
    $over ? theme.colors.error : theme.colors.textMuted};
`;

/**
 * 폼 제출 버튼 — 전체 너비, gradient 배경.
 * hover 시 glow + translateY(-1px).
 * disabled 시 opacity 0.5 + 커서 변경.
 */
export const SubmitBtn = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.gradients.primary};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  color: white;
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    box-shadow: ${({ theme }) => theme.glows.primary};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* ── 티켓 목록 ── */

/**
 * 티켓 목록 컨테이너 — 세로 방향 flex, sm 간격.
 */
export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/**
 * 개별 티켓 항목 — 정보(좌)와 상태 배지(우)를 가로로 배치.
 * 태블릿(768px) 이하에서 세로 방향으로 전환하고,
 * 상태 배지는 align-self: flex-start 로 왼쪽 정렬.
 *
 * 부모에서 `as="button"` 과 `$clickable` transient prop 을 함께 넘겨
 * 클릭 가능한 카드로 사용할 수 있다. 이 때:
 *   - 브라우저 기본 button 스타일을 reset 해 div 와 동일한 외형 유지
 *   - hover 시 primary 테두리 + glow 로 클릭 가능함을 시각적으로 알림
 *   - keyboard focus 링 노출
 */
export const Item = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.md};
  gap: ${({ theme }) => theme.spacing.sm};
  /* as="button" 으로 렌더링될 때 기본 스타일 reset — div 외형과 동일하게 맞춤 */
  width: 100%;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  transition: border-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast},
    transform ${({ theme }) => theme.transitions.fast};

  ${({ $clickable, theme }) =>
    $clickable &&
    `
    &:hover {
      border-color: ${theme.colors.primary};
      box-shadow: ${theme.glows.primary};
      transform: translateY(-1px);
    }

    &:focus-visible {
      outline: 2px solid ${theme.colors.primary};
      outline-offset: 2px;
    }
  `}

  ${media.tablet} {
    flex-direction: column;
    align-items: flex-start;
  }
`;

/**
 * 티켓 정보 영역 — 제목 + 메타 정보.
 * min-width: 0 으로 자식 텍스트 overflow 처리 허용.
 */
export const ItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

/**
 * 티켓 제목 텍스트.
 * 한 줄로 고정하고 말줄임 처리.
 */
export const ItemTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.xs} 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * 티켓 메타 정보 행 — 카테고리 배지 + 날짜.
 */
export const ItemMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

/**
 * 티켓 카테고리 배지 — primary 계열 pill 형태.
 */
export const ItemCategoryBadge = styled.span`
  padding: 2px ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

/**
 * 티켓 등록 날짜 텍스트.
 */
export const ItemDate = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/**
 * 티켓 상태 배지.
 *
 * $status prop(OPEN / IN_PROGRESS / RESOLVED / CLOSED)에 따라
 * 배경색과 글자색을 동적으로 결정한다.
 * 태블릿(768px) 이하에서 align-self: flex-start 로 왼쪽 정렬.
 */
export const StatusBadge = styled.span`
  flex-shrink: 0;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  background-color: ${({ $status, theme }) => statusBg($status, theme)};
  color: ${({ $status, theme }) => statusColor($status, theme)};

  ${media.tablet} {
    align-self: flex-start;
  }
`;

/* ── 페이지네이션 ── */

/**
 * 페이지네이션 컨테이너 — 가운데 정렬.
 */
export const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

/**
 * 이전/다음 페이지 버튼.
 * hover 시 primary 테두리 + 글자색 전환.
 * disabled 시 opacity 0.4 + 커서 변경.
 */
export const PaginationBtn = styled.button`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textSm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

/**
 * 현재 페이지 / 전체 페이지 표시 텍스트.
 */
export const PaginationInfo = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;
