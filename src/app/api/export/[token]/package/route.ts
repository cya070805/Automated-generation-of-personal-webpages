import { NextResponse } from "next/server";
import { createZip } from "@/lib/export/zip";
import { db } from "@/lib/db";
import { isValidEditToken } from "@/lib/tokens";
import { buildSiteData } from "@/lib/site-data";
import { renderStandaloneHtml } from "@/lib/export/browser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DOCKERFILE = `FROM nginx:alpine
COPY site/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
`;

const NGINX = `server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
`;

const SERVER_JS = `// 不用 Docker 时的最小静态服务器：node server.js
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "site");
const port = process.env.PORT || 8080;
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript" };

http
  .createServer((req, res) => {
    const url = (req.url || "/").split("?")[0];
    const file = path.join(root, url === "/" ? "index.html" : url);
    if (!file.startsWith(root)) {
      res.writeHead(403).end("forbidden");
      return;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404).end("not found");
        return;
      }
      res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
      res.end(data);
    });
  })
  .listen(port, () => console.log("http://localhost:" + port));
`;

const COMPOSE = `services:
  site:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
`;

function readme(name: string, slug: string) {
  return `# ${name} · 个人主页

这是一个自包含的静态站：\`site/index.html\` 里已经内联了全部样式，没有任何外部依赖，
双击就能打开。

## 三种部署方式

### 1. 直接丢到静态托管
把 \`site/\` 里的文件上传到任意静态托管（Vercel、Netlify、对象存储、学校服务器都行）。

### 2. 用 Node 起一个服务
\`\`\`bash
node server.js          # 默认 http://localhost:8080
PORT=3000 node server.js
\`\`\`

### 3. 用 Docker
\`\`\`bash
docker compose up -d    # http://localhost:8080
\`\`\`

## 换成自己的域名
Nginx 反代的写法见 \`nginx.conf\`；证书（Let's Encrypt）需要你自己申请，
平台不代管域名与证书。

## 内容更新
改完内容后回到平台重新导出，覆盖 \`site/\` 即可。

- 项目编号：${slug}
- 导出时间：${new Date().toLocaleString("zh-CN")}
`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!isValidEditToken(token)) {
    return NextResponse.json({ error: { code: "BAD_TOKEN" } }, { status: 400 });
  }

  const project = await db.project.findUnique({
    where: { editToken: token },
    include: {
      resumes: {
        orderBy: { createdAt: "asc" },
        include: { blocks: { orderBy: { position: "asc" } }, pages: true },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  const data = buildSiteData(project.resumes[0]?.blocks ?? []);
  const origin = new URL(req.url).origin;

  try {
    const html = await renderStandaloneHtml(origin, token);
    const name = data.name || "个人主页";

    const zip = createZip([
      { name: "site/index.html", data: Buffer.from(html, "utf8") },
      { name: "README.md", data: Buffer.from(readme(name, token.slice(0, 8)), "utf8") },
      { name: "Dockerfile", data: Buffer.from(DOCKERFILE, "utf8") },
      { name: "nginx.conf", data: Buffer.from(NGINX, "utf8") },
      { name: "docker-compose.yml", data: Buffer.from(COMPOSE, "utf8") },
      { name: "server.js", data: Buffer.from(SERVER_JS, "utf8") },
    ]);

    if (project.resumes[0]?.pages[0]) {
      await db.export.create({
        data: {
          pageId: project.resumes[0].pages[0].id,
          mode: "static",
          version: "1",
          path: `${token.slice(0, 8)}.zip`,
        },
      });
    }

    return new NextResponse(new Uint8Array(zip), {
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`${name}-主页.zip`)}`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "EXPORT_FAILED",
          message: error instanceof Error ? error.message : "打包失败",
        },
      },
      { status: 500 },
    );
  }
}
