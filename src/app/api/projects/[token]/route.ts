import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidEditToken } from "@/lib/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 用编辑链接里的 token 打开项目——这也是「身份」本身 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!isValidEditToken(token)) {
    return NextResponse.json(
      { error: { code: "BAD_TOKEN", message: "编辑链接格式不对" } },
      { status: 400 },
    );
  }

  const project = await db.project.findUnique({
    where: { editToken: token },
    include: {
      resumes: {
        orderBy: { createdAt: "asc" },
        include: {
          pages: { orderBy: { createdAt: "asc" } },
          blocks: { orderBy: { position: "asc" } },
        },
      },
    },
  });

  if (!project) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "找不到这个项目，编辑链接可能已失效" } },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      id: project.id,
      title: project.title,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      resumes: project.resumes.map((resume) => ({
        id: resume.id,
        status: resume.status,
        targetRole: resume.targetRole,
        blocks: resume.blocks,
        pages: resume.pages,
      })),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
