/**
 * 영화 이상형 월드컵 페이지.
 *
 * 3단계 플로우:
 * 1. 설정: 라운드(8/16/32) + 장르 선택 → 게임 시작
 * 2. 대결: 두 영화 중 하나 선택 → 다음 매치 진행
 * 3. 결과: 우승 영화 표시
 *
 * @module features/worldcup/pages/WorldcupPage
 *
 * @변경이력
 * v2 — Backend DTO 필드명 정합성 수정
 *   - handleStart: data.gameId → data.sessionId || data.gameId (sessionId 우선)
 *   - handlePick 완료 판정: result.isFinished || result.gameCompleted 둘 다 체크
 *   - handlePick 라운드 완료: result.nextMatch || nextMatches[0] 처리
 *   - handlePick nextMatches 배열로 다음 라운드 매치 교체
 *   - MovieCard 클릭: movie1Id/movie2Id (movieAId/movieBId alias) 우선 사용
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../../../shared/components/Modal';
import { buildPath, ROUTES } from '../../../shared/constants/routes';
import { startWorldcup, submitPick, getWorldcupResult } from '../api/worldcupApi';
import * as S from './WorldcupPage.styled';

/** TMDB 포스터 기본 URL */
const TMDB_IMG = 'https://image.tmdb.org/t/p/w300';

/** 라운드 옵션 */
const ROUND_OPTIONS = [8, 16, 32];

/** 장르 목록 */
const GENRE_OPTIONS = [
  { value: '', label: '전체 장르' },
  { value: 'ACTION', label: '액션' },
  { value: 'COMEDY', label: '코미디' },
  { value: 'DRAMA', label: '드라마' },
  { value: 'HORROR', label: '공포' },
  { value: 'ROMANCE', label: '로맨스' },
  { value: 'SF', label: 'SF' },
  { value: 'ANIMATION', label: '애니메이션' },
  { value: 'THRILLER', label: '스릴러' },
];

/** 게임 단계 열거 */
const PHASE = {
  SETUP: 'setup',
  BATTLE: 'battle',
  RESULT: 'result',
};

export default function WorldcupPage() {
  const navigate = useNavigate();
  const { showAlert } = useModal();

  /* 게임 단계 */
  const [phase, setPhase] = useState(PHASE.SETUP);

  /* ── 설정 상태 ── */
  const [selectedRound, setSelectedRound] = useState(16);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  /* ── 대결 상태 ── */
  const [gameId, setGameId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [currentRoundLabel, setCurrentRoundLabel] = useState('');
  const [totalMatchesInRound, setTotalMatchesInRound] = useState(0);
  const [matchInRound, setMatchInRound] = useState(0);

  /* ── 결과 상태 ── */
  const [winner, setWinner] = useState(null);
  const [rankings, setRankings] = useState([]);

  /** 현재 표시할 매치 데이터 */
  const currentMatch = matches[currentMatchIdx] || null;

  /**
   * 게임 시작 핸들러.
   *
   * startWorldcup API를 호출하고 sessionId(gameId 별칭)와 첫 라운드 매치를 저장한다.
   * Backend 응답에 sessionId와 gameId 두 필드가 모두 있으며 sessionId를 우선 사용한다.
   */
  const handleStart = useCallback(async () => {
    setIsStarting(true);
    try {
      const data = await startWorldcup({
        round: selectedRound,
        genre: selectedGenre || undefined,
      });

      // sessionId 우선, 없으면 gameId 폴백 (Backend v2 응답에는 두 필드 모두 존재)
      setGameId(data.sessionId || data.gameId);
      setMatches(data.matches || []);
      setCurrentMatchIdx(0);
      setCurrentRoundLabel(`${selectedRound}강`);
      setTotalMatchesInRound((data.matches || []).length);
      setMatchInRound(1);
      setPhase(PHASE.BATTLE);
    } catch (err) {
      showAlert({
        title: '시작 실패',
        message: err.message || '월드컵을 시작할 수 없습니다.',
        type: 'error',
      });
    } finally {
      setIsStarting(false);
    }
  }, [selectedRound, selectedGenre, showAlert]);

  /**
   * 영화 선택(Pick) 핸들러.
   *
   * submitPick API를 호출하고 응답에 따라 다음 상태로 전환한다.
   *
   * 완료 판정:
   *   - result.gameCompleted || result.isFinished — 둘 다 체크 (Backend alias 대응)
   *
   * 라운드 완료 처리:
   *   - result.nextMatches 배열이 있으면 해당 매치들로 교체하고 0번 인덱스부터 진행
   *   - result.nextMatch 단일 객체가 있으면 배열에 추가하고 다음 인덱스로 이동
   *   - 둘 다 없으면 기존 배열에서 다음 인덱스로 이동
   *
   * @param {string} winnerId - 선택한 영화의 movie1Id/movieAId 값
   */
  const handlePick = useCallback(async (winnerId) => {
    if (!currentMatch || !gameId) return;

    try {
      const result = await submitPick({
        gameId,
        matchId: currentMatch.matchId,
        winnerId,
      });

      // 완료 판정 — gameCompleted(Backend 원본) 또는 isFinished(alias) 둘 다 체크
      if (result.gameCompleted || result.isFinished) {
        // 게임 종료 → 결과 조회 API 호출
        try {
          const resultData = await getWorldcupResult(gameId);
          // winner 객체: 결과 API의 winner 우선, 없으면 winnerMovieId/finalWinner로 폴백
          setWinner(resultData.winner || { movieId: result.winnerMovieId || result.finalWinner });
          setRankings(resultData.rankings || []);
        } catch {
          // 결과 조회 실패 시 pick 응답의 winnerMovieId로 최소한 표시
          setWinner({ movieId: result.winnerMovieId || result.finalWinner });
          setRankings([]);
        }
        setPhase(PHASE.RESULT);

      } else if (result.nextMatches && result.nextMatches.length > 0) {
        // 라운드 완료 — nextMatches 배열로 새 라운드 전체 교체
        setMatches(result.nextMatches);
        setCurrentMatchIdx(0);
        setMatchInRound(1);
        setTotalMatchesInRound(result.nextMatches.length);
        // 라운드 번호 라벨 갱신 (currentRound 필드 활용)
        if (result.currentRound) {
          setCurrentRoundLabel(`${result.currentRound}강`);
        }

      } else if (result.nextMatch) {
        // 라운드 내 단일 매치 응답 — 배열에 추가하고 다음 인덱스로 이동
        setMatches((prev) => [...prev, result.nextMatch]);
        setCurrentMatchIdx((prev) => prev + 1);
        setMatchInRound((prev) => prev + 1);

      } else {
        // nextMatch/nextMatches 없음 — 기존 배열에서 다음 인덱스로 이동
        const nextIdx = currentMatchIdx + 1;
        if (nextIdx < matches.length) {
          setCurrentMatchIdx(nextIdx);
          setMatchInRound((prev) => prev + 1);
        }
      }
    } catch (err) {
      showAlert({
        title: '오류',
        message: err.message || '선택 처리에 실패했습니다.',
        type: 'error',
      });
    }
  }, [currentMatch, gameId, currentMatchIdx, matches.length, showAlert]);

  /** 다시하기 핸들러 */
  const handleRestart = () => {
    setPhase(PHASE.SETUP);
    setGameId(null);
    setMatches([]);
    setCurrentMatchIdx(0);
    setWinner(null);
    setRankings([]);
  };

  /**
   * 포스터 URL 생성.
   * posterPath(camelCase) 또는 poster_path(snake_case) 모두 지원.
   */
  const getPoster = (movie) => {
    if (!movie) return null;
    const path = movie.posterPath || movie.poster_path;
    return path ? `${TMDB_IMG}${path}` : null;
  };

  /**
   * 장르 배열 파싱.
   * JSON 문자열 또는 배열 모두 지원.
   */
  const parseGenres = (movie) => {
    if (!movie) return '';
    const g = movie.genres;
    const arr = Array.isArray(g)
      ? g
      : typeof g === 'string'
        ? (() => { try { return JSON.parse(g); } catch { return []; } })()
        : [];
    return arr.slice(0, 2).join(', ');
  };

  /**
   * 매치 카드에서 영화 ID를 추출한다.
   *
   * Backend v2 응답에서 매치 객체는 movie1Id/movie2Id(alias)와
   * movieAId/movieBId(원본) 두 가지 필드를 모두 포함한다.
   * movie1Id/movie2Id를 우선 사용하고 없으면 movieAId/movieBId로 폴백한다.
   *
   * @param {Object} match - 매치 객체
   * @param {1|2} slot     - 영화 슬롯 번호 (1 또는 2)
   * @returns {string|undefined} 영화 ID
   */
  const getMovieId = (match, slot) => {
    if (!match) return undefined;
    if (slot === 1) return match.movie1Id || match.movieAId;
    if (slot === 2) return match.movie2Id || match.movieBId;
    return undefined;
  };

  return (
    <S.Container>
      <S.PageTitle>영화 이상형 월드컵</S.PageTitle>
      <S.Subtitle>
        {phase === PHASE.SETUP && '좋아하는 영화를 골라 나만의 최애 영화를 찾아보세요!'}
        {phase === PHASE.BATTLE && '두 영화 중 더 좋아하는 영화를 선택하세요'}
        {phase === PHASE.RESULT && '나의 최애 영화가 결정되었어요!'}
      </S.Subtitle>

      {/* ── 설정 화면 ── */}
      {phase === PHASE.SETUP && (
        <S.SetupCard>
          <div>
            <S.SetupLabel>라운드 선택</S.SetupLabel>
            <S.RoundGrid>
              {ROUND_OPTIONS.map((r) => (
                <S.RoundBtn
                  key={r}
                  $active={selectedRound === r}
                  onClick={() => setSelectedRound(r)}
                >
                  {r}강
                </S.RoundBtn>
              ))}
            </S.RoundGrid>
          </div>

          <div>
            <S.SetupLabel>장르 (선택)</S.SetupLabel>
            <S.GenreSelect
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
            >
              {GENRE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </S.GenreSelect>
          </div>

          <S.StartBtn onClick={handleStart} disabled={isStarting}>
            {isStarting ? '준비 중...' : '시작하기'}
          </S.StartBtn>
        </S.SetupCard>
      )}

      {/* ── 대결 화면 ── */}
      {phase === PHASE.BATTLE && currentMatch && (
        <>
          <S.RoundInfo>
            <S.RoundBadge>{currentRoundLabel}</S.RoundBadge>
            {matchInRound} / {totalMatchesInRound} 매치
          </S.RoundInfo>

          <S.BattleArea>
            {/* 영화 1 — movie1Id(alias) 우선, 없으면 movieAId 폴백 */}
            <S.MovieCard onClick={() => handlePick(getMovieId(currentMatch, 1))}>
              {getPoster(currentMatch.movie1) ? (
                <S.MoviePoster
                  src={getPoster(currentMatch.movie1)}
                  alt={currentMatch.movie1?.title}
                  loading="eager"
                />
              ) : (
                <S.PosterPlaceholder>&#x1F3AC;</S.PosterPlaceholder>
              )}
              <S.MovieInfo>
                <S.MovieTitle>{currentMatch.movie1?.title || '영화 1'}</S.MovieTitle>
                <S.MovieMeta>
                  {currentMatch.movie1?.releaseYear || currentMatch.movie1?.release_year || ''}
                  {parseGenres(currentMatch.movie1) && ` · ${parseGenres(currentMatch.movie1)}`}
                </S.MovieMeta>
              </S.MovieInfo>
            </S.MovieCard>

            {/* VS */}
            <S.VsBadge>VS</S.VsBadge>

            {/* 영화 2 — movie2Id(alias) 우선, 없으면 movieBId 폴백 */}
            <S.MovieCard onClick={() => handlePick(getMovieId(currentMatch, 2))}>
              {getPoster(currentMatch.movie2) ? (
                <S.MoviePoster
                  src={getPoster(currentMatch.movie2)}
                  alt={currentMatch.movie2?.title}
                  loading="eager"
                />
              ) : (
                <S.PosterPlaceholder>&#x1F3AC;</S.PosterPlaceholder>
              )}
              <S.MovieInfo>
                <S.MovieTitle>{currentMatch.movie2?.title || '영화 2'}</S.MovieTitle>
                <S.MovieMeta>
                  {currentMatch.movie2?.releaseYear || currentMatch.movie2?.release_year || ''}
                  {parseGenres(currentMatch.movie2) && ` · ${parseGenres(currentMatch.movie2)}`}
                </S.MovieMeta>
              </S.MovieInfo>
            </S.MovieCard>
          </S.BattleArea>
        </>
      )}

      {/* ── 결과 화면 ── */}
      {phase === PHASE.RESULT && (
        <S.ResultContainer>
          <S.WinnerTitle>&#x1F3C6; 나의 최애 영화</S.WinnerTitle>

          {winner && (
            <S.WinnerCard>
              {getPoster(winner) ? (
                <S.MoviePoster src={getPoster(winner)} alt={winner.title} />
              ) : (
                <S.PosterPlaceholder>&#x1F3AC;</S.PosterPlaceholder>
              )}
              <S.MovieInfo>
                <S.MovieTitle>{winner.title || '최애 영화'}</S.MovieTitle>
                <S.MovieMeta>
                  {winner.releaseYear || winner.release_year || ''}
                  {parseGenres(winner) && ` · ${parseGenres(winner)}`}
                </S.MovieMeta>
              </S.MovieInfo>
            </S.WinnerCard>
          )}

          {/* 순위 (rankings가 있을 때만 표시) */}
          {rankings.length > 0 && (
            <>
              <S.HistoryTitle>최종 순위</S.HistoryTitle>
              <S.RankingList>
                {rankings.map((item, idx) => (
                  <S.RankingItem
                    key={item.movieId || item.id || idx}
                    onClick={() => navigate(buildPath(ROUTES.MOVIE_DETAIL, { id: item.movieId || item.id }))}
                    style={{ cursor: 'pointer' }}
                  >
                    <S.RankNumber $rank={idx + 1}>
                      {idx + 1}
                    </S.RankNumber>
                    <S.RankTitle>{item.title || '제목 없음'}</S.RankTitle>
                  </S.RankingItem>
                ))}
              </S.RankingList>
            </>
          )}

          {/* 액션 버튼 */}
          <S.ResultActions>
            <S.ResultBtn onClick={handleRestart}>
              다시 하기
            </S.ResultBtn>
            <S.ResultBtn
              $variant="outline"
              onClick={() => {
                if (winner) {
                  navigate(buildPath(ROUTES.MOVIE_DETAIL, { id: winner.movieId || winner.id }));
                }
              }}
            >
              영화 상세 보기
            </S.ResultBtn>
          </S.ResultActions>
        </S.ResultContainer>
      )}
    </S.Container>
  );
}
