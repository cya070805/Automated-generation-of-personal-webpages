/**
 * Key 的来源，优先级：请求头 x-llm-key > Authorization: Bearer > 环境变量 LLM_API_KEY。
 * 一律不落库、不写日志。
 */
export function readApiKey(req: Request): string {
  const headerKey = req.headers.get("x-llm-key")?.trim();
  if (headerKey) return headerKey;

  const auth = req.headers.get("authorization");
  if (auth && /^bearer\s+/i.test(auth)) {
    return auth.replace(/^bearer\s+/i, "").trim();
  }

  return process.env.LLM_API_KEY?.trim() ?? "";
}

/** 环境变量里预置了 Key（部署包 / 内网共用一台机器的场景） */
export function hasServerKey() {
  return Boolean(process.env.LLM_API_KEY?.trim());
}
