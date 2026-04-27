/**
 * 아이템 교환 섹션 컴포넌트.
 *
 * 카테고리 필터 탭과 아이템 카드 그리드를 렌더링한다.
 * 각 카드에는 카테고리 태그, 이름, 설명, 가격, 교환 버튼이 포함된다.
 *
 * @param {Object} props
 * @param {Array} props.items - 아이템 목록 배열
 * @param {string} props.selectedCategory - 현재 선택된 카테고리 키 ("all"|"coupon"|"avatar"|"badge"|"apply"|"hint")
 * @param {Function} props.onCategoryChange - 카테고리 변경 핸들러
 * @param {boolean} props.isLoading - 로딩 상태
 * @param {number|null} props.exchangingItemId - 교환 처리 중인 아이템 ID
 * @param {number} props.balance - 현재 보유 포인트
 * @param {Function} props.onExchangeItem - 아이템 교환 핸들러
 * @param {Function} props.formatNumber - 숫자 포맷팅 함수
 */

import Loading from '../../../shared/components/Loading/Loading';
import * as S from './ItemExchange.styled';

/**
 * 아이템 카테고리 필터 탭 목록.
 *
 * key 는 백엔드 PointItemCategory 정규값(소문자 5종)과 1:1 매칭되어야 한다.
 * 과거 한글 라벨('쿠폰', '아바타') 또는 'AI' 약어를 그대로 전달하면
 * PointItemRepository.findByItemCategoryAndIsActiveTrueOrderByItemPriceAsc("쿠폰") 처럼
 * 매칭되는 행이 없어 항상 빈 결과를 반환했다 — 필터가 "안 먹히던" 원인.
 *
 * label 은 사용자 표시용. AI 이용권은 coupon 카테고리지만 사용자에게 더 직관적인
 * "AI 이용권" 라벨을 노출한다.
 */
const ITEM_CATEGORIES = [
  { key: 'all', label: '전체' },
  { key: 'coupon', label: 'AI 이용권' },
  { key: 'avatar', label: '아바타' },
  { key: 'badge', label: '배지' },
  { key: 'apply', label: '응모권' },
  { key: 'hint', label: '힌트' },
];

/**
 * 카테고리 코드 → 한글 라벨 (카드 태그 표시용).
 *
 * 백엔드가 historical 잔재로 대문자/한글 카테고리를 반환하더라도
 * lowercase 정규화 후 매핑되도록 안전 보정한다.
 */
const CATEGORY_TAG_LABEL = {
  coupon: 'AI 이용권',
  avatar: '아바타',
  badge: '배지',
  apply: '응모권',
  hint: '힌트',
};

export default function ItemExchange({
  items,
  selectedCategory,
  onCategoryChange,
  isLoading,
  exchangingItemId,
  balance,
  onExchangeItem,
  formatNumber,
}) {
  /* 현재 필터 라벨 — 빈 상태 메시지에서 "어떤 카테고리가 비었는지" 명시하기 위해 사용 */
  const activeFilterLabel =
    ITEM_CATEGORIES.find((c) => c.key === selectedCategory)?.label || '전체';

  return (
    <S.Section>
      <S.SectionTitle>아이템 교환</S.SectionTitle>

      {/* 카테고리 필터 탭 — key 로 식별, label 로 표시 */}
      <S.Tabs>
        {ITEM_CATEGORIES.map((cat) => (
          <S.Tab
            key={cat.key}
            $active={selectedCategory === cat.key}
            onClick={() => onCategoryChange(cat.key)}
          >
            {cat.label}
          </S.Tab>
        ))}
      </S.Tabs>

      {/* 아이템 그리드 */}
      {isLoading ? (
        <Loading message="아이템 로딩 중..." />
      ) : items.length === 0 ? (
        <S.Empty>
          <p>
            {selectedCategory === 'all'
              ? '교환 가능한 아이템이 없습니다.'
              : `${activeFilterLabel} 카테고리에 교환 가능한 아이템이 없습니다.`}
          </p>
        </S.Empty>
      ) : (
        <S.Grid>
          {items.map((item) => (
            <S.Card key={item.itemId}>
              {/* 아이템 카테고리 태그 — 백엔드 raw 값을 lowercase 정규화 후 한글 매핑 */}
              <S.CategoryTag>
                {CATEGORY_TAG_LABEL[(item.category || '').toLowerCase()] || item.category}
              </S.CategoryTag>
              {/* 아이템 이름 */}
              <S.ItemName>{item.name}</S.ItemName>
              {/* 아이템 설명 */}
              <S.ItemDesc>{item.description}</S.ItemDesc>
              {/* 가격 및 교환 버튼 */}
              <S.Footer>
                <S.Price>{formatNumber(item.price)}P</S.Price>
                <S.ExchangeBtn
                  onClick={() => onExchangeItem(item)}
                  disabled={
                    exchangingItemId === item.itemId ||
                    (balance || 0) < item.price
                  }
                >
                  {exchangingItemId === item.itemId
                    ? '교환 중...'
                    : (balance || 0) < item.price
                      ? '포인트 부족'
                      : '교환'}
                </S.ExchangeBtn>
              </S.Footer>
            </S.Card>
          ))}
        </S.Grid>
      )}
    </S.Section>
  );
}
