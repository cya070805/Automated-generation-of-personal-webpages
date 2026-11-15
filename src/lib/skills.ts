/**
 * 采集阶段让用户勾的常用技能。
 *
 * 分组是为了让人一眼找到自己那一类，不是穷举 —— 找不到的自己加一个。
 * 这里只放「写出来面试官认得」的词，别放太多近义词给用户制造选择困难。
 */

export interface SkillGroup {
  label: string;
  items: string[];
}

export const SKILL_GROUPS: SkillGroup[] = [
  {
    label: "编程语言",
    items: ["JavaScript", "TypeScript", "Python", "Java", "C++", "Go", "SQL"],
  },
  {
    label: "前端",
    items: ["React", "Vue", "Next.js", "小程序", "Tailwind CSS", "Three.js"],
  },
  {
    label: "后端 / 数据",
    items: ["Node.js", "Spring Boot", "MySQL", "Redis", "Docker", "Git", "Linux"],
  },
  {
    label: "算法 / 分析",
    items: ["机器学习", "深度学习", "PyTorch", "数据分析", "Pandas"],
  },
  {
    label: "设计 / 产品",
    items: ["Figma", "Photoshop", "Axure", "原型设计", "用户调研"],
  },
  {
    label: "语言 / 证书",
    items: ["英语 CET-6", "雅思 6.5", "日语 N2", "普通话二甲", "教师资格证"],
  },
];

/** 一个人最多勾这么多：再多首页也放不下，反而变成一堵墙 */
export const SKILL_LIMIT = 24;

/** 「熟悉 Spring Boot」→「Spring Boot」：从散文里抠技能词时先去掉这些壳 */
const FILLER_HEAD =
  /^(熟悉|熟练使用|熟练掌握|掌握|会用|会使用|会|了解|具备|有使用|使用|用到|擅长|能独立完成|能|独立完成)/;
const FILLER_TAIL = /(等|等等|相关技术|相关|基础|的能力|能力)$/;

export function tidySkill(raw: string): string {
  let item = raw.trim().replace(/\s+/g, " ");
  for (let i = 0; i < 3; i += 1) {
    const next = item.replace(FILLER_HEAD, "").replace(FILLER_TAIL, "").trim();
    if (next === item) break;
    item = next;
  }
  return item.slice(0, 20).trim();
}

/** 手输 / 勾选的技能统一在这里收口：去空、去重、限长 */
export function normalizeSkills(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const item = raw.trim().replace(/\s+/g, " ").slice(0, 20);
    if (!item) continue;
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= SKILL_LIMIT) break;
  }
  return out;
}
