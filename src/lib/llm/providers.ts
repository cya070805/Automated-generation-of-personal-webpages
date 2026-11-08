/**
 * 模型服务预设。
 * 全部走 OpenAI 兼容协议，所以一套转发代码可以适配五家；
 * 自定义服务只要求「OpenAI 兼容」，不要求是本清单里的。
 */

export type ProviderId =
  | "deepseek"
  | "qwen"
  | "zhipu"
  | "kimi"
  | "openai"
  | "custom";

export interface ProviderPreset {
  id: ProviderId;
  name: string;
  /** 预设 baseURL，按 OpenAI 兼容协议应能拼出 /chat/completions */
  baseUrl: string;
  models: string[];
  docsUrl?: string;
  note?: string;
  /** 输入框里的 key 前缀提示，纯文案，不做校验 */
  keyHint?: string;
}

export const PROVIDERS: ProviderPreset[] = [
  {
    id: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    models: ["deepseek-chat", "deepseek-reasoner"],
    docsUrl: "https://platform.deepseek.com/api_keys",
    keyHint: "sk-…",
  },
  {
    id: "qwen",
    name: "通义千问",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    models: ["qwen-plus", "qwen-max", "qwen-turbo"],
    docsUrl: "https://bailian.console.aliyun.com/",
    keyHint: "sk-…",
    note: "使用百炼的 OpenAI 兼容模式地址",
  },
  {
    id: "zhipu",
    name: "智谱 GLM",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    models: ["glm-4-flash", "glm-4-plus", "glm-4-air"],
    docsUrl: "https://open.bigmodel.cn/usercenter/apikeys",
  },
  {
    id: "kimi",
    name: "Kimi",
    baseUrl: "https://api.moonshot.cn/v1",
    models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
    docsUrl: "https://platform.moonshot.cn/console/api-keys",
  },
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
    docsUrl: "https://platform.openai.com/api-keys",
    keyHint: "sk-…",
  },
  {
    id: "custom",
    name: "自定义",
    baseUrl: "",
    models: [],
    note: "任何 OpenAI 兼容服务：本地 Ollama、vLLM、公司内网网关都可以",
  },
];

export const DEFAULT_PROVIDER: ProviderId = "deepseek";

export function getProvider(id: ProviderId): ProviderPreset {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
}

/** 预设里出现过的 baseURL —— 用于区分「预设」与「用户自定义地址」 */
export const PRESET_BASE_URLS = new Set(
  PROVIDERS.filter((p) => p.baseUrl).map((p) => normalizeBaseUrl(p.baseUrl)),
);

export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}
