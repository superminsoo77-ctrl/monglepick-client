/**
 * TheaterCard 스타일 (Phase 6 외부 지도 연동, 2026-04-23).
 *
 * MovieCard.styled.js 의 토큰 컨벤션(theme.colors.* / theme.radii.* / theme.spacing.*)을
 * 그대로 따른다 — 다크/라이트 모드 자동 대응.
 */

import styled from 'styled-components';

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background-color: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 12px;
  min-width: 240px;
  max-width: 320px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, filter 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  /* 취소된 카드 — MovieCard 와 동일한 시각화 패턴 (opacity 0.6 + 약한 grayscale) */
  ${({ $cancelled }) => $cancelled && `
    opacity: 0.6;
    filter: grayscale(0.3);
    &:hover { transform: none; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); }
  `}
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

// 체인별 색상 — 식별성 높이기 위해 브랜드 색에 가깝게 매핑.
// CGV 빨강 / 롯데시네마 자주 / 메가박스 보라 / 기타 회색.
const CHAIN_COLORS = {
  CGV: '#e51937',
  '롯데시네마': '#ed1c24',
  '메가박스': '#592a8c',
  기타: '#888888',
};

export const ChainBadge = styled.span`
  display: inline-block;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background-color: ${({ $chain }) => CHAIN_COLORS[$chain] || CHAIN_COLORS.기타};
  border-radius: 4px;
  letter-spacing: 0.02em;
  white-space: nowrap;
`;

export const Distance = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
`;

export const Name = styled.h4`
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.3;
`;

export const Address = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.4;
`;

export const Phone = styled.a`
  display: inline-block;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;
  margin-top: 2px;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: underline;
  }
`;

export const Actions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

export const LinkBtn = styled.a`
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.05s ease;
  /* button 으로 polymorphic 사용 시 기본 폰트 family 가 reset 되지 않게 강제 상속 */
  font-family: inherit;

  ${({ $variant, theme }) => $variant === 'primary'
    ? `
      background-color: ${theme.colors.primary};
      color: #fff;
      border: 1px solid ${theme.colors.primary};

      &:hover {
        background-color: ${theme.colors.primaryHover || theme.colors.primary};
        opacity: 0.9;
      }
    `
    : `
      background-color: ${theme.colors.bgTertiary};
      color: ${theme.colors.textSecondary};
      border: 1px solid ${theme.colors.borderDefault};

      &:hover {
        background-color: ${theme.colors.bgSecondary};
      }
    `
  }

  &:active {
    transform: scale(0.98);
  }
`;

/* ── 인라인 미니맵 (카카오맵 JS SDK, 2026-04-23) ── */

export const MapWrapper = styled.div`
  margin-top: 4px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  position: relative;
`;

export const MapContainer = styled.div`
  width: 100%;
  /* 16:10 비율 — 너무 정사각형이면 답답하고 가로 길면 정보 부족 */
  height: 180px;
  background-color: ${({ theme }) => theme.colors.bgTertiary};
`;

export const MapHint = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  background-color: ${({ theme }) => theme.colors.bgSecondary};
  pointer-events: none;
`;
