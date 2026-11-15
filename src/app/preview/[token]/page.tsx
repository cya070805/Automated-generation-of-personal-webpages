import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PenLine } from "lucide-react";
import { db } from "@/lib/db";
import { isValidEditToken } from "@/lib/tokens";
import { buildSiteData } from "@/lib/site-data";
import { getBase, isReadyBase, toPrintBase } from "@/lib/templates/bases";
import type { RecipeMap } from "@/lib/templates/types";
import { normalizeTweaks, type SiteLayout, type SiteTweaks } from "@/lib/site-config";
import { SiteView } from "@/components/render/site-view";
import { LivePreview } from "@/components/render/live-preview";

export const dynamic = "force-dynamic";

async function loadProject(token: string) {
  if (!isValidEditToken(token)) return null;
  return db.project.findUnique({
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
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const project = await loadProject(token);
  const blocks = project?.resumes[0]?.blocks ?? [];
  const data = buildSiteData(blocks);
  const title = data.name ? `${data.name} · 个人主页` : project?.title;

  return {
    title: { absolute: title ?? "个人主页" },
    description: data.headline || data.summary || undefined,
    robots: { index: false, follow: false },
  };
}

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ print?: string; bare?: string; base?: string; static?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const print = query?.print === "1";
  // 导出包是静态单页：轮盘那种一次只显示一格的壳在没 JS 的页面里等于丢内容，
  // 所以静态导出与打印一样落回长页。
  const flat = query?.static === "1" || print;
  const bare = query?.bare === "1" || print;
  const project = await loadProject(token);
  if (!project) notFound();

  const resume = project.resumes[0];
  const data = buildSiteData(resume?.blocks ?? []);
  const page = resume?.pages[0];
  const theme = (page?.theme ?? {}) as { tweaks?: SiteTweaks };
  const baseId = query?.base && isReadyBase(query.base) ? query.base : page?.baseId;
  const storedBase = print ? toPrintBase(getBase(baseId)) : getBase(baseId);
  const base = flat && storedBase.shell ? { ...storedBase, shell: "stack" as const } : storedBase;
  const recipeMap = (page?.recipeMap ?? null) as RecipeMap | null;
  const layout = (page?.layout ?? null) as SiteLayout | null;
  // 打印也要吃微调，否则导出的 PDF 和屏幕上不是同一张；只把动效压到 0
  const stored = normalizeTweaks(theme.tweaks);
  const tweaks = print ? { ...stored, motion: 0 } : stored;

  // 编辑器里的那一栏走客户端渲染：改配置时由 postMessage 推过来就地重渲，不整页重载
  if (bare && !print) {
    return (
      <LivePreview
        token={token}
        initial={{ base, data, recipeMap, layout, tweaks }}
      />
    );
  }

  return (
    <>
      <SiteView
        base={base}
        data={data}
        recipeMap={recipeMap}
        layout={layout}
        tweaks={tweaks}
      />

      {!bare && (
      <Link
        href={`/edit/${token}`}
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-1.5 rounded-full bg-[#111214]/90 px-3.5 py-2 text-[12.5px] text-white/85 ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-[#111214] print:hidden"
      >
        <PenLine className="size-3.5" />
        编辑
      </Link>
      )}
    </>
  );
}
