import type { TemplateProps } from "./types";
import { SECTION_LABELS, isSkillList } from "@/lib/site-data";

/**
 * Paper：白纸黑字，一页读完。
 * 面试官 30 秒能拿到：谁、做什么、在哪做过、做出什么。
 * 没有卡片、没有阴影，只有字号阶梯和一条条细线。
 */
export function PaperTemplate({ data }: TemplateProps) {
  const groups = data.sections.reduce<Record<string, typeof data.sections>>(
    (acc, section) => {
      acc[section.kind] = acc[section.kind] ?? [];
      acc[section.kind].push(section);
      return acc;
    },
    {},
  );

  return (    <main className="min-h-dvh bg-white text-[#111214] font-sans">
      <div className="mx-auto w-full max-w-[680px] px-7 pb-28 pt-24 print:pt-4">
        <header>
          <h1 className="text-[34px] font-medium leading-[1.15] tracking-[-0.035em]">
            {data.name || "你的名字"}
          </h1>
          {data.headline && (
            <p className="mt-2.5 text-[15px] text-[#737579]">{data.headline}</p>
          )}

          {(data.email || data.city) && (
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-[#3f4145]">
              {data.email && (
                <a
                  href={`mailto:${data.email}`}
                  className="underline decoration-[#d5d5d1] decoration-1 underline-offset-4 transition-colors hover:decoration-[#111214]"
                >
                  {data.email}
                </a>
              )}
              {data.city && <span className="text-[#737579]">{data.city}</span>}
            </div>
          )}
        </header>

        {data.summary && (
          <p className="mt-9 max-w-[58ch] text-[15.5px] leading-[1.9] text-[#3f4145]">
            {data.summary}
          </p>
        )}

        {Object.entries(groups).map(([kind, sections], groupIndex) => {
          return (
            <section key={kind} className="mt-14 break-inside-avoid">
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-[11px] tabular-nums text-[#a0a1a5]">
                  {String(groupIndex + 1).padStart(2, "0")}
                </span>
                <h2 className="text-[12px] tracking-[0.16em] text-[#737579]">
                  {SECTION_LABELS[kind] ?? kind}
                </h2>
                <span className="mb-[3px] h-px flex-1 bg-[#e8e8e5]" />
              </div>

              <ul className="mt-6 space-y-7">
                {sections.map((section, sectionIndex) => (
                  <li
                    key={`${kind}-${sectionIndex}`}
                    className="break-inside-avoid"
                  >
                    <div className="flex items-baseline justify-between gap-6">
                      <div>
                        <h3 className="text-[15.5px] font-medium leading-snug">
                          {section.title || section.org}
                        </h3>
                        {section.title && section.org && (
                          <p className="mt-0.5 text-[13.5px] text-[#737579]">
                            {section.org}
                          </p>
                        )}
                      </div>
                      {section.period && (
                        <span className="shrink-0 font-mono text-[12px] tabular-nums text-[#a0a1a5]">
                          {section.period}
                        </span>
                      )}
                    </div>

                    {section.lines.length > 0 && (
                      <div className="mt-2.5 space-y-1.5 text-[14.5px] leading-[1.85] text-[#3f4145]">
                        {section.lines.map((line, lineIndex) => (
                          <p key={lineIndex}>{line}</p>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {data.skills.length > 0 && (
          <section className="mt-14 break-inside-avoid">
            <div className="flex items-baseline gap-4">
              <span className="font-mono text-[11px] tabular-nums text-[#a0a1a5]">
                {String(Object.keys(groups).length + 1).padStart(2, "0")}
              </span>
              <h2 className="text-[12px] tracking-[0.16em] text-[#737579]">技能</h2>
              <span className="mb-[3px] h-px flex-1 bg-[#e8e8e5]" />
            </div>
            <p className="mt-5 text-[13.5px] leading-[1.9] text-[#3f4145]">
              {isSkillList(data.skills)
                ? data.skills.join("  /  ")
                : data.skills.join(" ")}
            </p>
          </section>
        )}

        {data.email && (
          <footer className="mt-20 flex flex-wrap items-baseline justify-between gap-3 border-t border-[#e8e8e5] pt-6 text-[12px] text-[#a0a1a5]">
            <span>{"想聊聊，发邮件就行。"}</span>
            <a
              href={`mailto:${data.email}`}
              className="font-mono text-[12px] text-[#737579] underline decoration-[#e8e8e5] underline-offset-4 hover:text-[#111214]"
            >
              {data.email}
            </a>
          </footer>
        )}
      </div>
    </main>
  );
}
