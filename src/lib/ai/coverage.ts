import type { Extracted } from "./schemas";

/**
 * 首页有哪几屏是我们固定设计的：简介、经历、项目、教育、技能、联系。
 * 用户只写了经历，剩下几屏就空着 —— 问答阶段先把这些补上，再问细节。
 *
 * 这里只做「有没有」的判断，不评价写得好不好。
 */
export type SectionKey =
  | "summary"
  | "education"
  | "project"
  | "skill"
  | "contact"
  | "email";

export const SECTION_FIELD: Record<SectionKey, string> = {
  summary: "profile.summary",
  education: "education.school",
  project: "project.role",
  skill: "skill.items",
  contact: "profile.city",
  email: "profile.email",
};

/** 看着像一句自我介绍就能用 */
function hasSummary(extracted: Extracted): boolean {
  return (extracted.summary ?? "").trim().length >= 8;
}

export function missingSections(
  extracted: Extracted,
  pickedSkills: string[] = [],
): SectionKey[] {
  const missing: SectionKey[] = [];
  const skills = [...(extracted.skills ?? []), ...pickedSkills].filter(Boolean);

  if (!hasSummary(extracted)) missing.push("summary");
  if (!extracted.blocks.some((block) => block.type === "education")) {
    missing.push("education");
  }
  if (!extracted.blocks.some((block) => block.type === "project")) {
    missing.push("project");
  }
  // 项目问题放在技能前面：有项目没项目，写文案的路子差很多
  if (skills.length === 0) missing.push("skill");
  if (!extracted.city?.trim()) missing.push("contact");
  if (!extracted.email?.trim()) missing.push("email");

  return missing;
}

/**
 * 问答进行中要知道「现在还缺哪屏」——那时候内容已经落成库里的块了，
 * 不能再用抽取结果算，否则答过的还会被再问一遍。
 */
export function missingFromBlocks(
  blocks: { type: string; content?: unknown }[],
): SectionKey[] {
  const profile = blocks.find((block) => block.type === "profile");
  const content = (profile?.content ?? {}) as {
    summary?: string;
    city?: string;
    email?: string;
  };

  const missing: SectionKey[] = [];
  if ((content.summary ?? "").trim().length < 8) missing.push("summary");
  if (!blocks.some((block) => block.type === "education")) missing.push("education");
  if (!blocks.some((block) => block.type === "project")) missing.push("project");
  if (!blocks.some((block) => block.type === "skill")) missing.push("skill");
  if (!content.city?.trim()) missing.push("contact");
  if (!content.email?.trim()) missing.push("email");

  return missing;
}
