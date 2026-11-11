import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isReadyBase } from "@/lib/templates/bases";
import { SLOT_ORDER } from "@/lib/templates/recipes";
import type { RecipeMap, SlotId } from "@/lib/templates/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageTheme {
  preset?: string;
  accent?: string;
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

/**
 * 换基底 / 换某个槽位的讲法。
 * 只动 pages.baseId 与 pages.recipeMap，内容块一个都不碰。
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: { baseId?: string; preset?: string; recipeMap?: Record<string, string> };
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
    body.recipeMap === undefined
      ? undefined
      : sanitizeRecipeMap(body.recipeMap);

  const updated = await db.page.update({
    where: { id },
    data: {
      ...(baseId ? { baseId } : {}),
      ...(recipeMap ? { recipeMap: recipeMap as Prisma.InputJsonValue } : {}),
      theme: {
        ...theme,
        ...(baseId ? { preset: baseId } : {}),
      } as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({
    ok: true,
    page: {
      id: updated.id,
      baseId: updated.baseId,
      recipeMap: updated.recipeMap,
      theme: updated.theme,
    },
  });
}
