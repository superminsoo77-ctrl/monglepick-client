/**
 * HomePage styled-components.
 *
 * HomePage.css의 모든 스타일을 styled-components로 이관한다.
 * 히어로 섹션 (floating orb + gradient-text + fadeInUp),
 * 추천 질문 카드 (glass-card + shine + stagger),
 * 인기 영화 그리드 섹션.
 */

import styled, { css } from 'styled-components';
import { fadeInUp, floatUpDown } from '../../../shared/styles/animations';
import { glassCard, gradientText } from '../../../shared/styles/mixins';
import { media } from '../../../shared/styles/media';

/* ── 페이지 전체 컨테이너 ──
 * position: relative — 내부에서 position: absolute 로 배치되는 SideSlideBanner
 * (좌측상단 고정 배너) 의 기준 컨테이너. Wrapper 바깥으로 튀어나가지 않고
 * 스크롤에 따라 함께 올라가도록 만드는 역할.
 */
export const Wrapper = styled.div`
  width: 100%;
  position: relative;
`;

/* ── 히어로 섹션 — floating orb 배경 ── */
export const Hero = styled.section`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 520px;
  padding: ${({ theme }) => theme.spacing.xxxl} ${({ theme }) => theme.spacing.lg};
  overflow: hidden;

  ${media.tablet} {
    min-height: 400px;
    padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.lg};
  }
`;

/* 히어로 콘텐츠 — 중앙 정렬 + fadeInUp 등장 */
export const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: ${({ theme }) => theme.spacing.lg};
  max-width: 640px;
  animation: ${fadeInUp} 0.6s ease forwards;
`;

/* 배지 — 글래스 스타일 */
export const HeroBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: ${({ theme }) => theme.glass.blur};
  -webkit-backdrop-filter: ${({ theme }) => theme.glass.blur};
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

/* 배지 아이콘 이미지 */
export const HeroBadgeIcon = styled.img`
  width: 24px;
  height: 24px;
  object-fit: contain;
  flex-shrink: 0;
`;

/* 타이틀 */
export const HeroTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.text4xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.3;
  margin: 0;

  ${media.tablet} {
    font-size: ${({ theme }) => theme.typography.text2xl};
  }
`;

/* "AI 영화 추천" 악센트 — 그라데이션 텍스트 + shift 애니메이션 */
export const HeroTitleAccent = styled.span`
  ${gradientText}
`;

/* 설명 — 지연 등장 */
export const HeroDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.textLg};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.leadingRelaxed};
  margin: 0;
  animation: ${fadeInUp} 0.6s ease 0.2s both;

  ${media.tablet} {
    font-size: ${({ theme }) => theme.typography.textBase};
  }
`;

/* CTA 버튼 영역 */
export const HeroCta = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.sm};
  animation: ${fadeInUp} 0.6s ease 0.4s both;

  ${media.tablet} {
    flex-direction: column;
    width: 100%;
  }
`;

/* 버튼 공통 베이스 */
const btnBase = css`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  text-decoration: none;
  transition: all ${({ theme }) => theme.transitions.fast};
  display: inline-block;

  ${media.tablet} {
    text-align: center;
  }
`;

/* Primary 버튼 — 그라데이션 + 글로우 */
export const HeroBtnPrimary = styled.a`
  ${btnBase}
  background: ${({ theme }) => theme.gradients.primary};
  color: white;

  &:hover {
    box-shadow: ${({ theme }) => theme.glows.primary};
    transform: translateY(-2px);
    color: white;
  }
`;

/* Secondary 버튼 — 글래스 */
export const HeroBtnSecondary = styled.a`
  ${btnBase}
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: ${({ theme }) => theme.glass.blur};
  -webkit-backdrop-filter: ${({ theme }) => theme.glass.blur};
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 1px solid ${({ theme }) => theme.glass.border};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.glow};
  }
`;

/* 배경 글로우 (중앙) */
export const HeroGlow = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 600px;
  background: ${({ theme }) => theme.gradients.glow};
  pointer-events: none;

  ${media.tablet} {
    width: 400px;
    height: 400px;
  }
`;

/* Floating Orb 공통 베이스 */
const orbBase = css`
  position: absolute;
  border-radius: ${({ theme }) => theme.radius.full};
  filter: blur(80px);
  pointer-events: none;

  ${media.tablet} {
    width: 180px;
    height: 180px;
  }
`;

/* Floating Orb 1 — 보라색 (좌상단) */
export const HeroOrb1 = styled.div`
  ${orbBase}
  top: 10%;
  left: 10%;
  width: 300px;
  height: 300px;
  background: ${({ theme }) => theme.gradients.glow};
  animation: ${floatUpDown} 8s ease-in-out infinite;
`;

/* Floating Orb 2 — 시안 (우하단) */
export const HeroOrb2 = styled.div`
  ${orbBase}
  bottom: 10%;
  right: 10%;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(6, 214, 160, 0.15) 0%, transparent 70%);
  animation: ${floatUpDown} 10s ease-in-out infinite 2s;
`;

/* ── 홈 상단 검색창 (2026-04-23 신규) ──
   헤더 바로 아래 최상단에 검색 input 을 노출해 페이지 진입 즉시 검색 가능하도록 함.
   카드 형태로 배치하여 주요 입력 요소로 부각. */

/** 검색 섹션 래퍼 — 헤더 바로 아래(Hero 위) */
export const HomeSearch = styled.section`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg};
`;

/** 검색 form + 인기 검색어 패널을 함께 감싸는 relative 래퍼 */
export const HomeSearchBox = styled.div`
  position: relative;
`;

/** 검색 form — input + 버튼 수평 정렬, 테두리 + 그림자로 카드 느낌 */
export const HomeSearchForm = styled.form`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: border-color ${({ theme }) => theme.transitions.fast},
              box-shadow ${({ theme }) => theme.transitions.fast};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
`;

/** 검색 input — flex:1 로 남은 공간 차지, 기본 border 없음 (form 이 컨테이너 역할) */
export const HomeSearchInput = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textMd};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.xs}`};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

/** 검색 제출 버튼 — primary 색 pill 형태 */
export const HomeSearchBtn = styled.button`
  flex-shrink: 0;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: opacity ${({ theme }) => theme.transitions.fast},
              transform ${({ theme }) => theme.transitions.fast};

  &:hover {
    opacity: 0.9;
  }

  &:active {
    transform: scale(0.97);
  }
`;

/* ── 공지사항 배너 섹션 ── */

/** 공지 배너 래퍼 — 히어로 바로 아래 배치 */
export const NoticeBanner = styled.section`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.lg};
`;

/** 개별 공지 카드 */
export const NoticeCard = styled.a`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: ${({ theme }) => theme.glass.blur};
  -webkit-backdrop-filter: ${({ theme }) => theme.glass.blur};
  border: 1px solid ${({ theme }) => theme.glass.border};
  text-decoration: none;
  cursor: ${({ href }) => (href ? 'pointer' : 'default')};
  transition: all ${({ theme }) => theme.transitions.fast};
  animation: ${fadeInUp} 0.4s ease both;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.glow};
    transform: translateY(-1px);
  }
`;

/** 공지 타입 배지 (BANNER/POPUP/MODAL) */
export const NoticeTypeBadge = styled.span`
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
`;

/** 공지 제목 텍스트 */
export const NoticeTitle = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** 공지 날짜 */
export const NoticeDate = styled.span`
  flex-shrink: 0;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/* ── 추천 질문 카드 섹션 ── */
export const Suggestions = styled.section`
  padding: ${({ theme }) => theme.spacing.xxxl} ${({ theme }) => theme.spacing.lg};
  position: relative;
  border-top: none;
  border-bottom: none;

  /* 배경에 은은한 글로우 */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    height: 400px;
    background: ${({ theme }) => theme.gradients.glow};
    pointer-events: none;
    opacity: 0.5;
  }
`;

/* 섹션 내부 컨테이너 */
export const SuggestionsInner = styled.div`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

/* 섹션 제목 — 글로우 점 장식 */
export const SuggestionsTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: center;
  margin: 0 0 ${({ theme }) => theme.spacing.xl} 0;
  position: relative;
  display: inline-block;
  width: 100%;

  /* 제목 옆 글로우 점 */
  &::after {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: ${({ theme }) => theme.colors.primary};
    margin-left: ${({ theme }) => theme.spacing.sm};
    vertical-align: middle;
    box-shadow: ${({ theme }) => theme.glows.primary};
  }
`;

/* 카드 그리드 */
export const SuggestionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

/**
 * stagger 딜레이 계산 헬퍼.
 * $index prop(1-based)에 따라 animation-delay를 적용한다.
 *
 * @param {Object} props
 * @param {number} props.$index - 카드 순번 (1~4)
 */
const staggerDelay = ({ $index }) => css`
  animation-delay: ${$index * 0.1}s;
`;

/* 카드 — glass-card 스타일 + stagger 등장 + hover shine */
export const SuggestionsCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};

  /* glassCard 믹스인 적용 (bg, backdrop, border, radius, shine) */
  ${glassCard}

  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};
  text-align: left;
  animation: ${fadeInUp} 0.5s ease both;

  /* stagger 등장 — $index prop(1-based)으로 딜레이 결정 */
  ${staggerDelay}

  &:hover {
    border-color: ${({ theme }) => theme.glass.border};
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg}, ${({ theme }) => theme.shadows.glow};
  }
`;

/* 카드 이모지 아이콘 */
export const CardIcon = styled.span`
  font-size: ${({ theme }) => theme.typography.text2xl};
`;

/* 카드 제목 */
export const CardTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

/* 카드 설명 */
export const CardDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.leadingNormal};
  margin: 0;
`;

/* ── 인기 영화 섹션 ── */
export const Movies = styled.section`
  padding: ${({ theme }) => theme.spacing.xxxl} ${({ theme }) => theme.spacing.lg};
  position: relative;
`;

/* 섹션 내부 컨테이너 */
export const MoviesInner = styled.div`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
`;

/* 섹션 헤더 (제목 + 더보기 링크) */
export const MoviesHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

/* 섹션 제목 — 시안 글로우 점 */
export const MoviesTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
  position: relative;

  /* 제목 옆 시안 글로우 점 */
  &::after {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: #06d6a0;
    margin-left: ${({ theme }) => theme.spacing.sm};
    vertical-align: middle;
    box-shadow: 0 0 10px rgba(6, 214, 160, 0.6), 0 0 20px rgba(6, 214, 160, 0.3);
  }
`;

/* 더보기 링크 */
export const MoviesMore = styled.a`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    text-shadow: ${({ theme }) => theme.shadows.glow};
    text-decoration: underline;
  }
`;

/**
 * 섹션 로드 실패 시 표시되는 에러 배너.
 * Promise.allSettled 로 한쪽이 실패해도 다른 섹션은 살아있어야 하므로
 * 그리드/스켈레톤 위에 얇게 추가되는 형태로 디자인한다.
 */
export const SectionError = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 16px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.errorBg};
  border: 1px solid ${({ theme }) => theme.colors.error};
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

/** SectionError 내부의 "다시 시도" 버튼 */
export const SectionRetry = styled.button`
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.error};
  color: #ffffff;
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  border: none;
  cursor: pointer;
  transition: opacity ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  &:hover {
    opacity: 0.85;
  }
`;
