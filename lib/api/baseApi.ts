import type { UnknownAction } from "@reduxjs/toolkit";
import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

import { credentialsReceived, signedOut } from "@/lib/features/auth/authSlice";
import {
  clearTabContext,
  ensureTabContext,
  getTabContext,
  setTabSession,
  tabHasSession,
  tabUserId,
} from "@/lib/features/auth/tab-context";
import type { SessionResponse } from "@/lib/types";

/** Structural view of the store, so this module need not import the store itself. */
type AuthAwareState = { auth: { accessToken: string | null } };
type DispatchAction = (action: UnknownAction) => unknown;

/**
 * Requests are same-origin: `next.config.ts` proxies `/api/*` to the EduCore
 * origin. That is what makes the backend's httpOnly refresh cookie (scope
 * `/api/auth`, SameSite=Lax) usable.
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as AuthAwareState).auth.accessToken;

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    const tabContext = getTabContext();
    if (tabContext) {
      headers.set("x-tab-context", tabContext);
    }

    return headers;
  },
});

const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/refresh",
  "/auth/logout",
  "/auth/register",
];

/**
 * Single-flight token rotation per tab, shared by the page-load bootstrap and any 401
 * retry, so a tab has at most one refresh in flight at a time.
 * Each tab owns its own server tabContext and cookie refresh_<tabContext>, so tabs
 * refresh independently without cross-tab locking.
 */
let refreshInFlight: Promise<string | null> | null = null;
let restoreInFlight: Promise<string | null> | null = null;

export function refreshSession(dispatch: DispatchAction): Promise<string | null> {
  // A tab without an established session does not attempt to refresh
  if (!tabHasSession()) {
    dispatch(signedOut());
    return Promise.resolve(null);
  }

  if (!refreshInFlight) {
    refreshInFlight = refresh(dispatch).finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight.then((token) => {
    if (!token) dispatch(signedOut());
    return token;
  });
}

/**
 * Restores this tab's session after a page load. Ensures Web Lock ownership
 * and rotates the refresh cookie once. Deduplicates concurrent callers so
 * page-load bootstrap and any parallel API queries share the single refresh request.
 */
export function restoreSession(
  dispatch: DispatchAction,
  getState: () => AuthAwareState
): Promise<string | null> {
  const { accessToken } = getState().auth;

  if (accessToken) {
    return Promise.resolve(accessToken);
  }

  if (!tabHasSession()) {
    dispatch(signedOut());
    return Promise.resolve(null);
  }

  if (!restoreInFlight) {
    restoreInFlight = (async () => {
      const isOwner = await ensureTabContext();
      if (!isOwner) {
        dispatch(signedOut());
        return null;
      }
      return refreshSession(dispatch);
    })().finally(() => {
      restoreInFlight = null;
    });
  }

  return restoreInFlight;
}

/**
 * Rotates the refresh cookie for this tab using its tabContext.
 * A 401 refusal means this tab's session is expired/revoked, so its context is cleared;
 * a network failure preserves context so a later retry can still succeed.
 */
async function refresh(dispatch: DispatchAction): Promise<string | null> {
  const tabContext = getTabContext();
  if (!tabContext) {
    clearTabContext();
    return null;
  }

  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: {
        "x-tab-context": tabContext,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearTabContext();
      }
      return null;
    }

    const session = (await response.json()) as SessionResponse;

    const expected = tabUserId();
    if (expected && session.user.id !== expected) {
      clearTabContext();
      return null;
    }

    if (session.tabContext) {
      await setTabSession(session.tabContext, session.user.id);
    }

    dispatch(
      credentialsReceived({
        user: session.user,
        accessToken: session.accessToken,
      })
    );

    return session.accessToken;
  } catch {
    return null;
  }
}

/**
 * Adds the bearer token, and on a 401 restores the session once and replays the
 * request. When no token can be recovered the API cache is dropped, so protected
 * data does not survive a sign-out.
 */
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const url = typeof args === "string" ? args : args.url;
  const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => url.startsWith(path));

  // If this tab has an established session but the in-memory access token is missing
  // (e.g. initial page reload bootstrap) or a restore is currently in flight,
  // wait for session restoration before sending the request so we don't fire
  // an unauthenticated request that is guaranteed to 401.
  if (!isAuthEndpoint) {
    const currentState = api.getState() as AuthAwareState;
    if (!currentState.auth.accessToken && tabHasSession()) {
      await restoreSession(api.dispatch, () => api.getState() as AuthAwareState);
    }
  }

  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && !isAuthEndpoint) {
    // The token was rejected (expired in flight), so rotate once and replay.
    const token = await refreshSession(api.dispatch);

    if (token) {
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(baseApi.util.resetApiState());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Course", "AssignedCourse", "Semester", "Enrollment", "Department", "Student", "AuditLog"],
  endpoints: () => ({}),
});
