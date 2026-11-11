import type { ResumeBlock } from "@prisma/client";

/**
 * 模板只认这一层数据，不认 Prisma 模型。
 * 换模板、加模板都不用来动内容表。
 */

export interface SiteSection {
  kind: string;
  title: string;
  org: string;
  period: string;
  lines: string[];
}

export interface SiteData {
  name: string;
  headline: string;
  summary: string;
  email: string;
  city: string;
  sections: SiteSection[];
  skills: string[];
}

interface BlockContent {
  name?: string;
  headline?: string;
  summary?: string;
  email?: string;
  phone?: string;
  city?: string;
  title?: string;
  org?: string;
  period?: string;
  details?: string[];
  items?: string[];
  versions?: string[];
  chosen?: number;
  /** 用户在编辑器里直接改过的文字，优先级最高 */
  custom?: string;
}

export const SECTION_LABELS: Record<string, string> = {
  education: "教育",
  experience: "实习 / 工作",
  project: "项目",
};

/** 技能是「一串词」还是「一句话」——决定模板里用并排还是整段 */
export function isSkillList(skills: string[]): boolean {
  return skills.length > 0 && skills.every((skill) => skill.length <= 14);
}

const SECTION_ORDER = ["experience", "project", "education"];

function pickText(content: BlockContent): string[] {
  if (content.custom && content.custom.trim()) {
    return content.custom
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }
  const versions = content.versions ?? [];
  const chosen = content.chosen ?? 0;
  const picked = versions[chosen] ?? versions[0];
  if (picked) return [picked];
  return content.details ?? [];
}

/** 内容块 → 模板数据。跳过空块，保持录入顺序。 */
export function buildSiteData(blocks: ResumeBlock[]): SiteData {
  const profile = blocks.find((block) => block.type === "profile");
  const profileContent = (profile?.content ?? {}) as BlockContent;

  const sections = blocks
    .filter(
      (block) =>
        block.type !== "profile" &&
        block.type !== "skill" &&
        block.type !== "note",
    )
    .map((block) => {
      const content = block.content as BlockContent;
      return {
        kind: block.type,
        title: content.title ?? "",
        org: content.org ?? "",
        period: content.period ?? "",
        lines: pickText(content).filter(Boolean),
        position: block.position,
      };
    })
    .filter((section) => section.title || section.lines.length > 0)
    .sort((a, b) => {
      const rank = SECTION_ORDER.indexOf(a.kind) - SECTION_ORDER.indexOf(b.kind);
      return rank !== 0 ? rank : a.position - b.position;
    })
    .map(
      (section): SiteSection => ({
        kind: section.kind,
        title: section.title,
        org: section.org,
        period: section.period,
        lines: section.lines,
      }),
    );

  const skillBlock = blocks.find((block) => block.type === "skill");
  const skillContent = (skillBlock?.content ?? {}) as BlockContent;
  // 抽取阶段写 items，写文案阶段可能只剩一句 versions，两种都认
  const skills =
    skillContent.items?.filter(Boolean) ??
    pickText(skillContent).filter(Boolean);

  return {
    name: profileContent.name ?? "",
    headline: profileContent.headline ?? "",
    summary: profileContent.custom?.trim() || profileContent.summary || "",
    email: profileContent.email ?? "",
    city: profileContent.city ?? "",
    sections,
    skills: skills.filter(Boolean),
  };
}
