import Link from "next/link";
import { ArrowRight, ArrowUpRight, Circle, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const flow = [
  { label: "问卷 / 旧简历", phase: "二期" },
  { label: "AI 追问", phase: "二期" },
  { label: "文案确认", phase: "二期" },
  { label: "模板与风格", phase: "三期" },
  { label: "画布编辑", phase: "四期" },
  { label: "发布 / 导出", phase: "四期" },
];

const modules = [
  { id: "M0", name: "模型接入", desc: "五家预设 + 自定义地址，测试连接，Key 只在本地", priority: "P0", state: "done", phase: "一期" },
  { id: "M1", name: "信息采集", desc: "分步问卷，上传旧简历解析填充，逐字段可改", priority: "P0", state: "todo", phase: "二期" },
  { id: "M2", name: "对话式追问", desc: "按 STAR 找缺口，一次只问一个问题，可跳过", priority: "P0", state: "todo", phase: "二期" },
  { id: "M3", name: "文案生成", desc: "每段两版，并标出哪句来自你的原话", priority: "P0", state: "todo", phase: "二期" },
  { id: "M4", name: "主页生成", desc: "九个模块自由组合，内容与呈现分离", priority: "P0", state: "todo", phase: "三期" },
  { id: "M5", name: "风格系统", desc: "五套模板 + 文字描述生成设计令牌", priority: "P0", state: "todo", phase: "三期" },
  { id: "M6", name: "可视化编辑", desc: "改文字 → 调字号颜色 → 画布拖拽缩放", priority: "P0", state: "todo", phase: "四期" },
  { id: "M7", name: "平台发布", desc: "子域名分享链接，可选访问密码、不收录", priority: "P0", state: "todo", phase: "四期" },
  { id: "M8", name: "导出与自托管", desc: "静态包或 Docker 动态站，用户自备服务器", priority: "P0", state: "todo", phase: "四期" },
  { id: "M9", name: "AI 持续辅助", desc: "按 JD 定制、中英互译、润色", priority: "P1", state: "todo", phase: "以后" },
];

export default function HomePage() {
  return (
    <div className="fade-up space-y-20 pb-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[20px] border border-line bg-surface">
        <div className="paper-grid absolute inset-0 opacity-60" aria-hidden />
        <div className="relative px-6 py-14 sm:px-12 sm:py-20">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="navy">一期 · 骨架 / 数据模型 / 模型接入</Badge>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
              v0.1.0
            </span>
          </div>

          <h1 className="mt-7 font-display text-[30px] leading-[1.2] text-navy sm:text-[52px] sm:leading-[1.18]">
            不用会建站，
            <br />
            一次对话把经历问清楚。
          </h1>

          <p className="mt-6 max-w-[52ch] text-[15px] leading-[1.85] text-ink-soft">
            {"面向应届生与实习生的个人主页生成器。不用会排版，也不用先想清楚经历怎么写——把旧简历丢进来，或者回答几个问题，剩下的交给它。产物可以留在平台上拿一条链接，也可以打包带走自己部署。"}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/settings"
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              配置模型
              <ArrowRight />
            </Link>
            <Link
              href="/workspace"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              看工作台
            </Link>
            <span className="ml-1 text-[12px] text-faint">
              不填 Key 也能用 · 模板模式
            </span>
          </div>
        </div>
      </section>

      {/* Flow */}
      <section>
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">一条主流程</p>
          <p className="font-mono text-[10px] text-faint">01 → 06</p>
        </div>
        <ol className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {flow.map((step, index) => (
            <li
              key={step.label}
              className="group relative rounded-xl border border-line bg-surface px-4 py-4"
            >
              <span className="font-mono text-[10px] text-faint">
                0{index + 1}
              </span>
              <p className="mt-2 text-[13.5px] font-medium leading-snug text-ink">
                {step.label}
              </p>
              <p className="mt-1 font-mono text-[10px] text-faint">{step.phase}</p>
              {index < flow.length - 1 && (
                <ArrowRight className="absolute -right-[13px] top-1/2 hidden size-3.5 -translate-y-1/2 text-line-strong lg:block" />
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Modules */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">能力地图</p>
            <h2 className="mt-2 font-display text-[26px] text-navy">
              十个模块，九个 P0
            </h2>
          </div>
          <p className="max-w-[34ch] text-[12.5px] leading-relaxed text-muted">
            {"一期只把地基打完：骨架、十张表、模型接入。往上的内容与呈现能力按四期推进。"}
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-[14px] border border-line bg-surface">
          {modules.map((module, index) => (
            <div
              key={module.id}
              className={`grid grid-cols-[56px_1fr_auto] items-start gap-4 px-5 py-4 sm:grid-cols-[64px_180px_1fr_auto] ${
                index !== 0 ? "border-t border-line" : ""
              } ${module.state === "done" ? "bg-teal-soft/40" : ""}`}
            >
              <span className="font-mono text-[11px] text-faint">{module.id}</span>
              <div className="flex items-center gap-2">
                {module.state === "done" ? (
                  <CircleDot className="size-3.5 text-teal" />
                ) : (
                  <Circle className="size-3.5 text-line-strong" />
                )}
                <span className="text-[13.5px] font-medium text-ink">
                  {module.name}
                </span>
              </div>
              <p className="col-span-3 text-[12.5px] leading-relaxed text-muted sm:col-span-1 sm:text-[13px]">
                {module.desc}
              </p>
              <div className="col-start-3 row-start-1 flex items-center gap-2 sm:col-auto sm:row-auto">
                <Badge tone={module.state === "done" ? "teal" : "neutral"}>
                  {module.priority}
                </Badge>
                <span className="font-mono text-[10px] text-faint">
                  {module.phase}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Two deliverables */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[16px] border border-line bg-surface p-7">
          <p className="eyebrow">A · 平台托管</p>
          <h3 className="mt-3 font-display text-[22px] text-navy">一条链接</h3>
          <p className="mt-3 text-[13.5px] leading-[1.8] text-ink-soft">
            {"发布到平台子域名，回编辑器改，即时生效。适合投简历、发给 HR 或内推人。可选访问密码与不收录索引。"}
          </p>
        </div>
        <div className="rounded-[16px] border border-ink/10 bg-navy p-7 text-paper">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/50">
            B · 自托管部署包
          </p>
          <h3 className="mt-3 font-display text-[22px]">一个站点包</h3>
          <p className="mt-3 text-[13.5px] leading-[1.8] text-paper/75">
            {"静态包丢到任意托管，或 Docker 一条命令起动态站。服务器、域名、证书一律自理——平台只交付可部署的产物。"}
          </p>
          <p className="mt-5 font-mono text-[11px] text-teal-soft/80">
            site/ · server.js · content/ · Dockerfile · README.md
          </p>
        </div>
      </section>

      {/* No account */}
      <section className="rounded-[16px] border border-line bg-paper-deep/60 p-7">
        <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
          <div>
            <p className="eyebrow">不做账号</p>
            <h3 className="mt-2 font-display text-[20px] text-navy">
              一条编辑链接就是身份
            </h3>
          </div>
          <ul className="grid gap-2.5 text-[13px] leading-relaxed text-ink-soft sm:grid-cols-2">
            <li>· 打开即用，无注册，草稿存在浏览器本地</li>
            <li>· 生成后给一条含随机密钥的链接，自己收藏</li>
            <li>· 项目可导出为 .zip，换设备接着改</li>
            <li>· 丢了链接就找不回——这是省掉账号的必然代价</li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="flex flex-col items-start justify-between gap-5 border-t border-line pt-8 sm:flex-row sm:items-center">
        <div>
          <p className="font-display text-[20px] text-navy">
            先接上你自己的模型，再决定要不要信它。
          </p>
          <p className="mt-1.5 text-[13px] text-muted">
            Key 只留在这台浏览器里；填了随时能删。
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/settings" className={buttonVariants({ variant: "primary" })}>
            去配置
            <ArrowUpRight />
          </Link>
          <Link href="/workspace" className={buttonVariants({ variant: "ghost" })}>
            自检数据层
          </Link>
        </div>
      </section>
    </div>
  );
}
