/**
 * 몽글픽 랜딩 페이지 — styled-components 스타일 정의.
 *
 * LandingPage.css(457줄)를 styled-components로 전환한 파일이다.
 * lp- 접두사 BEM 구조를 컴포넌트 단위로 분해하고,
 * CSS 변수는 theme 객체로, 지역 상수는 파일 내부 const로 대체한다.
 *
 * 랜딩 전용 색상 상수 (theme에 없는 고유 값):
 *   LP_PRIMARY_GLOW   — rgba(124,108,240,0.4)  - 강한 글로우
 *   LP_BG_MAIN        — #0a0a14               - 랜딩 전용 더 진한 배경
 *   LP_BG_CARD        — rgba(26,26,46,0.6)     - 카드 배경
 *   LP_BG_GLASS       — rgba(26,26,46,0.35)    - 글래스 배경 (더 투명)
 *   LP_BORDER         — rgba(124,108,240,0.15) - 기본 보더
 *   LP_BORDER_HOVER   — rgba(124,108,240,0.4)  - 호버 보더
 *   LP_ACCENT_CYAN    — #06d6a0
 *   LP_ACCENT_PINK    — #ef476f
 *   LP_ACCENT_YELLOW  — #ffd166
 *   LP_ACCENT_BLUE    — #118ab2
 *   LP_FONT_EN        — 'Inter', sans-serif
 */

import styled, { keyframes, css } from 'styled-components';
/* media 헬퍼는 랜딩 전용 브레이크포인트를 사용하므로 직접 @media 사용 */

/* ================================================================
   랜딩 전용 색상 상수 — 고정 브랜드 색상 (theme 무관)
   ================================================================ */
/* 아래 4개는 테마 전환과 무관한 고정 브랜드 강조색이므로 const 유지 */
const LP_ACCENT_CYAN   = '#06d6a0';
const LP_ACCENT_PINK   = '#ef476f';
const LP_ACCENT_YELLOW = '#ffd166';
const LP_ACCENT_BLUE   = '#118ab2';

/*
 * 나머지 13개 LP_* 상수는 theme 토큰으로 전환됨:
 *   LP_PRIMARY        → theme.colors.primary
 *   LP_PRIMARY_HOVER  → theme.colors.primaryHover
 *   LP_PRIMARY_DARK   → theme.colors.primaryDark
 *   LP_PRIMARY_LIGHT  → theme.colors.primaryLight
 *   LP_PRIMARY_GLOW   → theme.landing.primaryGlow
 *   LP_BG_MAIN        → theme.landing.bgMain
 *   LP_BG_CARD        → theme.landing.bgCard
 *   LP_BG_GLASS       → theme.landing.bgGlass
 *   LP_BORDER         → theme.landing.border
 *   LP_BORDER_HOVER   → theme.landing.borderHover
 *   LP_TEXT_PRIMARY   → theme.landing.textPrimary
 *   LP_TEXT_SECONDARY → theme.landing.textSecondary
 *   LP_TEXT_MUTED     → theme.landing.textMuted
 */

const LP_FONT_EN = "'Inter', sans-serif";

/* ================================================================
   @keyframes — 랜딩 페이지 전용 애니메이션 (9개)
   ================================================================ */

/** 배경 오브 1 — 좌상단 보라 오브 부유 */
const lpOrbFloat1 = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(80px, 60px) scale(1.1); }
`;

/** 배경 오브 2 — 우측 시안 오브 부유 */
const lpOrbFloat2 = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-60px, -80px) scale(1.15); }
`;

/** 배경 오브 3 — 하단 핑크 오브 부유 */
const lpOrbFloat3 = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(50px, -50px) scale(1.05); }
`;

/** 히어로 파티클 부유 — 아래에서 위로 소멸 */
const lpParticleFloat = keyframes`
  0%   { opacity: 0; transform: translateY(100vh) scale(0); }
  20%  { opacity: 0.8; }
  80%  { opacity: 0.3; }
  100% { opacity: 0; transform: translateY(-20vh) scale(1); }
`;

/** 히어로 배지 펄스 — 시안 도트 */
const lpPulse = keyframes`
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(6, 214, 160, 0.5); }
  50%       { opacity: 0.8; box-shadow: 0 0 0 8px rgba(6, 214, 160, 0); }
`;

/** 타임라인 진행 중 도트 펄스 — 노랑 */
const lpPulseYellow = keyframes`
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(255, 209, 102, 0.5); }
  50%       { opacity: 0.8; box-shadow: 0 0 0 8px rgba(255, 209, 102, 0); }
`;

/** 히어로 타이틀 스팬 그라데이션 이동 */
const lpGradientShift = keyframes`
  0%, 100% { background-position: 0% 50%; }
  50%       { background-position: 100% 50%; }
`;

/** 플로팅 무비카드 부유 — CSS 변수 --rot 사용 */
const lpCardFloat = keyframes`
  0%, 100% { transform: translateY(0) rotate(var(--rot)); }
  50%       { transform: translateY(-14px) rotate(var(--rot)); }
`;

/** 히어로 요소 등장 — 아래에서 (30px) */
const lpFadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/** 히어로 배지 등장 — 위에서 (20px) */
const lpFadeInDown = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ================================================================
   믹스인 — 랜딩 전용 반복 패턴
   ================================================================ */

/** 글래스 패널 — 랜딩 전용 (더 투명한 배경 + 블러) */
const lpGlassPanel = css`
  background: ${({ theme }) => theme.landing.bgGlass};
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid ${({ theme }) => theme.landing.border};
`;

/* ================================================================
   최상위 래퍼 — .lp
   ================================================================ */

/**
 * 랜딩 페이지 루트 래퍼.
 * 배경색, 기본 폰트, overflow, 최소 높이를 설정한다.
 */
export const LandingWrapper = styled.div`
  font-family: 'Noto Sans KR', sans-serif;
  background: ${({ theme }) => theme.landing.bgMain};
  color: ${({ theme }) => theme.landing.textPrimary};
  overflow-x: hidden;
  line-height: 1.6;
  min-height: 100vh;

  /* 랜딩 내부 앵커 링크 색상 */
  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
  }

  /* 랜딩 전용 스크롤바 */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: ${({ theme }) => theme.landing.bgMain}; }
  ::-webkit-scrollbar-thumb {
    background: rgba(124, 108, 240, 0.3);
    border-radius: 100px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(124, 108, 240, 0.5);
  }
`;

/* ================================================================
   배경 오브 — .lp-bg-orb, .lp-bg-orb--1/2/3
   ================================================================ */

/** 배경 오브 공통 기반 */
const BgOrbBase = styled.div`
  position: fixed;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.25;
  pointer-events: none;
  z-index: 0;

  /* 모바일 — 오브 축소하여 화면 밖 넘침 방지 */
  @media (max-width: 600px) {
    opacity: 0.15;
    transform: scale(0.5);
  }
`;

/** 배경 오브 1 — 보라, 좌상단 */
export const BgOrb1 = styled(BgOrbBase)`
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, ${({ theme }) => theme.colors.primary} 0%, transparent 70%);
  top: -200px;
  left: -100px;
  animation: ${lpOrbFloat1} 20s ease-in-out infinite;
`;

/** 배경 오브 2 — 시안, 우측 */
export const BgOrb2 = styled(BgOrbBase)`
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, ${LP_ACCENT_CYAN} 0%, transparent 70%);
  top: 40%;
  right: -150px;
  animation: ${lpOrbFloat2} 25s ease-in-out infinite;
`;

/** 배경 오브 3 — 핑크, 하단 */
export const BgOrb3 = styled(BgOrbBase)`
  width: 450px;
  height: 450px;
  background: radial-gradient(circle, ${LP_ACCENT_PINK} 0%, transparent 70%);
  bottom: -100px;
  left: 30%;
  animation: ${lpOrbFloat3} 22s ease-in-out infinite;
`;

/* ================================================================
   섹션 공통 — z-index 1 레이어
   ================================================================ */

/** 섹션 기본 포지셔닝 — .lp section, .lp-hero 등 공통 */
export const SectionBase = styled.section`
  position: relative;
  z-index: 1;
`;

/* ================================================================
   네비게이션 — .lp-nav
   ================================================================ */

/**
 * 상단 고정 네비게이션.
 * $scrolled prop에 따라 배경 불투명도와 그림자가 변경된다.
 *
 * @prop {boolean} $scrolled - 스크롤 50px 이상 여부
 */
export const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 16px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  backdrop-filter: blur(20px) saturate(1.8);
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  /* 테마에 맞는 배경 — 다크: 반투명 어두운 색, 라이트: 반투명 흰색 */
  background: ${({ theme }) => theme.header.bg};
  border-bottom: 1px solid ${({ theme }) => theme.landing.border};
  transition: all 0.3s ease;

  /* 스크롤 시 더 불투명하게 + 그림자 */
  ${({ $scrolled, theme }) => $scrolled && css`
    background: ${theme.header.mobileBg};
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  `}

  /* 태블릿 */
  @media (max-width: 900px) {
    padding: 12px 20px;
  }

  /* 모바일 */
  @media (max-width: 600px) {
    padding: 10px 16px;
  }
`;

/** 네비게이션 로고 영역 */
export const NavLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: ${LP_FONT_EN};
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.5px;

  /* 로고 텍스트 그라데이션 */
  span {
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${LP_ACCENT_CYAN});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

/** 로고 이미지 */
export const NavLogoImg = styled.img`
  width: 36px;
  height: 36px;
  object-fit: contain;
`;

/** 네비게이션 링크 목록 */
export const NavLinks = styled.div`
  display: flex;
  gap: 28px;
  align-items: center;

  a {
    color: ${({ theme }) => theme.landing.textSecondary};
    font-size: 0.88rem;
    font-weight: 500;
    transition: color 0.2s;
    position: relative;

    /* 호버 언더라인 */
    &::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 0;
      height: 2px;
      background: ${({ theme }) => theme.colors.primary};
      transition: width 0.3s ease;
    }

    &:hover {
      color: ${({ theme }) => theme.landing.textPrimary};
    }

    &:hover::after {
      width: 100%;
    }
  }

  /* 태블릿 */
  @media (max-width: 900px) {
    gap: 14px;
    a { font-size: 0.78rem; }
  }

  /* 모바일 — 햄버거 메뉴로 전환 시 숨김 (NavMobileMenu로 대체) */
  @media (max-width: 600px) {
    display: none;
  }
`;

/** 네비게이션 CTA 버튼 */
export const NavCta = styled.a`
  padding: 8px 20px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primaryDark});
  color: #fff !important;
  -webkit-text-fill-color: #fff;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 15px ${({ theme }) => theme.landing.primaryGlow};
  }

  /* 언더라인 숨김 */
  &::after {
    display: none !important;
  }
`;

/* ── 랜딩 모바일 햄버거 메뉴 (600px 이하) ── */

/** 모바일 햄버거 버튼 — 600px 이하에서만 노출 */
export const NavMobileToggle = styled.button`
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 28px;
  height: 28px;
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0;

  span {
    display: block;
    width: 100%;
    height: 2px;
    background-color: ${({ theme }) => theme.landing.textSecondary};
    border-radius: 1px;
    transition: all 0.3s ease;
  }

  /* 햄버거 → X 변환 */
  ${({ $isOpen }) =>
    $isOpen &&
    css`
      span:nth-child(1) {
        transform: translateY(7px) rotate(45deg);
      }
      span:nth-child(2) {
        opacity: 0;
      }
      span:nth-child(3) {
        transform: translateY(-7px) rotate(-45deg);
      }
    `}

  @media (max-width: 600px) {
    display: flex;
  }
`;

/** 모바일 메뉴 오버레이 — position fixed 전체 화면 */
export const NavMobileMenu = styled.div`
  display: none;

  @media (max-width: 600px) {
    display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
    position: fixed;
    top: 56px;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
    flex-direction: column;
    padding: 24px;
    gap: 8px;
    background: ${({ theme }) => theme.header.mobileBg};
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid ${({ theme }) => theme.landing.border};
    overflow-y: auto;

    a {
      display: block;
      padding: 14px 16px;
      font-size: 1rem;
      font-weight: 500;
      color: ${({ theme }) => theme.landing.textSecondary};
      border-radius: 12px;
      transition: all 0.2s;

      &:hover {
        color: ${({ theme }) => theme.landing.textPrimary};
        background: rgba(124, 108, 240, 0.08);
      }

      /* 호버 언더라인 해제 (NavLinks 상속 제거) */
      &::after {
        display: none;
      }
    }
  }
`;

/* ================================================================
   공통 레이아웃 컴포넌트
   ================================================================ */

/** 1200px 최대 너비 컨테이너 */
export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
`;

/** 섹션 레이블 — "AI Chat", "Key Features" 등 소제목 */
export const SectionLabel = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: ${LP_FONT_EN};
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 16px;

  /* 좌측 장식선 */
  &::before {
    content: '';
    width: 30px;
    height: 2px;
    background: ${({ theme }) => theme.colors.primary};
  }
`;

/** 섹션 대제목 — clamp로 반응형 폰트 크기 */
export const SectionTitle = styled.h2`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 16px;

  /* 태블릿 */
  @media (max-width: 900px) {
    font-size: 1.8rem;
  }
`;

/** 섹션 부제목 */
export const SectionSubtitle = styled.p`
  font-size: 1.05rem;
  color: ${({ theme }) => theme.landing.textSecondary};
  max-width: 600px;
  line-height: 1.7;
`;

/**
 * 그라데이션 텍스트 스팬 — 보라 → 시안.
 * SectionTitle 또는 CTA 내부 span에 사용한다.
 */
export const GradientText = styled.span`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${LP_ACCENT_CYAN});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

/* ================================================================
   스크롤 애니메이션 — .lp-reveal
   ================================================================ */

/**
 * 스크롤 등장 래퍼.
 * Intersection Observer가 lp-visible 클래스를 추가하면 노출된다.
 * $delay prop으로 트랜지션 지연 시간을 조정한다.
 *
 * @prop {string} $delay - CSS transition-delay 값 (예: '0.2s')
 */
export const Reveal = styled.div`
  opacity: 0;
  transform: translateY(40px);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1)
    ${({ $delay }) => $delay ? $delay : '0s'};

  &.lp-visible {
    opacity: 1;
    transform: translateY(0);
  }
`;

/* ================================================================
   히어로 — .lp-hero
   ================================================================ */

/** 히어로 섹션 래퍼 */
export const Hero = styled(SectionBase)`
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 120px 24px 80px;
  overflow: hidden;

  /* 모바일 — 상단 패딩 축소 */
  @media (max-width: 600px) {
    padding: 80px 16px 60px;
    min-height: auto;
  }
`;

/** 히어로 배경 그리드 오버레이 */
export const HeroGrid = styled.div`
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(124, 108, 240, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(124, 108, 240, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%);
`;

/** 히어로 파티클 컨테이너 — JS로 div.lp-particle 요소를 동적 삽입 */
export const HeroParticles = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;

  /* 파티클 개별 요소 스타일 — JS에서 className='lp-particle'로 생성 */
  .lp-particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 50%;
    opacity: 0;
    animation: ${lpParticleFloat} 8s ease-in-out infinite;
  }
`;

/** 히어로 2컬럼 레이아웃 */
export const HeroLayout = styled.div`
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 60px;
  align-items: center;
  width: 100%;

  /* 태블릿 — 1컬럼으로 변경, 카드 숨김 */
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

/** 히어로 배지 — "AI 영화 추천 서비스" */
export const HeroBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: ${({ theme }) => theme.landing.bgGlass};
  backdrop-filter: blur(10px);
  border: 1px solid ${({ theme }) => theme.landing.border};
  border-radius: 100px;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.landing.textSecondary};
  margin-bottom: 28px;
  animation: ${lpFadeInDown} 0.8s ease both;
`;

/** 히어로 배지 펄스 도트 */
export const HeroBadgeDot = styled.span`
  width: 8px;
  height: 8px;
  background: ${LP_ACCENT_CYAN};
  border-radius: 50%;
  animation: ${lpPulse} 2s ease-in-out infinite;
`;

/** 히어로 메인 타이틀 */
export const HeroTitle = styled.h1`
  font-size: clamp(2.8rem, 6vw, 4.5rem);
  font-weight: 900;
  line-height: 1.08;
  margin-bottom: 24px;
  animation: ${lpFadeInUp} 0.8s ease 0.2s both;

  /* 그라데이션 스팬 — 색상 이동 애니메이션 */
  span {
    background: linear-gradient(
      135deg,
      ${({ theme }) => theme.colors.primary} 0%,
      #a78bfa 40%,
      ${LP_ACCENT_CYAN} 70%,
      ${LP_ACCENT_PINK} 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    background-size: 200% auto;
    animation: ${lpGradientShift} 5s ease infinite;
  }
`;

/** 히어로 설명 텍스트 */
export const HeroDesc = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.landing.textSecondary};
  line-height: 1.8;
  max-width: 520px;
  margin-bottom: 36px;
  animation: ${lpFadeInUp} 0.8s ease 0.4s both;
`;

/** 히어로 CTA 버튼 그룹 */
export const HeroCta = styled.div`
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  animation: ${lpFadeInUp} 0.8s ease 0.6s both;
`;

/** 히어로 체크 항목 목록 */
export const HeroChecks = styled.div`
  display: flex;
  gap: 24px;
  margin-top: 32px;
  animation: ${lpFadeInUp} 0.8s ease 0.8s both;
  font-size: 0.88rem;
  color: ${({ theme }) => theme.landing.textMuted};

  span {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* 모바일 — 세로 배치 */
  @media (max-width: 600px) {
    flex-direction: column;
    gap: 8px;
  }
`;

/** 체크 아이콘 스팬 */
export const CheckIcon = styled.span`
  color: ${LP_ACCENT_CYAN};
  font-weight: 700;
`;

/* ================================================================
   버튼 — .lp-btn, .lp-btn--primary, .lp-btn--glass
   ================================================================ */

/** 버튼 공통 기반 */
const BtnBase = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
  font-family: 'Noto Sans KR', sans-serif;
  text-decoration: none;
`;

/** 주요 버튼 — 그라데이션 배경 */
export const BtnPrimary = styled(BtnBase)`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primaryDark});
  color: #fff !important;
  -webkit-text-fill-color: #fff;
  box-shadow: 0 4px 20px ${({ theme }) => theme.landing.primaryGlow};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px ${({ theme }) => theme.landing.primaryGlow};
    color: #fff;
  }
`;

/** 글래스 버튼 — 반투명 배경 */
export const BtnGlass = styled(BtnBase)`
  background: ${({ theme }) => theme.landing.bgGlass};
  backdrop-filter: blur(10px);
  color: ${({ theme }) => theme.landing.textPrimary};
  border: 1px solid ${({ theme }) => theme.landing.border};

  &:hover {
    background: ${({ theme }) => theme.landing.bgCard};
    border-color: ${({ theme }) => theme.landing.borderHover};
    transform: translateY(-2px);
  }
`;

/* ================================================================
   플로팅 무비카드 — .lp-hero__cards, .lp-movie-float
   ================================================================ */

/**
 * 히어로 우측 플로팅 카드 컨테이너.
 * 태블릿 이하에서 숨김 처리된다.
 */
export const HeroCards = styled.div`
  position: relative;
  height: 500px;
  animation: ${lpFadeInUp} 1s ease 0.5s both;

  /* 태블릿 */
  @media (max-width: 900px) {
    display: none;
  }
`;

/**
 * 플로팅 무비카드 개별 아이템.
 * CSS 변수 --rot, --dur, --delay를 통해 각 카드의 회전각과 타이밍을 제어한다.
 * position: absolute이므로 top/left/right은 style prop으로 전달한다.
 */
export const MovieFloat = styled.div`
  position: absolute;
  width: 155px;
  background: ${({ theme }) => theme.landing.bgCard};
  border: 1px solid ${({ theme }) => theme.landing.border};
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  animation: ${lpCardFloat} var(--dur) ease-in-out infinite;
  animation-delay: var(--delay);
  transition: transform 0.3s;

  &:hover {
    transform: scale(1.05) !important;
    z-index: 10;
  }
`;

/** 플로팅 카드 포스터 영역 */
export const MovieFloatPoster = styled.div`
  height: 90px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05),
    rgba(255, 255, 255, 0.02)
  );
  border-radius: 6px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
`;

/** 플로팅 카드 제목 */
export const MovieFloatTitle = styled.div`
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 2px;
`;

/** 플로팅 카드 장르 */
export const MovieFloatGenre = styled.div`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.landing.textMuted};
`;

/** 플로팅 카드 하단 메타 (평점 + 연도) */
export const MovieFloatMeta = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.7rem;
`;

/** 플로팅 카드 평점 */
export const MovieFloatRating = styled.span`
  color: ${LP_ACCENT_YELLOW};
`;

/** 플로팅 카드 연도 */
export const MovieFloatYear = styled.span`
  color: ${({ theme }) => theme.landing.textMuted};
`;

/* ================================================================
   채팅 데모 — .lp-chat-demo
   ================================================================ */

/** 채팅 데모 섹션 */
export const ChatDemo = styled(SectionBase)`
  padding: 120px 0;

  @media (max-width: 600px) {
    padding: 60px 0;
  }
`;

/** 채팅 데모 2컬럼 레이아웃 */
export const ChatDemoLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;

  /* 태블릿 */
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`;

/** 채팅 UI 목업 창 */
export const ChatWindow = styled.div`
  ${lpGlassPanel}
  border-radius: 20px;
  padding: 24px;
`;

/** 채팅 창 헤더 */
export const ChatWindowHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.landing.border};
  margin-bottom: 20px;
`;

/** 채팅 창 아바타 이미지 */
export const ChatWindowAvatar = styled.img`
  width: 36px;
  height: 36px;
  object-fit: contain;
  flex-shrink: 0;
`;

/** 채팅 창 이름 */
export const ChatWindowName = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
`;

/** 채팅 창 온라인 상태 도트 */
export const ChatWindowStatus = styled.div`
  margin-left: auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${LP_ACCENT_CYAN};
  box-shadow: 0 0 8px rgba(6, 214, 160, 0.5);
`;

/**
 * 채팅 말풍선 기본.
 *
 * @prop {boolean} $isUser - true이면 우측 정렬 사용자 말풍선
 */
export const ChatBubble = styled.div`
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 0.88rem;
  line-height: 1.6;
  margin-bottom: 12px;

  ${({ $isUser }) => $isUser ? css`
    /* 사용자 말풍선 — 우측 */
    margin-left: auto;
    background: ${({ theme }) => theme.colors.primaryLight};
    border: 1px solid rgba(124, 108, 240, 0.25);
    color: #c4b5fd;
    border-bottom-right-radius: 4px;
  ` : css`
    /* AI 말풍선 — 좌측 */
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid ${({ theme }) => theme.landing.border};
    color: ${({ theme }) => theme.landing.textSecondary};
    border-bottom-left-radius: 4px;
  `}
`;

/** 추천 카드 목록 */
export const ChatRecoCards = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 4px;
`;

/** 채팅 추천 카드 개별 아이템 */
export const ChatRecoCard = styled.div`
  flex: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid ${({ theme }) => theme.landing.border};
  border-radius: 10px;
  padding: 12px;
  transition: all 0.3s;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.landing.borderHover};
    transform: translateY(-2px);
  }
`;

/** 추천 카드 제목 */
export const ChatRecoCardTitle = styled.div`
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 3px;
`;

/** 추천 카드 장르 */
export const ChatRecoCardGenre = styled.div`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.landing.textMuted};
  margin-bottom: 8px;
`;

/** 추천 카드 하단 (평점 + OTT) */
export const ChatRecoCardBottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

/** 추천 카드 평점 */
export const ChatRecoCardRating = styled.span`
  font-size: 0.72rem;
  color: ${LP_ACCENT_YELLOW};
`;

/** 추천 카드 OTT */
export const ChatRecoCardOtt = styled.span`
  font-size: 0.72rem;
  color: ${LP_ACCENT_BLUE};
  font-weight: 500;
`;

/* ================================================================
   핵심 기능 — .lp-features
   ================================================================ */

/** 핵심 기능 섹션 */
export const Features = styled(SectionBase)`
  padding: 120px 0;

  @media (max-width: 600px) {
    padding: 60px 0;
  }
`;

/** 핵심 기능 헤더 */
export const FeaturesHeader = styled.div`
  text-align: center;
  margin-bottom: 48px;
`;

/** 피처 필 버튼 목록 */
export const FeaturesPills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-bottom: 40px;
`;

/**
 * 피처 선택 필 버튼.
 *
 * @prop {string} $color   - 피처 고유 색상 (예: '#ef476f')
 * @prop {boolean} $active - 현재 선택 여부
 */
export const FeaturePill = styled.button`
  padding: 8px 20px;
  border-radius: 100px;
  border: 1px solid ${({ theme }) => theme.landing.border};
  background: transparent;
  color: ${({ theme }) => theme.landing.textMuted};
  font-size: 0.85rem;
  font-family: 'Noto Sans KR', sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }

  /* 활성 상태 — 피처 고유 색상 적용 */
  ${({ $active, $color, theme }) => $active && css`
    border-color: ${$color || theme.colors.primary};
    background: ${$color ? $color + '1f' : theme.colors.primaryLight};
    color: ${$color || theme.colors.primary};
  `}
`;

/**
 * 피처 상세 표시 영역.
 *
 * @prop {string} $accent - 피처 고유 색상 (보더 색상에 33 투명도 적용)
 */
export const FeatureDisplay = styled.div`
  background: ${({ theme }) => theme.landing.bgGlass};
  backdrop-filter: blur(20px);
  border: 1px solid ${({ $accent, theme }) => $accent ? $accent + '33' : theme.landing.border};
  border-radius: 20px;
  padding: 48px 40px;
  display: flex;
  align-items: center;
  gap: 36px;
  transition: all 0.4s ease;
  margin-bottom: 24px;

  /* 모바일 — 세로 배치 + 패딩 축소 */
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 28px 20px;
    gap: 20px;
  }
`;

/** 피처 상세 아이콘 */
export const FeatureDisplayIcon = styled.div`
  font-size: 4.5rem;
  line-height: 1;
  flex-shrink: 0;
`;

/**
 * 피처 상세 태그 뱃지.
 *
 * @prop {string} $color - 피처 고유 색상
 */
export const FeatureDisplayTag = styled.div`
  display: inline-block;
  padding: 4px 14px;
  border-radius: 100px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 1px;
  margin-bottom: 12px;
  background: ${({ $color, theme }) => $color ? $color + '22' : theme.colors.primaryLight};
  color: ${({ $color, theme }) => $color || theme.colors.primary};
`;

/** 피처 상세 제목 */
export const FeatureDisplayTitle = styled.h3`
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 12px;
`;

/** 피처 상세 설명 */
export const FeatureDisplayDesc = styled.p`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.landing.textSecondary};
  line-height: 1.7;
  max-width: 480px;
`;

/** 피처 미니 그리드 — 3열 */
export const FeaturesMiniGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  /* 태블릿 — 2열 */
  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }

  /* 모바일 — 1열 */
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

/**
 * 피처 미니 카드.
 *
 * @prop {boolean} $active - 현재 선택 여부
 */
export const FeatureMini = styled.div`
  padding: 20px;
  background: ${({ theme }) => theme.landing.bgGlass};
  border: 1px solid ${({ theme }) => theme.landing.border};
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: ${({ theme }) => theme.landing.borderHover};
    transform: translateY(-3px);
  }

  ${({ $active }) => $active && css`
    border-color: ${({ theme }) => theme.landing.borderHover};
    background: rgba(124, 108, 240, 0.06);
  `}
`;

/** 미니 카드 아이콘 */
export const FeatureMiniIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 8px;
`;

/** 미니 카드 제목 */
export const FeatureMiniTitle = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
`;

/* ================================================================
   사용 방법 — .lp-howto
   ================================================================ */

/** 사용 방법 섹션 */
export const HowTo = styled(SectionBase)`
  padding: 120px 0;

  @media (max-width: 600px) {
    padding: 60px 0;
  }
`;

/** 사용 방법 헤더 */
export const HowToHeader = styled.div`
  text-align: center;
  margin-bottom: 64px;
`;

/** 3스텝 그리드 — 연결선 포함 */
export const HowToSteps = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  position: relative;

  /* 스텝 연결 가로선 */
  &::before {
    content: '';
    position: absolute;
    top: 50px;
    left: calc(16.67% + 40px);
    width: calc(66.67% - 80px);
    height: 2px;
    background: linear-gradient(
      90deg,
      ${({ theme }) => theme.colors.primary},
      ${LP_ACCENT_CYAN},
      ${LP_ACCENT_PINK}
    );
    opacity: 0.2;
  }

  /* 태블릿 — 1열, 연결선 숨김 */
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 40px;

    &::before {
      display: none;
    }
  }
`;

/** 스텝 카드 개별 아이템 */
export const StepCard = styled.div`
  text-align: center;
  padding: 0 24px;
  position: relative;

  /* 원형 아이콘 호버 효과 */
  &:hover .step-circle {
    border-color: ${({ theme }) => theme.landing.borderHover};
    box-shadow: 0 0 20px ${({ theme }) => theme.landing.primaryGlow};
    transform: scale(1.08);
  }
`;

/** 스텝 원형 아이콘 */
export const StepCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primaryLight};
  border: 1px solid ${({ theme }) => theme.landing.border};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 20px;
  position: relative;
  z-index: 1;
  transition: all 0.3s;
`;

/** 스텝 번호 레이블 */
export const StepNum = styled.div`
  font-family: ${LP_FONT_EN};
  font-size: 0.7rem;
  letter-spacing: 3px;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 10px;
  font-weight: 600;
`;

/** 스텝 제목 */
export const StepTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 12px;
`;

/** 스텝 설명 */
export const StepDesc = styled.p`
  font-size: 0.88rem;
  color: ${({ theme }) => theme.landing.textSecondary};
  line-height: 1.7;
  white-space: pre-line;
`;

/* ================================================================
   차별점 — .lp-diff
   ================================================================ */

/** 차별점 섹션 */
export const Diff = styled(SectionBase)`
  padding: 100px 0;
`;

/** 차별점 박스 — 그라데이션 배경 */
export const DiffBox = styled.div`
  background: linear-gradient(
    135deg,
    rgba(124, 108, 240, 0.08),
    rgba(6, 214, 160, 0.05)
  );
  border: 1px solid ${({ theme }) => theme.landing.border};
  border-radius: 24px;
  padding: 56px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;

  /* 태블릿 — 1열 */
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    padding: 36px 24px;
  }
`;

/** 차별점 아이템 목록 */
export const DiffItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

/** 차별점 개별 아이템 */
export const DiffItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid ${({ theme }) => theme.landing.border};
  border-radius: 12px;
  transition: all 0.3s;

  &:hover {
    border-color: ${({ theme }) => theme.landing.borderHover};
    transform: translateX(4px);
  }
`;

/** 차별점 아이콘 */
export const DiffItemIcon = styled.span`
  font-size: 1.3rem;
  flex-shrink: 0;
  margin-top: 2px;
`;

/** 차별점 주 텍스트 */
export const DiffItemText = styled.div`
  font-size: 0.88rem;
  font-weight: 600;
  margin-bottom: 2px;
`;

/** 차별점 부 텍스트 */
export const DiffItemSub = styled.div`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.landing.textMuted};
`;

/* ================================================================
   팀 소개 — .lp-team
   ================================================================ */

/** 팀 소개 섹션 */
export const Team = styled(SectionBase)`
  padding: 120px 0;

  @media (max-width: 600px) {
    padding: 60px 0;
  }
`;

/** 팀 소개 헤더 */
export const TeamHeader = styled.div`
  text-align: center;
  margin-bottom: 64px;
`;

/** 팀원 카드 그리드 */
export const TeamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;

  /* 태블릿 — 1열 */
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

/**
 * 팀원 카드.
 * $accent prop으로 상단 강조선 색상 및 글로우 색상을 제어한다.
 *
 * @prop {string} $accent - 팀원 고유 색상
 */
export const TeamCard = styled.div`
  position: relative;
  background: ${({ theme }) => theme.landing.bgGlass};
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme }) => theme.landing.border};
  border-radius: 20px;
  padding: 32px 28px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  /* 상단 강조선 — 호버 시 노출 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${({ $accent, theme }) => $accent || theme.colors.primary};
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    transform: translateY(-8px);
    border-color: ${({ theme }) => theme.landing.borderHover};
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.4),
      0 0 30px ${({ theme }) => theme.colors.primaryLight};
  }

  &:hover::before {
    opacity: 1;
  }
`;

/** 팀원 카드 상단 (아바타 + 이름) */
export const TeamCardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
`;

/**
 * 팀원 아바타.
 *
 * @prop {string} $bg    - 배경 색상
 * @prop {string} $color - 텍스트 색상
 */
export const TeamCardAvatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
  background: ${({ $bg, theme }) => $bg || theme.colors.primary};
  color: ${({ $color }) => $color || '#fff'};
`;

/** 팀원 정보 영역 */
export const TeamCardInfo = styled.div`
  h3 {
    font-size: 1.2rem;
    font-weight: 700;
    margin-bottom: 2px;
  }
`;

/**
 * 팀원 역할 텍스트.
 *
 * @prop {string} $color - 팀원 고유 색상
 */
export const TeamCardRole = styled.div`
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${({ $color, theme }) => $color || theme.colors.primary};
`;

/** 팀원 설명 */
export const TeamCardDesc = styled.p`
  font-size: 0.88rem;
  color: ${({ theme }) => theme.landing.textSecondary};
  line-height: 1.7;
  margin-bottom: 16px;
`;

/** 팀원 태그 목록 */
export const TeamCardTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 20px;
`;

/**
 * 기술 태그 뱃지.
 *
 * @prop {string} $bg     - 배경 색상 (피처 색상 + '18')
 * @prop {string} $border - 보더 색상 (피처 색상 + '30')
 * @prop {string} $color  - 텍스트 색상 (피처 색상)
 */
export const Tag = styled.span`
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 0.72rem;
  font-weight: 500;
  white-space: nowrap;
  border: 1px solid ${({ $border, theme }) => $border || theme.landing.border};
  background: ${({ $bg }) => $bg || 'transparent'};
  color: ${({ $color, theme }) => $color || theme.landing.textSecondary};
`;

/** 진행률 헤더 */
export const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

/** 진행률 레이블 */
export const ProgressLabel = styled.span`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.landing.textMuted};
`;

/**
 * 진행률 수치.
 *
 * @prop {string} $color - 팀원 고유 색상
 */
export const ProgressValue = styled.span`
  font-family: ${LP_FONT_EN};
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ $color, theme }) => $color || theme.colors.primary};
`;

/** 진행률 바 배경 */
export const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 100px;
  overflow: hidden;
`;

/**
 * 진행률 바 채움.
 * Intersection Observer 진입 시 data-width 값으로 width가 설정된다.
 *
 * @prop {string} $gradient - 바 그라데이션 배경 (예: 'linear-gradient(90deg, #7c6cf0, #06d6a0)')
 */
export const ProgressFill = styled.div`
  height: 100%;
  border-radius: 100px;
  width: 0;
  transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1);
  background: ${({ $gradient }) => $gradient || `linear-gradient(90deg, ${({ theme }) => theme.colors.primary}, ${LP_ACCENT_CYAN})`};
`;

/**
 * 팀원 담당 REQ 뱃지.
 *
 * @prop {string} $bg     - 배경 색상
 * @prop {string} $border - 보더 색상
 * @prop {string} $color  - 텍스트 색상
 */
export const TeamCardReq = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  padding: 6px 14px;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid ${({ $border, theme }) => $border || theme.landing.border};
  background: ${({ $bg }) => $bg || 'transparent'};
  color: ${({ $color, theme }) => $color || theme.landing.textSecondary};
`;

/* ================================================================
   기술 스택 — .lp-tech
   ================================================================ */

/** 기술 스택 섹션 */
export const Tech = styled(SectionBase)`
  padding: 120px 0;

  @media (max-width: 600px) {
    padding: 60px 0;
  }
`;

/** 기술 스택 헤더 */
export const TechHeader = styled.div`
  text-align: center;
  margin-bottom: 64px;
`;

/** 기술 카테고리 그리드 */
export const TechCategories = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
`;

/** 기술 카테고리 카드 */
export const TechCategory = styled.div`
  background: ${({ theme }) => theme.landing.bgGlass};
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme }) => theme.landing.border};
  border-radius: 16px;
  padding: 28px 24px;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${({ theme }) => theme.landing.borderHover};
    transform: translateY(-4px);
  }
`;

/** 기술 카테고리 제목 */
export const TechCategoryTitle = styled.h3`
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 16px;
`;

/** 기술 아이템 목록 */
export const TechItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

/** 기술 아이템 개별 행 */
export const TechItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.88rem;
  color: ${({ theme }) => theme.landing.textSecondary};
`;

/**
 * 기술 아이템 색상 도트.
 *
 * @prop {string} $bg - 카테고리 고유 색상
 */
export const TechItemDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $bg, theme }) => $bg || theme.colors.primary};
`;

/* ================================================================
   데이터 규모 — .lp-data
   ================================================================ */

/** 데이터 규모 섹션 */
export const Data = styled(SectionBase)`
  padding: 120px 0;

  @media (max-width: 600px) {
    padding: 60px 0;
  }
`;

/** 데이터 헤더 */
export const DataHeader = styled.div`
  text-align: center;
  margin-bottom: 64px;
`;

/** 데이터 카드 그리드 */
export const DataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
`;

/** 데이터 수치 카드 */
export const DataCard = styled.div`
  background: ${({ theme }) => theme.landing.bgGlass};
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme }) => theme.landing.border};
  border-radius: 16px;
  padding: 28px 20px;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${({ theme }) => theme.landing.borderHover};
    transform: translateY(-4px);
  }
`;

/** 데이터 수치 — 그라데이션 텍스트 */
export const DataCardValue = styled.div`
  font-family: ${LP_FONT_EN};
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${LP_ACCENT_CYAN});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
`;

/** 데이터 레이블 */
export const DataCardLabel = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.landing.textMuted};
`;

/** 데이터 부제 */
export const DataCardSub = styled.div`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.landing.textMuted};
  margin-top: 4px;
  opacity: 0.7;
`;

/* ================================================================
   타임라인 (진행 현황) — .lp-timeline
   ================================================================ */

/** 타임라인 섹션 */
export const Timeline = styled(SectionBase)`
  padding: 120px 0;

  @media (max-width: 600px) {
    padding: 60px 0;
  }
`;

/** 타임라인 헤더 */
export const TimelineHeader = styled.div`
  text-align: center;
  margin-bottom: 64px;
`;

/** 타임라인 목록 — 세로 라인 포함 */
export const TimelineList = styled.div`
  max-width: 700px;
  margin: 0 auto;
  position: relative;

  /* 세로 연결선 */
  &::before {
    content: '';
    position: absolute;
    left: 24px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(
      180deg,
      ${({ theme }) => theme.colors.primary},
      ${LP_ACCENT_CYAN},
      ${LP_ACCENT_PINK}
    );
    opacity: 0.3;
  }
`;

/** 타임라인 개별 항목 */
export const TimelineItem = styled.div`
  display: flex;
  gap: 24px;
  padding: 20px 0;
`;

/**
 * 타임라인 도트.
 * $variant prop에 따라 색상이 달라진다.
 *
 * @prop {'done'|'active'|''} $variant - 상태 타입
 */
export const TimelineDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
  margin-left: 19px;
  position: relative;
  z-index: 1;

  /* 기본 — 보라 */
  background: ${({ theme }) => theme.colors.primary};
  box-shadow: 0 0 12px ${({ theme }) => theme.landing.primaryGlow};

  /* 완료 — 시안 */
  ${({ $variant }) => $variant === 'done' && css`
    background: ${LP_ACCENT_CYAN};
    box-shadow: 0 0 12px rgba(6, 214, 160, 0.4);
  `}

  /* 진행 중 — 노랑 + 펄스 */
  ${({ $variant }) => $variant === 'active' && css`
    background: ${LP_ACCENT_YELLOW};
    box-shadow: 0 0 12px rgba(255, 209, 102, 0.4);
    animation: ${lpPulseYellow} 2s ease-in-out infinite;
  `}
`;

/** 타임라인 콘텐츠 */
export const TimelineContent = styled.div`
  h4 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 4px;
  }

  p {
    font-size: 0.85rem;
    color: ${({ theme }) => theme.landing.textMuted};
    margin: 0;
  }
`;

/**
 * 타임라인 상태 뱃지.
 *
 * @prop {'done'|'active'|'pending'} $variant - 상태 타입
 */
export const TimelineBadge = styled.span`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 100px;
  font-size: 0.7rem;
  font-weight: 600;
  margin-left: 8px;

  /* 완료 */
  ${({ $variant }) => $variant === 'done' && css`
    background: rgba(6, 214, 160, 0.1);
    color: ${LP_ACCENT_CYAN};
  `}

  /* 진행 중 */
  ${({ $variant }) => $variant === 'active' && css`
    background: rgba(255, 209, 102, 0.1);
    color: ${LP_ACCENT_YELLOW};
  `}

  /* 예정 */
  ${({ $variant }) => $variant === 'pending' && css`
    background: rgba(85, 85, 112, 0.2);
    color: ${({ theme }) => theme.landing.textMuted};
  `}
`;

/* ================================================================
   CTA (Call to Action) — .lp-cta
   ================================================================ */

/** CTA 섹션 */
export const Cta = styled(SectionBase)`
  padding: 100px 0 120px;
  text-align: center;
`;

/** CTA 아이콘 */
export const CtaIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 20px;
`;

/** CTA 타이틀 */
export const CtaTitle = styled.h2`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 900;
  margin-bottom: 20px;
  line-height: 1.15;
`;

/** CTA 설명 */
export const CtaDesc = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.landing.textSecondary};
  max-width: 480px;
  margin: 0 auto 36px;
  line-height: 1.7;
`;

/** CTA 버튼 그룹 */
export const CtaButtons = styled.div`
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
`;

/** CTA 하단 안내 텍스트 */
export const CtaSub = styled.p`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.landing.textMuted};
  margin-top: 20px;
`;

/* ================================================================
   CTA 내부 버튼 — 더 큰 패딩 적용 (fontSize/padding inline 대체)
   ================================================================ */

/** CTA 주요 버튼 — 더 큰 크기 */
export const CtaBtnPrimary = styled(BtnPrimary)`
  font-size: 1.05rem;
  padding: 16px 40px;
`;

/** CTA 글래스 버튼 — 더 큰 크기 */
export const CtaBtnGlass = styled(BtnGlass)`
  font-size: 1.05rem;
  padding: 16px 40px;
`;

/* ================================================================
   푸터 — .lp-footer
   ================================================================ */

/** 랜딩 전용 푸터 */
export const LpFooter = styled.footer`
  padding: 48px 0;
  border-top: 1px solid ${({ theme }) => theme.landing.border};
  position: relative;
  z-index: 1;
`;

/** 푸터 내부 flexbox */
export const FooterInner = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
`;

/** 푸터 텍스트 */
export const FooterText = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.landing.textMuted};
  margin: 0;

  /* MONGLEPICK 강조 */
  span {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
  }
`;

/** 푸터 링크 목록 */
export const FooterLinks = styled.div`
  display: flex;
  gap: 24px;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.landing.textMuted};
`;
