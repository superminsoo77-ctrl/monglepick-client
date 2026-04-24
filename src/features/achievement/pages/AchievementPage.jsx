/**
 * 업적 페이지.
 *
 * 카테고리별 업적 카드 + 진행률 바를 표시한다.
 *
 * @module features/achievement/pages/AchievementPage
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAchievements } from '../api/achievementApi';
import { ROUTES, buildPath } from '../../../shared/constants/routes';
import * as S from './AchievementPage.styled';

/** 업적 카테고리 */
const CATEGORIES = [
  { key: '', label: '전체' },
  { key: 'VIEWING', label: '시청' },
  { key: 'SOCIAL', label: '소셜' },
  { key: 'COLLECTION', label: '컬렉션' },
  { key: 'CHALLENGE', label: '도전' },
];

/** 카테고리별 기본 아이콘 */
const CATEGORY_ICONS = {
  VIEWING: '&#x1F3AC;',
  SOCIAL: '&#x1F91D;',
  COLLECTION: '&#x1F4DA;',
  CHALLENGE: '&#x1F3C6;',
};

export default function AchievementPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAchievements = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAchievements({ category: selectedCategory || undefined });
      setAchievements(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      console.error('[Achievement] 로드 실패:', err.message);
      setAchievements([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const totalAchievements = achievements.length;
  const achievedCount = achievements.filter((a) => a.achieved).length;
  const totalProgress = totalAchievements > 0
    ? Math.round((achievedCount / totalAchievements) * 100)
    : 0;

  return (
    <S.Container>
      <S.PageTitle>업적</S.PageTitle>
      <S.Subtitle>활동하며 달성한 업적을 확인해보세요!</S.Subtitle>

      {/* 요약 통계 */}
      <S.StatsBar>
        <S.StatItem>
          <S.StatValue>{achievedCount}</S.StatValue>
          <S.StatLabel>달성한 업적</S.StatLabel>
        </S.StatItem>
        <S.StatItem>
          <S.StatValue>{totalAchievements}</S.StatValue>
          <S.StatLabel>전체 업적</S.StatLabel>
        </S.StatItem>
        <S.StatItem>
          <S.StatValue>{totalProgress}%</S.StatValue>
          <S.StatLabel>달성률</S.StatLabel>
        </S.StatItem>
      </S.StatsBar>

      {/* 카테고리 필터 */}
      <S.CategoryFilters>
        {CATEGORIES.map((cat) => (
          <S.CategoryBtn
            key={cat.key}
            $active={selectedCategory === cat.key}
            onClick={() => setSelectedCategory(cat.key)}
          >
            {cat.label}
          </S.CategoryBtn>
        ))}
      </S.CategoryFilters>

      {/* 로딩 */}
      {isLoading && (
        <S.AchievementGrid>
          {[1, 2, 3, 4].map((i) => (
            <S.SkeletonCard key={i} />
          ))}
        </S.AchievementGrid>
      )}

      {/* 업적 그리드 */}
      {!isLoading && achievements.length > 0 && (
        <S.AchievementGrid>
          {achievements.map((ach) => {
            const progress = ach.progress || 0;
            const maxProgress = ach.maxProgress || 1;
            const percent = Math.round((progress / maxProgress) * 100);

            return (
              <S.AchievementCard
                key={ach.achievementTypeId ?? ach.id}
                $achieved={ach.achieved}
                onClick={() => navigate(
                  buildPath(ROUTES.ACCOUNT_ACHIEVEMENT_DETAIL, { id: ach.achievementTypeId ?? ach.id }),
                  { state: { achievement: ach } }
                )}
              >
                <S.AchievementHeaderRow>
                  <S.AchievementIcon
                    dangerouslySetInnerHTML={{
                      __html: ach.iconUrl || CATEGORY_ICONS[ach.category] || '&#x1F3C5;',
                    }}
                  />
                  <S.AchievementNameRow>
                    <S.AchievementName>{ach.name}</S.AchievementName>
                    {ach.achieved && <S.AchievedBadge>✓ 달성</S.AchievedBadge>}
                  </S.AchievementNameRow>
                </S.AchievementHeaderRow>

                {ach.description && (
                  <S.AchievementDesc>{ach.description}</S.AchievementDesc>
                )}

                <S.AchievementMeta>
                  <S.ProgressText>{progress} / {maxProgress}</S.ProgressText>
                  <S.ProgressText>{percent}%</S.ProgressText>
                </S.AchievementMeta>

                <S.ProgressBarOuter>
                  <S.ProgressBarInner $percent={percent} $complete={ach.achieved} />
                </S.ProgressBarOuter>
              </S.AchievementCard>
            );
          })}
        </S.AchievementGrid>
      )}

      {/* 빈 상태 */}
      {!isLoading && achievements.length === 0 && (
        <S.EmptyState>
          <S.EmptyIcon>&#x1F3C6;</S.EmptyIcon>
          <S.EmptyText>
            아직 업적이 없어요.
            <br />
            영화를 시청하고 활동하면 업적을 달성할 수 있어요!
          </S.EmptyText>
        </S.EmptyState>
      )}
    </S.Container>
  );
}
