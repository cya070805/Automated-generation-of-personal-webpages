"use client";

import type { ChatMessage } from "./types";

export interface ChatOptions {
  providerId: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export class LLMClientError extends Error {
  code: string;
  status: number;
  retryAfterMs?: number;

  constructor(code: string, message: string, status = 0, retryAfterMs?: number) {
    super(message);
    this.name = "LLMClientError";
    this.code = code;
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

interface ErrorPayload {
  error?: { code?: string; message?: string; retryAfterMs?: number };
}

async function readError(res: Response): Promise<LLMClientError> {
  let payload: ErrorPayload | null = null;
  try {
    payload = (await res.json()) as ErrorPayload;
  } catch {
    payload = null;
  }
  return new LLMClientError(
    payload?.error?.code ?? "UPSTREAM",
    payload?.error?.message ?? `请求失败（HTTP ${res.status}）`,
    res.status,
    payload?.error?.retryAfterMs,
  );
}

/** 流式对话：逐段吐文字，返回完整文本 */
export async function streamChat(
  options: ChatOptions,
  onDelta: (delta: string) => void,
): Promise<string> {
  const res = await fetch("/api/llm/chat", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-llm-key": options.apiKey,
    },
    body: JSON.stringify({
      providerId: options.providerId,
      baseUrl: options.baseUrl,
      model: options.model,
      messages: options.messages,
      stream: true,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    }),
    signal: options.signal,
  });

  if (!res.ok || !res.body) {
    throw await readError(res);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;

      try {
        const chunk = JSON.parse(data) as {
          choices?: { delta?: { content?: string } }[];
          error?: { message?: string };
        };
        if (chunk.error?.message) throw new LLMClientError("UPSTREAM", chunk.error.message);
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onDelta(delta);
        }
      } catch (error) {
        if (error instanceof LLMClientError) throw error;
        // 半截 JSON 或心跳，跳过
      }
    }
  }

  return full;
}

export interface TestResult {
  ok: boolean;
  latencyMs: number;
  model: string;
  message: string;
}

export async function testConnection(options: {
  providerId: string;
  baseUrl: string;
  model: string;
  apiKey: string;
}): Promise<TestResult> {
  const res = await fetch("/api/llm/test", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-llm-key": options.apiKey,
    },
    body: JSON.stringify({
      providerId: options.providerId,
      baseUrl: options.baseUrl,
      model: options.model,
    }),
  });

  if (!res.ok) throw await readError(res);
  return (await res.json()) as TestResult;
}
