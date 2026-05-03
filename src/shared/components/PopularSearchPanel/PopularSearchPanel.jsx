import * as S from './PopularSearchPanel.styled';

/**
 * 검색창 포커스 시 노출하는 인기 검색어 패널입니다.
 */
export default function PopularSearchPanel({
  keywords = [],
  isLoading = false,
  onSelect,
}) {
  return (
    <S.Panel>
      <S.Title>인기 검색어</S.Title>

      {isLoading ? (
        <S.Message>인기 검색어를 불러오는 중입니다.</S.Message>
      ) : keywords.length === 0 ? (
        <S.Message>노출할 인기 검색어가 없습니다.</S.Message>
      ) : (
        <S.List>
          {keywords.map((item) => (
            <S.Item key={`${item.rank}-${item.keyword}`}>
              <S.Button type="button" onClick={() => onSelect?.(item.keyword)}>
                <S.Rank>{item.rank}</S.Rank>
                <S.Keyword>{item.keyword}</S.Keyword>
              </S.Button>
            </S.Item>
          ))}
        </S.List>
      )}
    </S.Panel>
  );
}
