import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 一期自检：数据库通了没有、十张表在不在 */
export async function GET() {
  const startedAt = Date.now();

  try {
    const [projects, resumes, blocks, sessions, messages, pages, versions, assets, shares, exports] =
      await Promise.all([
        db.project.count(),
        db.resume.count(),
        db.resumeBlock.count(),
        db.chatSession.count(),
        db.message.count(),
        db.page.count(),
        db.pageVersion.count(),
        db.asset.count(),
        db.share.count(),
        db.export.count(),
      ]);

    return NextResponse.json({
      ok: true,
      latencyMs: Date.now() - startedAt,
      database: "sqlite",
      counts: {
        projects,
        resumes,
        resume_blocks: blocks,
        chat_sessions: sessions,
        messages,
        pages,
        page_versions: versions,
        assets,
        shares,
        exports,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        latencyMs: Date.now() - startedAt,
        error: {
          code: "DB_UNAVAILABLE",
          message:
            error instanceof Error ? error.message : "数据库连不上，先跑 npm run db:push",
        },
      },
      { status: 503 },
    );
  }
}
