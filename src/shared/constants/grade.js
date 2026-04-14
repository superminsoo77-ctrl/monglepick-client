/**
 * 사용자 등급(팝콘 테마, v3.2) 단일 진실 원본.
 *
 * 백엔드 `domain/reward/entity/Grade.java` + `GradeInitializer.java` 에서 정의된 6등급
 * (NORMAL, BRONZE, SILVER, GOLD, PLATINUM, DIAMOND) 의 한국어명·대표색을 매핑한다.
 *
 * 백엔드 응답 `BalanceResponse.grade` / `UserDto.grade` 는 항상 대문자 영문 코드 문자열.
 * 화면에는 팝콘 테마 한국어명을 노출해야 하므로 이 매핑을 거쳐서 렌더링한다.
 *
 * 색상은 등급별 상징성을 유지:
 *   - NORMAL   (알갱이):      연한 옥수수색 — 기본 등급
 *   - BRONZE   (강냉이):      탄 옥수수색 (기존 브론즈 유지)
 *   - SILVER   (팝콘):        버터 팝콘 크림색 (기존 실버 → 크림/버터색으로 변경)
 *   - GOLD     (카라멜팝콘):  카라멜 브라운
 *   - PLATINUM (몽글팝콘):    라벤더/몽글핑크 (기존 플래티넘 → 브랜드 포인트컬러)
 *   - DIAMOND  (몽아일체):    무지개 글로우(그라디언트) — 최고 등급 프리미엄 표현
 *
 * 변경 이력:
 *   - 2026-04-14: 신규. BalanceCard·MyPage 인라인 상수에서 통합.
 */

/** 등급 코드 → 한국어 표시명 (팝콘 테마). */
export const GRADE_LABELS = {
  NORMAL:   '알갱이',
  BRONZE:   '강냉이',
  SILVER:   '팝콘',
  GOLD:     '카라멜팝콘',
  PLATINUM: '몽글팝콘',
  DIAMOND:  '몽아일체',
};

/**
 * 등급 코드 → 배지 색상(텍스트/테두리 color, 배경 bg).
 *
 * DIAMOND 는 단일 색상 대신 그라디언트 배경을 사용하도록
 * `gradient` 필드를 추가로 제공한다 (GradeBadge styled-component 에서 분기).
 */
export const GRADE_COLORS = {
  NORMAL:   { color: '#e8d5a8', bg: 'rgba(232, 213, 168, 0.15)' },   // 연한 옥수수색
  BRONZE:   { color: '#cd7f32', bg: 'rgba(205, 127, 50, 0.15)' },    // 탄 옥수수색
  SILVER:   { color: '#f5d76e', bg: 'rgba(245, 215, 110, 0.15)' },   // 버터 팝콘
  GOLD:     { color: '#c68642', bg: 'rgba(198, 134, 66, 0.18)' },    // 카라멜
  PLATINUM: { color: '#ef476f', bg: 'rgba(239, 71, 111, 0.15)' },    // 브랜드 포인트(몽글핑크)
  DIAMOND:  {
    color: '#ffffff',
    bg: 'rgba(255, 255, 255, 0.1)',
    /* 최고 등급 — 무지개 글로우 그라디언트 */
    gradient: 'linear-gradient(135deg, #ef476f 0%, #ffd166 33%, #06d6a0 66%, #118ab2 100%)',
  },
};

/** 기본 등급(가입 직후 NORMAL) — 응답이 없을 때 fallback. */
export const DEFAULT_GRADE_CODE = 'NORMAL';

/**
 * 등급 코드에 대응하는 한국어명을 반환한다.
 * 알 수 없는 코드가 들어오면 원본 코드를 그대로 반환(디버깅 편의).
 *
 * @param {string|undefined|null} gradeCode - 백엔드 등급 코드
 * @returns {string} 한국어 표시명
 */
export function getGradeLabel(gradeCode) {
  if (!gradeCode) return GRADE_LABELS[DEFAULT_GRADE_CODE];
  return GRADE_LABELS[gradeCode] || gradeCode;
}
