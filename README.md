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

**一期：骨架 + 数据模型 + 模型接入** —— 已完成，可用。

| 一期内容 | 状态 |
| --- | --- |
| Next.js 15（App Router）+ TypeScript + Tailwind 应用骨架 | ✅ |
| 十张表数据模型（Prisma + SQLite）+ 初始迁移 | ✅ |
| 模型接入：Key 设置页、五家预设、自定义地址、测试连接 | ✅ |
| 同源转发 `/api/llm`（流式 SSE，Key 不入库、不写日志） | ✅ |
| 匿名项目与编辑链接（`/api/projects`） | ✅ |

二期（内容闭环）、三期（呈现闭环）、四期（画布与导出）尚未开始。

## 快速开始

```bash
npm install

cp .env.example .env        # 默认 SQLite：file:./dev.db
npm run db:push             # 或 npm run db:migrate
npm run db:seed             # 可选：建一个示例项目

npm run dev
```

打开 <http://localhost:3000>：

- `/` — 产品能力地图与四期路线
- `/settings` — 模型接入（填 Key、测试连接、切模板模式）
- `/workspace` — 数据层自检（十张表的真实计数）+ 建一个空项目

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
    page.tsx               总览（能力地图 + 四期路线）
    settings/              模型接入设置页
    workspace/             数据层自检
    api/
      llm/chat/            同源转发（流式）
      llm/test/            测试连接
      projects/            匿名项目（创建 / 按编辑 token 读取）
      health/              数据库自检
  components/              UI 与页面组件
  lib/
    llm/                   预设、转发、错误映射、浏览器端客户端
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
| POST | `/api/projects` | 创建匿名项目，返回 `editToken` 与编辑链接 |
| GET | `/api/projects/{token}` | 用编辑 token 读取项目（内容块 + 页面） |
| GET | `/api/health` | 数据库连通性与十张表计数 |

转发层错误映射：`401/403 → AUTH`、`429 → 退避重试一次`、`60s 超时 → TIMEOUT`、
连续失败会建议切模板模式。

## 安全边界

- API Key 只存浏览器本地（`localStorage` 键名 `lvdao.settings.v1`），不上传、不入库。
- 所有模型请求经同源 `/api/llm` 转发，Key 只在请求头里过一遍；转发层无状态，不记录请求体。
- 自定义 Base URL 只允许 https，或本机 http；内网段默认拦截（自托管可设 `ALLOW_PRIVATE_LLM=1`）。
- 不做：Key 代充、额度转售、服务端托管用户 Key。

## 技术选型

Next.js 15（App Router）+ TypeScript · Tailwind CSS（CSS 变量做设计令牌）· Prisma + SQLite（可换 Postgres）·
Zustand（命令模式做撤销/重做）· OpenAI 兼容协议 + 同源转发 · Playwright 出 PDF（三期）·
Docker Compose 部署（四期）。

## 路线

1. **一期（已完成）** 骨架 + 数据模型 + 模型接入
2. **二期** 内容闭环：解析 → 追问 → 文案确认
3. **三期** 呈现闭环：五套模板 + 结构化编辑 + PDF 导出
4. **四期** 自由画布 + 两种导出（平台发布 / 部署包）

## 不做

账号与登录（用编辑链接 + 本地草稿替代）· Key 代充与额度转售 · 服务器售卖与域名代管 · 支付与订阅。
