"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSettings } from "@/store/settings-store";
import { useSettingsHydration } from "@/store/use-settings-hydration";
import { useServerKey } from "@/lib/llm/use-server-key";

const links = [
  { href: "/", label: "首页" },
  { href: "/start", label: "开始制作" },
  { href: "/settings", label: "模型设置" },
];

const providerNames: Record<string, string> = {
  deepseek: "DeepSeek",
  qwen: "通义千问",
  zhipu: "智谱 GLM",
  kimi: "Kimi",
  openai: "OpenAI",
  custom: "自定义",
};

export function SiteNav() {
  const pathname = usePathname();
  const { providerId, apiKey, mode, hydrated } = useSettings();
  const serverKey = useServerKey();
  useSettingsHydration();

  const connected = hydrated && mode === "llm" && (Boolean(apiKey) || serverKey);
  const status = !hydrated
    ? "读取配置"
    : mode === "template"
      ? "模板模式"
      : connected
        ? providerNames[providerId] ?? providerId
        : "未接 Key";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="container-page flex h-14 items-center justify-between gap-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-[16px] font-semibold tracking-tight text-ink">
            履道
          </span>
          <span className="hidden text-[11px] text-faint sm:inline">
            AI 个人主页
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-[13.5px] transition-colors",
                  active ? "text-ink" : "text-muted hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/settings"
          className="flex items-center gap-1.5 text-[12.5px] text-muted transition-colors hover:text-ink"
          title="模型接入状态"
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              connected ? "bg-success" : "bg-line-strong",
            )}
          />
          {status}
        </Link>
      </div>
    </header>
  );
}
