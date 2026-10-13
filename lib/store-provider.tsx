"use client";

import { useState } from "react";
import { Provider } from "react-redux";

import { makeStore, type AppStore } from "@/lib/store";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Lazily created once per mount so the browser gets its own store instance.
  const [store] = useState<AppStore>(makeStore);

  return <Provider store={store}>{children}</Provider>;
}
