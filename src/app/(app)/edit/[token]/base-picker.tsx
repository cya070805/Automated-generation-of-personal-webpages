"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Loader2 } from "lucide-react";
import { READY_BASES, getBase } from "@/lib/templates/bases";
import type { BaseId, BaseTokens } from "@/lib/templates/types";
import { cn } from "@/lib/utils";

/** 缩略图：用基底自己的令牌画一个「像是那页纸」的小色块 */
function Swatch({ base }: { base: BaseTokens }) {
  const { bg, fg, muted, line, accent } = base.swatch;

  return (
    <div
      className="relative h-[78px] w-full overflow-hidden rounded-md border"
      style={{ background: bg, borderColor: line }}
      aria-hidden
    >
      <div className="flex h-full flex-col justify-between p-3">
        <div>
          <div
            className="h-[6px] w-[54%] rounded-sm"
            style={{ background: fg, borderRadius: base.shape.radius }}
          />
          <div
            className="mt-1.5 h-[3px] w-[30%] rounded-sm"
            style={{ background: muted, opacity: 0.75 }}
          />
        </div>
        <div className="space-y-1.5">
          <div className="h-px w-full" style={{ background: line }} />
          <div
            className="h-[3px] w-[68%] rounded-sm"
            style={{ background: muted, opacity: 0.45 }}
          />
        </div>
      </div>
      <div
        className="absolute right-3 top-3 size-1.5 rounded-full"
        style={{ background: accent }}
      />
    </div>
  );
}

export function BasePicker({
  token,
  pageId,
  current,
}: {
  token: string;
  pageId: string;
  current: string;
}) {
  const [selected, setSelected] = useState<BaseId>(getBase(current).id);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(id: BaseId) {
    if (id === selected || pending) return;
    const previous = selected;
    setSelected(id);
    setPending(id);
    setError(null);

    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ baseId: id, recipeMap: {} }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "没换成，再点一次");
      }
    } catch (err) {
      setSelected(previous);
      setError(err instanceof Error ? err.message : "没换成，再点一次");
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="border-t border-line pt-5">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] text-faint">基底</span>
          <h2 className="text-[14px] font-medium text-ink">定整页的气质</h2>
        </div>
        <Link
          href={`/preview/${token}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[12.5px] text-muted transition-colors hover:text-ink"
        >
          预览主页
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      <p className="mt-2 text-[12.5px] leading-[1.7] text-muted">
        {"换基底只换令牌：字体、色板、圆角、疏密跟着变，内容和结构不动。"}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {READY_BASES.map((base) => {
          const isSelected = base.id === selected;
          return (
            <button
              key={base.id}
              type="button"
              onClick={() => choose(base.id)}
              aria-pressed={isSelected}
              title={base.audience}
              className={cn(
                "group rounded-xl border p-2.5 text-left transition-colors",
                isSelected
                  ? "border-ink/35 bg-subtle ring-1 ring-ink/10"
                  : "border-line hover:border-line-strong",
              )}
            >
              <Swatch base={base} />

              <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="text-[13px] font-medium text-ink">
                  {base.name}
                </span>
                {pending === base.id ? (
                  <Loader2 className="size-3.5 animate-spin text-faint" />
                ) : isSelected ? (
                  <span className="inline-flex size-4 items-center justify-center rounded-full bg-ink text-white">
                    <Check className="size-2.5" />
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-[12px] leading-[1.55] text-muted">
                {base.tagline}
              </p>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-3 text-[12.5px] text-danger">{error}</p>}
    </section>
  );
}
