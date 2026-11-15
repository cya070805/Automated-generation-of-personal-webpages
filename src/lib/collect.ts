import { db } from "@/lib/db";
import { splitSkills } from "@/lib/site-data";
import { normalizeSkills } from "@/lib/skills";

/**
 * 问答里补的信息，答完就地落成内容块。
 *
 * 只在「这一屏本来是空的」时候问这些题（见 lib/ai/coverage.ts），
 * 所以这里的原则是：能结构化的就结构化，结构化不了就把原话留成一条细节，
 * 绝不编造用户没说的事实。
 */

interface BlockContent {
  [key: string]: unknown;
}

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;

/** 「没有实习经历 / 还没实习过」——这类回答是用来判断的，不是一段经历 */
const NEGATIVE_EXPERIENCE =
  /(没有|没(有)?过|暂无|还没|无)[^。！？\n]{0,6}(实习|工作|上班|职场)/;

/** 教育经历的回答大多长这样：学校 · 专业 · 学历 · 起止 */
function parseEducation(answer: string) {
  const parts = answer
    .split(/[·・|｜,，;；、/\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) return null;

  const period = parts.find((part) => /(19|20)\d{2}/.test(part));
  const school = parts.find((part) => /(大学|学院|学校|中学|高中|附中)/.test(part));
  const degree = parts.find((part) =>
    /(本科|硕士|博士|专科|大专|学士|研究生)/.test(part),
  );
  const major = parts.find(
    (part) =>
      part !== school &&
      part !== period &&
      part !== degree &&
      part.length <= 20 &&
      /(专业|工程|科学|技术|管理|设计|经济|金融|文学|法学|医学|英语|数学|物理|化学|艺术|新闻|传播|会计|人力)/.test(
        part,
      ),
  );

  if (!school && !major && !degree) return null;

  return {
    title: [major, degree].filter(Boolean).join(" · "),
    org: school ?? "",
    period: period ?? "",
  };
}

function appendLine(list: string[], line: string): string[] {
  const next = [...list];
  if (!next.some((item) => item === line)) next.push(line);
  return next;
}

/**
 * 项目回答一般是「项目名，我负责……，结果……」。
 * 第一小句多半就是项目名，拿它当标题，卡片上才有一行能看的名字。
 */
function guessProjectTitle(answer: string) {
  const head = answer.split(/[，,。；;：:\n]/)[0]?.trim() ?? "";
  if (!head || head.length > 18) return null;
  // 「我负责前端」这种不是名字
  if (/(我|负责|做了|写了|参与|完成)/.test(head)) return null;
  return head;
}

async function nextPosition(resumeId: string): Promise<number> {
  const max = await db.resumeBlock.aggregate({
    where: { resumeId, type: { not: "note" } },
    _max: { position: true },
  });
  return (max._max.position ?? 0) + 1;
}

/** 返回落到了哪一屏，方便以后排查；不认识的问题返回 null */
export async function applyAnswerToBlock(
  resumeId: string,
  field: string,
  answer: string,
): Promise<string | null> {
  const text = answer.trim();
  if (!text) return null;

  const section = field.split(".")[0] ?? "";

  if (section === "profile") {
    const block = await db.resumeBlock.findFirst({
      where: { resumeId, type: "profile" },
      orderBy: { position: "asc" },
    });
    const content = (block?.content ?? {}) as BlockContent;

    if (field.endsWith("email")) {
      const email = text.match(EMAIL)?.[0] ?? "";
      if (!email) return null;
      if (block) {
        await db.resumeBlock.update({
          where: { id: block.id },
          data: { content: { ...content, email } as never },
        });
      } else {
        await db.resumeBlock.create({
          data: {
            resumeId,
            type: "profile",
            position: 0,
            content: { name: "", headline: "", summary: "", email },
          },
        });
      }
      return "profile.email";
    }

    if (block && field.endsWith("city")) {
      const email = text.match(EMAIL)?.[0] ?? "";
      const city = text
        .replace(EMAIL, "")
        .split(/[，,。;；\n]/)[0]
        .replace(/[，,。;；\s]+$/g, "")
        .trim();
      const next: BlockContent = { ...content };
      if (email && !content.email) next.email = email;
      if (city && city.length <= 12 && !content.city) next.city = city;
      await db.resumeBlock.update({
        where: { id: block.id },
        data: { content: next as never },
      });
      return "profile.contact";
    }

    const current = String(content.summary ?? "").trim();
    const glued = current
      ? `${current}${/[。！？.!?]$/.test(current) ? "" : "。"}${text}`
      : text;

    if (block) {
      await db.resumeBlock.update({
        where: { id: block.id },
        data: { content: { ...content, summary: glued } as never },
      });
    } else {
      await db.resumeBlock.create({
        data: {
          resumeId,
          type: "profile",
          position: 0,
          content: { name: "", headline: "", summary: glued },
        },
      });
    }
    return "profile.summary";
  }

  if (section === "education") {
    const block = await db.resumeBlock.findFirst({
      where: { resumeId, type: "education" },
      orderBy: { position: "asc" },
    });
    const parsed = parseEducation(text);

    if (!block) {
      await db.resumeBlock.create({
        data: {
          resumeId,
          type: "education",
          position: await nextPosition(resumeId),
          content: parsed
            ? { ...parsed, details: [] }
            : { title: "", org: "", period: "", details: [text] },
        },
      });
      return "education";
    }

    const content = (block.content ?? {}) as BlockContent;
    const details = Array.isArray(content.details)
      ? (content.details as string[])
      : [];
    const next: BlockContent = {
      ...content,
      title: content.title || parsed?.title || "",
      org: content.org || parsed?.org || "",
      period: content.period || parsed?.period || "",
      details: parsed ? details : appendLine(details, text),
    };
    await db.resumeBlock.update({
      where: { id: block.id },
      data: { content: next as never },
    });
    return "education";
  }

  if (section === "skill") {
    const fresh = splitSkills(text).map((item) => item.slice(0, 20));
    if (fresh.length === 0) return null;

    const block = await db.resumeBlock.findFirst({
      where: { resumeId, type: "skill" },
      orderBy: { position: "asc" },
    });

    if (!block) {
      await db.resumeBlock.create({
        data: {
          resumeId,
          type: "skill",
          position: await nextPosition(resumeId),
          content: { items: normalizeSkills(fresh) },
        },
      });
      return "skill";
    }

    const content = (block.content ?? {}) as BlockContent;
    const items = Array.isArray(content.items) ? (content.items as string[]) : [];
    const merged = normalizeSkills([...items, ...fresh]);
    const next: BlockContent = { ...content, items: merged };
    // 编辑过的技能以 custom 为准，这里顺手把它一起改写，别让两处对不上
    if (typeof content.custom === "string") next.custom = merged.join(" / ");
    await db.resumeBlock.update({
      where: { id: block.id },
      data: { content: next as never },
    });
    return "skill";
  }

  if (section === "project") {
    const block = await db.resumeBlock.findFirst({
      where: { resumeId, type: "project" },
      orderBy: { position: "asc" },
    });

    // 已经有项目块：这些细节回答留给写文案当补充材料（draft 会读 note），
    // 不做成一行项目描述 —— 否则「我负责哪部分」这种话会混进事实现场。
    if (block) return null;

    const title = guessProjectTitle(text);
    const rest = title
      ? text
          .slice(text.indexOf(title) + title.length)
          .replace(/^[，,。；;：:\s]+/, "")
          .trim()
      : "";
    await db.resumeBlock.create({
      data: {
        resumeId,
        type: "project",
        position: await nextPosition(resumeId),
        content: { title: title ?? "", org: "", period: "", details: [rest || text] },
      },
    });
    return "project";
  }

  if (section === "experience") {
    const exists = await db.resumeBlock.findFirst({
      where: { resumeId, type: "experience" },
      select: { id: true },
    });
    // 已经有经历块：这条留作写文案时的补充材料，别往人家原文里塞
    if (exists) return null;

    // 「我没有实习经历」这种回答不是一段经历，别照着建块 ——
    // 建了首页就会多出一屏叫「经历」、里面却没有经历的空卡。
    if (NEGATIVE_EXPERIENCE.test(text)) return null;

    await db.resumeBlock.create({
      data: {
        resumeId,
        type: "experience",
        position: await nextPosition(resumeId),
        // 不留「经历」这种占位标题：现在在哪那一格要显示的是岗位，不是「经历」
        content: { title: "", org: "", period: "", details: [text] },
      },
    });
    return "experience";
  }

  // 其它细节问题：不往原文里塞，留给写文案时当补充材料
  return null;
}
