import { useCallback, useEffect, useState } from 'react';

import { getTrendingKeywords } from '../../features/movie/api/movieApi';

/**
 * 검색창 하단 공용 "인기 검색어" 목록을 로드합니다.
 *
 * 홈/검색 페이지가 동일한 소스를 바라보도록 공용 훅으로 분리합니다.
 */
export default function usePopularSearchKeywords() {
  const [keywords, setKeywords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadKeywords = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getTrendingKeywords();
      setKeywords(Array.isArray(data) ? data.slice(0, 10) : []);
    } catch (error) {
      console.error('[usePopularSearchKeywords] 인기 검색어 로드 실패:', error);
      setKeywords([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeywords();
  }, [loadKeywords]);

  return {
    keywords,
    isLoading,
    reload: loadKeywords,
  };
}
