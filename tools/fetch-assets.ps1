# Amadeus 资产下载脚本
# 下载 Kurisu Live2D 模型（Cubism 2，粉丝制作，仅个人学习用途）
# 版权提示：角色版权归 MAGES./Nitroplus，模型无商用许可。

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot          # 仓库根目录
$Out = Join-Path $Root 'assets\live2d\kurisu'
New-Item -ItemType Directory -Force -Path $Out | Out-Null

$Tar = Join-Path $env:TEMP 'amadeus-kurisu.tar.gz'
$Tmp = Join-Path $env:TEMP 'amadeus-kurisu-extract'

Write-Host '[1/3] 下载 kurisu.tar.gz (https://nyarchlinux.moe/kurisu.tar.gz) ...'
Invoke-WebRequest -Uri 'https://nyarchlinux.moe/kurisu.tar.gz' -OutFile $Tar -UseBasicParsing

Write-Host '[2/3] 解压 ...'
if (Test-Path $Tmp) { Remove-Item -Recurse -Force $Tmp }
New-Item -ItemType Directory -Force -Path $Tmp | Out-Null
tar -xzf $Tar -C $Tmp

Write-Host '[3/3] 复制到 assets ...'
Copy-Item -Recurse -Force (Join-Path $Tmp 'kurisu\*') $Out

Remove-Item -Force $Tar -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $Tmp -ErrorAction SilentlyContinue

Write-Host "完成 -> $Out"
Write-Host '提示：模型为粉丝制作、无商用许可，仅个人学习使用。'
