"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, FieldHint, Select } from "@/components/ui/input";
import { PROVIDERS, getProvider, type ProviderId } from "@/lib/llm/providers";
import { testConnection } from "@/lib/llm/client";
import { useServerKey } from "@/lib/llm/use-server-key";
import { useSettings } from "@/store/settings-store";
import { useSettingsHydration } from "@/store/use-settings-hydration";
import { cn } from "@/lib/utils";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string };

export function SettingsClient() {
  const settings = useSettings();
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useSettingsHydration();

  const provider = useMemo(
    () => getProvider(settings.providerId),
    [settings.providerId],
  );
  const isCustom = settings.providerId === "custom";
  const hasKey = settings.apiKey.trim().length > 0;
  const serverKey = useServerKey();
  const canCall = hasKey || serverKey;

  async function onTest() {
    if (!canCall) {
      setStatus({ kind: "error", message: "先把 API Key 填进来再测试。" });
      return;
    }
    setStatus({ kind: "loading" });
    try {
      const result = await testConnection({
        providerId: settings.providerId,
        baseUrl: settings.baseUrl,
        model: settings.model,
        apiKey: settings.apiKey.trim(),
      });
      setStatus({ kind: "ok", message: result.message });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "测试失败，检查 Key 与网络",
      });
    }
  }

  return (
    <div className="fade-up max-w-[760px]">
      <header>
        <h1 className="text-[30px] leading-tight tracking-[-0.02em] text-ink">
          模型接入
        </h1>
        <p className="mt-3 max-w-[560px] text-[14.5px] leading-[1.75] text-muted">
          {"五家预设，或任何 OpenAI 兼容服务。Key 只存在这台浏览器的本地存储里，调用经同源转发，服务端不落盘、不写日志。"}
        </p>
      </header>

      <Card className="mt-8">
        <CardContent className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="provider">服务</Label>
              <Select
                id="provider"
                value={settings.providerId}
                onChange={(event) => {
                  settings.setProvider(event.target.value as ProviderId);
                  setStatus({ kind: "idle" });
                }}
              >
                {PROVIDERS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="model">模型</Label>
              <Input
                id="model"
                value={settings.model}
                onChange={(event) => settings.setModel(event.target.value)}
                placeholder={provider.models[0] ?? "模型名"}
                list="model-presets"
                spellCheck={false}
                className="font-mono text-[13px]"
              />
              <datalist id="model-presets">
                {provider.models.map((model) => (
                  <option key={model} value={model} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <Label htmlFor="baseUrl">
              Base URL
              {isCustom && <span className="text-[12px] font-normal text-muted">必填</span>}
            </Label>
            <Input
              id="baseUrl"
              value={settings.baseUrl}
              onChange={(event) => settings.setBaseUrl(event.target.value)}
              placeholder={
                isCustom ? "https://your-gateway.example.com/v1" : provider.baseUrl
              }
              spellCheck={false}
              className="font-mono text-[13px]"
            />
            <FieldHint>
              {"OpenAI 兼容协议。填到 /v1 或直接填到 /chat/completions 都行。"}
            </FieldHint>
          </div>

          <div>
            <Label htmlFor="apiKey">API Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showKey ? "text" : "password"}
                value={settings.apiKey}
                onChange={(event) => {
                  settings.setApiKey(event.target.value);
                  setStatus({ kind: "idle" });
                }}
                placeholder="sk-…"
                autoComplete="off"
                spellCheck={false}
                className="pr-11 font-mono text-[13px]"
              />
              <button
                type="button"
                onClick={() => setShowKey((value) => !value)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-faint transition-colors hover:bg-subtle hover:text-ink"
                aria-label={showKey ? "隐藏 Key" : "显示 Key"}
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <FieldHint>
              {"只写进 localStorage（lvdao.settings.v1），不上传、不入库。"}
            </FieldHint>
            {!hasKey && serverKey && (
              <p className="mt-1.5 text-[12px] text-success">
                服务端已通过 LLM_API_KEY 预置 Key，这里留空也能调用。
              </p>
            )}
          </div>

          <label className="flex items-start gap-3 border-t border-line pt-5">
            <input
              type="checkbox"
              checked={settings.consent}
              onChange={(event) => settings.setConsent(event.target.checked)}
              className="mt-1 size-4 accent-ink"
            />
            <span className="text-[13px] leading-relaxed text-ink-2">
              我知道简历内容会发送给我选择的模型厂商，首次生成前需要勾选。
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={onTest} disabled={status.kind === "loading" || !canCall}>
              {status.kind === "loading" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Zap />
              )}
              测试连接
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                settings.reset();
                setStatus({ kind: "idle" });
              }}
            >
              <Trash2 />
              清空
            </Button>
            <span className="ml-auto text-[12px] text-faint">改动即时保存在本机</span>
          </div>

          {status.kind === "ok" && (
            <p className="flex items-center gap-2 text-[13px] text-success">
              <Check className="size-4 shrink-0" />
              {status.message}
            </p>
          )}
          {status.kind === "error" && (
            <p className="flex items-start gap-2 text-[13px] leading-relaxed text-danger">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{status.message}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
          <div>
            <p className="text-[14px] text-ink">模板模式</p>
            <p className="mt-1 max-w-[440px] text-[13px] leading-relaxed text-muted">
              {"不调模型，用问卷加结构化填空走完流程，照样生成主页与 PDF。"}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.mode === "template"}
            onClick={() =>
              settings.setMode(settings.mode === "template" ? "llm" : "template")
            }
            className={cn(
              "relative h-6 w-10 shrink-0 rounded-full transition-colors",
              settings.mode === "template" ? "bg-ink" : "bg-line-strong",
            )}
          >
            <span
              className={cn(
                "absolute top-1 size-4 rounded-full bg-white transition-transform",
                settings.mode === "template" ? "translate-x-5" : "translate-x-1",
              )}
            />
          </button>
        </CardContent>
      </Card>

      <div className="mt-8 space-y-2.5 text-[13px] leading-relaxed text-muted">
        <p>为什么自带 Key：推理费用由你自己承担，平台不代付、不转售额度。</p>
        <p>排错：401 / 403 是 Key 无效或额度不足；429 会自动退避重试一次；超时 60 秒建议换更快的模型。</p>
      </div>
    </div>
  );
}
