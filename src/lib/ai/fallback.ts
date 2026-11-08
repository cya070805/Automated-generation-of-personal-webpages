import type { Extracted, Gap } from "./schemas";

/** 模板模式：不调模型，按段落切块，够用就行 */
export function templateExtract(
  text: string,
  meta: { name?: string; role?: string } = {},
): Extracted {
  const paragraphs = text
    .split(/\n{2,}|\r\n\r\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const details = paragraphs.filter((p) => p.length > 6).slice(0, 12);

  const blocks =
    details.length > 0
      ? [
          {
            type: "experience" as const,
            title: meta.role || "经历",
            org: "",
            period: "",
            details,
          },
        ]
      : [];

  return {
    name: meta.name ?? "",
    headline: meta.role ?? "",
    email: "",
    phone: "",
    city: "",
    summary: "",
    blocks,
    skills: [],
  };
}

export function templateGaps(): Gap[] {
  return [
    {
      field: "experience.metric",
      question: "这段经历里，有没有能说出来的数字？比如人数、时长、涨了多少。",
      why: "数字最能撑住一句话",
    },
    {
      field: "experience.role",
      question: "这件事里，哪部分是你自己动手做的？",
      why: "面试官关心你负责哪一块",
    },
    {
      field: "experience.result",
      question: "最后做成了什么？有人用吗，或者被怎么评价？",
      why: "结果比过程更有说服力",
    },
  ];
}

/** 模板模式的两版：一版压缩，一版保留原句 */
export function templateDraft(
  blocks: { id: string; details: string[] }[],
): { id: string; versions: string[]; sourceQuote: string }[] {
  return blocks.map((block) => {
    const joined = block.details.join("；");
    const short = joined.length > 40 ? `${joined.slice(0, 40)}…` : joined;
    return {
      id: block.id,
      versions: [short || "（还没有内容）", joined || "（还没有内容）"],
      sourceQuote: block.details[0] ?? "",
    };
  });
}
