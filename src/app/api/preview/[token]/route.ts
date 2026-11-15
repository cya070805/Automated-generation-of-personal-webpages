import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidEditToken } from "@/lib/tokens";
import { buildSiteData } from "@/lib/site-data";
import { getBase, isReadyBase } from "@/lib/templates/bases";
import type { RecipeMap } from "@/lib/templates/types";
import type { SiteLayout, SiteTweaks } from "@/lib/site-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 预览用的整页数据。
 * 编辑器改完配置后不刷新页面，只让 iframe 把这一包重新拉一遍就地重渲
 * —— 滚动位置、已经展开的状态都还在原地。
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!isValidEditToken(token)) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "链接不完整" } },
      { status: 400 },
    );
  }

  const project = await db.project.findUnique({
    where: { editToken: token },
    include: {
      resumes: {
        orderBy: { createdAt: "asc" },
        include: {
          blocks: { orderBy: { position: "asc" } },
          pages: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
  if (!project) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "找不到这个页面" } },
      { status: 404 },
    );
  }

  const resume = project.resumes[0];
  const page = resume?.pages[0];
  const theme = (page?.theme ?? {}) as { tweaks?: SiteTweaks };
  const baseId = isReadyBase(page?.baseId) ? page.baseId : "paper";

  return NextResponse.json(
    {
      base: getBase(baseId),
      data: buildSiteData(resume?.blocks ?? []),
      recipeMap: (page?.recipeMap ?? null) as RecipeMap | null,
      layout: (page?.layout ?? null) as SiteLayout | null,
      tweaks: theme.tweaks ?? null,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
