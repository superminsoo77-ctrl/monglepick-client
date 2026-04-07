/**
 * 포인트 상점(PointShop) 섹션 컴포넌트 — AI 이용권 구매 전용.
 *
 * <p>Backend PointShopController(/api/v1/point/shop/*)와 연동하여
 * AI 추천 이용권 3종(AI_TOKEN_5, AI_TOKEN_20, AI_DAILY_EXTEND)을 구매한다.
 * 구매된 이용권은 user_ai_quota.purchased_ai_tokens에 누적되어
 * 등급 일일 한도와 구독 보너스가 모두 소진된 이후 자동 소비된다.</p>
 *
 * <p>일반 포인트 아이템 교환(ItemExchange)과는 별개의 섹션으로 운영된다.
 * v3.2 설계서 §16 "포인트 소비처"의 핵심 소비처이다.</p>
 *
 * @param {Object} props
 * @param {Object|null} props.shopState - 상점 상태 ({ currentBalance, currentAiTokens, items })
 * @param {boolean} props.isLoading - 상점 아이템 로딩 중 여부
 * @param {string|null} props.purchasingItemId - 현재 구매 처리 중인 itemId (버튼 비활성화용)
 * @param {Function} props.onPurchase - 구매 버튼 클릭 핸들러(item) => Promise
 * @param {Function} props.formatNumber - 숫자 포맷팅 함수
 */

import Loading from '../../../shared/components/Loading/Loading';
import * as S from './PointShopSection.styled';

export default function PointShopSection({
  shopState,
  isLoading,
  purchasingItemId,
  onPurchase,
  formatNumber,
}) {
  /* 로딩 중 */
  if (isLoading) {
    return (
      <S.Section>
        <S.SectionTitle>AI 이용권 상점</S.SectionTitle>
        <Loading message="상점 정보 로딩 중..." />
      </S.Section>
    );
  }

  /* API 호출 실패 또는 빈 응답 */
  if (!shopState) {
    return (
      <S.Section>
        <S.SectionTitle>AI 이용권 상점</S.SectionTitle>
        <S.SectionDesc>
          상점 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </S.SectionDesc>
      </S.Section>
    );
  }

  const {
    currentBalance = 0,
    currentAiTokens = 0,
    items = [],
  } = shopState;

  return (
    <S.Section>
      {/* 섹션 제목 */}
      <S.SectionTitle>AI 이용권 상점</S.SectionTitle>
      <S.SectionDesc>
        등급 무료 한도와 구독 보너스를 모두 소진한 경우 구매한 이용권이 자동으로 사용됩니다.
      </S.SectionDesc>

      {/* 현재 이용권 잔여 요약 카드 */}
      <S.StatusCard>
        <S.StatusLabel>
          <S.StatusTitle>AI 이용권 잔여</S.StatusTitle>
          <S.StatusHint>
            구매한 이용권은 등급/구독 쿼터 이후 소비됩니다
          </S.StatusHint>
        </S.StatusLabel>
        <S.StatusValue>{formatNumber(currentAiTokens)}회</S.StatusValue>
      </S.StatusCard>

      {/* 상품 목록 */}
      {items.length === 0 ? (
        <S.Empty>판매 중인 상품이 없습니다.</S.Empty>
      ) : (
        <S.Grid>
          {items.map((item) => {
            /* 현재 잔액보다 비싸면 구매 버튼 비활성화 */
            const insufficient = currentBalance < item.cost;
            /* 현재 이 상품을 구매 처리 중인지 */
            const isProcessing = purchasingItemId === item.itemId;

            return (
              <S.Card key={item.itemId}>
                {/* 상품 카테고리 태그 (AI 이용권 or 일일한도 우회) */}
                <S.CategoryTag>
                  {item.itemId === 'AI_DAILY_EXTEND' ? '일일 한도 우회' : 'AI 이용권'}
                </S.CategoryTag>

                {/* 상품 이름 + 설명 */}
                <S.ItemName>{item.name}</S.ItemName>
                <S.ItemDesc>{item.description}</S.ItemDesc>

                {/* 하단 가격 + 구매 버튼 */}
                <S.Footer>
                  <S.Price>{formatNumber(item.cost)}P</S.Price>
                  <S.BuyBtn
                    onClick={() => onPurchase(item)}
                    disabled={isProcessing || insufficient}
                  >
                    {isProcessing
                      ? '구매 중...'
                      : insufficient
                        ? '포인트 부족'
                        : '구매'}
                  </S.BuyBtn>
                </S.Footer>
              </S.Card>
            );
          })}
        </S.Grid>
      )}
    </S.Section>
  );
}
