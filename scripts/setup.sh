#!/usr/bin/env bash
# 一键安装：检查环境 → 装依赖 → 建库 → 可选示例数据
#
#   bash scripts/setup.sh              # 完整安装
#   bash scripts/setup.sh --check      # 只检查环境，不动任何文件
#   SKIP_INSTALL=1 bash scripts/setup.sh   # 依赖已装过，跳过 npm ci
#   WITH_SEED=0 bash scripts/setup.sh      # 不写示例数据
#
# Linux / macOS / Windows 的 Git Bash 都能跑。

set -euo pipefail
cd "$(dirname "$0")/.."

NODE_MIN=20
CHECK_ONLY=0
[ "${1:-}" = "--check" ] && CHECK_ONLY=1

say() { printf '\033[36m==>\033[0m %s\n' "$1"; }
die() { printf '\033[31m✗\033[0m %s\n' "$1" >&2; exit 1; }

# ---------- 环境检查 ----------
command -v node >/dev/null 2>&1 || die "没找到 Node.js。先装 Node 20 或 22：https://nodejs.org"
command -v npm  >/dev/null 2>&1 || die "没找到 npm（通常随 Node 一起装）"
[ -f package.json ] || die "这里不是项目根目录（找不到 package.json）"

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
NPM_MAJOR="$(npm -v | cut -d. -f1)"
[ "$NODE_MAJOR" -ge "$NODE_MIN" ] || die "Node 版本过低：$(node -v)，需要 ${NODE_MIN} 及以上"

say "Node $(node -v) · npm $(npm -v)"
if [ "$CHECK_ONLY" = "1" ]; then
  say "环境检查通过（--check 模式，未做任何改动）"
  exit 0
fi

# ---------- 依赖 ----------
if [ "${SKIP_INSTALL:-0}" = "1" ]; then
  say "跳过 npm ci（SKIP_INSTALL=1）"
else
  [ -f package-lock.json ] || die "缺 package-lock.json，没法用 npm ci 精确安装"
  say "安装依赖（首次约 1–2 分钟，400MB 左右）"
  npm ci
fi

# ---------- 环境变量 ----------
if [ -f .env ]; then
  say ".env 已存在，保持不变"
else
  say "生成 .env（默认 SQLite：file:./dev.db）"
  cp .env.example .env
fi

# ---------- 数据库 ----------
say "生成 Prisma Client"
npx prisma generate

say "建表（幂等，重复跑不会丢数据）"
npx prisma db push

if [ "${WITH_SEED:-1}" = "1" ]; then
  say "写入示例数据（示例主页；已经有了会自动跳过）"
  npm run db:seed
else
  say "跳过示例数据（WITH_SEED=0）"
fi

echo
say "装好了。启动开发服务器："
printf '    npm run dev        # http://localhost:3000\n\n'
say "想部署到服务器：见 docs/部署.md"
