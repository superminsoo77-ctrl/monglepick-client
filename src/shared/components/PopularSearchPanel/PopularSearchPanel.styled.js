import styled from 'styled-components';

export const Panel = styled.div`
  position: absolute;
  top: calc(100% + ${({ theme }) => theme.spacing.xs});
  left: 0;
  right: 0;
  z-index: ${({ theme }) => theme.zIndex.dropdown};
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

export const Title = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.xs};
  padding: 0 ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
`;

export const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
`;

export const Item = styled.li`
  width: 100%;
`;

export const Button = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: transparent;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: left;
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.bgTertiary};
  }
`;

export const Rank = styled.span`
  min-width: 20px;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
`;

export const Keyword = styled.span`
  min-width: 0;
  flex: 1;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textSm};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Message = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.textSm};
`;
