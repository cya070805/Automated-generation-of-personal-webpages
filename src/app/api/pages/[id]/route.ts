import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isReadyTemplate } from "@/lib/templates/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageTheme {
  preset?: string;
  accent?: string;
  [key: string]: unknown;
}

/** 换模板：只动 pages.theme，内容块一个都不碰 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: { preset?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "请求体不是合法 JSON" } },
      { status: 400 },
    );
  }

  if (typeof body.preset !== "string" || !isReadyTemplate(body.preset)) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "没有这个模板" } },
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
  const updated = await db.page.update({
    where: { id },
    data: {
      theme: { ...theme, preset: body.preset } as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({
    ok: true,
    page: { id: updated.id, theme: updated.theme },
  });
}
