"use client";

import { useEffect, useRef } from "react";

import { restoreSession } from "@/lib/api/baseApi";
import { signedOut } from "@/lib/features/auth/authSlice";
import { ensureTabContext } from "@/lib/features/auth/tab-context";
import { useAppDispatch, useAppStore } from "@/lib/hooks";

/**
 * Restores this tab's session on load, if it has one.
 *
 * Each tab holds its own server-assigned tabContext. `ensureTabContext` settles
 * ownership first — it also rejects a context copied into a duplicated tab —
 * and `restoreSession` then makes the page's single refresh, sharing it with
 * any 401 that arrives meanwhile.
 *
 * If this tab has no valid session or was duplicated, it settles immediately to
 * unauthenticated so route guards can act without needless network requests.
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void ensureTabContext().then((isOwner) => {
      if (isOwner) {
        return restoreSession(dispatch, store.getState);
      } else {
        dispatch(signedOut());
      }
    });
  }, [dispatch, store]);

  return <>{children}</>;
}
