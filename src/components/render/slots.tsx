import type { CSSProperties, ReactNode } from "react";
import type { SiteData, SiteSection } from "@/lib/site-data";
import { isSkillList } from "@/lib/site-data";
import type { BaseTokens, Recipe } from "@/lib/templates/types";
import { Grain } from "@/components/primitives/static";
import { ArtOrb, ArtPlateGhost, ArtStamp, ArtTiles } from "./hero-art";
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

/** 只是占位用的标题（老数据里可能是「经历」）不算一段真经历 */
const PLACEHOLDER_TITLE = /^(经历|工作经历|实习经历|实习|工作|项目|教育|技能)$/;

function isRealJob(section: SiteSection): boolean {
  if (section.kind !== "experience") return false;
  const title = section.title.trim();
  const org = section.org.trim();
  if (!title && !org) return false;
  if (title && !org && PLACEHOLDER_TITLE.test(title)) return false;
  return true;
}

/**
 * 从内容里推出现在在哪、读过什么——首屏那句「现在」。
 * 没有像样的实习就不拿它当「现在」，退回到「在校生 / 应届生」。
 */
export function deriveWhere(data: SiteData) {
  const job = data.sections.find(isRealJob);
  const edu = data.sections.find((section) => section.kind === "education");

  let status = "在校生";
  if (edu?.period) {
    const years = edu.period.match(/(?:19|20)\d{2}/g);
    const last = years?.length ? Number(years[years.length - 1]) : 0;
    if (last && last <= new Date().getFullYear()) status = "应届生";
  }

  const now = job
    ? [job.title, job.org].filter(Boolean).join(" · ")
    : edu
      ? [edu.org || edu.title, status].filter(Boolean).join(" · ")
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

/* ————————————————— 首屏 · 六种页型 ————————————————— */

/**
 * 首屏是「这套基底到底是什么」唯一说得清的地方。
 * 六套各自换掉整块骨架，而不只是换颜色：档案封面 / 终端窗口 / 杂志报头 / 图版 / 舞台 / 格子。
 */

function Year() {
  return <>{new Date().getFullYear()}</>;
}

function SmallMeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`site-mono ${className}`}
      style={{
        fontSize: "var(--b-size-meta)",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "var(--b-muted)",
      }}
    >
      {children}
    </span>
  );
}

/* 1 · Paper —— 一张档案封面：细线分栏、粗线压题、右下角一枚藏书章 */
export function HeroColumn({ data }: SlotProps) {
  return (
    <header className="site-hero site-hero--sheet">
      <div className="site-meta-row">
        <Eyebrow dot={false}>{data.city || "个人主页"}</Eyebrow>
        <SmallMeta>Portfolio — <Year /></SmallMeta>
      </div>

      <div className="site-sheet-name">
        <h1 className="site-h1">{data.name || "你的名字"}</h1>
        <ArtStamp name={data.name} className="site-sheet-stamp hidden sm:block" />
      </div>

      <div className="site-rule-strong" />

      {data.headline && (
        <p className="site-sheet-lead">
          {data.headline}
        </p>
      )}

      <div className="site-rule-hair" />
      <Facts data={data} />
    </header>
  );
}

/* 2 · Terminal —— 一个开着的窗口：行号、提示符、状态栏 */
export function HeroPrompt({ data }: SlotProps) {
  const { now } = deriveWhere(data);
  const nowLine = [now, data.city].filter(Boolean).join(" · ");

  return (
    <header className="site-hero site-hero--window">
      <div className="term">
        <div className="term__bar">
          <span className="term__dots" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <span className="term__path">~/portfolio</span>
          <span className="term__meta">bash — 80×24</span>
        </div>

        <div className="term__body">
          <p className="term__line">
            <i className="term__ln" aria-hidden>
              1
            </i>
            <span>
              <b className="term__prompt">$</b> whoami
            </span>
          </p>

          <div className="term__line term__line--big">
            <i className="term__ln" aria-hidden>
              2
            </i>
            <h1 className="site-h1 term__name">{data.name || "你的名字"}</h1>
          </div>

          {data.headline && (
            <>
              <p className="term__line">
                <i className="term__ln" aria-hidden>
                  3
                </i>
                <span>
                  <b className="term__prompt">$</b> cat headline.txt
                </span>
              </p>
              <p className="term__line term__line--out">
                <i className="term__ln" aria-hidden>
                  4
                </i>
                <span style={{ color: "var(--b-accent)" }}>
                  <Typewriter text={data.headline} />
                </span>
              </p>
            </>
          )}

          {nowLine && (
            <>
              <p className="term__line">
                <i className="term__ln" aria-hidden>
                  5
                </i>
                <span>
                  <b className="term__prompt">$</b> status --now
                </span>
              </p>
              <p className="term__line term__line--out">
                <i className="term__ln" aria-hidden>
                  6
                </i>
                <span className="term__status-dot">
                  <span className="site-dot" aria-hidden />
                  {nowLine}
                  <span className="site-caret" aria-hidden />
                </span>
              </p>
            </>
          )}

          {data.email && (
            <p className="term__line term__line--out">
              <i className="term__ln" aria-hidden>
                7
              </i>
              <a href={`mailto:${data.email}`} className="term__mail">
                {data.email}
              </a>
            </p>
          )}
        </div>

        <div className="term__foot">
          <span>UTF-8</span>
          <span>{data.city || "local"}</span>
          <span>-- INSERT --</span>
        </div>
      </div>
    </header>
  );
}

/* 3 · Editorial —— 报头：双线压题、超大衬线、脚注分栏 */
export function HeroMasthead({ base, data }: SlotProps) {
  const { now } = deriveWhere(data);

  return (
    <header className="site-hero site-hero--masthead">
      <div className="mast__top">
        <span>VOL. 01 — 个人主页</span>
        <span className="mast__topline" aria-hidden />
        <span>
          {data.city || "—"} · <Year />
        </span>
      </div>

      <div className="site-rule-strong" />

      <h1 className="site-h1 mast__name">{data.name || "你的名字"}</h1>

      <div className="site-rule-hair" />

      <div className="mast__mid">
        {data.headline && <p className="mast__standfirst">{data.headline}</p>}
        <span className="mast__folio site-display" aria-hidden>
          № {String(1).padStart(2, "0")}
        </span>
      </div>

      <div className="site-rule-strong" />

      <div className="mast__foot">
        <div>
          <span className="mast__k">邮箱</span>
          <span className="mast__v">
            {data.email ? (
              <a href={`mailto:${data.email}`}>{data.email}</a>
            ) : (
              "—"
            )}
          </span>
        </div>
        <div>
          <span className="mast__k">城市</span>
          <span className="mast__v">{data.city || "—"}</span>
        </div>
        <div>
          <span className="mast__k">现在</span>
          <span className="mast__v">{now || "—"}</span>
        </div>

      </div>
    </header>
  );
}

/* 4 · Gallery —— 一整块图版：名字压在图上，信息退到角落 */
export function HeroPlate({ data }: SlotProps) {
  const { now } = deriveWhere(data);

  return (
    <header className="site-hero site-hero--plate">
      <figure className="plate">
        <ArtPlateGhost text={data.name} className="plate__ghost" />

        <div className="plate__in">
          <div className="plate__head">
            <span>{data.city || "GALLERY"}</span>
            <span>
              01 — Portfolio / <Year />
            </span>
          </div>

          <div className="plate__mid">
            <h1 className="site-h1 plate__name">{data.name || "你的名字"}</h1>
            {data.headline && <p className="plate__lead">{data.headline}</p>}
          </div>

          <div className="plate__foot">
            <span>{now || "—"}</span>
            <span aria-hidden>↓</span>
          </div>
        </div>
      </figure>

      <Facts data={data} />
    </header>
  );
}

/* 5 · Studio —— 舞台：左边一块字，右边一颗光球 */
export function HeroSplit({ data }: SlotProps) {
  const { now } = deriveWhere(data);

  return (
    <header className="site-hero site-hero--stage">
      <div className="stage">
        <div className="stage__left">
          <Eyebrow>{now || "开放交流"}</Eyebrow>
          <h1 className="site-h1 stage__name">{data.name || "你的名字"}</h1>
          {data.headline && <p className="stage__lead">{data.headline}</p>}
          <div className="stage__facts">
            <Facts data={data} />
          </div>
        </div>

        <div className="stage__right">
          <ArtOrb className="stage__orb" />
          <span className="stage__tag site-mono">scroll ↓</span>
        </div>
      </div>
    </header>
  );
}

/* 6 · Bento —— 首屏就是一张格子：名字占大格，其余各自一格 */
export function HeroBento({ data }: SlotProps) {
  const { now } = deriveWhere(data);
  const edu = data.sections.find((section) => section.kind === "education");

  return (
    <header className="site-hero site-hero--bento">
      <div className="bento">
        <div className="bento__tile bento__tile--name">
          <span className="bento__k">个人主页</span>
          <h1 className="site-h1 bento__name">{data.name || "你的名字"}</h1>
          {data.headline && <p className="bento__lead">{data.headline}</p>}
          <ArtTiles className="bento__art" />
        </div>

        <div className="bento__tile bento__tile--now">
          <span className="bento__k">现在</span>
          <p className="bento__v">{now || "—"}</p>
        </div>

        <div className="bento__tile">
          <span className="bento__k">城市</span>
          <p className="bento__v">{data.city || "—"}</p>
        </div>

        <div className="bento__tile">
          <span className="bento__k">邮箱</span>
          <p className="bento__v break-all">
            {data.email ? <a href={`mailto:${data.email}`}>{data.email}</a> : "—"}
          </p>
        </div>

        <div className="bento__tile bento__tile--edu">
          <span className="bento__k">在校</span>
          <p className="bento__v">{edu ? [edu.org, edu.title].filter(Boolean).join(" · ") : "—"}</p>
        </div>
      </div>
    </header>
  );
}

/* ————————————————— 经历 / 项目 · 抬头式 ————————————————— */

/**
 * 大段文字没人看得出重点，所以把每条经历压成一句话：
 * 一个能一眼读完的「抬头」（数字或名号），下面一行解释，再下面才是细节。
 *
 * emphasis:
 *   metric —— 抬头取内容里最硬的那个数字（1.6s、1200 本、专业前 15%）
 *   title  —— 抬头取名号本身（奖项、证书、项目名），数字退成解释
 */

const METRIC = /(\d+(?:[.,]\d+)?)\s*(秒|s|ms|毫秒|分钟|%|分|本|人|名|个|次|篇|行|万|k|K|倍)?/g;

function pickEmphasis(
  section: SiteSection,
  mode: string,
): { big: string; sub: string; rest: string[] } {
  const lines = section.lines ?? [];

  if (mode === "metric") {
    // 每行挑一个候选：有时间单位就取最后一个（“从 4.2s 降到 1.6s”要的是 1.6s），
    // 没有就取数值最大的；再跨行按「时间 > 百分比 > 绝对值」排序。
    const candidates = lines
      .map((line) => {
        const all = [...line.matchAll(METRIC)];
        if (all.length === 0) return null;

        const timed = all.filter((m) => /^(s|ms|秒|毫秒)$/.test(m[2] ?? ""));
        const gpa = /GPA\s*([\d.]+)/i.exec(line);

        let pick: [string, string];
        if (gpa) {
          pick = [gpa[1], ""];
        } else if (timed.length > 0) {
          // 有耗时数字就取最后一个：「从 4.2s 降到 1.6s」的重点是 1.6s
          const last = timed[timed.length - 1];
          pick = [last[1], last[2] ?? ""];
        } else {
          pick = all.reduce<[string, string]>((best, m) => {
            const v = parseFloat(m[1].replace(",", ""));
            return v > parseFloat(best[0].replace(",", "")) ? [m[1], m[2] ?? ""] : best;
          }, [all[0][1], all[0][2] ?? ""]);
        }

        const unit = pick[1];
        const value = parseFloat(pick[0].replace(",", ""));
        // 能体现能力的优先：覆盖范围、交付量、百分比；纯耗时放最后
        const isTime = /^(s|ms|秒|毫秒)$/.test(unit);
        const weight = isTime
          ? value * 0.4
          : value * (unit === "%" ? 6 : unit === "倍" ? 4 : unit === "万" || unit === "k" || unit === "K" ? 3 : 1);
        return { line, num: pick[0], unit, weight, isTime };
      })
      .filter(
        (item): item is { line: string; num: string; unit: string; weight: number; isTime: boolean } =>
          item !== null,
      )
      .sort((a, b) => b.weight - a.weight);

    // 只剩耗时的话宁可放大名号：一个 900ms 说明不了这个人会什么，
    // 抬头写岗位名，数字退到下面那几行里照样看得见。
    if (candidates.length > 0 && !candidates[0].isTime) {
      const top = candidates[0];
      return {
        big: top.num + top.unit,
        sub: top.line,
        rest: lines.filter((line) => line !== top.line),
      };
    }
  }

  return {
    big: section.title || section.org || "—",
    sub: [section.org, section.period].filter(Boolean).join(" · "),
    rest: lines,
  };
}

export function EntriesShowcase({ base, data, recipe, sections }: SlotProps) {
  const list = sections ?? data.sections;
  if (!list || list.length === 0) return null;
  const mode = String(recipe.params?.emphasis ?? "metric");

  return (
    <div className="showcase">
      {list.map((section, index) => {
        const pick = pickEmphasis(section, mode);

        return (
          <article className="showcase__item" key={`${section.title}-${index}`}>
            <div className="showcase__lead">
              <p className="showcase__big">{pick.big}</p>
              {mode === "metric" ? (
                <p className="showcase__sub">{pick.sub}</p>
              ) : (
                <p className="showcase__sub">
                  {[section.org, section.period].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>

            <div className="showcase__body">
              <p className="showcase__meta">
                {mode === "metric" ? (
                  <>
                    <span className="showcase__title">{section.title}</span>
                    <span>
                      {[section.org, section.period].filter(Boolean).join(" · ")}
                    </span>
                  </>
                ) : (
                  <span>{section.period || section.title}</span>
                )}
              </p>

              {pick.rest.length > 0 && (
                <ul className="showcase__rest">
                  {pick.rest.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        );
      })}
      <span className="showcase__hint" aria-hidden>
        {base.nameEn}
      </span>
    </div>
  );
}

/* ---------------- 经历 / 项目 · 方框墙 / 错位 ---------------- */

export function BoxWall({ data, recipe, sections }: SlotProps) {
  const list = sections ?? data.sections;
  if (!list || list.length === 0) return null;
  const stagger = recipe.layout === "stagger";

  return (
    <div className={stagger ? "boxwall boxwall--stagger" : "boxwall"}>
      {list.map((section, index) => (
        <article className="boxwall__card" key={`${section.title}-${index}`}>
          <div className="boxwall__head">
            <span className="boxwall__num">{String(index + 1).padStart(2, "0")}</span>
            <span className="boxwall__period">{section.period}</span>
          </div>
          <p className="boxwall__title">{section.title}</p>
          {section.org && <p className="boxwall__org">{section.org}</p>}
          {section.lines.length > 0 && (
            <ul className="boxwall__lines">
              {section.lines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}

/* ---------------- 技能 · 环形 ---------------- */

import { SkillRing as RingView } from "./skill-ring";

export function SkillsRing({ data }: SlotProps) {
  return <RingView skills={data.skills} />;
}

/* ---------------- 首屏 · 方框 ---------------- */

export function HeroFrame({ data }: SlotProps) {
  const { now } = deriveWhere(data);

  return (
    <header className="site-hero site-hero--frame">
      <div className="frame">
        <div className="frame__box frame__box--name">
          <span className="frame__k">个人主页</span>
          <h1 className="site-h1 frame__name">{data.name || "你的名字"}</h1>
          {data.headline && <p className="frame__lead">{data.headline}</p>}
        </div>

        <div className="frame__box frame__box--now">
          <span className="frame__k">现在</span>
          <p className="frame__v">{now || "—"}</p>
        </div>

        <div className="frame__box frame__box--meta">
          <div>
            <span className="frame__k">城市</span>
            <p className="frame__v">{data.city || "—"}</p>
          </div>
          <div>
            <span className="frame__k">邮箱</span>
            <p className="frame__v break-all">
              {data.email ? <a href={`mailto:${data.email}`}>{data.email}</a> : "—"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------------- 首屏 · 海报 / 环形 ---------------- */

export function HeroPoster({ data }: SlotProps) {
  const chars = (data.name || "你的名字").split("").slice(0, 4);

  return (
    <header className="site-hero site-hero--poster">
      <div className="poster__top">
        <span>{data.city || "个人主页"}</span>
        <span>Portfolio — <Year /></span>
      </div>

      <h1 className="poster__name" aria-label={data.name || "你的名字"}>
        {chars.map((char, index) => (
          <span key={index}>{char}</span>
        ))}
      </h1>

      <div className="poster__foot">
        {data.headline && <p className="poster__lead">{data.headline}</p>}
        <Facts data={data} />
      </div>
    </header>
  );
}

export function HeroOrbit({ data }: SlotProps) {
  const { now } = deriveWhere(data);

  return (
    <header className="site-hero site-hero--orbit">
      <div className="orbit">
        <ArtOrb className="orbit__ball" />
        <div className="orbit__text">
          <Eyebrow>{[data.city, now].filter(Boolean).join(" · ") || "个人主页"}</Eyebrow>
          <h1 className="site-h1 orbit__name">{data.name || "你的名字"}</h1>
          {data.headline && <p className="orbit__lead">{data.headline}</p>}
        </div>
      </div>
      <Facts data={data} />
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

/**
 * 把一段自我介绍拆成 2–4 个短点，塞进格子。
 * 长句先按逗号断开（一句里塞三件事，格子里读不动），短片段再并回上一格。
 */
function splitPoints(text: string, max = 4): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const sentences = clean
    .split(/(?<=[。！？；])/)
    .map((piece) => piece.trim())
    .filter(Boolean);

  const pieces: string[] = [];
  for (const sentence of sentences) {
    if (pieces.length < max && sentence.length > 18) {
      pieces.push(
        ...sentence
          .split(/(?<=[，,])/)
          .map((piece) => piece.trim())
          .filter(Boolean),
      );
    } else {
      pieces.push(sentence);
    }
  }

  const merged: string[] = [];
  for (const piece of pieces) {
    const last = merged[merged.length - 1];
    if (last !== undefined && piece.length < 5) merged[merged.length - 1] = last + piece;
    else merged.push(piece);
  }

  const cleaned = merged.map((piece) => piece.replace(/[，,。；;：:]$/, ""));
  if (cleaned.length <= max) return cleaned;

  // 超过格子数就并进最后一格，宁可长一点也不能吞字
  return [
    ...cleaned.slice(0, max - 1),
    cleaned.slice(max - 1).join("，"),
  ];
}

/** 关于 · 要点格：从自我介绍里提取重点，不再重复首屏那排事实 */
export function AboutPoints({ data }: SlotProps) {
  const points = splitPoints(data.summary ?? "");
  if (points.length === 0) return null;

  return (
    <div className="points">
      {points.map((point, index) => (
        <div className="points__cell" key={index}>
          <span className="points__n">{String(index + 1).padStart(2, "0")}</span>
          <p>{point}</p>
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
        {data.email ? "有合适的机会，欢迎来信。" : "—"}
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

/* ═══════════════ 第二批讲法 ═══════════════ */

/* ————— 关于 · 首字下沉 ————— */

/** 首字用 ::first-letter 放大，DOM 里还是整段文字，复制和朗读都不缺字 */
export function AboutDropcap({ data }: SlotProps) {
  if (!data.summary) return null;
  return <p className="adrop">{data.summary}</p>;
}

/* ————— 关于 · 编号条目 ————— */

export function AboutNumbered({ data }: SlotProps) {
  if (!data.summary) return null;
  const parts = data.summary
    .split(/(?<=[。！？!?])/)
    .map((part) => part.trim())
    .filter(Boolean);
  const items = parts.length > 1 ? parts : [data.summary.trim()];

  return (
    <ol className="alist">
      {items.map((item, index) => (
        <li key={index}>
          <span className="alist__num">{String(index + 1).padStart(2, "0")}</span>
          <p>{item}</p>
        </li>
      ))}
    </ol>
  );
}

/* ————— 经历 · 表格 ————— */

export function ExperienceTable({ data, sections }: SlotProps) {
  const groups = groupByKind(sections ?? data.sections);
  const th = ["时间", "单位", "角色", "做了什么"];

  return (
    <div className="etable">
      {groups.map((group) => (
        <table key={group.kind}>
          <thead>
            <tr>
              {th.map((label) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {group.items.map((section, index) => (
              <tr key={index}>
                <td data-k={th[0]} className="etable__when">
                  {section.period || "—"}
                </td>
                <td data-k={th[1]} className="etable__org">
                  {section.org || "—"}
                </td>
                <td data-k={th[2]} className="etable__role">
                  {section.title || "—"}
                </td>
                <td data-k={th[3]}>
                  <ul className="etable__out">
                    {section.lines.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  );
}

/* ————— 经历 · 阶梯 ————— */

export function ExperienceSteps({ data, sections }: SlotProps) {
  const groups = groupByKind(sections ?? data.sections);

  return (
    <div className="steps">
      {groups.map((group) => (
        <div key={group.kind}>
          {group.items.map((section, index) => (
            <article className="steps__item" key={index}>
              <span className="steps__num" aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="steps__body">
                <p className="steps__meta">
                  {[section.period, section.org].filter(Boolean).join(" · ")}
                </p>
                <h3>{section.title || section.org}</h3>
                <Bullets lines={section.lines} />
              </div>
            </article>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ————— 项目 · 索引（点线引导） ————— */

export function ProjectsIndex({ data, sections }: SlotProps) {
  const projects = (sections ?? data.sections).filter((s) => s.kind === "project");
  if (projects.length === 0) return null;

  return (
    <ol className="pindex">
      {projects.map((project, index) => (
        <li key={index}>
          <div className="pindex__row">
            <span className="pindex__num">{String(index + 1).padStart(2, "0")}</span>
            <h3 className="pindex__name">{project.title || project.org}</h3>
            <span className="pindex__lead" aria-hidden />
            <span className="pindex__when">
              {[project.org, project.period].filter(Boolean).join(" · ")}
            </span>
          </div>
          <Bullets lines={project.lines} />
        </li>
      ))}
    </ol>
  );
}

/* ————— 项目 · 横向卡 ————— */

/**
 * 一条记录一行：序号 / 正文 / 时间。
 * 左边那块色块原本是想当缩略图，但项目没有图，它只是「填充色 + 编号」——
 * 换成三栏对齐后，卡片里每个字都有信息，也不再把强调色铺满一大片。
 */
export function ProjectsStack({ data, sections }: SlotProps) {
  const projects = (sections ?? data.sections).filter((s) => s.kind === "project");
  if (projects.length === 0) return null;

  return (
    <div className="pstack">
      {projects.map((project, index) => (
        <article className="pstack__item" key={index}>
          <span className="pstack__no" aria-hidden>
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="pstack__body">
            {project.title && project.org && <p className="pstack__k">{project.org}</p>}
            <h3>{project.title || project.org}</h3>
            <Bullets lines={project.lines} />
          </div>
          {project.period && <p className="pstack__when">{project.period}</p>}
        </article>
      ))}
    </div>
  );
}

/* ————— 技能 · 分类 ————— */

/** 只做归类，不做熟练度：没有的数据不编 */
const SKILL_GROUPS: { label: string; test: RegExp }[] = [
  {
    label: "语言",
    test: /^(js|ts|javascript|typescript|python|java|go|golang|c\+\+|c#|kotlin|swift|rust|php|ruby|sql|html|css|scss|less|shell|dart)$/i,
  },
  {
    label: "框架",
    test: /(react|vue|next|nuxt|angular|svelte|solid|spring|express|koa|nest|django|flask|fastapi|taro|uni-app|flutter|electron|three)/i,
  },
  {
    label: "工具",
    test: /(git|docker|k8s|kubernetes|webpack|vite|rollup|babel|figma|linux|nginx|jest|vitest|cypress|postman|mysql|redis|mongo|postgres|prisma|jenkins|grafana)/i,
  },
];

function groupSkills(skills: string[]) {
  const groups: { label: string; items: string[] }[] = [];
  for (const skill of skills) {
    const label = SKILL_GROUPS.find((group) => group.test.test(skill))?.label ?? "其他";
    const bucket = groups.find((group) => group.label === label);
    if (bucket) bucket.items.push(skill);
    else groups.push({ label, items: [skill] });
  }
  return groups;
}

export function SkillsMatrix({ data }: SlotProps) {
  if (data.skills.length === 0) return null;
  if (!isSkillList(data.skills)) return <SkillsSentence skills={data.skills} />;
  const groups = groupSkills(data.skills);

  return (
    <div className="smatrix">
      {groups.map((group) => (
        <div className="smatrix__col" key={group.label}>
          <p className="smatrix__k">{group.label}</p>
          <ul>
            {group.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function SkillsRows({ data }: SlotProps) {
  if (data.skills.length === 0) return null;
  if (!isSkillList(data.skills)) return <SkillsSentence skills={data.skills} />;
  const groups = groupSkills(data.skills);

  return (
    <div className="srows">
      {groups.map((group) => (
        <div className="srows__row" key={group.label}>
          <span className="srows__k">{group.label}</span>
          <div className="srows__items">
            {group.items.map((item, index) => (
              <SkillChip key={index}>{item}</SkillChip>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ————— 联系 · 票据 ————— */

export function ContactTicket({ data }: SlotProps) {
  const { now } = deriveWhere(data);

  return (
    <div className="ticket">
      <div className="ticket__main">
        <div>
          <p className="ticket__k">CONTACT</p>
          <p className="ticket__big">有合适的机会，欢迎来信。</p>
        </div>
        <p className="ticket__who">{[data.name, data.city].filter(Boolean).join(" · ")}</p>
      </div>
      <div className="ticket__stub">
        <div>
          <span className="ticket__k">邮箱</span>
          {data.email ? (
            <a href={`mailto:${data.email}`} className="ticket__mail">
              {data.email}
            </a>
          ) : (
            <span className="ticket__mail">—</span>
          )}
        </div>
        {now && <span className="ticket__now">{now}</span>}
      </div>
    </div>
  );
}

export function ContactBanner({ data }: SlotProps) {
  return (
    <div
      className="site-banner relative overflow-hidden px-8 py-12 sm:px-12 sm:py-16"
      style={{
        background: "var(--b-accent)",
        color: "var(--b-on-accent)",
        borderRadius: "var(--b-radius)",
      }}
    >
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

/* ═══════════════ 第三批：极简 ═══════════════
   这一批只做「少」：留白、细线、一个大字。
   不加边框、不加阴影、不加底色，靠字号和间距撑。 */

/* ————— 首屏 · 居中 ————— */

export function HeroCenter({ data }: SlotProps) {
  const { now } = deriveWhere(data);

  return (
    <header className="site-hero">
      <div className="hcenter">
        <p className="hcenter__k">
          {[data.city, now].filter(Boolean).join(" · ") || "个人主页"}
        </p>
        <h1 className="site-h1 hcenter__name">{data.name || "你的名字"}</h1>
        {data.headline && <p className="hcenter__lead">{data.headline}</p>}
        <div className="hcenter__rule" />
        <Facts data={data} />
      </div>
    </header>
  );
}

/* ————— 关于 · 双栏正文 ————— */

export function AboutTwocol({ data }: SlotProps) {
  if (!data.summary) return null;
  // 字数不够就别硬排两栏：一句话被切成两截，第二栏只剩半句，读起来像断句
  const single = data.summary.length < 90;
  return (
    <div className={single ? "twocol twocol--one" : "twocol"}>
      <p>{data.summary}</p>
    </div>
  );
}

/* ————— 经历 · 紧凑 ————— */

export function ExperienceCompact({ data, sections }: SlotProps) {
  const groups = groupByKind(sections ?? data.sections);

  return (
    <div className="compact">
      {groups.map((group) => (
        <div key={group.kind}>
          {group.items.map((section, index) => (
            <article className="compact__row" key={index}>
              <div className="compact__head">
                <h3>{section.title || section.org}</h3>
                {section.period && <span className="compact__when">{section.period}</span>}
              </div>
              {section.title && section.org && (
                <p className="compact__org">{section.org}</p>
              )}
              {section.lines.length > 0 && (
                <p className="compact__lines">{section.lines.join(" · ")}</p>
              )}
            </article>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ————— 项目 · 细线两列 ————— */

export function ProjectsMinimal({ data, sections }: SlotProps) {
  const projects = (sections ?? data.sections).filter((s) => s.kind === "project");
  if (projects.length === 0) return null;

  return (
    <div className="pmin">
      {projects.map((project, index) => (
        <article className="pmin__item" key={index}>
          <span className="pmin__line" aria-hidden />
          <div className="pmin__row">
            <h3>{project.title || project.org}</h3>
            <span className="pmin__when">{project.period}</span>
          </div>
          {project.org && <p className="pmin__org">{project.org}</p>}
          {project.lines.length > 0 && (
            <p className="pmin__lines">{project.lines.join(" · ")}</p>
          )}
        </article>
      ))}
    </div>
  );
}

/* ————— 技能 · 三列 ————— */

export function SkillsGrid3({ data }: SlotProps) {
  if (data.skills.length === 0) return null;
  if (!isSkillList(data.skills)) return <SkillsSentence skills={data.skills} />;
  return (
    <ul className="skill3">
      {data.skills.map((skill, index) => (
        <li key={index}>{skill}</li>
      ))}
    </ul>
  );
}

/* ————— 联系 · 大邮箱 ————— */

export function ContactBigmail({ data }: SlotProps) {
  const { now } = deriveWhere(data);

  return (
    <div className="bigmail">
      <p className="bigmail__k">写信给我</p>
      {data.email ? (
        <a className="bigmail__mail" href={`mailto:${data.email}`}>
          {data.email}
        </a>
      ) : (
        <span className="bigmail__mail">—</span>
      )}
      <p className="bigmail__sub">
        {[data.name, data.city, now].filter(Boolean).join(" · ")}
      </p>
    </div>
  );
}
