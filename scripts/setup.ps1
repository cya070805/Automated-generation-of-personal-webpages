# 一键安装（Windows PowerShell 版）
#
#   powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\setup.ps1 -Check
#
# 逻辑与 scripts/setup.sh 一致：检查环境 → 装依赖 → 生成 .env → 建库 → 可选示例数据。

param(
  [switch]$Check,
  [switch]$SkipInstall,
  [switch]$NoSeed
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
$NodeMin = 20

function Say($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Die($msg) { Write-Host "x  $msg" -ForegroundColor Red; exit 1 }

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Die "没找到 Node.js。先装 Node 20 或 22：https://nodejs.org"
}
if (-not (Test-Path "package.json")) { Die "这里不是项目根目录（找不到 package.json）" }

$nodeVersion = (& node -v).TrimStart("v")
$nodeMajor = [int]($nodeVersion.Split(".")[0])
if ($nodeMajor -lt $NodeMin) { Die "Node 版本过低：v$nodeVersion，需要 $NodeMin 及以上" }

Say "Node v$nodeVersion · npm $(& npm -v)"
if ($Check) {
  Say "环境检查通过（-Check 模式，未做任何改动）"
  exit 0
}

if ($SkipInstall) {
  Say "跳过 npm ci（-SkipInstall）"
} else {
  if (-not (Test-Path "package-lock.json")) { Die "缺 package-lock.json，没法用 npm ci 精确安装" }
  Say "安装依赖（首次约 1-2 分钟，400MB 左右）"
  & npm ci
  if ($LASTEXITCODE -ne 0) { Die "npm ci 失败，看上面的报错" }
}

if (Test-Path ".env") {
  Say ".env 已存在，保持不变"
} else {
  Say "生成 .env（默认 SQLite：file:./dev.db）"
  Copy-Item ".env.example" ".env"
}

Say "生成 Prisma Client"
& npx prisma generate
if ($LASTEXITCODE -ne 0) { Die "prisma generate 失败" }

Say "建表（幂等，重复跑不会丢数据）"
& npx prisma db push
if ($LASTEXITCODE -ne 0) { Die "prisma db push 失败" }

if ($NoSeed) {
  Say "跳过示例数据（-NoSeed）"
} else {
  Say "写入示例数据（示例主页；已经有了会自动跳过）"
  & npm run db:seed
}

Write-Host ""
Say "装好了。启动开发服务器："
Write-Host "    npm run dev        # http://localhost:3000"
Write-Host ""
Say "想部署到服务器：见 docs/部署.md"
