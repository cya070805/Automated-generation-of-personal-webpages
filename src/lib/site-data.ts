import type { ResumeBlock } from "@prisma/client";
import { normalizeSkills, tidySkill } from "@/lib/skills";

/**
 * 模板只认这一层数据，不认 Prisma 模型。
 * 换模板、加模板都不用来动内容表。
 */

export interface SiteSection {
  /** 内容块 id —— 编辑器改字时靠它认出这一屏是谁 */
  id: string;
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
  /** 简介和技能不在章节里排，改字时要按 id 单独认 */
  profileId: string;
  skillId: string;
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

/** 一段文字按行拆成条目 */
export function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** 技能块可能是「一个词一行」，也可能是被写成一行「A / B / C」，两种都拆得开 */
export function splitSkills(text: string): string[] {
  return text
    .split(/\r?\n/)
    .flatMap((line) => line.split(/[\/／、·|]/))
    .map((item) => item.trim())
    .filter(Boolean);
}

function pickText(content: BlockContent): string[] {
  if (content.custom && content.custom.trim()) {
    return splitLines(content.custom);
  }
  const versions = content.versions ?? [];
  const chosen = content.chosen ?? 0;
  const picked = versions[chosen] ?? versions[0];
  if (picked) return [picked];
  return content.details ?? [];
}

/**
 * 技能栏只认「一串短词」。
 *
 * 一个项目里可能同时存在抽取出来的技能块和用户勾选的技能块 ——
 * 有 items / custom 的那些说了算，别让一整段话（「具备…基础，熟悉…」）
 * 抢到技能栏，最后渲染成一句话。
 */
function collectSkills(blocks: ResumeBlock[]): string[] {
  const skillBlocks = blocks.filter((block) => block.type === "skill");
  if (skillBlocks.length === 0) return [];

  const lists: string[][] = [];
  for (const block of skillBlocks) {
    const content = (block.content ?? {}) as BlockContent;
    const custom = typeof content.custom === "string" ? content.custom.trim() : "";
    if (custom) {
      lists.push(splitSkills(custom));
      continue;
    }
    const items = (content.items ?? []).filter(Boolean);
    if (items.length > 0) lists.push(items);
  }

  const picked = lists.length > 0 ? lists.flat() : [];
  if (picked.length > 0) return normalizeSkills(picked.filter(Boolean));

  // 只有一个「技能全靠一句话描述」的块时，才退化成从句子里的拆词
  const prose = skillBlocks
    .map((block) => pickText((block.content ?? {}) as BlockContent).join(" "))
    .join("、");
  return normalizeSkills(
    splitSkills(prose)
      .map((item) => tidySkill(item))
      .filter((item) => item.length > 0 && item.length <= 14),
  );
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
        id: block.id,
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
        id: section.id,
        kind: section.kind,
        title: section.title,
        org: section.org,
        period: section.period,
        lines: section.lines,
      }),
    );

  const skillBlock = blocks.find((block) => block.type === "skill");
  const skills = collectSkills(blocks);

  return {
    name: profileContent.name ?? "",
    headline: profileContent.headline ?? "",
    summary: profileContent.custom?.trim() || profileContent.summary || "",
    email: profileContent.email ?? "",
    city: profileContent.city ?? "",
    sections,
    skills,
    profileId: profile?.id ?? "",
    skillId: skillBlock?.id ?? "",
  };
}

/**
 * 编辑器里改字的即时预览：不碰数据库，只把这一块算出来的文字就地换掉。
 * 规则跟 buildSiteData 一致 —— 自定义文字被清空就退回原文（fallback）。
 *
 * 返回同一个对象表示「这一块不在这份数据里」（比如新建的空段还没被服务器
 * 收进 sections），调用方据此决定要不要向服务器重算一次。
 */
export function applyBlockText(
  data: SiteData,
  patch: { blockId: string; text: string; fallback?: string },
): SiteData {
  const raw = patch.text.trim() ? patch.text : (patch.fallback ?? "");

  if (patch.blockId && patch.blockId === data.profileId) {
    return { ...data, summary: raw.trim() };
  }

  if (patch.blockId && patch.blockId === data.skillId) {
    return { ...data, skills: splitSkills(raw) };
  }

  const index = data.sections.findIndex(
    (section) => section.id === patch.blockId,
  );
  if (index < 0) return data;

  const lines = splitLines(raw);
  return {
    ...data,
    sections: data.sections.map((section, position) =>
      position === index ? { ...section, lines } : section,
    ),
  };
}
