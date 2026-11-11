import type { CSSProperties } from "react";
import type { SiteData, SiteSection } from "@/lib/site-data";
import { SECTION_LABELS, isSkillList } from "@/lib/site-data";
import type { BaseTokens, Recipe } from "@/lib/templates/types";
import {
  Glass,
  Grain,
  GradientGrid,
  MaskFrame,
  Meter,
  Particles,
  Sticker,
} from "@/components/primitives/static";
import { Magnetic, Reveal, Tilt, Typewriter } from "@/components/primitives/motion";

/**
 * 渲染层：一个槽位一个组件，取哪套讲法由 recipe.layout 决定。
 * 所有颜色与字号都来自 `var(--b-*)`，所以同一段代码在六套基底里是六种样子。
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

export function SectionLabel({
  base,
  label,
  index,
}: {
  base: BaseTokens;
  label: string;
  index: number;
}) {
  const marker = base.rhythm.marker;

  return (
    <div className="flex items-baseline gap-4">
      {marker === "index" && (
        <span
          className="site-mono tabular-nums"
          style={{ ...mono, ...muted, fontSize: "var(--b-size-small)" }}
        >
          {String(index).padStart(2, "0")}
        </span>
      )}
      {marker === "hash" && (
        <span
          className="site-mono"
          style={{
            ...mono,
            color: "var(--b-accent)",
            fontSize: "var(--b-size-small)",
          }}
        >
          ##
        </span>
      )}
      {marker === "rule" && (
        <span
          className="mb-[6px] h-px w-7"
          style={{ background: "var(--b-accent)" }}
        />
      )}

      <h2
        style={{
          fontSize: "var(--b-size-small)",
          color: "var(--b-muted)",
          letterSpacing: "0.14em",
        }}
      >
        {label}
      </h2>

      {base.rhythm.divider === "hairline" && (
        <span
          className="mb-[4px] h-px flex-1"
          style={{ background: "var(--b-line)" }}
        />
      )}
    </div>
  );
}

function ContactLine({ data }: { data: SiteData }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1" style={{ fontSize: "var(--b-size-sub)" }}>
      {data.email && (
        <a
          href={`mailto:${data.email}`}
          className="underline-offset-4 hover:underline"
          style={{ color: "var(--b-ink-2)", textDecorationColor: "var(--b-line)" }}
        >
          {data.email}
        </a>
      )}
      {data.city && <span style={muted}>{data.city}</span>}
    </div>
  );
}

/** ——————————————— 首屏 ——————————————— */

export function HeroStatement({ data }: SlotProps) {
  return (
    <header className="pb-2">
      <h1
        className="site-display"
        style={{
          fontSize: "var(--b-size-name)",
          lineHeight: 1.16,
          fontWeight: 500,
        }}
      >
        {data.name || "你的名字"}
      </h1>
      {data.headline && (
        <p
          className="mt-2.5"
          style={{ ...muted, fontSize: "var(--b-size-sub)" }}
        >
          {data.headline}
        </p>
      )}
      <div className="mt-4">
        <ContactLine data={data} />
      </div>
    </header>
  );
}

export function HeroPrompt({ data }: SlotProps) {
  return (
    <header>
      <div
        className="site-mono flex items-baseline justify-between gap-4"
        style={{ fontSize: "var(--b-size-small)", color: "var(--b-muted)" }}
      >
        <span style={{ color: "var(--b-accent)" }}>{`~/ ${data.name || "me"}`}</span>
        {data.city && <span>{data.city}</span>}
      </div>

      <h1
        className="mt-10"
        style={{
          fontSize: "var(--b-size-name)",
          lineHeight: 1.12,
          fontWeight: 500,
          color: "var(--b-ink)",
        }}
      >
        {data.name || "你的名字"}
      </h1>

      {data.headline && (
        <p
          className="site-mono mt-3"
          style={{
            ...mono,
            color: "var(--b-accent)",
            fontSize: "var(--b-size-sub)",
          }}
        >
          <Typewriter text={data.headline} />
        </p>
      )}

      {data.email && (
        <a
          href={`mailto:${data.email}`}
          className="site-mono mt-6 inline-block underline underline-offset-4"
          style={{
            ...mono,
            fontSize: "var(--b-size-small)",
            color: "var(--b-muted)",
            textDecorationColor: "var(--b-line)",
          }}
        >
          {data.email}
        </a>
      )}
    </header>
  );
}

export function HeroPoster({ base, data }: SlotProps) {
  return (
    <header className="relative">
      {base.primitives.includes("grain") && <Grain opacity={0.16} />}
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          {data.headline && <Sticker rotate={-2}>{data.headline}</Sticker>}
          {data.city && (
            <span
              className="site-mono"
              style={{ ...mono, ...muted, fontSize: "var(--b-size-small)" }}
            >
              {data.city}
            </span>
          )}
        </div>

        <h1
          className="site-display mt-6"
          style={{
            fontSize: "var(--b-size-name)",
            lineHeight: 1.04,
            fontWeight: 500,
            letterSpacing: "-0.03em",
          }}
        >
          {data.name || "你的名字"}
        </h1>

        <div
          className="mt-6 h-px w-full"
          style={{ background: "var(--b-ink)", opacity: 0.18 }}
        />

        {data.email && (
          <div className="mt-4">
            <ContactLine data={{ ...data, city: "" }} />
          </div>
        )}
      </div>
    </header>
  );
}

export function HeroSplit({ base, data }: SlotProps) {
  return (
    <header className="grid items-end gap-10 sm:grid-cols-[1.15fr_0.85fr]">
      <div>
        <h1
          className="site-display"
          style={{
            fontSize: "var(--b-size-name)",
            lineHeight: 1.1,
            fontWeight: 500,
          }}
        >
          {data.name || "你的名字"}
        </h1>
        {data.headline && (
          <p
            className="mt-3"
            style={{ color: "var(--b-accent)", fontSize: "var(--b-size-sub)" }}
          >
            {data.headline}
          </p>
        )}
        <div className="mt-5">
          <ContactLine data={data} />
        </div>
      </div>

      <div
        className="relative h-[150px] overflow-hidden"
        style={{
          borderRadius: "var(--b-radius)",
          background: "var(--b-surface)",
          border: "var(--b-border) solid var(--b-line)",
        }}
      >
        <GradientGrid opacity={0.85} />
        {base.primitives.includes("particles") && <Particles count={10} />}
        <div className="absolute inset-x-4 bottom-4 flex items-baseline justify-between">
          <span
            className="site-mono"
            style={{ ...mono, ...muted, fontSize: "var(--b-size-small)" }}
          >
            {data.city || "个人主页"}
          </span>
          <span
            className="size-2 rounded-full"
            style={{ background: "var(--b-accent)" }}
          />
        </div>
      </div>
    </header>
  );
}

/** ——————————————— 关于 ——————————————— */

export function AboutColumn({ data }: SlotProps) {
  if (!data.summary) return null;
  return (
    <p
      style={{
        maxWidth: "var(--b-measure)",
        fontSize: "var(--b-size-lead)",
        lineHeight: 1.9,
        color: "var(--b-ink-2)",
      }}
    >
      {data.summary}
    </p>
  );
}

export function AboutLead({ base, data }: SlotProps) {
  if (!data.summary) return null;
  return (
    <div className="relative">
      {base.primitives.includes("grain") && <Grain opacity={0.12} />}
      <p
        className="site-display relative border-l-2 pl-5"
        style={{
          maxWidth: "var(--b-measure)",
          fontSize: "var(--b-size-lead)",
          lineHeight: 1.7,
          color: "var(--b-ink)",
          borderColor: "var(--b-accent)",
        }}
      >
        {data.summary}
      </p>
    </div>
  );
}

/** ——————————————— 经历 / 项目 ——————————————— */

function groupByKind(sections: SiteSection[]) {
  const groups: { kind: string; items: SiteSection[] }[] = [];
  for (const section of sections) {
    const last = groups.find((group) => group.kind === section.kind);
    if (last) last.items.push(section);
    else groups.push({ kind: section.kind, items: [section] });
  }
  return groups;
}

function EntryRows({ items }: { items: SiteSection[] }) {
  return (
    <ul
      className="mt-6"
      style={{ display: "grid", gap: "var(--b-block-gap)" }}
    >
      {items.map((section, index) => (
        <li key={`${section.kind}-${index}`} className="break-inside-avoid">
          <div className="flex items-baseline justify-between gap-6">
            <div>
              <h3
                style={{
                  fontSize: "calc(var(--b-size-body) + 1px)",
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}
              >
                {section.title || section.org}
              </h3>
              {section.title && section.org && (
                <p style={{ ...muted, fontSize: "var(--b-size-sub)", marginTop: 2 }}>
                  {section.org}
                </p>
              )}
            </div>
            {section.period && (
              <span
                className="site-mono shrink-0"
                style={{
                  ...mono,
                  ...muted,
                  fontSize: "var(--b-size-small)",
                  color: "var(--b-muted)",
                }}
              >
                {section.period}
              </span>
            )}
          </div>

          {section.lines.length > 0 && (
            <div
              className="mt-2.5 space-y-1.5"
              style={{
                maxWidth: "var(--b-measure)",
                color: "var(--b-ink-2)",
                lineHeight: 1.85,
                textWrap: "pretty",
              }}
            >
              {section.lines.map((line, lineIndex) => (
                <p key={lineIndex}>{line}</p>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ExperienceRows({
  base,
  data,
  recipe,
  sections,
  startIndex,
}: SlotProps) {
  const groups = groupByKind(sections ?? data.sections);
  let cursor = startIndex ?? 0;

  return (
    <div style={{ display: "grid", gap: "var(--b-section-gap)" }}>
      {groups.map((group) => {
        cursor += 1;
        return (
          <section key={group.kind} className="break-inside-avoid">
            <SectionLabel
              base={base}
              label={SECTION_LABELS[group.kind] ?? group.kind}
              index={cursor}
            />
            {recipe.motionCost !== "none" && base.motion !== "none" ? (
              <Reveal>
                <EntryRows items={group.items} />
              </Reveal>
            ) : (
              <EntryRows items={group.items} />
            )}
          </section>
        );
      })}
    </div>
  );
}

export function ExperienceTimeline({ data, sections }: SlotProps) {
  const groups = groupByKind(sections ?? data.sections);
  const flat = groups.flatMap((group) => group.items);

  return (
    <div style={{ display: "grid", gap: "var(--b-section-gap)" }}>
      {groups.map((group) => (
        <section key={group.kind} className="break-inside-avoid">
          <div
            className="grid gap-x-8"
            style={{ gridTemplateColumns: "minmax(0, 132px) 1fr" }}
          >
            <div className="pt-[2px]">
              <span
                className="site-mono"
                style={{
                  ...mono,
                  ...muted,
                  fontSize: "var(--b-size-small)",
                  letterSpacing: "0.08em",
                }}
              >
                {SECTION_LABELS[group.kind] ?? group.kind}
              </span>
            </div>

            <div
              className="relative border-l pl-6"
              style={{ borderColor: "var(--b-line)" }}
            >
              <ul style={{ display: "grid", gap: "calc(var(--b-block-gap) + 4px)" }}>
                {group.items.map((section, index) => {
                  const position = flat.indexOf(section);
                  return (
                    <li key={`${section.kind}-${index}`} className="relative">
                      <span
                        aria-hidden
                        className="absolute size-[7px] rounded-full"
                        style={{
                          left: "-1.72rem",
                          top: "0.55rem",
                          background:
                            position === 0
                              ? "var(--b-accent)"
                              : "var(--b-line)",
                        }}
                      />
                      {section.period && (
                        <p
                          className="site-mono"
                          style={{
                            ...mono,
                            ...muted,
                            fontSize: "var(--b-size-small)",
                          }}
                        >
                          {section.period}
                        </p>
                      )}
                      <h3
                        className="mt-1"
                        style={{
                          fontSize: "calc(var(--b-size-body) + 1.5px)",
                          fontWeight: 500,
                          lineHeight: 1.4,
                        }}
                      >
                        {section.title || section.org}
                      </h3>
                      {section.title && section.org && (
                        <p style={{ ...muted, fontSize: "var(--b-size-sub)" }}>
                          {section.org}
                        </p>
                      )}
                      {section.lines.length > 0 && (
                        <div
                          className="mt-2 space-y-1.5"
                          style={{
                            maxWidth: "var(--b-measure)",
                            color: "var(--b-ink-2)",
                            lineHeight: 1.85,
                            textWrap: "pretty",
                          }}
                        >
                          {section.lines.map((line, lineIndex) => (
                            <p key={lineIndex}>{line}</p>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

export function ProjectsCards({ base, data, sections }: SlotProps) {
  const projects = (sections ?? data.sections).filter(
    (section) => section.kind === "project",
  );
  if (projects.length === 0) return null;

  const clipped = base.primitives.includes("mask");

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {projects.map((section, index) => {
        const body = (
          <>
            <div
              className="flex items-baseline justify-between gap-3"
              style={{ fontSize: "var(--b-size-small)", color: "var(--b-muted)" }}
            >
              <span
                className="site-mono"
                style={{ ...mono, fontSize: "var(--b-size-small)" }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              {section.period && (
                <span className="site-mono" style={{ ...mono }}>
                  {section.period}
                </span>
              )}
            </div>

            <h3
              className="mt-3"
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
                className="mt-3"
                style={{
                  color: "var(--b-ink-2)",
                  lineHeight: 1.8,
                  fontSize: "calc(var(--b-size-body) - 0.5px)",
                }}
              >
                {section.lines.join(" ")}
              </p>
            )}
          </>
        );

        const span = projects.length === 1 ? "sm:col-span-2" : "";

        const card = clipped ? (
          <MaskFrame className="p-5" fade={false}>
            {body}
          </MaskFrame>
        ) : (
          <div
            className="p-5"
            style={{
              background: "var(--b-surface)",
              border: "var(--b-border) solid var(--b-line)",
              borderRadius: "var(--b-radius)",
            }}
          >
            {body}
          </div>
        );

        return base.primitives.includes("tilt") ? (
          <Tilt key={index} max={3} className={span}>
            {card}
          </Tilt>
        ) : (
          <div key={index} className={span}>
            {card}
          </div>
        );
      })}
    </div>
  );
}

/** ——————————————— 技能 ——————————————— */

function SkillsSentence({ skills }: { skills: string[] }) {
  return (
    <p
      style={{
        fontSize: "var(--b-size-sub)",
        color: "var(--b-ink-2)",
        lineHeight: 1.95,
        maxWidth: "var(--b-measure)",
      }}
    >
      {skills.join(" ")}
    </p>
  );
}

export function SkillsInline({ data }: SlotProps) {
  if (data.skills.length === 0) return null;
  return (
    <p
      style={{
        fontSize: "var(--b-size-sub)",
        color: "var(--b-ink-2)",
        lineHeight: 1.95,
        maxWidth: "var(--b-measure)",
      }}
    >
      {data.skills.join("  /  ")}
    </p>
  );
}

export function SkillsChips({ data }: SlotProps) {
  if (data.skills.length === 0) return null;
  if (!isSkillList(data.skills)) return <SkillsSentence skills={data.skills} />;
  return (
    <ul className="flex flex-wrap gap-2">
      {data.skills.map((skill) => (
        <li
          key={skill}
          className="px-2.5 py-1"
          style={{
            border: "var(--b-border) solid var(--b-line)",
            borderRadius: "var(--b-radius)",
            background: "var(--b-surface)",
            fontSize: "var(--b-size-small)",
            color: "var(--b-ink-2)",
          }}
        >
          {skill}
        </li>
      ))}
    </ul>
  );
}

export function SkillsMeter({ data }: SlotProps) {
  if (data.skills.length === 0) return null;
  if (!isSkillList(data.skills)) return <SkillsSentence skills={data.skills} />;
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {data.skills.map((skill, index) => (
        <li
          key={skill}
          className="px-3.5 py-3"
          style={{
            background: "var(--b-surface)",
            border: "var(--b-border) solid var(--b-line)",
            borderRadius: "var(--b-radius)",
          }}
        >
          <div className="flex items-baseline justify-between gap-3">
            <span style={{ fontSize: "var(--b-size-sub)", color: "var(--b-ink)" }}>
              {skill}
            </span>
            <span
              className="site-mono"
              style={{ ...mono, ...muted, fontSize: "var(--b-size-small)" }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <div className="mt-2.5">
            <Meter count={data.skills.length - index} max={data.skills.length} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** ——————————————— 联系 ——————————————— */

export function ContactLineSlot({ data }: SlotProps) {
  return (
    <footer
      className="flex flex-wrap items-baseline justify-between gap-3 border-t pt-6"
      style={{
        borderColor: "var(--b-line)",
        fontSize: "var(--b-size-small)",
        color: "var(--b-muted)",
      }}
    >
      <span>{"想聊聊，发邮件就行。"}</span>
      {data.email && (
        <Magnetic>
          <a
            href={`mailto:${data.email}`}
            className="site-mono underline underline-offset-4"
            style={{
              ...mono,
              fontSize: "var(--b-size-small)",
              color: "var(--b-muted)",
              textDecorationColor: "var(--b-line)",
            }}
          >
            {data.email}
          </a>
        </Magnetic>
      )}
    </footer>
  );
}

export function ContactCard({ data }: SlotProps) {
  return (
    <Glass className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p
            className="site-display"
            style={{
              fontSize: "calc(var(--b-size-body) + 4px)",
              lineHeight: 1.4,
              color: "var(--b-ink)",
            }}
          >
            {"想聊聊，发邮件就行。"}
          </p>
          {data.city && (
            <p
              className="site-mono mt-1"
              style={{ ...mono, ...muted, fontSize: "var(--b-size-small)" }}
            >
              {data.city}
            </p>
          )}
        </div>

        {data.email ? (
          <Magnetic strength={5}>
            <a
              href={`mailto:${data.email}`}
              className="inline-flex items-center px-4 py-2.5"
              style={{
                background: "var(--b-ink)",
                color: "var(--b-bg)",
                borderRadius: "calc(var(--b-radius) * 0.7)",
                fontSize: "var(--b-size-small)",
              }}
            >
              {data.email}
            </a>
          </Magnetic>
        ) : (
          <span
            className="site-mono"
            style={{ ...mono, ...muted, fontSize: "var(--b-size-small)" }}
          >
            {"还没填邮箱"}
          </span>
        )}
      </div>
    </Glass>
  );
}


/** 首屏：大小不一的格子 */
export function HeroBento({ data }: SlotProps) {
  const tile = {
    background: "var(--b-surface)",
    border: "var(--b-border) solid var(--b-line)",
    borderRadius: "var(--b-radius)",
  } as CSSProperties;

  return (
    <header className="grid gap-3 sm:grid-cols-3">
      <div className="p-6 sm:col-span-2" style={tile}>
        <p
          className="site-mono"
          style={{ ...mono, ...muted, fontSize: "var(--b-size-small)" }}
        >
          {"个人主页"}
        </p>
        <h1
          className="site-display mt-4"
          style={{
            fontSize: "var(--b-size-name)",
            lineHeight: 1.08,
            fontWeight: 500,
          }}
        >
          {data.name || "你的名字"}
        </h1>
        {data.headline && (
          <p
            className="mt-2"
            style={{
              color: "var(--b-accent)",
              fontSize: "var(--b-size-sub)",
            }}
          >
            {data.headline}
          </p>
        )}
      </div>

      <div className="flex flex-col justify-between p-6" style={tile}>
        <span
          className="site-mono"
          style={{ ...mono, ...muted, fontSize: "var(--b-size-small)" }}
        >
          {data.city || "在哪"}
        </span>
        {data.email ? (
          <a
            href={`mailto:${data.email}`}
            className="break-all underline underline-offset-4"
            style={{
              fontSize: "var(--b-size-small)",
              color: "var(--b-ink-2)",
              textDecorationColor: "var(--b-line)",
            }}
          >
            {data.email}
          </a>
        ) : (
          <span style={{ fontSize: "var(--b-size-small)", color: "var(--b-muted)" }}>
            {"还没填邮箱"}
          </span>
        )}
      </div>
    </header>
  );
}

/** 项目：横向画廊，一屏一个 */
export function ProjectsStrip({ base, data, sections }: SlotProps) {
  const projects = (sections ?? data.sections).filter(
    (section) => section.kind === "project",
  );
  if (projects.length === 0) return null;

  return (
    <div className="-mx-[var(--b-px)] overflow-x-auto px-[var(--b-px)] pb-3">
      <ul className="flex snap-x snap-mandatory gap-4">
        {projects.map((section, index) => (
          <li
            key={index}
            className={
              projects.length === 1
                ? "w-full snap-start p-5"
                : "w-[320px] shrink-0 snap-start p-5"
            }
            style={{
              background: "var(--b-surface)",
              border: "var(--b-border) solid var(--b-line)",
              borderRadius: base.primitives.includes("mask") ? "0px" : "var(--b-radius)",
            }}
          >
            <div
              className="flex items-baseline justify-between"
              style={{ ...muted, fontSize: "var(--b-size-small)" }}
            >
              <span className="site-mono" style={{ ...mono, fontSize: "var(--b-size-small)" }}>
                {String(index + 1).padStart(2, "0")}
              </span>
              {section.period && (
                <span className="site-mono" style={{ ...mono }}>
                  {section.period}
                </span>
              )}
            </div>
            <h3
              className="mt-3"
              style={{
                fontSize: "calc(var(--b-size-body) + 2px)",
                fontWeight: 500,
                lineHeight: 1.35,
              }}
            >
              {section.title || section.org}
            </h3>
            {section.org && section.title && (
              <p style={{ ...muted, fontSize: "var(--b-size-small)", marginTop: 2 }}>
                {section.org}
              </p>
            )}
            <p
              className="mt-3"
              style={{
                color: "var(--b-ink-2)",
                lineHeight: 1.8,
                fontSize: "calc(var(--b-size-body) - 0.5px)",
                textWrap: "pretty",
              }}
            >
              {section.lines.join(" ")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
