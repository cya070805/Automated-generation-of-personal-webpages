# 履道 · AI 个人主页与作品集生成

面向应届生与实习生的个人主页生成器。不用会建站、不用会排版，也不用先想清楚经历怎么写——
一次对话把经历问清楚，生成一个可编辑、可发布、也能打包带走的主页。

- 产品形态：网页应用，浏览器打开即用
- 模型能力：用户自带 API Key（DeepSeek / 通义千问 / 智谱 / Kimi / OpenAI，或任何 OpenAI 兼容服务）
- 产物：平台托管的分享链接，或可自托管的部署包
- 一期不含账号与登录；服务器、域名、证书一律由用户自理

产品说明书见 [`docs/产品能力地图与技术方案.pdf`](docs/产品能力地图与技术方案.pdf)。

---

## 当前进度

**已可用：模型接入 + 内容闭环。**

| 能力 | 状态 |
| --- | --- |
| Next.js 15（App Router）+ TypeScript + Tailwind 应用骨架 | ✅ |
| 十张表数据模型（Prisma + SQLite）+ 初始迁移 | ✅ |
| 模型接入：Key 设置页、五家预设、自定义地址、测试连接 | ✅ |
| 同源转发 `/api/llm`（流式 SSE，Key 不入库、不写日志） | ✅ |
| 匿名项目与编辑链接（`/api/projects`） | ✅ |
| 旧简历上传（PDF / DOCX / TXT）与结构化抽取 | ✅ |
| 缺口分析与一次一问的追问 | ✅ |
| 两版文案 + 逐句溯源 | ✅ |
| 主页模板、可视化编辑、PDF、发布与导出 | 未开始 |

产品文档见 [`docs/产品能力地图与技术方案.pdf`](docs/产品能力地图与技术方案.pdf)，一期范围见 [`docs/一期说明.md`](docs/一期说明.md)。

## 快速开始

```bash
npm install

cp .env.example .env        # 默认 SQLite：file:./dev.db
npm run db:push             # 或 npm run db:migrate
npm run db:seed             # 可选：建一个示例项目

npm run dev
```

打开 <http://localhost:3000>：

- `/` — 首页
- `/start` — 三步做完：写经历 → 回答问题 → 确认文案
- `/edit/{edit_token}` — 用编辑链接回来查看内容
- `/settings` — 模型接入（填 Key、测试连接、切模板模式）

API Key **不需要写进任何文件**：在设置页填入即可，只存在浏览器 localStorage 里。
部署后也可以用环境变量 `LLM_API_KEY` 给整台机器预置一个 Key（内网 / 团队共用场景）。

## 目录结构

```
prisma/
  schema.prisma            十张表；没有 users，没有 keys
  migrations/              迁移记录
  seed.ts                  开发用种子
src/
  app/
    layout.tsx             根布局（只有 html/body）
    (app)/                 产品界面，带导航与页脚
      page.tsx             首页
      start/               三步向导（写经历 → 追问 → 确认文案）
      edit/[token]/        看内容、换基底
      settings/            模型接入设置页
    preview/[token]/       生成的主页，整页渲染，不套产品导航
  components/
    render/                渲染层：槽位组件 + SiteView（只吃 SiteData 与令牌）
    primitives/            十二个原语（渐隐背景、颗粒、玻璃、滚动驱动……）
    api/
      llm/                 同源转发 / 测试连接 / 是否预置 Key
      resume/analyze/      抽取结构化内容 + 缺口分析
      resume/ask/          取下一个问题
      resume/answer/       记录回答
      resume/draft/        两版文案 + 溯源
      resume/upload/       PDF / DOCX / TXT → 文本
      blocks/[id]/         选版本 / 改内容
      pages/[id]/          换模板（只写 pages.theme）
      projects/            匿名项目（创建 / 按编辑 token 读取）
      health/              数据库自检
  components/              UI 与页面组件
  lib/
    llm/                   预设、转发、错误映射、浏览器端客户端
    ai/                    提示词、JSON 校验、模板模式兜底
    templates/             六套基底（令牌）+ 配方库 + 默认组合
    site-data.ts           内容块 → 模板数据
    db.ts                  Prisma 单例
    tokens.ts              编辑 token / 分享 slug
  store/                   Zustand（设置持久化到 localStorage）
docs/                      产品文档与生成脚本
```

## API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/llm/chat` | OpenAI 兼容转发，`stream: true` 时回 SSE。Key 从 `x-llm-key` 请求头读取 |
| POST | `/api/llm/test` | 发一条最小请求验证 Key / 地址 / 模型，返回往返耗时 |
| GET | `/api/llm/config` | 服务端是否通过环境变量预置了 Key（只回布尔值） |
| POST | `/api/resume/upload` | 上传 PDF / DOCX / TXT，返回纯文本 |
| POST | `/api/resume/analyze` | 抽取结构化内容块并生成缺口问题 |
| POST | `/api/resume/ask` | 取下一个要问的问题 |
| POST | `/api/resume/answer` | 记录回答 |
| POST | `/api/resume/draft` | 生成两版文案与溯源 |
| PATCH | `/api/blocks/{id}` | 选版本 / 改内容 |
| PATCH | `/api/pages/{id}` | 换基底（`{ baseId }`）或换某槽位配方（`{ recipeMap }`），只动 `pages` |
| POST | `/api/projects` | 创建匿名项目，返回 `editToken` 与编辑链接 |
| GET | `/api/projects/{token}` | 用编辑 token 读取项目（内容块 + 页面） |
| GET | `/api/health` | 数据库连通性与十张表计数 |

转发层错误映射：`401/403 → AUTH`、`429 → 退避重试一次`、`60s 超时 → TIMEOUT`、
连续失败会建议切模板模式。

AI 管线：`解析（文件 → 文本）→ 抽取（JSON Schema 约束，失败重试一次）→ 缺口分析 → 一次一问 →
两版文案（带 sourceQuote）`。没有 Key 或模型失败时自动退回模板模式，流程照样能走完。

## 呈现层

内容与呈现分离。页面只记两件事：`baseId`（哪套基底）和 `recipeMap`（每个槽位哪条配方），
内容块一个字段都不动。

```
基底（6）  只给设计令牌：字体、色板、圆角、疏密、字号阶梯
原语（12） 只给质感：颗粒、玻璃、扫描线、打字机、倾斜……
配方（15） 只给讲法：「经历」用编号条目还是时间线
```

渲染层 `components/render/site-view.tsx` 只消费 `SiteData` 与令牌，不读数据库；
编辑态与预览页共用同一个组件，所以「改完就能看见」。
细节见 [基底与原语.md](docs/基底与原语.md)。

## 安全边界

- API Key 只存浏览器本地（`localStorage` 键名 `lvdao.settings.v1`），不上传、不入库。
- 所有模型请求经同源 `/api/llm` 转发，Key 只在请求头里过一遍；转发层无状态，不记录请求体。
- 自定义 Base URL 只允许 https，或本机 http；内网段默认拦截（自托管可设 `ALLOW_PRIVATE_LLM=1`）。
- 不做：Key 代充、额度转售、服务端托管用户 Key。

## 技术选型

Next.js 15（App Router）+ TypeScript · Tailwind CSS（CSS 变量做设计令牌）· Prisma + SQLite（可换 Postgres）·
Zustand · OpenAI 兼容协议 + 同源转发 · unpdf / mammoth 解析旧简历 · Playwright 出 PDF（未开始）·
Docker Compose 部署（未开始）。

## 路线

1. ~~骨架 + 数据模型 + 模型接入~~
2. ~~内容闭环：解析 → 追问 → 文案确认~~
3. 内容闭环：解析 → 追问 → 两版文案（提前做完）
4. 基底与原语：~~六套基底 + 十二个原语 + 渲染层~~
5. 配方库首批 20 个 + 编辑器双模式 + 两种导出（平台发布 / 部署包）

## 不做

账号与登录（用编辑链接 + 本地草稿替代）· Key 代充与额度转售 · 服务器售卖与域名代管 · 支付与订阅。
