"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/lib/store";

/** Rehydrate zustand persist on the client; never leave the UI stuck on SSR defaults. */
export function StoreHydration({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useEditorStore.persist.rehydrate().finally(() => {
      // Persist middleware onRehydrateStorage also seeds + sets hydrated; keep a fallback.
      const state = useEditorStore.getState();
      state.seedBrandsIfNeeded();
      if (!state.hydrated) state.setHydrated(true);
    });
  }, []);

  return children;
}
