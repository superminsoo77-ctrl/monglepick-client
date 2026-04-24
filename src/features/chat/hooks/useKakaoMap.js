/**
 * useKakaoMap — 카카오맵 JavaScript SDK 스크립트 1회 로딩 + Map 인스턴스 관리 훅.
 *
 * Phase 6 외부 지도 연동 (2026-04-23) 라운드 후속 — TheaterCard 의 인라인 미니맵용.
 *
 * 설계:
 * - 스크립트 동적 로딩 + 전역 Promise 캐싱 → 페이지 내 여러 미니맵이 떠도 SDK 는 1회만 로드.
 * - `autoload=false` 로 SDK 본체만 받고 maps 라이브러리 초기화는 명시적 `kakao.maps.load(cb)` 호출.
 *   (자동 초기화 시 페이지 진입과 동시에 maps 라이브러리가 메모리에 올라가 비용 증가.)
 * - 키 미설정 시 status='unsupported' 로 graceful — TheaterCard 가 외부링크 fallback 으로 분기.
 * - 좌표 변경 시 Map.setCenter 만 호출하여 인스턴스 재생성 회피 (성능).
 *
 * 사용 예시:
 *   const mapRef = useRef(null);
 *   const { status, error } = useKakaoMap(mapRef, {
 *     latitude: 37.4979, longitude: 127.0276,
 *     markerLabel: 'CGV 강남',
 *   });
 */

import { useEffect, useRef, useState } from 'react';

const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY || '';

// 스크립트 로딩 상태 — 모듈 전역 캐싱으로 SDK 가 페이지 전체에 1회만 로드되도록 한다.
// 'pending' Promise 가 있으면 여러 호출자가 같은 로딩에 await 한다.
let _sdkLoadPromise = null;

/**
 * 카카오맵 SDK 스크립트를 동적으로 로드한다 (1회).
 *
 * @returns {Promise<typeof window.kakao>} window.kakao 가 사용 가능해진 시점에 resolve.
 *   키 누락 또는 로딩 실패 시 reject.
 */
function loadKakaoMapSdk() {
  // SSR 가드 — Node 환경(테스트 등)에서는 즉시 reject
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window 없음 (SSR/Node 환경)'));
  }
  // 이미 로드된 경우 즉시 resolve (window.kakao.maps 까지 확인)
  if (window.kakao && window.kakao.maps) {
    return Promise.resolve(window.kakao);
  }
  // 진행 중인 로딩이 있으면 그것에 await
  if (_sdkLoadPromise) return _sdkLoadPromise;
  // 키 누락 — 더 시도하지 않고 즉시 reject
  if (!KAKAO_JS_KEY) {
    return Promise.reject(new Error('VITE_KAKAO_JAVASCRIPT_KEY 미설정'));
  }

  _sdkLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    // autoload=false: SDK 본체만 다운로드, maps 라이브러리는 명시적으로 kakao.maps.load() 호출.
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`;
    script.async = true;
    script.onload = () => {
      // 스크립트 로딩 완료 직후엔 window.kakao.maps 가 아직 없다 — load(cb) 로 maps 초기화.
      if (!window.kakao) {
        reject(new Error('카카오맵 SDK 로드 실패 (window.kakao 누락)'));
        return;
      }
      window.kakao.maps.load(() => {
        resolve(window.kakao);
      });
    };
    script.onerror = () => {
      // 다음 호출에서 재시도 가능하도록 캐시 무효화
      _sdkLoadPromise = null;
      reject(new Error('카카오맵 SDK 스크립트 로딩 실패 (네트워크/키 무효 가능성)'));
    };
    document.head.appendChild(script);
  });

  return _sdkLoadPromise;
}

/**
 * @param {React.RefObject<HTMLDivElement>} containerRef - 지도가 그려질 div 컨테이너 ref
 * @param {object} options
 * @param {number} options.latitude - 영화관(목적지) 위도
 * @param {number} options.longitude - 영화관(목적지) 경도
 * @param {string} [options.markerLabel] - 영화관 마커 위 표시할 라벨 (영화관명 등)
 * @param {number} [options.userLatitude] - 사용자 현재 위치 위도 (선택, 있으면 별도 마커 표시 + bounds 자동조정)
 * @param {number} [options.userLongitude] - 사용자 현재 위치 경도 (선택)
 * @param {number} [options.level=4] - 카카오맵 줌 레벨 (1=가장 확대, 14=가장 축소). 기본 4 ≈ 동네 단위.
 *                                     userLatitude/userLongitude 가 있으면 bounds 자동조정으로 level 은 무시됨.
 * @returns {{status:'idle'|'loading'|'ready'|'unsupported'|'error', error:string|null}}
 */
export function useKakaoMap(containerRef, {
  latitude,
  longitude,
  markerLabel,
  userLatitude,
  userLongitude,
  level = 4,
} = {}) {
  const [status, setStatus] = useState(KAKAO_JS_KEY ? 'idle' : 'unsupported');
  const [error, setError] = useState(KAKAO_JS_KEY ? null : '카카오맵 키가 설정되지 않았어요.');

  // 생성된 Map / Marker / InfoWindow 인스턴스를 ref 로 보관하여 좌표 변경 시 재생성 회피.
  const mapRef = useRef(null);
  const markerRef = useRef(null);          // 영화관(목적지) 마커
  const infoWindowRef = useRef(null);      // 영화관 라벨
  const userMarkerRef = useRef(null);      // 사용자 위치 마커 (선택)
  const polylineRef = useRef(null);        // 사용자↔영화관 직선 (선택)

  useEffect(() => {
    // 키 미설정 → 아무것도 안 함 (외부링크 fallback)
    if (!KAKAO_JS_KEY) return;
    // 좌표 누락 → 그릴 게 없음
    if (!latitude || !longitude) return;
    // 컨테이너 미마운트 → 다음 effect 까지 대기
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    // 비동기 IIFE 로 감싸 setState 가 effect body 의 동기 라인에서 빠지도록 한다.
    // (effect body 직접 setState 는 React Compiler/ESLint 의 cascading-render 룰에 걸린다.)
    (async () => {
      setStatus('loading');
      setError(null);
      try {
        const kakao = await loadKakaoMapSdk();
        if (cancelled) return;

        const theaterCenter = new kakao.maps.LatLng(latitude, longitude);
        const hasUser = Boolean(userLatitude && userLongitude);
        const userCenter = hasUser ? new kakao.maps.LatLng(userLatitude, userLongitude) : null;

        // 첫 진입 — Map 인스턴스 신규 생성
        if (!mapRef.current) {
          mapRef.current = new kakao.maps.Map(container, {
            center: theaterCenter,
            level,
            draggable: true,
            scrollwheel: false,  // 채팅 스크롤과 충돌 방지
          });
        } else {
          // 좌표만 변경 — 인스턴스 재사용
          mapRef.current.setCenter(theaterCenter);
          mapRef.current.setLevel(level);
        }

        // 영화관(목적지) 마커 (1개만 — 이전 마커 제거 후 재배치)
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }
        markerRef.current = new kakao.maps.Marker({ position: theaterCenter, map: mapRef.current });

        // 라벨 InfoWindow — 영화관명 표시
        if (markerLabel) {
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }
          infoWindowRef.current = new kakao.maps.InfoWindow({
            content: `<div style="padding:6px 10px;font-size:12px;font-weight:600;color:#222;">${escapeHtml(markerLabel)}</div>`,
          });
          infoWindowRef.current.open(mapRef.current, markerRef.current);
        }

        // 사용자 위치 마커 + 직선 + bounds 자동조정 (사용자 좌표가 있을 때만)
        if (hasUser && userCenter) {
          // 사용자 마커 — 영화관 마커와 시각적으로 구분되도록 다른 색 이미지 사용.
          // 카카오맵 기본 마커는 빨강이라 사용자는 파란색으로 (data URI SVG 인라인).
          // 이미지 크기 24x35, 앵커 (12, 35) — 마커 끝점이 좌표를 가리키도록.
          const userMarkerImage = new kakao.maps.MarkerImage(
            'data:image/svg+xml;utf8,' + encodeURIComponent(USER_MARKER_SVG),
            new kakao.maps.Size(24, 35),
            { offset: new kakao.maps.Point(12, 35) },
          );
          if (userMarkerRef.current) userMarkerRef.current.setMap(null);
          userMarkerRef.current = new kakao.maps.Marker({
            position: userCenter,
            map: mapRef.current,
            image: userMarkerImage,
            title: '내 위치',
          });

          // 사용자↔영화관 직선 (보조선) — 점선으로 동선 시각화
          if (polylineRef.current) polylineRef.current.setMap(null);
          polylineRef.current = new kakao.maps.Polyline({
            map: mapRef.current,
            path: [userCenter, theaterCenter],
            strokeWeight: 3,
            strokeColor: '#3b82f6',
            strokeOpacity: 0.7,
            strokeStyle: 'shortdash',
          });

          // bounds 자동조정 — 두 마커가 화면 안에 모두 보이도록.
          // setBounds 후 약간 zoom out 해서 마커 끝이 잘리지 않도록 패딩 효과.
          const bounds = new kakao.maps.LatLngBounds();
          bounds.extend(theaterCenter);
          bounds.extend(userCenter);
          mapRef.current.setBounds(bounds);
        } else {
          // 사용자 위치 없음 → 이전 사용자 마커/직선이 있다면 제거 (다음 턴에서 좌표 사라진 경우)
          if (userMarkerRef.current) {
            userMarkerRef.current.setMap(null);
            userMarkerRef.current = null;
          }
          if (polylineRef.current) {
            polylineRef.current.setMap(null);
            polylineRef.current = null;
          }
        }

        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setError(err?.message || '지도를 불러오지 못했어요.');
      }
    })();

    return () => {
      cancelled = true;
      // Map 인스턴스 자체는 GC 가능 — 별도 dispose 없음.
      // 컨테이너가 언마운트되면 카카오맵이 그려둔 DOM 도 함께 사라진다.
    };
  }, [containerRef, latitude, longitude, markerLabel, userLatitude, userLongitude, level]);

  return { status, error };
}

/**
 * 사용자 위치 마커용 SVG (24×35, 파란색).
 * 카카오맵 기본 마커(빨강)와 색으로 구분 → "내 위치 vs 영화관" 한눈에 식별.
 * data URI 로 인라인 → 추가 네트워크 요청 없음.
 */
const USER_MARKER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="35" viewBox="0 0 24 35">
  <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 23 12 23s12-14 12-23c0-6.6-5.4-12-12-12z" fill="#3b82f6"/>
  <circle cx="12" cy="12" r="5" fill="#fff"/>
</svg>`;

/**
 * InfoWindow content 에 직접 영화관명을 박을 때 XSS 방어.
 * 카카오 InfoWindow 는 HTML 문자열을 그대로 렌더하므로 escape 필수.
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 카카오맵 SDK 키가 환경변수에 설정되어 있는지 여부.
 * UI 가 "지도 보기" 토글 자체를 숨기거나 비활성화할 때 사용.
 */
export function isKakaoMapAvailable() {
  return Boolean(KAKAO_JS_KEY);
}
