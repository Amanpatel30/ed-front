import { configureStore } from "@reduxjs/toolkit";

import { baseApi } from "@/lib/api/baseApi";
import authReducer from "@/lib/features/auth/authSlice";

/**
 * A store is created per browser session, not module-wide, so no state is
 * shared between unrelated requests.
 */
export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
