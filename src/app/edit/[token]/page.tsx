import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isValidEditToken } from "@/lib/tokens";
import { Editor, type EditorBlock, type EditorShare } from "@/components/editor/editor";
import type { RecipeMap } from "@/lib/templates/types";
import { normalizeTweaks, type SiteLayout, type SiteTweaks } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "编辑器",
};

const LABELS: Record<string, string> = {
  profile: "简介",
  education: "教育",
  experience: "实习 / 工作",
  project: "项目",
  skill: "技能",
};

interface BlockContent {
  name?: string;
  headline?: string;
  summary?: string;
  title?: string;
  org?: string;
  period?: string;
  details?: string[];
  items?: string[];
  versions?: string[];
  chosen?: number;
  custom?: string;
}

function blockFallbackText(type: string, content: BlockContent): string {
  if (type === "profile") return content.summary ?? "";
  const versions = content.versions ?? [];
  const picked = versions[content.chosen ?? 0] ?? versions[0];
  if (picked) return picked;
  if (content.items?.length) return content.items.join(" / ");
  return (content.details ?? []).join("\n");
}

function blockText(type: string, content: BlockContent): string {
  if (content.custom?.trim()) return content.custom;
  return blockFallbackText(type, content);
}

export default async function EditPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!isValidEditToken(token)) notFound();

  const project = await db.project.findUnique({
    where: { editToken: token },
    include: {
      resumes: {
        orderBy: { createdAt: "asc" },
        include: {
          blocks: { orderBy: { position: "asc" } },
          pages: { orderBy: { createdAt: "asc" }, include: { share: true } },
        },
      },
    },
  });

  if (!project) notFound();

  const resume = project.resumes[0];
  const page = resume?.pages[0];

  const blocks: EditorBlock[] = (resume?.blocks ?? [])
    .filter((block) => block.type !== "note")
    .map((block) => {
      const content = (block.content ?? {}) as BlockContent;
      return {
        id: block.id,
        type: block.type,
        label: LABELS[block.type] ?? block.type,
        title: content.title ?? "",
        org: content.org ?? "",
        period: content.period ?? "",
        text: blockText(block.type, content),
        fallback: blockFallbackText(block.type, content),
      };
    });

  const theme = (page?.theme ?? {}) as { tweaks?: SiteTweaks };

  const share: EditorShare | null = page?.share
    ? {
        slug: page.share.slug,
        noindex: page.share.noindex,
        hasPassword: Boolean(page.share.passwordHash),
        publishedAt: page.share.publishedAt.toISOString(),
      }
    : null;

  return (
    <Editor
      token={token}
      pageId={page?.id ?? ""}
      title={project.title}
      blocks={blocks}
      share={share}
      initial={{
        baseId: page?.baseId ?? "paper",
        recipeMap: (page?.recipeMap ?? {}) as RecipeMap,
        layout: (page?.layout ?? {}) as SiteLayout,
        tweaks: normalizeTweaks(theme.tweaks),
      }}
    />
  );
}
