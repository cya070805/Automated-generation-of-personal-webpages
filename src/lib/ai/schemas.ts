import { z } from "zod";

export const extractedSchema = z.object({
  name: z.string().default(""),
  headline: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  city: z.string().default(""),
  summary: z.string().default(""),
  blocks: z
    .array(
      z.object({
        type: z.enum(["education", "experience", "project", "skill"]),
        title: z.string().default(""),
        org: z.string().default(""),
        period: z.string().default(""),
        details: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  skills: z.array(z.string()).default([]),
});

export type Extracted = z.infer<typeof extractedSchema>;

export const gapsSchema = z.object({
  gaps: z
    .array(
      z.object({
        field: z.string().default("experience"),
        question: z.string(),
        why: z.string().default(""),
      }),
    )
    .max(6),
});

export type Gap = z.infer<typeof gapsSchema>["gaps"][number];

/**
 * 模型有时会把两版写成 {A,B}，有时拆成 a/b 字段。
 * 这里统一收成字符串数组，别因为格式让整轮生成作废。
 */
const draftItemSchema = z
  .object({
    id: z.string(),
    versions: z.union([z.array(z.string()), z.record(z.string())]).optional(),
    a: z.string().optional(),
    b: z.string().optional(),
    A: z.string().optional(),
    B: z.string().optional(),
    sourceQuote: z.string().optional(),
  })
  .transform((item) => {
    let versions: string[] = [];
    if (Array.isArray(item.versions)) versions = item.versions;
    else if (item.versions) versions = Object.values(item.versions);

    if (versions.length === 0) {
      versions = [item.a ?? item.A ?? "", item.b ?? item.B ?? ""].filter(Boolean);
    }

    return {
      id: item.id,
      versions: versions.filter(Boolean).slice(0, 2),
      sourceQuote: item.sourceQuote ?? "",
    };
  });

export const draftSchema = z.object({
  items: z.array(draftItemSchema),
});

export type DraftItem = {
  id: string;
  versions: string[];
  sourceQuote: string;
};
