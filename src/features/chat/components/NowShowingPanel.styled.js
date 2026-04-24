/**
 * NowShowingPanel 스타일 (Phase 6 외부 지도 연동, 2026-04-23).
 */

import styled from 'styled-components';

export const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  background-color: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 12px;
  min-width: 240px;
  max-width: 300px;
`;

export const Header = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderDefault};
`;

export const HeaderIcon = styled.span`
  font-size: 14px;
`;

export const HeaderTitle = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const HeaderHint = styled.span`
  margin-left: auto;
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const MovieList = styled.ol`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const MovieRow = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 4px;
  border-radius: 6px;
  transition: background-color 0.15s ease, transform 0.05s ease;
  width: 100%;
  /* polymorphic 으로 button 사용 시 기본 스타일 reset */
  background: none;
  border: none;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};

  &:hover {
    background-color: ${({ theme }) => theme.colors.bgTertiary};
  }

  ${({ $clickable }) => $clickable && `
    &:active { transform: scale(0.98); }
    &:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 1px;
    }
  `}
`;

export const Rank = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  background-color: ${({ theme }) => theme.colors.primaryLight || theme.colors.bgTertiary};
  border-radius: 50%;
`;

export const MovieInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`;

export const MovieName = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const NewBadge = styled.span`
  display: inline-block;
  padding: 1px 5px;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  background-color: #e51937;
  border-radius: 3px;
  letter-spacing: 0.02em;
`;

export const AudiAcc = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
`;
