import { useSyncExternalStore } from "react";

// Nothing changes after mount, so there is nothing to subscribe to.
const subscribe = () => () => {};
const getHydrated = () => true;
const getServerHydrated = () => false;

/**
 * `false` while the server renders and during the client's hydration render,
 * `true` from the next render on.
 *
 * Some of this app's state is only knowable in the browser: the session lives in
 * an httpOnly cookie plus a per-tab marker, so the server always renders the
 * undecided version. react-redux hands React the *live* store as the hydration
 * snapshot, so a status that settles before a consumer hydrates makes that
 * consumer render a different tree than the server sent. Gating on this keeps the
 * two first renders identical; the real value appears immediately afterwards.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getHydrated, getServerHydrated);
}
