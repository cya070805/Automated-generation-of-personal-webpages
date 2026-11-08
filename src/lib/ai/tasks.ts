import { completeJson, AiTaskError } from "./json";
import type { AiConfig } from "./config";
import {
  draftSchema,
  extractedSchema,
  gapsSchema,
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

const GAP_SYSTEM = `你在做简历的「缺口分析」，目标是找出写不出好文案的地方。
只关注四类缺口：数字（规模、涨幅、耗时、人数）、角色（你具体负责哪部分）、结果（做成了什么、被怎么评价）、时间（起止、多久）。
规则：
- 最多 5 个问题，按重要性排序。
- 一次只问一个问题，用口语，不超过 40 字，不要用「请描述」这种书面语。
- 已经写清楚的信息不要再问。
- 每个问题的 field 用简短英文标识，例如 experience.metric。`;

const DRAFT_SYSTEM = `你在帮应届生把经历改写成简历文案。
规则：
- 每个 block 给两版，放在 versions 字段里，是长度为 2 的字符串数组：第一个是 A 版，第二个是 B 版。
- A 版：短、客观、动词开头，20-40 字。
- B 版：保留关键数字与结果，30-60 字。
- 不编造事实；没有数字就写清楚做了什么、影响了谁。
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
): Promise<Gap[]> {
  const result = await completeJson({
    config,
    system: GAP_SYSTEM,
    user: `已整理的素材：\n${JSON.stringify(extracted).slice(0, 8000)}\n\n请找出还缺的信息，输出 {"gaps":[...]}。`,
    schema: gapsSchema,
    temperature: 0.4,
    maxTokens: 800,
  });
  return result.gaps;
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
