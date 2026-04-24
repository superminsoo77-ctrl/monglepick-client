/**
 * 영화관 카드 컴포넌트 (Phase 6 외부 지도 연동, 2026-04-23).
 *
 * 백엔드 `theater_card` SSE 이벤트로 수신한 카카오 Local 영화관 단건을
 * 시각적인 카드로 렌더링한다.
 *
 * 표시 정보:
 * - 체인 라벨(CGV / 롯데시네마 / 메가박스 / 기타) 배지
 * - 영화관명 + 거리 (m / km 자동 변환)
 * - 도로명 주소
 * - 전화번호 (있을 때만)
 * - 외부 링크 2종:
 *   · 카카오맵 상세 페이지 (place_url) — 위치/리뷰 확인용
 *   · 체인사 모바일 검색 페이지 (booking_url) — 시간표/예매용
 * - 인라인 미니맵 (lazy expand, 카카오맵 JS SDK)
 *
 * 영화관별 시간표 API 가 공식 공개되지 않아 booking_url 은 체인사 검색 페이지로
 * 점프시키고 사용자가 영화관명으로 한 번 더 선택하도록 유도한다 (스크래핑 회피).
 */

import { useRef, useState } from 'react';
import { isKakaoMapAvailable, useKakaoMap } from '../hooks/useKakaoMap';
import * as S from './TheaterCard.styled';

/**
 * @param {object} props
 * @param {object} props.theater - theater_card SSE 이벤트 페이로드
 *   {theater_id, name, chain, address, phone, latitude, longitude, distance_m, place_url, booking_url}
 */
export default function TheaterCard({
  theater,
  userLocation = null,
  cancelled = false,
  defaultOpen = false,
}) {
  // 인라인 미니맵 expand 상태 — 기본 닫힘 (지도 SDK 로딩 비용 회피).
  // 사용자가 명시적으로 "지도 보기" 토글을 누를 때만 미니맵을 그린다.
  // 단, ChatWindow 가 영화관이 1개일 때는 defaultOpen=true 로 자동 펼침 (UX 개선).
  const [isMapOpen, setIsMapOpen] = useState(defaultOpen);
  const mapContainerRef = useRef(null);

  // 카카오맵 JS SDK 키가 있을 때만 인라인 미니맵을 활성화 (외부링크는 항상 동작).
  const mapAvailable = isKakaoMapAvailable();

  // 미니맵이 닫혀있으면 useKakaoMap 도 효과를 내지 않도록 좌표를 falsy 로 가드.
  // (좌표가 falsy 면 effect 가 즉시 return.)
  // userLocation 이 있으면 사용자 마커도 함께 표시 + bounds 자동조정.
  const { status: mapStatus, error: mapError } = useKakaoMap(mapContainerRef, {
    latitude: isMapOpen ? theater?.latitude : null,
    longitude: isMapOpen ? theater?.longitude : null,
    markerLabel: theater?.name,
    userLatitude: isMapOpen ? userLocation?.latitude : null,
    userLongitude: isMapOpen ? userLocation?.longitude : null,
    level: 4,
  });

  if (!theater || !theater.name) return null;

  const distanceText = formatDistance(theater.distance_m);
  const chainLabel = theater.chain || '기타';
  const hasCoords = Boolean(theater.latitude && theater.longitude);
  // 카카오맵 길찾기 딥링크 — 출발지는 카카오가 사용자 위치를 자동 인식.
  // userLocation 이 있으면 출발지 좌표를 명시 (`sName`/`sX`/`sY`) → 더 정확.
  const directionsUrl = hasCoords
    ? buildKakaoDirectionsUrl(theater, userLocation)
    : '';

  return (
    <S.Card $cancelled={cancelled}>
      <S.Header>
        <S.ChainBadge $chain={chainLabel}>{chainLabel}</S.ChainBadge>
        {distanceText && <S.Distance>{distanceText}</S.Distance>}
      </S.Header>

      <S.Name>{theater.name}</S.Name>

      {theater.address && <S.Address>{theater.address}</S.Address>}

      {theater.phone && (
        <S.Phone href={`tel:${theater.phone.replace(/[^0-9]/g, '')}`}>
          📞 {theater.phone}
        </S.Phone>
      )}

      <S.Actions>
        {/* 인라인 미니맵 토글 — 카카오 JS 키 있고 좌표 있을 때만 노출 */}
        {mapAvailable && hasCoords && (
          <S.LinkBtn
            as="button"
            type="button"
            onClick={() => setIsMapOpen((v) => !v)}
            $variant="secondary"
            aria-expanded={isMapOpen}
          >
            {isMapOpen ? '🔼 지도 접기' : '🗺️ 지도 보기'}
          </S.LinkBtn>
        )}
        {/* 카카오맵 길찾기 — 좌표가 있으면 항상 노출 (JS SDK 키 불필요, 외부링크 직행) */}
        {directionsUrl && (
          <S.LinkBtn
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            $variant="secondary"
          >
            🚌 길찾기
          </S.LinkBtn>
        )}
        {theater.place_url && (
          <S.LinkBtn
            href={theater.place_url}
            target="_blank"
            rel="noopener noreferrer"
            $variant="secondary"
          >
            ↗ 카카오맵
          </S.LinkBtn>
        )}
        {theater.booking_url && (
          <S.LinkBtn
            href={theater.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            $variant="primary"
          >
            🎟️ 예매
          </S.LinkBtn>
        )}
      </S.Actions>

      {/* 인라인 미니맵 — expand 시에만 컨테이너 마운트 → useKakaoMap effect 발동 */}
      {isMapOpen && (
        <S.MapWrapper>
          <S.MapContainer ref={mapContainerRef} aria-label={`${theater.name} 위치 지도`} />
          {mapStatus === 'loading' && <S.MapHint>지도를 불러오는 중...</S.MapHint>}
          {mapStatus === 'error' && (
            <S.MapHint>{mapError || '지도를 불러오지 못했어요.'}</S.MapHint>
          )}
        </S.MapWrapper>
      )}
    </S.Card>
  );
}

/**
 * 미터 거리를 사람 친화 텍스트로 변환.
 * <1000 → "320m", >=1000 → "1.2km"
 */
function formatDistance(meters) {
  if (!meters || meters <= 0) return '';
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * 카카오맵 길찾기 외부 URL 생성.
 *
 * - 사용자 좌표가 있으면: `?sName=내위치&sX=...&sY=...&eName=영화관&eX=...&eY=...`
 *   카카오 길찾기 페이지가 출발지/도착지 모두 프리필된 상태로 열려 즉시 경로 탐색.
 * - 사용자 좌표가 없으면: `/link/to/{name},{lat},{lng}` 단축 형식.
 *   카카오 페이지가 사용자 위치를 다시 묻거나 IP 기반 추정으로 출발지를 잡는다.
 *
 * 모바일/PC 모두 동작하는 유니버설 링크 (PC 는 web, 모바일은 카카오맵 앱이 있으면 deeplink 자동 인식).
 *
 * @param {object} theater - {name, latitude, longitude}
 * @param {object|null} userLocation - {latitude, longitude} 또는 null
 * @returns {string} 카카오맵 URL (좌표 누락 시 빈 문자열)
 */
function buildKakaoDirectionsUrl(theater, userLocation) {
  if (!theater?.latitude || !theater?.longitude) return '';
  const eName = encodeURIComponent(theater.name);
  const eX = theater.longitude;  // 카카오는 X=경도, Y=위도
  const eY = theater.latitude;

  if (userLocation?.latitude && userLocation?.longitude) {
    const sX = userLocation.longitude;
    const sY = userLocation.latitude;
    const sName = encodeURIComponent(userLocation.address || '내 위치');
    return `https://map.kakao.com/?sName=${sName}&sX=${sX}&sY=${sY}&eName=${eName}&eX=${eX}&eY=${eY}`;
  }
  // 출발지 미지정 — 카카오가 알아서 출발지를 처리
  return `https://map.kakao.com/link/to/${eName},${eY},${eX}`;
}
