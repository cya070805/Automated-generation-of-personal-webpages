"use client";

import { useEffect, useRef, useState } from "react";
import { getBase } from "@/lib/templates/bases";
import type { BaseTokens, RecipeMap } from "@/lib/templates/types";
import { applyBlockText, type SiteData } from "@/lib/site-data";
import type { SiteLayout, SiteTweaks } from "@/lib/site-config";
import { SiteView } from "./site-view";

export type PreviewPayload = {
  base: BaseTokens;
  data: SiteData;
  recipeMap: RecipeMap | null;
  layout: SiteLayout | null;
  tweaks: SiteTweaks | null;
};

type PatchMessage = {
  type: "site:patch";
  patch: {
    baseId?: string;
    recipeMap?: RecipeMap;
    layout?: SiteLayout;
    tweaks?: SiteTweaks;
  };
};

/** 编辑器里正在打的这一段：只换文字，不整页重载 */
type TextMessage = {
  type: "site:text";
  blockId: string;
  text: string;
  fallback?: string;
};

function knowsBlock(data: SiteData, blockId: string): boolean {
  return (
    blockId === data.profileId ||
    blockId === data.skillId ||
    data.sections.some((section) => section.id === blockId)
  );
}

/**
 * 编辑器的右栏。
 * 页面只在第一次打开时从服务器渲染一次，之后编辑器改配置就用 postMessage 推过来，
 * 这里直接把状态换掉重渲 —— 不导航、不重载，滚动位置留在原处。
 *
 * 改字走 site:text：本地就地换掉那一段，一个来回都不用等；
 * 只有「这一块还不在这份数据里」（新建的空段）才回服务器重算一次。
 */
export function LivePreview({
  token,
  initial,
}: {
  token: string;
  initial: PreviewPayload;
}) {
  const [state, setState] = useState<PreviewPayload>(initial);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let alive = true;
    let pullTimer: number | null = null;

    async function pull() {
      const res = await fetch(`/api/preview/${token}`, { cache: "no-store" });
      if (!res.ok || !alive) return;
      const next = (await res.json()) as PreviewPayload;
      setState(next);
    }

    /** 数据里还没有这一块时，等打字停顿再回服务器重算，别每个键都问一次 */
    function schedulePull() {
      if (pullTimer) window.clearTimeout(pullTimer);
      pullTimer = window.setTimeout(() => void pull(), 240);
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const message = event.data as
        | PatchMessage
        | TextMessage
        | { type?: string }
        | null;
      if (!message || typeof message !== "object") return;

      if (message.type === "site:reload") {
        void pull();
        return;
      }

      if (message.type === "site:text") {
        const next = message as TextMessage;
        if (!knowsBlock(stateRef.current.data, next.blockId) && next.text.trim()) {
          schedulePull();
          return;
        }
        setState((prev) => ({
          ...prev,
          data: applyBlockText(prev.data, next),
        }));
        return;
      }

      if (message.type !== "site:patch") return;
      const patch = (message as PatchMessage).patch ?? {};

      setState((prev) => ({
        ...prev,
        ...(patch.baseId ? { base: getBase(patch.baseId) } : {}),
        ...(patch.recipeMap ? { recipeMap: patch.recipeMap } : {}),
        ...(patch.layout ? { layout: patch.layout } : {}),
        ...(patch.tweaks ? { tweaks: patch.tweaks } : {}),
      }));
    }

    window.addEventListener("message", onMessage);
    return () => {
      alive = false;
      if (pullTimer) window.clearTimeout(pullTimer);
      window.removeEventListener("message", onMessage);
    };
  }, [token]);

  return (
    <SiteView
      base={state.base}
      data={state.data}
      recipeMap={state.recipeMap}
      layout={state.layout}
      tweaks={state.tweaks}
    />
  );
}
