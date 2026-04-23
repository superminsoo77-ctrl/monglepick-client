import { recommendApi, requireAuth } from '../../../shared/api/axiosInstance';
import { RECOMMEND_ONBOARDING_ENDPOINTS } from '../../../shared/constants/api';

function normalizeMissionStatus(data) {
  return {
    worldcupCompleted: Boolean(data?.worldcup_completed ?? data?.worldcupCompleted),
    favoriteGenresCompleted: Boolean(
      data?.favorite_genres_completed ?? data?.favoriteGenresCompleted,
    ),
    favoriteMoviesCompleted: Boolean(
      data?.favorite_movies_completed ?? data?.favoriteMoviesCompleted,
    ),
    favoriteGenreCount: Number(data?.favorite_genre_count ?? data?.favoriteGenreCount ?? 0),
    favoriteMovieCount: Number(data?.favorite_movie_count ?? data?.favoriteMovieCount ?? 0),
    completedMissionCount: Number(
      data?.completed_mission_count ?? data?.completedMissionCount ?? 0,
    ),
    allCompleted: Boolean(data?.is_completed ?? data?.allCompleted),
  };
}

export async function getOnboardingMissionStatus() {
  requireAuth();
  const data = await recommendApi.get(RECOMMEND_ONBOARDING_ENDPOINTS.STATUS);
  return normalizeMissionStatus(data);
}
