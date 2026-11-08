import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const modules = [
  { id: "M0", name: "模型接入", desc: "五家预设 + 自定义地址，测试连接，Key 只在本地", priority: "P0", phase: "一期", done: true },
  { id: "M1", name: "信息采集", desc: "分步问卷，上传旧简历解析填充，逐字段可改", priority: "P0", phase: "二期", done: false },
  { id: "M2", name: "对话式追问", desc: "按 STAR 找缺口，一次只问一个问题，可跳过", priority: "P0", phase: "二期", done: false },
  { id: "M3", name: "文案生成", desc: "每段两版，并标出哪句来自你的原话", priority: "P0", phase: "二期", done: false },
  { id: "M4", name: "主页生成", desc: "九个模块自由组合，内容与呈现分离", priority: "P0", phase: "三期", done: false },
  { id: "M5", name: "风格系统", desc: "五套模板 + 文字描述生成设计令牌", priority: "P0", phase: "三期", done: false },
  { id: "M6", name: "可视化编辑", desc: "改文字 → 调字号颜色 → 画布拖拽缩放", priority: "P0", phase: "四期", done: false },
  { id: "M7", name: "平台发布", desc: "子域名分享链接，可选访问密码、不收录", priority: "P0", phase: "四期", done: false },
  { id: "M8", name: "导出与自托管", desc: "静态包或 Docker 动态站，用户自备服务器", priority: "P0", phase: "四期", done: false },
  { id: "M9", name: "AI 持续辅助", desc: "按 JD 定制、中英互译、润色", priority: "P1", phase: "以后", done: false },
];

const shipped = [
  {
    index: "01",
    title: "应用骨架",
    desc: "Next.js 15 + TypeScript，纸白色界面，三个页面：总览、工作台、模型接入。",
  },
  {
    index: "02",
    title: "十张表",
    desc: "项目、简历、内容块、会话、消息、页面、版本、素材、分享、导出。没有 users，也没有 keys。",
  },
  {
    index: "03",
    title: "模型接入",
    desc: "自带 Key，五家预设任选；请求经同源转发，Key 只在请求头里过一遍。",
  },
];

export default function HomePage() {
  return (
    <div className="fade-up">
      {/* Hero */}
      <section className="max-w-[720px]">
        <p className="flex items-center gap-2 text-[13px] text-muted">
          <span className="size-1.5 rounded-full bg-success" />
          一期已上线
          <span className="text-faint">应用骨架 · 十张表 · 模型接入</span>
        </p>

        <h1 className="mt-6 text-balance text-[32px] leading-[1.18] tracking-[-0.03em] text-ink sm:text-[54px] sm:leading-[1.12]">
          不用会建站，
          <br />
          也能有一个像样的主页。
        </h1>

        <p className="mt-6 max-w-[560px] text-[16px] leading-[1.75] text-muted">
          {"面向应届生与实习生的主页生成器。把旧简历丢进来，或者回答几个问题，剩下的交给它。产物可以留在平台上拿一条链接，也可以打包带走自己部署。"}
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            href="/settings"
            className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
          >
            配置模型
            <ArrowRight />
          </Link>
          <Link
            href="/workspace"
            className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
          >
            看工作台
          </Link>
          <span className="text-[12.5px] text-faint">不填 Key 也能用</span>
        </div>
      </section>

      {/* Shipped */}
      <section className="mt-20 border-t border-line pt-10">
        <h2 className="text-[19px] text-ink">一期做完的三件事</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-10">
          {shipped.map((item) => (
            <div key={item.index}>
              <span className="text-[12px] tabular-nums text-faint">{item.index}</span>
              <h3 className="mt-2 text-[15px] font-medium text-ink">{item.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-[1.7] text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section className="mt-20 border-t border-line pt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[19px] text-ink">能力地图</h2>
          <p className="text-[12.5px] text-muted">十个模块，九个 P0</p>
        </div>

        <ul className="mt-6">
          {modules.map((module) => (
            <li
              key={module.id}
              className="border-t border-line py-3.5"
            >
              <div className="sm:flex sm:items-baseline sm:gap-6">
                <div className="flex items-center gap-2.5 sm:w-[180px] sm:shrink-0">
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      module.done ? "bg-success" : "bg-line-strong",
                    )}
                  />
                  <span className="text-[14px] text-ink">{module.name}</span>
                  <span className="text-[10.5px] text-faint">{module.id}</span>
                  <span className="ml-auto text-[12px] text-faint sm:hidden">
                    {module.phase}
                  </span>
                </div>
                <p className="mt-1 pl-[22px] text-[13px] text-muted sm:mt-0 sm:flex-1 sm:pl-0">
                  {module.desc}
                </p>
                <span className="hidden w-[44px] shrink-0 text-right text-[12px] text-faint sm:block">
                  {module.phase}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Deliverables */}
      <section className="mt-20 grid gap-10 border-t border-line pt-10 sm:grid-cols-2">
        <div>
          <p className="text-[12.5px] text-muted">A · 平台托管</p>
          <h2 className="mt-2 text-[20px] text-ink">一条链接</h2>
          <p className="mt-3 max-w-[420px] text-[14px] leading-[1.75] text-muted">
            {"发布到平台子域名，回编辑器改，即时生效。适合投简历、发给 HR 或内推人。可选访问密码与不收录索引。"}
          </p>
        </div>
        <div>
          <p className="text-[12.5px] text-muted">B · 自托管部署包</p>
          <h2 className="mt-2 text-[20px] text-ink">一个站点包</h2>
          <p className="mt-3 max-w-[420px] text-[14px] leading-[1.75] text-muted">
            {"静态包丢到任意托管，或 Docker 一条命令起动态站。服务器、域名、证书一律自理——平台只交付可部署的产物。"}
          </p>
        </div>
      </section>

      {/* No account */}
      <section className="mt-16 rounded-xl bg-subtle px-6 py-5">
        <p className="text-[13.5px] leading-[1.75] text-ink-2">
          {"不做账号：一条编辑链接就是身份。草稿存在浏览器本地，项目可导出为 .zip。代价是链接丢了就找不回——这是省掉账号体系的必然成本。"}
        </p>
      </section>

      {/* CTA */}
      <section className="mt-16 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-[15px] text-ink">
          先接上你自己的模型，再决定要不要信它。
        </p>
        <div className="flex gap-3">
          <Link href="/settings" className={buttonVariants({ variant: "primary" })}>
            去配置
          </Link>
          <Link href="/workspace" className={buttonVariants({ variant: "ghost" })}>
            自检数据层
          </Link>
        </div>
      </section>
    </div>
  );
}
