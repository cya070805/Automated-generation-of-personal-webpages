import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isReadyBase } from "@/lib/templates/bases";
import { SLOT_ORDER } from "@/lib/templates/recipes";
import type { RecipeMap, SlotId } from "@/lib/templates/types";
import type { SiteLayout, SiteTweaks } from "@/lib/site-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageTheme {
  preset?: string;
  accent?: string;
  tweaks?: SiteTweaks;
  [key: string]: unknown;
}

function sanitizeRecipeMap(input: unknown): RecipeMap | null {
  if (!input || typeof input !== "object") return null;
  const source = input as Record<string, unknown>;
  const out: RecipeMap = {};
  for (const slot of SLOT_ORDER) {
    const value = source[slot];
    if (typeof value === "string") out[slot as SlotId] = value;
  }
  return out;
}

function sanitizeLayout(input: unknown): SiteLayout | null {
  if (!input || typeof input !== "object") return null;
  const source = input as Record<string, unknown>;

  const clean = (value: unknown): SlotId[] =>
    Array.isArray(value)
      ? value.filter((item): item is SlotId =>
          SLOT_ORDER.includes(item as SlotId),
        )
      : [];

  return {
    order: Array.isArray(source.order) ? clean(source.order) : undefined,
    hidden: Array.isArray(source.hidden) ? clean(source.hidden) : undefined,
  };
}

/** 0–100 的连续值 */
function clampPercent(value: unknown): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** 底纹是三选一，不是滑杆 */
function clampPattern(value: unknown): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return Math.max(0, Math.min(2, Math.round(value)));
}

function sanitizeTweaks(input: unknown): SiteTweaks | null {
  if (!input || typeof input !== "object") return null;
  const source = input as Record<string, unknown>;
  const out: SiteTweaks = { v: 2 };

  const percentKeys = ["motion", "density", "scale", "radius", "width", "measure", "weight"] as const;
  for (const key of percentKeys) {
    const value = clampPercent(source[key]);
    if (value !== undefined) out[key] = value;
  }
  const pattern = clampPattern(source.pattern);
  if (pattern !== undefined) out.pattern = pattern;
  if (typeof source.accent === "string" && /^#[0-9a-fA-F]{6}$/.test(source.accent)) {
    out.accent = source.accent;
  }
  if (typeof source.bg === "string" && /^#[0-9a-fA-F]{6}$/.test(source.bg)) {
    out.bg = source.bg;
  }
  if (typeof source.ink === "string" && /^#[0-9a-fA-F]{6}$/.test(source.ink)) {
    out.ink = source.ink;
  }

  return out;
}

/**
 * 页面配置：换基底 / 换槽位配方 / 调模块顺序 / 拉滑杆。
 * 只动 pages 这一行，内容块一个都不碰。
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: {
    baseId?: string;
    preset?: string;
    recipeMap?: Record<string, string>;
    layout?: unknown;
    tweaks?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "请求体不是合法 JSON" } },
      { status: 400 },
    );
  }

  const baseId = body.baseId ?? body.preset;
  if (baseId !== undefined && (typeof baseId !== "string" || !isReadyBase(baseId))) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "没有这套基底" } },
      { status: 400 },
    );
  }

  const page = await db.page.findUnique({ where: { id } });
  if (!page) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "找不到这个页面" } },
      { status: 404 },
    );
  }

  const theme = (page.theme ?? {}) as PageTheme;
  const recipeMap =
    body.recipeMap === undefined ? undefined : sanitizeRecipeMap(body.recipeMap);
  const layout = sanitizeLayout(body.layout);
  const tweaks = sanitizeTweaks(body.tweaks);

  const nextTheme: PageTheme = { ...theme };
  if (baseId) nextTheme.preset = baseId;
  // 编辑器每次发的是完整的一份，直接替换；合并会让「全部复原」失效
  if (tweaks) nextTheme.tweaks = tweaks;

  const updated = await db.page.update({
    where: { id },
    data: {
      ...(baseId ? { baseId } : {}),
      ...(recipeMap ? { recipeMap: recipeMap as Prisma.InputJsonValue } : {}),
      ...(layout
        ? {
            layout: {
              ...((page.layout ?? {}) as SiteLayout),
              ...layout,
            } as Prisma.InputJsonValue,
          }
        : {}),
      theme: nextTheme as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({
    ok: true,
    page: {
      id: updated.id,
      baseId: updated.baseId,
      recipeMap: updated.recipeMap,
      layout: updated.layout,
      theme: updated.theme,
    },
  });
}
