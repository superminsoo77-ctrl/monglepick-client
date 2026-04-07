/**
 * PointShopSection 컴포넌트 styled-components 정의.
 *
 * AI 이용권 구매 섹션 전용 스타일.
 * 일반 ItemExchange와 유사하지만, 상단에 "현재 AI 이용권 잔여" 요약 카드를
 * 추가로 표시하기 위한 전용 구성요소를 포함한다.
 */

import styled from 'styled-components';
import { media } from '../../../shared/styles/media';

/**
 * 섹션 루트 컨테이너.
 * PointPage 레벨에서 margin-bottom을 제어하므로 내부 여백은 정의하지 않는다.
 */
export const Section = styled.section``;

/**
 * 섹션 제목.
 */
export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
`;

/**
 * 섹션 설명 문구 (이용권 구매 규칙 설명).
 */
export const SectionDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
`;

/**
 * 현재 AI 이용권 잔여 횟수를 표시하는 상단 요약 카드.
 *
 * <p>gradient 배경 + 좌측 아이콘/라벨 + 우측 큰 숫자 레이아웃으로 구성된다.</p>
 */
export const StatusCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.gradients.primary};
  border-radius: ${({ theme }) => theme.radius.lg};
  color: white;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

/**
 * 상태 카드 좌측 라벨 박스 (아이콘 + 제목).
 */
export const StatusLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

/**
 * 상태 카드 제목 — "AI 이용권 잔여".
 */
export const StatusTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  opacity: 0.9;
`;

/**
 * 상태 카드 설명 — "구독 보너스 + 구매분 합산" 문구.
 */
export const StatusHint = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  opacity: 0.8;
`;

/**
 * 상태 카드 우측의 큰 수치 — "12회" 등.
 */
export const StatusValue = styled.div`
  font-size: ${({ theme }) => theme.typography.text3xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  line-height: 1;

  ${media.mobile} {
    font-size: ${({ theme }) => theme.typography.text2xl};
  }
`;

/**
 * AI 이용권 상품 카드 그리드 컨테이너 — 3종 표시.
 */
export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  ${media.tablet} {
    grid-template-columns: 1fr;
  }
`;

/**
 * 개별 상품 카드 — glass 스타일.
 */
export const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: blur(8px) saturate(1.4);
  -webkit-backdrop-filter: blur(8px) saturate(1.4);
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-4px);
    box-shadow:
      ${({ theme }) => theme.shadows.lg},
      ${({ theme }) => theme.shadows.glow};
  }
`;

/**
 * 카드 상단 배지 — 상품 ID(AI_TOKEN_5 등)를 기반으로 한 카테고리 태그.
 */
export const CategoryTag = styled.span`
  display: inline-block;
  width: fit-content;
  padding: 2px ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

/**
 * 상품 이름.
 */
export const ItemName = styled.h3`
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

/**
 * 상품 설명 — flex:1 로 카드 하단까지 공간 확장.
 */
export const ItemDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.leadingNormal};
  margin: 0;
  flex: 1;
`;

/**
 * 카드 하단 — 가격과 구매 버튼을 양 끝 정렬.
 */
export const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

/**
 * 가격 표시 — 상점 강조색 사용.
 */
export const Price = styled.span`
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.primary};
`;

/**
 * 구매 버튼 — gradient 배경 + hover glow.
 */
export const BuyBtn = styled.button`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.gradients.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    box-shadow: ${({ theme }) => theme.glows.primary};
    transform: translateY(-1px);
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.bgElevated};
    color: ${({ theme }) => theme.colors.textMuted};
    cursor: not-allowed;
  }
`;

/**
 * 빈 상태 메시지.
 */
export const Empty = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxl};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
`;
