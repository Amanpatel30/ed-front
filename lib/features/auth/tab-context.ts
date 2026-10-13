/**
 * Per-tab session context.
 *
 * The backend's refresh token is a single httpOnly cookie, which the browser
 * shares across every tab and which JavaScript cannot read. Nothing here can
 * isolate sessions on its own — what it records is which tab established one, so
 * that a genuinely new tab does not silently inherit the browser-wide cookie.
 *
 * Every function is browser-only and must not run during render.
 */
const TAB_ID_KEY = "educore.tabId";
const TAB_SESSION_KEY = "educore.tabSession";
const TAB_USER_KEY = "educore.tabUser";

/** True when this tab itself signed in or restored a session. */
export function tabHasSession(): boolean {
  return window.sessionStorage.getItem(TAB_SESSION_KEY) === "1";
}

/**
 * The account this tab signed in as. Not a secret — an id, kept so a rotation
 * that returns a different account can be refused rather than adopted.
 */
export function tabUserId(): string | null {
  return window.sessionStorage.getItem(TAB_USER_KEY);
}

/** Records which account this tab holds, minting a tab id if it has none. */
export function markTabSession(userId: string): void {
  const session = window.sessionStorage;

  if (!session.getItem(TAB_ID_KEY)) {
    session.setItem(TAB_ID_KEY, crypto.randomUUID());
  }

  session.setItem(TAB_USER_KEY, userId);
  session.setItem(TAB_SESSION_KEY, "1");
}

export function clearTabContext(): void {
  window.sessionStorage.removeItem(TAB_ID_KEY);
  window.sessionStorage.removeItem(TAB_SESSION_KEY);
  window.sessionStorage.removeItem(TAB_USER_KEY);
}

/**
 * Verifies the stored tab id is not already live in another tab.
 *
 * A tab created by "Duplicate tab" starts with a copy of sessionStorage,
 * including the id and the session marker, so the copy would otherwise rotate
 * the original's refresh token and revoke it. The copy cannot hold the same lock
 * name, so it is detected here, drops the inherited context and starts fresh.
 *
 * Shortcut: no Web Locks implementation means no duplicate detection, and a
 * duplicated tab is then treated as the original.
 */
export async function ensureTabContext(): Promise<void> {
  const id = window.sessionStorage.getItem(TAB_ID_KEY);
  if (!id) return;

  if (!(await isTabIdFree(id))) {
    clearTabContext();
    return;
  }

  holdTabId(id);
}

async function isTabIdFree(id: string): Promise<boolean> {
  if (!navigator.locks) return true;

  const { held } = await navigator.locks.query();

  return !held?.some((lock) => lock.name === id);
}

function holdTabId(id: string): void {
  if (!navigator.locks) return;

  // Never settles, so the lock is held until the page unloads.
  void navigator.locks.request(id, { ifAvailable: true }, () => new Promise(() => {}));
}
