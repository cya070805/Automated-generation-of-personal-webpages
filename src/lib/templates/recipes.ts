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
  "mono",
  "cinema",
  "frame",
  "reel",
];

export const RECIPES: Recipe[] = [
  // ——— 首屏 ———
  {
    id: "hero.frame",
    slot: "hero",
    name: "方框",
    layout: "frame",
    compatible: ["frame"],
    primitives: ["grain"],

  },
  {
    id: "hero.poster",
    slot: "hero",
    name: "海报",
    layout: "poster",
    compatible: ["mono"],
    primitives: ["grain"],

  },
  {
    id: "hero.orbit",
    slot: "hero",
    name: "环形",
    layout: "orbit",
    compatible: ["cinema"],
    primitives: ["particles"],

  },
  {
    id: "hero.statement",
    slot: "hero",
    name: "陈述式",
    layout: "statement",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "hero.prompt",
    slot: "hero",
    name: "命令行式",
    layout: "prompt",
    compatible: ["terminal", "studio"],
    primitives: ["typewriter"],

  },
  {
    id: "hero.masthead",
    slot: "hero",
    name: "报头式",
    layout: "masthead",
    compatible: ["editorial"],
    primitives: ["grain"],

  },
  {
    id: "hero.plate",
    slot: "hero",
    name: "大图版",
    layout: "plate",
    compatible: ALL_BASES,
    primitives: ["mask"],

  },
  {
    id: "hero.split",
    slot: "hero",
    name: "左右分栏",
    layout: "split",
    compatible: ALL_BASES,
    primitives: ["gradient-grid"],

  },

  {
    id: "hero.bento",
    slot: "hero",
    name: "格子式",
    layout: "bento",
    compatible: ["bento"],
    primitives: ["glass"],

  },

  // ——— 关于 ———
  {
    id: "about.column",
    slot: "about",
    name: "单栏正文",
    layout: "column",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "about.lead",
    slot: "about",
    name: "引文块",
    layout: "lead",
    compatible: ALL_BASES,
    primitives: ["grain"],

  },

  {
    id: "about.points",
    slot: "about",
    name: "要点格",
    layout: "points",
    compatible: ALL_BASES,
    primitives: ["glass"],

  },
  {
    id: "about.pull",
    slot: "about",
    name: "大引文",
    layout: "pull",
    compatible: ["editorial", "gallery"],
    primitives: [],

  },

  // ——— 经历 ———
  {
    id: "experience.rows",
    slot: "experience",
    name: "条目式",
    layout: "rows",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "experience.boxes",
    slot: "experience",
    name: "方框墙",
    layout: "boxes",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "experience.metric",
    slot: "experience",
    name: "大数字",
    layout: "showcase",
    compatible: ALL_BASES,
    primitives: [],

    params: { emphasis: "metric" },
  },
  {
    id: "experience.headline",
    slot: "experience",
    name: "大字抬头",
    layout: "showcase",
    compatible: ALL_BASES,
    primitives: [],

    params: { emphasis: "title" },
  },
  {
    id: "experience.timeline",
    slot: "experience",
    name: "时间线",
    layout: "timeline",
    compatible: ALL_BASES,
    primitives: ["scroll"],

  },

  {
    id: "experience.cards",
    slot: "experience",
    name: "经历卡片",
    layout: "exp-cards",
    compatible: ALL_BASES,
    primitives: ["tilt"],

  },

  // ——— 项目 ———
  {
    id: "projects.rows",
    slot: "projects",
    name: "清单",
    layout: "rows",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "projects.band",
    slot: "projects",
    name: "横向带",
    layout: "band",
    compatible: ALL_BASES,
    primitives: ["scroll"],

  },
  {
    id: "projects.boxes",
    slot: "projects",
    name: "方框墙",
    layout: "boxes",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "projects.stagger",
    slot: "projects",
    name: "错位",
    layout: "stagger",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "projects.metric",
    slot: "projects",
    name: "大数字",
    layout: "showcase",
    compatible: ALL_BASES,
    primitives: [],

    params: { emphasis: "metric" },
  },
  {
    id: "projects.headline",
    slot: "projects",
    name: "大字抬头",
    layout: "showcase",
    compatible: ALL_BASES,
    primitives: [],

    params: { emphasis: "title" },
  },
  {
    id: "projects.strip",
    slot: "projects",
    name: "横向画廊",
    layout: "strip",
    compatible: ["gallery", "studio"],
    primitives: ["scroll"],

  },

  {
    id: "projects.feature",
    slot: "projects",
    name: "主角项目",
    layout: "feature",
    compatible: ALL_BASES,
    primitives: [],

  },

  // ——— 技能 ———
  {
    id: "skills.inline",
    slot: "skills",
    name: "一行带过",
    layout: "inline",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "skills.ring",
    slot: "skills",
    name: "索引行",
    layout: "ring",
    compatible: ALL_BASES,
    primitives: ["magnetic"],

  },
  {
    id: "skills.chips",
    slot: "skills",
    name: "标签",
    layout: "chips",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "skills.meter",
    slot: "skills",
    name: "分组网格",
    layout: "meter",
    compatible: ALL_BASES,
    primitives: ["meter"],

  },

  {
    id: "contact.banner",
    slot: "contact",
    name: "整条横幅",
    layout: "banner",
    compatible: ALL_BASES,
    primitives: [],

  },

  // ——— 联系 ———
  {
    id: "contact.line",
    slot: "contact",
    name: "一行联系方式",
    layout: "line",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "contact.card",
    slot: "contact",
    name: "收尾卡片",
    layout: "card",
    compatible: ALL_BASES,
    primitives: ["glass"],

  },

  // ——— 第二批：换的是读法，不换颜色 ———
  {
    id: "about.dropcap",
    slot: "about",
    name: "首字下沉",
    layout: "dropcap",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "about.numbered",
    slot: "about",
    name: "编号条目",
    layout: "numbered",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "experience.table",
    slot: "experience",
    name: "表格",
    layout: "etable",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "experience.steps",
    slot: "experience",
    name: "阶梯",
    layout: "steps",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "projects.index",
    slot: "projects",
    name: "索引",
    layout: "pindex",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "projects.stack",
    slot: "projects",
    name: "横向卡",
    layout: "pstack",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "skills.folder",
    slot: "skills",
    name: "文件夹",
    layout: "folder",
    compatible: ALL_BASES,
    primitives: [],
  },
  {
    id: "skills.bubble",
    slot: "skills",
    name: "标签球",
    layout: "tagbubble",
    compatible: ALL_BASES,
    primitives: [],
  },
  {
    id: "skills.matrix",
    slot: "skills",
    name: "分类分栏",
    layout: "smatrix",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "skills.rows",
    slot: "skills",
    name: "分类行",
    layout: "srows",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "contact.ticket",
    slot: "contact",
    name: "票据",
    layout: "ticket",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "contact.bubble",
    slot: "contact",
    name: "气泡菜单",
    layout: "bubble",
    compatible: ALL_BASES,
    primitives: [],
  },

  // ——— 第三批：靠留白和细线，不加边框底色 ———
  {
    id: "hero.center",
    slot: "hero",
    name: "居中",
    layout: "center",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "about.twocol",
    slot: "about",
    name: "双栏正文",
    layout: "twocol",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "experience.compact",
    slot: "experience",
    name: "紧凑",
    layout: "compact",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "projects.minimal",
    slot: "projects",
    name: "细线两列",
    layout: "pmin",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "skills.grid3",
    slot: "skills",
    name: "三列",
    layout: "grid3",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "contact.bigmail",
    slot: "contact",
    name: "大邮箱",
    layout: "bigmail",
    compatible: ALL_BASES,
    primitives: [],

  },

  // ——— 教育独立成槽：和经历分开选，读书和上班本来不是一回事 ———
  {
    id: "education.rows",
    slot: "education",
    name: "条目式",
    layout: "rows",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "education.compact",
    slot: "education",
    name: "紧凑",
    layout: "compact",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "education.cards",
    slot: "education",
    name: "卡片",
    layout: "exp-cards",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "education.timeline",
    slot: "education",
    name: "时间线",
    layout: "timeline",
    compatible: ALL_BASES,
    primitives: [],

  },
  {
    id: "education.table",
    slot: "education",
    name: "表格",
    layout: "etable",
    compatible: ALL_BASES,
    primitives: [],

  },
];

/** 每套基底的默认配方组合：打开就是一个配好的页面 */
export const DEFAULT_RECIPE_MAP: Record<BaseId, RecipeMap> = {
  paper: {
    hero: "hero.statement",
    about: "about.column",
    experience: "experience.rows",
    projects: "projects.rows",
    education: "education.rows",
    skills: "skills.inline",
    contact: "contact.line",
  },
  terminal: {
    hero: "hero.prompt",
    about: "about.column",
    experience: "experience.rows",
    projects: "projects.rows",
    education: "education.rows",
    skills: "skills.chips",
    contact: "contact.line",
  },
  editorial: {
    hero: "hero.masthead",
    about: "about.pull",
    experience: "experience.timeline",
    projects: "projects.rows",
    education: "education.timeline",
    skills: "skills.inline",
    contact: "contact.line",
  },
  gallery: {
    hero: "hero.plate",
    about: "about.lead",
    experience: "experience.timeline",
    projects: "projects.strip",
    education: "education.timeline",
    skills: "skills.chips",
    contact: "contact.card",
  },
  studio: {
    hero: "hero.split",
    about: "about.points",
    experience: "experience.timeline",
    projects: "projects.boxes",
    education: "education.timeline",
    skills: "skills.meter",
    contact: "contact.banner",
  },
  bento: {
    hero: "hero.bento",
    about: "about.points",
    experience: "experience.rows",
    projects: "projects.boxes",
    education: "education.rows",
    skills: "skills.meter",
    contact: "contact.card",
  },
  mono: {
    hero: "hero.poster",
    about: "about.pull",
    experience: "experience.metric",
    projects: "projects.band",
    education: "education.compact",
    skills: "skills.ring",
    contact: "contact.line",
  },
  cinema: {
    hero: "hero.orbit",
    about: "about.lead",
    experience: "experience.headline",
    projects: "projects.stagger",
    education: "education.compact",
    skills: "skills.ring",
    contact: "contact.banner",
  },
  frame: {
    hero: "hero.frame",
    about: "about.points",
    experience: "experience.boxes",
    projects: "projects.band",
    education: "education.cards",
    skills: "skills.ring",
    contact: "contact.card",
  },
  reel: {
    hero: "hero.statement",
    about: "about.lead",
    experience: "experience.compact",
    projects: "projects.rows",
    education: "education.compact",
    skills: "skills.ring",
    contact: "contact.bigmail",
  },
};

export const SLOT_ORDER: SlotId[] = [
  "hero",
  "about",
  "experience",
  "projects",
  "education",
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


