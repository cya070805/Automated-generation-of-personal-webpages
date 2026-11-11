import type { BaseId, BaseTokens } from "./types";

/**
 * 六套基底。
 *
 * 基底不是模板：它只给令牌和排版节奏，不给固定版式。
 * 想加一套，照抄一份、改令牌，再在默认配方表里给它挑讲法即可。
 *
 * 2026-11 改版：字阶拉开到 7:1（首屏一百多像素、正文十五像素），
 * 页面从「一栏正文」变成「栏目标题栏 + 正文」两栏，六套各自带页框。
 */

const SANS =
  'ui-sans-serif, system-ui, -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", sans-serif';
const MONO =
  'ui-monospace, "SFMono-Regular", "JetBrains Mono", Consolas, "Liberation Mono", monospace';
const SERIF =
  'Georgia, "Times New Roman", "Songti SC", "STSong", "Source Han Serif SC", "SimSun", serif';

export const BASES: BaseTokens[] = [
  {
    id: "paper",
    name: "Paper",
    nameEn: "Paper",
    tagline: "白纸黑字，一页读完",
    audience: "通用。投什么岗位都不会出错，打印出来也好看。",
    status: "ready",
    color: {
      bg: "#fcfcfa",
      surface: "#f4f4ef",
      band: "#f6f6f1",
      ink: "#141416",
      ink2: "#3c3e42",
      muted: "#74767a",
      line: "#e4e4de",
      accent: "#1d4ed8",
      onAccent: "#ffffff",
      accentSoft: "#eef2ff",
    },
    font: {
      sans: SANS,
      mono: MONO,
      display: SANS,
      displayWeight: 600,
      displayTracking: "-0.045em",
    },
    shape: { radius: "10px", borderWidth: "1px" },
    space: {
      maxWidth: "1120px",
      pageX: "32px",
      sectionGap: "76px",
      blockGap: "30px",
      measure: "42ch",
      rail: "148px",
    },
    type: {
      display: "clamp(52px, 8vw, 104px)",
      title: "19px",
      lead: "18px",
      body: "15px",
      sub: "14px",
      small: "12.5px",
      meta: "11.5px",
    },
    rhythm: {
      density: "airy",
      marker: "index",
      hero: "column",
      divider: "hairline",
      frame: "rule",
    },
    motion: "low",
    primitives: ["grain"],
    swatch: {
      bg: "#fcfcfa",
      fg: "#141416",
      muted: "#74767a",
      line: "#e4e4de",
      accent: "#1d4ed8",
    },
  },
  {
    id: "terminal",
    name: "Terminal",
    nameEn: "Terminal",
    tagline: "一台开着的机器",
    audience: "计算机、算法、后端。看起来就像他们每天待着的地方。",
    status: "ready",
    color: {
      bg: "#0a0c0e",
      surface: "#11161a",
      band: "#0d1013",
      ink: "#e9ecef",
      ink2: "#b6bec6",
      muted: "#79828a",
      line: "#1d232a",
      accent: "#5eead4",
      onAccent: "#062b25",
      accentSoft: "#0c2521",
    },
    font: {
      sans: SANS,
      mono: MONO,
      display: MONO,
      displayWeight: 500,
      displayTracking: "-0.03em",
    },
    shape: { radius: "8px", borderWidth: "1px" },
    space: {
      maxWidth: "1080px",
      pageX: "28px",
      sectionGap: "68px",
      blockGap: "28px",
      measure: "46ch",
      rail: "128px",
    },
    type: {
      display: "clamp(38px, 5.6vw, 74px)",
      title: "17px",
      lead: "16px",
      body: "14px",
      sub: "13.5px",
      small: "12px",
      meta: "11px",
    },
    rhythm: {
      density: "normal",
      marker: "hash",
      hero: "prompt",
      divider: "hairline",
      frame: "chrome",
    },
    motion: "low",
    primitives: ["scanline", "typewriter"],
    swatch: {
      bg: "#0a0c0e",
      fg: "#e9ecef",
      muted: "#79828a",
      line: "#1d232a",
      accent: "#5eead4",
    },
  },
  {
    id: "editorial",
    name: "Editorial",
    nameEn: "Editorial",
    tagline: "杂志报头，大字标题",
    audience: "文字多、人文社科。经历写成长段也不显挤。",
    status: "ready",
    color: {
      bg: "#faf8f2",
      surface: "#f2ede0",
      band: "#f4f0e4",
      ink: "#16130f",
      ink2: "#3a352c",
      muted: "#6d6659",
      line: "#ded7c6",
      accent: "#b02a1e",
      onAccent: "#ffffff",
      accentSoft: "#f6e7e2",
    },
    font: {
      sans: SANS,
      mono: MONO,
      display: SERIF,
      displayWeight: 400,
      displayTracking: "-0.02em",
    },
    shape: { radius: "2px", borderWidth: "1px" },
    space: {
      maxWidth: "1120px",
      pageX: "34px",
      sectionGap: "92px",
      blockGap: "34px",
      measure: "40ch",
      rail: "156px",
    },
    type: {
      display: "clamp(54px, 9vw, 120px)",
      title: "21px",
      lead: "19px",
      body: "15px",
      sub: "14.5px",
      small: "12px",
      meta: "11px",
    },
    rhythm: {
      density: "airy",
      marker: "numbered",
      hero: "masthead",
      divider: "hairline",
      frame: "masthead",
    },
    motion: "low",
    primitives: ["grain", "sticker"],
    swatch: {
      bg: "#faf8f2",
      fg: "#16130f",
      muted: "#6d6659",
      line: "#ded7c6",
      accent: "#b02a1e",
    },
  },
  {
    id: "gallery",
    name: "Gallery",
    nameEn: "Gallery",
    tagline: "大图少字，作品优先",
    audience: "设计、摄影、建筑。有图的人，文字只是注解。",
    status: "ready",
    color: {
      bg: "#f1f0eb",
      surface: "#ffffff",
      band: "#e9e7e0",
      ink: "#191815",
      ink2: "#47443d",
      muted: "#75726a",
      line: "#dcd9d0",
      accent: "#191815",
      onAccent: "#ffffff",
      accentSoft: "#e7e4db",
    },
    font: {
      sans: SANS,
      mono: MONO,
      display: SANS,
      displayWeight: 500,
      displayTracking: "-0.038em",
    },
    shape: { radius: "0px", borderWidth: "1px" },
    space: {
      maxWidth: "1240px",
      pageX: "40px",
      sectionGap: "96px",
      blockGap: "36px",
      measure: "52ch",
      rail: "0px",
    },
    type: {
      display: "clamp(44px, 6.6vw, 88px)",
      title: "20px",
      lead: "17px",
      body: "15px",
      sub: "14px",
      small: "12px",
      meta: "10.5px",
    },
    rhythm: {
      density: "airy",
      marker: "none",
      hero: "plate",
      divider: "none",
      frame: "none",
    },
    motion: "medium",
    primitives: ["mask", "tilt", "scroll"],
    swatch: {
      bg: "#f1f0eb",
      fg: "#191815",
      muted: "#75726a",
      line: "#dcd9d0",
      accent: "#191815",
    },
  },
  {
    id: "studio",
    name: "Studio",
    nameEn: "Studio",
    tagline: "深色底 + 一块颜色",
    audience: "前端、创意技术。想张扬一点，但不想做成 3D 展厅。",
    status: "ready",
    color: {
      bg: "#0e1016",
      surface: "#171b24",
      band: "#13161e",
      ink: "#f2f4f8",
      ink2: "#c2c8d4",
      muted: "#858d9c",
      line: "#242935",
      accent: "#8b5cf6",
      onAccent: "#ffffff",
      accentSoft: "#1e1933",
    },
    font: {
      sans: SANS,
      mono: MONO,
      display: SANS,
      displayWeight: 600,
      displayTracking: "-0.042em",
    },
    shape: { radius: "18px", borderWidth: "1px" },
    space: {
      maxWidth: "1160px",
      pageX: "32px",
      sectionGap: "84px",
      blockGap: "32px",
      measure: "46ch",
      rail: "148px",
    },
    type: {
      display: "clamp(48px, 7.6vw, 100px)",
      title: "19px",
      lead: "17px",
      body: "14.5px",
      sub: "14px",
      small: "12px",
      meta: "11px",
    },
    rhythm: {
      density: "normal",
      marker: "none",
      hero: "split",
      divider: "block",
      frame: "grid",
    },
    motion: "high",
    primitives: ["gradient-grid", "particles"],
    swatch: {
      bg: "#0e1016",
      fg: "#f2f4f8",
      muted: "#858d9c",
      line: "#242935",
      accent: "#8b5cf6",
    },
  },
  {
    id: "bento",
    name: "Bento",
    nameEn: "Bento",
    tagline: "大小不一的格子",
    audience: "模块多、产品与工程岗。信息多，但一眼能扫完。",
    status: "ready",
    color: {
      bg: "#f0f0ec",
      surface: "#ffffff",
      band: "#f7f7f3",
      ink: "#0e1014",
      ink2: "#3a3e45",
      muted: "#6c717a",
      line: "#e2e2dc",
      accent: "#2563eb",
      onAccent: "#ffffff",
      accentSoft: "#edf3ff",
    },
    font: {
      sans: SANS,
      mono: MONO,
      display: SANS,
      displayWeight: 600,
      displayTracking: "-0.04em",
    },
    shape: { radius: "18px", borderWidth: "1px" },
    space: {
      maxWidth: "1180px",
      pageX: "28px",
      sectionGap: "64px",
      blockGap: "24px",
      measure: "46ch",
      rail: "132px",
    },
    type: {
      display: "clamp(42px, 6.4vw, 86px)",
      title: "18px",
      lead: "16px",
      body: "14.5px",
      sub: "14px",
      small: "12px",
      meta: "11px",
    },
    rhythm: {
      density: "tight",
      marker: "none",
      hero: "bento",
      divider: "block",
      frame: "tile",
    },
    motion: "medium",
    primitives: ["glass", "meter"],
    swatch: {
      bg: "#f0f0ec",
      fg: "#0e1014",
      muted: "#6c717a",
      line: "#e2e2dc",
      accent: "#2563eb",
    },
  },
];

export const READY_BASES = BASES.filter((base) => base.status === "ready");

export const DEFAULT_BASE_ID: BaseId = "paper";

export function getBase(id?: string | null): BaseTokens {
  return (
    READY_BASES.find((base) => base.id === id) ??
    READY_BASES.find((base) => base.id === DEFAULT_BASE_ID) ??
    BASES[0]
  );
}

export function isReadyBase(id?: string | null): boolean {
  return READY_BASES.some((base) => base.id === id);
}

/** 令牌 → CSS 变量。渲染层只认变量，不认基底名。 */
export function baseCssVars(base: BaseTokens): Record<string, string> {
  return {
    "--b-bg": base.color.bg,
    "--b-surface": base.color.surface,
    "--b-band": base.color.band,
    "--b-ink": base.color.ink,
    "--b-ink-2": base.color.ink2,
    "--b-muted": base.color.muted,
    "--b-line": base.color.line,
    "--b-accent": base.color.accent,
    "--b-on-accent": base.color.onAccent,
    "--b-accent-soft": base.color.accentSoft,
    "--b-radius": base.shape.radius,
    "--b-border": base.shape.borderWidth,
    "--b-maxw": base.space.maxWidth,
    "--b-px": base.space.pageX,
    "--b-section-gap": base.space.sectionGap,
    "--b-block-gap": base.space.blockGap,
    "--b-measure": base.space.measure,
    "--b-rail": base.space.rail,
    "--b-size-display": base.type.display,
    "--b-size-title": base.type.title,
    "--b-size-lead": base.type.lead,
    "--b-size-body": base.type.body,
    "--b-size-sub": base.type.sub,
    "--b-size-small": base.type.small,
    "--b-size-meta": base.type.meta,
    "--b-weight-display": String(base.font.displayWeight),
    "--b-tracking-display": base.font.displayTracking,
    "--b-font-sans": base.font.sans,
    "--b-font-mono": base.font.mono,
    "--b-font-display": base.font.display,
  };
}


/**
 * 打印用的令牌：不管是哪套基底，落到纸上都是白底黑字。
 * 字体、字号、疏密保留，只把颜色和动效换掉——PDF 与页面同源渲染，不是二次排版。
 */
export function toPrintBase(base: BaseTokens): BaseTokens {
  return {
    ...base,
    color: {
      bg: "#ffffff",
      surface: "#fafafa",
      band: "#ffffff",
      ink: "#111111",
      ink2: "#333333",
      muted: "#666666",
      line: "#dcdcdc",
      accent: "#111111",
      onAccent: "#ffffff",
      accentSoft: "#f2f2f2",
    },
    shape: { radius: "0px", borderWidth: "1px" },
    motion: "none",
    primitives: [],
    // 页框保留：纸面上也要有页码式的结构和章节线，只把带装饰的换成素线
    rhythm: {
      ...base.rhythm,
      frame:
        base.rhythm.frame === "chrome"
          ? "rule"
          : base.rhythm.frame === "grid"
            ? "rule"
            : base.rhythm.frame,
    },
  };
}
