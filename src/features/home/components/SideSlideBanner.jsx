/**
 * 홈 우측하단 플로팅 슬라이드 배너 위젯 — 2026-04-14 (placement v2).
 *
 * 관리자 페이지에서 등록한 활성 배너(`GET /api/v1/banners?position=MAIN`)를
 * viewport 우측하단에 플로팅 카드(220×140)로 자동 슬라이드하며 노출한다.
 *
 * 특징
 *   - `position: fixed` viewport 고정 — 어느 섹션을 보고 있어도 시야 내 유지
 *   - 4초 간격 자동 회전 (배너가 2개 이상일 때만)
 *   - 마우스 hover 시 자동 회전 일시 정지
 *   - 하단 인디케이터 클릭 시 수동 전환
 *   - 이미지 로드 실패 / imageUrl 없을 시 primary 그라데이션 + 제목 fallback
 *   - 활성 배너가 0개이면 렌더 자체를 하지 않음 (빈 프레임 방지)
 *
 * Backend 에서 sort_order ASC + 활성/기간 필터가 이미 적용되므로,
 * 클라이언트는 응답 배열을 그대로 순회한다.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getActiveBanners } from '../../../shared/api/bannerApi';
import * as S from './SideSlideBanner.styled';

/** 자동 슬라이드 전환 간격 (ms) */
const SLIDE_INTERVAL_MS = 4000;

export default function SideSlideBanner({ position = 'MAIN' }) {
  /** 활성 배너 목록 — [] 이면 미노출 */
  const [banners, setBanners] = useState([]);
  /** 현재 노출 중인 배너 인덱스 (0-based) */
  const [currentIndex, setCurrentIndex] = useState(0);
  /** 이미지 로드 실패 배너 id 집합 — fallback 렌더 결정에 사용 */
  const [imageFailedIds, setImageFailedIds] = useState(() => new Set());
  /**
   * 마우스 hover 여부. true 이면 자동 전환 interval 이 새 타이머를 걸지 않는다.
   * useRef 대신 state 로 보관하는 이유는 hover 변화를 useEffect 의존성으로 쓰기 위함.
   */
  const [isHovered, setIsHovered] = useState(false);

  /**
   * 언마운트 이후의 setState 경고를 막기 위한 플래그.
   * StrictMode 2회 실행 / 페이지 이탈 시 응답 도착이 뒤늦을 수 있다.
   */
  const mountedRef = useRef(true);

  /* ── 최초 마운트 시 활성 배너 1회 로드 ── */
  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      try {
        const list = await getActiveBanners(position);
        if (!mountedRef.current) return;
        // 방어적 null 체크 — 백엔드가 빈 배열을 주면 그대로, 200 OK 인데 null 이면 [] 로 치환
        const safe = Array.isArray(list) ? list : [];
        setBanners(safe);
        setCurrentIndex(0);
        if (safe.length === 0) {
          // 관리자 페이지에서 배너를 등록하지 않았거나 기간/활성 필터에 걸렸을 때
          // 조용히 디버그 로그만 남긴다(에러 아님).
          console.debug('[SideSlideBanner] 활성 배너 0개 — 위젯 미노출');
        }
      } catch (err) {
        // 배너는 "있으면 좋지만 없어도 되는" 장식 요소이므로 에러는 로그만 남기고 조용히 실패
        console.error('[SideSlideBanner] 배너 조회 실패:', err);
        if (mountedRef.current) setBanners([]);
      }
    })();

    return () => {
      mountedRef.current = false;
    };
  }, [position]);

  /* ── 자동 슬라이드 전환: banners.length ≥ 2 AND !isHovered 일 때만 ── */
  useEffect(() => {
    if (banners.length < 2) return undefined; // 0~1개면 회전 불필요
    if (isHovered) return undefined; // hover 중이면 정지

    const timerId = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timerId);
  }, [banners.length, isHovered]);

  /**
   * 특정 배너의 이미지 로드가 실패했을 때 fallback 을 띄우도록 기록한다.
   * Set 을 그대로 mutate 하면 React 가 리렌더를 감지하지 못하므로 새 Set 을 만든다.
   */
  const handleImageError = useCallback((bannerId) => {
    setImageFailedIds((prev) => {
      if (prev.has(bannerId)) return prev;
      const next = new Set(prev);
      next.add(bannerId);
      return next;
    });
  }, []);

  /* 배너 0개이면 전체 미노출 (프레임도 렌더하지 않음) */
  if (banners.length === 0) return null;

  const current = banners[currentIndex];
  const bannerId = current.id ?? currentIndex;
  const imageFailed = imageFailedIds.has(bannerId);
  const hasImage = Boolean(current.imageUrl) && !imageFailed;

  return (
    <S.Frame
      role="region"
      aria-label="홈 프로모션 배너"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/*
        Slide 는 <a> 이지만 linkUrl 이 없으면 href 미설정 → 스타일에서 cursor:default
        처리된다. key 를 currentIndex 로 주어야 전환 시 fadeSlide keyframe 이 재실행된다.
      */}
      <S.Slide
        key={bannerId}
        href={current.linkUrl || undefined}
        target={current.linkUrl ? '_blank' : undefined}
        rel={current.linkUrl ? 'noopener noreferrer' : undefined}
        aria-label={current.title || '배너'}
      >
        {hasImage ? (
          <>
            <S.Image
              src={current.imageUrl}
              alt={current.title || ''}
              loading="lazy"
              onError={() => handleImageError(bannerId)}
            />
            {current.title ? <S.TitleOverlay>{current.title}</S.TitleOverlay> : null}
          </>
        ) : (
          /* 이미지 없음/실패 시 primary 그라데이션 + 제목 텍스트만 표시 */
          <S.Fallback>{current.title || '이벤트 배너'}</S.Fallback>
        )}
      </S.Slide>

      {/* 인디케이터 — 배너 2개 이상일 때만 노출 */}
      {banners.length > 1 && (
        <S.Indicators>
          {banners.map((b, idx) => (
            <S.Dot
              key={b.id ?? idx}
              type="button"
              $active={idx === currentIndex}
              aria-label={`${idx + 1}번째 배너로 이동`}
              aria-current={idx === currentIndex}
              onClick={() => setCurrentIndex(idx)}
            />
          ))}
        </S.Indicators>
      )}
    </S.Frame>
  );
}
