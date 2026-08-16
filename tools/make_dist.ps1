# Amadeus for DSH - 构建可分发的发行包（zip）
# 先行构建静态包 -> 暂存到临时目录（含顶层文件夹名 Amadeus-for-DSH）-> 压缩为 Amadeus-for-DSH.zip
# 用法: powershell -ExecutionPolicy Bypass -File tools\make_dist.ps1
$ErrorActionPreference = 'Stop'
$ROOT = Split-Path -Parent $PSScriptRoot
$STAGE_ROOT = Join-Path $env:TEMP 'amadeus-for-dsh-dist'
$STAGE = Join-Path $STAGE_ROOT 'Amadeus-for-DSH'
$ZIP = Join-Path $ROOT 'Amadeus-for-DSH.zip'

Write-Host '==> [0/3] 构建静态包（需要 node）' -ForegroundColor Cyan
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw '需要 node 才能构建（npm 安装后重试）' }
Push-Location $ROOT
try {
  node tools\build_static.mjs
  if ($LASTEXITCODE -ne 0) { throw 'build_static.mjs 失败' }
  node tools\build_client.mjs
  if ($LASTEXITCODE -ne 0) { throw 'build_client.mjs 失败' }
} finally { Pop-Location }

Write-Host '==> [1/3] 暂存文件（仅运行时与安装器内容）' -ForegroundColor Cyan
if (Test-Path $STAGE_ROOT) { Remove-Item -Recurse -Force $STAGE_ROOT }
New-Item -ItemType Directory -Force -Path $STAGE | Out-Null

$ExcludeDirs = @(
  'tmp', 'memory', '.git', 'node_modules', 'research', 'docs',
  'package\node_modules',
  'tools\voicevox', 'tools\aqua', 'tools\kokoro-venv', 'tools\qwen-venv', 'tools\__pycache__'
)
$ExcludeFull = $ExcludeDirs | ForEach-Object { Join-Path $ROOT $_ }
$ExcludeFiles = @('*.pyc', '*.zip', '*.tgz', '.gitignore',
  'build_static.mjs', 'build_client.mjs', 'make_dist.ps1',
  'fetch-assets.ps1', 'Download-MultiThread.ps1', 'gen_ring.py', 'amadeus-preview.png')
robocopy $ROOT $STAGE /E /XD $ExcludeFull /XF $ExcludeFiles /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy 失败（$LASTEXITCODE）" }

$ver = (Get-Content -Raw -Encoding UTF8 (Join-Path $ROOT 'package\package.json') | ConvertFrom-Json).version
[System.IO.File]::WriteAllText((Join-Path $STAGE 'VERSION'), $ver, (New-Object System.Text.UTF8Encoding $false))
Write-Host "版本：$ver"

Write-Host '==> [2/3] 创建 zip' -ForegroundColor Cyan
if (Test-Path $ZIP) { Remove-Item -Force $ZIP }
Compress-Archive -Path $STAGE -DestinationPath $ZIP -CompressionLevel Optimal

Write-Host '==> [3/3] 收尾清理' -ForegroundColor Cyan
Remove-Item -Recurse -Force $STAGE_ROOT

Write-Host ''
Write-Host '发行包已生成：' -ForegroundColor Green
Write-Host "  $ZIP"
Write-Host '用法：① 解压后双击 Amadeus-OneClick.bat；② 或在线安装一行命令（见 README）'
