import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { CreateProject } from "@/components/workspace/create-project";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "工作台",
};

const phases = [
  { id: "一期", name: "骨架 · 数据模型 · 模型接入", done: true },
  { id: "二期", name: "内容闭环：解析 → 追问 → 文案", done: false },
  { id: "三期", name: "呈现闭环：模板 · 编辑 · PDF", done: false },
  { id: "四期", name: "画布 · 平台发布 · 部署包", done: false },
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
    <div className="fade-up max-w-[880px]">
      <header>
        <div className="flex items-center gap-2.5">
          <h1 className="text-[30px] leading-tight tracking-[-0.02em] text-ink">
            工作台
          </h1>
          {result.ok ? (
            <Badge tone="success">数据库已连通</Badge>
          ) : (
            <Badge tone="danger">未连通</Badge>
          )}
        </div>
        <p className="mt-3 max-w-[600px] text-[14.5px] leading-[1.75] text-muted">
          {"这一期只有三件事：应用骨架、十张表、模型接入。下面这些数字是真的从数据库里读出来的。"}
        </p>
      </header>

      <section className="mt-10">
        <h2 className="text-[15px] font-medium text-ink">实施顺序</h2>
        <ul className="mt-3">
          {phases.map((phase) => (
            <li
              key={phase.id}
              className="flex items-center gap-3 border-t border-line py-2.5 last:border-b"
            >
              <span
                className={
                  phase.done
                    ? "size-1.5 rounded-full bg-success"
                    : "size-1.5 rounded-full bg-line-strong"
                }
              />
              <span className="w-10 text-[12.5px] text-faint">{phase.id}</span>
              <span className="text-[13.5px] text-ink">{phase.name}</span>
              {phase.done && <span className="ml-auto text-[12px] text-muted">已完成</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-medium text-ink">十张表</h2>
          <span className="text-[12px] text-faint">GET /api/health</span>
        </div>

        {result.ok ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-line">
            {tables.map(([name, desc], index) => {
              const count = counts?.[name as keyof typeof counts] ?? 0;
              return (
                <div
                  key={name}
                  className={
                    "grid grid-cols-[1fr_auto] items-baseline gap-4 px-4 py-2.5 " +
                    (index !== 0 ? "border-t border-line" : "")
                  }
                >
                  <div className="flex min-w-0 items-baseline gap-3">
                    <span className="font-mono text-[12px] text-ink">{name}</span>
                    <span className="truncate text-[12px] text-faint">{desc}</span>
                  </div>
                  <span className="text-[12px] tabular-nums text-muted">{count}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-danger/25 bg-danger-soft/60 px-4 py-4">
            <p className="text-[13px] text-danger">数据库还没初始化：{result.message}</p>
            <pre className="mt-2 rounded bg-bg px-2 py-1.5 font-mono text-[12px] text-ink">
              npm run db:push
            </pre>
          </div>
        )}
      </section>

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="text-[15px] font-medium text-ink">建个项目试试</h2>
        <div className="mt-3 max-w-[560px]">
          <CreateProject />
        </div>
      </section>

      <p className="mt-8 text-[13px] text-muted">
        {"下一步是二期：解析 → 追问 → 文案确认。"}
      </p>
    </div>
  );
}
