import { baseApi } from "@/lib/api/baseApi";
import { credentialsReceived, signedOut } from "@/lib/features/auth/authSlice";
import {
  clearTabContext,
  getTabContext,
  setTabSession,
} from "@/lib/features/auth/tab-context";
import type { RegisterInput, RegisterResponse, SessionResponse } from "@/lib/types";

export interface LoginInput {
  email: string;
  password: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<SessionResponse, LoginInput>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          // Bind this tab to the server-generated tabContext and acquire its Web Lock
          await setTabSession(data.tabContext, data.user.id);

          dispatch(
            credentialsReceived({
              user: data.user,
              accessToken: data.accessToken,
            })
          );
          // Drop anything cached for a previously signed-in user.
          dispatch(baseApi.util.resetApiState());
        } catch {
          // Failure is reported through the mutation's own error state.
        }
      },
    }),

    /**
     * Public Student registration. Creates user account with role STUDENT.
     * No student profile or enrollments are created yet.
     */
    register: build.mutation<RegisterResponse, RegisterInput>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),

    /**
     * The API revokes the specific session behind the tab's refresh_<tabContext> cookie.
     * Passes the X-Tab-Context header so only this tab's session is revoked, leaving
     * any other concurrent tabs intact.
     */
    logout: build.mutation<{ message: string }, void>({
      query: () => {
        const tabContext = getTabContext();
        return {
          url: "/auth/logout",
          method: "POST",
          headers: tabContext ? { "X-Tab-Context": tabContext } : undefined,
        };
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          // Clear even when the API call fails, so the UI never keeps a session
          // the user asked to end.
          clearTabContext();
          dispatch(signedOut());
          dispatch(baseApi.util.resetApiState());
        }
      },
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation, useRegisterMutation } =
  authApi;
