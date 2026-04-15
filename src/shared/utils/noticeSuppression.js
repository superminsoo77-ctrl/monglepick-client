/**
 * 공지 팝업/모달 재표시 억제 유틸 (2026-04-15 신규).
 *
 * <p>홈 진입 시 자동 표시되는 POPUP/MODAL 공지가 매번 뜨면 UX 를 해치므로,
 * 두 가지 억제 정책을 localStorage 기반으로 제공한다.</p>
 *
 * <h3>억제 정책</h3>
 * <ul>
 *   <li><b>영구 억제 (dismissed)</b> — "다시 보지 않기" 선택 시. localStorage 에
 *       해당 공지 id 가 저장되어 있는 동안은 영영 다시 뜨지 않는다.</li>
 *   <li><b>24시간 억제 (expireAt)</b> — 단순 "닫기" 선택 시. 닫은 시점으로부터
 *       24시간 동안만 억제되고, 지나면 다시 표시된다.</li>
 * </ul>
 *
 * <p>비로그인 유저도 동작해야 하므로 서버 상태를 쓰지 않고 전적으로 localStorage
 * 에 의존한다. 따라서 시크릿 모드/쿠키 삭제 시에는 다시 표시될 수 있다 (의도된 한계).</p>
 *
 * <p>모든 함수는 <code>localStorage</code> 접근 예외(Safari private mode 등)에
 * 방어적으로 try/catch 처리한다. 실패 시 억제하지 않고 기본(표시) 동작을 따른다.</p>
 */

/** 영구 억제 키 — "다시 보지 않기" 기록 */
const PERM_KEY = (noticeId) => `mongle.notice.dismissed.${noticeId}`;

/** 24시간 억제 키 — 단순 "닫기" 시 재표시 억제 만료 시각 (epoch ms) */
const EXPIRE_KEY = (noticeId) => `mongle.notice.expireAt.${noticeId}`;

/** 24시간 (ms) */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 공지가 현재 억제 대상인지 확인한다.
 *
 * @param {number|string} noticeId
 * @returns {boolean} 영구 억제 중 OR 24시간 억제 유효 기간 내이면 true
 */
export function isNoticeSuppressed(noticeId) {
  if (noticeId === null || noticeId === undefined || noticeId === '') return false;
  try {
    // 1) 영구 억제 체크
    if (localStorage.getItem(PERM_KEY(noticeId)) === '1') return true;

    // 2) 24시간 억제 체크
    const expireAt = Number(localStorage.getItem(EXPIRE_KEY(noticeId)) || 0);
    if (expireAt > Date.now()) return true;

    // 만료된 24시간 키는 정리 (스토리지 누수 방지)
    if (expireAt && expireAt <= Date.now()) {
      localStorage.removeItem(EXPIRE_KEY(noticeId));
    }
    return false;
  } catch {
    // localStorage 접근 불가 (private mode 등) — 기본 표시
    return false;
  }
}

/**
 * "다시 보지 않기" — 해당 공지를 영구 억제한다.
 *
 * @param {number|string} noticeId
 */
export function suppressNoticePermanent(noticeId) {
  if (noticeId === null || noticeId === undefined || noticeId === '') return;
  try {
    localStorage.setItem(PERM_KEY(noticeId), '1');
    // 중복 키 정리 — 영구 억제가 24시간 억제 키보다 우선
    localStorage.removeItem(EXPIRE_KEY(noticeId));
  } catch {
    // 저장 실패 — 이번 세션 동안은 UI state 로만 숨김 처리되도록 상위에서 대응
  }
}

/**
 * 단순 "닫기" — 해당 공지를 24시간 억제한다.
 *
 * @param {number|string} noticeId
 */
export function suppressNoticeFor24h(noticeId) {
  if (noticeId === null || noticeId === undefined || noticeId === '') return;
  try {
    const until = Date.now() + ONE_DAY_MS;
    localStorage.setItem(EXPIRE_KEY(noticeId), String(until));
  } catch {
    // 저장 실패 — 다음 페이지 로드 시 다시 뜰 수 있음 (의도된 한계)
  }
}
