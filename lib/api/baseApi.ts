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
 * `/api/auth`, SameSite=Lax) usable, since the API sends no CORS headers.
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as AuthAwareState).auth.accessToken;

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

const AUTH_ENDPOINTS = ["/auth/login", "/auth/refresh", "/auth/logout"];

/**
 * Single-flight token rotation, shared by the page-load bootstrap and the 401
 * retry, so a tab has at most one refresh in flight.
 *
 * The backend revokes the presented refresh token on every rotation and clears
 * the cookie when a revoked one is presented, so two overlapping refreshes can
 * never both succeed. When they were issued from separate call sites, the loser
 * dispatched a sign-out that bounced the signed-in user through `/login` while
 * the winner restored the session.
 */
let refreshInFlight: Promise<string | null> | null = null;

export function refreshSession(dispatch: DispatchAction): Promise<string | null> {
  // A refresh cookie shared by the browser is not a reason for this tab to adopt
  // a session it never had.
  if (!tabHasSession()) {
    dispatch(signedOut());
    return Promise.resolve(null);
  }

  if (!refreshInFlight) {
    refreshInFlight = withRefreshLock(() => refresh(dispatch)).finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight.then((token) => {
    if (!token) dispatch(signedOut());
    return token;
  });
}

/**
 * Restores this tab's session after a page load. Keeps an access token that is
 * already in memory, so a repeated bootstrap — React StrictMode, or the root
 * Suspense boundary remounting — cannot rotate the token a second time.
 */
export function restoreSession(
  dispatch: DispatchAction,
  getState: () => AuthAwareState
): Promise<string | null> {
  const { accessToken } = getState().auth;

  return accessToken ? Promise.resolve(accessToken) : refreshSession(dispatch);
}

/**
 * Serializes rotations across tabs: the cookie is browser-wide, so two tabs
 * refreshing at the same moment would present the same token and revoke each
 * other's session.
 */
async function withRefreshLock(
  task: () => Promise<string | null>
): Promise<string | null> {
  if (!navigator.locks) return task();

  // LockGrantedCallback in the installed DOM types omits the promise branch the
  // Web Locks API supports, so this result is typed one promise too deep.
  const nested = navigator.locks.request<Promise<string | null>>(
    "educore:refresh",
    task
  );

  return await nested;
}

/**
 * Rotates the refresh cookie. A refusal means this tab is finished, so its
 * context goes too; a network failure says nothing about the session, so the
 * context is kept and a later reload can still restore it.
 */
async function refresh(dispatch: DispatchAction): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      // Only a 401 is the API refusing the credential. Anything else is an
      // outage, so the tab keeps its context and can restore once the API is back.
      if (response.status === 401) clearTabContext();
      return null;
    }

    const session = (await response.json()) as SessionResponse;

    // The cookie is browser-wide, so if another tab signed in as someone else
    // this rotation returns that account. Refuse it rather than adopt it.
    const expected = tabUserId();
    if (expected && session.user.id !== expected) {
      clearTabContext();
      return null;
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
  let result = await rawBaseQuery(args, api, extraOptions);

  const url = typeof args === "string" ? args : args.url;
  const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => url.startsWith(path));

  if (result.error?.status === 401 && !isAuthEndpoint) {
    // The token was rejected, so it must be rotated even though one is in memory.
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
  tagTypes: ["Course", "AssignedCourse", "Semester", "Enrollment", "Department"],
  endpoints: () => ({}),
});
