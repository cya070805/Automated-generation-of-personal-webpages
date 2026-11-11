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
import { SLOT_ORDER, recipesForSlot, resolveRecipeMap } from "@/lib/templates/recipes";
import type { BaseId, RecipeMap, SlotId } from "@/lib/templates/types";
import type { SiteLayout, SiteTweaks } from "@/lib/site-config";
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
  skills: "技能",
  contact: "联系",
};

const ACCENTS = ["#1d4ed8", "#b42318", "#15803d", "#7c3aed", "#0f172a", "#b45309"];

type Tab = "content" | "base" | "slots" | "tune" | "share";

/** ——————————————— 小组件 ——————————————— */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[12px] tracking-[0.12em] text-faint">{children}</h3>;
}

function BaseSwatch({ baseId }: { baseId: string }) {
  const base = getBase(baseId);
  const { bg, fg, muted, line, accent } = base.swatch;
  return (
    <div
      className="relative h-[58px] w-full overflow-hidden rounded-md border"
      style={{ background: bg, borderColor: line }}
      aria-hidden
    >
      <div className="flex h-full flex-col justify-between p-2.5">
        <div
          className="h-[5px] w-[52%] rounded-sm"
          style={{ background: fg }}
        />
        <div className="space-y-1">
          <div className="h-px w-full" style={{ background: line }} />
          <div
            className="h-[2px] w-[62%] rounded-sm"
            style={{ background: muted, opacity: 0.5 }}
          />
        </div>
      </div>
      <div
        className="absolute right-2.5 top-2.5 size-1.5 rounded-full"
        style={{ background: accent }}
      />
    </div>
  );
}

function Slider({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: [string, string, string];
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] text-ink">{label}</span>
        <span className="text-[11.5px] text-faint">{hint[value] ?? ""}</span>
      </div>
      <input
        type="range"
        min={0}
        max={2}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-1 w-full appearance-none rounded-full bg-line accent-[#111214]"
        style={{
          background: `linear-gradient(to right, #111214 ${(value / 2) * 100}%, #e8e8e5 ${(value / 2) * 100}%)`,
        }}
      />
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
    order: initial.layout.order ?? [...SLOT_ORDER],
    hidden: initial.layout.hidden ?? [],
  });
  const [tweaks, setTweaks] = useState<SiteTweaks>(initial.tweaks ?? {});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [share, setShare] = useState(initialShare);
  const [blocks, setBlocks] = useState(initialBlocks);

  const timer = useRef<number | null>(null);

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
      if (timer.current) window.clearTimeout(timer.current);

      const run = async () => {
        try {
          await fetch(`/api/pages/${pageId}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(patch),
          });
          setSavedAt(Date.now());
          setPreviewKey((key) => key + 1);
        } finally {
          setSaving(false);
        }
      };

      if (immediate) await run();
      else timer.current = window.setTimeout(run, 320);
    },
    [pageId],
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
    const next = { ...tweaks, ...patch };
    setTweaks(next);
    save({ tweaks: next });
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
    setPreviewKey((key) => key + 1);
    return data.text as string;
  }

  async function saveBlock(id: string, text: string) {
    await fetch(`/api/blocks/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ custom: text }),
    });
    setBlocks((prev) =>
      prev.map((block) => (block.id === id ? { ...block, text } : block)),
    );
    setPreviewKey((key) => key + 1);
  }

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const effectiveMap = useMemo(
    () => resolveRecipeMap(getBase(baseId), recipeMap),
    [baseId, recipeMap],
  );

  const order = layout.order ?? [...SLOT_ORDER];

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
              <ContentPanel blocks={blocks} onSave={saveBlock} onAssist={assist} />
            )}

            {tab === "base" && (
              <div className="space-y-4">
                <SectionTitle>六套基底</SectionTitle>
                <p className="text-[12px] leading-[1.7] text-muted">
                  {"换基底只换令牌：字体、色板、圆角、疏密跟着变，内容和结构不动。"}
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
                              {recipe.motionCost === "none" ? "" : " · 动效"}
                            </option>
                          ))}
                        </select>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {tab === "tune" && (
              <div className="space-y-6">
                <div>
                  <SectionTitle>四个滑杆</SectionTitle>
                  <p className="mt-2 text-[12px] leading-[1.7] text-muted">
                    {"改的是令牌，所有组件同步变，内容一个字不丢。"}
                  </p>
                </div>

                <div className="space-y-5">
                  <Slider
                    label="动效强度"
                    hint={["克制", "标准", "活跃"]}
                    value={tweaks.motion ?? 1}
                    onChange={(value) => updateTweak({ motion: value })}
                  />
                  <Slider
                    label="密度"
                    hint={["宽松", "标准", "紧凑"]}
                    value={tweaks.density ?? 1}
                    onChange={(value) => updateTweak({ density: value })}
                  />
                  <Slider
                    label="圆角"
                    hint={["直角", "标准", "圆润"]}
                    value={tweaks.radius ?? 1}
                    onChange={(value) => updateTweak({ radius: value })}
                  />
                </div>

                <div>
                  <span className="text-[13px] text-ink">强调色</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ACCENTS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateTweak({ accent: color })}
                        className={cn(
                          "size-7 rounded-full border-2",
                          tweaks.accent === color
                            ? "border-ink"
                            : "border-transparent",
                        )}
                        style={{ background: color }}
                        aria-label={color}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...tweaks };
                        delete next.accent;
                        setTweaks(next);
                        save({ tweaks: next });
                      }}
                      className="inline-flex size-7 items-center justify-center rounded-full border border-line-strong text-faint hover:text-ink"
                      aria-label="恢复默认"
                    >
                      <RotateCcw className="size-3" />
                    </button>
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
            key={previewKey}
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
  onSave,
  onAssist,
}: {
  blocks: EditorBlock[];
  onSave: (id: string, text: string) => Promise<void>;
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
        {"改完点一下别处就存下了。改的是这一段的定稿，原文和两版草稿都还在。"}
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
            onSave={onSave}
            onAssist={onAssist}
          />
        ))}
      </ul>
    </div>
  );
}

function BlockCard({
  block,
  onSave,
  onAssist,
}: {
  block: EditorBlock;
  onSave: (id: string, text: string) => Promise<void>;
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

  async function run(action: "polish" | "translate") {
    setBusy(action);
    setError(null);
    try {
      const text = await onAssist(block.id, action);
      setValue(text);
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
          setValue(event.target.value);
          setDirty(true);
        }}
        onBlur={() => {
          if (dirty && value !== block.text) {
            void onSave(block.id, value);
          }
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

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/pages/${pageId}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: password || undefined, noindex }),
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
            onClick={publish}
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
          onClick={publish}
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
