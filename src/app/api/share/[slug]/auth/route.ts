import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { shareCookieValue, verifyPassword } from "@/lib/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_AGE = 60 * 60 * 24 * 7;

/** 访问密码校验：通过就发一个 httpOnly 凭证，不存明文、不建会话表 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const share = await db.share.findUnique({ where: { slug } });
  if (!share) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "链接不存在" } },
      { status: 404 },
    );
  }

  if (!share.passwordHash) {
    return NextResponse.json({ ok: true });
  }

  const password = (body.password ?? "").trim();
  if (!password || !verifyPassword(password, share.passwordHash)) {
    return NextResponse.json(
      { error: { code: "WRONG_PASSWORD", message: "密码不对" } },
      { status: 401 },
    );
  }

  const jar = await cookies();
  jar.set(`share_${slug}`, shareCookieValue(share.passwordHash), {
    httpOnly: true,
    sameSite: "lax",
    path: `/p/${slug}`,
    maxAge: MAX_AGE,
  });

  return NextResponse.json({ ok: true });
}
