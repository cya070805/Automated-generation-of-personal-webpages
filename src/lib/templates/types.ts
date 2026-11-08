import type { SiteData } from "@/lib/site-data";

/** 模板配色，界面上用来画缩略色块，模板内部自己用真正的样式 */
export interface TemplateSwatch {
  bg: string;
  fg: string;
  muted: string;
  line: string;
  accent: string;
}

export interface TemplateMeta {
  id: string;
  name: string;
  /** 给模板选择卡片的一句话 */
  tagline: string;
  /** 展开说明：适合谁 */
  audience: string;
  /** ready = 可以选；planned = 先占位，界面上不出现 */
  status: "ready" | "planned";
  swatch: TemplateSwatch;
}

export interface TemplateProps {
  data: SiteData;
}
