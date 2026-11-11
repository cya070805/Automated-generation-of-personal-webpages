import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PenLine } from "lucide-react";
import { db } from "@/lib/db";
import { isValidEditToken } from "@/lib/tokens";
import { buildSiteData } from "@/lib/site-data";
import { getBase, toPrintBase } from "@/lib/templates/bases";
import type { RecipeMap } from "@/lib/templates/types";
import type { SiteLayout, SiteTweaks } from "@/lib/site-config";
import { SiteView } from "@/components/render/site-view";

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
  searchParams: Promise<{ print?: string; bare?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const print = query?.print === "1";
  const bare = query?.bare === "1" || print;
  const project = await loadProject(token);
  if (!project) notFound();

  const resume = project.resumes[0];
  const data = buildSiteData(resume?.blocks ?? []);
  const page = resume?.pages[0];
  const theme = (page?.theme ?? {}) as { tweaks?: SiteTweaks };
  const base = print ? toPrintBase(getBase(page?.baseId)) : getBase(page?.baseId);

  return (
    <>
      <SiteView
        base={base}
        data={data}
        recipeMap={(page?.recipeMap ?? null) as RecipeMap | null}
        layout={(page?.layout ?? null) as SiteLayout | null}
        tweaks={print ? null : theme.tweaks}
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
