/**
 * Per-tab session context and tab isolation.
 *
 * The backend associates each session with a server-generated tabContext UUID.
 * The refresh token is stored in an httpOnly cookie named `refresh_<tabContext>`,
 * and requests to /api/auth/refresh and /api/auth/logout require the `X-Tab-Context` header.
 *
 * sessionStorage is scoped per tab, but browsers copy sessionStorage when a tab is duplicated.
 * Web Locks ensure only one active tab can hold a given tabContext lock.
 * If a duplicated tab detects the lock is already held, it drops the copied context.
 *
 * Every function is browser-only and must not run during render.
 */

const TAB_CONTEXT_KEY = "educore.tabContext";
const TAB_SESSION_KEY = "educore.tabSession";
const TAB_USER_KEY = "educore.tabUser";

let releaseLockFn: (() => void) | null = null;

function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

/** The server-provided tabContext for this tab. */
export function getTabContext(): string | null {
  if (!hasWindow()) return null;
  return window.sessionStorage.getItem(TAB_CONTEXT_KEY);
}

/** True when this tab itself signed in or restored a session. */
export function tabHasSession(): boolean {
  if (!hasWindow()) return false;
  return !!getTabContext() && window.sessionStorage.getItem(TAB_SESSION_KEY) === "1";
}

/**
 * The account this tab signed in as. Not a secret — an id, kept so a rotation
 * that returns a different account can be refused rather than adopted.
 */
export function tabUserId(): string | null {
  if (!hasWindow()) return null;
  return window.sessionStorage.getItem(TAB_USER_KEY);
}

/** Records which account and server tabContext this tab holds. */
export async function setTabSession(tabContext: string, userId: string): Promise<void> {
  if (!hasWindow()) return;
  window.sessionStorage.setItem(TAB_CONTEXT_KEY, tabContext);
  window.sessionStorage.setItem(TAB_USER_KEY, userId);
  window.sessionStorage.setItem(TAB_SESSION_KEY, "1");
  await holdTabLock(tabContext);
}

export const markTabSession = setTabSession;

export function clearTabContext(): void {
  if (!hasWindow()) return;
  if (releaseLockFn) {
    releaseLockFn();
    releaseLockFn = null;
  }
  window.sessionStorage.removeItem(TAB_CONTEXT_KEY);
  window.sessionStorage.removeItem(TAB_USER_KEY);
  window.sessionStorage.removeItem(TAB_SESSION_KEY);
}

function holdTabLock(context: string): Promise<boolean> {
  if (typeof window === "undefined" || !navigator?.locks) {
    return Promise.resolve(true);
  }

  // Release any previously held lock before acquiring a new one
  if (releaseLockFn) {
    releaseLockFn();
    releaseLockFn = null;
  }

  return new Promise<boolean>((resolve) => {
    navigator.locks.request(
      `educore:tab:${context}`,
      { ifAvailable: true },
      async (lock) => {
        if (!lock) {
          resolve(false);
          return;
        }

        resolve(true);

        await new Promise<void>((onRelease) => {
          releaseLockFn = onRelease;
        });
      }
    );
  });
}

/**
 * Verifies the stored tabContext is not already live in another tab.
 *
 * A tab created by "Duplicate tab" starts with a copy of sessionStorage,
 * including the tabContext and the session marker, so the copy would otherwise
 * rotate the original's refresh token and revoke it. The copy cannot acquire
 * the same Web Lock, so it is detected here, drops the inherited context and starts fresh.
 */
export async function ensureTabContext(): Promise<boolean> {
  if (!hasWindow()) return false;
  const context = getTabContext();
  if (!context) return false;

  const acquired = await holdTabLock(context);
  if (!acquired) {
    clearTabContext();
    return false;
  }

  return true;
}
