import type { BaseTokens, RecipeMap, SlotId } from "./templates/types";
import { SLOT_ORDER } from "./templates/recipes";

/**
 * 页面级配置：基底 + 配方 + 模块顺序 + 四个滑杆。
 * 全部存在 pages 表里，渲染层只读这里，不读路由、不读内容块。
 */

export interface SiteTweaks {
  /**
   * 2 = 连续值制：所有滑杆都是 0–100，50 表示「基底原样」。
   * 没有这个标记的是早期三挡制（0 低 / 1 标准 / 2 高），读的时候会被换算过来。
   */
  v?: number;
  /** 动效强度 */
  motion?: number;
  /** 疏密：左宽松、右紧凑 */
  density?: number;
  /** 字号 */
  scale?: number;
  /** 圆角 */
  radius?: number;
  /** 页宽 */
  width?: number;
  /** 行宽（每行字数） */
  measure?: number;
  /** 标题字重 */
  weight?: number;
  /** 底纹：0 跟随基底 / 1 网格 / 2 点阵（分类开关，不是滑杆） */
  pattern?: number;
  accent?: string;
  /** 背景色：不填就跟随基底 */
  bg?: string;
  /** 文字色：不填就跟随基底（跟着背景的明暗自动选深/浅） */
  ink?: string;
}

export interface SiteLayout {
  order?: SlotId[];
  hidden?: SlotId[];
}

export interface PageConfig {
  baseId: string;
  recipeMap: RecipeMap | null;
  layout: SiteLayout | null;
  tweaks: SiteTweaks | null;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

const clamp100 = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

/** 老数据只有 0/1/2 三挡，读出来换算成 0/50/100，不然滑杆会跳到最左边 */
export function normalizeTweaks(tweaks?: SiteTweaks | null): SiteTweaks {
  if (!tweaks) return {};
  if ((tweaks.v ?? 0) >= 2) return tweaks;
  const level = (value?: number) =>
    value == null ? undefined : clamp100([0, 50, 100][Math.min(2, Math.max(0, Math.round(value)))]);
  return {
    ...tweaks,
    v: 2,
    motion: level(tweaks.motion),
    density: level(tweaks.density),
    scale: level(tweaks.scale),
    radius: level(tweaks.radius),
  };
}

/**
 * 0–100 连续值 -> 缩放系数，50 就是 1（基底原样）。
 * 分成左右两段插值，这样「标准」永远落在正中间，不会因为区间不对称偏掉。
 */
function ramp(value: number | undefined, low: number, high: number): number {
  const v = value == null ? 50 : Math.min(100, Math.max(0, value));
  return v <= 50 ? low + (1 - low) * (v / 50) : 1 + (high - 1) * ((v - 50) / 50);
}

/** 相对亮度：0 黑 1 白。用来自动决定这套底色该配深字还是浅字 */
export function luminanceOf(hex: string): number {
  if (!HEX.test(hex)) return 0.5;
  const channel = (start: number) => {
    const c = parseInt(hex.slice(start, start + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** 页面的明暗：文件夹描边、滚动条这些要按它走，不能写死基底名单 */
export function toneOf(bg: string): "dark" | "light" {
  return luminanceOf(bg) < 0.42 ? "dark" : "light";
}

/** 对比度（WCAG 那个比值），换底色时用来判断「原来挑的字还能不能看」 */
export function contrastRatio(a: string, b: string): number {
  const la = luminanceOf(a);
  const lb = luminanceOf(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** a 占 ratio，剩下的是 b */
function mix(a: string, b: string, ratio: number): string {
  if (!HEX.test(a) || !HEX.test(b)) return b;
  const channels = [1, 3, 5].map((start) => {
    const x = parseInt(a.slice(start, start + 2), 16);
    const y = parseInt(b.slice(start, start + 2), 16);
    return Math.round(x * ratio + y * (1 - ratio)).toString(16).padStart(2, "0");
  });
  return `#${channels.join("")}`;
}

/** 深色强调色配白字、浅色强调色配墨字——不靠基底写死 */
function readableOn(accent: string): string {
  return luminanceOf(accent) > 0.45 ? "#14161a" : "#ffffff";
}

/** 把 accent 按比例压进底色里 —— 换配色时浅色调要跟着走，否则深浅两个紫会打架 */
function tint(accent: string, bg: string, ratio: number): string {
  return mix(accent, bg, ratio);
}

function scalePx(value: string, factor: number): string {
  const match = /^(\d+(?:\.\d+)?)px$/.exec(value);
  if (!match) return value;
  return `${Math.round(parseFloat(match[1]) * factor)}px`;
}

function scaleCh(value: string, factor: number): string {
  const match = /^(\d+(?:\.\d+)?)ch$/.exec(value);
  if (!match) return value;
  return `${Math.round(parseFloat(match[1]) * factor)}ch`;
}

/**
 * 滑杆改的是令牌，不是样式表：所有组件同步变。
 * 每个滑杆都是 0–100，50 = 基底原样；往两边走是连续插值，不是三个挡位。
 */
export function resolveBaseTokens(
  base: BaseTokens,
  tweaks?: SiteTweaks | null,
): BaseTokens {
  const tk = normalizeTweaks(tweaks);
  if (!tweaks) return base;

  const radiusFactor = ramp(tk.radius, 0.2, 2);
  const scaleFactor = ramp(tk.scale, 0.86, 1.18);
  const widthFactor = ramp(tk.width, 0.88, 1.12);
  const measureFactor = ramp(tk.measure, 0.8, 1.3);
  const weightFactor = ramp(tk.weight, 0.72, 1.25);
  // 疏密：左边「宽松」间距放大，右边「紧凑」压小——以前这两个标签是反的
  const densityFactor = ramp(100 - (tk.density ?? 50), 0.72, 1.35);
  const textureOverride =
    tk.pattern === 1 ? "mesh" : tk.pattern === 2 ? "dots" : null;

  const motionAmount = clamp100(tk.motion ?? 50);

  /*
   * 颜色。用户可以只换背景、只换字色，也可以两个都换：
   *   换背景 -> 表面色、分隔线、次级字全部按新底色重新推
   *   只换字色 -> 底色相关的令牌不动，只把 ink / ink2 / muted 重算
   * 不给默认值就会出「黑底黑字」，所以没指定字色时按底色明暗自动挑深/浅。
   */
  const bg = tk.bg && HEX.test(tk.bg) ? tk.bg : base.color.bg;
  const bgChanged = bg !== base.color.bg;
  const inkPinned = tk.ink && HEX.test(tk.ink) ? tk.ink : null;
  const tone = toneOf(bg);
  const ink =
    inkPinned ?? (bgChanged ? (tone === "dark" ? "#f2f4f8" : "#14161a") : base.color.ink);
  const inkChanged = ink !== base.color.ink;
  const toneChanged = bgChanged || inkChanged;

  const surface = bgChanged
    ? tone === "dark"
      ? mix("#ffffff", bg, 0.07)
      : mix("#ffffff", bg, 0.6)
    : base.color.surface;
  const band = bgChanged
    ? tone === "dark"
      ? mix("#000000", bg, 0.18)
      : mix(ink, bg, 0.035)
    : base.color.band;
  // 分隔线、次级字都由「字色掺进底色」推出来：比例是字色占多少
  const line = toneChanged ? mix(ink, bg, 0.16) : base.color.line;
  const ink2 = inkChanged ? mix(ink, bg, 0.72) : base.color.ink2;
  const muted = inkChanged ? mix(ink, bg, 0.55) : base.color.muted;

  const accent =
    tk.accent && HEX.test(tk.accent) ? tk.accent : base.color.accent;
  // 换了 accent 却没换浅色底，会出现「蓝底紫字」这种脏搭配
  const accentSoft =
    accent === base.color.accent && !bgChanged
      ? base.color.accentSoft
      : tint(accent, bg, 0.08);
  // 用户可能挑一个很浅的颜色，压在强调色上的字得跟着翻
  const onAccent = accent === base.color.accent ? base.color.onAccent : readableOn(accent);

  let primitives = base.primitives;
  if (motionAmount <= 4) {
    primitives = primitives.filter(
      (id) => !["tilt", "magnetic", "particles", "typewriter", "scroll"].includes(id),
    );
  }

  return {
    ...base,
    color: {
      ...base.color,
      bg,
      surface,
      band,
      ink,
      ink2,
      muted,
      line,
      accent,
      accentSoft,
      onAccent,
    },
    font: {
      ...base.font,
      displayWeight: Math.round(base.font.displayWeight * weightFactor),
    },
    shape: { ...base.shape, radius: scalePx(base.shape.radius, radiusFactor) },
    type: {
      ...base.type,
      title: scalePx(base.type.title, scaleFactor),
      lead: scalePx(base.type.lead, scaleFactor),
      body: scalePx(base.type.body, scaleFactor),
      sub: scalePx(base.type.sub, scaleFactor),
      small: scalePx(base.type.small, scaleFactor),
      meta: scalePx(base.type.meta, scaleFactor),
    },
    dna: { ...base.dna, texture: textureOverride ?? base.dna.texture },
    space: {
      ...base.space,
      maxWidth: scalePx(base.space.maxWidth, widthFactor),
      measure: scaleCh(base.space.measure, measureFactor),
      sectionGap: scalePx(base.space.sectionGap, densityFactor),
      blockGap: scalePx(base.space.blockGap, densityFactor),
    },
    motion: motionAmount <= 4 ? "none" : base.motion,
    primitives,
    swatch: { ...base.swatch, accent },
  };
}

/** 章节渐显的强度：0 完全不动，100 最明显。渲染层直接吃这个数 */
export function motionAmountOf(tweaks?: SiteTweaks | null): number {
  return clamp100(normalizeTweaks(tweaks).motion ?? 50);
}

/** 补齐槽位顺序（保留隐藏项，编辑器要用） */
export function normalizeOrder(layout?: SiteLayout | null): SlotId[] {
  const seen = new Set<SlotId>();
  const order: SlotId[] = [];

  for (const slot of layout?.order ?? []) {
    if (SLOT_ORDER.includes(slot) && !seen.has(slot)) {
      seen.add(slot);
      order.push(slot);
    }
  }

  // 老页面存的是六个槽位的顺序。新增的槽位要落在它该在的位置，
  // 不能一律甩到末尾——教育会从项目后面掉到页脚前。
  for (const slot of SLOT_ORDER) {
    if (seen.has(slot)) continue;
    const here = SLOT_ORDER.indexOf(slot);
    let at = order.length;
    for (let i = here + 1; i < SLOT_ORDER.length; i += 1) {
      const pos = order.indexOf(SLOT_ORDER[i]);
      if (pos >= 0) {
        at = pos;
        break;
      }
    }
    order.splice(at, 0, slot);
    seen.add(slot);
  }

  return order;
}

/** 模块顺序：默认顺序 + 用户改动，隐藏的去掉 */
export function resolveOrder(layout?: SiteLayout | null): SlotId[] {
  const hidden = new Set(layout?.hidden ?? []);
  return normalizeOrder(layout).filter((slot) => !hidden.has(slot));
}

export function isPublishedSlug(slug: string): boolean {
  return /^[a-z0-9]{6,16}$/.test(slug);
}
