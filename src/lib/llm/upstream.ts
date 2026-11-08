import { getProvider, normalizeBaseUrl, type ProviderId } from "./providers";
import { codeFromStatus, llmError, type LLMErrorCode } from "./errors";

const DEFAULT_TIMEOUT_MS = 60_000;
const RETRY_DELAY_MS = 900;

export interface UpstreamOptions {
  baseUrl: string;
  apiKey: string;
  body: Record<string, unknown>;
  timeoutMs?: number;
  retryOnRateLimit?: boolean;
}

/**
 * 校验用户填的接口地址。
 * 只允许 https，或本机 http（本地 Ollama / vLLM 这类）。
 * 内网段默认拦掉，避免被当成 SSRF 跳板；自托管时可放开。
 */
export function validateBaseUrl(raw: string): { ok: true; url: string } | { ok: false; reason: string } {
  const value = normalizeBaseUrl(raw);
  if (!value) return { ok: false, reason: "接口地址不能为空" };

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, reason: "接口地址不是合法的 URL" };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, reason: "接口地址里不要带账号密码" };
  }

  const host = parsed.hostname.toLowerCase();
  const isLocal =
    host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";

  if (parsed.protocol === "http:" && !isLocal) {
    return { ok: false, reason: "非本机地址必须用 https" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "只支持 http / https" };
  }

  if (isPrivateHost(host) && !isLocal && process.env.ALLOW_PRIVATE_LLM !== "1") {
    return { ok: false, reason: "内网地址默认被拦截；自托管可设 ALLOW_PRIVATE_LLM=1" };
  }

  return { ok: true, url: value };
}

function isPrivateHost(host: string) {
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  if (host === "0.0.0.0") return true;
  return false;
}

export function resolveBaseUrl(baseUrl: string | undefined, providerId?: string) {
  if (baseUrl && baseUrl.trim()) return normalizeBaseUrl(baseUrl);
  if (providerId) return getProvider(providerId as ProviderId).baseUrl;
  return "";
}

/** 拼出 /chat/completions：允许用户直接填到 endpoints 级别 */
export function chatCompletionsUrl(baseUrl: string) {
  const base = normalizeBaseUrl(baseUrl);
  if (/\/chat\/completions$/.test(base)) return base;
  return `${base}/chat/completions`;
}

export class UpstreamFailure extends Error {
  code: LLMErrorCode;
  status?: number;
  retryAfterMs?: number;

  constructor(code: LLMErrorCode, message: string, status?: number, retryAfterMs?: number) {
    super(message);
    this.name = "UpstreamFailure";
    this.code = code;
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }

  toBody() {
    return llmError(this.code, this.message, {
      retryAfterMs: this.retryAfterMs,
      suggestTemplate: this.code === "AUTH" || this.code === "TIMEOUT",
    });
  }
}

export async function requestChatCompletion(
  options: UpstreamOptions,
): Promise<Response> {
  const { body, apiKey, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const url = chatCompletionsUrl(options.baseUrl);
  const retry = options.retryOnRateLimit ?? true;

  const attempt = async (): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
          accept: "text/event-stream, application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        cache: "no-store",
      });
      return res;
    } catch (error) {
      if (isAbortError(error)) {
        throw new UpstreamFailure("TIMEOUT", "模型服务 60 秒内没有响应");
      }
      throw new UpstreamFailure(
        "NETWORK",
        "连不上模型服务，检查网络、代理或接口地址",
      );
    } finally {
      // 头部拿到就清掉计时器，流式响应可以继续跑
      clearTimeout(timer);
    }
  };

  let res = await attempt();

  if (res.status === 429 && retry) {
    await sleep(retryAfter(res) ?? RETRY_DELAY_MS);
    res = await attempt();
  }

  return res;
}

function retryAfter(res: Response) {
  const header = res.headers.get("retry-after");
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.min(seconds * 1000, 5000);
  return undefined;
}

function isAbortError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 把上游的非 2xx 响应翻成统一错误体 */
export async function upstreamErrorFrom(res: Response) {
  const raw = await safeText(res);
  const upstreamMessage = extractMessage(raw);
  const code = codeFromStatus(res.status);
  return new UpstreamFailure(
    code,
    upstreamMessage
      ? `${llmError(code).error.message} 上游信息：${truncate(upstreamMessage, 180)}`
      : llmError(code).error.message,
    res.status,
  );
}

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function extractMessage(raw: string) {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (typeof parsed.error === "string") return parsed.error;
    return parsed.error?.message ?? parsed.message ?? raw;
  } catch {
    return raw;
  }
}

function truncate(value: string, length: number) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length)}…` : text;
}
