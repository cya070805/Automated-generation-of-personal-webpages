import type { Extracted, Gap } from "./schemas";
import { missingSections } from "./coverage";

/** 模板模式：不调模型，按段落切块，够用就行 */
export function templateExtract(
  text: string,
  meta: { name?: string; role?: string } = {},
): Extracted {
  const paragraphs = text
    .split(/\n{2,}|\r\n\r\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const details = paragraphs.filter((p) => p.length > 6).slice(0, 12);

  const blocks =
    details.length > 0
      ? [
          {
            type: "experience" as const,
            title: meta.role || "经历",
            org: "",
            period: "",
            details,
          },
        ]
      : [];

  return {
    name: meta.name ?? "",
    headline: meta.role ?? "",
    email: "",
    phone: "",
    city: "",
    summary: "",
    blocks,
    skills: [],
  };
}

/**
 * 模板模式的问题单：也是「先补空着的屏，再问细节」。
 * 没有模型时更不能少问 —— 少了这几屏，首页就是断的。
 */
export function templateGaps(extracted?: Extracted): Gap[] {
  const missing = extracted ? missingSections(extracted) : [];

  const gaps: Gap[] = [];

  if (missing.includes("summary")) {
    gaps.push({
      field: "profile.summary",
      question: "用一两句话说说你自己？别人打开首页第一眼看到的就是这段。",
      why: "首页的「关于」那一屏就靠这句话，没有它整屏是空的。",
      hint: "比如：计算机专业应届生，做过两年前端实习，喜欢把性能问题抠到底。",
    });
  }

  if (missing.includes("education")) {
    gaps.push({
      field: "education.school",
      question: "你的教育经历：学校、专业、学历、起止时间？",
      why: "首页有一屏「教育」，校名和专业缺了这一屏就是空的。",
      hint: "比如：浙江工业大学 · 计算机科学与技术 · 本科 · 2022.09—2026.06",
    });
  }

  if (missing.includes("project")) {
    gaps.push({
      field: "project.role",
      question: "除了上面写的，还有没有自己做的项目或者课程大作业？你负责哪部分？",
      why: "「项目」那一屏最容易被面试官点开看，没有就没得看。",
      hint: "比如：校园二手书小程序，我负责前端和云函数，一学期撮合了 300 多单。",
    });
  }

  if (missing.includes("skill")) {
    gaps.push({
      field: "skill.items",
      question: "你会哪些工具、语言、方法和证书？挑拿得出手的写几个。",
      why: "上面没勾技能，「技能」那一屏就会空着。",
      hint: "比如：React、TypeScript、Figma、英语 CET-6",
    });
  }

  // 有故事才问细节；一件都没有就先问一件出来，否则问数字是空问
  const hasStory = (extracted?.blocks ?? []).some(
    (block) => block.type === "experience" || block.type === "project",
  );

  if (!hasStory) {
    gaps.push({
      field: "experience.story",
      question: "讲一件你做过的、最拿得出手的事：做的什么，你负责哪部分？",
      why: "首页至少要有一段真实经历，光有技能撑不起来。",
      hint: "比如：给学院做的选课助手，我负责前端和接口，两个学期 400 多人用。",
    });
  } else {
    gaps.push(
      {
        field: "experience.metric",
        question: "这段经历里，有没有能说出来的数字？比如人数、时长、涨了多少。",
        why: "数字最能撑住一句话，面试官先看这个。",
        hint: "比如：覆盖 6 个学院、被 3 个业务线接入、从 2 天缩到半天。",
      },
      {
        field: "experience.role",
        question: "这件事里，哪部分是你自己动手做的？",
        why: "面试官关心你负责哪一块，不是你旁边谁做的。",
        hint: "比如：虚拟滚动和请求合并是我写的，设计稿是别人给的。",
      },
      {
        field: "experience.result",
        question: "最后做成了什么？有人用吗，或者被怎么评价？",
        why: "结果比过程更有说服力。",
        hint: "比如：上线后组里都在用，线上事故从每月 2 起降到 0。",
      },
    );
  }

  // 城市 / 邮箱放最后：内容比联系方式重要，装不下就先砍它
  if (missing.includes("contact")) {
    gaps.push({
      field: "profile.city",
      question: "现在在哪座城市？想找哪个城市的实习或工作？",
      why: "首屏和页脚都要写城市，也方便按地点筛你。",
      hint: "比如：杭州，想留在长三角",
    });
  }

  if (missing.includes("email")) {
    gaps.push({
      field: "profile.email",
      question: "留个邮箱放在主页上？不想公开就跳过。",
      why: "「联系」那一屏没邮箱，别人想找你也只能干看着。",
      hint: "比如：yourname@example.com",
    });
  }

  return gaps.slice(0, 10);
}

/** 模板模式的两版：一版压缩，一版保留原句 */
export function templateDraft(
  blocks: { id: string; details: string[] }[],
): { id: string; versions: string[]; sourceQuote: string }[] {
  return blocks.map((block) => {
    const joined = block.details.join("；");
    const short = joined.length > 40 ? `${joined.slice(0, 40)}…` : joined;
    return {
      id: block.id,
      versions: [short || "（还没有内容）", joined || "（还没有内容）"],
      sourceQuote: block.details[0] ?? "",
    };
  });
}
