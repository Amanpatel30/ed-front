import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { AuthUser } from "@/lib/types";

export type AuthStatus = "initializing" | "authenticated" | "unauthenticated";

interface AuthState {
  user: AuthUser | null;
  /**
   * Access token lives in memory only. It is never written to localStorage or
   * sessionStorage; page reloads are restored from the httpOnly refresh cookie
   * via `POST /api/auth/refresh`.
   */
  accessToken: string | null;
  status: AuthStatus;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  status: "initializing",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    credentialsReceived(
      state,
      action: PayloadAction<{ user: AuthUser; accessToken: string }>
    ) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.status = "authenticated";
    },
    signedOut(state) {
      state.user = null;
      state.accessToken = null;
      state.status = "unauthenticated";
    },
  },
});

export const { credentialsReceived, signedOut } = authSlice.actions;

export default authSlice.reducer;
