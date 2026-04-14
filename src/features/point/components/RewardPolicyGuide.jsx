/**
 * RewardPolicyGuide 컴포넌트 — "리워드 지급 기준" 섹션.
 *
 * <p>Backend GET /api/v1/point/policies 응답을 카테고리별 탭 + 정책 카드 그리드로
 * 노출한다. 사용자가 "어떤 활동이 얼마의 포인트를 주는지" 를 투명하게 확인할 수 있다.</p>
 *
 * <h3>표시 구성</h3>
 * <ul>
 *   <li>카테고리 탭: 전체 / 콘텐츠 / 참여 / 마일스톤 / 출석</li>
 *   <li>정책 카드: 활동명 + 지급 포인트 배지 + 설명 + 메타(일일 한도/쿨다운/최소 글자수)</li>
 *   <li>마일스톤 정책은 "5회 달성 시" 같은 threshold 안내를 추가 표시</li>
 * </ul>
 *
 * <p>2026-04-14 재개편: `defaultCollapsed` prop 지원 — 기본 접힘 상태로 렌더되고
 * 헤더 토글 버튼으로 펼친다. 현황 탭에서 진행 현황과 지급 기준의 역할을 분리하여
 * 정보 중복/밀도 과다 문제를 해소한다.</p>
 *
 * @param {Object} props
 * @param {Array<Object>} props.policies - 정책 목록 (PolicyResponse[])
 * @param {boolean} props.isLoading - 로딩 상태
 * @param {string} props.selectedCategory - 선택된 카테고리 코드 ('ALL' 또는 카테고리 값)
 * @param {Function} props.onCategoryChange - 카테고리 변경 핸들러 (code → void)
 * @param {Function} props.formatNumber - 숫자 포맷팅 함수
 * @param {boolean} [props.defaultCollapsed=false] - 기본 접힘 여부. true 면 헤더만 렌더되고
 *   "펼치기" 클릭 시 내용이 노출된다.
 */

import { useState } from 'react';
import Loading from '../../../shared/components/Loading/Loading';
import * as S from './RewardPolicyGuide.styled';

/**
 * 탭 정의 — code 는 Backend actionCategory 와 일치해야 한다.
 * 'ALL' 만 특별히 전체 표시용 프론트 값.
 */
const CATEGORY_TABS = [
  { code: 'ALL', label: '전체' },
  { code: 'CONTENT', label: '콘텐츠' },
  { code: 'ENGAGEMENT', label: '참여' },
  { code: 'MILESTONE', label: '마일스톤' },
  { code: 'ATTENDANCE', label: '출석' },
];

/**
 * action_category 코드를 한국어 라벨로 변환한다.
 * @param {string} code - 카테고리 코드
 * @returns {string} 한국어 라벨
 */
function categoryLabel(code) {
  const found = CATEGORY_TABS.find((t) => t.code === code);
  return found ? found.label : code || '기타';
}

/**
 * threshold_target 코드를 사용자 안내 문구로 변환한다.
 * @param {Object} policy - 정책 객체
 * @returns {string|null} 설명 문구 (일반 활동이면 null)
 */
function thresholdHint(policy) {
  if (!policy.thresholdTarget || !policy.thresholdCount) return null;
  const cnt = policy.thresholdCount;
  switch (policy.thresholdTarget) {
    case 'TOTAL':
      return `누적 ${cnt}회 달성 시`;
    case 'DAILY':
      return `하루 ${cnt}회 달성 시`;
    case 'STREAK':
      return `${cnt}일 연속 달성 시`;
    default:
      return null;
  }
}

export default function RewardPolicyGuide({
  policies,
  isLoading,
  selectedCategory,
  onCategoryChange,
  formatNumber,
  defaultCollapsed = false,
}) {
  /* 접기/펼치기 상태 — defaultCollapsed 이면 초기 접힘 */
  const [expanded, setExpanded] = useState(!defaultCollapsed);

  /* 로컬 필터링 — 'ALL' 이면 전체, 아니면 actionCategory 일치 */
  const filteredPolicies =
    selectedCategory === 'ALL'
      ? policies
      : policies.filter((p) => p.actionCategory === selectedCategory);

  /** 총 정책 개수 — 접힌 상태에서 "전체 지급 기준 보기 (24)" 힌트로 노출 */
  const totalCount = policies?.length ?? 0;

  return (
    <S.Section>
      {/* 헤더: 제목 + 안내 + (접기 모드일 때) 토글 버튼 */}
      <S.HeaderRow>
        <S.SectionTitle>리워드 지급 기준</S.SectionTitle>
        <S.Hint>활동으로 얼마의 포인트를 받을 수 있는지 확인하세요</S.Hint>
      </S.HeaderRow>

      {defaultCollapsed && (
        <S.CollapseToggle
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <span>
            {expanded ? '지급 기준 접기' : `전체 지급 기준 보기${totalCount > 0 ? ` (${totalCount})` : ''}`}
          </span>
          <S.CollapseChevron $open={expanded} aria-hidden="true">
            ▾
          </S.CollapseChevron>
        </S.CollapseToggle>
      )}

      {/* 펼침 상태에서만 내용 렌더 (defaultCollapsed=false 이면 항상 펼침) */}
      {expanded && (
        <>
          {/* 카테고리 탭 */}
          <S.Tabs>
            {CATEGORY_TABS.map((tab) => (
              <S.Tab
                key={tab.code}
                $active={selectedCategory === tab.code}
                onClick={() => onCategoryChange(tab.code)}
              >
                {tab.label}
              </S.Tab>
            ))}
          </S.Tabs>

          {/* 본문 */}
          {isLoading ? (
            <Loading message="정책 불러오는 중..." />
          ) : filteredPolicies.length === 0 ? (
            <S.Empty>표시할 정책이 없습니다.</S.Empty>
          ) : (
            <S.Grid>
          {filteredPolicies.map((policy) => {
            /* 지급 포인트 배지 — "+N P" 형태로 표시 (0P 는 카운팅 전용이라 'N/A') */
            const pointLabel =
              policy.pointsAmount > 0
                ? `+${formatNumber(policy.pointsAmount)}P`
                : '카운팅';

            /* 메타 칩 목록 구성 */
            const metas = [];
            const thHint = thresholdHint(policy);
            if (thHint) metas.push(thHint);
            if (policy.dailyLimit > 0) metas.push(`일일 ${policy.dailyLimit}회`);
            if (policy.maxCount > 0) metas.push(`평생 ${policy.maxCount}회`);
            if (policy.cooldownSeconds > 0) metas.push(`쿨다운 ${policy.cooldownSeconds}초`);
            if (policy.minContentLength > 0)
              metas.push(`최소 ${policy.minContentLength}자`);
            if (policy.pointType === 'bonus') metas.push('등급 배율 X');

            return (
              <S.Card key={policy.policyId}>
                <S.CardHeader>
                  <div>
                    <S.CardTitle>{policy.activityName}</S.CardTitle>
                    <S.CategoryTag>{categoryLabel(policy.actionCategory)}</S.CategoryTag>
                  </div>
                  <S.PointBadge>{pointLabel}</S.PointBadge>
                </S.CardHeader>

                <S.CardDesc>
                  {policy.description || '설명이 등록되지 않은 정책입니다.'}
                </S.CardDesc>

                {metas.length > 0 && (
                  <S.MetaRow>
                    {metas.map((meta, idx) => (
                      <S.MetaChip key={`${policy.policyId}-meta-${idx}`}>{meta}</S.MetaChip>
                    ))}
                  </S.MetaRow>
                )}
              </S.Card>
            );
          })}
            </S.Grid>
          )}
        </>
      )}
    </S.Section>
  );
}
