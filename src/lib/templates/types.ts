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

/** 页框：页眉、章节号、章节分隔的做法 */
export type FrameKind =
  /** 印刷品：页眉一行细线 + 编号 */
  | "rule"
  /** 终端：窗口栏 + 提示符 */
  | "chrome"
  /** 杂志：报头 + 粗细双线 */
  | "masthead"
  /** 画廊：几乎不画线，只留极小的标签 */
  | "none"
  /** 工作室：可见网格底纹 */
  | "grid"
  /** 格子：每段一张卡 */
  | "tile";

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
    /** 与 bg 只差一点点，用来给整段换底色 */
    band: string;
    ink: string;
    ink2: string;
    muted: string;
    line: string;
    accent: string;
    onAccent: string;
    /** 强调色的极浅底，标签和色块用 */
    accentSoft: string;
  };

  font: {
    sans: string;
    mono: string;
    display: string;
    displayWeight: number;
    /** 大标题字距，中文一般 -0.03em 左右 */
    displayTracking: string;
  };

  shape: {
    radius: string;
    borderWidth: string;
  };

  /** 字号阶梯：基底决定「多大」，配方决定「怎么排」 */
  type: {
    /** 首屏姓名 */
    display: string;
    /** 二级区块标题（项目名、公司名） */
    title: string;
    lead: string;
    body: string;
    sub: string;
    small: string;
    /** 微标签：页眉、章节名、日期 */
    meta: string;
  };

  space: {
    /** 整个页面的最大宽度 */
    maxWidth: string;
    pageX: string;
    sectionGap: string;
    blockGap: string;
    /** 正文最大行宽，中文约 40–46 字 */
    measure: string;
    /** 章节左侧小标题栏宽度；0 表示不分栏 */
    rail: string;
  };

  rhythm: {
    density: "airy" | "normal" | "tight";
    /** 章节标题的记号形式 */
    marker: "index" | "hash" | "numbered" | "rule" | "none";
    /** 姓名一屏的排法 */
    hero: "column" | "prompt" | "masthead" | "plate" | "split" | "bento";
    divider: "hairline" | "block" | "none";
    frame: FrameKind;
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
