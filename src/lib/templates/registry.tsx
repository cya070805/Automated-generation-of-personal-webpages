import { PaperTemplate } from "./paper";
import { TerminalTemplate } from "./terminal";
import type { TemplateMeta } from "./types";
import type { SiteData } from "@/lib/site-data";

/**
 * 模板登记表。
 *
 * 加一套模板的步骤只有三步：
 *   1. 在同目录写一个组件，接收 { data: SiteData }
 *   2. 在下面加一条 meta，status 写 "ready"
 *   3. 在 <TemplateView> 的 switch 里接上
 * 页面上不需要改：选择器读的是 READY_TEMPLATES。
 *
 * status 为 "planned" 的条目只在代码里占位，界面不会出现，
 * 免得交付时给人看到"还没做完"的东西。
 */
export const TEMPLATES: TemplateMeta[] = [
  {
    id: "paper",
    name: "Paper",
    tagline: "白纸黑字，一页读完",
    audience: "通用。投什么岗位都不会出错，打印出来也好看。",
    status: "ready",
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
    tagline: "深色终端，信息密度高",
    audience: "计算机、算法、后端。看起来就像他们每天待着的地方。",
    status: "ready",
    swatch: {
      bg: "#0b0d0f",
      fg: "#e7e9ec",
      muted: "#8b9299",
      line: "#1c2025",
      accent: "#5eead4",
    },
  },

  // ——— 备选，等功能齐了再开 ———
  {
    id: "editorial",
    name: "Editorial",
    tagline: "杂志版式，大字标题",
    audience: "设计、媒体、运营。",
    status: "planned",
    swatch: {
      bg: "#fbfaf7",
      fg: "#161513",
      muted: "#6f6a60",
      line: "#e4e0d6",
      accent: "#b42318",
    },
  },
  {
    id: "gallery",
    name: "Gallery",
    tagline: "画廊目录，作品优先",
    audience: "艺术、设计、建筑。作品多、图片多的人。",
    status: "planned",
    swatch: {
      bg: "#f7f6f2",
      fg: "#1a1917",
      muted: "#726f68",
      line: "#e2dfd7",
      accent: "#1a1917",
    },
  },
  {
    id: "studio",
    name: "Studio",
    tagline: "深色底 + 一个等距场景",
    audience: "前端、创意技术。只做静态插画，不引入 WebGL。",
    status: "planned",
    swatch: {
      bg: "#12141a",
      fg: "#eef0f4",
      muted: "#8f96a3",
      line: "#252935",
      accent: "#8b5cf6",
    },
  },
];

export const READY_TEMPLATES = TEMPLATES.filter(
  (template) => template.status === "ready",
);

export const DEFAULT_TEMPLATE_ID = "paper";

export function getTemplateMeta(id?: string | null): TemplateMeta {
  return (
    READY_TEMPLATES.find((template) => template.id === id) ??
    READY_TEMPLATES.find((template) => template.id === DEFAULT_TEMPLATE_ID) ??
    TEMPLATES[0]
  );
}

export function isReadyTemplate(id?: string | null): boolean {
  return READY_TEMPLATES.some((template) => template.id === id);
}

export function TemplateView({
  id,
  data,
}: {
  id?: string | null;
  data: SiteData;
}) {
  switch (getTemplateMeta(id).id) {
    case "terminal":
      return <TerminalTemplate data={data} />;
    default:
      return <PaperTemplate data={data} />;
  }
}
