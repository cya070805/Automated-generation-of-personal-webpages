"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, FieldHint, Select } from "@/components/ui/input";
import { PROVIDERS, getProvider, type ProviderId } from "@/lib/llm/providers";
import { testConnection } from "@/lib/llm/client";
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

  async function onTest() {
    if (!hasKey) {
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

  function onProviderChange(id: ProviderId) {
    settings.setProvider(id);
    setStatus({ kind: "idle" });
  }

  return (
    <div className="fade-up space-y-10">
      <header className="max-w-2xl">
        <p className="eyebrow">M0 · 模型接入</p>
        <h1 className="mt-3 font-display text-[34px] leading-tight text-navy">
          把你自己那家模型接进来
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          {"五家预设，或任何 OpenAI 兼容服务。Key 只存在这台浏览器的本地存储里，调用经同源转发，服务端不落盘、不写日志。没填也能用——自动走模板模式。"}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* 01 选择服务 */}
          <section>
            <SectionLabel index="01" title="选一家服务" />
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {PROVIDERS.map((item) => {
                const active = settings.providerId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onProviderChange(item.id)}
                    className={cn(
                      "group relative rounded-xl border px-4 py-3 text-left transition-all",
                      active
                        ? "border-teal/50 bg-teal-soft/60 shadow-[0_0_0_1px_rgba(46,110,107,0.18)]"
                        : "border-line bg-surface hover:border-line-strong",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          active ? "text-teal" : "text-ink",
                        )}
                      >
                        {item.name}
                      </span>
                      {active && <CheckCircle2 className="size-3.5 text-teal" />}
                    </div>
                    <p className="mt-1 truncate font-mono text-[10px] text-faint">
                      {item.baseUrl || "自定义地址"}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 02 参数 */}
          <section>
            <SectionLabel index="02" title="接口与密钥" />
            <Card className="mt-4">
              <CardContent className="space-y-5">
                <div>
                  <Label htmlFor="baseUrl">
                    Base URL
                    {isCustom && <Badge tone="warm">必填</Badge>}
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
                    要 OpenAI 兼容协议。填到 <code className="font-mono">/v1</code>{" "}
                    或直接填到{" "}
                    <code className="font-mono">/chat/completions</code> 都行。
                  </FieldHint>
                </div>

                <div>
                  <Label htmlFor="model">模型</Label>
                  <div className="flex gap-2">
                    <Input
                      id="model"
                      value={settings.model}
                      onChange={(event) => settings.setModel(event.target.value)}
                      placeholder="deepseek-chat"
                      list="model-presets"
                      spellCheck={false}
                      className="font-mono text-[13px]"
                    />
                    {provider.models.length > 0 && (
                      <Select
                        aria-label="从预设模型里选"
                        value=""
                        onChange={(event) => {
                          if (event.target.value) settings.setModel(event.target.value);
                        }}
                        className="w-36 shrink-0"
                      >
                        <option value="">预设…</option>
                        {provider.models.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </Select>
                    )}
                  </div>
                  <datalist id="model-presets">
                    {provider.models.map((model) => (
                      <option key={model} value={model} />
                    ))}
                  </datalist>
                  <FieldHint>换模型只影响生成质量与价格，不影响已有内容。</FieldHint>
                </div>

                <div>
                  <Label htmlFor="apiKey">
                    <KeyRound className="size-3.5" />
                    API Key
                  </Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showKey ? "text" : "password"}
                      value={settings.apiKey}
                      onChange={(event) => {
                        settings.setApiKey(event.target.value);
                        setStatus({ kind: "idle" });
                      }}
                      placeholder={provider.keyHint ?? "sk-…"}
                      autoComplete="off"
                      spellCheck={false}
                      className="pr-11 font-mono text-[13px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((value) => !value)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-faint transition-colors hover:bg-paper-deep hover:text-ink"
                      aria-label={showKey ? "隐藏 Key" : "显示 Key"}
                    >
                      {showKey ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  <FieldHint>
                    只写进 localStorage（键名{" "}
                    <code className="font-mono">lvdao.settings.v1</code>
                    ），不上传、不入库。
                  </FieldHint>
                </div>

                <label className="flex items-start gap-3 rounded-lg border border-line bg-paper-deep/50 p-3">
                  <input
                    type="checkbox"
                    checked={settings.consent}
                    onChange={(event) => settings.setConsent(event.target.checked)}
                    className="mt-0.5 size-4 accent-teal"
                  />
                  <span className="text-[12.5px] leading-relaxed text-ink-soft">
                    我知道简历内容会发送给我选择的模型厂商；首次生成前需要勾选这项。
                  </span>
                </label>

                <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
                  <Button
                    onClick={onTest}
                    disabled={status.kind === "loading" || !hasKey}
                    variant="teal"
                  >
                    {status.kind === "loading" ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Zap />
                    )}
                    测试连接
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      settings.reset();
                      setStatus({ kind: "idle" });
                    }}
                  >
                    <Trash2 />
                    清空配置
                  </Button>
                  <span className="ml-auto text-[11px] text-faint">
                    改动即时保存在本机
                  </span>
                </div>

                {status.kind === "ok" && (
                  <div className="flex items-center gap-2 rounded-lg border border-teal/25 bg-teal-soft px-3 py-2 text-[13px] text-teal">
                    <CheckCircle2 className="size-4 shrink-0" />
                    {status.message}
                  </div>
                )}
                {status.kind === "error" && (
                  <div className="flex items-start gap-2 rounded-lg border border-danger/25 bg-danger/5 px-3 py-2 text-[13px] text-danger">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>{status.message}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* 03 模板模式 */}
          <section>
            <SectionLabel index="03" title="没有 Key 也能走完" />
            <Card className="mt-4">
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-ink">
                    <Sparkles className="size-4 text-warm" />
                    模板模式
                  </p>
                  <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-muted">
                    {"不调模型，用问卷 + 结构化填空走完流程，照样生成主页与 PDF。关闭后会优先用你配的模型做解析、追问与文案。"}
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
                    "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                    settings.mode === "template" ? "bg-warm" : "bg-line-strong",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 size-5 rounded-full bg-white shadow transition-transform",
                      settings.mode === "template" ? "translate-x-6" : "translate-x-1",
                    )}
                  />
                </button>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* 侧栏 */}
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>为什么自带 Key</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <ul className="space-y-3 text-[13px] leading-relaxed text-ink-soft">
                <li className="flex gap-2">
                  <span className="font-mono text-teal">01</span>
                  推理费用由你自己承担，平台不代付、不转售额度。
                </li>
                <li className="flex gap-2">
                  <span className="font-mono text-teal">02</span>
                  可以直接用你已有的账号或公司额度。
                </li>
                <li className="flex gap-2">
                  <span className="font-mono text-teal">03</span>
                  想换模型随时换，不需要重新生成内容。
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-navy text-paper">
            <CardContent className="space-y-3 pt-6">
              <ShieldCheck className="size-5 text-teal-soft" />
              <p className="font-display text-[16px]">Key 的三种归宿，没有一种在服务端</p>
              <ul className="space-y-2 text-[12.5px] leading-relaxed text-paper/75">
                <li>· 浏览器 localStorage 里一份</li>
                <li>· 请求头里经过 /api/llm 一次</li>
                <li>· 转发完就没了 —— 不写日志、不落盘、不入库</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>排错顺序</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <ol className="space-y-2.5 text-[13px] leading-relaxed text-ink-soft">
                <li>
                  <span className="font-mono text-[11px] text-warm">401 / 403</span>
                  <br />
                  Key 无效或额度不足，先去厂商后台确认。
                </li>
                <li>
                  <span className="font-mono text-[11px] text-warm">429</span>
                  <br />
                  限流，转发层会自动退避重试一次。
                </li>
                <li>
                  <span className="font-mono text-[11px] text-warm">超时 60s</span>
                  <br />
                  换更快的模型，或检查网络代理。
                </li>
              </ol>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[11px] text-teal">{index}</span>
      <h2 className="text-[15px] font-medium text-ink">{title}</h2>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
