"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSettings } from "@/store/settings-store";
import { useSettingsHydration } from "@/store/use-settings-hydration";

const links = [
  { href: "/", label: "总览" },
  { href: "/workspace", label: "工作台" },
  { href: "/settings", label: "模型接入" },
];

export function SiteNav() {
  const pathname = usePathname();
  const { providerId, apiKey, mode, hydrated } = useSettings();
  useSettingsHydration();

  const label = !hydrated
    ? "读取配置"
    : mode === "template"
      ? "模板模式"
      : !apiKey
        ? "未接 Key"
        : providerLabel(providerId);

  const live = hydrated && Boolean(apiKey) && mode === "llm";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link href="/" className="group flex items-baseline gap-2.5">
          <span className="font-display text-[19px] tracking-tight text-navy">
            履道
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-faint sm:inline">
            resume → homepage
          </span>
        </Link>

        <nav className="flex items-center gap-1">
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
                  "rounded-full px-3.5 py-1.5 text-[13px] transition-colors",
                  active
                    ? "bg-paper-deep font-medium text-ink"
                    : "text-muted hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/settings"
          className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] text-muted transition-colors hover:border-line-strong hover:text-ink"
          title="模型接入状态"
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              live ? "bg-teal" : "bg-faint",
            )}
          />
          <span className="font-mono uppercase tracking-[0.1em]">{label}</span>
        </Link>
      </div>
    </header>
  );
}

function providerLabel(id: string) {
  const map: Record<string, string> = {
    deepseek: "DeepSeek",
    qwen: "通义千问",
    zhipu: "智谱",
    kimi: "Kimi",
    openai: "OpenAI",
    custom: "自定义",
  };
  return map[id] ?? id;
}
