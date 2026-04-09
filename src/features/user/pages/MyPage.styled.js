/**
 * MyPage 컴포넌트 styled-components 정의.
 *
 * MyPage.css의 모든 규칙을 styled-components로 이관한다.
 * BEM 클래스(.mypage__*) → 개별 컴포넌트로 매핑.
 *
 * 공유 리소스:
 *   - animations.js : fadeInUp (페이지/콘텐츠 등장), cardShine (카드 hover 광선)
 *   - mixins.js     : glassCard (glass-card 패턴)
 *   - media.js      : media.mobile (640px 이하 반응형)
 *
 * $active — transient prop (DOM에 전달하지 않음)
 *   - true 이면 탭 버튼에 gradient 하단 바 + primary 색상을 적용한다.
 */

import styled, { css, keyframes } from 'styled-components';
import { fadeInUp, cardShine } from '../../../shared/styles/animations';
import { media } from '../../../shared/styles/media';

const overlayFadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const modalSlideUp = keyframes`
  from { opacity: 0; transform: translate(-50%, calc(-50% + 24px)) scale(0.97); }
  to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`;

/* media.js의 tablet(768px)로 통일 — 기존 640px보다 넓은 범위에서 반응형 적용 */
const mediaMobile = media.tablet;

/* ── 페이지 컨테이너 ── */

/**
 * 마이페이지 최외곽 래퍼.
 * 전체 너비를 차지하며 fadeInUp 애니메이션으로 등장한다.
 */
export const Wrapper = styled.div`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
  animation: ${fadeInUp} 0.5s ease forwards;
`;

/**
 * 내부 컨테이너 — contentNarrow(800px) 너비로 중앙 정렬.
 * 자식 요소를 세로 방향으로 xl 간격으로 배치.
 */
export const Inner = styled.div`
  max-width: ${({ theme }) => theme.layout.contentNarrow};
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
`;

/* ── 페이지 헤더 — glass-card + gradient-glow 배경 ── */

/**
 * 프로필 헤더 카드 — glass-card 스타일.
 * 아바타와 사용자 정보를 가로로 배치한다.
 * ::after 로 gradient-glow 배경 오브를 생성한다.
 * 모바일(640px) 이하에서 세로 방향 + 중앙 정렬로 전환.
 */
export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: ${({ theme }) => theme.glass.blur};
  -webkit-backdrop-filter: ${({ theme }) => theme.glass.blur};
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  position: relative;
  overflow: hidden;

  /* gradient-glow 배경 오브 */
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 30%;
    transform: translate(-50%, -50%);
    width: 300px;
    height: 300px;
    background: ${({ theme }) => theme.gradients.glow};
    pointer-events: none;
    opacity: 0.5;
  }

  ${mediaMobile} {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
`;

/**
 * 아바타 래퍼 — gradient(보라→시안) 테두리를 3px 패딩으로 구현.
 * hover 시 pulseGlow(primary) 효과.
 * z-index: 1 로 ::after 배경 오브 위에 렌더링.
 */
export const AvatarWrap = styled.div`
  padding: 3px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.gradients.primary};
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  transition: box-shadow ${({ theme }) => theme.transitions.base};

  &:hover {
    box-shadow: ${({ theme }) => theme.glows.primary};
  }
`;

/**
 * 아바타 원형 — 80px, 내부 보라 그라데이션 배경.
 * 닉네임 첫 글자를 대형 볼드 텍스트로 표시.
 */
export const Avatar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary},
    ${({ theme }) => theme.colors.primaryDark}
  );
  color: white;
  font-size: ${({ theme }) => theme.typography.text3xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
`;

/**
 * 사용자 정보 영역 — 닉네임/등급/이메일/편집 버튼을 세로로 배치.
 * z-index: 1 로 ::after 배경 오브 위에 렌더링.
 */
export const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  flex: 1;
  position: relative;
  z-index: 1;
`;

/**
 * 닉네임 + 등급 배지를 가로로 배치하는 행.
 * 모바일(640px) 이하에서 중앙 정렬.
 */
export const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  ${mediaMobile} {
    justify-content: center;
  }
`;

/**
 * 닉네임 제목 텍스트.
 */
export const Nickname = styled.h1`
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

/**
 * 등급 배지 — gradient-accent(핑크→노랑→시안) + 글로우.
 */
export const GradeBadge = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  padding: 2px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.gradients.accent};
  color: white;
  letter-spacing: 0.5px;
  box-shadow: 0 0 12px rgba(239, 71, 111, 0.2);
`;

/**
 * 이메일 텍스트 — muted 색상, sm 크기.
 */
export const Email = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`;

/**
 * 프로필 편집 버튼 — gradient outline 스타일.
 * hover 시 gradient 배경 채우기 + glow 효과.
 * 모바일(640px) 이하에서 align-self: center 로 중앙 정렬.
 */
export const EditBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xs};
  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  width: fit-content;

  &:hover {
    background: ${({ theme }) => theme.gradients.primary};
    border-color: transparent;
    color: white;
    box-shadow: ${({ theme }) => theme.glows.primary};
  }

  ${mediaMobile} {
    align-self: center;
  }
`;

/* ── 탭 네비게이션 ── */

/**
 * 탭 버튼 행 — 하단 기준선(border-bottom)을 공유.
 * overflow-x: auto 로 좁은 화면에서 수평 스크롤 허용.
 */
export const Tabs = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderDefault};
  overflow-x: auto;
`;

/**
 * 개별 탭 버튼.
 *
 * $active 가 true 이면:
 *   - primary 색상 + gradient 하단 바 (border-image) 적용
 *   - fontSemibold 강조
 * hover 시 textPrimary + bgTertiary 배경.
 */
export const Tab = styled.button`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) =>
    theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textSecondary};
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;
  margin-bottom: -1px;
  border-radius: ${({ theme }) => theme.radius.md} ${({ theme }) => theme.radius.md} 0 0;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
    background-color: ${({ theme }) => theme.colors.bgTertiary};
  }

  /* 활성 탭 — gradient 하단 바 */
  ${({ $active, theme }) =>
    $active &&
    css`
      color: ${theme.colors.primary};
      border-bottom: 3px solid;
      border-image: ${theme.gradients.primary} 1;
      font-weight: ${theme.typography.fontSemibold};
    `}
`;

/* ── 에러 표시 ── */

/**
 * 에러 메시지 배너 — error 색상 테두리 + 배경.
 * 닫기 버튼과 메시지를 가로로 배치.
 */
export const ErrorBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.errorBg};
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

/**
 * 에러 배너 닫기 버튼.
 */
export const ErrorClose = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.textXs};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
`;

/* ── 탭 콘텐츠 ── */

/**
 * 탭 콘텐츠 영역.
 * key={activeTab} 으로 리렌더 시 fadeInUp 애니메이션 재실행.
 */
export const Content = styled.div`
  min-height: 300px;
  animation: ${fadeInUp} 0.3s ease-out;
`;

/* ── 프로필 카드 — glass-card + hover shine ── */

/**
 * 프로필 정보 카드 — glass-card 스타일.
 * hover 시 좌→우 광선(cardShine) 효과.
 * 필드를 세로로 lg 간격으로 배치.
 */
export const ProfileCard = styled.div`
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: blur(8px) saturate(1.4);
  -webkit-backdrop-filter: blur(8px) saturate(1.4);
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  position: relative;
  overflow: hidden;

  /* hover shine */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.03),
      transparent
    );
    pointer-events: none;
  }

  &:hover::before {
    animation: ${cardShine} 0.8s ease forwards;
  }
`;

/**
 * 프로필 개별 필드 행 — 라벨 + 값을 가로로 배치.
 * 마지막 항목을 제외하고 하단에 보라 반투명 구분선을 표시.
 * 모바일(640px) 이하에서 세로 방향 + xs 간격으로 전환.
 */
export const ProfileField = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  padding-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.primaryLight};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  ${mediaMobile} {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.xs};
    align-items: flex-start;
  }
`;

/**
 * 프로필 필드 라벨 — muted 색상, 최소 너비 80px.
 */
export const ProfileLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textMuted};
  min-width: 80px;
`;

/**
 * 프로필 필드 값 텍스트.
 */
export const ProfileValue = styled.span`
  font-size: ${({ theme }) => theme.typography.textBase};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

/* ── 선호 설정 카드 ── */

/**
 * 선호 설정 glass-card — 프로필 카드와 동일한 glass-card 스타일.
 * 내부 항목을 세로로 md 간격으로 배치.
 */
export const PreferencesCard = styled.div`
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: blur(8px) saturate(1.4);
  -webkit-backdrop-filter: blur(8px) saturate(1.4);
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

/**
 * 선호 설정 섹션 제목.
 */
export const PreferencesTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

/**
 * 선호 설정 안내 힌트 텍스트.
 */
export const PreferencesHint = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`;

/**
 * 장르 태그 버튼 목록 — 가로 방향 flex + wrap.
 */
export const PreferencesTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/* ─────────────────────────────────────────────────────────────
 * 시청 이력 탭 (2026-04-08 재도입)
 * user_watch_history 테이블 기반 — Kaggle 시드와 분리된 운영 도메인
 * ───────────────────────────────────────────────────────────── */

/**
 * 시청 이력 리스트 외곽 카드 — glass-card 스타일.
 */
export const WatchHistoryCard = styled.div`
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: blur(8px) saturate(1.4);
  -webkit-backdrop-filter: blur(8px) saturate(1.4);
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.lg};
`;

/**
 * 시청 이력 항목 ul.
 */
export const WatchHistoryList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/**
 * 시청 이력 항목 li — 좌측 정보 / 우측 메타+삭제 가로 배치.
 * 모바일에서는 세로 스택으로 전환된다.
 */
export const WatchHistoryItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.surfaceAlt || theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.glass.border};
  transition: background ${({ theme }) => theme.motion?.fast || '0.15s'} ease;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover || theme.colors.surface};
  }

  ${mediaMobile} {
    flex-direction: column;
    align-items: flex-start;
  }
`;

/**
 * 시청 이력 항목 좌측 메인 — movieId / 시청 일시 등.
 */
export const WatchHistoryItemMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  flex: 1 1 auto;
  min-width: 0;
`;

/**
 * 시청한 영화 ID (또는 영화 제목 — 추후 영화 메타 join 시).
 */
export const WatchHistoryMovieId = styled.span`
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * 시청 일시 / 평점 / 시청 경로 등 메타 정보 묶음.
 */
export const WatchHistoryMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/**
 * 메타 정보 배지 1개 (시청일/평점/경로 등).
 */
export const WatchHistoryBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.surfaceMuted || theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary || theme.colors.textMuted};
`;

/**
 * 시청 기록 삭제 버튼 — 본인 소유만 삭제 가능.
 */
export const WatchHistoryDeleteBtn = styled.button`
  flex-shrink: 0;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.danger || '#ef4444'};
  color: ${({ theme }) => theme.colors.danger || '#ef4444'};
  background: transparent;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  transition: background ${({ theme }) => theme.motion?.fast || '0.15s'} ease,
              color ${({ theme }) => theme.motion?.fast || '0.15s'} ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.danger || '#ef4444'};
    color: #fff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* ── 프로필 수정 모달 ── */

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 200;
  animation: ${overlayFadeIn} 0.2s ease;
`;

export const ModalContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 201;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: blur(16px) saturate(1.6);
  -webkit-backdrop-filter: blur(16px) saturate(1.6);
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  animation: ${modalSlideUp} 0.25s ease;

  ${media.mobile} {
    max-width: calc(100vw - 32px);
    padding: ${({ theme }) => theme.spacing.lg};
  }
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

export const ModalTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

export const ModalCloseBtn = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.25rem;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  line-height: 1;
  border-radius: ${({ theme }) => theme.radius.sm};
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

export const ModalSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding-bottom: ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.primaryLight};
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  &:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
    margin-bottom: 0;
  }
`;

export const ModalSectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin: 0;
`;

export const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const FormLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const FormInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textBase};
  transition: border-color ${({ theme }) => theme.transitions.fast};
  box-sizing: border-box;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.glows.primary};
  }

  ${({ $error, theme }) =>
    $error &&
    css`
      border-color: ${theme.colors.error};
    `}
`;

export const FormHelperText = styled.p`
  font-size: ${({ theme }) => theme.typography.textXs};
  margin: 0;
  color: ${({ $error, theme }) =>
    $error ? theme.colors.error : theme.colors.textMuted};
`;

export const AvatarPreviewRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const AvatarPreviewImg = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $src, theme }) =>
    $src
      ? `url(${$src}) center/cover no-repeat`
      : `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  flex-shrink: 0;
  border: 2px solid ${({ theme }) => theme.glass.border};
`;

export const ModalButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

export const ModalCancelBtn = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.textMuted};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

export const ModalSaveBtn = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.gradients.primary};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  color: white;
  font-size: ${({ theme }) => theme.typography.textSm};
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

export const ModalErrorBar = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.errorBg};
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  margin: 0 0 ${({ theme }) => theme.spacing.md};
`;

/**
 * 개별 장르 태그 버튼.
 * hover 시 primary 테두리 + 색상 + primaryLight 배경 + translateY(-1px) + 글로우.
 *
 * $active 가 true 이면 gradient 배경 + 흰 글자로 선택 상태 표시 (현재 미사용, 확장 대비).
 */
export const PreferencesTag = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textSecondary};
  background-color: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.primaryLight};
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.glow};
  }

  /* 활성 태그 (선택됨) — 확장 대비 */
  ${({ $active, theme }) =>
    $active &&
    css`
      background: ${theme.gradients.primary};
      border-color: transparent;
      color: white;
    `}
`;
