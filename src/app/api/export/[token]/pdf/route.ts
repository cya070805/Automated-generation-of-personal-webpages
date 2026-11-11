import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidEditToken } from "@/lib/tokens";
import { buildSiteData } from "@/lib/site-data";
import { renderPdf } from "@/lib/export/browser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** 简历 PDF：无头浏览器打印同一个 /preview 路由，不做二次排版 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!isValidEditToken(token)) {
    return NextResponse.json({ error: { code: "BAD_TOKEN" } }, { status: 400 });
  }

  const project = await db.project.findUnique({
    where: { editToken: token },
    include: {
      resumes: {
        orderBy: { createdAt: "asc" },
        include: {
          blocks: { orderBy: { position: "asc" } },
          pages: true,
        },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  const data = buildSiteData(project.resumes[0]?.blocks ?? []);
  const origin = new URL(req.url).origin;

  try {
    const pdf = await renderPdf(origin, token);
    const filename = `${data.name || "个人主页"}-简历.pdf`;

    if (project.resumes[0]?.pages[0]) {
      await db.export.create({
        data: {
          pageId: project.resumes[0].pages[0].id,
          mode: "pdf",
          version: "1",
          path: filename,
        },
      });
    }

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "EXPORT_FAILED",
          message: error instanceof Error ? error.message : "PDF 生成失败",
        },
      },
      { status: 500 },
    );
  }
}
