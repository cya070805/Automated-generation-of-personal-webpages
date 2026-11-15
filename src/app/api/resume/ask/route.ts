import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiConfigFromRequest } from "@/lib/ai/config";
import { missingFromBlocks } from "@/lib/ai/coverage";
import { nextQuestion } from "@/lib/ai/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 一共最多问这么多（跳过的也算一个） */
const MAX_QUESTIONS = 10;

interface GapShape {
  field: string;
  question: string;
  why?: string;
  hint?: string;
}

interface BlockContent {
  title?: string;
  org?: string;
  period?: string;
  details?: string[];
}

/**
 * 取下一个问题。
 *
 * 有 Key 时每一轮都问一次模型：「上一答哪里没说清？哪屏还空着？」——
 * 这样能追问上一句的含糊处，也能让人补一句简介这种没提到的部分。
 * 模型不可用时退回 analyze 时算好的问题单，流程不会卡住。
 */
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

  const messages = session.messages;
  const askedMessages = messages.filter((message) => message.role === "assistant");
  const gaps = (session.gapList as GapShape[] | null) ?? [];

  // 上一条问题还没人回答：直接返回它，避免重复插入
  const last = messages[messages.length - 1];
  if (last?.role === "assistant") {
    const gap = gaps[askedMessages.length - 1];
    return NextResponse.json({
      done: false,
      sessionId: session.id,
      question: {
        field: gap?.field ?? "general",
        text: last.content,
        index: Math.max(askedMessages.length - 1, 0),
        total: MAX_QUESTIONS,
        why: gap?.why ?? "",
        hint: gap?.hint ?? "",
      },
    });
  }

  if (askedMessages.length >= MAX_QUESTIONS) {
    return NextResponse.json({
      done: true,
      sessionId: session.id,
      question: null,
      asked: askedMessages.length,
      total: MAX_QUESTIONS,
    });
  }

  // 问答成对：问一句、答一句
  const transcript: { question: string; answer: string }[] = [];
  for (let i = 0; i < messages.length; i += 1) {
    const message = messages[i];
    if (message.role !== "assistant") continue;
    const reply = messages[i + 1];
    transcript.push({
      question: message.content,
      answer: reply?.role === "user" ? reply.content : "",
    });
  }

  const blocks = await db.resumeBlock.findMany({
    where: { resumeId: body.resumeId, type: { not: "note" } },
    orderBy: { position: "asc" },
  });

  const material = blocks.map((block) => {
    const content = (block.content ?? {}) as BlockContent;
    return {
      type: block.type,
      title: content.title ?? "",
      org: content.org ?? "",
      period: content.period ?? "",
      details: content.details ?? [],
    };
  });

  const askedTexts = askedMessages.map((message) => message.content);
  const config = aiConfigFromRequest(req);

  let pick: { field: string; text: string; why?: string; hint?: string } | null =
    null;

  if (config.apiKey) {
    try {
      const answer = await nextQuestion(config, {
        asked: askedMessages.length,
        remaining: MAX_QUESTIONS - askedMessages.length,
        askedQuestions: askedTexts,
        transcript: transcript.filter((turn) => turn.answer),
        material,
        missing: missingFromBlocks(blocks),
      });
      if (answer.done) {
        return NextResponse.json({
          done: true,
          sessionId: session.id,
          question: null,
          asked: askedMessages.length,
          total: MAX_QUESTIONS,
        });
      }
      const text = answer.question.trim();
      // 别让模型把问过的再问一遍
      if (text && !askedTexts.some((old) => old.trim() === text)) {
        pick = {
          field: answer.field || "experience",
          text,
          why: answer.why,
          hint: answer.hint,
        };
      }
    } catch {
      // 模型挂了就走预置问题单
    }
  }

  if (!pick) {
    const gap = gaps[askedMessages.length];
    if (!gap) {
      return NextResponse.json({
        done: true,
        sessionId: session.id,
        question: null,
        asked: askedMessages.length,
        total: MAX_QUESTIONS,
      });
    }
    pick = {
      field: gap.field,
      text: gap.question,
      why: gap.why,
      hint: gap.hint,
    };
  }

  await db.message.create({
    data: {
      sessionId: session.id,
      role: "assistant",
      content: pick.text,
      askedField: pick.field,
    },
  });

  return NextResponse.json({
    done: false,
    sessionId: session.id,
    asked: askedMessages.length,
    total: MAX_QUESTIONS,
    question: {
      field: pick.field,
      text: pick.text,
      index: askedMessages.length,
      total: MAX_QUESTIONS,
      why: pick.why ?? "",
      hint: pick.hint ?? "",
    },
  });
}
