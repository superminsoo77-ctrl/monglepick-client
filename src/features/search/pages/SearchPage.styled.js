/**
 * SearchPage 스타일 정의 (styled-components).
 *
 * gradient-text 제목 + glass 검색바(포커스 글로우) +
 * 활성 장르 그라데이션 배경 ($active prop) +
 * 결과 영역 배경 gradient-glow (::before pseudo-element) +
 * 반응형: 640px 이하 검색바 세로 전환.
 *
 * gradientShift, gradientText는 shared/styles에서 import한다.
 */

import styled, { css } from 'styled-components';
import { gradientText } from '../../../shared/styles/mixins';
import { media } from '../../../shared/styles/media';

/* media.js의 tablet(768px)로 통일 — 기존 640px보다 넓은 범위에서 반응형 적용 */
const mediaSmall = media.tablet;

/**
 * 페이지 최상위 컨테이너.
 * 전체 너비 + 상하좌우 패딩.
 */
export const Wrapper = styled.div`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
  position: relative;
`;

/**
 * 내부 컨테이너 — 최대 너비 contentMaxWidth, 세로 flex.
 */
export const Inner = styled.div`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  position: relative;
  z-index: 1;
`;

/**
 * 페이지 제목 — gradientText mixin (보라→시안→블루 + gradientShift).
 */
export const Title = styled.h1`
  ${gradientText}
  font-size: ${({ theme }) => theme.typography.text3xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  margin: 0;
`;

/**
 * 검색 폼 — 전체 너비.
 */
export const Form = styled.form`
  width: 100%;
`;

/**
 * 입력 래퍼 — 검색타입 + 인풋 + 버튼 가로 배치.
 * 640px 이하에서 세로로 전환(align-items: stretch).
 */
export const InputWrap = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;

  ${mediaSmall} {
    flex-direction: column;
    align-items: stretch;
  }
`;

/**
 * 검색 대상 셀렉트 래퍼 — 커스텀 화살표 포지셔닝용.
 */
export const SearchTypeWrap = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;

  ${mediaSmall} {
    width: 100%;
  }
`;

/**
 * 검색 대상 셀렉트 — glass 스타일, 통합검색/제목/감독/출연진 선택.
 */
export const SearchTypeSelect = styled.select`
  height: 48px;
  padding: 0 ${({ theme }) => theme.spacing.xl} 0 ${({ theme }) => theme.spacing.md};
  padding-right: calc(${({ theme }) => theme.spacing.xl} + ${({ theme }) => theme.spacing.sm});
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: ${({ theme }) => theme.glass.blur};
  -webkit-backdrop-filter: ${({ theme }) => theme.glass.blur};
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textSm};
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  min-width: 110px;
  transition: border-color ${({ theme }) => theme.transitions.fast},
              box-shadow ${({ theme }) => theme.transitions.fast};

  &:hover,
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.glows.primary};
    outline: none;
  }

  ${mediaSmall} {
    width: 100%;
  }
`;

/** 검색 대상 커스텀 화살표 — 셀렉트 오른쪽 절대 위치. */
export const SearchTypeArrow = styled.span`
  position: absolute;
  right: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  pointer-events: none;
  font-size: ${({ theme }) => theme.typography.textSm};
`;

/**
 * 검색 입력 필드 래퍼 — 아이콘 + 인풋을 감싸는 relative 컨테이너.
 */
export const InputField = styled.div`
  flex: 1;
  position: relative;
  min-width: 0;
`;

/**
 * 검색 아이콘 — 입력창 왼쪽 절대 위치.
 */
export const InputIcon = styled.span`
  position: absolute;
  left: ${({ theme }) => theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  font-size: ${({ theme }) => theme.typography.textLg};
  z-index: 1;
  pointer-events: none;
  line-height: 1;
`;

/**
 * 검색 입력 필드 — glass 스타일 + 포커스 글로우.
 * padding-left: 44px 으로 아이콘 공간 확보.
 */
export const Input = styled.input`
  width: 100%;
  height: 48px;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  padding-left: 44px;
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: ${({ theme }) => theme.glass.blur};
  -webkit-backdrop-filter: ${({ theme }) => theme.glass.blur};
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textBase};
  transition: border-color ${({ theme }) => theme.transitions.fast},
              box-shadow ${({ theme }) => theme.transitions.fast};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.glows.primary};
    outline: none;
  }
`;

/**
 * 자동완성 레이어.
 * 입력창 바로 아래에 떠서 추천 검색어를 빠르게 고를 수 있게 한다.
 */
export const AutocompletePanel = styled.div`
  position: absolute;
  top: calc(100% + ${({ theme }) => theme.spacing.xs});
  left: 0;
  right: 0;
  z-index: 20;
  padding: ${({ theme }) => theme.spacing.xs};
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

/**
 * 자동완성 목록.
 * 검색어 후보를 세로 리스트로 정렬한다.
 */
export const AutocompleteList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
`;

/**
 * 자동완성 개별 항목.
 */
export const AutocompleteItem = styled.li`
  width: 100%;
`;

/**
 * 자동완성 선택 버튼.
 * 키보드/마우스 선택 상태를 모두 같은 시각 언어로 보여준다.
 *
 * @prop {boolean} $active - 현재 강조된 후보 여부
 */
export const AutocompleteButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ $active, theme }) => ($active ? theme.colors.bgTertiary : 'transparent')};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textSm};
  text-align: left;
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast},
              color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.bgTertiary};
  }
`;

/**
 * 자동완성 안내 문구.
 * 로딩 중이거나 후보가 없을 때 입력창 아래에 짧게 노출한다.
 */
export const AutocompleteMessage = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

export const AutocompleteDidYouMeanWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};

  ${mediaSmall} {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const AutocompleteDidYouMeanLabel = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

export const AutocompleteDidYouMeanButton = styled.button`
  padding: 8px 14px;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: transform ${({ theme }) => theme.transitions.fast},
              box-shadow ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.glows.primary};
  }
`;

/**
 * 검색 버튼 — gradient 배경.
 * 640px 이하에서 전체 너비.
 * 비활성(:disabled) 시 opacity 0.6.
 */
export const SearchButton = styled.button`
  height: 48px;
  padding: 0 ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.gradients.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  &:hover:not(:disabled) {
    box-shadow: ${({ theme }) => theme.glows.primary};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  ${mediaSmall} {
    width: 100%;
  }
`;

/**
 * 상세 검색 모달을 여는 보조 버튼.
 * 검색 버튼 옆에 배치되며, 활성 필터 수를 함께 표시할 수 있다.
 */
export const FilterActionButton = styled.button`
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: 0 ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  white-space: nowrap;
  transition: border-color ${({ theme }) => theme.transitions.fast},
              color ${({ theme }) => theme.transitions.fast},
              box-shadow ${({ theme }) => theme.transitions.fast},
              background-color ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textPrimary};
    background-color: ${({ theme }) => theme.colors.bgTertiary};
    box-shadow: ${({ theme }) => theme.glows.primary};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  ${mediaSmall} {
    width: 100%;
  }
`;

export const FilterActionCount = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
`;

export const RecentSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  background: transparent;
  backdrop-filter: ${({ theme }) => theme.glass.blur};
  -webkit-backdrop-filter: ${({ theme }) => theme.glass.blur};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radius.xl};
`;

export const RecentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

export const RecentTitle = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

/**
 * 최근 검색 기록 모달을 여는 액션 버튼.
 * 인라인 목록 대신 별도 팝업으로 전체 기록을 열어 본다.
 */
export const RecentActionButton = styled.button`
  padding: 8px 14px;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast},
              color ${({ theme }) => theme.transitions.fast},
              box-shadow ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textPrimary};
    background-color: ${({ theme }) => theme.colors.bgTertiary};
  }
`;

/**
 * 검색창 아래에 보여주는 최근 검색 기록 미리보기 빈 상태.
 */
export const RecentPreviewEmpty = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/**
 * 최근 검색 기록 미리보기 목록.
 * 전체보기 전에는 최대 5개만 칩 형태로 보여준다.
 */
export const RecentPreviewList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/**
 * 최근 검색 기록 미리보기 개별 항목.
 */
export const RecentPreviewItem = styled.li`
  min-width: 0;
`;

/**
 * 최근 검색 기록 미리보기 버튼.
 * 검색창 아래에서 빠르게 재검색할 수 있도록 칩 스타일을 사용한다.
 */
export const RecentPreviewButton = styled.button`
  max-width: 220px;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast},
              transform ${({ theme }) => theme.transitions.fast},
              box-shadow ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.glows.primary};
    transform: translateY(-1px);
  }
`;

/**
 * 최근 검색 기록 미리보기 키워드.
 */
export const RecentPreviewKeyword = styled.span`
  display: block;
  width: 100%;
  color: ${({ $isGenreHistory, theme }) => (
    $isGenreHistory ? theme.colors.primaryDark : theme.colors.textPrimary
  )};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/**
 * 최근 검색 기록 모달 오버레이.
 * 배경 클릭으로 모달을 닫을 수 있다.
 */
export const RecentModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.bgOverlay};
  z-index: ${({ theme }) => theme.zIndex.modalBackdrop};
`;

/**
 * 최근 검색 기록 모달 컨테이너.
 * 모바일에서도 자연스럽게 보이도록 너비와 높이를 제한한다.
 */
export const RecentModalContainer = styled.div`
  width: min(720px, 100%);
  max-height: min(78vh, 720px);
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  overflow: hidden;
  z-index: ${({ theme }) => theme.zIndex.modal};
`;

/**
 * 최근 검색 기록 모달 상단 헤더.
 * 제목과 닫기 버튼을 양 끝에 배치한다.
 */
export const RecentModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/**
 * 최근 검색 기록 모달 우측 액션 영역.
 * 전체삭제와 닫기 버튼을 한 줄로 정렬한다.
 */
export const RecentModalActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/**
 * 최근 검색 기록 모달 제목.
 */
export const RecentModalTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

/**
 * 최근 검색 기록 모달 닫기 버튼.
 */
export const RecentModalCloseButton = styled.button`
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.bgSecondary};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textBase};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast},
              color ${({ theme }) => theme.transitions.fast},
              background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textPrimary};
    background: ${({ theme }) => theme.colors.bgTertiary};
  }
`;

/**
 * 최근 검색 기록 전체삭제 버튼.
 * 파괴적 액션이므로 경고 계열 색을 사용한다.
 */
export const RecentModalDangerButton = styled.button`
  padding: 8px 14px;
  border: 1px solid ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.errorBg};
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: opacity ${({ theme }) => theme.transitions.fast},
              transform ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

/**
 * 최근 검색 기록 모달 안내 문구.
 */
export const RecentModalDescription = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/**
 * 최근 검색 기록 모달 본문.
 * 내부 스크롤로 30개 단위 추가 로드를 트리거한다.
 */
export const RecentModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding-right: ${({ theme }) => theme.spacing.xs};
`;

/**
 * 최근 검색 기록의 공통 빈 상태/로딩 텍스트.
 */
export const RecentEmpty = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
`;

/**
 * 최근 검색 기록 모달 목록.
 * 한 줄에 검색어 1개씩 세로로 배치한다.
 */
export const RecentModalList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/**
 * 최근 검색 기록 모달 개별 항목.
 */
export const RecentModalItem = styled.li`
  min-width: 0;
`;

/**
 * 최근 검색 기록 모달 한 줄 레이아웃.
 * 왼쪽은 검색어/시간, 오른쪽은 삭제 버튼을 배치한다.
 */
export const RecentModalRow = styled.div`
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ theme }) => theme.colors.bgCard};
  transition: border-color ${({ theme }) => theme.transitions.fast},
              box-shadow ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.glows.primary};
  }
`;

/**
 * 최근 검색 기록 모달 왼쪽 정보 버튼.
 * 클릭 시 해당 키워드로 즉시 재검색한다.
 */
export const RecentModalKeywordButton = styled.button`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
`;

/**
 * 최근 검색 기록 모달의 메인 키워드 텍스트.
 */
export const RecentModalKeyword = styled.span`
  width: 100%;
  color: ${({ $isGenreHistory, theme }) => (
    $isGenreHistory ? theme.colors.primaryDark : theme.colors.textPrimary
  )};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/**
 * 최근 검색 기록 모달의 검색 시각 텍스트.
 * 키워드 바로 아래에 작은 보조 텍스트로 표시한다.
 */
export const RecentModalMeta = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textXs};
`;

/**
 * 최근 검색 기록 개별 삭제 버튼.
 * 행의 오른쪽에 고정해 한 건만 빠르게 제거할 수 있게 한다.
 */
export const RecentDeleteButton = styled.button`
  flex-shrink: 0;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.bgSecondary};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast},
              color ${({ theme }) => theme.transitions.fast},
              opacity ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.error};
    color: ${({ theme }) => theme.colors.error};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

/**
 * 최근 검색 기록 모달 하단 상태 문구.
 * 추가 로딩 중이거나 마지막 페이지 도달 시 안내 메시지를 보여준다.
 */
export const RecentStatus = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
`;

/**
 * 상세 검색 모달 오버레이/컨테이너.
 * 기존 아코디언 내용을 모달로 옮겨 검색창 주변 공간을 단순화한다.
 */
export const FilterModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.bgOverlay};
  z-index: ${({ theme }) => theme.zIndex.modalBackdrop};
`;

export const FilterModalContainer = styled.div`
  width: min(760px, 100%);
  max-height: min(82vh, 860px);
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  overflow: hidden;
  z-index: ${({ theme }) => theme.zIndex.modal};
`;

export const FilterModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const FilterModalHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;
`;

export const FilterModalTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontBold};
`;

export const FilterModalDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

export const FilterModalCloseButton = styled.button`
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.bgSecondary};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textBase};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast},
              color ${({ theme }) => theme.transitions.fast},
              background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textPrimary};
    background: ${({ theme }) => theme.colors.bgTertiary};
  }
`;

export const FilterModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding-right: ${({ theme }) => theme.spacing.xs};
`;

export const FilterAccordion = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.bgCard};
`;

export const FilterAccordionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`;

export const FilterAccordionHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const FilterAccordionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
`;

export const FilterAccordionSummary = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

export const FilterAccordionToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: 8px 14px;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.bgSecondary};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast},
              color ${({ theme }) => theme.transitions.fast},
              box-shadow ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.glows.primary};
  }
`;

export const FilterAccordionIcon = styled.span`
  display: inline-flex;
  transition: transform ${({ theme }) => theme.transitions.fast};
  transform: rotate(${({ $expanded }) => ($expanded ? '0deg' : '-90deg')});
`;

export const FilterAccordionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.sm};
`;

export const FilterSectionDivider = styled.div`
  width: 100%;
  height: 1px;
  background: ${({ theme }) => theme.colors.borderLight};
`;

export const AdvancedFilterSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const AdvancedFilterHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const AdvancedFilterTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
`;

export const AdvancedFilterDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

export const AdvancedFilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  ${mediaSmall} {
    grid-template-columns: 1fr;
  }
`;

export const AdvancedFilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const AdvancedFilterLabel = styled.label`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
`;

export const AdvancedFilterRange = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
`;

export const AdvancedFilterDivider = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
  text-align: center;
`;

export const AdvancedFilterInput = styled.input`
  width: 100%;
  min-width: 0;
  height: 44px;
  padding: 0 ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.bgSecondary};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textSm};
  transition: border-color ${({ theme }) => theme.transitions.fast},
              box-shadow ${({ theme }) => theme.transitions.fast};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.glows.primary};
    outline: none;
  }
`;

export const AdvancedFilterActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

export const AdvancedFilterApplyButton = styled.button`
  padding: 10px 18px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.gradients.primary};
  color: white;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: opacity ${({ theme }) => theme.transitions.fast},
              transform ${({ theme }) => theme.transitions.fast},
              box-shadow ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.glows.primary};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const AdvancedFilterResetButton = styled.button`
  padding: 10px 18px;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.bgSecondary};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast},
              color ${({ theme }) => theme.transitions.fast},
              opacity ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const AdvancedFilterError = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

/**
 * 텍스트 검색 없이 장르만 선택할 때 사용하는 전용 섹션.
 * 기존 단일 장르 필터와 다른 역할이라 시각적으로 분리한다.
 */
export const SearchGenreSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const SearchGenreHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

/**
 * 장르 발견형 검색 섹션 제목.
 */
export const SearchGenreTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
`;

/**
 * 장르 발견형 검색 섹션 안내 문구.
 */
export const SearchGenreDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

export const SearchGenreModeSwitch = styled.button`
  padding: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: opacity ${({ theme }) => theme.transitions.fast},
              text-decoration-color ${({ theme }) => theme.transitions.fast};
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 3px;

  &:hover {
    opacity: 0.85;
    text-decoration-color: currentColor;
  }
`;

/**
 * 장르 발견형 검색의 빈 상태/로딩 문구.
 */
export const SearchGenreEmpty = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

/**
 * 장르 발견형 검색 블록 내부 묶음.
 * 주 장르와 세부 장르 영역을 같은 카드 안에서 자연스럽게 구분한다.
 */
export const SearchGenreGroups = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

/**
 * 장르 발견형 검색 토글 목록.
 * CSV 기준 장르 수가 많아 여러 줄로 자연스럽게 감싼다.
 */
export const SearchGenreGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/**
 * 장르 발견형 검색 토글 버튼.
 * 여러 개를 동시에 선택할 수 있어 기존 단일 장르 필터와 다른 시각 언어를 사용한다.
 *
 * @prop {boolean} $active - 선택 여부
 */
export const SearchGenreToggle = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ theme }) => theme.colors.bgSecondary};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast},
              color ${({ theme }) => theme.transitions.fast},
              background-color ${({ theme }) => theme.transitions.fast},
              transform ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textPrimary};
    transform: translateY(-1px);
  }

  ${({ $active, theme }) =>
    $active &&
    css`
      background: ${theme.gradients.primary};
      border-color: transparent;
      color: white;
      box-shadow: ${theme.glows.primary};
    `}
`;

/**
 * 세부 장르 영역.
 * 구분선 아래에 토글 텍스트와 세부 장르 목록이 이어지도록 묶는다.
 */
export const SearchGenreDetailSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.xs};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

/**
 * 세부 장르 토글 텍스트.
 * 구분선 바로 아래의 문구 자체를 클릭해 펼침/닫기를 전환한다.
 */
export const SearchGenreDetailToggle = styled.button`
  align-self: flex-start;
  padding: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

/**
 * 필터 영역 (장르 + 정렬) — space-between 가로 배치, flex-wrap.
 */
export const Filters = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`;

/**
 * 텍스트 검색이 없을 때 필터 영역의 좌측 자리를 차지하는 공간.
 * 정렬 셀렉트가 오른쪽에 안정적으로 붙도록 유지한다.
 */
export const FilterSpacer = styled.div`
  flex: 1;
  min-width: 0;
`;

/**
 * 장르 필터 버튼 묶음 — flex-wrap.
 */
export const Genres = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/**
 * 장르 필터 버튼.
 *
 * $active prop이 true이면 gradient 배경 + 글로우 활성 스타일을 적용한다.
 *
 * @prop {boolean} $active - 선택된 장르 여부
 */
export const GenreButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textSecondary};
  background-color: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.primaryLight};
  }

  /* 활성 장르 — gradient 배경 + 글로우 */
  ${({ $active, theme }) =>
    $active &&
    css`
      background: ${theme.gradients.primary};
      border-color: transparent;
      color: white;
      box-shadow: ${theme.shadows.glow};

      &:hover {
        background: ${theme.gradients.primary};
        color: white;
        box-shadow: ${theme.glows.primary};
      }
    `}
`;

/**
 * 정렬 영역 래퍼 (커스텀 셀렉트 포지셔닝용).
 */
export const SortWrap = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
`;

/**
 * 정렬 셀렉트 — appearance: none으로 네이티브 화살표 제거.
 * padding-right에 커스텀 화살표 공간 확보.
 */
export const SortSelect = styled.select`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.xl}
           ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  min-width: 120px;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:hover,
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    outline: none;
  }
`;

/** 커스텀 화살표 아이콘 — 셀렉트 오른쪽에 절대 위치. */
export const SortArrow = styled.span`
  position: absolute;
  right: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  pointer-events: none;
  font-size: ${({ theme }) => theme.typography.textSm};
`;

/**
 * 검색 결과 영역 — 세로 flex.
 * ::before pseudo-element로 배경 gradient-glow 렌더링.
 */
export const Results = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  position: relative;

  /* 배경 glow — radial gradient, 중앙 배치 */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    height: 400px;
    background: ${({ theme }) => theme.gradients.glow};
    pointer-events: none;
    opacity: 0.3;
    z-index: -1;
  }
`;

/** 결과 건수 텍스트 — muted 색상, strong 태그 Primary 강조. */
export const ResultCount = styled.p`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;

  strong {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: ${({ theme }) => theme.typography.fontSemibold};
  }
`;

export const SearchSuggestionBanner = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.bgCard};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

export const SearchSuggestionTitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
`;

export const SearchSuggestionActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const SearchSuggestionChip = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.bgSecondary};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast},
              transform ${({ theme }) => theme.transitions.fast},
              box-shadow ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.glows.primary};
    transform: translateY(-1px);
  }
`;

/**
 * 스켈레톤 그리드 — 로딩 중 카드 6개 표시.
 * 640px 이하에서 minmax(140px) 으로 전환.
 */
export const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};

  ${mediaSmall} {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

/**
 * 추가 로딩용 스켈레톤 그리드.
 * 기존 MovieList 아래에 자연스럽게 이어지는 카드 로딩 표시로 사용한다.
 */
export const LoadMoreGrid = styled(SkeletonGrid)`
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

/**
 * 무한 스크롤 감지를 위한 sentinel 요소.
 * 화면에는 거의 보이지 않지만 IntersectionObserver의 타겟이 된다.
 */
export const LoadMoreSentinel = styled.div`
  width: 100%;
  height: 1px;
`;
