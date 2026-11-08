import { NextResponse } from "next/server";
import { readApiKey } from "@/lib/llm/auth";
import { llmError } from "@/lib/llm/errors";
import { chatRequestSchema } from "@/lib/llm/schema";
import {
  requestChatCompletion,
  resolveBaseUrl,
  UpstreamFailure,
  upstreamErrorFrom,
  validateBaseUrl,
} from "@/lib/llm/upstream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 同源转发：浏览器 → /api/llm/chat → 用户选的模型服务。
 * Key 只从请求头过一遍，不写日志、不入库、不落盘。
 */
export async function POST(req: Request) {
  const apiKey = readApiKey(req);
  if (!apiKey) {
    return NextResponse.json(llmError("NO_KEY"), { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(llmError("BAD_REQUEST", "请求体不是合法 JSON"), {
      status: 400,
    });
  }

  const parsed = chatRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      llmError("BAD_REQUEST", parsed.error.issues[0]?.message ?? "参数不完整"),
      { status: 400 },
    );
  }

  const { providerId, baseUrl, model, messages, stream, temperature, maxTokens } =
    parsed.data;

  const resolved = resolveBaseUrl(baseUrl, providerId);
  const checked = validateBaseUrl(resolved);
  if (!checked.ok) {
    return NextResponse.json(llmError("BAD_BASE_URL", checked.reason), {
      status: 400,
    });
  }

  const upstreamBody: Record<string, unknown> = {
    model,
    messages,
    stream,
  };
  if (typeof temperature === "number") upstreamBody.temperature = temperature;
  if (typeof maxTokens === "number") upstreamBody.max_tokens = maxTokens;

  try {
    const res = await requestChatCompletion({
      baseUrl: checked.url,
      apiKey,
      body: upstreamBody,
    });

    if (!res.ok) {
      const failure = await upstreamErrorFrom(res);
      return NextResponse.json(failure.toBody(), { status: res.status });
    }

    if (!stream) {
      const data = await res.json();
      return NextResponse.json(data, {
        headers: { "cache-control": "no-store" },
      });
    }

    if (!res.body) {
      throw new UpstreamFailure("UPSTREAM", "模型服务没有返回内容");
    }

    return new Response(res.body, {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-store, no-transform",
        connection: "keep-alive",
        "x-accel-buffering": "no",
      },
    });
  } catch (error) {
    if (error instanceof UpstreamFailure) {
      return NextResponse.json(error.toBody(), { status: 502 });
    }
    return NextResponse.json(
      llmError("UPSTREAM", "转发模型请求时出错"),
      { status: 502 },
    );
  }
}
