import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { aiConfigFromRequest } from "@/lib/ai/config";
import { completeJson } from "@/lib/ai/json";
import { describeAiError } from "@/lib/ai/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  blockId: z.string(),
  action: z.enum(["polish", "translate", "tailor"]),
  jd: z.string().optional(),
});

const resultSchema = z.object({
  text: z.string(),
  note: z.string().optional(),
});

const SYSTEM: Record<string, string> = {
  polish:
    "你在帮一名中国学生改简历文案。保持事实不变，只让句子更短、更有力、更适合面试官 30 秒扫读。" +
    "不许编造数字、公司、时间；原文没有的数据不要补。返回 JSON：{\"text\":\"...\"}",
  translate:
    "把这段中文简历文案翻译成自然的英文简历用语。用动词开头、不用完整句子、不用第一人称。" +
    "专有名词保留。返回 JSON：{\"text\":\"...\"}",
  tailor:
    "你在按岗位 JD 调整一段简历文案。只做两件事：把跟 JD 相关的经历提到前面并换用 JD 里的词；" +
    "删掉与 JD 无关的修饰。事实、数字、时间一个字都不能改。返回 JSON：{\"text\":\"...\"}",
};

/**
 * AI 持续辅助：润色 / 翻译 / 按 JD 定制。
 * 只改这一段，不动别的块；结果写成 custom，原文和两版草稿都还在。
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "请求体不是合法 JSON" } },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "参数不对" } },
      { status: 400 },
    );
  }

  const { blockId, action, jd } = parsed.data;

  if (action === "tailor" && (!jd || jd.trim().length < 10)) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "先把 JD 贴进来" } },
      { status: 400 },
    );
  }

  const block = await db.resumeBlock.findUnique({ where: { id: blockId } });
  if (!block) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "找不到这段内容" } },
      { status: 404 },
    );
  }

  const content = block.content as {
    custom?: string;
    versions?: string[];
    chosen?: number;
    details?: string[];
  };

  const current =
    content.custom?.trim() ||
    content.versions?.[content.chosen ?? 0] ||
    content.versions?.[0] ||
    (content.details ?? []).join("\n");

  if (!current) {
    return NextResponse.json(
      { error: { code: "EMPTY", message: "这段还没内容可改" } },
      { status: 400 },
    );
  }

  const config = aiConfigFromRequest(req);
  if (!config.apiKey) {
    return NextResponse.json(
      {
        error: {
          code: "NO_KEY",
          message: "还没配模型，去「模型设置」里填一个 Key",
        },
      },
      { status: 400 },
    );
  }

  try {
    const result = await completeJson({
      config,
      system: SYSTEM[action],
      user:
        action === "tailor"
          ? `【JD】\n${jd}\n\n【原文】\n${current}`
          : `【原文】\n${current}`,
      schema: resultSchema,
    });

    const text = result.text.trim();
    if (!text) throw new Error("模型返回了空文本");

    await db.resumeBlock.update({
      where: { id: blockId },
      data: {
        content: { ...content, custom: text } as never,
      },
    });

    return NextResponse.json({
      ok: true,
      text,
      mode: "ai",
      note: result.note,
    });
  } catch (error) {
    const info = describeAiError(error);
    return NextResponse.json(
      { error: { code: "AI_FAILED", message: info.message } },
      { status: 502 },
    );
  }
}
