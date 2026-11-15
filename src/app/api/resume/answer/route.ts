import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applyAnswerToBlock } from "@/lib/collect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 记一条回答。问题文本也存一份，后面写文案时作为补充上下文 */
export async function POST(req: Request) {
  let body: {
    sessionId?: string;
    question?: string;
    field?: string;
    answer?: string;
    skip?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  if (!body.sessionId) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "缺少 sessionId" } },
      { status: 400 },
    );
  }

  const answer = (body.answer ?? "").trim();
  if (!answer && !body.skip) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "回答不能为空" } },
      { status: 400 },
    );
  }

  await db.message.create({
    data: {
      sessionId: body.sessionId,
      role: "user",
      content: body.skip ? "（跳过）" : answer,
      askedField: body.field ?? null,
    },
  });

  // 记过的问答留一条痕迹，方便后面查为什么这么写；
  // 同时把「简介 / 教育 / 技能 / 项目 / 城市」这类板块问题直接落成内容块。
  if (!body.skip && body.question && answer) {
    const session = await db.chatSession.findUnique({
      where: { id: body.sessionId },
      select: { resumeId: true },
    });
    if (session) {
      await db.resumeBlock.create({
        data: {
          resumeId: session.resumeId,
          type: "note",
          position: 999,
          content: {
            question: body.question,
            answer,
            field: body.field ?? "",
          },
        },
      });

      if (body.field) {
        try {
          await applyAnswerToBlock(session.resumeId, body.field, answer);
        } catch (error) {
          // 落块失败不能把这一问的答案吞掉：note 已经存下了，写文案时还用得上
          console.error("applyAnswerToBlock failed", error);
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
