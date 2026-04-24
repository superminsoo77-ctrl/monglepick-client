/**
 * 업적 상세 페이지.
 *
 * 업적 목록에서 카드 클릭 시 진입하며,
 * 업적 설명·달성 조건·진행률·보상 포인트·달성 일시를 상세히 표시한다.
 *
 * 데이터 소스: router state(location.state.achievement) 우선,
 * 없으면 getAchievements() 전체 목록에서 ID로 탐색.
 *
 * @module features/achievement/pages/AchievementDetailPage
 */

import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getAchievements } from '../api/achievementApi';
import { ROUTES } from '../../../shared/constants/routes';
/* 2026-04-23 라우팅 재설계 PR-3 — 하드코딩 navigate(ROUTES.ACHIEVEMENT) 3곳을 공통 훅으로 대체 */
import useBackNavigation from '../../../shared/hooks/useBackNavigation';
import * as S from './AchievementDetailPage.styled';

/** 카테고리 한글 라벨 */
const CATEGORY_LABELS = {
  VIEWING: '시청',
  SOCIAL: '소셜',
  COLLECTION: '컬렉션',
  CHALLENGE: '도전',
};

/** 카테고리 기본 아이콘 */
const CATEGORY_ICONS = {
  VIEWING: '&#x1F3AC;',
  SOCIAL: '&#x1F91D;',
  COLLECTION: '&#x1F4DA;',
  CHALLENGE: '&#x1F3C6;',
};

/** 달성일 포맷 (ISO → 한국어 날짜) */
function formatDate(isoStr) {
  if (!isoStr) return null;
  try {
    return new Date(isoStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoStr;
  }
}

export default function AchievementDetailPage() {
  const { id } = useParams();
  const { state } = useLocation();

  /*
   * 2026-04-23 PR-3: 뒤로가기 훅화.
   *   - 호출부에서 state.backTo 를 넘겼으면 그쪽으로 (예: `/achievement?tab=done&page=2`)
   *   - 아니면 브라우저 히스토리 → 폴백 ROUTES.ACHIEVEMENT
   * 기존엔 navigate(ROUTES.ACHIEVEMENT) 를 3곳에 하드코딩해 탭/페이지/필터 상태를 잃었음.
   */
  const goBack = useBackNavigation(ROUTES.ACCOUNT_ACHIEVEMENT);

  const [achievement, setAchievement] = useState(state?.achievement ?? null);
  const [isLoading, setIsLoading] = useState(!state?.achievement);

  /* router state에 데이터가 없으면 목록 API에서 탐색 */
  useEffect(() => {
    if (achievement) return;
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const data = await getAchievements();
        const list = Array.isArray(data) ? data : data?.content || [];
        const found = list.find(
          (a) => String(a.achievementTypeId) === String(id) ||
                 String(a.id) === String(id)
        );
        if (!cancelled) {
          setAchievement(found ?? null);
        }
      } catch {
        if (!cancelled) setAchievement(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id, achievement]);

  /* ── 로딩 ── */
  if (isLoading) {
    return (
      <S.Container>
        <S.BackLink onClick={goBack}>
          ← 업적 목록
        </S.BackLink>
        <S.Skeleton $h={120} />
        <S.Skeleton $h={80} />
        <S.Skeleton $h={100} />
      </S.Container>
    );
  }

  /* ── 데이터 없음 ── */
  if (!achievement) {
    return (
      <S.Container>
        <S.BackLink onClick={goBack}>
          ← 업적 목록
        </S.BackLink>
        <S.BodyText style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 40 }}>
          업적 정보를 불러올 수 없습니다.
        </S.BodyText>
      </S.Container>
    );
  }

  const progress    = achievement.progress    ?? 0;
  const maxProgress = achievement.maxProgress ?? achievement.requiredCount ?? 1;
  const percent     = maxProgress > 0 ? Math.round((progress / maxProgress) * 100) : 0;
  const categoryLabel = CATEGORY_LABELS[achievement.category] ?? '기타';
  const icon = achievement.iconUrl || CATEGORY_ICONS[achievement.category] || '&#x1F3C5;';

  return (
    <S.Container>
      <S.BackLink onClick={goBack}>
        ← 업적 목록
      </S.BackLink>

      {/* 헤더 카드 */}
      <S.Header $achieved={achievement.achieved}>
        <S.IconBox
          $achieved={achievement.achieved}
          dangerouslySetInnerHTML={{ __html: icon }}
        />
        <S.HeaderContent>
          <S.Title>{achievement.achievementName || achievement.name}</S.Title>
          <S.BadgeRow>
            <S.CategoryBadge>{categoryLabel}</S.CategoryBadge>
            {achievement.achieved
              ? <S.AchievedBadge>✓ 달성 완료</S.AchievedBadge>
              : <S.LockedBadge>🔒 미달성</S.LockedBadge>
            }
          </S.BadgeRow>
        </S.HeaderContent>
      </S.Header>

      {/* 설명 */}
      {(achievement.description) && (
        <S.Card>
          <S.SectionLabel>업적 설명</S.SectionLabel>
          <S.BodyText>{achievement.description}</S.BodyText>
        </S.Card>
      )}

      {/* 달성 조건 */}
      <S.Card>
        <S.SectionLabel>달성 조건</S.SectionLabel>
        <S.BodyText>
          {maxProgress > 1
            ? `총 ${maxProgress}회 달성하면 획득할 수 있습니다.`
            : '조건을 1회 달성하면 획득할 수 있습니다.'}
        </S.BodyText>
        <S.ProgressBarOuter>
          <S.ProgressBarInner $percent={percent} $complete={achievement.achieved} />
        </S.ProgressBarOuter>
        <S.ProgressRow>
          <S.ProgressCount $complete={achievement.achieved}>
            {progress} / {maxProgress}
          </S.ProgressCount>
          <S.ProgressPercent>{percent}%</S.ProgressPercent>
        </S.ProgressRow>
      </S.Card>

      {/* 보상 + 달성일 */}
      <S.InfoGrid>
        <S.InfoItem>
          <S.InfoValue>
            {achievement.rewardPoints > 0 ? `+${achievement.rewardPoints}P` : '—'}
          </S.InfoValue>
          <S.InfoLabel>달성 보상</S.InfoLabel>
        </S.InfoItem>
        <S.InfoItem>
          <S.InfoValue style={{ fontSize: 'inherit', fontWeight: 'inherit', color: achievement.achieved ? 'inherit' : undefined }}>
            {achievement.achieved && achievement.achievedAt
              ? formatDate(achievement.achievedAt)
              : '—'}
          </S.InfoValue>
          <S.InfoLabel>달성 일시</S.InfoLabel>
        </S.InfoItem>
      </S.InfoGrid>
    </S.Container>
  );
}
