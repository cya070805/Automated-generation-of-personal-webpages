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
| 主页模板：十套基底（paper / terminal / editorial / gallery / studio / bento / mono / cinema / frame / reel）+ 配方库 | ✅ |
| 可视化编辑：基底 / 模块 / 微调 / 发布四栏，改完即时预览 | ✅ |
| 分享链接、可选访问密码、单文件 HTML 快照、PDF、自托管部署包 | ✅ |

产品文档见 [`docs/产品能力地图与技术方案.pdf`](docs/产品能力地图与技术方案.pdf)，一期范围见 [`docs/一期说明.md`](docs/一期说明.md)。

## 环境依赖与一键安装

| 依赖 | 版本 | 说明 |
| --- | --- | --- |
| Node.js | ≥ 20（推荐 22 LTS） | Next 15 / Prisma 6 的下限是 18.18；本机用 24 也跑得通 |
| npm | ≥ 10（随 Node 安装） | 用 `npm ci` 按 lock 文件精确安装 |
| SQLite | 不用装 | Prisma 自带，数据就是一个文件 `prisma/dev.db` |
| Chrome / Edge | 可选 | 只有「导出 PDF / 整站包」用到，直接复用本机浏览器 |
| 资源 | 2G 内存 / 1G 磁盘 | 构建峰值约 1.5G，依赖约 400MB |

一键装好：检查环境 → 装依赖 → 生成 `.env` → 建表 → 可选示例数据。

```bash
bash scripts/setup.sh          # Linux / macOS / Windows 的 Git Bash
```

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1   # Windows PowerShell
```

两个脚本逻辑一致，都支持这几个开关：

| 参数 | 作用 |
| --- | --- |
| `--check` / `-Check` | 只检查 Node 版本和目录，不装不改 |
| `SKIP_INSTALL=1` / `-SkipInstall` | 依赖装过了，跳过 `npm ci` |
| `WITH_SEED=0` / `-NoSeed` | 不写示例数据 |

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
- `/start` — 三步做完：写经历 + 勾技能 + 填邮箱（可留空）→ 对话式追问（最多 10 问）→ 确认文案
- `/edit/{edit_token}` — 用编辑链接回来查看内容
- `/settings` — 模型接入（填 Key、测试连接、切模板模式）

API Key **不需要写进任何文件**：在设置页填入即可，只存在浏览器 localStorage 里。
也可以用环境变量 `LLM_API_KEY` 给整台机器预置一个 Key —— 只适合内网 / 自己一个人用的机器，
公网部署别这么干：站点没有登录，谁打开页面都在花你的额度。

> 本仓库不含任何真实 Key：`.env` 不进版本库，`.env.example` 里只有占位注释，源码里也没有硬编码的 Key。
> 克隆下来自己 `cp .env.example .env` 再填即可；不想填也可以用网页里的设置页。

## 部署运行

**本机运行**用上面「快速开始」那四行就够；下面是放到服务器上的做法（阿里云 / 腾讯云，Ubuntu 22.04 实测）。

```bash
# 1. 环境（Ubuntu / Debian）
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs git

# 2. 代码
git clone https://github.com/cya070805/Automated-generation-of-personal-webpages.git /opt/ludao
cd /opt/ludao

# 3. 环境变量：数据放独立目录，重新部署不丢
mkdir -p /opt/ludao-data
printf 'DATABASE_URL="file:/opt/ludao-data/app.db"\n' > .env

# 4. 依赖 + 建表 + 构建
npm ci && npx prisma migrate deploy && npm run build

# 5. 常驻
npm i -g pm2 && pm2 start npm --name ludao -- start && pm2 save && pm2 startup
```

浏览器打开 `http://服务器公网IP:3000`；记得在云控制台的安全组 / 防火墙放行 3000 端口。

| 环境变量 | 必填 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | 是 | SQLite 文件路径；本机默认 `file:./dev.db` |
| `LLM_API_KEY` | 否 | 预置 Key。公网部署别设：站点没有登录，谁打开都在花你的额度 |
| `ALLOW_PRIVATE_LLM` | 否 | 要把模型请求发往内网（自托管 Ollama / 公司网关）时设为 `1` |

改了代码之后更新：

```bash
cd /opt/ludao && git pull && npm ci && npx prisma migrate deploy && npm run build && pm2 restart ludao
```

逐步说明、域名与备案、常见问题表在 [`docs/部署.md`](docs/部署.md)。

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
      settings/            模型接入设置页
    edit/[token]/          编辑器：左栏内容/基底/模块/微调/发布，右栏真页面
    preview/[token]/       生成的主页，整页渲染，不套产品导航
    p/[slug]/              发布后的分享页（可选访问密码）
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
      pages/[id]/          换基底 / 换讲法 / 排序 / 调参（只写 pages 一行）
      pages/[id]/publish/  发布与取消发布
      share/[slug]/auth/   访问密码校验
      ai/assist/           润色 / 翻译 / 按 JD 定制
      export/[token]/pdf     简历 PDF（Playwright 打印同一路由）
      export/[token]/package 整站部署包（单文件 HTML + Dockerfile + 说明）
      projects/            匿名项目（创建 / 按编辑 token 读取）
      health/              数据库自检
  components/              UI 与页面组件
  lib/
    llm/                   预设、转发、错误映射、浏览器端客户端
    ai/                    提示词、JSON 校验、模板模式兜底
    templates/             十套基底（令牌）+ 配方库 + 默认组合（七个槽位）
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
| GET | `/api/preview/{token}` | 预览整页数据（基底 + 内容 + 配方 + 顺序 + 微调），编辑器就地重渲用 |
| PATCH | `/api/pages/{id}` | 换基底 / 换配方 / 排模块 / 拉滑杆，只动 `pages` 一行 |
| POST | `/api/pages/{id}/publish` | 发布到平台，返回 `/p/{slug}`；可设访问密码与 noindex |
| DELETE | `/api/pages/{id}/publish` | 取消发布，链接立刻失效 |
| POST | `/api/share/{slug}/auth` | 访问密码校验，发 httpOnly 凭证 |
| POST | `/api/ai/assist` | 润色 / 译成英文 / 按 JD 定制一段文案 |
| GET | `/api/export/{token}/pdf` | 简历 PDF |
| GET | `/api/export/{token}/package` | 整站部署包（zip） |
| POST | `/api/projects` | 创建匿名项目，返回 `editToken` 与编辑链接 |
| GET | `/api/projects/{token}` | 用编辑 token 读取项目（内容块 + 页面） |
| GET | `/api/health` | 数据库连通性与十张表计数 |

转发层错误映射：`401/403 → AUTH`、`429 → 退避重试一次`、`60s 超时 → TIMEOUT`、
连续失败会建议切模板模式。

AI 管线：`解析（文件 → 文本）→ 抽取（JSON Schema 约束，失败重试一次）→ 覆盖度检查 → 对话式追问 →
两版文案（带 sourceQuote）`。没有 Key 或模型失败时自动退回模板模式，流程照样能走完。

**覆盖度检查**（`lib/ai/coverage.ts`）：首页固定六屏（简介 / 经历 / 项目 / 教育 / 技能 / 联系），
用户没写到的屏由问答补 —— 城市和邮箱分开问，邮箱可以跳过。

**对话式追问**（`/api/resume/ask` + `lib/ai/tasks.ts` 的 `nextQuestion`）：第二步是聊天界面，
每一轮只决定「下一个问题」——先追问上一答没说清的地方，再补空着的屏，最后问细节；最多 10 问
（跳过的也算一个）。模型不可用时退回 `analyze` 时算好的问题单。
模块问题（`profile.*` / `education.*` / `skill.*` / `project.*`）答完由 `lib/collect.ts` 直接落成内容块，
经历细节只留作写文案的补充材料，不往原文里塞。

## 呈现层

内容与呈现分离。页面只记两件事：`baseId`（哪套基底）和 `recipeMap`（每个槽位哪条配方），
内容块一个字段都不动。

```
基底（9）  只给设计令牌：字体、色板、圆角、疏密、字号阶梯
原语（12） 只给质感：颗粒、玻璃、扫描线、打字机、倾斜……
配方（57） 只给讲法：「经历」用条目、表格、阶梯还是大数字
```

每一屏的讲法数量（全库）：首屏 10、关于 7、经历 9、教育 5、项目 11、技能 9、联系 6。每套基底只列出它兼容的那些，所以面板里的数字会小一点。

渲染层 `components/render/site-view.tsx` 只消费 `SiteData` 与令牌，不读数据库；
编辑态与预览页共用同一个组件，所以「改完就能看见」。
细节见 [基底与原语.md](docs/基底与原语.md)。

## 编辑器

`/edit/{token}` 是双栏：左边改，右边是真的页面（真 iframe 里的真 `SiteView`，不是缩略图）。
改配置**不刷新页面**——基底、模块、微调都通过 `postMessage` 推进 iframe 就地重渲，
滚到哪就停在哪；改文案也一样：`site:text` 只把那一块算出来的文字就地换掉，
不等服务器、不改滚动位置。

| 面板 | 能做什么 |
| --- | --- |
| 内容 | 逐段改文字（边打右边边变，停手 0.7s 自动存，切页签/关页面都不丢）；润色 / 译成英文；贴 JD 批量定制经历与项目 |
| 基底 | 十套基底一键换，换的是令牌（Reel 换成轮盘翻页） |
| 模块 | 七个槽位排序、隐藏、换讲法（教育单算一个槽位） |
| 微调 | 七个 0–100 的连续滑杆（动效、字号、疏密、页宽、行宽、圆角、标题字重）+ 底纹三选一 + 三组取色（强调色 / 背景色 / 文字色，各带预设与色盘） |
| 发布 | `/p/{slug}` 链接、访问密码、noindex、PDF、部署包 |

## 排版约定（动字号 / 行高 / 字距之前先看这条）

汉字和拉丁字母不是一回事：汉字的字身几乎占满字格，没有 x-height 的余量。
拉丁文可以 `line-height: 0.9`、`letter-spacing: -0.05em` 做出紧凑的高级感，汉字这么做就是粘连。

- 显示字号（人名、大标题、大数字）**行高不低于 1.06**。堆叠排版（Mono 那种一字一行）尤其明显。
- **字距不低于 -0.015em**。基底里的 `displayTracking` 一律控制在 -0.01em 以内；
  800 字重、200px 的黑体挨着 -0.06em 会直接重叠。
- 中文正文行高 1.7 起、小字标签 1.5 起；正向字距（0.1em 以上的小号大写标签）没问题。
- 负字距只留给纯数字／拉丁（编号 `01`、`4.2s`），带汉字的文本一律不缩。

## 安全边界

- API Key 只存浏览器本地（`localStorage` 键名 `lvdao.settings.v1`），不上传、不入库。
- 所有模型请求经同源 `/api/llm` 转发，Key 只在请求头里过一遍；转发层无状态，不记录请求体。
- 自定义 Base URL 只允许 https，或本机 http；内网段默认拦截（自托管可设 `ALLOW_PRIVATE_LLM=1`）。
- 不做：Key 代充、额度转售、服务端托管用户 Key。

## 技术选型

Next.js 15（App Router）+ TypeScript · Tailwind CSS（CSS 变量做设计令牌）· Prisma + SQLite（可换 Postgres）·
Zustand · OpenAI 兼容协议 + 同源转发 · unpdf / mammoth 解析旧简历 · Playwright 出 PDF ·
Docker Compose 打包部署（导出包里带 Dockerfile 与 compose）。

## 开源组件

除框架本身，直接依赖的都在这里。全部是 MIT / Apache-2.0 / BSD / ISC 这类宽松许可，没有需要商业授权的组件。

| 组件 | 版本 | 许可 | 用在哪 |
| --- | --- | --- | --- |
| Next.js | 15.5 | MIT | 页面与 API 路由；部署只起一个 Node 服务 |
| React / React DOM | 19.1 | MIT | 界面与编辑器交互 |
| Prisma / @prisma/client | 6.16 | Apache-2.0 | ORM；SQLite 十张表与迁移 |
| Tailwind CSS | 4.x | MIT | 样式；CSS 变量承载基底令牌 |
| lucide-react | 0.468 | ISC | 图标 |
| zustand | 5.x | MIT | 浏览器端状态（模型设置、编辑器草稿） |
| zod | 3.24 | MIT | 接口参数校验 |
| playwright-core | 1.65 | Apache-2.0 | 导出 PDF / 整站包；复用系统 Chrome，不额外下载浏览器 |
| unpdf | 2.1 | MIT | 解析上传的 PDF 简历 |
| mammoth | 1.13 | BSD-2-Clause | 解析上传的 DOCX 简历 |
| clsx + tailwind-merge | 2.1 / 2.6 | MIT | className 合并 |
| class-variance-authority | 0.7 | Apache-2.0 | 按钮等组件的变体 |
| TypeScript / ESLint / tsx | 5.x / 9.x / 4.x | Apache-2.0 / MIT / MIT | 开发期类型检查、规范检查、跑种子脚本 |

运行时另依赖：Node.js（MIT）、SQLite（公有领域）；导出 PDF 时调用本机已装的 Chrome / Edge。

## 码道在项目开发中的应用

这个项目从 0 到可演示，主要靠 AI 编码助手推进，我负责判断和验收。几个环节实际用下来是这样：

- **拆任务**：先把「AI 生成个人主页」拆成采集、抽取、呈现、发布四段，定好数据模型和接口，再让码道一层一层写。拆得清楚，它生成的代码才落在该在的位置。
- **批量写重复结构**：十套基底、57 条配方、编辑器五栏的表单，形态高度重复。先手写一套当样本，其余按样子补齐，再逐条核对令牌和间距。
- **排错**：报错栈、数据库里的实际数据、浏览器网络面板三样一起丢给它，比自己猜快。技能栏那个 bug 就是它先指出「库里有两个技能块」。
- **写文档和脚本**：部署文档、README、一键安装脚本、PDF 生成脚本都是它出初稿，我对着真实服务器跑一遍再改。

一点体会：AI 写的代码「看起来对」的概率不低，坑往往出在**两处各自正确的逻辑拼起来**——抽取端写了一个技能块，渲染端只取第一个，单看哪边都没错。所以验收不看它说做了什么，只看三样：`tsc` / `eslint` 干净、`next build` 能过、真机点一遍符合预期；这三关不过就一直改到过。

## 不做

账号与登录（用编辑链接 + 本地草稿替代）· Key 代充与额度转售 · 服务器售卖与域名代管 · 支付与订阅。
