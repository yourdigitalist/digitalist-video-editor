"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/lib/store";
import { SAMPLE_BRANDS } from "@/lib/defaults";

/** Rehydrate zustand persist on the client; never leave the UI stuck on SSR defaults. */
export function StoreHydration({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useEditorStore.persist.rehydrate().finally(() => {
      const state = useEditorStore.getState();
      if (!state.brands.length) {
        useEditorStore.setState({ brands: SAMPLE_BRANDS });
      }
      useEditorStore.getState().setHydrated(true);
    });
  }, []);

  return children;
}
