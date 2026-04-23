import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getOnboardingMissionStatus } from '../api/onboardingApi';
import { useModal } from '../../../shared/components/Modal';
import Loading from '../../../shared/components/Loading/Loading';
import { ROUTES } from '../../../shared/constants/routes';
import * as S from './OnboardingPage.styled';

const MISSION_KEYS = {
  WORLDCUP: 'worldcup',
  FAVORITE_GENRES: 'favoriteGenres',
  FAVORITE_MOVIES: 'favoriteMovies',
};

function buildMissionItems(status) {
  return [
    {
      key: MISSION_KEYS.WORLDCUP,
      title: '영화 월드컵',
      description: '넘버 원 영화를 골라 취향을 빠르게 학습해요.',
      buttonLabel: '영화 월드컵 하러 가기',
      completed: status.worldcupCompleted,
      statusText: status.worldcupCompleted ? '완료됨' : '아직 진행 전',
    },
    {
      key: MISSION_KEYS.FAVORITE_GENRES,
      title: '선호 장르',
      description: '선호 장르를 저장해 추천 범위를 더 정확하게 좁혀요.',
      buttonLabel: '선호 장르 설정하러 가기',
      completed: status.favoriteGenresCompleted,
      statusText: status.favoriteGenresCompleted
        ? `${status.favoriteGenreCount}개 저장됨`
        : '아직 설정 전',
    },
    {
      key: MISSION_KEYS.FAVORITE_MOVIES,
      title: '최애 영화',
      description: '인생 영화를 등록해 추천의 기준점을 만들어 주세요.',
      buttonLabel: '최애 영화 설정하러 가기',
      completed: status.favoriteMoviesCompleted,
      statusText: status.favoriteMoviesCompleted
        ? `${status.favoriteMovieCount}편 등록됨`
        : '아직 설정 전',
    },
  ];
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showConfirm } = useModal();

  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [allowExit, setAllowExit] = useState(false);
  const isExitConfirmOpenRef = useRef(false);

  const loadStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const nextStatus = await getOnboardingMissionStatus();
      setStatus(nextStatus);
    } catch (err) {
      setError(err.message || '시작 미션 상태를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const missionItems = useMemo(() => (
    status ? buildMissionItems(status) : []
  ), [status]);

  const shouldSkipExitGuard = useCallback((pathname) => {
    if (!status || status.completedMissionCount > 0 || allowExit) {
      return true;
    }

    return [ROUTES.ONBOARDING, ROUTES.WORLDCUP, ROUTES.MYPAGE].includes(pathname);
  }, [allowExit, status]);

  const confirmExit = useCallback(async () => {
    if (isExitConfirmOpenRef.current) {
      return false;
    }

    isExitConfirmOpenRef.current = true;

    try {
      return await showConfirm({
        title: '미션을 건너뛸까요?',
        message: '미션을 완료하지 않으면 영화 추천의 정확도가 떨어질 수 있어요',
        type: 'warning',
        confirmLabel: '그래도 나가기',
        cancelLabel: '미션 진행하기',
      });
    } finally {
      isExitConfirmOpenRef.current = false;
    }
  }, [showConfirm]);

  const navigateWithGuard = useCallback(async (to, options) => {
    const targetPath = typeof to === 'string' ? new URL(to, window.location.origin).pathname : '';

    if (shouldSkipExitGuard(targetPath)) {
      navigate(to, options);
      return;
    }

    const confirmed = await confirmExit();
    if (!confirmed) {
      return;
    }

    setAllowExit(true);
    navigate(to, options);
  }, [confirmExit, navigate, shouldSkipExitGuard]);

  useEffect(() => {
    if (!status || status.completedMissionCount > 0) {
      return undefined;
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [status]);

  useEffect(() => {
    if (!status || status.completedMissionCount > 0 || allowExit) {
      return undefined;
    }

    const handleDocumentClick = (event) => {
      if (
        event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
      ) {
        return;
      }

      const anchor = event.target.closest('a[href]');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) {
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) {
        return;
      }

      if (
        shouldSkipExitGuard(url.pathname)
        || (
          url.pathname === location.pathname
          && url.search === location.search
          && url.hash === location.hash
        )
      ) {
        return;
      }

      event.preventDefault();
      void navigateWithGuard(`${url.pathname}${url.search}${url.hash}`);
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [
    allowExit,
    location.hash,
    location.pathname,
    location.search,
    navigateWithGuard,
    shouldSkipExitGuard,
    status,
  ]);

  useEffect(() => {
    if (!status || status.completedMissionCount > 0 || allowExit) {
      return undefined;
    }

    const currentState = window.history.state || {};
    if (!currentState.onboardingGuard) {
      window.history.pushState({ ...currentState, onboardingGuard: true }, '', window.location.href);
    }

    const handlePopState = () => {
      window.history.pushState({ ...window.history.state, onboardingGuard: true }, '', window.location.href);
      void (async () => {
        const confirmed = await confirmExit();
        if (!confirmed) {
          return;
        }

        setAllowExit(true);
        navigate(-1);
      })();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [allowExit, confirmExit, navigate, status]);

  const handleMissionClick = useCallback((missionKey) => {
    switch (missionKey) {
      case MISSION_KEYS.WORLDCUP:
        navigateWithGuard(ROUTES.WORLDCUP, {
          state: { returnTo: ROUTES.ONBOARDING, onboardingMission: MISSION_KEYS.WORLDCUP },
        });
        return;
      case MISSION_KEYS.FAVORITE_GENRES:
        navigateWithGuard(ROUTES.MYPAGE, {
          state: {
            activeTab: 'preferences',
            returnTo: ROUTES.ONBOARDING,
            onboardingMission: MISSION_KEYS.FAVORITE_GENRES,
          },
        });
        return;
      case MISSION_KEYS.FAVORITE_MOVIES:
        navigateWithGuard(ROUTES.MYPAGE, {
          state: {
            activeTab: 'preferences',
            returnTo: ROUTES.ONBOARDING,
            onboardingMission: MISSION_KEYS.FAVORITE_MOVIES,
          },
        });
        return;
      default:
    }
  }, [navigateWithGuard]);

  if (isLoading) {
    return <Loading message="시작 미션을 불러오는 중..." />;
  }

  if (error) {
    return (
      <S.Container>
        <S.ErrorCard>
          <S.Title as="h1">시작 미션</S.Title>
          <S.ErrorText>{error}</S.ErrorText>
          <S.PrimaryButton type="button" onClick={() => void loadStatus()}>
            다시 불러오기
          </S.PrimaryButton>
        </S.ErrorCard>
      </S.Container>
    );
  }

  const completedMissionCount = status?.completedMissionCount ?? 0;
  const summaryText = status?.allCompleted
    ? '세 미션을 모두 완료했습니다. 이제 추천을 바로 받아보세요.'
    : '각 미션은 실제 저장 또는 완료 시 체크됩니다.';

  return (
    <S.Container>
      <S.HeroCard>
        <S.Title>시작 미션</S.Title>
        <S.Subtitle>미션 세 개를 모두 완료하면 포인트를 지급합니다!</S.Subtitle>
        <S.SummaryRow>
          <S.SummaryPill>{completedMissionCount} / 3 완료</S.SummaryPill>
          <S.SummaryText>{summaryText}</S.SummaryText>
        </S.SummaryRow>
      </S.HeroCard>

      <S.MissionList>
        {missionItems.map((mission) => (
          <S.MissionCard key={mission.key}>
            <S.MissionInfo>
              <S.MissionLabel>{mission.title}</S.MissionLabel>
              <S.MissionStatus $completed={mission.completed}>{mission.statusText}</S.MissionStatus>
              <S.MissionDescription>{mission.description}</S.MissionDescription>
            </S.MissionInfo>
            <S.MissionActionRow>
              <S.MissionButton type="button" onClick={() => handleMissionClick(mission.key)}>
                {mission.buttonLabel}
              </S.MissionButton>
              <S.MissionCheck $completed={mission.completed} aria-hidden="true">
                {mission.completed ? '✓' : ''}
              </S.MissionCheck>
            </S.MissionActionRow>
          </S.MissionCard>
        ))}
      </S.MissionList>

      <S.FooterCard>
        <S.FooterText>
          세 미션을 모두 마치면 추천 정확도가 빠르게 올라가고, 완료 보상도 받을 수 있습니다.
        </S.FooterText>
        <S.ActionRow>
          <S.SecondaryButton type="button" onClick={() => { void navigateWithGuard(ROUTES.HOME); }}>
            나중에 하기
          </S.SecondaryButton>
          <S.PrimaryButton type="button" onClick={() => { void navigateWithGuard(ROUTES.HOME); }}>
            {status?.allCompleted ? '추천 받으러 가기' : '홈으로 가기'}
          </S.PrimaryButton>
        </S.ActionRow>
      </S.FooterCard>
    </S.Container>
  );
}
