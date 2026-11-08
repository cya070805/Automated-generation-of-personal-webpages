import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiConfigFromRequest } from "@/lib/ai/config";
import { templateDraft } from "@/lib/ai/fallback";
import { describeAiError, draftBlocks } from "@/lib/ai/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BlockContent {
  title?: string;
  org?: string;
  period?: string;
  details?: string[];
  versions?: string[];
  sourceQuote?: string;
  chosen?: number;
  [key: string]: unknown;
}

/** 给每个内容块写两版文案；有 Key 用模型，没有就压缩原文 */
export async function POST(req: Request) {
  let body: { resumeId?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  if (!body.resumeId) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "缺少 resumeId" } },
      { status: 400 },
    );
  }

  const blocks = await db.resumeBlock.findMany({
    where: { resumeId: body.resumeId, type: { not: "note" } },
    orderBy: { position: "asc" },
  });

  const notes = await db.resumeBlock.findMany({
    where: { resumeId: body.resumeId, type: "note" },
    orderBy: { position: "asc" },
  });

  const context = notes
    .map((note) => {
      const content = note.content as { question?: string; answer?: string };
      return content.answer ? `${content.question ?? ""} ${content.answer}` : "";
    })
    .filter(Boolean);

  const config = aiConfigFromRequest(req);

  const inputs = blocks.map((block) => {
    const content = block.content as BlockContent;
    return {
      id: block.id,
      type: block.type,
      title: content.title ?? "",
      org: content.org ?? "",
      period: content.period ?? "",
      details: content.details ?? [],
    };
  });

  const draftable = inputs.filter((input) => input.details.length > 0);

  let mode: "ai" | "template" = "ai";
  let warning: { code: string; message: string } | undefined;
  let results: { id: string; versions: string[]; sourceQuote: string }[] = [];

  if (config.apiKey && draftable.length > 0) {
    try {
      results = (await draftBlocks(config, draftable, context)).filter(
        (item) => item.versions.length > 0,
      );
    } catch (error) {
      mode = "template";
      warning = describeAiError(error);
    }
  } else {
    mode = "template";
  }

  if (results.length === 0) {
    results = templateDraft(draftable);
  }

  const byId = new Map(results.map((item) => [item.id, item]));

  for (const block of blocks) {
    const item = byId.get(block.id);
    if (!item) continue;
    const content = block.content as BlockContent;
    await db.resumeBlock.update({
      where: { id: block.id },
      data: {
        content: {
          ...content,
          versions: item.versions,
          sourceQuote: item.sourceQuote,
          chosen: 0,
        },
        sourceQuote: item.sourceQuote || content.sourceQuote || null,
      },
    });
  }

  await db.resume.update({
    where: { id: body.resumeId },
    data: { status: "ready" },
  });

  const updated = await db.resumeBlock.findMany({
    where: { resumeId: body.resumeId },
    orderBy: { position: "asc" },
  });

  return NextResponse.json({ mode, warning, blocks: updated });
}
