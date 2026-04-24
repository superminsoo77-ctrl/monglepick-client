/**
 * useGeolocation — navigator.geolocation 기반 위치 권한 + 좌표 1회 획득 훅.
 *
 * Phase 6 외부 지도 연동에서 채팅 입력이 theater/booking 의도일 때
 * Agent 가 위치 좌표(lat, lng)를 함께 받으면 메시지 지명 추출 단계를 건너뛸 수 있다.
 *
 * 보안/UX 원칙:
 * - 사용자가 명시적으로 요청해야만 위치를 가져온다 (자동 권한 요청 금지).
 * - 좌표는 React state 에만 저장하고 localStorage / 세션 영구 저장은 하지 않는다
 *   (백엔드 세션 아카이브에도 저장되지 않도록 sendMessage 호출 단위에서만 사용).
 * - 권한 거부 / 미지원 / 타임아웃은 모두 별개의 status 로 노출하여 UI 가 분기 가능.
 *
 * 사용 예시:
 *   const { coords, status, error, request, clear } = useGeolocation();
 *   <button onClick={request}>위치 공유</button>
 *   {coords && <span>{coords.latitude}, {coords.longitude}</span>}
 */

import { useCallback, useState } from 'react';

const TIMEOUT_MS = 8000;          // 좌표 획득 타임아웃 (8s) — 지하/실내에서도 적당히 빠른 fallback
const MAX_AGE_MS = 60_000;        // 1분 이내 캐시된 위치 허용 (배터리/시간 절약)


/**
 * @returns {{
 *   coords: {latitude:number, longitude:number, accuracy:number} | null,
 *   status: 'idle' | 'requesting' | 'granted' | 'denied' | 'timeout' | 'unsupported' | 'error',
 *   error: string | null,
 *   request: () => Promise<{latitude:number, longitude:number} | null>,
 *   clear: () => void,
 * }}
 */
export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  // 좌표 1회 요청 — 사용자가 위치 공유 버튼을 눌렀을 때 호출.
  // 성공 시 coords 를 반환해 호출자가 즉시 sendMessage 에 첨부할 수 있게 한다.
  const request = useCallback(() => {
    return new Promise((resolve) => {
      // 브라우저 미지원 (IE 등 — 사실상 거의 없지만 안전망)
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setStatus('unsupported');
        setError('이 브라우저에서는 위치 기능을 지원하지 않아요.');
        resolve(null);
        return;
      }

      setStatus('requesting');
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const next = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setCoords(next);
          setStatus('granted');
          resolve(next);
        },
        (err) => {
          // err.code: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
          if (err.code === 1) {
            setStatus('denied');
            setError('위치 권한이 거부됐어요. 지역명을 직접 입력해주세요.');
          } else if (err.code === 3) {
            setStatus('timeout');
            setError('위치를 가져오는 데 시간이 걸리고 있어요. 잠시 후 다시 시도해주세요.');
          } else {
            setStatus('error');
            setError('위치를 가져오지 못했어요. 지역명을 직접 입력해주세요.');
          }
          resolve(null);
        },
        {
          enableHighAccuracy: false,  // 영화관 검색은 동/구 단위면 충분 → GPS 정확도 비활성으로 빠르게
          timeout: TIMEOUT_MS,
          maximumAge: MAX_AGE_MS,
        },
      );
    });
  }, []);

  const clear = useCallback(() => {
    setCoords(null);
    setStatus('idle');
    setError(null);
  }, []);

  return { coords, status, error, request, clear };
}
