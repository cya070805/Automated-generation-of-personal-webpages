import type { CSSProperties, ReactNode } from "react";
import type { SiteData, SiteSection } from "@/lib/site-data";
import type { BaseTokens, Recipe, RecipeMap, SlotId } from "@/lib/templates/types";
import { baseCssVars } from "@/lib/templates/bases";
import { getRecipe, resolveRecipeMap } from "@/lib/templates/recipes";
import { resolveBaseTokens, resolveOrder, type SiteLayout, type SiteTweaks } from "@/lib/site-config";
import { Scanline } from "@/components/primitives/static";
import {
  AboutColumn,
  AboutLead,
  ContactCard,
  ContactLineSlot,
  ExperienceRows,
  ExperienceTimeline,
  HeroBento,
  HeroPoster,
  HeroPrompt,
  HeroSplit,
  HeroStatement,
  ProjectsCards,
  ProjectsStrip,
  SectionLabel,
  SkillsChips,
  SkillsInline,
  SkillsMeter,
} from "./slots";
import {
  AboutFacts,
  AboutPull,
  ContactBanner,
  ExperienceCards,
  ProjectsFeature,
} from "./slots-extra";

/**
 * 渲染层。
 * 只吃 SiteData + 基底令牌 + 配方表 + 模块顺序，不读数据库、不认路由。
 * 编辑态、托管页、导出包共用这一个组件，所以「所见 = 所得」。
 */

type RenderProps = {
  base: BaseTokens;
  data: SiteData;
  recipe: Recipe;
  sections?: SiteSection[];
  /** 这个块之前已经用掉几个编号，整页共用一套序号 */
  startIndex?: number;
};

type Renderer = (props: RenderProps) => ReactNode;

const LAYOUTS: Record<string, Renderer> = {
  statement: HeroStatement,
  prompt: HeroPrompt,
  poster: HeroPoster,
  split: HeroSplit,
  bento: HeroBento,
  column: AboutColumn,
  lead: AboutLead,
  facts: AboutFacts,
  pull: AboutPull,
  rows: ExperienceRows,
  timeline: ExperienceTimeline,
  "exp-cards": ExperienceCards,
  "proj-cards": ProjectsCards,
  feature: ProjectsFeature,
  strip: ProjectsStrip,
  inline: SkillsInline,
  chips: SkillsChips,
  meter: SkillsMeter,
  line: ContactLineSlot,
  card: ContactCard,
  banner: ContactBanner,
};

function renderSlot({
  slot,
  base,
  data,
  map,
  sections,
  startIndex,
}: {
  slot: SlotId;
  base: BaseTokens;
  data: SiteData;
  map: RecipeMap;
  sections?: SiteSection[];
  startIndex?: number;
}): ReactNode {
  const recipe = getRecipe(map[slot]);
  if (!recipe) return null;
  const Render = LAYOUTS[recipe.layout];
  if (!Render) return null;

  return (
    <Render
      base={base}
      data={data}
      recipe={recipe}
      sections={sections}
      startIndex={startIndex}
    />
  );
}

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
  const projectSections = data.sections.filter(
    (section) => section.kind === "project",
  );

  let groupIndex = 0;
  const nodes: ReactNode[] = [];

  for (const slot of order) {
    if (slot === "about" && !data.summary) continue;
    if (slot === "experience" && experienceSections.length === 0) continue;
    if (slot === "projects" && projectSections.length === 0) continue;
    if (slot === "skills" && data.skills.length === 0) continue;

    const first = nodes.length === 0;

    if (slot === "experience") {
      const start = groupIndex;
      groupIndex += new Set(experienceSections.map((item) => item.kind)).size;
      nodes.push(
        <div
          key={slot}
          className="break-inside-avoid"
          style={first ? undefined : { marginTop: "var(--b-section-gap)" }}
        >
          {renderSlot({
            slot,
            base: tokens,
            data,
            map,
            sections: experienceSections,
            startIndex: start,
          })}
        </div>,
      );
      continue;
    }

    if (slot === "projects") {
      const start = groupIndex;
      groupIndex += 1;
      nodes.push(
        <div
          key={slot}
          className="break-inside-avoid"
          style={first ? undefined : { marginTop: "var(--b-section-gap)" }}
        >
          {renderSlot({
            slot,
            base: tokens,
            data,
            map,
            sections: projectSections,
            startIndex: start,
          })}
        </div>,
      );
      continue;
    }

    if (slot === "skills") {
      const recipe = getRecipe(map.skills);
      const label = groupIndex + 1;
      groupIndex += 1;
      if (!recipe) continue;
      nodes.push(
        <div
          key={slot}
          className="break-inside-avoid"
          style={first ? undefined : { marginTop: "var(--b-section-gap)" }}
        >
          <SectionLabel base={tokens} label="技能" index={label} />
          <div style={{ marginTop: "calc(var(--b-block-gap) - 4px)" }}>
            {renderSlot({ slot, base: tokens, data, map })}
          </div>
        </div>,
      );
      continue;
    }

    nodes.push(
      <div
        key={slot}
        className="break-inside-avoid"
        style={first ? undefined : { marginTop: "var(--b-section-gap)" }}
      >
        {renderSlot({ slot, base: tokens, data, map })}
      </div>,
    );
  }

  return (
    <main
      className="site relative min-h-dvh"
      style={baseCssVars(tokens) as CSSProperties}
      data-base={tokens.id}
    >
      {tokens.primitives.includes("scanline") && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[440px] opacity-70"
          style={{
            maskImage: "linear-gradient(to bottom, #000 0%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, #000 0%, transparent 100%)",
          }}
        >
          <Scanline />
        </div>
      )}

      <div
        className="site-inner relative z-10"
        style={{
          paddingTop: "clamp(64px, 8vw, 104px)",
          paddingBottom: "clamp(72px, 9vw, 120px)",
        }}
      >
        {nodes}
      </div>
    </main>
  );
}
