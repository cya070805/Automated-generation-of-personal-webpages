/**
 * 呈现层的三个概念（对应方案 02 章）：
 *
 *   基底 Base     —— 一套设计令牌 + 排版节奏，只决定「气质」，不给版式
 *   原语 Primitive —— 一个动效或材质能力，没有业务含义
 *   配方 Recipe   —— 一个槽位的讲法：用哪些原语、怎么摆、收什么内容
 *
 * 渲染层只消费令牌，不读数据库。
 */

export type BaseId =
  | "paper"
  | "terminal"
  | "editorial"
  | "gallery"
  | "studio"
  | "bento";

export type PrimitiveId =
  | "gradient-grid"
  | "grain"
  | "mask"
  | "sticker"
  | "glass"
  | "scroll"
  | "magnetic"
  | "tilt"
  | "typewriter"
  | "particles"
  | "scanline"
  | "meter";

export type SlotId =
  | "hero"
  | "about"
  | "experience"
  | "projects"
  | "skills"
  | "contact";

export type MotionCost = "none" | "low" | "medium" | "high";

export interface BaseTokens {
  id: BaseId;
  name: string;
  nameEn: string;
  tagline: string;
  audience: string;
  /** ready = 可选；planned = 只在代码里占位 */
  status: "ready" | "planned";

  color: {
    bg: string;
    surface: string;
    ink: string;
    ink2: string;
    muted: string;
    line: string;
    accent: string;
    onAccent: string;
  };

  font: {
    sans: string;
    mono: string;
    display: string;
  };

  shape: {
    radius: string;
    borderWidth: string;
  };

  /** 字号阶梯：基底决定「多大」，配方决定「怎么排」 */
  type: {
    name: string;
    lead: string;
    body: string;
    sub: string;
    small: string;
  };

  space: {
    maxWidth: string;
    pageX: string;
    sectionGap: string;
    blockGap: string;
    /** 正文最大行宽，中文约 40–46 字 */
    measure: string;
  };

  rhythm: {
    density: "airy" | "normal" | "tight";
    /** 章节标题的记号形式 */
    marker: "index" | "hash" | "rule" | "none";
    /** 姓名一屏的排法 */
    hero: "stack" | "prompt" | "poster" | "split";
    divider: "hairline" | "block" | "none";
  };

  motion: MotionCost;
  primitives: PrimitiveId[];
  /** 选择卡片里画缩略图用 */
  swatch: {
    bg: string;
    fg: string;
    muted: string;
    line: string;
    accent: string;
  };
}

/** 一条配方 = 槽位 + 原语组合 + 布局参数 + 内容契约（写成数据） */
export interface Recipe {
  id: string;
  slot: SlotId;
  name: string;
  /** 渲染器键，对应 components/render/slots.tsx 里的实现 */
  layout: string;
  requires?: { images?: number };
  compatible: BaseId[];
  primitives: PrimitiveId[];
  motionCost: MotionCost;
  params?: Record<string, string | number | boolean>;
}

/** 页面记的是「哪个槽位用哪条配方」，不存版式代码 */
export type RecipeMap = Partial<Record<SlotId, string>>;
