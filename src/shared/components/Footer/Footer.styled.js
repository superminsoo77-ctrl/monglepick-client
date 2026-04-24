/**
 * Footer styled-components.
 *
 * 2026-04-23 v3 개편 — 법적·크레딧 중심 3영역 구조.
 *   v2: [브랜드 2fr | 서비스 1fr | 계정 1fr | 팀정보 1fr]
 *   v3: [브랜드 2fr | 데이터 제공 1fr | 약관/정책 1fr] + 하단 사업자/저작권 row
 *
 * 헤더 NAV / 유저 드롭다운과 중복되던 서비스·계정 컬럼을 제거하고,
 * 외부 API attribution + 법적 정책 링크라는 푸터 고유 정보만 남겼다.
 *
 * glassmorphism 배경 + 로고 gradient-text + 링크 호버 글로우는 유지.
 * 모바일에서는 1컬럼 스택으로 전환된다.
 */

import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { gradientText } from '../../styles/mixins';
import { media } from '../../styles/media';

/**
 * 푸터 전체 컨테이너 — 글래스 배경.
 *
 * 2026-04-23 크기 축소:
 *   상단 패딩 xxl(40px) → lg(16px), 하단 lg → md(12px) 로 감소.
 *   전체 높이를 약 40% 단축하여 스크롤 말미의 공간 낭비 최소화.
 */
export const FooterWrapper = styled.footer`
  width: 100%;
  background-color: ${({ theme }) => theme.footer.bg};
  backdrop-filter: blur(12px) saturate(1.4);
  -webkit-backdrop-filter: blur(12px) saturate(1.4);
  border-top: none;
  padding: ${({ theme }) => `${theme.spacing.lg} 0 ${theme.spacing.md}`};
  margin-top: auto;
  position: relative;

  /* 상단 그라데이션 구분선 (border-top 대체) */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: ${({ theme }) => theme.gradients.primary};
    opacity: 0.5;
  }
`;

/**
 * 내부 레이아웃.
 * 2026-04-23 크기 축소 — 수직 블록 간격 lg(16px) → md(12px).
 */
export const Inner = styled.div`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

/**
 * 3컬럼 레이아웃 — [브랜드 / 데이터 제공 / 약관·정책].
 *
 * 데스크톱: 2fr 1fr 1fr — 브랜드 영역을 두 배 너비로 강조.
 * 태블릿(<=768px): 단일 컬럼 스택 (3컬럼이 한 줄에 빡빡해지는 지점).
 * 모바일(<=480px): 단일 컬럼 스택 + 중앙 정렬.
 *
 * 2026-04-23 크기 축소 — 컬럼 간 gap xxl(40px) → xl(32px), 태블릿 xl → lg(16px).
 */
export const Columns = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.xl};

  ${media.tablet} {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.lg};
  }

  ${media.mobile} {
    gap: ${({ theme }) => theme.spacing.lg};
    text-align: center;
  }
`;

/**
 * 브랜드 영역 (좌측).
 * 2026-04-23 크기 축소 — 로고 아이콘도 32→28px 로 약간 감소.
 */
export const Brand = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};

  ${media.mobile} {
    align-items: center;
  }
`;

/**
 * 로고 링크.
 * 2026-04-23 크기 축소 — 로고 하단 여백 sm(8px) → xs(4px).
 */
export const LogoLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  text-decoration: none;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

/** 로고 아이콘 (몽글 캐릭터 이미지) — 28×28 로 축소 */
export const LogoIcon = styled.img`
  width: 28px;
  height: 28px;
  object-fit: contain;
  flex-shrink: 0;
`;

/** 로고 텍스트 — 그라데이션 텍스트 */
export const LogoText = styled.span`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  ${gradientText}
`;

/** 설명 텍스트 */
export const Desc = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
  line-height: ${({ theme }) => theme.typography.leadingRelaxed};
`;

/**
 * 브랜드 영역 하단 연락 이메일 — mailto 링크.
 *
 * 기존 TeamEmail(<p>) → 클릭 가능한 <a> 로 격상.
 * 단일 진입점으로 노출되므로 본문 텍스트보다 살짝 강조한다.
 */
export const ContactEmail = styled.a`
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

/**
 * 일반 섹션 컨테이너 (데이터 제공 / 약관·정책 공통).
 *
 * 기존 Nav / Team 을 하나로 통합 — column flex + 태블릿 이하에서 좌측 정렬 유지,
 * 모바일에서만 중앙 정렬로 전환.
 * 2026-04-23 크기 축소 — 항목 간 gap sm(8px) → xs(4px).
 */
export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};

  ${media.mobile} {
    align-items: center;
  }
`;

/**
 * 섹션 제목.
 * 2026-04-23 크기 축소 — 하단 여백 xs(4px) → 0 (Section gap 이 이미 처리).
 */
export const SectionTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.xs} 0;
`;

/**
 * 내부 라우터 링크 — 호버 시 글로우 효과.
 * 2026-04-23 크기 축소 — line-height relaxed → normal 로 타이트하게.
 */
export const NavLink = styled(Link)`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;
  transition: color ${({ theme }) => theme.transitions.fast},
    text-shadow ${({ theme }) => theme.transitions.fast};
  line-height: ${({ theme }) => theme.typography.leadingNormal};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    text-shadow: ${({ theme }) => theme.shadows.glow};
  }
`;

/**
 * 외부 링크 (TMDB / KMDb / KOBIS 등) — 새 탭 열기.
 *
 * NavLink 와 시각적으로 동일하지만 `<a target="_blank">` 로 컴포넌트 분리.
 * 외부 이동 힌트를 명시하기 위해 호버 시 살짝 primary 색으로 전환 + 밑줄.
 * 2026-04-23 크기 축소 — NavLink 와 동일한 line-height 조정.
 */
export const ExternalLink = styled.a`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;
  transition: color ${({ theme }) => theme.transitions.fast},
    text-shadow ${({ theme }) => theme.transitions.fast};
  line-height: ${({ theme }) => theme.typography.leadingNormal};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    text-shadow: ${({ theme }) => theme.shadows.glow};
    text-decoration: underline;
    text-underline-offset: 3px;
  }
`;

/**
 * TMDB attribution disclaimer 문구 — 외부 API 이용 의무 표기.
 *
 * 본문 링크보다 한 단계 약한 색(textMuted) + xs 폰트.
 * 시각적으로는 참고 주석 느낌이지만, TMDB 약관상 반드시 노출되어야 한다.
 * 2026-04-23 크기 축소 — relaxed → normal line-height, 상단 마진 xs → 0 (Section gap 흡수).
 */
export const CreditNote = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: ${({ theme }) => theme.typography.leadingNormal};
  max-width: 260px;

  ${media.tablet} {
    max-width: none;
  }

  ${media.mobile} {
    text-align: center;
  }
`;

/** 구분선 — 그라데이션 */
export const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: ${({ theme }) => theme.gradients.primary};
  opacity: 0.3;
`;

/**
 * 구분선 아래 — 사업자 정보(좌) + 저작권(우) 한 줄 레이아웃.
 *
 * 데스크톱: space-between 으로 양 끝 배치.
 * 모바일: 세로 스택 + 중앙 정렬 (정보 우선, 저작권 아래).
 */
export const LegalRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;

  ${media.mobile} {
    flex-direction: column;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.xs};
    text-align: center;
  }
`;

/**
 * 사업자 정보 블록 (좌측) — 인라인으로 여러 항목을 구분선(`|`) 으로 나열.
 *
 * 상용화 전까지는 팀명 + 이메일 2항목만 표기하고,
 * 상용화 시 상호/대표/사업자등록번호/통신판매업신고번호 등을 이 줄에 덧붙인다.
 */
export const LegalInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};

  ${media.mobile} {
    justify-content: center;
  }
`;

/** 사업자 정보 구분자 `|` — 투명도 낮춰 시각적 노이즈 감소 */
export const LegalDivider = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  opacity: 0.5;
`;

/** 저작권 — 단일 라인 */
export const Copyright = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;
