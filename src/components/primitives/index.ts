import type { PrimitiveId, MotionCost } from "@/lib/templates/types";

/**
 * 十二个原语：所有「炫酷组件」拆到底，都是这十二件事的组合。
 * 拆到原语而不是拆到某个库的某个卡片——这是工作量与版权的分水岭。
 *
 * 前八个是纯 CSS / SVG，服务端就能渲染，导出 PDF 稳定；
 * 后四个需要 JS，全部遵守 prefers-reduced-motion。
 */

export interface PrimitiveMeta {
  id: PrimitiveId;
  name: string;
  /** 能组合出什么 */
  produces: string;
  cost: MotionCost;
  client: boolean;
}

export const PRIMITIVES: PrimitiveMeta[] = [
  {
    id: "gradient-grid",
    name: "渐变 / 网格底",
    produces: "首屏背景、分区底色",
    cost: "none",
    client: false,
  },
  {
    id: "grain",
    name: "噪点 / 颗粒",
    produces: "胶片感、纸质感",
    cost: "none",
    client: false,
  },
  {
    id: "mask",
    name: "遮罩 / 裁切",
    produces: "异形图、文字镂空",
    cost: "none",
    client: false,
  },
  {
    id: "sticker",
    name: "描边 / 贴纸",
    produces: "手绘感、标注感",
    cost: "none",
    client: false,
  },
  {
    id: "glass",
    name: "玻璃 / 模糊",
    produces: "卡片、导航条",
    cost: "low",
    client: false,
  },
  {
    id: "scanline",
    name: "扫描线 / 边框光效",
    produces: "科技感卡片、CRT 质感",
    cost: "none",
    client: false,
  },
  {
    id: "meter",
    name: "微型图表",
    produces: "技能条、数字胶囊",
    cost: "none",
    client: false,
  },
  {
    id: "particles",
    name: "粒子 / 流体",
    produces: "背景、加载态",
    cost: "low",
    client: false,
  },
  {
    id: "typewriter",
    name: "打字机 / 文字拆分",
    produces: "标题动画",
    cost: "low",
    client: true,
  },
  {
    id: "magnetic",
    name: "光标跟随 / 磁吸",
    produces: "按钮、卡片的交互反馈",
    cost: "low",
    client: true,
  },
  {
    id: "tilt",
    name: "倾斜 / 视差",
    produces: "作品卡、头像",
    cost: "medium",
    client: true,
  },
  {
    id: "scroll",
    name: "滚动驱动",
    produces: "长页叙事、时间线、进度提示",
    cost: "low",
    client: true,
  },
];

export { Grain, GradientGrid, MaskFrame, Sticker, Glass, Scanline, Meter, Particles } from "./static";
export { Typewriter, Magnetic, Tilt, Reveal } from "./motion";
