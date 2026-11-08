import { NextResponse } from "next/server";
import { readApiKey } from "@/lib/llm/auth";
import { llmError } from "@/lib/llm/errors";
import { testRequestSchema } from "@/lib/llm/schema";
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
 * 「测试连接」：发一条最小请求，量一下往返耗时。
 * 比 GET /models 更通用 —— 不是每一家都实现 /models。
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

  const parsed = testRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      llmError("BAD_REQUEST", parsed.error.issues[0]?.message ?? "参数不完整"),
      { status: 400 },
    );
  }

  const checked = validateBaseUrl(resolveBaseUrl(parsed.data.baseUrl, parsed.data.providerId));
  if (!checked.ok) {
    return NextResponse.json(llmError("BAD_BASE_URL", checked.reason), {
      status: 400,
    });
  }

  const startedAt = Date.now();

  try {
    const res = await requestChatCompletion({
      baseUrl: checked.url,
      apiKey,
      body: {
        model: parsed.data.model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
        stream: false,
      },
      timeoutMs: 30_000,
      retryOnRateLimit: false,
    });

    if (!res.ok) {
      const failure = await upstreamErrorFrom(res);
      return NextResponse.json(failure.toBody(), { status: res.status });
    }

    await res.text();
    const latencyMs = Date.now() - startedAt;

    return NextResponse.json({
      ok: true,
      latencyMs,
      model: parsed.data.model,
      message:
        latencyMs > 8000
          ? `连接成功，但有点慢（${latencyMs} ms）`
          : `连接成功 · ${latencyMs} ms`,
    });
  } catch (error) {
    if (error instanceof UpstreamFailure) {
      return NextResponse.json(error.toBody(), { status: 502 });
    }
    return NextResponse.json(llmError("NETWORK"), { status: 502 });
  }
}
