import type { BaseId, BaseTokens } from "./types";

/**
 * 六套基底。
 *
 * 基底不是模板：它只给令牌和排版节奏，不给固定版式。
 * 想加一套，照抄一份、改令牌，再在默认配方表里给它挑讲法即可。
 */

const SANS =
  'ui-sans-serif, system-ui, -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", sans-serif';
const MONO =
  'ui-monospace, "SFMono-Regular", "JetBrains Mono", Consolas, "Liberation Mono", monospace';
const SERIF =
  'Georgia, "Times New Roman", "Songti SC", "Song Serif", "Source Han Serif SC", serif';

export const BASES: BaseTokens[] = [
  {
    id: "paper",
    name: "Paper",
    nameEn: "Paper",
    tagline: "白纸黑字，一页读完",
    audience: "通用。投什么岗位都不会出错，打印出来也好看。",
    status: "ready",
    color: {
      bg: "#ffffff",
      surface: "#f6f6f4",
      ink: "#111214",
      ink2: "#3f4145",
      muted: "#737579",
      line: "#e8e8e5",
      accent: "#1d4ed8",
      onAccent: "#ffffff",
    },
    font: { sans: SANS, mono: MONO, display: SANS },
    shape: { radius: "8px", borderWidth: "1px" },
    space: {
      maxWidth: "680px",
      pageX: "28px",
      sectionGap: "56px",
      blockGap: "28px",
      measure: "58ch",
    },
    type: {
      name: "34px",
      lead: "15.5px",
      body: "14.5px",
      sub: "15px",
      small: "12.5px",
    },
    rhythm: {
      density: "airy",
      marker: "index",
      hero: "stack",
      divider: "hairline",
    },
    motion: "none",
    primitives: ["grain"],
    swatch: {
      bg: "#ffffff",
      fg: "#111214",
      muted: "#737579",
      line: "#e8e8e5",
      accent: "#1d4ed8",
    },
  },
  {
    id: "terminal",
    name: "Terminal",
    nameEn: "Terminal",
    tagline: "深色终端，信息密度高",
    audience: "计算机、算法、后端。看起来就像他们每天待着的地方。",
    status: "ready",
    color: {
      bg: "#0b0d0f",
      surface: "#11151a",
      ink: "#e7e9ec",
      ink2: "#c3c9cf",
      muted: "#8b9299",
      line: "#232830",
      accent: "#5eead4",
      onAccent: "#0b0d0f",
    },
    font: { sans: SANS, mono: MONO, display: SANS },
    shape: { radius: "6px", borderWidth: "1px" },
    space: {
      maxWidth: "760px",
      pageX: "28px",
      sectionGap: "64px",
      blockGap: "32px",
      measure: "60ch",
    },
    type: {
      name: "36px",
      lead: "15px",
      body: "14px",
      sub: "13px",
      small: "11.5px",
    },
    rhythm: {
      density: "normal",
      marker: "hash",
      hero: "prompt",
      divider: "hairline",
    },
    motion: "low",
    primitives: ["scanline", "typewriter"],
    swatch: {
      bg: "#0b0d0f",
      fg: "#e7e9ec",
      muted: "#8b9299",
      line: "#232830",
      accent: "#5eead4",
    },
  },
  {
    id: "editorial",
    name: "Editorial",
    nameEn: "Editorial",
    tagline: "杂志版式，大字标题",
    audience: "文字多、人文社科。经历写成长段也不显挤。",
    status: "ready",
    color: {
      bg: "#fbfaf7",
      surface: "#f4f1e9",
      ink: "#161513",
      ink2: "#3b3833",
      muted: "#6f6a60",
      line: "#e0dbce",
      accent: "#b42318",
      onAccent: "#ffffff",
    },
    font: { sans: SANS, mono: MONO, display: SERIF },
    shape: { radius: "2px", borderWidth: "1px" },
    space: {
      maxWidth: "720px",
      pageX: "32px",
      sectionGap: "72px",
      blockGap: "32px",
      measure: "46ch",
    },
    type: {
      name: "46px",
      lead: "19px",
      body: "15px",
      sub: "14px",
      small: "12px",
    },
    rhythm: {
      density: "airy",
      marker: "rule",
      hero: "poster",
      divider: "hairline",
    },
    motion: "low",
    primitives: ["grain", "sticker"],
    swatch: {
      bg: "#fbfaf7",
      fg: "#161513",
      muted: "#6f6a60",
      line: "#e0dbce",
      accent: "#b42318",
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
      bg: "#f4f3ef",
      surface: "#ffffff",
      ink: "#1a1917",
      ink2: "#46433c",
      muted: "#726f68",
      line: "#dedbd3",
      accent: "#1a1917",
      onAccent: "#ffffff",
    },
    font: { sans: SANS, mono: MONO, display: SANS },
    shape: { radius: "0px", borderWidth: "1px" },
    space: {
      maxWidth: "1080px",
      pageX: "40px",
      sectionGap: "80px",
      blockGap: "36px",
      measure: "50ch",
    },
    type: {
      name: "64px",
      lead: "18px",
      body: "15px",
      sub: "14px",
      small: "12px",
    },
    rhythm: {
      density: "airy",
      marker: "none",
      hero: "poster",
      divider: "none",
    },
    motion: "medium",
    primitives: ["mask", "tilt", "scroll"],
    swatch: {
      bg: "#f4f3ef",
      fg: "#1a1917",
      muted: "#726f68",
      line: "#dedbd3",
      accent: "#1a1917",
    },
  },
  {
    id: "studio",
    name: "Studio",
    nameEn: "Studio",
    tagline: "深色底 + 一个等距场景",
    audience: "前端、创意技术。想张扬一点，但不想做成 3D 展厅。",
    status: "ready",
    color: {
      bg: "#12141a",
      surface: "#1a1d26",
      ink: "#eef0f4",
      ink2: "#c7ccd6",
      muted: "#8f96a3",
      line: "#252935",
      accent: "#8b5cf6",
      onAccent: "#ffffff",
    },
    font: { sans: SANS, mono: MONO, display: SANS },
    shape: { radius: "14px", borderWidth: "1px" },
    space: {
      maxWidth: "880px",
      pageX: "32px",
      sectionGap: "76px",
      blockGap: "32px",
      measure: "58ch",
    },
    type: {
      name: "40px",
      lead: "17px",
      body: "14.5px",
      sub: "13px",
      small: "12px",
    },
    rhythm: {
      density: "normal",
      marker: "none",
      hero: "split",
      divider: "block",
    },
    motion: "high",
    primitives: ["gradient-grid", "particles"],
    swatch: {
      bg: "#12141a",
      fg: "#eef0f4",
      muted: "#8f96a3",
      line: "#252935",
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
      bg: "#f4f4f2",
      surface: "#ffffff",
      ink: "#0f1115",
      ink2: "#3b3f46",
      muted: "#6b7079",
      line: "#e3e3df",
      accent: "#2563eb",
      onAccent: "#ffffff",
    },
    font: { sans: SANS, mono: MONO, display: SANS },
    shape: { radius: "14px", borderWidth: "1px" },
    space: {
      maxWidth: "960px",
      pageX: "28px",
      sectionGap: "56px",
      blockGap: "24px",
      measure: "60ch",
    },
    type: {
      name: "32px",
      lead: "15px",
      body: "14px",
      sub: "14px",
      small: "12px",
    },
    rhythm: {
      density: "tight",
      marker: "none",
      hero: "stack",
      divider: "block",
    },
    motion: "medium",
    primitives: ["glass", "meter"],
    swatch: {
      bg: "#f4f4f2",
      fg: "#0f1115",
      muted: "#6b7079",
      line: "#e3e3df",
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
    "--b-ink": base.color.ink,
    "--b-ink-2": base.color.ink2,
    "--b-muted": base.color.muted,
    "--b-line": base.color.line,
    "--b-accent": base.color.accent,
    "--b-on-accent": base.color.onAccent,
    "--b-radius": base.shape.radius,
    "--b-border": base.shape.borderWidth,
    "--b-maxw": base.space.maxWidth,
    "--b-px": base.space.pageX,
    "--b-section-gap": base.space.sectionGap,
    "--b-block-gap": base.space.blockGap,
    "--b-measure": base.space.measure,
    "--b-size-name": base.type.name,
    "--b-size-lead": base.type.lead,
    "--b-size-body": base.type.body,
    "--b-size-sub": base.type.sub,
    "--b-size-small": base.type.small,
    "--b-font-sans": base.font.sans,
    "--b-font-mono": base.font.mono,
    "--b-font-display": base.font.display,
  };
}
