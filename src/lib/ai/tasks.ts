import { completeJson, AiTaskError } from "./json";
import type { AiConfig } from "./config";
import { SECTION_FIELD, type SectionKey } from "./coverage";
import {
  askSchema,
  draftSchema,
  extractedSchema,
  gapsSchema,
  type AskResult,
  type Extracted,
  type Gap,
} from "./schemas";

const EXTRACT_SYSTEM = `你在帮应届生/实习生把一段杂乱的中文经历整理成结构化简历素材。
规则：
- 只抽取原文中明确写过的事实，不要编造公司名、数字、时间。
- 原文没有的字段就留空字符串或空数组。
- details 保留能支撑后面写文案的具体事实（做了什么、用了什么、结果如何），一条一句，最多 5 条。
- type 只能是 education / experience / project / skill 之一。
- 如果原文是简历，按段落拆成多个 block；如果是一段自由描述，按事情拆。`;

const GAP_SYSTEM = `你在帮应届生/实习生补齐一份个人主页要用的素材。
这一页固定有六屏：简介、经历、项目、教育、技能、联系。用户往往只写了自己想得起来的那几件事，
你的活是先把空着的几屏问出来，再回头问已经写过的经历里缺的细节。

规则：
- 最多 7 个问题、至少 5 个。顺序：先补空着的板块，再问细节。
- 「还空着的板块」里每一个都必须有一问，一个都不能漏（一个问题问一屏，别合并）。
- 补完板块再补 2–3 个细节问题；素材里已经写清楚数字、角色、结果的就不用再问。
- 补板块时 field 必须用指定值，别自创：
  · 自我介绍 → profile.summary
  · 教育经历 → education.school
  · 项目经历 → project.role
  · 技能 → skill.items
  · 所在城市 → profile.city
  · 邮箱 → profile.email（这一项单独问，别和城市混在一句里）
- 问经历细节时只关注四类：数字（规模、覆盖范围、交付量、被复用次数）、角色（你具体负责哪部分）、结果（做成了什么、被怎么评价）、时间（起止、多久）。field 用 experience.xxx 或 project.xxx。
- 问数字时优先问能体现能力的：多少人在用、覆盖多少业务、被几个团队接入、省了多少人力；别只盯着耗时。
- 一次只问一件事，用口语，不超过 40 字，不要用「请描述」这种书面语。
- 已经写清楚的信息不要再问；用户自己勾了技能就别再问技能。
- 素材里一件经历/项目都没有时，先问出一件来（field 用 experience.story），别急着问数字。
- why 写给用户看：一句话说明这屏为什么要这块信息，不超过 25 字。
- hint 给一个填写示例，不超过 40 字；没有合适的示例就留空字符串。`;

const DRAFT_SYSTEM = `你在帮应届生把经历改写成简历文案。
规则：
- 每个 block 给两版，放在 versions 字段里，是长度为 2 的字符串数组：第一个是 A 版，第二个是 B 版。
- A 版：短、客观、动词开头，20-40 字。
- B 版：保留关键数字与结果，30-60 字。
- 不编造事实；没有数字就写清楚做了什么、影响了谁。
- 数字要能说明「这个人有多能干」，优先级从高到低：规模（用户数、数据量、覆盖院系/业务线）、交付量与复用（被几个团队接入、省下多少人力）、责任范围（带几个人、管几个模块）、影响面（事故降为 0、被谁采用）。单纯的技术耗时（900ms、1.6s）排在最后，写的时候必须带上「原来多差 / 这件事多难」当对照，否则不写。
- sourceQuote 从原文 details 里摘一句作为依据；摘不出来就留空。
- 输出里必须原样带回每个 block 的 id。
- 输出格式：{"items":[{"id":"...","versions":["A版","B版"],"sourceQuote":"..."}]}`;

export async function extractResume(
  config: AiConfig,
  text: string,
): Promise<Extracted> {
  return completeJson({
    config,
    system: EXTRACT_SYSTEM,
    user: `下面是用户的原始经历，请抽取成 JSON：\n\n${text.slice(0, 12_000)}`,
    schema: extractedSchema,
    temperature: 0.1,
    maxTokens: 2000,
  });
}

export async function findGaps(
  config: AiConfig,
  extracted: Extracted,
  missing: SectionKey[] = [],
): Promise<Gap[]> {
  const empty = missing.length
    ? missing
        .map((key) => `${key}（field 用 ${SECTION_FIELD[key]}）`)
        .join("、")
    : "无，六屏都有内容了";
  const result = await completeJson({
    config,
    system: GAP_SYSTEM,
    user: `已整理的素材：\n${JSON.stringify(extracted).slice(0, 8000)}\n\n还空着的板块：${empty}\n\n请输出 {"gaps":[...]}。`,
    schema: gapsSchema,
    temperature: 0.4,
    maxTokens: 1200,
  });
  return result.gaps;
}

/* ——————————————— 对话：决定下一问 ——————————————— */

const ASK_SYSTEM = `你在跟一名应届生聊天，帮他把个人主页的素材问全。主页固定六屏：简介、经历、项目、教育、技能、联系。

每一轮你只决定「下一个问题是什么」，按这个优先级：
1. 上一答里含糊的地方先追问：没说清你负责哪部分、缺数字、时间不明、结果没落地 —— 这是最自然的下一步。
2. 还有空着的屏，就让他补那一屏（比如还没有个人简介，就请他写一句）。
3. 都齐了，再问现有经历里还能更好的细节（规模、被谁用、怎么衡量）。

规则：
- 一次只问一件事；口语；不超过 40 字；不要「请描述」「请说明」这种书面语。
- 不要重复问过的内容（已经问过的会列给你）。
- 如果素材已经够写一页，或者没有值得再问的了，就返回 done: true，question 留空。
- field 用指定值：简介 profile.summary / 教育 education.school / 项目 project.role / 技能 skill.items / 城市 profile.city / 邮箱 profile.email / 经历细节 experience.xxx / 项目细节 project.xxx。
- 邮箱单独问，别和城市挤在一句里；如果他不想给，允许跳过。
- 实习经历、兼职、正式工作才算 experience；比赛、课程设计、社团项目都算 project。
- 对方是在校生很常见：没有实习不是缺点，直接把项目、比赛问出来就好，别反复追问「有没有实习」。
- why：一句话告诉他为什么问，给用户看的，不超过 25 字。
- hint：填写示例，不超过 40 字；没有合适的就留空字符串。`;

export interface AskContext {
  asked: number;
  remaining: number;
  askedQuestions: string[];
  transcript: { question: string; answer: string }[];
  material: {
    type: string;
    title?: string;
    org?: string;
    period?: string;
    details?: string[];
  }[];
  missing: SectionKey[];
}

export async function nextQuestion(
  config: AiConfig,
  context: AskContext,
): Promise<AskResult> {
  const missing = context.missing.length
    ? context.missing
        .map((key) => `${key}（field 用 ${SECTION_FIELD[key]}）`)
        .join("、")
    : "无，六屏都有内容了";
  const asked = context.askedQuestions.length
    ? context.askedQuestions.map((line) => `- ${line}`).join("\n")
    : "（还没有问过）";
  const transcript = context.transcript.length
    ? context.transcript
        .map((turn) => `问：${turn.question}\n答：${turn.answer}`)
        .join("\n\n")
    : "（还没有对话）";

  return completeJson({
    config,
    system: ASK_SYSTEM,
    user: [
      `已经问到第 ${context.asked + 1} 个问题，最多还能问 ${context.remaining} 个。`,
      `当前素材：\n${JSON.stringify(context.material).slice(0, 6000)}`,
      `还空着的屏：${missing}`,
      `已经问过的：\n${asked}`,
      `最近的对话：\n${transcript.slice(-2500)}`,
      `请决定下一个问题，输出 {"done":false,"field":"...","question":"...","why":"...","hint":"..."}。`,
    ].join("\n\n"),
    schema: askSchema,
    temperature: 0.5,
    maxTokens: 500,
  });
}

export interface DraftBlockInput {
  id: string;
  type: string;
  title: string;
  org: string;
  period: string;
  details: string[];
}

export async function draftBlocks(
  config: AiConfig,
  blocks: DraftBlockInput[],
  context: string[] = [],
): Promise<{ id: string; versions: string[]; sourceQuote: string }[]> {
  const notes = context.length
    ? `用户的补充回答：\n${context.map((line) => `- ${line}`).join("\n")}\n\n`
    : "";
  const result = await completeJson({
    config,
    system: DRAFT_SYSTEM,
    user: `${notes}素材：\n${JSON.stringify(blocks).slice(0, 10_000)}\n\n请为每个 block 生成两版文案，输出 {"items":[...]}。`,
    schema: draftSchema,
    temperature: 0.5,
    maxTokens: 2400,
  });
  return result.items;
}

/** 把上游错误翻成用户能懂的一句话 */
export function describeAiError(error: unknown) {
  if (error instanceof AiTaskError) {
    switch (error.code) {
      case "NO_KEY":
        return { code: "NO_KEY", message: "还没有配置模型 Key，已切到模板模式。" };
      case "AUTH":
        return { code: "AUTH", message: "Key 无效或额度不足。" };
      case "TIMEOUT":
        return { code: "TIMEOUT", message: "模型响应超时，稍后重试。" };
      case "BAD_OUTPUT":
        return { code: "BAD_OUTPUT", message: "模型没有返回可用的结构，已切到模板模式。" };
      default:
        return { code: error.code, message: error.message };
    }
  }
  return { code: "UNKNOWN", message: "生成失败，已切到模板模式。" };
}
