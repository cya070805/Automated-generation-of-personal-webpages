import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSlug, hashPassword } from "@/lib/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 发布到平台：写一条 share 记录，路由 /p/[slug] 服务端渲染，改内容即时生效 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: { password?: string; noindex?: boolean };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const page = await db.page.findUnique({
    where: { id },
    include: { share: true },
  });

  if (!page) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "找不到这个页面" } },
      { status: 404 },
    );
  }

  const password = (body.password ?? "").trim();
  const noindex = body.noindex ?? true;

  const data = {
    noindex,
    ...(password ? { passwordHash: hashPassword(password) } : {}),
  };

  const share = page.share
    ? await db.share.update({ where: { pageId: page.id }, data })
    : await db.share.create({
        data: {
          pageId: page.id,
          slug: createSlug(8),
          ...data,
        },
      });

  return NextResponse.json({
    ok: true,
    share: {
      slug: share.slug,
      noindex: share.noindex,
      hasPassword: Boolean(share.passwordHash),
      publishedAt: share.publishedAt.toISOString(),
    },
  });
}

/** 取消发布：分享链接立刻失效，内容还在 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.share.deleteMany({ where: { pageId: id } });
  return NextResponse.json({ ok: true });
}
