/**
 * ChatWindow styled-components 정의.
 *
 * ChatWindow.css(994줄)의 모든 규칙을 styled-components로 이관한다.
 * 구조:
 *   - 로컬 keyframe 2개 (fadeIn, dotBounce)
 *   - 전체 레이아웃 (ChatWindowWrapper, DragOverlay)
 *   - 헤더 (ChatHeader, ChatHeaderLeft, HeaderAvatar, HeaderTitle, HeaderSubtitle, HeaderClearBtn)
 *   - 메시지 영역 (ChatMessages, ChatWelcome, WelcomeIcon, WelcomeTitle, WelcomeDesc,
 *                   WelcomeSuggestions, WelcomeSuggestionBtn)
 *   - 메시지 버블 (ChatMsg, MsgAvatar, MsgBubble, MsgImage)
 *   - 상태 인디케이터 (ChatStatus, StatusDots, StatusDot, StatusText)
 *   - 영화 카드 목록 (ChatMovieCards, MovieCardWrapper, MovieCardRank,
 *                     MovieCardPoster, MovieCardInfo, MovieCardTitle, MovieCardTitleEn,
 *                     MovieCardMeta, MovieCardCrew, MovieCardTags, MovieCardTag,
 *                     MovieCardOverview, MovieCardExplanation, MovieCardOtt, MovieCardOttBadge,
 *                     MovieCardTrailer)
 *   - 후속 질문 칩 (ChatClarification, ClarificationGroup, ClarificationLabel,
 *                   ClarificationChips, ClarificationChip)
 *   - 입력 영역 (ChatInput, ImagePreviewWrapper, ImagePreviewImg, ImagePreviewRemoveBtn,
 *                InputContainer, TextareaWrapper, Textarea, CharCount, InputBtn)
 *   - 포인트 바 (ChatPointBar, PointBalance, PointIcon, PointDivider, PointUsage, FreeBadge)
 *   - 쿼터 에러 배너 (ChatQuotaError, QuotaErrorClose, QuotaErrorContent,
 *                     QuotaErrorTitle, QuotaErrorDesc, QuotaErrorLink)
 */

import styled, { keyframes, css } from 'styled-components';
import { media } from '../../../shared/styles/media';

/* ============================================================
 * 로컬 keyframes
 * ============================================================ */

/**
 * 메시지/배너 등장 애니메이션.
 * 아래에서 8px 위로 이동하며 불투명도 0→1.
 */
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

/**
 * 처리 상태 인디케이터 3점 바운스 애니메이션.
 * 0/80/100% → scale 0.6, opacity 0.4
 * 40% → scale 1.0, opacity 1.0
 */
const dotBounce = keyframes`
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
`;

/* ============================================================
 * 전체 레이아웃
 * ============================================================ */

/**
 * 채팅 윈도우 루트 컨테이너.
 *
 * $isDragging prop이 true이면 점선 보라 아웃라인을 표시한다.
 */
export const ChatWindowWrapper = styled.div`
  display: flex;
  flex-direction: column;
  /*
   * 2026-04-23 헤더 재설계:
   * /chat 은 MainLayout(hideFooter) 아래에 편입되므로 상단 Header(64px) 를 제외한
   * 나머지 뷰포트를 채워야 한다. Footer 는 hideFooter 로 미렌더.
   * (styled-components 템플릿 리터럴 내부라 백틱 사용 금지 — 템플릿 종료로 해석됨)
   */
  height: calc(100vh - ${({ theme }) => theme.layout.headerHeight});
  width: 100%;
  background-color: ${({ theme }) => theme.colors.bgMain};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  position: relative;

  /* 드래그 오버 시 점선 아웃라인 */
  ${({ $isDragging, theme }) =>
    $isDragging &&
    css`
      outline: 2px dashed ${theme.colors.primary};
      outline-offset: -2px;
    `}

  ${media.mobile} {
    max-width: 100%;
  }
`;

/**
 * 드래그 오버 시 반투명 안내 레이어.
 * pointer-events: none → 하위 이벤트를 차단하지 않는다.
 */
export const DragOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 100;
  background-color: ${({ theme }) => theme.header.bg};
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

/** 드래그 오버레이 내용 (아이콘 + 텍스트) */
export const DragOverlayContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: ${({ theme }) => theme.colors.primary};
`;

/** 드래그 오버레이 SVG 아이콘 래퍼 */
export const DragOverlayIcon = styled.span`
  font-size: 48px;
  opacity: 0.8;
`;

/** 드래그 오버레이 안내 텍스트 */
export const DragOverlayText = styled.span`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
`;

/* ============================================================
 * 헤더
 * ============================================================ */

/**
 * (Deprecated 2026-04-23) 채팅 전용 도구바.
 *
 * 상단 MainLayout Header 와 이중 바를 만들어 UX 저해 → ChatHeader 자체를 렌더하지 않는다.
 * 필요한 두 기능(이전 대화 토글 / 새 대화) 은 아래 `ChatFloatingHamburger` /
 * `ChatFloatingNewBtn` 로 메시지 영역 좌/우 상단에 floating 배치.
 * styled 컴포넌트는 레거시 호환(시드 데이터/테스트 등 잠재 참조) 을 위해 export 는 유지하되
 * ChatWindow.jsx 에서는 더 이상 사용하지 않는다.
 */
export const ChatHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  min-height: 44px;
  background-color: ${({ theme }) => theme.colors.bgCard};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderDefault};
  flex-shrink: 0;
`;

/**
 * 채팅 좌상단 Floating 햄버거 버튼 — 이전 대화 사이드바 토글.
 *
 * ChatWindowWrapper(position: relative) 기준 absolute. MainLayout Header +
 * ChatPointBar(쿼터 사용 현황) 아래로 충분히 내려와 두 영역과 겹치지 않게 한다.
 * (2026-04-27: 12 → 24 → 56px 로 추가 하향. ChatPointBar 가 항상 노출되는 구조로
 *  변경된 후 그 아래에 자연스럽게 배치되도록 조정)
 */
export const ChatFloatingHamburger = styled.button`
  position: absolute;
  top: 56px;
  left: 12px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryLight};
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:active {
    transform: scale(0.95);
  }
`;

/**
 * 채팅 우상단 Floating "새 대화" 버튼.
 *
 * 햄버거와 대칭으로 우측에 배치. 라벨이 있으므로 pill 형태.
 * 기존 `HeaderClearBtn` 과 시각적으로 동일 계열이지만 floating 이므로 shadow 강화.
 */
export const ChatFloatingNewBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.primary};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryLight};
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:active {
    transform: scale(0.97);
  }
`;

/** 헤더 좌측 영역 (뒤로가기 + 아바타 + 텍스트) */
export const ChatHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

/**
 * 좌측 상단 유저 프로필 버튼 (2026-04-23 도구바 개편 신설).
 *
 * 아바타(원형 이니셜) + 닉네임. 클릭 시 /account/profile 로 이동.
 * 도구바의 햄버거(이전 대화) 와 시각적으로 구분되도록 배경·테두리를 명확히 부여.
 */
export const ChatProfileBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.bgMain};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  max-width: 180px;
  flex-shrink: 1;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryLight};
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:active {
    transform: scale(0.97);
  }
`;

/** 프로필 버튼 내부 아바타 (32×32 원형, 닉네임 이니셜) */
export const ChatProfileAvatar = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
`;

/** 프로필 버튼 내부 닉네임 — 모바일에서 긴 닉네임이 레이아웃을 깨지 않도록 말줄임 */
export const ChatProfileName = styled.span`
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
`;

/**
 * 뒤로가기 버튼.
 * 원형 hover 효과 + 보라색 아이콘.
 */
export const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  flex-shrink: 0;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryLight};
    color: ${({ theme }) => theme.colors.primary};
  }

  &:active {
    transform: scale(0.92);
  }
`;

/** 몽글픽 로고 이미지 (36×36) */
export const HeaderAvatar = styled.img`
  width: 36px;
  height: 36px;
  object-fit: contain;
  flex-shrink: 0;
  font-size: 16px;
  color: #fff;
`;

/** 서비스 이름 제목 */
export const HeaderTitle = styled.h1`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.typography.fontBold};
  margin: 0;
  line-height: 1.2;
`;

/** 서비스 설명 부제목 */
export const HeaderSubtitle = styled.p`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  line-height: 1.2;
`;

/** 새 대화 버튼 — 보라 테두리 + hover 시 보라 배경 채움 */
export const HeaderClearBtn = styled.button`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryLight};
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  &:active {
    transform: scale(0.95);
  }
`;

/* ============================================================
 * 메시지 영역
 * ============================================================ */

/**
 * 스크롤 가능한 메시지 목록 컨테이너.
 * 커스텀 스크롤바(thin)를 포함한다.
 */
export const ChatMessages = styled.main`
  flex: 1;
  overflow-y: auto;
  /*
   * 상단 패딩 108px: ChatFloatingHamburger (top:56 + h:40 + 12px 여백) 이
   * 위로 뜨므로 콘텐츠 첫 줄이 버튼과 겹치지 않도록 여유 확보.
   * (2026-04-27: 햄버거 top 12 → 24 → 56 추가 하향에 맞춰 64 → 76 → 108 동반 조정.
   *  ChatPointBar 가 mount 시 즉시 노출되므로 그 아래로 콘텐츠가 자연스럽게 흐른다.)
   */
  padding: 108px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  /* 커스텀 스크롤바 — 파이어폭스 */
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.colors.borderDefault} transparent;

  /* 커스텀 스크롤바 — 웹킷 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.colors.borderDefault};
    border-radius: 3px;
  }
`;

/* ── 초기 안내 메시지 ── */

/**
 * 메시지가 없을 때 표시되는 환영 영역.
 *
 * 2026-04-23: 기존 justify-content: center 였던 것을 flex-start 로 변경 — 하단 고정 입력창과
 *   공제된 잔여 영역의 중앙에 칩만 배치되면 낮은 뷰포트에서 칩이 밀려난다는 피드백.
 * 2026-04-24: 빈 상태 입력창을 ChatWelcome 내부(칩 아래)로 임베드 — 칩+입력창이 한 덩어리가
 *   되어 세로 중앙 정렬해도 자연스럽게 상단에 가깝게 배치된다. justify-content: center 복귀.
 *   뷰포트가 짧으면 ChatMessages 의 overflow-y: auto 로 스크롤 가능하므로 밀림 이슈 없음.
 */
export const ChatWelcome = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  padding: 24px 20px 40px;
  gap: 12px;
`;

/** 환영 화면 몽글픽 로고 이미지 (80×80) */
export const WelcomeIcon = styled.img`
  width: 80px;
  height: 80px;
  object-fit: contain;
  font-size: 28px;
  color: #fff;
  margin-bottom: 4px;
`;

/** 환영 제목 */
export const WelcomeTitle = styled.h2`
  font-size: 20px;
  font-weight: ${({ theme }) => theme.typography.fontBold};
  margin: 0;
`;

/** 환영 설명 문구 */
export const WelcomeDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  max-width: 360px;
  line-height: 1.6;
`;

/** 추천 질문 버튼 그리드 (flex wrap) */
export const WelcomeSuggestions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: 12px;
  max-width: 480px;

  ${media.mobile} {
    flex-direction: column;
    align-items: stretch;
    max-width: 100%;
  }
`;

/** 개별 추천 질문 버튼 */
export const WelcomeSuggestionBtn = styled.button`
  padding: 8px 14px;
  border-radius: 18px;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 13px;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  text-align: left;
  line-height: 1.4;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
    color: #fff;
  }
`;

/* ============================================================
 * 메시지 버블
 * ============================================================ */

/**
 * 개별 메시지 행.
 *
 * $isUser prop이 true이면 오른쪽 정렬, false이면 왼쪽 정렬.
 */
export const ChatMsg = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
  max-width: 85%;
  animation: ${fadeIn} 0.3s ease-out;
  align-self: ${({ $isUser }) => ($isUser ? 'flex-end' : 'flex-start')};

  ${media.mobile} {
    max-width: 90%;
  }
`;

/** 봇 아바타 이미지 (28×28, 메시지 상단 2px 여백) */
export const MsgAvatar = styled.img`
  width: 28px;
  height: 28px;
  object-fit: contain;
  flex-shrink: 0;
  font-size: 12px;
  color: #fff;
  margin-top: 2px;
`;

/**
 * 메시지 행에 표시되는 몽글이 캐릭터 아바타 래퍼.
 *
 * MsgAvatar와 동일한 크기(28×28)를 유지하면서
 * MonggleCharacter가 overflow: visible로 팔/귀가 삐져나와도
 * 레이아웃이 무너지지 않도록 overflow: visible을 허용한다.
 * flex-shrink: 0으로 버블이 좁아져도 캐릭터 크기가 고정된다.
 */
export const MonggleAvatarWrapper = styled.div`
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  margin-top: 2px;
  /* SVG overflow(팔, 귀)가 클리핑되지 않도록 */
  overflow: visible;
  /* 캐릭터가 중앙 정렬되도록 */
  display: flex;
  align-items: center;
  justify-content: center;
`;

/**
 * 메시지 버블.
 *
 * $variant prop:
 *   - 'user'      → 보라 배경, 흰 텍스트, 우하단 4px 라운딩
 *   - 'bot'       → 카드 배경, 좌하단 4px 라운딩
 *   - 'error'     → 빨간 반투명 배경 + 보더, 좌하단 4px 라운딩
 * $cancelled prop: true이면 opacity 0.6, 점선 보더
 */
export const MsgBubble = styled.div`
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radius.xl};
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;

  /* variant별 스타일 */
  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'user':
        return css`
          background-color: ${theme.colors.primary};
          color: #fff;
          border-bottom-right-radius: ${theme.radius.sm};
        `;
      case 'error':
        return css`
          background-color: rgba(233, 69, 96, 0.15);
          color: #e94560;
          border: 1px solid rgba(233, 69, 96, 0.3);
          border-bottom-left-radius: ${theme.radius.sm};
        `;
      default: /* 'bot' */
        return css`
          background-color: ${theme.colors.bgCard};
          border-bottom-left-radius: ${theme.radius.sm};
        `;
    }
  }}

  /* 취소된 응답 */
  ${({ $cancelled, theme }) =>
    $cancelled &&
    css`
      opacity: 0.6;
      border: 1px dashed ${theme.colors.borderDefault};
    `}
`;

/** 사용자 메시지 내 첨부 이미지 (최대 200×200) */
export const MsgImage = styled.img`
  display: block;
  max-width: 200px;
  max-height: 200px;
  border-radius: ${({ theme }) => theme.radius.md};
  margin-bottom: 6px;
  object-fit: cover;
`;

/* ============================================================
 * 처리 상태 인디케이터 (타이핑 애니메이션)
 * ============================================================ */

/** 상태 인디케이터 버블 컨테이너 */
export const ChatStatus = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 10px 14px;
  background-color: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radius.xl};
  border-bottom-left-radius: ${({ theme }) => theme.radius.sm};
`;

/** 3개 점 묶음 컨테이너 */
export const StatusDots = styled.div`
  display: flex;
  gap: 3px;
`;

/**
 * 개별 점.
 * $delay prop(초 단위 음수값)으로 dotBounce 애니메이션 딜레이를 제어한다.
 */
export const StatusDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.textSecondary};
  animation: ${dotBounce} 1.4s infinite ease-in-out both;
  animation-delay: ${({ $delay }) => $delay ?? '0s'};
`;

/** 상태 텍스트 (처리 단계 메시지) */
export const StatusText = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/* ============================================================
 * 영화 카드 목록 (가로 스크롤)
 * ============================================================ */

/**
 * 영화 카드 가로 스크롤 래퍼.
 * max-width: calc(100vw - 100px)로 화면을 넘지 않도록 제한한다.
 */
export const ChatMovieCards = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 4px 0;
  max-width: calc(100vw - 100px);

  /* 가로 스크롤바 — 파이어폭스 */
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.colors.borderDefault} transparent;

  /* 가로 스크롤바 — 웹킷 */
  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.colors.borderDefault};
    border-radius: 2px;
  }

  ${media.mobile} {
    max-width: calc(100vw - 72px);
  }
`;

/**
 * 개별 영화 카드.
 * flex-shrink: 0 → 가로 스크롤 시 카드가 줄어들지 않는다.
 */
export const MovieCardWrapper = styled.div`
  flex-shrink: 0;
  width: 260px;
  background-color: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  transition: transform ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast};
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  }

  ${media.mobile} {
    width: 220px;
  }
`;

/** 순위 배지 (카드 좌상단 절대 위치) */
export const MovieCardRank = styled.span`
  position: absolute;
  top: 8px;
  left: 8px;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontBold};
  padding: 2px 8px;
  border-radius: 10px;
  z-index: 1;
`;

/** 포스터 이미지 래퍼 (160px 고정 높이) */
export const MovieCardPoster = styled.div`
  width: 100%;
  height: 160px;
  overflow: hidden;
  background-color: #111;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

/** 카드 텍스트 정보 영역 */
export const MovieCardInfo = styled.div`
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

/** 한국어 제목 (2줄 초과 말줄임) */
export const MovieCardTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/** 영어 제목 (한 줄 말줄임) */
export const MovieCardTitleEn = styled.p`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/**
 * 메타 정보 (연도·평점·관람등급).
 * span 사이에 가운뎃점(·)을 after 가상 요소로 삽입한다.
 */
export const MovieCardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textSecondary};

  span:not(:last-child)::after {
    content: '·';
    margin-left: ${({ theme }) => theme.spacing.sm};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

/** 감독/출연 텍스트 (한 줄 말줄임) */
export const MovieCardCrew = styled.p`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/** 태그 목록 (flex-wrap) */
export const MovieCardTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

/**
 * 개별 태그 칩.
 *
 * $tagType prop:
 *   - 'genre' → 보라-회색 배경 (#3a3a5c), 밝은 보라 텍스트
 *   - 'mood'  → 남색 배경 (#2a2a4a), 연보라 텍스트
 *   - 기본    → 투명 배경
 */
export const MovieCardTag = styled.span`
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  line-height: 1.4;

  ${({ $tagType }) => {
    switch ($tagType) {
      case 'genre':
        return css`
          background-color: #3a3a5c;
          color: #b0b0d0;
        `;
      case 'mood':
        return css`
          background-color: #2a2a4a;
          color: #9090c0;
        `;
      default:
        return '';
    }
  }}
`;

/** 줄거리 (3줄 초과 말줄임) */
export const MovieCardOverview = styled.p`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/**
 * 추천 이유 블록.
 * 보라색 좌측 보더 + 연한 보라 배경.
 */
export const MovieCardExplanation = styled.p`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
  line-height: 1.5;
  padding: 6px 8px;
  background-color: ${({ theme }) => theme.colors.primaryLight};
  border-radius: ${({ theme }) => theme.radius.sm};
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
`;

/** OTT 플랫폼 배지 목록 */
export const MovieCardOtt = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`;

/** 개별 OTT 배지 (녹색 계열) */
export const MovieCardOttBadge = styled.span`
  font-size: 10px;
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background-color: #1e3a2e;
  color: #70c090;
`;

/** 트레일러 링크 */
export const MovieCardTrailer = styled.a`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primaryHover};
    text-decoration: underline;
  }
`;

/* ============================================================
 * 후속 질문 힌트 칩 (Clarification)
 * ============================================================ */

/**
 * clarification 블록 전체를 감싸는 외부 래퍼.
 *
 * ChatMsg 내부에서 MonggleAvatarWrapper 옆에 배치되며,
 * question 텍스트 + 힌트 칩 목록을 세로로 쌓는다.
 * fadeIn 애니메이션으로 부드럽게 등장한다.
 */
export const ClarificationWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: ${fadeIn} 0.25s ease-out;
`;

/**
 * 후속 질문 텍스트.
 *
 * 봇 버블과 동일한 배경/라운딩을 사용하여 시각적 일관성을 유지한다.
 * 좌하단 모서리를 줄여 말풍선 꼬리 느낌을 준다.
 */
export const ClarificationQuestion = styled.p`
  margin: 0;
  padding: 10px 14px;
  background-color: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radius.xl};
  border-bottom-left-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: 1.5;
`;

/**
 * clarification 이벤트 수신 시 표시되는 힌트 칩 컨테이너.
 * 봇 버블과 동일한 배경/라운딩을 사용한다.
 */
export const ChatClarification = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  background-color: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radius.xl};
  border-bottom-left-radius: ${({ theme }) => theme.radius.sm};
`;

/** 필드별 그룹 (예: "장르", "분위기") */
export const ClarificationGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

/** 필드 레이블 (보조 텍스트) */
export const ClarificationLabel = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

/** 힌트 칩 목록 (flex-wrap, 칩 사이 간격) */
export const ClarificationChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

/**
 * 개별 힌트 칩.
 *
 * 기본: 보라 테두리 + 투명 배경 + primary 색상 텍스트.
 * hover: 보라 배경 + 흰색 텍스트 (클릭 가능함을 시각적으로 강조).
 * disabled: opacity 0.4 + not-allowed 커서 (로딩 중 칩 잠금).
 */
export const ClarificationChip = styled.button`
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.textXs};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  line-height: 1.4;
  font-family: inherit;
  font-weight: ${({ theme }) => theme.typography.fontMedium};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
    color: #fff;
    /* hover 시 살짝 위로 올라오는 효과 */
    transform: translateY(-1px);
    box-shadow: 0 3px 10px ${({ theme }) => theme.colors.primary}40;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

/* ============================================================
 * AI 생성 제안 카드 (SuggestedOption)
 * ============================================================
 * Claude Code 스타일 "질문 + 제안" UX (2026-04-15 신설).
 * SSE clarification.suggestions 로 내려오는 카드 2~4개를 렌더링한다.
 * 각 카드는 text(타이틀) + reason(부제) 을 세로로 쌓고, 클릭 시 value 가
 * 채팅 입력으로 자동 전송된다.
 */

/** 제안 카드 컨테이너 — 세로 스택 (카드가 넓이를 차지) */
export const SuggestionCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

/**
 * 개별 제안 카드.
 *
 * 기본: 연한 보라 배경 + 좌측 강조 바. 버튼이라 onClick 가능.
 * hover: 살짝 띄워서 클릭 가능함을 강조.
 */
export const SuggestionCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 10px 14px;
  border: 1px solid ${({ theme }) => theme.colors.primary}33;
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  text-align: left;
  transition: all ${({ theme }) => theme.transitions.fast};
  font-family: inherit;
  width: 100%;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 4px 12px ${({ theme }) => theme.colors.primary}25;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/** 제안 카드 타이틀 (짧은 라벨) */
export const SuggestionTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.4;
`;

/** 제안 카드 부제 (reason) — 가벼운 톤 */
export const SuggestionReason = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
`;

/** "직접 입력하셔도 돼요" 같은 허용 안내 텍스트 */
export const SuggestionHelperText = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
`;

/* ============================================================
 * 입력 영역
 * ============================================================ */

/**
 * 하단 입력 영역 전체 래퍼.
 *
 * $variant='bottom' (기본, 메시지 존재 시): 하단 고정 — border-top + flex-shrink:0 로 높이 고정.
 * $variant='embedded' (2026-04-24, 빈 상태): ChatWelcome 내부 칩 아래에 카드 형태로 임베드.
 *   border-top 제거, 전체 테두리 + 라운드로 감싸서 칩과 동일한 시각 톤으로 맞춘다.
 *   max-width 로 과도한 가로 확장 방지.
 */
export const ChatInputWrapper = styled.footer`
  padding: 12px 16px;
  background-color: ${({ theme }) => theme.colors.bgMain};

  ${({ $variant = 'bottom', theme }) =>
    $variant === 'embedded'
      ? css`
          width: 100%;
          max-width: 560px;
          margin: 12px auto 0;
          border: 1px solid ${theme.colors.borderDefault};
          border-radius: 20px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
        `
      : css`
          border-top: 1px solid ${theme.colors.borderDefault};
          flex-shrink: 0;
        `}
`;

/** 이미지 미리보기 래퍼 (relative → 제거 버튼 absolute 기준) */
export const ImagePreviewWrapper = styled.div`
  position: relative;
  display: inline-block;
  margin-bottom: 8px;
`;

/** 미리보기 이미지 (최대 120×120) */
export const ImagePreviewImg = styled.img`
  max-width: 120px;
  max-height: 120px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  object-fit: cover;
  display: block;
`;

/** 이미지 제거 버튼 (미리보기 우상단 ×) */
export const ImagePreviewRemoveBtn = styled.button`
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background-color: #e94560;
  color: #fff;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.fontBold};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: #d03050;
  }
`;

/**
 * 입력 컨테이너 (textarea + 버튼 묶음).
 * focus-within 시 보라 보더로 강조.
 */
export const InputContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.bgInput};
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  padding: 8px 8px 8px 12px;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

/**
 * textarea 래퍼.
 * position: relative → 글자수 카운터를 absolute로 배치하기 위한 기준.
 */
export const TextareaWrapper = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

/** 텍스트 입력 textarea */
export const Textarea = styled.textarea`
  width: 100%;
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: 1.5;
  resize: none;
  max-height: 120px;
  font-family: inherit;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:disabled {
    opacity: 0.5;
  }
`;

/**
 * 글자수 카운터.
 * textarea 우하단에 absolute 배치.
 * $ratio prop으로 색상을 결정한다:
 *   - 0.9 초과 → error 빨강
 *   - 0.7 이상 → warning 노랑
 *   - 기본     → success 초록
 */
export const CharCount = styled.span`
  position: absolute;
  bottom: -2px;
  right: 4px;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  pointer-events: none;
  line-height: 1;
  user-select: none;

  ${({ $ratio }) => {
    if ($ratio > 0.9)
      return css`
        color: #f87171;
      `;
    if ($ratio >= 0.7)
      return css`
        color: #fbbf24;
      `;
    return css`
      color: #4ade80;
    `;
  }}
`;

/**
 * 공통 입력 버튼 (전송/취소/첨부).
 * $variant prop으로 외관을 구분한다:
 *   - 'send'   → 보라 배경, 비활성 시 회색
 *   - 'cancel' → 빨간 배경
 *   - 'attach' → 투명 배경, 호버 시 연보라
 */
export const InputBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: ${({ theme }) => theme.typography.fontBold};
  transition: all ${({ theme }) => theme.transitions.fast};
  flex-shrink: 0;
  padding: 0;

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'send':
        return css`
          background-color: ${theme.colors.primary};
          color: #fff;

          &:hover:not(:disabled) {
            background-color: ${theme.colors.primaryHover};
          }

          &:disabled {
            background-color: ${theme.colors.borderDefault};
            color: ${theme.colors.textMuted};
            cursor: not-allowed;
          }
        `;
      case 'cancel':
        return css`
          background-color: #e94560;
          color: #fff;
          font-size: 12px;

          &:hover {
            background-color: #d03050;
          }
        `;
      case 'attach':
        return css`
          background: transparent;
          color: ${theme.colors.textSecondary};

          &:hover:not(:disabled) {
            color: ${theme.colors.primary};
            background-color: ${theme.colors.primaryLight};
          }

          &:disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }
        `;
      default:
        return '';
    }
  }}
`;

/* ============================================================
 * 포인트 정보 바
 * 헤더 아래, 메시지 영역 위에 위치하여 잔액과 사용량을 표시한다.
 * ============================================================ */

/**
 * 포인트 정보 바 컨테이너.
 * point_update SSE 이벤트 수신 시 fadeIn 애니메이션으로 표시된다.
 */
export const ChatPointBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 8px 16px;
  background-color: ${({ theme }) => theme.colors.bgCard};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderDefault};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textSecondary};
  flex-shrink: 0;
  animation: ${fadeIn} 0.3s ease-out;

  ${media.mobile} {
    font-size: 11px;
    padding: 6px 12px;
  }
`;

/** 잔액 표시 (보석 아이콘 + 금액, 굵은 텍스트) */
export const PointBalance = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
`;

/** 보석 이모지 아이콘 */
export const PointIcon = styled.span`
  font-size: 14px;
  line-height: 1;
`;

/** 잔액/사용량 구분선 */
export const PointDivider = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
`;

/** 오늘 사용량 텍스트 */
export const PointUsage = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/**
 * 무료 이용 배지.
 * freeUsage=true일 때만 렌더링되며 초록 배경을 사용한다.
 */
export const FreeBadge = styled.span`
  padding: 2px 8px;
  border-radius: 10px;
  background-color: rgba(74, 222, 128, 0.15);
  color: #4ade80;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  margin-left: auto;
`;

/* ============================================================
 * 쿼터/포인트 에러 배너
 * 포인트 부족, 글자수 초과, 한도 초과 시 표시되는 경고 배너.
 * 닫기 버튼으로 해제 가능.
 * ============================================================ */

/**
 * 쿼터 에러 배너 컨테이너.
 * 빨간 반투명 배경 + 하단 보더. fadeIn 애니메이션 적용.
 */
export const ChatQuotaError = styled.div`
  position: relative;
  padding: 12px 40px 12px 16px;
  background-color: rgba(248, 113, 113, 0.08);
  border-bottom: 1px solid rgba(248, 113, 113, 0.2);
  flex-shrink: 0;
  animation: ${fadeIn} 0.3s ease-out;

  ${media.mobile} {
    padding: 10px 36px 10px 12px;
  }
`;

/** 닫기 버튼 (우상단 ×, absolute 배치) */
export const QuotaErrorClose = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textXs};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background-color ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: rgba(248, 113, 113, 0.15);
    color: ${({ theme }) => theme.colors.error};
  }
`;

/** 에러 내용 컨테이너 */
export const QuotaErrorContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

/** 에러 제목 (빨간 굵은 텍스트) */
export const QuotaErrorTitle = styled.span`
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.error};
`;

/** 에러 상세 설명 */
export const QuotaErrorDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  line-height: 1.5;
`;

/** 에러 배너 내 링크 (포인트 충전, 등급 업그레이드 등) */
export const QuotaErrorLink = styled.a`
  display: inline-block;
  margin-top: 4px;
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primaryHover};
    text-decoration: underline;
  }
`;
