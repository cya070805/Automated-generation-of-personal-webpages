import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiConfigFromRequest } from "@/lib/ai/config";
import { templateExtract, templateGaps } from "@/lib/ai/fallback";
import { describeAiError, extractResume, findGaps } from "@/lib/ai/tasks";
import type { Extracted } from "@/lib/ai/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 把一段原始经历变成结构化内容块，并给出缺口问题。
 * 有 Key 走模型抽取；没有 Key 或模型失败就退回模板模式。
 */
export async function POST(req: Request) {
  let body: { resumeId?: string; text?: string; name?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "请求体不是合法 JSON" } },
      { status: 400 },
    );
  }

  const resumeId = body.resumeId;
  if (!resumeId) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "缺少 resumeId" } },
      { status: 400 },
    );
  }

  const resume = await db.resume.findUnique({ where: { id: resumeId } });
  if (!resume) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "找不到这份简历" } },
      { status: 404 },
    );
  }

  const text = (body.text ?? "").trim();
  const config = aiConfigFromRequest(req);

  let extracted: Extracted;
  let gaps: { field: string; question: string; why?: string }[];
  let mode: "ai" | "template" = "ai";
  let warning: { code: string; message: string } | undefined;

  if (config.apiKey && text.length > 10) {
    try {
      extracted = await extractResume(config, text);
      gaps = await findGaps(config, extracted);
    } catch (error) {
      mode = "template";
      warning = describeAiError(error);
      extracted = templateExtract(text, { name: body.name, role: body.role });
      gaps = templateGaps();
    }
  } else {
    mode = "template";
    extracted = templateExtract(text, { name: body.name, role: body.role });
    gaps = templateGaps();
  }

  if (body.name) extracted.name = body.name;
  if (body.role) extracted.headline = body.role;

  // 重跑就清掉旧内容，避免重复
  await db.resumeBlock.deleteMany({ where: { resumeId } });

  const created = [];

  if (extracted.name || extracted.headline || extracted.summary) {
    created.push(
      await db.resumeBlock.create({
        data: {
          resumeId,
          type: "profile",
          position: 0,
          content: {
            name: extracted.name,
            headline: extracted.headline,
            email: extracted.email,
            phone: extracted.phone,
            city: extracted.city,
            summary: extracted.summary,
          },
        },
      }),
    );
  }

  let position = 1;
  for (const block of extracted.blocks) {
    created.push(
      await db.resumeBlock.create({
        data: {
          resumeId,
          type: block.type,
          position: position++,
          content: {
            title: block.title,
            org: block.org,
            period: block.period,
            details: block.details,
          },
        },
      }),
    );
  }

  if (extracted.skills.length > 0) {
    created.push(
      await db.resumeBlock.create({
        data: {
          resumeId,
          type: "skill",
          position: position++,
          content: { items: extracted.skills },
        },
      }),
    );
  }

  await db.resume.update({
    where: { id: resumeId },
    data: {
      status: "collecting",
      targetRole: body.role ?? resume.targetRole,
    },
  });

  const session = await db.chatSession.create({
    data: { resumeId, stage: "gap", gapList: gaps },
  });

  return NextResponse.json({
    mode,
    warning,
    sessionId: session.id,
    blocks: created,
    gaps,
  });
}
