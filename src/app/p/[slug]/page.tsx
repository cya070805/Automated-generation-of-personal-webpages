import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { buildSiteData } from "@/lib/site-data";
import { getBase } from "@/lib/templates/bases";
import { shareCookieValue } from "@/lib/tokens";
import type { RecipeMap } from "@/lib/templates/types";
import type { SiteLayout, SiteTweaks } from "@/lib/site-config";
import { SiteView } from "@/components/render/site-view";
import { PasswordGate } from "@/components/share/password-gate";

export const dynamic = "force-dynamic";

async function loadShare(slug: string) {
  return db.share.findUnique({
    where: { slug },
    include: {
      page: {
        include: {
          resume: {
            include: {
              blocks: { orderBy: { position: "asc" } },
            },
          },
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const share = await loadShare(slug);
  if (!share) return { title: "页面不存在" };

  const data = buildSiteData(share.page.resume.blocks);
  const title = data.name ? `${data.name} · 个人主页` : "个人主页";
  const locked = Boolean(share.passwordHash);

  return {
    title: { absolute: title },
    description: locked ? undefined : data.headline || data.summary || undefined,
    robots:
      share.noindex || locked
        ? { index: false, follow: false }
        : { index: true, follow: true },
  };
}

export default async function SharedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const share = await loadShare(slug);
  if (!share) notFound();

  const data = buildSiteData(share.page.resume.blocks);

  if (share.passwordHash) {
    const jar = await cookies();
    const token = jar.get(`share_${slug}`)?.value;
    const unlocked = token === shareCookieValue(share.passwordHash);

    if (!unlocked) {
      return <PasswordGate slug={slug} name={data.name || "个人主页"} />;
    }
  }

  const theme = (share.page.theme ?? {}) as { tweaks?: SiteTweaks };

  return (
    <SiteView
      base={getBase(share.page.baseId)}
      data={data}
      recipeMap={(share.page.recipeMap ?? null) as RecipeMap | null}
      layout={(share.page.layout ?? null) as SiteLayout | null}
      tweaks={theme.tweaks ?? null}
    />
  );
}
