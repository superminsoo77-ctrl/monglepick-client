import styled, { css } from 'styled-components';
import { glassCard, gradientText } from '../../../shared/styles/mixins';
import { media } from '../../../shared/styles/media';

export const Container = styled.div`
  width: 100%;
  max-width: 920px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing.xl} ${theme.spacing.lg} ${theme.spacing.xxxl}`};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};

  ${media.tablet} {
    padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.md} ${theme.spacing.xxxl}`};
  }
`;

export const HeroCard = styled.section`
  ${glassCard}
  padding: ${({ theme }) => theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const Title = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.text3xl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  ${gradientText}
`;

export const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textBase};
  line-height: ${({ theme }) => theme.typography.leadingNormal};
`;

export const SummaryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`;

export const SummaryPill = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
`;

export const SummaryText = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

export const MissionList = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const MissionCard = styled.article`
  ${glassCard}
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.lg};

  ${media.tablet} {
    align-items: stretch;
    flex-direction: column;
  }
`;

export const MissionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;
`;

export const MissionLabel = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const MissionStatus = styled.p`
  margin: 0;
  color: ${({ theme, $completed }) =>
    $completed ? theme.colors.primary : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme, $completed }) =>
    $completed ? theme.typography.fontSemibold : theme.typography.fontMedium};
`;

export const MissionDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: ${({ theme }) => theme.typography.leadingNormal};
`;

export const MissionActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};

  ${media.tablet} {
    justify-content: space-between;
  }
`;

export const MissionButton = styled.button`
  min-width: 220px;
  min-height: 48px;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radius.full};
  border: none;
  background: ${({ theme }) => theme.gradients.primary};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  cursor: pointer;
  transition: transform ${({ theme }) => theme.transitions.fast}, opacity ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: translateY(-1px);
    opacity: 0.95;
  }

  ${media.tablet} {
    flex: 1;
    min-width: 0;
  }
`;

export const MissionCheck = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme, $completed }) =>
    $completed ? theme.colors.primary : theme.colors.borderDefault};
  color: ${({ theme, $completed }) =>
    $completed ? '#fff' : theme.colors.textMuted};
  background: ${({ theme, $completed }) =>
    $completed ? theme.gradients.primary : theme.colors.bgElevated};
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  flex-shrink: 0;
`;

export const FooterCard = styled.section`
  ${glassCard}
  padding: ${({ theme }) => theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const FooterText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: ${({ theme }) => theme.typography.leadingNormal};
`;

export const ActionRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};

  ${media.tablet} {
    flex-direction: column;
  }
`;

const actionButtonBase = css`
  min-height: 50px;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: transform ${({ theme }) => theme.transitions.fast}, opacity ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: translateY(-1px);
    opacity: 0.96;
  }
`;

export const SecondaryButton = styled.button`
  ${actionButtonBase}
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ theme }) => theme.colors.bgElevated};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const PrimaryButton = styled.button`
  ${actionButtonBase}
  border: none;
  background: ${({ theme }) => theme.gradients.primary};
  color: #fff;
`;

export const ErrorCard = styled.div`
  ${glassCard}
  padding: ${({ theme }) => theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textSm};
`;
