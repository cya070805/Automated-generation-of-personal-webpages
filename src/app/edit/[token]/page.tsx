import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isValidEditToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "内容",
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
        },
      },
    },
  });

  if (!project) notFound();

  const resume = project.resumes[0];
  const blocks = resume?.blocks ?? [];
  const profile = blocks.find((block) => block.type === "profile");
  const profileContent = (profile?.content ?? {}) as BlockContent;

  return (
    <div className="fade-up max-w-[760px]">
      <p className="text-[12.5px] text-faint">内容</p>
      <h1 className="mt-2 text-[30px] leading-tight tracking-[-0.02em] text-ink">
        {profileContent.name || project.title}
      </h1>
      {profileContent.headline && (
        <p className="mt-1.5 text-[14px] text-muted">{profileContent.headline}</p>
      )}

      <div className="mt-10 space-y-8">
        {blocks
          .filter((block) => block.type !== "profile" && block.type !== "note")
          .map((block) => {
            const content = block.content as BlockContent;
            const versions = content.versions ?? [];
            const chosen = versions[content.chosen ?? 0];

            return (
              <section key={block.id} className="border-t border-line pt-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-[12px] text-faint">
                    {LABELS[block.type] ?? block.type}
                  </span>
                  {content.title &&
                    content.title !== (LABELS[block.type] ?? block.type) && (
                      <h2 className="text-[14px] font-medium text-ink">
                        {content.title}
                      </h2>
                    )}
                  {content.period && (
                    <span className="text-[12px] text-faint">{content.period}</span>
                  )}
                </div>

                {chosen ? (
                  <p className="mt-3 text-[14.5px] leading-[1.8] text-ink-2">
                    {chosen}
                  </p>
                ) : content.items?.length ? (
                  <p className="mt-3 text-[14px] leading-[1.8] text-ink-2">
                    {content.items.join(" · ")}
                  </p>
                ) : (
                  <p className="mt-3 text-[13.5px] leading-[1.8] text-muted">
                    {(content.details ?? []).join("；") || "还没有内容"}
                  </p>
                )}
              </section>
            );
          })}
      </div>

      <p className="mt-12 border-t border-line pt-5 text-[12px] text-faint">
        把这条链接存好，下次从这里回来继续改。
      </p>
    </div>
  );
}
