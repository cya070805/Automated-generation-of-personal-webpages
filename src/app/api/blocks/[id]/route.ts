import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BlockContent {
  versions?: string[];
  chosen?: number;
  details?: string[];
  title?: string;
  custom?: string;
  [key: string]: unknown;
}

/** 改内容块：选哪一版、改哪句话 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: {
    chosen?: number;
    versions?: string[];
    details?: string[];
    title?: string;
    custom?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "请求体不是合法 JSON" } },
      { status: 400 },
    );
  }

  const block = await db.resumeBlock.findUnique({ where: { id } });
  if (!block) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "找不到这个内容块" } },
      { status: 404 },
    );
  }

  const content = (block.content as BlockContent) ?? {};
  const next: BlockContent = { ...content };

  if (typeof body.chosen === "number") next.chosen = body.chosen;
  if (Array.isArray(body.versions)) next.versions = body.versions.slice(0, 2);
  if (Array.isArray(body.details)) next.details = body.details;
  if (typeof body.title === "string") next.title = body.title;
  if (typeof body.custom === "string") next.custom = body.custom;
  if (body.custom === null) delete next.custom;

  const updated = await db.resumeBlock.update({
    where: { id },
    data: { content: next as Prisma.InputJsonValue },
  });

  return NextResponse.json({ ok: true, block: updated });
}
