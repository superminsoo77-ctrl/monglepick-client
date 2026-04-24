/**
 * 현재 박스오피스 패널 (Phase 6 외부 지도 연동, 2026-04-23).
 *
 * 백엔드 `now_showing` SSE 이벤트로 수신한 KOBIS 일별 박스오피스 Top-N 을
 * 영화관 카드 옆 보조 정보로 노출한다.
 *
 * KOBIS 박스오피스는 D-1 기준 누적이라 "지금 상영중" 의 신뢰성 있는 권위 데이터로
 * 사용한다. 영화관별 정확한 시간표는 KOBIS 가 제공하지 않으므로 "이 영화관에서도
 * 상영중일 가능성이 높은 영화" 로 안내 (사용자는 booking_url 로 시간표 확인).
 *
 * 표시 정보:
 * - 헤더 (📊 지금 박스오피스)
 * - Top-N 영화 리스트 (rank · 영화명 · 누적 관객수) — 클릭 시 입력창에 자동 채움
 * - 신규 진입(NEW) 배지
 */

import * as S from './NowShowingPanel.styled';

/**
 * @param {object} props
 * @param {Array<object>} props.movies - now_showing 페이로드의 movies 배열
 *   [{rank, movie_cd, movie_nm, audi_acc, open_dt, rank_inten, rank_old_and_new}]
 * @param {(text:string)=>void} [props.onPickMovie] - 영화명 클릭 시 호출.
 *   ChatWindow 가 setInputText 를 전달하면 클릭 시 "○○○ 영화 정보 알려줘" 가 입력창에 자동 채워진다.
 *   sendMessage 자동 호출은 하지 않음 (사용자가 보낸지 체크할 시점 마련).
 */
export default function NowShowingPanel({ movies, onPickMovie }) {
  if (!movies || movies.length === 0) return null;

  const isInteractive = typeof onPickMovie === 'function';

  return (
    <S.Panel>
      <S.Header>
        <S.HeaderIcon>📊</S.HeaderIcon>
        <S.HeaderTitle>지금 박스오피스</S.HeaderTitle>
        <S.HeaderHint>(KOBIS 일별 기준)</S.HeaderHint>
      </S.Header>

      <S.MovieList>
        {movies.map((m) => (
          <S.MovieRow
            key={m.movie_cd || m.rank}
            as={isInteractive ? 'button' : 'li'}
            type={isInteractive ? 'button' : undefined}
            onClick={isInteractive ? () => onPickMovie(`${m.movie_nm} 정보 알려줘`) : undefined}
            $clickable={isInteractive}
            aria-label={isInteractive ? `${m.movie_nm} 정보 묻기` : undefined}
          >
            <S.Rank>{m.rank}</S.Rank>
            <S.MovieInfo>
              <S.MovieName>
                {m.movie_nm}
                {m.rank_old_and_new === 'NEW' && <S.NewBadge>NEW</S.NewBadge>}
              </S.MovieName>
              <S.AudiAcc>{formatAudience(m.audi_acc)}</S.AudiAcc>
            </S.MovieInfo>
          </S.MovieRow>
        ))}
      </S.MovieList>
    </S.Panel>
  );
}

/**
 * 누적 관객수를 사람 친화 텍스트로 변환.
 * <10000 → "1,234명" / >=10000 → "12.3만명" / >=10000000 → "1234만명"
 */
function formatAudience(audi) {
  const n = Number(audi) || 0;
  if (n <= 0) return '';
  if (n < 10_000) return `${n.toLocaleString('ko-KR')}명`;
  if (n < 10_000_000) return `${(n / 10_000).toFixed(1)}만명`;
  return `${Math.round(n / 10_000).toLocaleString('ko-KR')}만명`;
}
