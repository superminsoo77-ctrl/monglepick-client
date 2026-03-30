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

/* SearchPage는 640px 전용 브레이크포인트를 사용하므로 media.js(480/768)와 별도로 로컬 정의 */
const mediaSmall = '@media (max-width: 640px)';

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
      box-shadow: 0 0 15px rgba(124, 108, 240, 0.3);

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
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;

  strong {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: ${({ theme }) => theme.typography.fontSemibold};
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
