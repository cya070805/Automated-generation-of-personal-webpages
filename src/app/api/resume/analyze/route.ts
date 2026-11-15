import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiConfigFromRequest } from "@/lib/ai/config";
import { missingSections } from "@/lib/ai/coverage";
import { templateExtract, templateGaps } from "@/lib/ai/fallback";
import { describeAiError, extractResume, findGaps } from "@/lib/ai/tasks";
import type { Extracted, Gap } from "@/lib/ai/schemas";
import { normalizeSkills, tidySkill } from "@/lib/skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 技能栏要的是「一串短词」，所以模型把技能写成一段话时，
 * 把里面能当词的碎片抠出来，别让一段话占住技能栏。
 */
function chipsFrom(details: string[]): string[] {
  return details
    .flatMap((line) => line.split(/[、，,/;；:：]/))
    .map((piece) => tidySkill(piece))
    .filter((item) => item.length > 0 && item.length <= 14);
}

/**
 * 把一段原始经历变成结构化内容块，并给出缺口问题。
 * 有 Key 走模型抽取；没有 Key 或模型失败就退回模板模式。
 *
 * 用户在第一步勾的技能走 skills 进来，抽不到也从这里补上 ——
 * 技能是自报的，不该指望模型从散文中猜。
 */
export async function POST(req: Request) {
  let body: {
    resumeId?: string;
    text?: string;
    name?: string;
    role?: string;
    email?: string;
    skills?: unknown;
  };
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
  const picked = normalizeSkills(body.skills);
  const config = aiConfigFromRequest(req);

  /** 勾选的 + 抽取到的 + 从技能段落里抠出来的，合成一份短词表 */
  const withPicked = (value: Extracted): Extracted => ({
    ...value,
    skills: normalizeSkills([
      ...value.skills,
      ...value.blocks
        .filter((block) => block.type === "skill")
        .flatMap((block) => chipsFrom(block.details)),
      ...picked,
    ]),
  });

  let extracted: Extracted;
  let mode: "ai" | "template" = "ai";
  let warning: { code: string; message: string } | undefined;
  let usedAi = false;

  if (config.apiKey && text.length > 10) {
    try {
      extracted = withPicked(await extractResume(config, text));
      usedAi = true;
    } catch (error) {
      mode = "template";
      warning = describeAiError(error);
      extracted = withPicked(
        templateExtract(text, { name: body.name, role: body.role }),
      );
    }
  } else {
    mode = "template";
    extracted = withPicked(
      templateExtract(text, { name: body.name, role: body.role }),
    );
  }

  // 用户在第一步自己填的，优先于模型抽的 —— 这一步要在算缺口之前，
  // 否则他刚填过的邮箱还会被再问一遍
  if (body.name) extracted.name = body.name;
  if (body.role) extracted.headline = body.role;
  if (body.email) extracted.email = body.email.trim();

  const gaps: Gap[] = usedAi
    ? await findGaps(config, extracted, missingSections(extracted))
    : templateGaps(extracted);

  // 重跑就清掉旧内容，避免重复
  await db.resumeBlock.deleteMany({ where: { resumeId } });

  const created = [];

  if (
    extracted.name ||
    extracted.headline ||
    extracted.summary ||
    extracted.email ||
    extracted.city ||
    extracted.phone
  ) {
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
    // 技能只做成一个「短词表」块，别让模型写成的那一段话再占一个块
    if (block.type === "skill") continue;
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
