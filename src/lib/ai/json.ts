import type { z } from "zod";
import { requestChatCompletion, upstreamErrorFrom } from "@/lib/llm/upstream";
import type { AiConfig } from "./config";

export class AiTaskError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AiTaskError";
    this.code = code;
  }
}

/** 从模型输出里抠出 JSON：容忍 ```json 围栏与前后废话 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;

  const firstObject = candidate.indexOf("{");
  const firstArray = candidate.indexOf("[");
  let start = -1;
  if (firstObject === -1) start = firstArray;
  else if (firstArray === -1) start = firstObject;
  else start = Math.min(firstObject, firstArray);

  if (start === -1) throw new SyntaxError("没有 JSON");

  const open = candidate[start];
  const close = open === "{" ? "}" : "]";
  const end = candidate.lastIndexOf(close);
  if (end <= start) throw new SyntaxError("JSON 不完整");

  return JSON.parse(candidate.slice(start, end + 1));
}

interface JsonTaskOptions<T> {
  config: AiConfig;
  system: string;
  user: string;
  schema: z.ZodType<T, z.ZodTypeDef, unknown>;
  temperature?: number;
  maxTokens?: number;
}

/** 让模型输出 JSON，并用 zod 校验；失败一次就带着错误重试一次 */
export async function completeJson<T>(options: JsonTaskOptions<T>): Promise<T> {
  const { config, system, user, schema } = options;

  if (!config.apiKey) {
    throw new AiTaskError("NO_KEY", "没有可用的 API Key");
  }

  const messages = [
    { role: "system", content: `${system}\n\n只输出 JSON，不要解释、不要 Markdown 围栏。` },
    { role: "user", content: user },
  ];

  let lastError: unknown = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const res = await requestChatCompletion({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      body: {
        model: config.model,
        messages,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 2400,
        stream: false,
      },
      timeoutMs: 90_000,
      retryOnRateLimit: true,
    });

    if (!res.ok) {
      const failure = await upstreamErrorFrom(res);
      throw new AiTaskError(failure.code, failure.message);
    }

    const payload = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = payload.choices?.[0]?.message?.content ?? "";

    try {
      const parsed = schema.safeParse(extractJson(text));
      if (parsed.success) return parsed.data;
      lastError = parsed.error;
    } catch (error) {
      lastError = error;
    }

    if (process.env.DEBUG_AI === "1") {
      console.error("[ai-json] 解析失败：", String(lastError).slice(0, 400));
      console.error("[ai-json] 原文：", text.slice(0, 1500));
    }

    messages.push(
      { role: "assistant", content: text.slice(0, 2000) },
      {
        role: "user",
        content: `上面的输出不是合法的 JSON 或字段不全（${String(lastError).slice(0, 200)}）。重新输出，只给 JSON。`,
      },
    );
  }

  throw new AiTaskError("BAD_OUTPUT", "模型没有按要求返回结构化内容");
}
