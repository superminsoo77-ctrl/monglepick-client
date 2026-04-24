/**
 * RewardPolicyGuide 컴포넌트 styled-components 정의.
 *
 * "리워드 지급 기준" 섹션 전용 스타일. ItemExchange 의 Section/Tab/Grid 패턴을
 * 따라 디자인 일관성을 유지한다. 정책 카드는 읽기 전용이며 hover 시 subtle한
 * lift 를 준다.
 */

import styled from 'styled-components';
import { media } from '../../../shared/styles/media';

/* 섹션 루트 */
export const Section = styled.section``;

/* 섹션 제목 + 부제 행 */
export const HeaderRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`;

export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

export const Hint = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/* 카테고리 필터 탭 */
export const Tabs = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  overflow-x: auto;
  ${media.mobile} {
    gap: ${({ theme }) => theme.spacing.xs};
  }
`;

export const Tab = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background: ${({ $active, theme }) => ($active ? theme.colors.primary : 'none')};
  border: 1px solid
    ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.borderDefault)};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ $active, theme }) => ($active ? 'white' : theme.colors.textSecondary)};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ $active, theme }) => ($active ? 'white' : theme.colors.primary)};
  }

  ${media.mobile} {
    padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
    font-size: ${({ theme }) => theme.typography.textXs};
  }
`;

/**
 * 접기/펼치기 토글 버튼 — defaultCollapsed=true 일 때만 렌더된다.
 *
 * <p>카드 스타일의 풀-폭 버튼. 펼치면 내부의 카테고리 탭 + 정책 카드 그리드가
 * 노출된다. 기본 접힘으로써 "현황" 탭의 정보 밀도를 낮추고, 사용자가 필요할
 * 때만 카탈로그를 열어보도록 한다.</p>
 */
export const CollapseToggle = styled.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
  margin-bottom: ${({ theme }) => theme.spacing.md};

  &:hover {
    background: ${({ theme }) => theme.colors.bgTertiary};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

/** 토글 아이콘 — $open=true 일 때 180도 회전 */
export const CollapseChevron = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== '$open',
})`
  display: inline-block;
  transition: transform 0.2s ease;
  font-size: ${({ theme }) => theme.typography.textBase};
  color: ${({ theme }) => theme.colors.textSecondary};
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
`;

/* 정책 카드 그리드 */
export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  ${media.mobile} {
    grid-template-columns: 1fr;
  }
`;

/* 정책 단건 카드
 * QA #159 (2026-04-23): 긴 정책명/설명이 카드 경계 밖으로 튀어나오는 현상 방지.
 * min-width: 0 로 flex/grid 자식이 overflow 하는 CSS 기본 동작을 잠그고,
 * Card 자체에 overflow: hidden 을 주되 hover translateY 가 잘리지 않도록 margin 여유를 둔다.
 */
export const Card = styled.article`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;
  overflow: hidden;
  transition: transform ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: translateY(-2px);
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

export const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
  /* flex 자식이 넘치지 않도록 */
  min-width: 0;
  width: 100%;
`;

export const CardTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
  line-height: 1.3;
  /* QA #159: 한국어 긴 정책명이 카드 밖으로 삐져나오지 않도록 강제 줄바꿈.
   * 하이픈 대안으로 overflow-wrap 사용 — 단어 중간에서 끊기는 것은 anywhere 가 필요할 때만. */
  overflow-wrap: anywhere;
  word-break: break-word;
  flex: 1 1 auto;
  min-width: 0;
`;

/* 지급 포인트 배지 — 대형 숫자 강조 */
export const PointBadge = styled.div`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.primary};
  white-space: nowrap;
  flex: 0 0 auto;
`;

/* 카드 설명
 * QA #159: 설명 텍스트도 카드 내부로 강제 줄바꿈. */
export const CardDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  line-height: 1.5;
  min-height: 2.8em;
  overflow-wrap: anywhere;
  word-break: break-word;
`;

/* 메타 정보 행 (일일 한도/쿨다운/최소 글자수 배지) */
export const MetaRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

export const MetaChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px ${({ theme }) => theme.spacing.xs};
  background: ${({ theme }) => theme.colors.surfaceMuted ?? theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  /* QA #159: 긴 쿨다운/한도 문구가 카드 밖으로 밀리지 않도록 */
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/* 카테고리 라벨 칩 (MILESTONE/ATTENDANCE 등) */
export const CategoryTag = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

/* 빈 상태 */
export const Empty = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxl};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
`;
