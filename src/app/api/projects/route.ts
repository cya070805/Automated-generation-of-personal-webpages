import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createProjectSchema } from "@/lib/llm/schema";
import { createEditToken } from "@/lib/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 建一个匿名项目：同时建出简历容器与页面骨架 */
export async function POST(req: Request) {
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const parsed = createProjectSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "标题不合法" } },
      { status: 400 },
    );
  }

  const editToken = createEditToken();

  const project = await db.project.create({
    data: {
      title: parsed.data.title ?? "我的主页",
      editToken,
      resumes: {
        create: {
          targetRole: parsed.data.targetRole,
          pages: {
            create: {
              theme: { preset: "paper", accent: "teal" },
              layout: { sections: [] },
            },
          },
        },
      },
    },
    include: { resumes: { include: { pages: true } } },
  });

  return NextResponse.json(
    {
      id: project.id,
      title: project.title,
      editToken: project.editToken,
      editUrl: `/edit/${project.editToken}`,
      resumeId: project.resumes[0]?.id,
      pageId: project.resumes[0]?.pages[0]?.id,
      createdAt: project.createdAt,
    },
    { status: 201, headers: { "cache-control": "no-store" } },
  );
}
