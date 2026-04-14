/**
 * Movie Match 「빠른 선택」 후보 조회 커스텀 훅.
 *
 * MovieSelector 하단에 노출할 추천 영화 리스트를 구성한다.
 * 사용자가 수동으로 검색어를 입력하지 않아도 바로 선택할 수 있도록
 * "자주 본/찜한/최근 평가한" 영화를 자동으로 모아 준다.
 *
 * ### 데이터 소스 우선순위
 * 1. 로그인 상태(userId 존재):
 *    - 위시리스트(최신 10) + 내 리뷰(최신 10) 를 병렬 조회
 *    - 영화 ID 기준 dedupe → 최근성 기준 상위 N개 추출
 *    - 개인 데이터가 부족하면(<4편) 인기 영화로 패딩
 * 2. 비로그인:
 *    - 인기 영화 상위 N개 (backend `/api/v1/movies/popular`)
 *
 * ### 응답 정규화
 * 각 API 의 응답 필드가 제각각(snake_case/camelCase, posterUrl/poster_path 등)
 * 이므로 `normalizePickMovie()` 에서 아래 4개 필드만 안정적으로 뽑아 준다.
 *   - movie_id, id  : MovieSelector onSelect → useMatch startMatch 가 둘 다 폴백으로 읽음
 *   - title
 *   - poster_path   : MovieSelector 의 TMDB URL 생성 헬퍼에 그대로 투입 가능한 경로 fragment
 *   - release_year, rating : 카드 메타 표시용 (null 허용)
 *
 * ### 에러/폴백 전략
 * - 어떤 API 가 실패해도 UX 가 죽지 않도록 `Promise.allSettled` 로 감싸고
 *   성공한 소스만 사용한다. 전부 실패하면 빈 배열 + source='none'.
 * - 네트워크 지연을 기다리지 않고 다른 액션이 가능하도록 `isLoading` 만 노출.
 *
 * @param {Object} [params={}]
 * @param {string} [params.userId=''] - 사용자 ID (빈 문자열이면 익명 → 인기 영화)
 * @param {number} [params.limit=6]   - 노출할 최대 영화 수
 * @returns {{
 *   picks: Array<{movie_id: string, id: string, title: string, poster_path: string|null, release_year: number|null, rating: number|null}>,
 *   source: 'personal'|'popular'|'mixed'|'none',
 *   isLoading: boolean,
 * }}
 */

import { useEffect, useState } from 'react';
import { getWishlist, getMyReviews } from '../../user/api/userApi';
import { getPopularMovies } from '../../movie/api/movieApi';

/**
 * TMDB 포스터 URL 에서 path fragment 를 역추출한다.
 * poster_url 이 들어왔을 때 poster_path 로 정규화하기 위한 유틸.
 *
 * @param {string|null} posterUrl
 * @returns {string|null} "/abc.jpg" 같은 path fragment 또는 null
 */
function extractTmdbPosterPath(posterUrl) {
  if (!posterUrl) return null;
  const match = posterUrl.match(/\/t\/p\/[^/]+(\/.+)$/);
  return match ? match[1] : null;
}

/**
 * 서로 다른 API 응답 스키마를 MovieSelector 가 소비 가능한 단일 shape 로 변환.
 *
 * @param {Object} raw - 위시리스트 아이템 / 리뷰 / 인기영화 중 하나
 * @param {Object} [fallback={}] - 제목/포스터가 없을 때 쓸 대체값
 * @returns {Object|null} 정규화된 영화 객체, id 추출 실패 시 null
 */
function normalizePickMovie(raw, fallback = {}) {
  if (!raw) return null;

  // 영화 ID — 다양한 소스 필드명 커버
  const id = raw.movie_id || raw.movieId || raw.id;
  if (!id) return null;

  // poster_path 결정: 직접 있으면 사용, 없으면 poster_url 에서 역추출
  let posterPath = raw.poster_path || raw.posterPath || null;
  if (!posterPath) {
    posterPath = extractTmdbPosterPath(raw.poster_url || raw.posterUrl || null);
  }

  return {
    // MovieSelector/useMatch 모두 대응하기 위해 양쪽 키 노출
    movie_id: id,
    id,
    title: raw.title || raw.movieTitle || fallback.title || '제목 없음',
    poster_path: posterPath,
    // 메타 표시용 — null 허용
    release_year: raw.release_year ?? raw.releaseYear ?? null,
    rating: raw.rating ?? raw.vote_average ?? null,
  };
}

/**
 * 영화 리스트에서 movie_id 기준 중복 제거 (먼저 나온 항목 보존).
 */
function dedupeByMovieId(list) {
  const seen = new Set();
  const out = [];
  for (const m of list) {
    if (!m || !m.movie_id) continue;
    if (seen.has(m.movie_id)) continue;
    seen.add(m.movie_id);
    out.push(m);
  }
  return out;
}

/**
 * Movie Match 「빠른 선택」 후보 목록 훅.
 */
export function useQuickPicks({ userId = '', limit = 6 } = {}) {
  const [picks, setPicks] = useState([]);
  const [source, setSource] = useState('none');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPicks() {
      setIsLoading(true);

      try {
        // ── 개인 데이터 소스 (로그인 시) ──
        let personal = [];
        if (userId) {
          // 위시리스트 + 내 리뷰를 병렬 조회. 어느 한쪽 실패해도 다른 쪽은 사용 가능하도록 allSettled.
          const [wishlistRes, reviewsRes] = await Promise.allSettled([
            getWishlist({ page: 1, size: 10 }),
            getMyReviews({ page: 1, size: 10 }),
          ]);

          const wishlistMovies =
            wishlistRes.status === 'fulfilled'
              ? (wishlistRes.value?.wishlist || [])
                  .map((item) => normalizePickMovie(item.movie))
                  .filter(Boolean)
              : [];

          const reviewMovies =
            reviewsRes.status === 'fulfilled'
              ? (reviewsRes.value?.reviews || [])
                  .map((r) => normalizePickMovie(r))
                  .filter(Boolean)
              : [];

          // 최근성이 섞여 있도록 interleave 후 dedupe — 한쪽에 치우치지 않게
          const interleaved = [];
          const maxLen = Math.max(wishlistMovies.length, reviewMovies.length);
          for (let i = 0; i < maxLen; i += 1) {
            if (wishlistMovies[i]) interleaved.push(wishlistMovies[i]);
            if (reviewMovies[i]) interleaved.push(reviewMovies[i]);
          }
          personal = dedupeByMovieId(interleaved);
        }

        // ── 인기 영화 소스 (비로그인이거나 개인 데이터가 부족할 때) ──
        // 개인 데이터가 4편 미만이면 인기 영화로 패딩하여 사용자에게 보여줄 최소 개수 확보.
        let popular = [];
        const needsPopular = !userId || personal.length < 4;
        if (needsPopular) {
          try {
            const popRes = await getPopularMovies(1, limit);
            popular = (popRes?.movies || [])
              .map((m) => normalizePickMovie(m))
              .filter(Boolean);
          } catch (popErr) {
            // 인기 영화 실패는 치명적이지 않음 — 개인 데이터만 있으면 그대로 진행
            if (import.meta.env.DEV) {
              console.warn('[useQuickPicks] getPopularMovies 실패:', popErr);
            }
          }
        }

        // ── 최종 픽 구성 ──
        // personal 이 우선이고, 부족한 만큼 popular 로 보강. 전체 dedupe.
        const combined = dedupeByMovieId([...personal, ...popular]).slice(0, limit);

        // source 판정 — UI 부제 표시에 사용
        let nextSource = 'none';
        if (combined.length === 0) {
          nextSource = 'none';
        } else if (personal.length > 0 && popular.length > 0 && personal.length < 4) {
          nextSource = 'mixed';
        } else if (personal.length > 0) {
          nextSource = 'personal';
        } else {
          nextSource = 'popular';
        }

        if (!cancelled) {
          setPicks(combined);
          setSource(nextSource);
        }
      } catch (err) {
        // 전체 실패 시 빈 목록 — UI 는 섹션 자체를 숨긴다.
        if (import.meta.env.DEV) {
          console.warn('[useQuickPicks] loadPicks 실패:', err);
        }
        if (!cancelled) {
          setPicks([]);
          setSource('none');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadPicks();

    return () => {
      // 언마운트/의존성 변경 시 stale setState 방지
      cancelled = true;
    };
  }, [userId, limit]);

  return { picks, source, isLoading };
}
