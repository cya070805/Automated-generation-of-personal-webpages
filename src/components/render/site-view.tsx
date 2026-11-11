import type { CSSProperties, ReactNode } from "react";
import type { SiteData, SiteSection } from "@/lib/site-data";
import type { BaseTokens, Recipe, RecipeMap, SlotId } from "@/lib/templates/types";
import { baseCssVars } from "@/lib/templates/bases";
import { getRecipe, resolveRecipeMap } from "@/lib/templates/recipes";
import { Scanline } from "@/components/primitives/static";
import {
  AboutColumn,
  HeroBento,
  ProjectsStrip,
  AboutLead,
  ContactCard,
  ContactLineSlot,
  ExperienceRows,
  ExperienceTimeline,
  HeroPoster,
  HeroPrompt,
  HeroSplit,
  HeroStatement,
  ProjectsCards,
  SectionLabel,
  SkillsChips,
  SkillsInline,
  SkillsMeter,
} from "./slots";

/**
 * 渲染层。
 * 只吃 SiteData + 基底令牌 + 配方表，不读数据库、不认路由。
 * 编辑态、托管页、导出包共用这一个组件，所以「所见 = 所得」。
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
  statement: HeroStatement,
  prompt: HeroPrompt,
  poster: HeroPoster,
  split: HeroSplit,
  bento: HeroBento,
  strip: ProjectsStrip,
  column: AboutColumn,
  lead: AboutLead,
  rows: ExperienceRows,
  timeline: ExperienceTimeline,
  cards: ProjectsCards,
  inline: SkillsInline,
  chips: SkillsChips,
  meter: SkillsMeter,
  line: ContactLineSlot,
  card: ContactCard,
};

function Block({
  slot,
  base,
  data,
  map,
  sections,
  startIndex,
  first,
}: {
  slot: SlotId;
  base: BaseTokens;
  data: SiteData;
  map: RecipeMap;
  sections?: SiteSection[];
  startIndex?: number;
  first?: boolean;
}): ReactNode {
  const recipe = getRecipe(map[slot]);
  if (!recipe) return null;
  const Render = LAYOUTS[recipe.layout];
  if (!Render) return null;

  return (
    <div
      style={first ? undefined : { marginTop: "var(--b-section-gap)" }}
      className="break-inside-avoid"
    >
      <Render
        base={base}
        data={data}
        recipe={recipe}
        sections={sections}
        startIndex={startIndex}
      />
    </div>
  );
}

export function SiteView({
  base,
  data,
  recipeMap,
}: {
  base: BaseTokens;
  data: SiteData;
  recipeMap?: RecipeMap | null;
}) {
  const map = resolveRecipeMap(base, recipeMap);

  const experienceSections = data.sections.filter(
    (section) => section.kind === "experience" || section.kind === "education",
  );
  const projectSections = data.sections.filter(
    (section) => section.kind === "project",
  );

  const experienceGroups = new Set(
    experienceSections.map((section) => section.kind),
  ).size;
  const projectsStart = experienceGroups;
  const kinds = new Set(data.sections.map((section) => section.kind));
  const skillsIndex = kinds.size + 1;

  const skillsRecipe = getRecipe(map.skills);
  const SkillsRender = skillsRecipe ? LAYOUTS[skillsRecipe.layout] : null;

  return (
    <main
      className="site relative min-h-dvh"
      style={baseCssVars(base) as CSSProperties}
      data-base={base.id}
    >
      {base.primitives.includes("scanline") && (
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
        <Block slot="hero" base={base} data={data} map={map} first />

        {data.summary && (
          <Block slot="about" base={base} data={data} map={map} />
        )}

        {experienceSections.length > 0 && (
          <Block
            slot="experience"
            base={base}
            data={data}
            map={map}
            sections={experienceSections}
            startIndex={0}
          />
        )}

        {projectSections.length > 0 && (
          <Block
            slot="projects"
            base={base}
            data={data}
            map={map}
            sections={projectSections}
            startIndex={projectsStart}
          />
        )}

        {data.skills.length > 0 && skillsRecipe && SkillsRender && (
          <div
            className="break-inside-avoid"
            style={{ marginTop: "var(--b-section-gap)" }}
          >
            <SectionLabel base={base} label="技能" index={skillsIndex} />
            <div style={{ marginTop: "calc(var(--b-block-gap) - 4px)" }}>
              <SkillsRender base={base} data={data} recipe={skillsRecipe} />
            </div>
          </div>
        )}

        <Block slot="contact" base={base} data={data} map={map} />
      </div>
    </main>
  );
}
