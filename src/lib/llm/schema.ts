import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1),
});

export const chatRequestSchema = z.object({
  providerId: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string().min(1, "缺少模型名"),
  messages: z.array(chatMessageSchema).min(1).max(80),
  stream: z.boolean().optional().default(true),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(32_000).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const testRequestSchema = z.object({
  providerId: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string().min(1, "缺少模型名"),
});

export type TestRequest = z.infer<typeof testRequestSchema>;

/** 项目创建：一期只要求一个标题，其余字段后面几期再补 */
export const createProjectSchema = z.object({
  title: z.string().trim().min(1).max(60).optional(),
  targetRole: z.string().trim().max(60).optional(),
});
