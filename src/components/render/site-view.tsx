import type { CSSProperties, ReactNode } from "react";
import type { SiteData, SiteSection } from "@/lib/site-data";
import { SECTION_LABELS } from "@/lib/site-data";
import type { BaseTokens, Recipe, RecipeMap, SlotId } from "@/lib/templates/types";
import { baseCssVars } from "@/lib/templates/bases";
import { getRecipe, resolveRecipeMap } from "@/lib/templates/recipes";
import {
  motionAmountOf,
  resolveBaseTokens,
  resolveOrder,
  toneOf,
  type SiteLayout,
  type SiteTweaks,
} from "@/lib/site-config";
import { Reveal } from "@/components/primitives/motion";
import { ScrollBand } from "./band";
import { SkillsFolder } from "./skills-folder";
import { SkillsBubble } from "./skills-bubble";
import { ContactBubble } from "./contact-bubble";
import { ReelPage, type ReelPanel } from "./reel-page";
import {
  AboutColumn,
  AboutLead,
  AboutPoints,
  AboutPull,
  ContactBanner,
  ContactCard,
  ContactLine,
  ExperienceCards,
  ExperienceRows,
  ExperienceTimeline,
  BoxWall,
  SkillsRing,
  EntriesShowcase,
  HeroBento,
  HeroFrame,
  HeroOrbit,
  HeroPoster,
  HeroColumn,
  HeroMasthead,
  HeroPlate,
  HeroPrompt,
  HeroSplit,
  ProjectsFeature,
  ProjectsRows,
  ProjectsStrip,
  SkillsChips,
  SkillsInline,
  SkillsMeter,
  AboutDropcap,
  AboutNumbered,
  ExperienceTable,
  ExperienceSteps,
  ProjectsIndex,
  ProjectsStack,
  SkillsMatrix,
  SkillsRows,
  ContactTicket,
  HeroCenter,
  AboutTwocol,
  ExperienceCompact,
  ProjectsMinimal,
  SkillsGrid3,
  ContactBigmail,
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
  poster: HeroPoster,
  orbit: HeroOrbit,
  frame: HeroFrame,
  column: AboutColumn,
  lead: AboutLead,
  points: AboutPoints,
  pull: AboutPull,
  rows: ExperienceRows,
  timeline: ExperienceTimeline,
  "exp-cards": ExperienceCards,
  "proj-rows": ProjectsRows,
  feature: ProjectsFeature,
  strip: ProjectsStrip,
  inline: SkillsInline,
  chips: SkillsChips,
  meter: SkillsMeter,
  line: ContactLine,
  card: ContactCard,
  banner: ContactBanner,
  showcase: EntriesShowcase,
  boxes: BoxWall,
  stagger: BoxWall,
  band: ({ data, sections }) => <ScrollBand items={sections ?? data.sections} />,
  ring: SkillsRing,
  dropcap: AboutDropcap,
  numbered: AboutNumbered,
  etable: ExperienceTable,
  steps: ExperienceSteps,
  pindex: ProjectsIndex,
  pstack: ProjectsStack,
  smatrix: SkillsMatrix,
  srows: SkillsRows,
  ticket: ContactTicket,
  center: HeroCenter,
  twocol: AboutTwocol,
  compact: ExperienceCompact,
  pmin: ProjectsMinimal,
  grid3: SkillsGrid3,
  bigmail: ContactBigmail,
  folder: ({ data }) => <SkillsFolder skills={data.skills} />,
  tagbubble: ({ data }) => <SkillsBubble skills={data.skills} />,
  bubble: ({ data }) => {
    const job = data.sections.find((section) => section.kind === "experience");
    const edu = data.sections.find((section) => section.kind === "education");
    const now = job
      ? [job.title, job.org].filter(Boolean).join(" · ")
      : edu
        ? [edu.org, "在读"].filter(Boolean).join(" · ")
        : "";
    return (
      <ContactBubble
        name={data.name}
        email={data.email}
        city={data.city}
        now={now}
      />
    );
  },
};

/** 同一个 layout 键在不同槽位可能是不同组件，这里按槽位兜一层 */
const SLOT_ALIASES: Partial<Record<SlotId, Record<string, string>>> = {
  projects: { rows: "proj-rows" },
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
  const motionAmount = motionAmountOf(tweaks);
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

    if (slot === "education") {
      const educated = byKind.get("education") ?? [];
      if (educated.length === 0) continue;
      planned.push({
        key: "education",
        label: SECTION_LABELS.education,
        content: renderSlot({ slot, base: tokens, data, map, sections: educated }),
      });
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


  const gap = "var(--b-section-gap)";
  const { dna } = tokens;
  const shell = tokens.shell ?? "stack";

  // 翻页壳：封面钉在上半部分，中间各章节做成下半部分的一叠卡片。
  // 内容照样用配方渲染，只是换了「封面不动、卡片翻页」的外壳。
  if (shell === "wheel") {
    const panels: ReelPanel[] = [];
    for (const section of planned) {
      panels.push({ key: section.key, label: section.label, content: section.content });
    }
    if (contact) panels.push({ key: "contact", label: "联系", content: contact });

    if (panels.length === 0) return null;

    return (
      <SiteShell tokens={tokens} shell={shell}>
        <div className="site-inner relative z-[1]">
          <ReelPage
            cover={hero}
            panels={panels}
            name={data.name}
            year={new Date().getFullYear()}
            textColor={tokens.color.ink2}
            activeColor={tokens.color.ink}
            motion={tokens.motion}
            footerNote={data.city}
          />
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell tokens={tokens} shell={shell}>
      <div className="site-inner relative z-[1]">
        {hero}

        <div className="site-flow" style={{ gap }}>
          {planned.map((section, index) => (
            <Reveal key={section.key} motion={motionAmount}>
              <section className="site-section">
                <div className="site-rail">
                  {dna.num !== "none" && (
                    <span className="site-num">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  )}
                  <span className="site-rail-label">{section.label}</span>
                </div>
                <div className="site-body">{section.content}</div>
              </section>
            </Reveal>
          ))}

          {contact && <div className="site-contact">{contact}</div>}

          <footer className="site-foot">
            <span>{data.name || "个人主页"}</span>
            <span aria-hidden className="site-foot-dot" />
            <span>{new Date().getFullYear()}</span>
          </footer>
        </div>
      </div>
    </SiteShell>
  );
}

/**
 * 页壳：底色、底纹、装饰件、data-* 开关。
 * 长页和翻页壳共用同一层，好让换骨架时令牌一个都不变。
 */
function SiteShell({
  tokens,
  shell,
  children,
}: {
  tokens: BaseTokens;
  shell: "stack" | "wheel";
  children: ReactNode;
}) {
  const { dna } = tokens;

  return (
    <main
      className="site relative min-h-dvh"
      style={baseCssVars(tokens) as CSSProperties}
      data-base={tokens.id}
      data-shell={shell}
      data-tone={toneOf(tokens.color.bg)}
      data-frame={tokens.rhythm.frame}
      data-hero={dna.hero}
      data-label={dna.label}
      data-texture={dna.texture}
      data-ornament={dna.ornament}
      data-card={dna.card}
      data-num={dna.num}
      data-motion={tokens.motion}
    >
      <div className="site-atmos" aria-hidden>
        {tokens.primitives.includes("scanline") && <span className="site-scan" />}
      </div>

      {dna.ornament === "crop" && (
        <div className="site-crop" aria-hidden>
          <i />
          <i />
          <i />
          <i />
        </div>
      )}

      {children}
    </main>
  );
}
