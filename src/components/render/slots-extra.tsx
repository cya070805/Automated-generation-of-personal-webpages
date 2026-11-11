import type { CSSProperties, ReactNode } from "react";
import type { SiteData, SiteSection } from "@/lib/site-data";
import type { BaseTokens, Recipe } from "@/lib/templates/types";

/**
 * 第二批讲法：关于 / 经历 / 项目 / 联系各有第二种排法。
 * 和 slots.tsx 同一套令牌，不重复定义颜色。
 */

type SlotProps = {
  base: BaseTokens;
  data: SiteData;
  recipe: Recipe;
  sections?: SiteSection[];
  startIndex?: number;
};

const muted = { color: "var(--b-muted)" } as CSSProperties;
const mono = { fontFamily: "var(--b-font-mono)" } as CSSProperties;

/** 关于：事实格 */
export function AboutFacts({ data }: SlotProps) {
  if (!data.summary && !data.headline) return null;

  const facts = [
    data.headline ? { label: "目标岗位", value: data.headline } : null,
    data.city ? { label: "所在地", value: data.city } : null,
    data.skills.length > 0
      ? { label: "技能", value: data.skills.slice(0, 3).join(" / ") }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {facts.map((fact) => (
        <div
          key={fact.label}
          className="p-4"
          style={{
            background: "var(--b-surface)",
            border: "var(--b-border) solid var(--b-line)",
            borderRadius: "var(--b-radius)",
          }}
        >
          <p
            className="site-mono"
            style={{ ...mono, ...muted, fontSize: "var(--b-size-small)" }}
          >
            {fact.label}
          </p>
          <p
            className="mt-1.5"
            style={{
              fontSize: "var(--b-size-sub)",
              color: "var(--b-ink)",
              lineHeight: 1.6,
            }}
          >
            {fact.value}
          </p>
        </div>
      ))}

      {data.summary && (
        <p
          className={facts.length > 0 ? "sm:col-span-3" : "sm:col-span-3"}
          style={{
            maxWidth: "var(--b-measure)",
            fontSize: "var(--b-size-lead)",
            lineHeight: 1.9,
            color: "var(--b-ink-2)",
            textWrap: "pretty",
          }}
        >
          {data.summary}
        </p>
      )}
    </div>
  );
}

/** 关于：大引文 */
export function AboutPull({ data }: SlotProps) {
  if (!data.summary) return null;
  return (
    <blockquote className="relative pl-8">
      <span
        aria-hidden
        className="site-display absolute -left-1 -top-4 select-none"
        style={{
          fontSize: "3rem",
          lineHeight: 1,
          color: "var(--b-accent)",
          opacity: 0.5,
        }}
      >
        “
      </span>
      <p
        className="site-display"
        style={{
          maxWidth: "var(--b-measure)",
          fontSize: "calc(var(--b-size-lead) + 3px)",
          lineHeight: 1.65,
          color: "var(--b-ink)",
          textWrap: "pretty",
        }}
      >
        {data.summary}
      </p>
    </blockquote>
  );
}

/** 经历：卡片 */
export function ExperienceCards({ data, sections }: SlotProps) {
  const items = sections ?? data.sections;
  if (items.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((section, index) => (
        <article
          key={index}
          className="p-5"
          style={{
            background: "var(--b-surface)",
            border: "var(--b-border) solid var(--b-line)",
            borderRadius: "var(--b-radius)",
          }}
        >
          {section.period && (
            <p
              className="site-mono"
              style={{ ...mono, ...muted, fontSize: "var(--b-size-small)" }}
            >
              {section.period}
            </p>
          )}
          <h3
            className="mt-1.5"
            style={{
              fontSize: "calc(var(--b-size-body) + 1px)",
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            {section.title || section.org}
          </h3>
          {section.title && section.org && (
            <p style={{ ...muted, fontSize: "var(--b-size-small)", marginTop: 2 }}>
              {section.org}
            </p>
          )}
          {section.lines.length > 0 && (
            <p
              className="mt-2.5"
              style={{
                color: "var(--b-ink-2)",
                lineHeight: 1.8,
                fontSize: "calc(var(--b-size-body) - 0.5px)",
                textWrap: "pretty",
              }}
            >
              {section.lines.join(" ")}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

/** 项目：一个主角 + 其余清单 */
export function ProjectsFeature({ data, sections }: SlotProps) {
  const projects = (sections ?? data.sections).filter(
    (section) => section.kind === "project",
  );
  if (projects.length === 0) return null;

  const [featured, ...rest] = projects;

  return (
    <div>
      <article
        className="p-7"
        style={{
          background: "var(--b-surface)",
          border: "var(--b-border) solid var(--b-line)",
          borderRadius: "var(--b-radius)",
        }}
      >
        <p
          className="site-mono"
          style={{ ...mono, ...muted, fontSize: "var(--b-size-small)" }}
        >
          {featured.period || "主要作品"}
        </p>
        <h3
          className="mt-2"
          style={{
            fontSize: "calc(var(--b-size-lead) + 2px)",
            fontWeight: 500,
            lineHeight: 1.3,
          }}
        >
          {featured.title || featured.org}
        </h3>
        {featured.org && featured.title && (
          <p style={{ ...muted, fontSize: "var(--b-size-sub)", marginTop: 4 }}>
            {featured.org}
          </p>
        )}
        {featured.lines.length > 0 && (
          <div
            className="mt-4 space-y-1.5"
            style={{
              maxWidth: "var(--b-measure)",
              color: "var(--b-ink-2)",
              lineHeight: 1.85,
              textWrap: "pretty",
            }}
          >
            {featured.lines.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        )}
      </article>

      {rest.length > 0 && (
        <ul className="mt-4 grid gap-3">
          {rest.map((section, index) => (
            <li
              key={index}
              className="flex flex-wrap items-baseline justify-between gap-2 border-t pt-3"
              style={{ borderColor: "var(--b-line)" }}
            >
              <span style={{ fontSize: "var(--b-size-sub)", color: "var(--b-ink)" }}>
                {section.title || section.org}
              </span>
              <span
                className="site-mono"
                style={{ ...mono, ...muted, fontSize: "var(--b-size-small)" }}
              >
                {section.period || section.org}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 联系：整条横幅 */
export function ContactBanner({ data }: SlotProps): ReactNode {
  return (
    <section
      className="flex flex-wrap items-center justify-between gap-5 px-7 py-8"
      style={{
        background: "var(--b-accent)",
        color: "var(--b-on-accent)",
        borderRadius: "var(--b-radius)",
      }}
    >
      <p
        className="site-display"
        style={{
          fontSize: "calc(var(--b-size-lead) + 2px)",
          lineHeight: 1.4,
        }}
      >
        {"想聊聊，发邮件就行。"}
      </p>
      {data.email ? (
        <a
          href={`mailto:${data.email}`}
          className="site-mono underline underline-offset-4"
          style={{
            ...mono,
            fontSize: "var(--b-size-sub)",
            color: "var(--b-on-accent)",
          }}
        >
          {data.email}
        </a>
      ) : (
        <span
          className="site-mono"
          style={{ ...mono, fontSize: "var(--b-size-small)", opacity: 0.85 }}
        >
          {data.city || ""}
        </span>
      )}
    </section>
  );
}
