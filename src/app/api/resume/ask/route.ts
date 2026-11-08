import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GapShape {
  field: string;
  question: string;
  why?: string;
}

/** 取下一个要问的问题；问完了就返回 done */
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

  const session = await db.chatSession.findFirst({
    where: { resumeId: body.resumeId },
    orderBy: { createdAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!session) {
    return NextResponse.json({ done: true, question: null });
  }

  const gaps = (session.gapList as GapShape[] | null) ?? [];
  const asked = session.messages.filter((message) => message.role === "assistant");

  // 上一条问题还没人回答：直接返回它，避免重复插入
  const last = session.messages[session.messages.length - 1];
  if (last?.role === "assistant") {
    const gap = gaps[asked.length - 1];
    return NextResponse.json({
      done: false,
      sessionId: session.id,
      question: {
        field: gap?.field ?? "general",
        text: last.content,
        index: Math.max(asked.length - 1, 0),
        total: gaps.length,
      },
    });
  }

  if (asked.length >= gaps.length) {
    return NextResponse.json({ done: true, sessionId: session.id, question: null });
  }

  const gap = gaps[asked.length];
  await db.message.create({
    data: {
      sessionId: session.id,
      role: "assistant",
      content: gap.question,
      askedField: gap.field,
    },
  });

  return NextResponse.json({
    done: false,
    sessionId: session.id,
    question: {
      field: gap.field,
      text: gap.question,
      index: asked.length,
      total: gaps.length,
    },
  });
}
