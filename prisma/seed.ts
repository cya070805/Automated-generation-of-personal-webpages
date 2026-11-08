/**
 * 开发用种子：建一个示例项目，方便验证数据链路。
 * 只在一期需要；后面几期会换成更完整的内容样例。
 */
import { PrismaClient } from "@prisma/client";
import { createEditToken } from "../src/lib/tokens";

const db = new PrismaClient();

async function main() {
  const existing = await db.project.findFirst({
    where: { title: "示例主页" },
  });

  if (existing) {
    console.log(`已存在示例项目，编辑链接：/edit/${existing.editToken}`);
    return;
  }

  const project = await db.project.create({
    data: {
      title: "示例主页",
      editToken: createEditToken(),
      resumes: {
        create: {
          targetRole: "前端开发实习生",
          status: "draft",
          pages: {
            create: {
              theme: { preset: "paper", accent: "teal" },
              layout: { sections: [] },
            },
          },
        },
      },
    },
  });

  console.log(`已创建示例项目 ${project.id}`);
  console.log(`编辑链接：/edit/${project.editToken}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
