import type {
  BaseId,
  BaseTokens,
  Recipe,
  RecipeMap,
  SlotId,
} from "./types";

/**
 * 配方是数据，不是代码。
 * 一条配方 = 槽位 + 原语组合 + 布局参数 + 内容契约，
 * 所以模型能生成、人能验收、换基底能自动变样。
 *
 * 这一批是「人工种子」：每个槽位先给 2–3 个讲法，够六套基底跑起来。
 * 配方库首批 20 个在内容闭环那一期补齐（见方案 3.8）。
 */

const ALL_BASES: BaseId[] = [
  "paper",
  "terminal",
  "editorial",
  "gallery",
  "studio",
  "bento",
];

export const RECIPES: Recipe[] = [
  // ——— 首屏 ———
  {
    id: "hero.statement",
    slot: "hero",
    name: "陈述式",
    layout: "statement",
    compatible: ["paper", "bento", "gallery"],
    primitives: [],
    motionCost: "none",
  },
  {
    id: "hero.prompt",
    slot: "hero",
    name: "命令行式",
    layout: "prompt",
    compatible: ["terminal", "studio"],
    primitives: ["typewriter"],
    motionCost: "low",
  },
  {
    id: "hero.masthead",
    slot: "hero",
    name: "报头式",
    layout: "masthead",
    compatible: ["editorial"],
    primitives: ["grain"],
    motionCost: "low",
  },
  {
    id: "hero.plate",
    slot: "hero",
    name: "大图版",
    layout: "plate",
    compatible: ["gallery", "studio"],
    primitives: ["mask"],
    motionCost: "low",
  },
  {
    id: "hero.split",
    slot: "hero",
    name: "左右分栏",
    layout: "split",
    compatible: ["studio", "bento"],
    primitives: ["gradient-grid"],
    motionCost: "medium",
  },

  {
    id: "hero.bento",
    slot: "hero",
    name: "格子式",
    layout: "bento",
    compatible: ["bento"],
    primitives: ["glass"],
    motionCost: "low",
  },

  // ——— 关于 ———
  {
    id: "about.column",
    slot: "about",
    name: "单栏正文",
    layout: "column",
    compatible: ALL_BASES,
    primitives: [],
    motionCost: "none",
  },
  {
    id: "about.lead",
    slot: "about",
    name: "引文块",
    layout: "lead",
    compatible: ["editorial", "gallery"],
    primitives: ["grain"],
    motionCost: "none",
  },

  {
    id: "about.facts",
    slot: "about",
    name: "事实格",
    layout: "facts",
    compatible: ["bento", "studio", "gallery"],
    primitives: ["glass"],
    motionCost: "none",
  },
  {
    id: "about.pull",
    slot: "about",
    name: "大引文",
    layout: "pull",
    compatible: ["editorial", "gallery"],
    primitives: [],
    motionCost: "none",
  },

  // ——— 经历 ———
  {
    id: "experience.rows",
    slot: "experience",
    name: "条目式",
    layout: "rows",
    compatible: ["paper", "terminal", "bento"],
    primitives: [],
    motionCost: "none",
  },
  {
    id: "experience.timeline",
    slot: "experience",
    name: "时间线",
    layout: "timeline",
    compatible: ["editorial", "gallery", "studio"],
    primitives: ["scroll"],
    motionCost: "low",
  },

  {
    id: "experience.cards",
    slot: "experience",
    name: "经历卡片",
    layout: "exp-cards",
    compatible: ["bento", "studio", "gallery"],
    primitives: ["tilt"],
    motionCost: "low",
  },

  // ——— 项目 ———
  {
    id: "projects.rows",
    slot: "projects",
    name: "清单",
    layout: "rows",
    compatible: ["paper", "terminal", "editorial"],
    primitives: [],
    motionCost: "none",
  },
  {
    id: "projects.cards",
    slot: "projects",
    name: "卡片墙",
    layout: "proj-cards",
    compatible: ["bento", "gallery", "studio"],
    primitives: ["glass", "tilt"],
    motionCost: "medium",
  },

  {
    id: "projects.strip",
    slot: "projects",
    name: "横向画廊",
    layout: "strip",
    compatible: ["gallery", "studio"],
    primitives: ["scroll"],
    motionCost: "medium",
  },

  {
    id: "projects.feature",
    slot: "projects",
    name: "主角项目",
    layout: "feature",
    compatible: ["paper", "editorial", "studio", "bento"],
    primitives: [],
    motionCost: "none",
  },

  // ——— 技能 ———
  {
    id: "skills.inline",
    slot: "skills",
    name: "一行带过",
    layout: "inline",
    compatible: ["paper", "editorial"],
    primitives: [],
    motionCost: "none",
  },
  {
    id: "skills.chips",
    slot: "skills",
    name: "标签",
    layout: "chips",
    compatible: ["terminal", "gallery"],
    primitives: [],
    motionCost: "none",
  },
  {
    id: "skills.meter",
    slot: "skills",
    name: "分组网格",
    layout: "meter",
    compatible: ["bento", "studio"],
    primitives: ["meter"],
    motionCost: "low",
  },

  {
    id: "contact.banner",
    slot: "contact",
    name: "整条横幅",
    layout: "banner",
    compatible: ["studio", "bento", "terminal"],
    primitives: [],
    motionCost: "none",
  },

  // ——— 联系 ———
  {
    id: "contact.line",
    slot: "contact",
    name: "一行联系方式",
    layout: "line",
    compatible: ["paper", "terminal", "editorial"],
    primitives: [],
    motionCost: "none",
  },
  {
    id: "contact.card",
    slot: "contact",
    name: "收尾卡片",
    layout: "card",
    compatible: ["bento", "gallery", "studio"],
    primitives: ["glass"],
    motionCost: "low",
  },
];

/** 每套基底的默认配方组合：打开就是一个配好的页面 */
export const DEFAULT_RECIPE_MAP: Record<BaseId, RecipeMap> = {
  paper: {
    hero: "hero.statement",
    about: "about.column",
    experience: "experience.rows",
    projects: "projects.rows",
    skills: "skills.inline",
    contact: "contact.line",
  },
  terminal: {
    hero: "hero.prompt",
    about: "about.column",
    experience: "experience.rows",
    projects: "projects.rows",
    skills: "skills.chips",
    contact: "contact.line",
  },
  editorial: {
    hero: "hero.masthead",
    about: "about.pull",
    experience: "experience.timeline",
    projects: "projects.rows",
    skills: "skills.inline",
    contact: "contact.line",
  },
  gallery: {
    hero: "hero.plate",
    about: "about.lead",
    experience: "experience.timeline",
    projects: "projects.strip",
    skills: "skills.chips",
    contact: "contact.card",
  },
  studio: {
    hero: "hero.split",
    about: "about.facts",
    experience: "experience.timeline",
    projects: "projects.cards",
    skills: "skills.meter",
    contact: "contact.banner",
  },
  bento: {
    hero: "hero.bento",
    about: "about.facts",
    experience: "experience.rows",
    projects: "projects.cards",
    skills: "skills.meter",
    contact: "contact.card",
  },
};

export const SLOT_ORDER: SlotId[] = [
  "hero",
  "about",
  "experience",
  "projects",
  "skills",
  "contact",
];

export function getRecipe(id?: string | null): Recipe | undefined {
  if (!id) return undefined;
  return RECIPES.find((recipe) => recipe.id === id);
}

/**
 * 页面记录的配方 → 实际要渲染的配方。
 * 没记录、配方不存在、或跟基底不兼容时，回落到该基底的默认讲法。
 */
export function resolveRecipeMap(
  base: BaseTokens,
  stored?: RecipeMap | null,
): RecipeMap {
  const defaults = DEFAULT_RECIPE_MAP[base.id];
  const resolved: RecipeMap = {};

  for (const slot of SLOT_ORDER) {
    const candidate = getRecipe(stored?.[slot]);
    if (candidate && candidate.slot === slot && candidate.compatible.includes(base.id)) {
      resolved[slot] = candidate.id;
      continue;
    }
    resolved[slot] = defaults[slot];
  }

  return resolved;
}

/** 给「换一种讲法」用：这个槽位在哪套基底里能选哪些配方 */
export function recipesForSlot(slot: SlotId, baseId: BaseId): Recipe[] {
  return RECIPES.filter(
    (recipe) => recipe.slot === slot && recipe.compatible.includes(baseId),
  );
}
