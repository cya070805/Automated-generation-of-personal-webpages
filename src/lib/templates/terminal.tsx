import type { TemplateProps } from "./types";
import { SECTION_LABELS, isSkillList } from "@/lib/site-data";

/**
 * Terminal：深色、等宽、信息密度高。
 * 计算机 / 算法岗最吃这套：看起来就像他们每天待着的地方。
 * 只有一种强调色，其余全靠留白和细线区分层次。
 */
export function TerminalTemplate({ data }: TemplateProps) {
  const groups = data.sections.reduce<Record<string, typeof data.sections>>(
    (acc, section) => {
      acc[section.kind] = acc[section.kind] ?? [];
      acc[section.kind].push(section);
      return acc;
    },
    {},
  );

  return (
    <main className="relative min-h-dvh bg-[#0b0d0f] font-sans text-[#e7e9ec]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(58%_100%_at_50%_0%,rgba(94,234,212,0.08),transparent_72%)]"
      />

      <div className="relative mx-auto w-full max-w-[760px] px-7 pb-28 pt-20 print:pt-4">
        <div className="flex items-baseline justify-between gap-4 font-mono text-[11.5px] text-[#6b7278]">
          <span className="text-[#5eead4]">
            {`~/ ${data.name || "me"}`}
          </span>
          {data.city && <span>{data.city}</span>}
        </div>

        <header className="mt-12">
          <h1 className="text-[36px] font-medium leading-[1.12] tracking-[-0.035em] text-white">
            {data.name || "你的名字"}
          </h1>
          {data.headline && (
            <p className="mt-3 font-mono text-[13px] text-[#5eead4]">
              {data.headline}
            </p>
          )}
          {data.email && (
            <a
              href={`mailto:${data.email}`}
              className="mt-6 inline-block font-mono text-[12.5px] text-[#9aa1a8] underline decoration-[#2a2f35] underline-offset-4 transition-colors hover:text-white hover:decoration-[#5eead4]"
            >
              {data.email}
            </a>
          )}
        </header>

        {data.summary && (
          <p className="mt-9 max-w-[60ch] text-[15px] leading-[1.9] text-[#c3c9cf]">
            {data.summary}
          </p>
        )}

        {Object.entries(groups).map(([kind, sections]) => (
          <section key={kind} className="mt-16">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[12px] text-[#5eead4]">##</span>
              <h2 className="text-[12.5px] tracking-[0.1em] text-[#8b9299]">
                {SECTION_LABELS[kind] ?? kind}
              </h2>
              <span className="h-px flex-1 bg-[#232830]" />
            </div>

            <ul className="mt-7 space-y-8">
              {sections.map((section, sectionIndex) => (
                <li
                  key={`${kind}-${sectionIndex}`}
                  className="break-inside-avoid"
                >
                  <div className="flex items-baseline justify-between gap-6">
                    <h3 className="text-[15.5px] leading-snug text-[#f2f4f6]">
                      {section.title || section.org}
                    </h3>
                    {section.period && (
                      <span className="shrink-0 font-mono text-[11.5px] tabular-nums text-[#6b7278]">
                        {section.period}
                      </span>
                    )}
                  </div>

                  {section.title && section.org && (
                    <p className="mt-1 font-mono text-[12px] text-[#8b9299]">
                      {`@ ${section.org}`}
                    </p>
                  )}

                  {section.lines.length > 0 && (
                    <div className="mt-2.5 space-y-1.5 text-[14px] leading-[1.85] text-[#c3c9cf]">
                      {section.lines.map((line, lineIndex) => (
                        <p key={lineIndex}>{line}</p>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}

        {data.skills.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[12px] text-[#5eead4]">##</span>
              <h2 className="text-[12.5px] tracking-[0.1em] text-[#8b9299]">
                技能
              </h2>
              <span className="h-px flex-1 bg-[#232830]" />
            </div>

            {isSkillList(data.skills) ? (
              <ul className="mt-6 flex flex-wrap gap-2">
                {data.skills.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-md border border-[#22272d] bg-[#11151a] px-2.5 py-1 font-mono text-[11.5px] text-[#a7aeb5]"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-[14px] leading-[1.85] text-[#c3c9cf]">
                {data.skills.join(" ")}
              </p>
            )}
          </section>
        )}

        {data.email && (
          <footer className="mt-20 flex flex-wrap items-baseline justify-between gap-3 border-t border-[#1c2025] pt-6 font-mono text-[11.5px] text-[#6b7278]">
            <span>{"// 想聊聊就发邮件"}</span>
            <a
              href={`mailto:${data.email}`}
              className="text-[#8b9299] underline decoration-[#2a2f35] underline-offset-4 hover:text-white"
            >
              {data.email}
            </a>
          </footer>
        )}
      </div>
    </main>
  );
}
