import { baseApi } from "@/lib/api/baseApi";
import { credentialsReceived, signedOut } from "@/lib/features/auth/authSlice";
import {
  clearTabContext,
  markTabSession,
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

          // This tab now owns a session; see lib/features/auth/tab-context.ts.
          markTabSession(data.user.id);

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
     * Public Student registration. No role is sent — the API owns the role — so
     * this cannot create an administrator, instructor or super admin.
     *
     * Unverified: `API_CONTRACT.md` documents no registration route, so the path
     * below is the one assumption in this flow and the single place to change it.
     * `POST /api/users` is not an option: it needs an admin token, a client-sent
     * role, and a `student` profile whose `studentCode` and `admissionDate` are
     * institution-issued, so the backend has to generate them for a public
     * signup.
     */
    register: build.mutation<RegisterResponse, RegisterInput>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),

    /**
     * The API revokes the session behind the refresh cookie, and the browser
     * shares that cookie across tabs, so this ends the session for the whole
     * browser. Only this tab's own state and context are cleared here.
     */
    logout: build.mutation<{ message: string }, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          // Clear even when the API call fails, so the UI never keeps a session
          // the user asked to end. The cookie is cleared server-side.
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
