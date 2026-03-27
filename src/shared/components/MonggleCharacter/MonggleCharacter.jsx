/**
 * 몽글이 캐릭터 애니메이션 컴포넌트.
 *
 * 실제 몽글이(팝콘 캐릭터)를 SVG로 재현하여 렌더링.
 * 빨간/흰 줄무늬 통 + 노란 팝콘 뭉치 + 귀여운 얼굴 + 별 지팡이.
 * animation prop에 따라 5가지 상태를 표현한다.
 *
 * 애니메이션 상태:
 * - idle       : 살짝 위아래 둥실둥실 (기본 대기)
 * - thinking   : 고개 갸우뚱 + 눈 깜빡임 + 생각 버블 (AI 처리 중)
 * - talking    : 살짝 끄덕 + 입 오물오물 (토큰 스트리밍 중)
 * - celebrating: 통통 점프 + 별 지팡이 흔들기 + 반짝 (추천 완료)
 * - waving     : 좌우 흔들기 + 별 지팡이 인사 (인사 / 완료)
 *
 * @param {Object}  props
 * @param {'idle'|'thinking'|'talking'|'celebrating'|'waving'} [props.animation='idle']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {string}  [props.className]
 */

import styled, { keyframes, css } from 'styled-components';

/* ============================================================
 * 크기 맵
 * ============================================================ */

const SIZE_MAP = {
  sm: 40,
  md: 64,
  lg: 96,
};

/* ============================================================
 * keyframes — 몸 전체 동작
 * ============================================================ */

/** idle: 부드럽게 위아래로 둥실둥실 떠다니기 */
const floatAnim = keyframes`
  0%   { transform: translateY(0px) rotate(0deg); }
  25%  { transform: translateY(-5px) rotate(0.5deg); }
  50%  { transform: translateY(-7px) rotate(0deg); }
  75%  { transform: translateY(-4px) rotate(-0.5deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

/** thinking: 고개 갸우뚱 — 좌우 회전 반복 */
const thinkAnim = keyframes`
  0%   { transform: translateY(0px) rotate(0deg); }
  20%  { transform: translateY(-3px) rotate(-8deg); }
  40%  { transform: translateY(-3px) rotate(8deg); }
  60%  { transform: translateY(-3px) rotate(-6deg); }
  80%  { transform: translateY(-2px) rotate(4deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

/** celebrating: 통통 튀면서 위로 점프 + scale */
const celebrateAnim = keyframes`
  0%   { transform: translateY(0px) scale(1); }
  15%  { transform: translateY(-12px) scale(1.08); }
  30%  { transform: translateY(-2px) scale(0.97); }
  45%  { transform: translateY(-14px) scale(1.1); }
  60%  { transform: translateY(-2px) scale(0.97); }
  75%  { transform: translateY(-8px) scale(1.05); }
  100% { transform: translateY(0px) scale(1); }
`;

/** waving: 살짝 기울며 인사하는 느낌 */
const waveBodyAnim = keyframes`
  0%   { transform: translateY(0px) rotate(0deg); }
  15%  { transform: translateY(-4px) rotate(-5deg); }
  30%  { transform: translateY(-5px) rotate(5deg); }
  45%  { transform: translateY(-4px) rotate(-4deg); }
  60%  { transform: translateY(-3px) rotate(3deg); }
  80%  { transform: translateY(-1px) rotate(-1deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

/** talking: 살짝 앞뒤로 끄덕이는 느낌 */
const talkBodyAnim = keyframes`
  0%   { transform: translateY(0px) rotate(0deg); }
  25%  { transform: translateY(-2px) rotate(1deg); }
  50%  { transform: translateY(-3px) rotate(0deg); }
  75%  { transform: translateY(-2px) rotate(-1deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

/* ============================================================
 * keyframes — 눈 깜빡임
 * ============================================================ */

/** 일반 눈 깜빡임 — 3.5초마다 한 번 */
const blinkAnim = keyframes`
  0%, 90%, 100% { transform: scaleY(1); }
  95%            { transform: scaleY(0.05); }
`;

/** thinking 상태 — 더 자주 깜빡임 */
const thinkBlinkAnim = keyframes`
  0%, 40%, 60%, 100% { transform: scaleY(1); }
  50%                 { transform: scaleY(0.05); }
`;

/* ============================================================
 * keyframes — 입 오물오물 (talking)
 * ============================================================ */

/** 입이 오물오물 움직이는 효과 */
const mouthTalkAnim = keyframes`
  0%, 100% { transform: scaleX(1) scaleY(1); }
  25%       { transform: scaleX(0.7) scaleY(1.4); }
  50%       { transform: scaleX(1.1) scaleY(0.7); }
  75%       { transform: scaleX(0.8) scaleY(1.2); }
`;

/* ============================================================
 * keyframes — 별 지팡이 팔 동작
 * ============================================================ */

/** waving: 별 지팡이를 좌우로 흔드는 인사 */
const armWaveAnim = keyframes`
  0%   { transform: rotate(0deg); }
  20%  { transform: rotate(-20deg); }
  40%  { transform: rotate(15deg); }
  60%  { transform: rotate(-15deg); }
  80%  { transform: rotate(10deg); }
  100% { transform: rotate(0deg); }
`;

/** celebrating: 별 지팡이를 크게 흔들기 */
const armCelebrateAnim = keyframes`
  0%   { transform: rotate(0deg); }
  20%  { transform: rotate(-30deg); }
  40%  { transform: rotate(25deg); }
  60%  { transform: rotate(-25deg); }
  80%  { transform: rotate(15deg); }
  100% { transform: rotate(0deg); }
`;

/* ============================================================
 * keyframes — 장식 효과
 * ============================================================ */

/** thinking 생각 버블 — 순차 페이드 */
const bubbleFade = keyframes`
  0%, 100% { opacity: 0.3; r: 2; }
  50%      { opacity: 1; r: 3; }
`;

/** celebrating 반짝 별 */
const sparkleAnim = keyframes`
  0%, 100% { opacity: 0; transform: scale(0.3) rotate(0deg); }
  50%      { opacity: 1; transform: scale(1.2) rotate(180deg); }
`;

/* ============================================================
 * Styled Components
 * ============================================================ */

/** 몸 전체 래퍼 — animation 상태에 따라 keyframe 선택 */
const BodyWrapper = styled.div`
  width: ${({ $size }) => SIZE_MAP[$size] || SIZE_MAP.md}px;
  height: ${({ $size }) => SIZE_MAP[$size] || SIZE_MAP.md}px;
  will-change: transform;
  transform: translateZ(0);

  ${({ $animation }) => {
    switch ($animation) {
      case 'idle':
        return css`animation: ${floatAnim} 3s ease-in-out infinite;`;
      case 'thinking':
        return css`animation: ${thinkAnim} 1.8s ease-in-out infinite;`;
      case 'talking':
        return css`animation: ${talkBodyAnim} 0.6s ease-in-out infinite;`;
      case 'celebrating':
        return css`animation: ${celebrateAnim} 0.9s ease-in-out infinite;`;
      case 'waving':
        return css`animation: ${waveBodyAnim} 1.2s ease-in-out infinite;`;
      default:
        return css`animation: ${floatAnim} 3s ease-in-out infinite;`;
    }
  }}
`;

/** 눈 그룹 — 깜빡임 animation */
const EyeGroup = styled.g`
  transform-origin: 50px 35px;
  will-change: transform;

  ${({ $animation }) => {
    if ($animation === 'thinking') {
      return css`animation: ${thinkBlinkAnim} 1.2s ease-in-out infinite;`;
    }
    return css`animation: ${blinkAnim} 3.5s ease-in-out infinite;`;
  }}
`;

/** 입 그룹 — talking 상태에서 오물오물 */
const MouthGroup = styled.g`
  transform-origin: 50px 46px;
  will-change: transform;

  ${({ $animation }) =>
    $animation === 'talking' &&
    css`animation: ${mouthTalkAnim} 0.35s ease-in-out infinite;`}
`;

/** 별 지팡이 팔 그룹 — waving/celebrating 상태 */
const StarArmGroup = styled.g`
  transform-origin: 74px 42px;
  will-change: transform;

  ${({ $animation }) => {
    if ($animation === 'waving') {
      return css`animation: ${armWaveAnim} 1.2s ease-in-out infinite;`;
    }
    if ($animation === 'celebrating') {
      return css`animation: ${armCelebrateAnim} 0.9s ease-in-out infinite;`;
    }
    return '';
  }}
`;

/** thinking 생각 버블 점 */
const ThinkDot = styled.circle`
  animation: ${bubbleFade} 1.2s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;
`;

/** celebrating 반짝 별 */
const SparkleText = styled.text`
  animation: ${sparkleAnim} ${({ $dur }) => $dur}s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;
  transform-origin: center;
`;

/* ============================================================
 * MonggleCharacter 컴포넌트
 * ============================================================ */

/**
 * 몽글이 SVG 팝콘 캐릭터 컴포넌트.
 *
 * SVG viewBox: 0 0 100 120
 *
 * 캐릭터 구조:
 *   - 빨간/흰 줄무늬 버킷 (아래쪽 사다리꼴)
 *   - 골드 상/하단 테두리 + 물결 장식
 *   - 노란 팝콘 뭉치 (겹치는 원형들로 구름 형태)
 *   - 얼굴: 동그란 눈(하이라이트) + 볼터치 + 미소 입
 *   - 오른팔: 작은 손 + 별 지팡이
 */
export default function MonggleCharacter({ animation = 'idle', size = 'md', className }) {
  return (
    <BodyWrapper $animation={animation} $size={size} className={className}>
      <svg
        viewBox="0 0 100 120"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
        aria-label={`몽글이 캐릭터 (${animation})`}
        role="img"
      >
        {/* ══════════════════════════════════════════════
         *  그라디언트 & 클립패스 정의
         * ══════════════════════════════════════════════ */}
        <defs>
          {/* 팝콘 그라디언트 — 밝은 노랑 중심 → 골든 외곽 */}
          <radialGradient id="mg-popcornGrad" cx="45%" cy="38%" r="55%">
            <stop offset="0%" stopColor="#FFF9C4" />
            <stop offset="55%" stopColor="#FFE082" />
            <stop offset="100%" stopColor="#F9C74F" />
          </radialGradient>

          {/* 버킷 빨간 줄무늬 그라디언트 */}
          <linearGradient id="mg-redStripe" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E85050" />
            <stop offset="100%" stopColor="#C83030" />
          </linearGradient>

          {/* 골드 테두리 그라디언트 */}
          <linearGradient id="mg-goldRim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5DFA0" />
            <stop offset="50%" stopColor="#DDB84A" />
            <stop offset="100%" stopColor="#C8962A" />
          </linearGradient>

          {/* 버킷 사다리꼴 클립패스 */}
          <clipPath id="mg-bucketClip">
            <path d="M 21,62 L 79,62 L 72,107 L 28,107 Z" />
          </clipPath>
        </defs>

        {/* ══════════════════════════════════════════════
         *  바닥 그림자
         * ══════════════════════════════════════════════ */}
        <ellipse cx="50" cy="113" rx="22" ry="4" fill="rgba(0,0,0,0.08)" />

        {/* ══════════════════════════════════════════════
         *  버킷 (빨간/흰 줄무늬 팝콘 통)
         * ══════════════════════════════════════════════ */}
        <g>
          {/* 버킷 본체 — 흰 배경 + 빨간 줄무늬 (클립으로 사다리꼴 컷) */}
          <g clipPath="url(#mg-bucketClip)">
            {/* 흰 바탕 */}
            <rect x="18" y="60" width="64" height="50" fill="#FFF5F0" />
            {/* 빨간 줄무늬 4개 (클립에 의해 사다리꼴로 잘림) */}
            <rect x="21" y="60" width="9" height="50" fill="url(#mg-redStripe)" />
            <rect x="37" y="60" width="9" height="50" fill="url(#mg-redStripe)" />
            <rect x="53" y="60" width="9" height="50" fill="url(#mg-redStripe)" />
            <rect x="69" y="60" width="9" height="50" fill="url(#mg-redStripe)" />
          </g>

          {/* 버킷 외곽선 */}
          <path
            d="M 21,62 L 79,62 L 72,107 L 28,107 Z"
            fill="none" stroke="#C8962A" strokeWidth="1.5" strokeLinejoin="round"
          />

          {/* 골드 상단 테두리 */}
          <rect x="18" y="59" width="64" height="5" rx="2.5" fill="url(#mg-goldRim)" />

          {/* 골드 하단 테두리 (둥근 바닥) */}
          <path
            d="M 28,105 L 72,105 Q 72,110 50,111 Q 28,110 28,105 Z"
            fill="url(#mg-goldRim)"
          />

          {/* 물결 골드 장식 (버킷 상단과 팝콘 경계) */}
          <path
            d="M 22,64 Q 28,60 34,64 Q 40,68 46,64 Q 52,60 58,64 Q 64,68 70,64 Q 76,60 78,64"
            fill="none" stroke="#D4A843" strokeWidth="1" opacity="0.7"
          />
        </g>

        {/* ══════════════════════════════════════════════
         *  팝콘 뭉치 (겹치는 원들로 구름 형태)
         *
         *  뒤쪽 → 앞쪽 순서로 그려서 자연스러운 겹침.
         *  각 원에 golden stroke로 팝콘 알갱이 사이 경계선 표현.
         * ══════════════════════════════════════════════ */}
        <g>
          {/* ── 레이어 1: 가장 뒤쪽 (작은 꼭대기, 양옆) ── */}
          <circle cx="50" cy="13" r="8"  fill="url(#mg-popcornGrad)" stroke="#D4A843" strokeWidth="1.2" />
          <circle cx="37" cy="16" r="8"  fill="url(#mg-popcornGrad)" stroke="#D4A843" strokeWidth="1.2" />
          <circle cx="63" cy="15" r="9"  fill="url(#mg-popcornGrad)" stroke="#D4A843" strokeWidth="1.2" />
          <circle cx="24" cy="33" r="8"  fill="url(#mg-popcornGrad)" stroke="#D4A843" strokeWidth="1.2" />
          <circle cx="76" cy="31" r="8"  fill="url(#mg-popcornGrad)" stroke="#D4A843" strokeWidth="1.2" />

          {/* ── 레이어 2: 중간 (상단 악센트, 좌우) ── */}
          <circle cx="44" cy="16" r="9"  fill="url(#mg-popcornGrad)" stroke="#D4A843" strokeWidth="1.2" />
          <circle cx="57" cy="16" r="9"  fill="url(#mg-popcornGrad)" stroke="#D4A843" strokeWidth="1.2" />
          <circle cx="28" cy="46" r="9"  fill="url(#mg-popcornGrad)" stroke="#D4A843" strokeWidth="1.2" />
          <circle cx="72" cy="44" r="9"  fill="url(#mg-popcornGrad)" stroke="#D4A843" strokeWidth="1.2" />

          {/* ── 레이어 3: 앞쪽 (메인 덩어리) ── */}
          <circle cx="34" cy="34" r="12" fill="url(#mg-popcornGrad)" stroke="#D4A843" strokeWidth="1.2" />
          <circle cx="66" cy="33" r="12" fill="url(#mg-popcornGrad)" stroke="#D4A843" strokeWidth="1.2" />
          <circle cx="50" cy="30" r="16" fill="url(#mg-popcornGrad)" stroke="#D4A843" strokeWidth="1.2" />

          {/* ── 레이어 4: 최전면 (버킷과 팝콘 경계 커버) ── */}
          <circle cx="50" cy="48" r="11" fill="url(#mg-popcornGrad)" stroke="#D4A843" strokeWidth="1.2" />
          <circle cx="37" cy="52" r="8"  fill="url(#mg-popcornGrad)" stroke="#D4A843" strokeWidth="1.2" />
          <circle cx="63" cy="51" r="8"  fill="url(#mg-popcornGrad)" stroke="#D4A843" strokeWidth="1.2" />
        </g>

        {/* ══════════════════════════════════════════════
         *  얼굴 — 볼터치
         * ══════════════════════════════════════════════ */}
        <ellipse cx="36" cy="42" rx="5" ry="2.8" fill="rgba(255,140,140,0.4)" />
        <ellipse cx="64" cy="41" rx="5" ry="2.8" fill="rgba(255,140,140,0.4)" />

        {/* ══════════════════════════════════════════════
         *  얼굴 — 눈 (깜빡임 애니메이션)
         * ══════════════════════════════════════════════ */}
        <EyeGroup $animation={animation}>
          {/* 왼쪽 눈 */}
          <circle cx="42" cy="34" r="3.5" fill="#3D2B1F" />
          {/* 왼쪽 눈 하이라이트 (큰) */}
          <circle cx="43.2" cy="33" r="1.3" fill="white" />
          {/* 왼쪽 눈 하이라이트 (작은) */}
          <circle cx="41" cy="35.5" r="0.6" fill="rgba(255,255,255,0.6)" />

          {/* 오른쪽 눈 */}
          <circle cx="57" cy="33.5" r="3.5" fill="#3D2B1F" />
          {/* 오른쪽 눈 하이라이트 (큰) */}
          <circle cx="58.2" cy="32.5" r="1.3" fill="white" />
          {/* 오른쪽 눈 하이라이트 (작은) */}
          <circle cx="56" cy="35" r="0.6" fill="rgba(255,255,255,0.6)" />
        </EyeGroup>

        {/* ══════════════════════════════════════════════
         *  얼굴 — 입 (상태별 표정 + talking 오물오물)
         * ══════════════════════════════════════════════ */}
        <MouthGroup $animation={animation}>
          {animation === 'celebrating' ? (
            /* celebrating: 활짝 웃는 입 */
            <path
              d="M 44,44 Q 50,50 56,44"
              stroke="#3D2B1F" strokeWidth="1.8" strokeLinecap="round"
              fill="rgba(255,120,160,0.2)"
            />
          ) : animation === 'talking' ? (
            /* talking: 오물오물 타원 입 */
            <ellipse cx="50" cy="45" rx="3.2" ry="2.5" fill="#3D2B1F" />
          ) : animation === 'thinking' ? (
            /* thinking: 삐죽 입 (고민) */
            <path
              d="M 45,45 Q 50,42.5 55,45"
              stroke="#3D2B1F" strokeWidth="1.5" strokeLinecap="round"
              fill="none"
            />
          ) : (
            /* idle / waving: 부드러운 미소 */
            <path
              d="M 44,44 Q 50,49 56,44"
              stroke="#3D2B1F" strokeWidth="1.5" strokeLinecap="round"
              fill="none"
            />
          )}
        </MouthGroup>

        {/* ══════════════════════════════════════════════
         *  오른팔 + 별 지팡이 (waving/celebrating 애니메이션)
         * ══════════════════════════════════════════════ */}
        <StarArmGroup $animation={animation}>
          {/* 손 (작은 팝콘색 원) */}
          <circle cx="81" cy="40" r="4.5" fill="url(#mg-popcornGrad)" stroke="#D4A843" strokeWidth="1" />
          {/* 지팡이 막대 */}
          <line
            x1="83" y1="37" x2="87" y2="24"
            stroke="#D4A843" strokeWidth="1.8" strokeLinecap="round"
          />
          {/* 별 ★ — 5각 별 */}
          <polygon
            points="87,17 88.5,21 92.5,21 89.3,23.5 90.5,27.5 87,25 83.5,27.5 84.7,23.5 81.5,21 85.5,21"
            fill="#FBBF24" stroke="#E5A800" strokeWidth="0.5"
          />
          {/* 별 하이라이트 */}
          <circle cx="86.5" cy="21.5" r="1" fill="rgba(255,255,255,0.5)" />
        </StarArmGroup>

        {/* ══════════════════════════════════════════════
         *  thinking 상태: 생각 버블 점 3개
         * ══════════════════════════════════════════════ */}
        {animation === 'thinking' && (
          <g>
            <ThinkDot cx="78" cy="16" r="2" fill="#FFE082" $delay={0} />
            <ThinkDot cx="83" cy="10" r="2.5" fill="#FFE082" $delay={0.25} />
            <ThinkDot cx="89" cy="4" r="3" fill="#FFE082" $delay={0.5} />
          </g>
        )}

        {/* ══════════════════════════════════════════════
         *  celebrating 상태: 반짝 별 장식
         * ══════════════════════════════════════════════ */}
        {animation === 'celebrating' && (
          <g>
            <SparkleText x="8" y="20" fontSize="10" fill="#FBBF24" $dur={0.8} $delay={0}>✦</SparkleText>
            <SparkleText x="80" y="8" fontSize="8" fill="#06D6A0" $dur={1.0} $delay={0.3}>✦</SparkleText>
            <SparkleText x="44" y="5" fontSize="7" fill="#FBBF24" $dur={0.9} $delay={0.5}>✦</SparkleText>
          </g>
        )}
      </svg>
    </BodyWrapper>
  );
}
