"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Loader2 } from "lucide-react";
import { READY_TEMPLATES, getTemplateMeta } from "@/lib/templates/registry";
import type { TemplateMeta } from "@/lib/templates/types";
import { cn } from "@/lib/utils";

/** 缩略图：用模板自己的配色画一个「像是那页纸」的小色块 */
function Swatch({ meta }: { meta: TemplateMeta }) {
  const { bg, fg, muted, line, accent } = meta.swatch;
  return (
    <div
      className="relative h-[104px] w-full overflow-hidden rounded-md border"
      style={{ background: bg, borderColor: line }}
      aria-hidden
    >
      <div className="flex h-full flex-col justify-between p-4">
        <div>
          <div className="h-[7px] w-[52%] rounded-sm" style={{ background: fg }} />
          <div
            className="mt-1.5 h-[3px] w-[28%] rounded-sm"
            style={{ background: muted, opacity: 0.75 }}
          />
        </div>
        <div className="space-y-1.5">
          <div className="h-px w-full" style={{ background: line }} />
          <div className="h-[3px] w-[70%] rounded-sm" style={{ background: muted, opacity: 0.5 }} />
          <div className="h-[3px] w-[46%] rounded-sm" style={{ background: muted, opacity: 0.35 }} />
        </div>
      </div>
      <div
        className="absolute right-4 top-4 size-2 rounded-full"
        style={{ background: accent }}
      />
    </div>
  );
}

export function TemplatePicker({
  token,
  pageId,
  current,
}: {
  token: string;
  pageId: string;
  current: string;
}) {
  const [selected, setSelected] = useState(getTemplateMeta(current).id);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(id: string) {
    if (id === selected || pending) return;
    const previous = selected;
    setSelected(id);
    setPending(id);
    setError(null);

    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ preset: id }),
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
          <span className="text-[12px] text-faint">模板</span>
          <h2 className="text-[14px] font-medium text-ink">选一个版式</h2>
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {READY_TEMPLATES.map((meta) => {
          const isSelected = meta.id === selected;
          return (
            <button
              key={meta.id}
              type="button"
              onClick={() => choose(meta.id)}
              aria-pressed={isSelected}
              className={cn(
                "group rounded-xl border p-3 text-left transition-colors",
                isSelected
                  ? "border-ink/35 bg-subtle ring-1 ring-ink/10"
                  : "border-line hover:border-line-strong",
              )}
            >
              <Swatch meta={meta} />

              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[13.5px] font-medium text-ink">
                  {meta.name}
                </span>
                {pending === meta.id ? (
                  <Loader2 className="size-3.5 animate-spin text-faint" />
                ) : isSelected ? (
                  <span className="inline-flex size-4 items-center justify-center rounded-full bg-ink text-white">
                    <Check className="size-2.5" />
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[12.5px] leading-[1.6] text-muted">
                {meta.tagline}
              </p>
              <p className="mt-1.5 text-[11.5px] leading-[1.6] text-faint">
                {meta.audience}
              </p>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-3 text-[12.5px] text-danger">{error}</p>}
    </section>
  );
}
