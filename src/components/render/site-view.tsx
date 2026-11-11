import type { CSSProperties, ReactNode } from "react";
import type { SiteData, SiteSection } from "@/lib/site-data";
import { SECTION_LABELS } from "@/lib/site-data";
import type { BaseTokens, Recipe, RecipeMap, SlotId } from "@/lib/templates/types";
import { baseCssVars } from "@/lib/templates/bases";
import { getRecipe, resolveRecipeMap } from "@/lib/templates/recipes";
import { resolveBaseTokens, resolveOrder, type SiteLayout, type SiteTweaks } from "@/lib/site-config";
import { Scanline } from "@/components/primitives/static";
import { Reveal } from "@/components/primitives/motion";
import {
  AboutColumn,
  AboutFacts,
  AboutLead,
  AboutPull,
  ContactBanner,
  ContactCard,
  ContactLine,
  ExperienceCards,
  ExperienceRows,
  ExperienceTimeline,
  HeroBento,
  HeroColumn,
  HeroMasthead,
  HeroPlate,
  HeroPrompt,
  HeroSplit,
  ProjectsCards,
  ProjectsFeature,
  ProjectsRows,
  ProjectsStrip,
  SkillsChips,
  SkillsInline,
  SkillsMeter,
} from "./slots";

/**
 * 渲染层。
 * 只吃 SiteData + 基底令牌 + 配方表 + 模块顺序，不读数据库、不认路由。
 * 编辑态、托管页、导出包共用这一个组件，所以「所见 = 所得」。
 *
 * 页面骨架：
 *   页眉 → 首屏 → 若干「左栏编号 + 右正文」的章节 → 收尾
 */

type RenderProps = {
  base: BaseTokens;
  data: SiteData;
  recipe: Recipe;
  sections?: SiteSection[];
  startIndex?: number;
};

type Renderer = (props: RenderProps) => ReactNode;

const LAYOUTS: Record<string, Renderer> = {
  statement: HeroColumn,
  prompt: HeroPrompt,
  masthead: HeroMasthead,
  plate: HeroPlate,
  split: HeroSplit,
  bento: HeroBento,
  column: AboutColumn,
  lead: AboutLead,
  facts: AboutFacts,
  pull: AboutPull,
  rows: ExperienceRows,
  timeline: ExperienceTimeline,
  "exp-cards": ExperienceCards,
  "proj-rows": ProjectsRows,
  "proj-cards": ProjectsCards,
  feature: ProjectsFeature,
  strip: ProjectsStrip,
  inline: SkillsInline,
  chips: SkillsChips,
  meter: SkillsMeter,
  line: ContactLine,
  card: ContactCard,
  banner: ContactBanner,
};

/** 同一个 layout 键在不同槽位可能是不同组件，这里按槽位兜一层 */
const SLOT_ALIASES: Partial<Record<SlotId, Record<string, string>>> = {
  projects: { rows: "proj-rows", cards: "proj-cards" },
  experience: { cards: "exp-cards" },
};

function pickRenderer(slot: SlotId, recipe: Recipe): Renderer | undefined {
  const alias = SLOT_ALIASES[slot]?.[recipe.layout];
  return LAYOUTS[alias ?? recipe.layout];
}

function renderSlot({
  slot,
  base,
  data,
  map,
  sections,
}: {
  slot: SlotId;
  base: BaseTokens;
  data: SiteData;
  map: RecipeMap;
  sections?: SiteSection[];
}): ReactNode {
  const recipe = getRecipe(map[slot]);
  if (!recipe) return null;
  const Render = pickRenderer(slot, recipe);
  if (!Render) return null;

  return <Render base={base} data={data} recipe={recipe} sections={sections} />;
}

/* ————————————————— 页眉 ————————————————— */

function PageHead({ base, data }: { base: BaseTokens; data: SiteData }) {
  const frame = base.rhythm.frame;
  const year = new Date().getFullYear();

  if (frame === "chrome") {
    return (
      <div className="site-head">
        <span className="flex items-center gap-3">
          <span className="site-window-dots" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <span className="site-head-name">~/portfolio</span>
        </span>
        <span className="hidden sm:inline">bash — 80×24</span>
      </div>
    );
  }

  if (frame === "rule") {
    return (
      <div className="site-head">
        <span className="site-head-name">
          {data.name || "个人主页"}
          <span style={{ opacity: 0.55 }}> — 个人主页</span>
        </span>
        <span>{[data.city, year].filter(Boolean).join(" · ")}</span>
      </div>
    );
  }

  if (frame === "grid") {
    return (
      <div className="site-head">
        <span className="site-head-name">STUDIO</span>
        <span className="flex items-center gap-2">
          <span className="site-dot" aria-hidden />
          开放交流
        </span>
      </div>
    );
  }

  return null;
}

/* ————————————————— 章节 ————————————————— */

type Planned = {
  key: string;
  label: string;
  content: ReactNode;
};

export function SiteView({
  base,
  data,
  recipeMap,
  layout,
  tweaks,
}: {
  base: BaseTokens;
  data: SiteData;
  recipeMap?: RecipeMap | null;
  layout?: SiteLayout | null;
  tweaks?: SiteTweaks | null;
}) {
  const tokens = resolveBaseTokens(base, tweaks);
  const map = resolveRecipeMap(tokens, recipeMap);
  const order = resolveOrder(layout);

  const experienceSections = data.sections.filter(
    (section) => section.kind === "experience" || section.kind === "education",
  );
  const projectSections = data.sections.filter((section) => section.kind === "project");

  // 经历按 教育 / 工作 拆成独立章节，各自一个编号，读起来像目录
  const byKind = new Map<string, SiteSection[]>();
  for (const section of experienceSections) {
    const bucket = byKind.get(section.kind) ?? [];
    bucket.push(section);
    byKind.set(section.kind, bucket);
  }

  let hero: ReactNode = null;
  const planned: Planned[] = [];
  let contact: ReactNode = null;

  for (const slot of order) {
    if (slot === "hero") {
      hero = renderSlot({ slot, base: tokens, data, map });
      continue;
    }

    if (slot === "about") {
      if (!data.summary) continue;
      planned.push({
        key: "about",
        label: "关于",
        content: renderSlot({ slot, base: tokens, data, map }),
      });
      continue;
    }

    if (slot === "experience") {
      // 工作写在前面；教育单独排到最后，不让它把项目挤下去
      const worked = byKind.get("experience") ?? [];
      if (worked.length > 0) {
        planned.push({
          key: "exp-experience",
          label: SECTION_LABELS.experience,
          content: renderSlot({ slot, base: tokens, data, map, sections: worked }),
        });
      }
      continue;
    }

    if (slot === "projects") {
      if (projectSections.length === 0) continue;
      planned.push({
        key: "projects",
        label: "项目",
        content: renderSlot({
          slot,
          base: tokens,
          data,
          map,
          sections: projectSections,
        }),
      });
      continue;
    }

    if (slot === "skills") {
      if (data.skills.length === 0) continue;
      planned.push({
        key: "skills",
        label: "技能",
        content: renderSlot({ slot, base: tokens, data, map }),
      });
      continue;
    }

    if (slot === "contact") {
      contact = renderSlot({ slot, base: tokens, data, map });
    }
  }

  // 教育放在技能之前；没有技能就放在最后
  const educated = byKind.get("education") ?? [];
  if (educated.length > 0 && order.includes("experience")) {
    const at = planned.findIndex((item) => item.key === "skills");
    planned.splice(at >= 0 ? at : planned.length, 0, {
      key: "education",
      label: SECTION_LABELS.education,
      content: renderSlot({
        slot: "experience",
        base: tokens,
        data,
        map,
        sections: educated,
      }),
    });
  }

  const gap = "var(--b-section-gap)";
  const hasRail = tokens.space.rail !== "0px";

  return (
    <main
      className="site relative min-h-dvh"
      style={baseCssVars(tokens) as CSSProperties}
      data-base={tokens.id}
      data-frame={tokens.rhythm.frame}
    >
      <div className="site-atmos" aria-hidden>
        {tokens.primitives.includes("scanline") && (
          <div
            className="absolute inset-x-0 top-0 h-[440px] opacity-70"
            style={{
              maskImage: "linear-gradient(to bottom, #000 0%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, #000 0%, transparent 100%)",
            }}
          >
            <Scanline />
          </div>
        )}
      </div>

      <div className="site-inner relative z-[1]">
        <PageHead base={tokens} data={data} />

        {hero}

        <div
          style={{
            display: "grid",
            gap,
            paddingTop: "clamp(16px, 2vw, 28px)",
            paddingBottom: "clamp(48px, 6vw, 80px)",
          }}
        >
          {planned.map((section, index) => (
            <Reveal key={section.key}>
              <section className={hasRail ? "site-section" : "site-section site-section--flat"}>
                {hasRail ? (
                  <div className="site-rail">
                    {tokens.rhythm.frame !== "none" && (
                      <span className="site-num">{String(index + 1).padStart(2, "0")}</span>
                    )}
                    <span className="site-rail-label">{section.label}</span>
                  </div>
                ) : (
                  <p
                    className="site-mono mb-5"
                    style={{
                      fontSize: "var(--b-size-meta)",
                      letterSpacing: "0.24em",
                      textTransform: "uppercase",
                      color: "var(--b-muted)",
                    }}
                  >
                    {section.label}
                  </p>
                )}
                <div>{section.content}</div>
              </section>
            </Reveal>
          ))}

          {contact && (
            <div style={{ paddingTop: "clamp(24px, 4vw, 56px)" }}>{contact}</div>
          )}

          <footer
            className="site-mono flex flex-wrap items-center justify-between gap-3 border-t pt-6"
            style={{
              borderColor: "var(--b-line)",
              fontSize: "var(--b-size-meta)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--b-muted)",
            }}
          >
            <span>{data.name || "个人主页"}</span>
            <span>{new Date().getFullYear()}</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
