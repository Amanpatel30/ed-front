"use client";

import { useEffect, useRef } from "react";

import { restoreSession } from "@/lib/api/baseApi";
import { ensureTabContext } from "@/lib/features/auth/tab-context";
import { useAppDispatch, useAppStore } from "@/lib/hooks";

/**
 * Restores this tab's session on load, if it has one.
 *
 * The refresh cookie is httpOnly, so JavaScript cannot inspect it, and it is
 * shared by every tab in the browser, so its presence says nothing about *this*
 * tab. `ensureTabContext` settles that first — it also rejects a context copied
 * into a duplicated tab — and `restoreSession` then makes the page's single
 * refresh, sharing it with any 401 that arrives meanwhile.
 *
 * Children render immediately rather than waiting on the round trip, so the
 * public site is not blocked by an auth check it does not need. Screens that
 * require a session handle the `initializing` status themselves. A tab with no
 * session asks the API nothing.
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const started = useRef(false);

  useEffect(() => {
    // React StrictMode re-runs effects in development, and the root Suspense
    // boundary can remount this subtree; `restoreSession` is single-flight either
    // way, so a repeat cannot rotate the refresh token twice.
    if (started.current) return;
    started.current = true;

    void ensureTabContext().then(() => restoreSession(dispatch, store.getState));
  }, [dispatch, store]);

  return <>{children}</>;
}
