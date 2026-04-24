/**
 * "내 아이템" 인벤토리 섹션 (2026-04-14 신규, C 방향).
 *
 * PointPage 에서 ItemExchange 섹션 위에 배치되며, 포인트로 교환한 아바타·배지·응모권·힌트를
 * 카테고리별로 조회·착용·사용할 수 있는 통합 섹션.
 *
 * AI 이용권 잔여 횟수는 PointShopSection 의 "AI 이용권 잔여" 카드에서 별도 표시되므로
 * 이 섹션에는 포함되지 않는다 (인벤토리 아이템 전용).
 *
 * @param {Object} props
 * @param {Object|null} props.summary — UserItemSummaryResponse ({ totalActive, avatarCount, ..., equippedAvatar, equippedBadge })
 * @param {Object|null} props.itemsPage — UserItemPageResponse ({ content, page, size, totalElements, totalPages })
 * @param {string} props.selectedCategory — 현재 선택된 카테고리 필터 키
 * @param {Function} props.onCategoryChange — (categoryKey) => void
 * @param {number} props.currentPage — 0-indexed
 * @param {Function} props.onPageChange — (nextPage) => void
 * @param {boolean} props.isLoading
 * @param {number|null} props.processingItemId — 현재 착용/해제/사용 처리 중인 userItemId
 * @param {Function} props.onEquip — (userItem) => Promise
 * @param {Function} props.onUnequip — (userItem) => Promise
 * @param {Function} props.onUse — (userItem) => Promise
 * @param {Function} props.formatNumber
 * @param {Function} props.formatDate
 */

import Loading from '../../../shared/components/Loading/Loading';
import * as S from './MyItemsSection.styled';

/**
 * 카테고리 필터 탭 정의.
 * key=== 'all' 이면 Backend 에 category 파라미터 미전달 (전체 조회).
 */
const CATEGORY_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'avatar', label: '아바타' },
  { key: 'badge', label: '배지' },
  { key: 'apply', label: '응모권' },
  { key: 'hint', label: '힌트' },
  { key: 'coupon', label: '쿠폰' },
];

/**
 * 카테고리 코드 → 한글 라벨 매핑.
 */
const CATEGORY_LABEL = {
  avatar: '아바타',
  badge: '배지',
  apply: '응모권',
  hint: '힌트',
  coupon: '쿠폰',
};

/**
 * 착용 가능한 카테고리.
 */
const EQUIPPABLE = new Set(['avatar', 'badge']);

/**
 * 사용(소비) 가능한 카테고리.
 * 응모권(apply) 과 힌트(hint) 만 "사용" 버튼을 노출한다.
 */
const USABLE = new Set(['apply', 'hint']);

/**
 * 상태 코드 → 배지 라벨 매핑.
 */
const STATUS_LABEL = {
  ACTIVE: '보유 중',
  EQUIPPED: '착용 중',
  USED: '사용 완료',
  EXPIRED: '만료',
};

/**
 * 상태 코드 → styled variant 키 매핑.
 */
const STATUS_VARIANT = {
  ACTIVE: 'active',
  EQUIPPED: 'equipped',
  USED: 'used',
  EXPIRED: 'expired',
};

export default function MyItemsSection({
  summary,
  itemsPage,
  selectedCategory,
  onCategoryChange,
  currentPage,
  onPageChange,
  isLoading,
  processingItemId,
  onEquip,
  onUnequip,
  onUse,
  formatNumber,
  formatDate,
}) {
  /* 로딩 중 */
  if (isLoading && !itemsPage) {
    return (
      <S.Section>
        <S.SectionTitle>내 아이템</S.SectionTitle>
        <Loading message="보유 아이템 로딩 중..." />
      </S.Section>
    );
  }

  const items = itemsPage?.content || [];
  const totalPages = itemsPage?.totalPages || 0;
  const totalElements = itemsPage?.totalElements || 0;

  return (
    <S.Section>
      <S.SectionTitle>내 아이템</S.SectionTitle>
      {/*
       * QA #176 (2026-04-23): "아바타 꾸미기도 되나여" 질문에 대응.
       * 아바타/배지 착용 기능은 이미 구현돼 있으나 사용자에게 진입 경로가 보이지 않아
       * 기능 존재 자체가 묻히는 문제. 안내 문구에 "착용하면 마이페이지 프로필에 즉시 반영"
       * 을 명시해 "꾸미기 가능" 임을 분명히 한다. 커스텀 합성(부분 조합) 같은 고도화는 별도 로드맵.
       */}
      <S.SectionDesc>
        포인트 상점에서 교환한 아바타·배지·응모권·힌트를 관리합니다.
        아바타와 배지는 <strong>착용</strong> 버튼을 누르면 마이페이지 프로필에 즉시 반영되며,
        다른 아이템으로 언제든 교체할 수 있어요.
      </S.SectionDesc>

      {/* 요약 카드 행 */}
      {summary && (
        <S.SummaryRow>
          <S.SummaryCard>
            <S.SummaryLabel>전체 보유</S.SummaryLabel>
            <S.SummaryValue>{formatNumber(summary.totalActive || 0)}</S.SummaryValue>
          </S.SummaryCard>
          <S.SummaryCard>
            <S.SummaryLabel>아바타</S.SummaryLabel>
            <S.SummaryValue>{formatNumber(summary.avatarCount || 0)}</S.SummaryValue>
          </S.SummaryCard>
          <S.SummaryCard>
            <S.SummaryLabel>배지</S.SummaryLabel>
            <S.SummaryValue>{formatNumber(summary.badgeCount || 0)}</S.SummaryValue>
          </S.SummaryCard>
          <S.SummaryCard>
            <S.SummaryLabel>응모권</S.SummaryLabel>
            <S.SummaryValue>{formatNumber(summary.applyCount || 0)}</S.SummaryValue>
          </S.SummaryCard>
          <S.SummaryCard>
            <S.SummaryLabel>힌트</S.SummaryLabel>
            <S.SummaryValue>{formatNumber(summary.hintCount || 0)}</S.SummaryValue>
          </S.SummaryCard>
        </S.SummaryRow>
      )}

      {/* 카테고리 필터 */}
      <S.Tabs>
        {CATEGORY_FILTERS.map((cat) => (
          <S.Tab
            key={cat.key}
            $active={selectedCategory === cat.key}
            onClick={() => onCategoryChange(cat.key)}
          >
            {cat.label}
          </S.Tab>
        ))}
      </S.Tabs>

      {/* 아이템 리스트 */}
      {items.length === 0 ? (
        <S.Empty>
          보유한 아이템이 없습니다. 아래 "아이템 교환" 섹션에서 포인트로 교환해 보세요.
        </S.Empty>
      ) : (
        <S.Grid>
          {items.map((item) => {
            /* 각 액션 버튼 표시 조건 */
            const canEquip =
              EQUIPPABLE.has(item.category) &&
              item.status === 'ACTIVE';
            const canUnequip =
              EQUIPPABLE.has(item.category) &&
              item.status === 'EQUIPPED';
            const canUse =
              USABLE.has(item.category) &&
              item.status === 'ACTIVE' &&
              (item.remainingQuantity || 0) > 0;

            const isProcessing = processingItemId === item.userItemId;
            const statusVariant = STATUS_VARIANT[item.status] || 'active';

            return (
              <S.Card
                key={item.userItemId}
                $equipped={item.status === 'EQUIPPED'}
                $expired={item.status === 'EXPIRED'}
              >
                {/* 상단 배지 행 — 카테고리 + 상태 */}
                <S.TagRow>
                  <S.CategoryTag>
                    {CATEGORY_LABEL[item.category] || item.category}
                  </S.CategoryTag>
                  <S.StatusBadge $variant={statusVariant}>
                    {STATUS_LABEL[item.status] || item.status}
                  </S.StatusBadge>
                </S.TagRow>

                {/* 이미지 (있으면) */}
                {item.imageUrl && (
                  <S.ItemImage src={item.imageUrl} alt={item.itemName} />
                )}

                {/* 이름 + 설명 */}
                <S.ItemName>{item.itemName}</S.ItemName>
                {item.itemDescription && (
                  <S.ItemDesc>{item.itemDescription}</S.ItemDesc>
                )}

                {/* 메타 — 획득/만료 + 잔여 수량 */}
                <S.Meta>
                  {item.acquiredAt && (
                    <span>획득: {formatDate ? formatDate(item.acquiredAt) : item.acquiredAt.slice(0, 10)}</span>
                  )}
                  {item.expiresAt && (
                    <span>만료: {formatDate ? formatDate(item.expiresAt) : item.expiresAt.slice(0, 10)}</span>
                  )}
                  {USABLE.has(item.category) && item.remainingQuantity != null && (
                    <span>잔여: {formatNumber(item.remainingQuantity)}회</span>
                  )}
                </S.Meta>

                {/* 액션 버튼 */}
                {(canEquip || canUnequip || canUse) && (
                  <S.Footer>
                    {canEquip && (
                      <S.ActionBtn
                        $primary
                        onClick={() => onEquip(item)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? '처리 중...' : '착용'}
                      </S.ActionBtn>
                    )}
                    {canUnequip && (
                      <S.ActionBtn
                        onClick={() => onUnequip(item)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? '처리 중...' : '해제'}
                      </S.ActionBtn>
                    )}
                    {canUse && (
                      <S.ActionBtn
                        $primary
                        onClick={() => onUse(item)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? '처리 중...' : '사용'}
                      </S.ActionBtn>
                    )}
                  </S.Footer>
                )}
              </S.Card>
            );
          })}
        </S.Grid>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <S.Pagination>
          <S.PageBtn
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 0}
          >
            이전
          </S.PageBtn>
          <S.PageInfo>
            {currentPage + 1} / {totalPages} ({formatNumber(totalElements)}개)
          </S.PageInfo>
          <S.PageBtn
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage + 1 >= totalPages}
          >
            다음
          </S.PageBtn>
        </S.Pagination>
      )}
    </S.Section>
  );
}
