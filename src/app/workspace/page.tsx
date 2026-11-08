import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Circle, Database, KeyRound } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CreateProject } from "@/components/workspace/create-project";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "工作台",
};

const phases = [
  {
    id: "一期",
    name: "骨架 · 数据模型 · 模型接入",
    state: "done" as const,
    detail: ["Next.js 15 应用骨架", "十张表 + 迁移", "Key 设置页与 /api/llm 转发"],
  },
  {
    id: "二期",
    name: "内容闭环",
    state: "todo" as const,
    detail: ["简历解析与抽取", "缺口分析与追问", "文案确认（两版 + 溯源）"],
  },
  {
    id: "三期",
    name: "呈现闭环",
    state: "todo" as const,
    detail: ["五套模板与设计令牌", "结构化编辑", "PDF 导出"],
  },
  {
    id: "四期",
    name: "画布与导出",
    state: "todo" as const,
    detail: ["自由画布与拖拽", "平台托管的分享页", "静态包 / Docker 部署包"],
  },
];

const tables = [
  ["projects", "匿名项目，编辑链接的钥匙"],
  ["resumes", "一份简历的容器"],
  ["resume_blocks", "内容块，带溯源与置信度"],
  ["chat_sessions", "一次追问会话"],
  ["messages", "对话记录"],
  ["pages", "呈现层，与内容分离"],
  ["page_versions", "版本与回滚"],
  ["assets", "头像与作品图"],
  ["shares", "平台托管的分享页"],
  ["exports", "静态包 / 动态包记录"],
];

async function readCounts() {
  try {
    const [projects, resumes, blocks, sessions, messages, pages, versions, assets, shares, exports] =
      await Promise.all([
        db.project.count(),
        db.resume.count(),
        db.resumeBlock.count(),
        db.chatSession.count(),
        db.message.count(),
        db.page.count(),
        db.pageVersion.count(),
        db.asset.count(),
        db.share.count(),
        db.export.count(),
      ]);
    return {
      ok: true as const,
      counts: {
        projects,
        resumes,
        resume_blocks: blocks,
        chat_sessions: sessions,
        messages,
        pages,
        page_versions: versions,
        assets,
        shares,
        exports,
      },
    };
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : "数据库连不上",
    };
  }
}

export default async function WorkspacePage() {
  const result = await readCounts();
  const counts = result.ok ? result.counts : null;

  return (
    <div className="fade-up space-y-12">
      <header className="max-w-2xl">
        <p className="eyebrow">工作台 · 一期</p>
        <h1 className="mt-3 font-display text-[34px] leading-tight text-navy">
          地基打完了，先自检
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          这一期只有三件事：应用骨架、十张表、模型接入。
          下面的数字是真的从数据库里读出来的——不是写死的文案。
        </p>
      </header>

      {/* Roadmap */}
      <section>
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">实施顺序</p>
          <p className="font-mono text-[10px] text-faint">4 phases</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {phases.map((phase) => (
            <div
              key={phase.id}
              className={`rounded-xl border p-5 ${
                phase.state === "done"
                  ? "border-teal/30 bg-teal-soft/50"
                  : "border-line bg-surface"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-faint">{phase.id}</span>
                {phase.state === "done" ? (
                  <CheckCircle2 className="size-4 text-teal" />
                ) : (
                  <Circle className="size-4 text-line-strong" />
                )}
              </div>
              <p className="mt-3 font-display text-[16px] leading-snug text-ink">
                {phase.name}
              </p>
              <ul className="mt-3 space-y-1.5">
                {phase.detail.map((item) => (
                  <li key={item} className="text-[12px] leading-relaxed text-muted">
                    · {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* Tables */}
        <section>
          <div className="flex items-center gap-2">
            <Database className="size-4 text-teal" />
            <h2 className="text-[15px] font-medium text-ink">十张表</h2>
            {result.ok ? (
              <Badge tone="teal">已连通</Badge>
            ) : (
              <Badge tone="danger">未连通</Badge>
            )}
          </div>

          {result.ok ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
              {tables.map(([name, desc], index) => {
                const count = counts?.[name as keyof typeof counts] ?? 0;
                return (
                  <div
                    key={name}
                    className={`grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-2.5 ${
                      index !== 0 ? "border-t border-line" : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-baseline gap-3">
                      <span className="font-mono text-[12px] text-ink">{name}</span>
                      <span className="truncate text-[11.5px] text-faint">{desc}</span>
                    </div>
                    <span className="font-mono text-[12px] tabular-nums text-muted">
                      {count}
                    </span>
                  </div>
                );
              })}
              <div className="flex justify-between border-t border-line bg-paper-deep/50 px-4 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  GET /api/health
                </span>
                <span className="font-mono text-[10px] text-teal">ok</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-danger/25 bg-danger/5 p-5">
              <p className="text-[13px] font-medium text-danger">数据库还没初始化</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
                {result.message}
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-navy px-3 py-2 font-mono text-[11px] text-paper">
                npm run db:push
              </pre>
            </div>
          )}
        </section>

        {/* Actions */}
        <section className="space-y-5">
          <div className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-[15px] font-medium text-ink">建个项目试试</h2>
            <div className="mt-3">
              <CreateProject />
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-warm" />
              <h2 className="text-[15px] font-medium text-ink">模型接入</h2>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              这一期的另一半在设置页：五家预设、自定义地址、测试连接、
              同源转发。Key 不落库。
            </p>
            <Link
              href="/settings"
              className={buttonVariants({ variant: "outline", size: "sm" }) + " mt-4"}
            >
              去配置模型
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
