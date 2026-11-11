import type { CSSProperties, ReactNode } from "react";
import type { SiteData, SiteSection } from "@/lib/site-data";
import { isSkillList } from "@/lib/site-data";
import type { BaseTokens, Recipe } from "@/lib/templates/types";
import { Grain, GradientGrid } from "@/components/primitives/static";
import { IdentityMark } from "./identity-mark";
import { Typewriter } from "@/components/primitives/motion";

/**
 * 渲染层：一个槽位一个组件，取哪套讲法由 recipe.layout 决定。
 * 所有颜色与字号都来自 `var(--b-*)`，所以同一段代码在六套基底里是六种样子。
 *
 * 2026-11 改版：所有槽位都改成「左栏 + 右正文」的两栏骨架，
 * 首屏按基底给六种完全不同的排法，正文按条目给明确的字号与分隔。
 */

type SlotProps = {
  base: BaseTokens;
  data: SiteData;
  recipe: Recipe;
  /** 这个槽位要收的内容；不传就用全量 */
  sections?: SiteSection[];
  /** 这个块之前已经用掉几个编号，整页共用一套序号 */
  startIndex?: number;
};

const muted = { color: "var(--b-muted)" } as CSSProperties;
const mono = { fontFamily: "var(--b-font-mono)" } as CSSProperties;

/* ————————————————— 公共零件 ————————————————— */

/** 折行时不把短词拆开，中文断行更干净 */
const pretty: CSSProperties = { textWrap: "pretty" };

function Rule({ style }: { style?: CSSProperties }) {
  return <div className="w-full" style={{ height: 1, background: "var(--b-line)", ...style }} />;
}

/** 从内容里推出现在在哪、读过什么——首屏那句「现在」 */
export function deriveWhere(data: SiteData) {
  const job = data.sections.find((s) => s.kind === "experience");
  const edu = data.sections.find((s) => s.kind === "education");
  const now = job
    ? [job.title, job.org].filter(Boolean).join(" · ")
    : edu
      ? [edu.org, "在读"].filter(Boolean).join(" · ")
      : "";
  return { now, edu: edu?.org ?? "" };
}

function Eyebrow({
  children,
  dot = true,
  className = "",
}: {
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <p className={`site-eyebrow ${className}`}>
      {dot && <span className="site-dot" aria-hidden />}
      {children}
    </p>
  );
}

/** 首屏底部那排事实 */
function Facts({ data }: { data: SiteData }) {
  const { now } = deriveWhere(data);
  const items = [
    data.email ? { k: "邮箱", v: data.email, href: `mailto:${data.email}` } : null,
    data.city ? { k: "城市", v: data.city } : null,
    now ? { k: "现在", v: now } : null,
  ].filter(Boolean) as { k: string; v: string; href?: string }[];

  if (items.length === 0) return null;

  return (
    <div className="site-facts">
      {items.map((item) => (
        <div key={item.k}>
          <span>{item.k}</span>
          {item.href ? (
            <b>
              <a
                href={item.href}
                className="underline-offset-4 hover:underline"
                style={{ textDecorationColor: "var(--b-line)" }}
              >
                {item.v}
              </a>
            </b>
          ) : (
            <b>{item.v}</b>
          )}
        </div>
      ))}
    </div>
  );
}

/* ————————————————— 首屏 · 六种排法 ————————————————— */

export function HeroColumn({ base, data }: SlotProps) {
  return (
    <header className="site-hero">
      <div className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_236px]">
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <Eyebrow>{data.city || "个人主页"}</Eyebrow>
            <span
              className="site-mono"
              style={{ ...mono, ...muted, fontSize: "var(--b-size-meta)", letterSpacing: "0.16em" }}
            >
              PORTFOLIO / {new Date().getFullYear()}
            </span>
          </div>

          <h1 className="site-h1 mt-7">{data.name || "你的名字"}</h1>
          <div
            aria-hidden
            className="mt-6"
            style={{ width: 52, height: 4, background: "var(--b-accent)" }}
          />

          {data.headline && (
            <p className="site-standfirst mt-6" style={{ color: "var(--b-ink-2)" }}>
              {data.headline}
            </p>
          )}
        </div>

        <IdentityMark
          base={base}
          seed={data.name}
          caption={data.city || "身份"}
          className="hidden lg:block"
        />
      </div>

      <div className="mt-10 mb-5">
        <Rule style={{ background: "var(--b-ink)", opacity: 0.14 }} />
      </div>
      <Facts data={data} />
    </header>
  );
}

export function HeroPrompt({ data }: SlotProps) {
  const { now } = deriveWhere(data);
  const prompt = (
    <span style={{ color: "var(--b-accent)" }} aria-hidden>
      $
    </span>
  );

  return (
    <header className="site-hero">
      <div
        className="site-mono"
        style={{ fontSize: "var(--b-size-small)", lineHeight: 2 }}
      >
        <p>
          {prompt} <span style={muted}>whoami</span>
        </p>
        <h1 className="site-h1 mt-1">
          {data.name || "你的名字"}
        </h1>

        {data.headline && (
          <p className="mt-5">
            {prompt} <span style={muted}>cat headline.txt</span>
            <br />
            <span style={{ color: "var(--b-accent)" }}>
              <Typewriter text={data.headline} />
            </span>
          </p>
        )}

        {(now || data.city) && (
          <p className="mt-5">
            {prompt} <span style={muted}>status</span>
            <br />
            <span style={{ color: "var(--b-ink-2)" }}>
              <span
                className="inline-block align-middle"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: "var(--b-accent)",
                  marginRight: 8,
                }}
                aria-hidden
              />
              {[now, data.city].filter(Boolean).join(" · ")}
            </span>
            <span className="site-caret" aria-hidden />
          </p>
        )}

        {data.email && (
          <p className="mt-5">
            {prompt} <span style={muted}>mail</span>
            <br />
            <a
              href={`mailto:${data.email}`}
              className="underline underline-offset-4"
              style={{ color: "var(--b-ink)", textDecorationColor: "var(--b-line)" }}
            >
              {data.email}
            </a>
          </p>
        )}
      </div>
    </header>
  );
}

export function HeroMasthead({ base, data }: SlotProps) {
  return (
    <header className="site-hero">
      <div
        className="site-mono flex flex-wrap items-baseline justify-between gap-2"
        style={{ ...mono, ...muted, fontSize: "var(--b-size-meta)", letterSpacing: "0.24em" }}
      >
        <span>VOL. 01 — 个人主页</span>
        <span>{[data.city, "2026"].filter(Boolean).join(" · ")}</span>
      </div>

      <div className="mt-3 mb-6">
        <div className="site-rule-double" />
      </div>

      <div className="grid items-end gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_196px]">
        <div>
          <h1 className="site-h1" style={{ lineHeight: 1.0 }}>
            {data.name || "你的名字"}
          </h1>

          {data.headline && (
            <p
              className="mt-6"
              style={{
                fontFamily: "var(--b-font-display)",
                fontSize: "clamp(19px, 2vw, 26px)",
                lineHeight: 1.5,
                color: "var(--b-ink-2)",
                maxWidth: "26em",
                ...pretty,
              }}
            >
              {data.headline}
            </p>
          )}
        </div>

        <IdentityMark
          base={base}
          seed={data.name}
          caption="封面"
          className="hidden lg:block"
        />
      </div>

      <div className="mt-8 mb-5">
        <div className="site-rule-double" />
      </div>
      <Facts data={data} />
    </header>
  );
}

export function HeroPlate({ base, data }: SlotProps) {
  return (
    <header className="site-hero">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow dot={false}>{data.city || "GALLERY"}</Eyebrow>
          <h1 className="site-h1 mt-4">{data.name || "你的名字"}</h1>
        </div>
        {data.headline && (
          <p
            className="max-w-[26ch] pb-2 text-right"
            style={{ ...muted, fontSize: "var(--b-size-sub)", ...pretty }}
          >
            {data.headline}
          </p>
        )}
      </div>

      <div
        className="relative mt-9 overflow-hidden p-8 sm:p-12"
        style={{
          background: "var(--b-band)",
          borderRadius: "var(--b-radius)",
          border: "1px solid var(--b-line)",
        }}
      >
        <GradientGrid opacity={0.65} />
        {base.primitives.includes("particles") ? null : null}
        <div className="relative">
          <p
            className="site-display"
            style={{
              fontSize: "clamp(24px, 3.2vw, 42px)",
              lineHeight: 1.22,
              letterSpacing: "var(--b-tracking-display)",
              maxWidth: "20em",
              ...pretty,
            }}
          >
            {data.headline || data.name || "个人主页"}
          </p>
          <p
            className="site-mono mt-8"
            style={{ ...mono, ...muted, fontSize: "var(--b-size-meta)", letterSpacing: "0.18em" }}
          >
            01 — PORTFOLIO / {new Date().getFullYear()}
          </p>
        </div>
      </div>

      <div className="mt-7">
        <Facts data={data} />
      </div>
    </header>
  );
}

export function HeroSplit({ base, data }: SlotProps) {
  return (
    <header className="site-hero">
      <div className="grid gap-8 lg:grid-cols-[1.45fr_0.55fr]">
        <div
          className="relative overflow-hidden p-7 sm:p-10"
          style={{
            background: "var(--b-accent-soft)",
            borderRadius: "calc(var(--b-radius) + 6px)",
            border: "1px solid color-mix(in srgb, var(--b-accent) 22%, transparent)",
          }}
        >
          <GradientGrid opacity={0.5} />
          <div className="relative grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_176px]">
            <div>
              <Eyebrow>{data.headline || "头像 / 一句话"}</Eyebrow>
              <h1 className="site-h1 mt-6">{data.name || "你的名字"}</h1>
              {data.headline && (
                <p
                  className="mt-5"
                  style={{
                    fontSize: "var(--b-size-lead)",
                    lineHeight: 1.6,
                    color: "var(--b-ink-2)",
                    maxWidth: "24em",
                    ...pretty,
                  }}
                >
                  {data.headline}
                </p>
              )}
            </div>
            <IdentityMark
              base={base}
              seed={data.name}
              className="hidden lg:block"
            />
          </div>
        </div>

        <div className="flex flex-col justify-between gap-8">
          <Facts data={data} />
          <div
            className="flex items-center gap-2"
            style={{ ...mono, fontSize: "var(--b-size-meta)", color: "var(--b-muted)" }}
          >
            <span className="site-dot" aria-hidden />
            开放交流
          </div>
        </div>
      </div>
    </header>
  );
}

export function HeroBento({ base, data }: SlotProps) {
  const { now } = deriveWhere(data);
  const tile =
    "relative overflow-hidden p-6";

  return (
    <header className="site-hero">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className={`${tile} sm:col-span-2 lg:col-span-2 lg:row-span-2`}
          style={{
            background: "var(--b-surface)",
            border: "1px solid var(--b-line)",
            borderRadius: "var(--b-radius)",
          }}
        >
          <Eyebrow>{data.city || "个人主页"}</Eyebrow>
          <h1 className="site-h1 mt-6" style={{ fontSize: "clamp(38px, 5.2vw, 68px)" }}>
            {data.name || "你的名字"}
          </h1>
          {data.headline && (
            <p
              className="mt-4"
              style={{ fontSize: "var(--b-size-lead)", color: "var(--b-ink-2)", ...pretty }}
            >
              {data.headline}
            </p>
          )}
          {data.summary && (
            <p
              className="mt-6"
              style={{
                fontSize: "var(--b-size-sub)",
                lineHeight: 1.75,
                color: "var(--b-muted)",
                maxWidth: "34ch",
                ...pretty,
              }}
            >
              {data.summary}
            </p>
          )}
        </div>

        <div
          className={tile}
          style={{
            background: "var(--b-accent-soft)",
            borderRadius: "var(--b-radius)",
            border: "1px solid color-mix(in srgb, var(--b-accent) 20%, transparent)",
          }}
        >
          <span className="site-eyebrow" style={{ color: "var(--b-accent)" }}>
            现在
          </span>
          <p className="mt-3" style={{ fontSize: "var(--b-size-sub)", lineHeight: 1.6 }}>
            {now || "—"}
          </p>
        </div>

        <div
          className={tile}
          style={{
            background: "var(--b-surface)",
            border: "1px solid var(--b-line)",
            borderRadius: "var(--b-radius)",
          }}
        >
          <span className="site-eyebrow">邮箱</span>
          <p className="mt-3 break-all" style={{ fontSize: "var(--b-size-sub)", lineHeight: 1.6 }}>
            {data.email ? (
              <a href={`mailto:${data.email}`} className="underline underline-offset-4" style={{ textDecorationColor: "var(--b-line)" }}>
                {data.email}
              </a>
            ) : (
              "—"
            )}
          </p>
        </div>

        <div className="sm:col-span-2">
          <IdentityMark base={base} seed={data.name} variant="wide" />
        </div>
      </div>
    </header>
  );
}

/* ————————————————— 关于 ————————————————— */

export function AboutColumn({ data }: SlotProps) {
  if (!data.summary) return null;
  return (
    <p
      style={{
        maxWidth: "var(--b-measure)",
        fontSize: "var(--b-size-lead)",
        lineHeight: 1.78,
        color: "var(--b-ink-2)",
        ...pretty,
      }}
    >
      {data.summary}
    </p>
  );
}

export function AboutLead({ data }: SlotProps) {
  if (!data.summary) return null;
  return (
    <div
      className="border-l-2 pl-6"
      style={{ borderColor: "var(--b-accent)" }}
    >
      <p
        style={{
          maxWidth: "var(--b-measure)",
          fontSize: "calc(var(--b-size-lead) + 3px)",
          lineHeight: 1.6,
          color: "var(--b-ink)",
          ...pretty,
        }}
      >
        {data.summary}
      </p>
    </div>
  );
}

export function AboutPull({ data }: SlotProps) {
  if (!data.summary) return null;
  return (
    <p
      className="site-display"
      style={{
        maxWidth: "22em",
        fontSize: "clamp(22px, 2.6vw, 34px)",
        lineHeight: 1.42,
        letterSpacing: "-0.01em",
        color: "var(--b-ink)",
        ...pretty,
      }}
    >
      <span style={{ color: "var(--b-accent)", marginRight: 6 }}>“</span>
      {data.summary}
    </p>
  );
}

export function AboutFacts({ data }: SlotProps) {
  const { now, edu } = deriveWhere(data);
  const rows = [
    { k: "现在", v: now },
    { k: "学校", v: edu },
    { k: "城市", v: data.city },
    { k: "邮箱", v: data.email },
  ].filter((r) => r.v);

  return (
    <div className="grid gap-4">
      {rows.map((row) => (
        <div
          key={row.k}
          className="flex items-baseline justify-between gap-6 pb-4"
          style={{ borderBottom: "1px solid var(--b-line)" }}
        >
          <span
            className="site-mono shrink-0"
            style={{ ...mono, fontSize: "var(--b-size-meta)", letterSpacing: "0.16em", color: "var(--b-muted)" }}
          >
            {row.k}
          </span>
          <span className="text-right" style={{ fontSize: "var(--b-size-sub)" }}>
            {row.v}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ————————————————— 经历 / 项目 ————————————————— */

function groupByKind(sections: SiteSection[]) {
  const groups: { kind: string; items: SiteSection[] }[] = [];
  for (const section of sections) {
    const last = groups.find((group) => group.kind === section.kind);
    if (last) last.items.push(section);
    else groups.push({ kind: section.kind, items: [section] });
  }
  return groups;
}

function Bullets({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <ul
      className="mt-3 grid gap-1"
      style={{
        maxWidth: "var(--b-measure)",
        color: "var(--b-ink-2)",
        fontSize: "var(--b-size-body)",
        lineHeight: 1.72,
        ...pretty,
      }}
    >
      {lines.map((line, index) => (
        <li key={index} className="relative pl-4">
          <span
            aria-hidden
            className="absolute"
            style={{
              left: 0,
              top: "0.82em",
              width: 8,
              height: 1,
              background: "var(--b-line-strong, var(--b-line))",
            }}
          />
          {line}
        </li>
      ))}
    </ul>
  );
}

function EntryList({ items, divider }: { items: SiteSection[]; divider: boolean }) {
  return (
    <div>
      {items.map((section, index) => (
        <div key={`${section.kind}-${index}`}>
          {divider && index > 0 && <div className="my-7"><Rule /></div>}
          <div className={divider ? "" : "mt-7 first:mt-0"}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h3
                style={{
                  fontSize: "var(--b-size-title)",
                  fontWeight: 500,
                  lineHeight: 1.35,
                  letterSpacing: "-0.012em",
                }}
              >
                {section.title || section.org}
              </h3>
              {section.period && (
                <span
                  className="site-mono shrink-0"
                  style={{ ...mono, ...muted, fontSize: "var(--b-size-meta)", letterSpacing: "0.08em" }}
                >
                  {section.period}
                </span>
              )}
            </div>
            {section.title && section.org && (
              <p style={{ ...muted, fontSize: "var(--b-size-sub)", marginTop: 2 }}>
                {section.org}
              </p>
            )}
            <Bullets lines={section.lines} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ExperienceRows({ base, data, sections }: SlotProps) {
  const groups = groupByKind(sections ?? data.sections);

  return (
    <div style={{ display: "grid", gap: "var(--b-section-gap)" }}>
      {groups.map((group) => (
        <div key={group.kind}>
          <EntryList items={group.items} divider={base.rhythm.divider !== "none"} />
        </div>
      ))}
    </div>
  );
}

export function ExperienceTimeline({ data, sections }: SlotProps) {
  const groups = groupByKind(sections ?? data.sections);

  return (
    <div style={{ display: "grid", gap: "var(--b-section-gap)" }}>
      {groups.map((group) => (
        <div key={group.kind}>
          <div className="relative pl-7" style={{ borderLeft: "1px solid var(--b-line)" }}>
            {group.items.map((section, index) => (
              <div key={index} className="relative pb-9 last:pb-0">
                <span
                  aria-hidden
                  className="absolute rounded-full"
                  style={{
                    left: "calc(-1.75rem - 3.5px)",
                    top: "0.55rem",
                    width: 7,
                    height: 7,
                    background: index === 0 ? "var(--b-accent)" : "var(--b-bg)",
                    border: "1px solid var(--b-line)",
                  }}
                />
                {section.period && (
                  <p
                    className="site-mono"
                    style={{ ...mono, ...muted, fontSize: "var(--b-size-meta)", letterSpacing: "0.08em" }}
                  >
                    {section.period}
                  </p>
                )}
                <h3
                  className="mt-1"
                  style={{ fontSize: "var(--b-size-title)", fontWeight: 500, lineHeight: 1.35 }}
                >
                  {section.title || section.org}
                </h3>
                {section.title && section.org && (
                  <p style={{ ...muted, fontSize: "var(--b-size-sub)" }}>{section.org}</p>
                )}
                <Bullets lines={section.lines} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const CARD: CSSProperties = {
  background: "var(--b-surface)",
  border: "1px solid var(--b-line)",
  borderRadius: "var(--b-radius)",
};

export function ExperienceCards({ data, sections }: SlotProps) {
  const groups = groupByKind(sections ?? data.sections);
  const items = groups.flatMap((group) => group.items);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((section, index) => (
        <div key={index} className="p-6" style={CARD}>
          <div className="flex items-baseline justify-between gap-3">
            <span
              className="site-mono"
              style={{ ...mono, fontSize: "var(--b-size-meta)", letterSpacing: "0.14em", color: "var(--b-accent)" }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            {section.period && (
              <span className="site-mono" style={{ ...mono, ...muted, fontSize: "var(--b-size-meta)" }}>
                {section.period}
              </span>
            )}
          </div>
          <h3
            className="mt-4"
            style={{ fontSize: "var(--b-size-title)", fontWeight: 500, lineHeight: 1.35 }}
          >
            {section.title || section.org}
          </h3>
          {section.title && section.org && (
            <p style={{ ...muted, fontSize: "var(--b-size-small)", marginTop: 2 }}>{section.org}</p>
          )}
          <Bullets lines={section.lines} />
        </div>
      ))}
    </div>
  );
}

/* ——————————————— 项目 ——————————————— */

export function ProjectsRows({ data, sections }: SlotProps) {
  const projects = (sections ?? data.sections).filter((s) => s.kind === "project");
  if (projects.length === 0) return null;

  return (
    <div>
      {projects.map((project, index) => (
        <div key={index}>
          {index > 0 && <div className="my-7"><Rule /></div>}
          <div className="grid gap-x-8 gap-y-2 sm:grid-cols-[64px_minmax(0,1fr)]">
            <span
              className="site-mono"
              style={{
                ...mono,
                fontSize: "var(--b-size-meta)",
                letterSpacing: "0.1em",
                color: "var(--b-accent)",
                paddingTop: 6,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h3
                  style={{
                    fontSize: "calc(var(--b-size-title) + 2px)",
                    fontWeight: 500,
                    lineHeight: 1.32,
                    letterSpacing: "-0.015em",
                  }}
                >
                  {project.title || project.org}
                </h3>
                {project.period && (
                  <span
                    className="site-mono shrink-0"
                    style={{ ...mono, ...muted, fontSize: "var(--b-size-meta)" }}
                  >
                    {project.period}
                  </span>
                )}
              </div>
              {project.title && project.org && (
                <p style={{ ...muted, fontSize: "var(--b-size-sub)", marginTop: 3 }}>
                  {project.org}
                </p>
              )}
              <Bullets lines={project.lines} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectsCards({ data, sections }: SlotProps) {
  const projects = (sections ?? data.sections).filter((s) => s.kind === "project");
  if (projects.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {projects.map((project, index) => (
        <article
          key={index}
          className="group relative p-6 transition-transform duration-300 hover:-translate-y-0.5"
          style={{
            ...CARD,
            ...(projects.length === 1 ? { gridColumn: "span 2" } : {}),
          }}
        >
          <div className="flex items-baseline justify-between gap-3">
            <span
              className="site-mono"
              style={{
                ...mono,
                fontSize: "clamp(18px, 1.8vw, 24px)",
                color: "var(--b-accent)",
                letterSpacing: "-0.02em",
                opacity: 0.5,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            {project.period && (
              <span className="site-mono" style={{ ...mono, ...muted, fontSize: "var(--b-size-meta)" }}>
                {project.period}
              </span>
            )}
          </div>
          <h3
            className="mt-4"
            style={{
              fontSize: "calc(var(--b-size-title) + 1px)",
              fontWeight: 500,
              lineHeight: 1.34,
              letterSpacing: "-0.015em",
            }}
          >
            {project.title || project.org}
          </h3>
          {project.title && project.org && (
            <p style={{ ...muted, fontSize: "var(--b-size-small)", marginTop: 3 }}>{project.org}</p>
          )}
          {project.lines.length > 0 && (
            <p
              className="mt-4"
              style={{
                fontSize: "var(--b-size-body)",
                lineHeight: 1.75,
                color: "var(--b-ink-2)",
                ...pretty,
              }}
            >
              {project.lines.join(" ")}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

export function ProjectsFeature({ base, data, sections }: SlotProps) {
  const projects = (sections ?? data.sections).filter((s) => s.kind === "project");
  if (projects.length === 0) return null;
  const [lead, ...rest] = projects;

  return (
    <div>
      <div
        className="relative overflow-hidden p-8 sm:p-10"
        style={{
          background: "var(--b-surface)",
          border: "1px solid var(--b-line)",
          borderRadius: "var(--b-radius)",
        }}
      >
        {base.primitives.includes("grain") && <Grain opacity={0.1} />}
        <div className="relative">
          <span
            className="site-mono"
            style={{ ...mono, fontSize: "var(--b-size-meta)", letterSpacing: "0.18em", color: "var(--b-accent)" }}
          >
            主角项目
          </span>
          <h3
            className="mt-4"
            style={{
              fontFamily: "var(--b-font-display)",
              fontSize: "clamp(24px, 3vw, 38px)",
              fontWeight: "var(--b-weight-display)",
              letterSpacing: "var(--b-tracking-display)",
              lineHeight: 1.18,
            }}
          >
            {lead.title || lead.org}
          </h3>
          {lead.title && lead.org && (
            <p className="mt-2" style={{ ...muted, fontSize: "var(--b-size-sub)" }}>{lead.org}</p>
          )}
          {lead.lines.length > 0 && (
            <p
              className="mt-5"
              style={{
                maxWidth: "var(--b-measure)",
                fontSize: "calc(var(--b-size-body) + 0.5px)",
                lineHeight: 1.82,
                color: "var(--b-ink-2)",
                ...pretty,
              }}
            >
              {lead.lines.join(" ")}
            </p>
          )}
          {lead.period && (
            <p
              className="site-mono mt-6"
              style={{ ...mono, ...muted, fontSize: "var(--b-size-meta)" }}
            >
              {lead.period}
            </p>
          )}
        </div>
      </div>

      {rest.length > 0 && (
        <div className="mt-9">
          {rest.map((project, index) => (
            <div key={index}>
              {index > 0 && <div className="my-6"><Rule /></div>}
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h4 style={{ fontSize: "var(--b-size-title)", fontWeight: 500 }}>
                  {project.title || project.org}
                </h4>
                {project.period && (
                  <span className="site-mono" style={{ ...mono, ...muted, fontSize: "var(--b-size-meta)" }}>
                    {project.period}
                  </span>
                )}
              </div>
              {project.lines.length > 0 && (
                <p
                  className="mt-2"
                  style={{
                    maxWidth: "var(--b-measure)",
                    color: "var(--b-ink-2)",
                    lineHeight: 1.75,
                    ...pretty,
                  }}
                >
                  {project.lines.join(" ")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectsStrip({ data, sections }: SlotProps) {
  const projects = (sections ?? data.sections).filter((s) => s.kind === "project");
  if (projects.length === 0) return null;

  return (
    <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
      {projects.map((project, index) => (
        <article key={index}>
          <div className="flex items-baseline gap-4">
            <span
              className="site-mono shrink-0"
              style={{
                ...mono,
                fontSize: "clamp(26px, 2.8vw, 38px)",
                lineHeight: 1,
                color: "var(--b-accent)",
                opacity: 0.32,
                letterSpacing: "-0.04em",
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3
              style={{
                fontSize: "calc(var(--b-size-title) + 3px)",
                fontWeight: 500,
                lineHeight: 1.28,
                letterSpacing: "-0.018em",
              }}
            >
              {project.title || project.org}
            </h3>
          </div>
          {project.period && (
            <p
              className="site-mono mt-3"
              style={{ ...mono, ...muted, fontSize: "var(--b-size-meta)", letterSpacing: "0.1em" }}
            >
              {project.period}
            </p>
          )}
          {project.lines.length > 0 && (
            <p
              className="mt-3"
              style={{
                maxWidth: "var(--b-measure)",
                color: "var(--b-ink-2)",
                fontSize: "var(--b-size-sub)",
                lineHeight: 1.78,
                ...pretty,
              }}
            >
              {project.lines.join(" ")}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

/* ——————————————— 技能 ——————————————— */

function SkillChip({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center"
      style={{
        padding: "5px 11px",
        fontSize: "var(--b-size-small)",
        border: "1px solid var(--b-line)",
        borderRadius: "999px",
        color: "var(--b-ink-2)",
        lineHeight: 1.5,
      }}
    >
      {children}
    </span>
  );
}

function SkillsSentence({ skills }: { skills: string[] }) {
  return (
    <p style={{ maxWidth: "var(--b-measure)", color: "var(--b-ink-2)", lineHeight: 1.9, ...pretty }}>
      {skills.join(" ")}
    </p>
  );
}

export function SkillsInline({ data }: SlotProps) {
  if (data.skills.length === 0) return null;
  if (!isSkillList(data.skills)) return <SkillsSentence skills={data.skills} />;
  return (
    <div
      className="flex flex-wrap items-baseline"
      style={{
        fontFamily: "var(--b-font-mono)",
        fontSize: "var(--b-size-body)",
        lineHeight: 1.9,
        color: "var(--b-ink-2)",
        columnGap: 12,
        rowGap: 2,
        maxWidth: "58ch",
      }}
    >
      {data.skills.map((skill, index) => (
        <span key={index} className="inline-flex items-baseline" style={{ whiteSpace: "nowrap" }}>
          {skill}
          {index < data.skills.length - 1 && (
            <span
              aria-hidden
              style={{ color: "var(--b-line-strong, var(--b-muted))", marginLeft: 12 }}
            >
              /
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

export function SkillsChips({ data }: SlotProps) {
  if (data.skills.length === 0) return null;
  if (!isSkillList(data.skills)) return <SkillsSentence skills={data.skills} />;
  return (
    <div className="flex flex-wrap gap-2">
      {data.skills.map((skill, index) => (
        <SkillChip key={index}>{skill}</SkillChip>
      ))}
    </div>
  );
}

export function SkillsMeter({ data }: SlotProps) {
  if (data.skills.length === 0) return null;
  if (!isSkillList(data.skills)) return <SkillsSentence skills={data.skills} />;

  return (
    <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2" style={{ maxWidth: 620 }}>
      {data.skills.map((skill, index) => (
        <div
          key={index}
          className="flex items-baseline gap-3 pb-2"
          style={{ borderBottom: "1px solid var(--b-line)" }}
        >
          <span
            className="site-mono shrink-0"
            style={{ ...mono, fontSize: "var(--b-size-meta)", color: "var(--b-accent)", opacity: 0.7 }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span style={{ fontSize: "var(--b-size-sub)", color: "var(--b-ink-2)" }}>{skill}</span>
        </div>
      ))}
    </div>
  );
}

/* ——————————————— 联系 ——————————————— */

export function ContactLine({ data }: SlotProps) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
      <p style={{ ...muted, fontSize: "var(--b-size-sub)" }}>
        {data.email ? "想聊聊的话，直接发邮件。" : "—"}
      </p>
      {data.email && (
        <a
          href={`mailto:${data.email}`}
          className="underline underline-offset-[6px]"
          style={{
            fontFamily: "var(--b-font-mono)",
            fontSize: "var(--b-size-sub)",
            color: "var(--b-ink)",
            textDecorationColor: "var(--b-line)",
          }}
        >
          {data.email}
        </a>
      )}
    </div>
  );
}

export function ContactCard({ data }: SlotProps) {
  return (
    <div
      className="flex flex-wrap items-end justify-between gap-6 p-8"
      style={CARD}
    >
      <div>
        <span className="site-eyebrow">联系</span>
        <p
          className="site-display mt-3"
          style={{
            fontSize: "clamp(24px, 3vw, 34px)",
            lineHeight: 1.2,
            letterSpacing: "var(--b-tracking-display)",
          }}
        >
          聊两句？
        </p>
      </div>
      {data.email && (
        <a
          href={`mailto:${data.email}`}
          className="underline underline-offset-[6px]"
          style={{
            fontFamily: "var(--b-font-mono)",
            fontSize: "var(--b-size-sub)",
            textDecorationColor: "var(--b-line)",
          }}
        >
          {data.email}
        </a>
      )}
    </div>
  );
}

export function ContactBanner({ data }: SlotProps) {
  return (
    <div
      className="relative overflow-hidden px-8 py-12 sm:px-12 sm:py-16"
      style={{
        background: "var(--b-accent)",
        color: "var(--b-on-accent)",
        borderRadius: "var(--b-radius)",
      }}
    >
      <GradientGrid opacity={0.35} />
      <div className="relative">
        <p
          className="site-mono"
          style={{ fontSize: "var(--b-size-meta)", letterSpacing: "0.2em", opacity: 0.6 }}
        >
          CONTACT
        </p>
        <p
          className="site-display mt-4"
          style={{
            fontSize: "clamp(30px, 4.4vw, 56px)",
            lineHeight: 1.08,
            letterSpacing: "var(--b-tracking-display)",
          }}
        >
          我们聊聊。
        </p>
        {data.email && (
          <a
            href={`mailto:${data.email}`}
            className="mt-6 inline-block border-b pb-1"
            style={{
              fontFamily: "var(--b-font-mono)",
              fontSize: "var(--b-size-sub)",
              borderColor: "currentColor",
              opacity: 0.9,
            }}
          >
            {data.email}
          </a>
        )}
      </div>
    </div>
  );
}
