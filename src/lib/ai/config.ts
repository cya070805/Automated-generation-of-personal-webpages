import { readApiKey } from "@/lib/llm/auth";
import { getProvider, normalizeBaseUrl, type ProviderId } from "@/lib/llm/providers";

export interface AiConfig {
  apiKey: string;
  providerId: string;
  baseUrl: string;
  model: string;
}

/**
 * 服务端的管线调用沿用同一套 Key 规则：
 * 请求头 x-llm-key > Authorization > 环境变量 LLM_API_KEY。
 * 前端把用户在设置页里的配置一并带过来。
 */
export function aiConfigFromRequest(req: Request): AiConfig {
  const forceTemplate = req.headers.get("x-llm-mode") === "template";

  const providerId =
    req.headers.get("x-llm-provider") ?? process.env.LLM_PROVIDER ?? "deepseek";
  const preset = getProvider(providerId as ProviderId);

  const rawBase = req.headers.get("x-llm-base") ?? process.env.LLM_BASE_URL ?? "";
  const baseUrl = rawBase.trim()
    ? normalizeBaseUrl(rawBase)
    : preset.baseUrl;

  const model =
    req.headers.get("x-llm-model") ?? process.env.LLM_MODEL ?? preset.models[0] ?? "";

  return {
    apiKey: forceTemplate ? "" : readApiKey(req),
    providerId,
    baseUrl,
    model,
  };
}
