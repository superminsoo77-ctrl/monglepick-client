const WITHDRAWN_ACCOUNT_LABEL = '탈퇴한 계정';

export function isWithdrawnUser(source) {
  if (!source) return false;

  const status = String(
    source.accountStatus ||
    source.userStatus ||
    source.status ||
    source.authorStatus ||
    '',
  ).toUpperCase();

  return Boolean(
    source.isWithdrawn ||
    source.withdrawn ||
    source.deletedUser ||
    source.authorWithdrawn ||
    source.isAuthorWithdrawn ||
    status === 'WITHDRAWN' ||
    status === 'DELETED' ||
    status === 'ACCOUNT_WITHDRAWN',
  );
}

export function getDisplayNickname(source, fallback = '익명') {
  if (isWithdrawnUser(source)) {
    return WITHDRAWN_ACCOUNT_LABEL;
  }

  const nickname =
    (typeof source === 'string' ? source : null) ||
    source?.nickname ||
    source?.authorNickname ||
    source?.userNickname ||
    source?.author?.nickname ||
    null;

  return nickname || fallback;
}

export { WITHDRAWN_ACCOUNT_LABEL };
