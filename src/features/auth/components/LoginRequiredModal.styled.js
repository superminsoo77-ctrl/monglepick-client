/**
 * LoginRequiredModal 스타일.
 * TermsModal 의 Overlay/Container 패턴을 재사용하되, CTA 중심 구성.
 */

import styled from 'styled-components';
import { fadeInUp } from '../../../shared/styles/animations';

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.lg};
`;

export const Container = styled.div`
  position: relative;
  width: 100%;
  max-width: 420px;
  background: ${({ theme }) => theme.glass.bg};
  backdrop-filter: ${({ theme }) => theme.glass.blur};
  -webkit-backdrop-filter: ${({ theme }) => theme.glass.blur};
  border: 1px solid ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing['2xl']} ${({ theme }) => theme.spacing.xl};
  animation: ${fadeInUp} 0.22s ease forwards;
  text-align: center;
`;

export const CloseButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.md};
  right: ${({ theme }) => theme.spacing.md};
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 18px;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radius.full};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.bgHover ?? 'rgba(255,255,255,0.08)'};
  }
`;

export const IconWrap = styled.div`
  font-size: 48px;
  line-height: 1;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

export const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
`;

export const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.55;
  margin: 0 0 ${({ theme }) => theme.spacing.xl} 0;
`;

export const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const BaseButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: transform 0.1s ease, background 0.15s ease, border-color 0.15s ease;

  &:hover {
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const PrimaryButton = styled(BaseButton)`
  border: none;
  background: ${({ theme }) => theme.colors.accentPrimary ?? theme.colors.primary ?? '#FF5C5C'};
  color: #fff;
`;

export const SecondaryButton = styled(BaseButton)`
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: transparent;
  color: ${({ theme }) => theme.colors.textPrimary};

  &:hover {
    border-color: ${({ theme }) => theme.colors.accentPrimary ?? theme.colors.primary ?? '#FF5C5C'};
    color: ${({ theme }) => theme.colors.accentPrimary ?? theme.colors.primary ?? '#FF5C5C'};
  }
`;

export const DebugHint = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textTertiary ?? theme.colors.textSecondary};
  opacity: 0.6;
`;
