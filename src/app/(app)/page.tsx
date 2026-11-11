import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const steps = [
  {
    index: "01",
    title: "说清你是谁",
    desc: "填姓名和目标岗位，把经历贴进来，或者直接传一份旧简历。",
  },
  {
    index: "02",
    title: "回答几个追问",
    desc: "它会按 STAR 找缺口，一次只问一个问题。答不上来可以跳过。",
  },
  {
    index: "03",
    title: "选文案，调版式",
    desc: "每段给两版，标出哪句来自你的原话。进编辑器换基底、换讲法、拉滑杆，改完直接发布。",
  },
];

export default function HomePage() {
  return (
    <div className="fade-up">
      <section className="max-w-[720px]">
        <h1 className="text-balance text-[34px] leading-[1.16] tracking-[-0.03em] text-ink sm:text-[54px] sm:leading-[1.1]">
          把经历说清楚，
          <br />
          主页自己长出来。
        </h1>

        <p className="mt-6 max-w-[540px] text-[16px] leading-[1.75] text-muted">
          {"面向应届生与实习生。不用会建站，不用会排版，也不用先想清楚经历怎么写——它会把模糊的地方问清楚，再写成能看的话。"}
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            href="/start"
            className={buttonVariants({ variant: "primary", size: "lg" })}
          >
            开始制作
            <ArrowRight />
          </Link>
          <Link
            href="/settings"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            模型设置
          </Link>
        </div>
      </section>

      <section className="mt-20 border-t border-line pt-10">
        <h2 className="text-[19px] text-ink">三步做完</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-10">
          {steps.map((step) => (
            <div key={step.index}>
              <span className="text-[12px] tabular-nums text-faint">{step.index}</span>
              <h3 className="mt-2 text-[15px] font-medium text-ink">{step.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-[1.7] text-muted">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20 grid gap-10 border-t border-line pt-10 sm:grid-cols-2">
        <div>
          <h2 className="text-[19px] text-ink">留在平台上</h2>
          <p className="mt-3 max-w-[420px] text-[14px] leading-[1.75] text-muted">
            {"发布后拿到一条链接，回编辑器改，即时生效。适合投简历、发给 HR 或内推人。"}
          </p>
        </div>
        <div>
          <h2 className="text-[19px] text-ink">打包带走</h2>
          <p className="mt-3 max-w-[420px] text-[14px] leading-[1.75] text-muted">
            {"导出静态包或 Docker 部署包，放到自己的服务器上。服务器、域名、证书都自理。"}
          </p>
        </div>
      </section>

      <section className="mt-16 rounded-xl bg-subtle px-6 py-5">
        <p className="text-[13.5px] leading-[1.75] text-ink-2">
          {"不用注册。一条编辑链接就是身份，草稿存在你的浏览器里，项目可以导出成 .zip 带走。"}
        </p>
      </section>

      <section className="mt-16 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-[15px] text-ink">从一段乱糟糟的经历开始就行。</p>
        <Link href="/start" className={buttonVariants({ variant: "primary" })}>
          开始制作
          <ArrowRight />
        </Link>
      </section>
    </div>
  );
}
