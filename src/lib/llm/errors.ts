export type LLMErrorCode =
  | "NO_KEY"
  | "BAD_REQUEST"
  | "BAD_BASE_URL"
  | "AUTH"
  | "RATE_LIMIT"
  | "TIMEOUT"
  | "UPSTREAM"
  | "NETWORK";

export interface LLMErrorBody {
  error: {
    code: LLMErrorCode;
    message: string;
    /** 是否建议切到模板模式 */
    suggestTemplate?: boolean;
    retryAfterMs?: number;
  };
}

export const LLM_ERROR_MESSAGES: Record<LLMErrorCode, string> = {
  NO_KEY: "还没有填 API Key。可以先去「模型接入」里配置，或直接用模板模式。",
  BAD_REQUEST: "请求参数不完整，检查模型名与消息内容。",
  BAD_BASE_URL: "接口地址不合法：必须是 https，或本机的 http 地址。",
  AUTH: "Key 无效或额度不足（401 / 403）。",
  RATE_LIMIT: "请求过于频繁或额度用尽（429），已自动重试一次。",
  TIMEOUT: "请求超过 60 秒没有返回，建议换一个更快的模型。",
  UPSTREAM: "模型服务返回了错误。",
  NETWORK: "连不上模型服务，检查网络或接口地址。",
};

export function llmError(
  code: LLMErrorCode,
  message?: string,
  extra?: Partial<LLMErrorBody["error"]>,
) {
  return {
    error: {
      code,
      message: message ?? LLM_ERROR_MESSAGES[code],
      ...extra,
    },
  };
}

/** 把上游状态码映射成用户看得懂的错误类型 */
export function codeFromStatus(status: number): LLMErrorCode {
  if (status === 401 || status === 403) return "AUTH";
  if (status === 429) return "RATE_LIMIT";
  if (status === 400 || status === 404 || status === 422) return "UPSTREAM";
  if (status >= 500) return "UPSTREAM";
  return "UPSTREAM";
}
