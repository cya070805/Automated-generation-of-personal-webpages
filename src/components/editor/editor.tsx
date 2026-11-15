"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { READY_BASES, getBase } from "@/lib/templates/bases";
import { recipesForSlot, resolveRecipeMap } from "@/lib/templates/recipes";
import type { BaseId, RecipeMap, SlotId } from "@/lib/templates/types";
import {
  contrastRatio,
  normalizeOrder,
  type SiteLayout,
  type SiteTweaks,
} from "@/lib/site-config";
import { useSettings } from "@/store/settings-store";
import { cn } from "@/lib/utils";

function aiHeaders(): HeadersInit {
  const state = useSettings.getState();
  return {
    "content-type": "application/json",
    "x-llm-key": state.apiKey,
    "x-llm-provider": state.providerId,
    "x-llm-base": state.baseUrl,
    "x-llm-model": state.model,
    "x-llm-mode": state.mode,
  };
}

/** ——————————————— 类型 ——————————————— */

export interface EditorBlock {
  id: string;
  type: string;
  label: string;
  title: string;
  org: string;
  period: string;
  text: string;
  /** 没改过字时的原文：清空输入框会退回这一段 */
  fallback?: string;
}

export interface EditorShare {
  slug: string;
  noindex: boolean;
  hasPassword: boolean;
  publishedAt: string;
}

export interface EditorInitial {
  baseId: string;
  recipeMap: RecipeMap;
  layout: SiteLayout;
  tweaks: SiteTweaks;
}

const SLOT_LABELS: Record<SlotId, string> = {
  hero: "首屏",
  about: "关于",
  experience: "经历",
  projects: "项目",
  education: "教育",
  skills: "技能",
  contact: "联系",
};

const ACCENTS = [
  "#1d4ed8",
  "#b42318",
  "#15803d",
  "#0f766e",
  "#7c3aed",
  "#be185d",
  "#b45309",
  "#0f172a",
];

/** 常用底色：前四个浅、后三个深，翻一下就是另一套气质 */
const BGS = [
  "#ffffff",
  "#fbfbf7",
  "#f7f2e6",
  "#eceef2",
  "#efece4",
  "#101114",
  "#0a1120",
];

const INKS = ["#14161a", "#3d3b33", "#5b6770", "#f5f6f8", "#efe9dd", "#0d1b2a"];

type Tab = "content" | "base" | "slots" | "tune" | "share";

/** ——————————————— 小组件 ——————————————— */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[12px] tracking-[0.12em] text-faint">{children}</h3>;
}

function BaseSwatch({ baseId }: { baseId: string }) {
  const base = getBase(baseId);
  const { bg, fg, muted, line, accent } = base.swatch;
  const bar = (w: string, h: number, color: string, opacity = 1) => (
    <div style={{ width: w, height: h, background: color, opacity }} />
  );

  // 缩略图直接画这套基底的页型，别六套都画成同一个抽象色块
  return (
    <div
      className="relative h-[58px] w-full overflow-hidden rounded-md border"
      style={{ background: bg, borderColor: line }}
      aria-hidden
    >
      {baseId === "paper" && (
        <div className="flex h-full flex-col justify-between p-2">
          <div className="flex items-center justify-between">
            {bar("18px", 2, muted, 0.7)}
            {bar("14px", 2, muted, 0.5)}
          </div>
          <div className="relative">
            {bar("62%", 11, fg)}
            <div className="mt-1 h-px w-full" style={{ background: fg, opacity: 0.85 }} />
          </div>
          <div className="flex gap-1.5">
            {bar("22%", 2, muted, 0.45)}
            {bar("16%", 2, muted, 0.45)}
            {bar("26%", 2, muted, 0.45)}
          </div>
          <span
            className="absolute right-2 top-2 grid size-[15px] place-items-center rounded-full"
            style={{ border: `1px solid ${accent}` }}
          >
            <span className="size-[5px] rounded-full" style={{ background: accent, opacity: 0.5 }} />
          </span>
        </div>
      )}

      {baseId === "terminal" && (
        <div
          className="absolute inset-[3px] overflow-hidden rounded-[3px] border"
          style={{ background: base.color.surface, borderColor: line }}
        >
          <div className="flex items-center gap-[3px] border-b px-1.5 py-1" style={{ borderColor: line }}>
            <span className="size-[3px] rounded-full" style={{ background: muted }} />
            <span className="size-[3px] rounded-full" style={{ background: muted }} />
            <span className="size-[3px] rounded-full" style={{ background: muted }} />
            <span className="ml-auto h-[2px] w-5" style={{ background: line }} />
          </div>
          <div className="space-y-1 px-1.5 pt-1.5">
            <div className="flex items-center gap-1">
              <span style={{ color: accent, fontSize: 6, lineHeight: 1 }}>$</span>
              {bar("60%", 3, fg)}
            </div>
            <div className="flex items-center gap-1">
              {bar("50%", 2, muted, 0.6)}
            </div>
            {bar("70%", 2, accent, 0.85)}
          </div>
        </div>
      )}

      {baseId === "editorial" && (
        <div className="flex h-full flex-col justify-center gap-1 px-2">
          <div className="flex items-center justify-between">
            {bar("16px", 2, muted, 0.7)}
            {bar("12px", 2, muted, 0.45)}
          </div>
          <div className="h-px w-full" style={{ background: fg, opacity: 0.9 }} />
          {bar("70%", 12, fg)}
          <div className="h-px w-full" style={{ background: fg, opacity: 0.9 }} />
          <div className="flex items-end justify-between">
            {bar("34%", 2, muted, 0.5)}
            {bar("10px", 6, accent, 0.9)}
          </div>
        </div>
      )}

      {baseId === "gallery" && (
        <div className="flex h-full flex-col justify-between p-2">
          <div
            className="relative flex h-[38px] w-full items-end overflow-hidden p-1.5"
            style={{ background: fg }}
          >
            {bar("56%", 9, bg)}
            <span
              className="absolute right-1 top-1 h-[2px] w-4"
              style={{ background: bg, opacity: 0.45 }}
            />
          </div>
          {bar("100%", 1, line)}
          <div className="flex gap-1.5">
            {bar("18%", 2, muted, 0.45)}
            {bar("14%", 2, muted, 0.45)}
          </div>
        </div>
      )}

      {baseId === "studio" && (
        <div className="relative h-full overflow-hidden p-2">
          <span
            className="absolute -right-3 top-1 size-[38px] rounded-full"
            style={{
              background: `radial-gradient(circle at 35% 30%, ${accent}, ${accent}00 72%)`,
              filter: "blur(1px)",
            }}
          />
          <div className="relative flex h-full flex-col justify-center gap-1">
            {bar("19%", 2, muted, 0.6)}
            {bar("58%", 11, fg)}
            {bar("44%", 2, muted, 0.55)}
            <div className="mt-1.5 h-px w-full" style={{ background: line }} />
            <div className="flex gap-1.5">
              {bar("16%", 2, muted, 0.4)}
              {bar("20%", 2, muted, 0.4)}
            </div>
          </div>
        </div>
      )}

      {baseId === "bento" && (
        <div className="grid h-full grid-cols-4 grid-rows-2 gap-[3px] p-[5px]">
          <div
            className="col-span-2 row-span-2 flex flex-col justify-between rounded-[3px] p-1.5"
            style={{ background: base.color.surface, border: `1px solid ${line}` }}
          >
            {bar("80%", 8, fg)}
            {bar("50%", 2, muted, 0.5)}
          </div>
          <div
            className="col-span-2 rounded-[3px]"
            style={{ background: base.color.accentSoft, border: `1px solid ${line}` }}
          />
          <div
            className="col-span-1 rounded-[3px]"
            style={{ background: base.color.surface, border: `1px solid ${line}` }}
          />
          <div
            className="col-span-1 rounded-[3px]"
            style={{ background: base.color.surface, border: `1px solid ${line}` }}
          />
        </div>
      )}

      {baseId === "mono" && (
        <div className="flex h-full flex-col justify-between p-2">
          <div className="flex items-center justify-between">
            {bar("16px", 2, muted, 0.6)}
            {bar("10px", 2, muted, 0.35)}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-[2px]">
              {bar("13px", 7, fg)}
              {bar("13px", 7, fg)}
              {bar("13px", 7, fg)}
            </div>
            {bar("22%", 2, muted, 0.45)}
          </div>
          <div className="h-px w-full" style={{ background: line }} />
        </div>
      )}

      {baseId === "cinema" && (
        <div className="relative grid h-full place-items-center overflow-hidden">
          <span
            className="absolute size-[46px] rounded-full"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${accent}66, ${accent}00 70%)`,
              filter: "blur(3px)",
            }}
          />
          <div className="relative flex flex-col items-center gap-[3px]">
            {bar("12px", 2, muted, 0.6)}
            {bar("34px", 8, fg)}
            {bar("24px", 2, muted, 0.5)}
          </div>
        </div>
      )}

      {baseId === "reel" && (
        <div className="flex h-full gap-1.5 p-[5px]">
          <div
            className="flex flex-1 flex-col justify-between rounded-[3px] p-1.5"
            style={{ border: `1px solid ${line}`, background: base.color.surface }}
          >
            <div className="flex items-center justify-between">
              {bar("9px", 2, accent, 0.9)}
              {bar("7px", 2, muted, 0.5)}
            </div>
            {bar("72%", 8, fg)}
            {bar("56%", 2, muted, 0.5)}
          </div>
          <div className="flex w-[24%] flex-col justify-center gap-[3px]">
            <div className="flex justify-end">{bar("70%", 3, fg, 0.35)}</div>
            <div className="flex justify-end">{bar("100%", 3, accent, 0.95)}</div>
            <div className="flex justify-end">{bar("70%", 3, fg, 0.28)}</div>
          </div>
        </div>
      )}

      {baseId === "frame" && (
        <div className="grid h-full grid-cols-3 grid-rows-2 gap-[3px] p-[5px]">
          <div
            className="col-span-2 flex items-end p-1"
            style={{ border: `1px solid ${line}`, background: base.color.surface }}
          >
            {bar("70%", 7, fg)}
          </div>
          <div className="row-span-2 p-1" style={{ border: `1px solid ${accent}55` }}>
            {bar("100%", 2, muted, 0.45)}
          </div>
          <div
            className="col-span-2 flex items-center gap-1 p-1"
            style={{ border: `1px solid ${line}`, background: base.color.accentSoft }}
          >
            {bar("26%", 2, muted, 0.6)}
            {bar("20%", 2, muted, 0.4)}
          </div>
        </div>
      )}
    </div>
  );
}

/** 一行配色：色盘 + 一排预设 + 跟随基底。强调色 / 背景色 / 文字色共用 */
function ColorRow({
  label,
  hint,
  value,
  fallback,
  presets,
  onChange,
}: {
  label: string;
  hint?: string;
  value?: string;
  fallback: string;
  presets: string[];
  onChange: (color?: string) => void;
}) {
  const current = (value ?? fallback).toLowerCase();

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[12.5px] text-ink-2">{label}</span>
        <span className="text-[10.5px] uppercase tabular-nums text-faint">
          {value ?? "跟随基底"}
        </span>
      </div>
      {hint && <p className="mt-0.5 text-[10.5px] leading-[1.6] text-faint">{hint}</p>}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <label
          className="relative mr-1 size-7 shrink-0 cursor-pointer overflow-hidden rounded-full border border-line-strong"
          title="打开色盘"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: current }}
          />
          <input
            type="color"
            value={current}
            onChange={(event) => onChange(event.target.value)}
            aria-label={`选择${label}`}
            className="absolute -inset-2 size-[calc(100%+16px)] cursor-pointer border-0 p-0 opacity-0"
          />
        </label>
        {presets.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={`${label} ${color}`}
            className={cn(
              "size-6 rounded-full border",
              value === color ? "border-ink" : "border-transparent",
            )}
            style={{ background: color }}
          />
        ))}
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="ml-1 rounded-md border border-line-strong px-2 py-1 text-[11px] text-muted transition-colors hover:text-ink"
          >
            跟随基底
          </button>
        )}
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  left,
  right,
  onChange,
}: {
  label: string;
  value: number;
  left: string;
  right: string;
  onChange: (value: number) => void;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] text-ink">{label}</span>
        <span className="text-[11px] tabular-nums text-faint">{pct}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={pct}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
        className="ed-range mt-1.5"
        style={{ "--p": `${pct}%` } as React.CSSProperties}
      />
      <div className="flex justify-between text-[10.5px] leading-none text-faint">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

/** ——————————————— 主组件 ——————————————— */

export function Editor({
  token,
  pageId,
  blocks: initialBlocks,
  initial,
  share: initialShare,
  title,
}: {
  token: string;
  pageId: string;
  blocks: EditorBlock[];
  initial: EditorInitial;
  share: EditorShare | null;
  title: string;
}) {
  const [tab, setTab] = useState<Tab>("base");
  const [baseId, setBaseId] = useState(initial.baseId);
  const [recipeMap, setRecipeMap] = useState<RecipeMap>(initial.recipeMap ?? {});
  const [layout, setLayout] = useState<SiteLayout>({
    order: normalizeOrder(initial.layout),
    hidden: initial.layout.hidden ?? [],
  });
  const [tweaks, setTweaks] = useState<SiteTweaks>(initial.tweaks ?? {});
  const baseTokens = getBase(baseId);
  const baseAccent = baseTokens.color.accent;
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [share, setShare] = useState(initialShare);
  const [blocks, setBlocks] = useState(initialBlocks);

  const timer = useRef<number | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  /** 正在打的那一段：先推给右栏，停手再落库 */
  const previewTimer = useRef<number | null>(null);
  const saveTimer = useRef<number | null>(null);
  const pendingText = useRef<{ block: EditorBlock; text: string } | null>(null);

  /** 右栏不重载，改完直接把新配置推过去；滚动位置留在原处 */
  const postToPreview = useCallback((message: unknown) => {
    const target = frameRef.current?.contentWindow;
    if (!target) return;
    target.postMessage(message, window.location.origin);
  }, []);

  const save = useCallback(
    async (
      patch: {
        baseId?: string;
        recipeMap?: RecipeMap;
        layout?: SiteLayout;
        tweaks?: SiteTweaks;
      },
      immediate = false,
    ) => {
      setSaving(true);
      postToPreview({ type: "site:patch", patch });
      if (timer.current) window.clearTimeout(timer.current);

      const run = async () => {
        try {
          await fetch(`/api/pages/${pageId}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(patch),
            keepalive: true,
          });
          setSavedAt(Date.now());
        } finally {
          setSaving(false);
        }
      };

      if (immediate) await run();
      else timer.current = window.setTimeout(run, 320);
    },
    [pageId, postToPreview],
  );

  function pickBase(nextId: BaseId) {
    setBaseId(nextId);
    setRecipeMap({});
    save({ baseId: nextId, recipeMap: {} }, true);
  }

  function pickRecipe(slot: SlotId, recipeId: string) {
    const next = { ...recipeMap, [slot]: recipeId };
    setRecipeMap(next);
    save({ recipeMap: next }, true);
  }

  function moveSlot(index: number, delta: number) {
    const order = [...(layout.order ?? [])];
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    const next = { ...layout, order };
    setLayout(next);
    save({ layout: next }, true);
  }

  function toggleHidden(slot: SlotId) {
    const hidden = new Set(layout.hidden ?? []);
    if (hidden.has(slot)) hidden.delete(slot);
    else hidden.add(slot);
    const next = { ...layout, hidden: [...hidden] };
    setLayout(next);
    save({ layout: next }, true);
  }

  function updateTweak(patch: SiteTweaks) {
    const next = { ...tweaks, ...patch, v: 2 };
    setTweaks(next);
    save({ tweaks: next });
  }

  function resetTweaks() {
    setTweaks({});
    save({ tweaks: {} }, true);
  }

  async function assist(id: string, action: "polish" | "translate" | "tailor", jd?: string) {
    const res = await fetch("/api/ai/assist", {
      method: "POST",
      headers: aiHeaders(),
      body: JSON.stringify({ blockId: id, action, jd }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error?.message ?? "模型这边出了点问题");
    }
    setBlocks((prev) =>
      prev.map((block) => (block.id === id ? { ...block, text: data.text } : block)),
    );
    postToPreview({ type: "site:reload" });
    return data.text as string;
  }

  /** 右栏先动起来，别等服务器转一圈 */
  function pushText(block: EditorBlock, text: string) {
    postToPreview({
      type: "site:text",
      blockId: block.id,
      text,
      fallback: block.fallback ?? "",
    });
  }

  async function storeText(block: EditorBlock, text: string) {
    setSaving(true);
    try {
      // keepalive：存的时候正好关页/跳走，这一版也照样发得出去
      await fetch(`/api/blocks/${block.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ custom: text }),
        keepalive: true,
      });
      setSavedAt(Date.now());
      if (pendingText.current?.block.id === block.id && pendingText.current.text === text) {
        pendingText.current = null;
      }
    } finally {
      setSaving(false);
    }
  }

  /** 每敲一个字：左栏立刻更新，推右栏只等 40ms，落库等停手 700ms */
  function draftText(block: EditorBlock, text: string) {
    setBlocks((prev) =>
      prev.map((item) => (item.id === block.id ? { ...item, text } : item)),
    );
    pendingText.current = { block, text };
    if (previewTimer.current) window.clearTimeout(previewTimer.current);
    previewTimer.current = window.setTimeout(() => pushText(block, text), 40);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(
      () => void storeText(block, text),
      700,
    );
  }

  /** 失焦 / 切页签：把还排着队的推送和保存立刻做掉，一个字都不丢 */
  function commitText(block: EditorBlock, text: string) {
    if (previewTimer.current) {
      window.clearTimeout(previewTimer.current);
      previewTimer.current = null;
    }
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    pendingText.current = { block, text };
    pushText(block, text);
    void storeText(block, text);
  }

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      if (previewTimer.current) window.clearTimeout(previewTimer.current);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  /** 关页面 / 刷新时还有没落库的一段，就直接把它发出去 */
  useEffect(() => {
    function flush() {
      const next = pendingText.current;
      if (!next) return;
      pendingText.current = null;
      void fetch(`/api/blocks/${next.block.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ custom: next.text }),
        keepalive: true,
      });
    }

    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, []);

  const effectiveMap = useMemo(
    () => resolveRecipeMap(getBase(baseId), recipeMap),
    [baseId, recipeMap],
  );

  const order = normalizeOrder(layout);

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line px-5">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[13px] font-medium tracking-tight text-ink">
            履道
          </Link>
          <span className="text-[12px] text-faint">{title}</span>
        </div>

        <div className="flex items-center gap-3 text-[12px] text-faint">
          {saving ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="size-3 animate-spin" />
              保存中
            </span>
          ) : savedAt ? (
            <span>已保存</span>
          ) : null}
          <Link
            href={`/preview/${token}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line-strong px-3 text-[12.5px] text-ink-2 transition-colors hover:bg-subtle"
          >
            预览
            <ArrowUp className="size-3 rotate-45" />
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* 左栏 */}
        <aside className="flex w-[400px] shrink-0 flex-col border-r border-line">
          <nav className="flex gap-1 border-b border-line px-3 py-2">
            {(
              [
                ["content", "内容"],
                ["base", "基底"],
                ["slots", "模块"],
                ["tune", "微调"],
                ["share", "发布"],
              ] as [Tab, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[12.5px] transition-colors",
                  tab === key
                    ? "bg-ink text-white"
                    : "text-ink-2 hover:bg-subtle",
                )}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
            {tab === "content" && (
              <ContentPanel
                blocks={blocks}
                onDraft={draftText}
                onCommit={commitText}
                onAssist={assist}
              />
            )}

            {tab === "base" && (
              <div className="space-y-4">
                <SectionTitle>选基底</SectionTitle>
                <p className="text-[12px] leading-[1.7] text-muted">
                  {"换基底换的是整页的骨架：字体、色板、疏密，连首屏的形、章节标题的位置、卡片怎么做都换掉。内容和顺序保留。"}
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {READY_BASES.map((base) => {
                    const selected = base.id === baseId;
                    return (
                      <button
                        key={base.id}
                        type="button"
                        onClick={() => pickBase(base.id)}
                        aria-pressed={selected}
                        className={cn(
                          "rounded-xl border p-2 text-left transition-colors",
                          selected
                            ? "border-ink/35 bg-subtle ring-1 ring-ink/10"
                            : "border-line hover:border-line-strong",
                        )}
                      >
                        <BaseSwatch baseId={base.id} />
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[12.5px] font-medium text-ink">
                            {base.name}
                          </span>
                          {selected && <Check className="size-3 text-ink" />}
                        </div>
                        <p className="mt-0.5 text-[11.5px] leading-[1.5] text-muted">
                          {base.tagline}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "slots" && (
              <div className="space-y-4">
                <SectionTitle>模块与讲法</SectionTitle>
                <p className="text-[12px] leading-[1.7] text-muted">
                  {"每一屏都能换一种讲法，换的是结构，不是颜色。画布不破版。"}
                </p>

                <ul className="space-y-2">
                  {order.map((slot, index) => {
                    const hidden = (layout.hidden ?? []).includes(slot);
                    const options = recipesForSlot(slot, baseId as BaseId);
                    const current = effectiveMap[slot];

                    return (
                      <li
                        key={slot}
                        className={cn(
                          "rounded-lg border p-2.5",
                          hidden
                            ? "border-line bg-subtle/60 opacity-60"
                            : "border-line",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[12.5px] font-medium text-ink">
                            {SLOT_LABELS[slot]}
                            <span className="ml-1.5 font-normal text-faint">
                              {options.length} 种讲法
                            </span>
                          </span>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => moveSlot(index, -1)}
                              disabled={index === 0}
                              className="rounded p-1 text-faint hover:bg-subtle hover:text-ink disabled:opacity-30"
                              aria-label="上移"
                            >
                              <ArrowUp className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSlot(index, 1)}
                              disabled={index === order.length - 1}
                              className="rounded p-1 text-faint hover:bg-subtle hover:text-ink disabled:opacity-30"
                              aria-label="下移"
                            >
                              <ArrowDown className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleHidden(slot)}
                              className="rounded p-1 text-faint hover:bg-subtle hover:text-ink"
                              aria-label={hidden ? "显示" : "隐藏"}
                            >
                              {hidden ? (
                                <EyeOff className="size-3.5" />
                              ) : (
                                <Eye className="size-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {options.length > 1 ? (
                          <select
                            value={current ?? ""}
                            onChange={(event) =>
                              pickRecipe(slot, event.target.value)
                            }
                            disabled={hidden}
                            className="mt-2 w-full rounded-md border border-line-strong bg-bg px-2 py-1.5 text-[12px] text-ink-2 disabled:opacity-50"
                          >
                            {options.map((recipe) => (
                              <option key={recipe.id} value={recipe.id}>
                                {recipe.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="mt-2 rounded-md border border-dashed border-line-strong px-2 py-1.5 text-[12px] text-muted">
                            当前：{options[0]?.name ?? "默认讲法"}
                            <span className="text-faint">
                              {"　换基底可解锁更多讲法"}
                            </span>
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {tab === "tune" && (
              <div className="space-y-6">
                <div>
                  <SectionTitle>微调</SectionTitle>
                  <p className="mt-2 text-[12px] leading-[1.7] text-muted">
                    {"九根都改令牌，所有组件同步变，内容一个字不丢。中线是基底原样，往两边连续变化，不是三个挡位。"}
                  </p>
                </div>

                <div className="space-y-5">
                  <Slider
                    label="动效强度"
                    value={tweaks.motion ?? 50}
                    left="不动"
                    right="明显"
                    onChange={(value) => updateTweak({ motion: value })}
                  />
                  <Slider
                    label="字号"
                    value={tweaks.scale ?? 50}
                    left="小"
                    right="大"
                    onChange={(value) => updateTweak({ scale: value })}
                  />
                  <Slider
                    label="疏密"
                    value={tweaks.density ?? 50}
                    left="宽松"
                    right="紧凑"
                    onChange={(value) => updateTweak({ density: value })}
                  />
                  <Slider
                    label="页宽"
                    value={tweaks.width ?? 50}
                    left="窄"
                    right="宽"
                    onChange={(value) => updateTweak({ width: value })}
                  />
                  <Slider
                    label="行宽"
                    value={tweaks.measure ?? 50}
                    left="一行短"
                    right="一行长"
                    onChange={(value) => updateTweak({ measure: value })}
                  />
                  <Slider
                    label="圆角"
                    value={tweaks.radius ?? 50}
                    left="直角"
                    right="圆润"
                    onChange={(value) => updateTweak({ radius: value })}
                  />
                  <Slider
                    label="标题字重"
                    value={tweaks.weight ?? 50}
                    left="细"
                    right="粗"
                    onChange={(value) => updateTweak({ weight: value })}
                  />
                </div>

                <div>
                  <span className="text-[13px] text-ink">底纹</span>
                  <div className="mt-2 grid grid-cols-3 gap-1 rounded-md bg-subtle p-1">
                    {["跟随基底", "网格", "点阵"].map((label, index) => {
                      const active = (tweaks.pattern ?? 0) === index;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => updateTweak({ pattern: index })}
                          className={cn(
                            "rounded px-2 py-1.5 text-[12px] transition-colors",
                            active
                              ? "bg-bg text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                              : "text-muted hover:text-ink-2",
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[13px] text-ink">配色</span>
                    <button
                      type="button"
                      onClick={resetTweaks}
                      className="inline-flex items-center gap-1 rounded-md border border-line-strong px-2 py-1 text-[11px] text-muted hover:text-ink"
                    >
                      <RotateCcw className="size-3" />
                      全部复原
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] leading-[1.6] text-faint">
                    三项都是「预设 + 色盘」：点色盘随便挑，点色块一键换，留空就跟随基底。
                  </p>

                  <div className="mt-3 space-y-4">
                    <ColorRow
                      label="强调色"
                      value={tweaks.accent}
                      fallback={baseAccent}
                      presets={ACCENTS}
                      hint="挑到很浅的颜色时，压在强调色上的字会自动翻成深色。"
                      onChange={(color) => updateTweak({ accent: color })}
                    />
                    <ColorRow
                      label="背景色"
                      value={tweaks.bg}
                      fallback={baseTokens.color.bg}
                      presets={BGS}
                      hint="换底色时，卡片面、分隔线、次级文字一起重推；没单独指定字色，就按明暗自动配深字或浅字。"
                      onChange={(color) => {
                        // 换底色后原来挑的字如果撞色了（深底配深字），就把字色放开跟随明暗
                        const nextBg = color ?? baseTokens.color.bg;
                        const keepInk =
                          !tweaks.ink || contrastRatio(tweaks.ink, nextBg) >= 2.4;
                        updateTweak({ bg: color, ink: keepInk ? tweaks.ink : undefined });
                      }}
                    />
                    <ColorRow
                      label="文字色"
                      value={tweaks.ink}
                      fallback={baseTokens.color.ink}
                      presets={INKS}
                      hint="只换字不换底：正文和次级说明一起走，强调色不动。"
                      onChange={(color) => updateTweak({ ink: color })}
                    />
                  </div>
                </div>
              </div>
            )}

            {tab === "share" && (
              <SharePanel
                pageId={pageId}
                share={share}
                onChange={setShare}
                token={token}
              />
            )}
          </div>
        </aside>

        {/* 右栏：真页面 */}
        <div className="min-w-0 flex-1 bg-subtle">
          <iframe
            ref={frameRef}
            src={`/preview/${token}?bare=1`}
            title="主页预览"
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}

/** ——————————————— 内容 ——————————————— */

function ContentPanel({
  blocks,
  onDraft,
  onCommit,
  onAssist,
}: {
  blocks: EditorBlock[];
  onDraft: (block: EditorBlock, text: string) => void;
  onCommit: (block: EditorBlock, text: string) => void;
  onAssist: (
    id: string,
    action: "polish" | "translate" | "tailor",
    jd?: string,
  ) => Promise<string>;
}) {
  const [jd, setJd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function tailorAll() {
    setBusy(true);
    setError(null);
    try {
      const targets = blocks.filter(
        (block) => block.type === "experience" || block.type === "project",
      );
      for (const block of targets) {
        await onAssist(block.id, "tailor", jd);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "定制失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <SectionTitle>逐段改文字</SectionTitle>
      <p className="text-[12px] leading-[1.7] text-muted">
        {"边打右边边变，停手就自动存下；切到别的页签也不会丢。改的是这一段的定稿，原文和两版草稿都还在。"}
      </p>

      <div className="rounded-lg border border-line p-3">
        <p className="text-[12px] text-ink">按岗位 JD 定制</p>
        <textarea
          value={jd}
          onChange={(event) => setJd(event.target.value)}
          rows={3}
          placeholder="把目标岗位的 JD 贴进来，它会按 JD 重排经历用词，数字和时间不动。"
          className="mt-2 w-full resize-y rounded-md border border-line-strong px-2 py-1.5 text-[12px] leading-[1.7] focus:border-accent/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={tailorAll}
          disabled={busy || jd.trim().length < 10}
          className="mt-2 inline-flex h-8 w-full items-center justify-center gap-2 rounded-md bg-ink text-[12px] text-white disabled:opacity-40"
        >
          {busy ? <Loader2 className="size-3 animate-spin" /> : null}
          定制经历与项目
        </button>
        {error && <p className="mt-2 text-[11.5px] text-danger">{error}</p>}
      </div>

      <ul className="space-y-3">
        {blocks.map((block) => (
          <BlockCard
            key={block.id}
            block={block}
            onDraft={onDraft}
            onCommit={onCommit}
            onAssist={onAssist}
          />
        ))}
      </ul>
    </div>
  );
}

function BlockCard({
  block,
  onDraft,
  onCommit,
  onAssist,
}: {
  block: EditorBlock;
  onDraft: (block: EditorBlock, text: string) => void;
  onCommit: (block: EditorBlock, text: string) => void;
  onAssist: (
    id: string,
    action: "polish" | "translate",
    jd?: string,
  ) => Promise<string>;
}) {
  const [value, setValue] = useState(block.text);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 失焦、或者切页签把这块卸载掉，都要把没存的字交出去
  const latest = useRef({ value, dirty, block });
  latest.current = { value, dirty, block };

  useEffect(() => {
    return () => {
      if (latest.current.dirty) {
        onCommit(latest.current.block, latest.current.value);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(action: "polish" | "translate") {
    setBusy(action);
    setError(null);
    try {
      const text = await onAssist(block.id, action);
      setValue(text);
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "模型这边出了点问题");
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    setValue(block.text);
  }, [block.text]);

  return (
    <li className="rounded-lg border border-line p-3">
      <div className="flex items-baseline gap-2">
        <span className="text-[11.5px] text-faint">{block.label}</span>
        {block.title && (
          <span className="text-[12.5px] text-ink">{block.title}</span>
        )}
        {block.period && (
          <span className="text-[11.5px] text-faint">{block.period}</span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          setDirty(true);
          onDraft(block, next);
        }}
        onBlur={() => {
          if (dirty) onCommit(block, value);
          setDirty(false);
        }}
        rows={Math.min(6, Math.max(2, Math.ceil(value.length / 34)))}
        className="mt-2 w-full resize-y rounded-md border border-transparent bg-subtle/60 px-2 py-1.5 text-[12.5px] leading-[1.75] text-ink-2 focus:border-line-strong focus:bg-bg focus:outline-none"
      />

      <div className="mt-1.5 flex items-center gap-3 text-[11.5px] text-faint">
        <button
          type="button"
          onClick={() => run("polish")}
          disabled={busy !== null}
          className="hover:text-ink disabled:opacity-40"
        >
          {busy === "polish" ? "润色中…" : "润色"}
        </button>
        <button
          type="button"
          onClick={() => run("translate")}
          disabled={busy !== null}
          className="hover:text-ink disabled:opacity-40"
        >
          {busy === "translate" ? "翻译中…" : "译成英文"}
        </button>
        {error && <span className="text-danger">{error}</span>}
      </div>
    </li>
  );
}

/** ——————————————— 发布 ——————————————— */

function SharePanel({
  pageId,
  share,
  onChange,
  token,
}: {
  pageId: string;
  share: EditorShare | null;
  onChange: (share: EditorShare | null) => void;
  token: string;
}) {
  const [password, setPassword] = useState("");
  const [noindex, setNoindex] = useState(share?.noindex ?? true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = share ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${share.slug}` : "";

  async function publish(touchPassword = false) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/pages/${pageId}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(touchPassword ? { password: password.trim() } : {}),
          noindex,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "发布失败");
      onChange(data.share);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "发布失败");
    } finally {
      setBusy(false);
    }
  }

  async function unpublish() {
    setBusy(true);
    await fetch(`/api/pages/${pageId}/publish`, { method: "DELETE" });
    onChange(null);
    setBusy(false);
  }

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-5">
      <SectionTitle>发布到平台</SectionTitle>

      {share ? (
        <>
          <div className="rounded-lg border border-line p-3">
            <p className="text-[11.5px] text-faint">分享链接</p>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded bg-subtle px-2 py-1.5 text-[11.5px] text-ink-2">
                /p/{share.slug}
              </code>
              <button
                type="button"
                onClick={copy}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-line-strong text-ink-2 hover:bg-subtle"
                aria-label="复制"
              >
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              </button>
            </div>
            <a
              href={`/p/${share.slug}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-[12px] text-accent underline-offset-4 hover:underline"
            >
              打开看看
            </a>
            {share.hasPassword && (
              <p className="mt-2 text-[11.5px] text-muted">{"已设访问密码"}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => publish(false)}
            disabled={busy}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-ink text-[13px] text-white disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
            更新已发布的内容
          </button>
        </>
      ) : (
        <p className="text-[12px] leading-[1.7] text-muted">
          {"发布后拿到一条 /p/ 开头的链接，改内容即时生效。不发布也能导出 PDF 和部署包。"}
        </p>
      )}

      <div className="space-y-3 rounded-lg border border-line p-3">
        <div>
          <label className="text-[12px] text-ink" htmlFor="share-password">
            访问密码（可选）
          </label>
          <input
            id="share-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={share?.hasPassword ? "已设置，填写则更换" : "留空表示不设密码"}
            className="mt-1.5 h-8 w-full rounded-md border border-line-strong px-2 text-[12px] focus:border-accent/60 focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-2 text-[12px] text-ink-2">
          <input
            type="checkbox"
            checked={noindex}
            onChange={(event) => setNoindex(event.target.checked)}
            className="size-3.5 accent-[#111214]"
          />
          不被搜索引擎收录
        </label>

        <button
          type="button"
          onClick={() => publish(true)}
          disabled={busy}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-line-strong text-[12.5px] text-ink-2 hover:bg-subtle disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {share ? "保存设置" : "发布"}
        </button>
      </div>

      {error && <p className="text-[12px] text-danger">{error}</p>}

      <div className="space-y-2 border-t border-line pt-4">
        <SectionTitle>导走</SectionTitle>
        <a
          href={`/api/export/${token}/pdf`}
          className="flex h-9 items-center justify-center rounded-lg border border-line-strong text-[12.5px] text-ink-2 hover:bg-subtle"
        >
          下载简历 PDF
        </a>
        <a
          href={`/api/export/${token}/package`}
          className="flex h-9 items-center justify-center rounded-lg border border-line-strong text-[12.5px] text-ink-2 hover:bg-subtle"
        >
          下载整站部署包（zip）
        </a>
      </div>

      {share && (
        <button
          type="button"
          onClick={unpublish}
          disabled={busy}
          className="text-[12px] text-muted underline-offset-4 hover:text-danger hover:underline"
        >
          取消发布
        </button>
      )}
    </div>
  );
}
