"use client";

import { useEffect } from "react";
import { useSettings } from "./settings-store";

/**
 * localStorage 的读取是异步的：等 persist 真正水合完再打标记，
 * 避免导航栏先闪一下「未接 Key」。
 */
export function useSettingsHydration() {
  const markHydrated = useSettings((state) => state.markHydrated);

  useEffect(() => {
    if (useSettings.persist.hasHydrated()) {
      markHydrated();
      return;
    }
    const unsubscribe = useSettings.persist.onFinishHydration(() => {
      markHydrated();
    });
    return unsubscribe;
  }, [markHydrated]);
}
