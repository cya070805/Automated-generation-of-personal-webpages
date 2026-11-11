import type { BaseTokens, RecipeMap, SlotId } from "./templates/types";
import { SLOT_ORDER } from "./templates/recipes";

/**
 * 页面级配置：基底 + 配方 + 模块顺序 + 四个滑杆。
 * 全部存在 pages 表里，渲染层只读这里，不读路由、不读内容块。
 */

export interface SiteTweaks {
  /** 0 克制 / 1 标准 / 2 活跃 */
  motion?: number;
  /** 0 宽松 / 1 标准 / 2 紧凑 */
  density?: number;
  /** 0 直角 / 1 标准 / 2 圆润 */
  radius?: number;
  accent?: string;
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

function scalePx(value: string, factor: number): string {
  const match = /^(\d+(?:\.\d+)?)px$/.exec(value);
  if (!match) return value;
  return `${Math.round(parseFloat(match[1]) * factor)}px`;
}

/** 滑杆改的是令牌，不是样式表：所有组件同步变 */
export function resolveBaseTokens(
  base: BaseTokens,
  tweaks?: SiteTweaks | null,
): BaseTokens {
  if (!tweaks) return base;

  const radiusFactor = [0.35, 1, 1.8][tweaks.radius ?? 1] ?? 1;
  const densityFactor = [0.78, 1, 1.24][tweaks.density ?? 1] ?? 1;
  const motion = tweaks.motion ?? 1;

  const accent =
    tweaks.accent && HEX.test(tweaks.accent) ? tweaks.accent : base.color.accent;

  let primitives = base.primitives;
  if (motion === 0) {
    primitives = primitives.filter(
      (id) => !["tilt", "magnetic", "particles", "typewriter", "scroll"].includes(id),
    );
  } else if (motion === 2) {
    primitives = Array.from(new Set([...primitives, "tilt", "magnetic"]));
  }

  return {
    ...base,
    color: { ...base.color, accent },
    shape: { ...base.shape, radius: scalePx(base.shape.radius, radiusFactor) },
    space: {
      ...base.space,
      sectionGap: scalePx(base.space.sectionGap, densityFactor),
      blockGap: scalePx(base.space.blockGap, densityFactor),
    },
    motion: motion === 0 ? "none" : base.motion,
    primitives,
    swatch: { ...base.swatch, accent },
  };
}

/** 模块顺序：默认顺序 + 用户改动，隐藏的去掉 */
export function resolveOrder(layout?: SiteLayout | null): SlotId[] {
  const hidden = new Set(layout?.hidden ?? []);
  const seen = new Set<SlotId>();
  const order: SlotId[] = [];

  for (const slot of layout?.order ?? []) {
    if (SLOT_ORDER.includes(slot) && !seen.has(slot)) {
      seen.add(slot);
      order.push(slot);
    }
  }

  for (const slot of SLOT_ORDER) {
    if (!seen.has(slot)) order.push(slot);
  }

  return order.filter((slot) => !hidden.has(slot));
}

export function isPublishedSlug(slug: string): boolean {
  return /^[a-z0-9]{6,16}$/.test(slug);
}
