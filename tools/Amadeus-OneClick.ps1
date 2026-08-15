# Amadeus for DSH - One-click launcher
# Usage: 双击 Amadeus-OneClick.bat，或在仓库/发行包目录运行本脚本
$ErrorActionPreference = 'Stop'
$ROOT = Split-Path -Parent $PSScriptRoot
$INSTALLER = Join-Path $ROOT 'install.ps1'

if (-not (Test-Path $INSTALLER)) {
  Write-Host '错误：未找到 install.ps1（请从完整发行包运行）' -ForegroundColor Red
  exit 1
}

Write-Host ''
Write-Host '============================================' -ForegroundColor Cyan
Write-Host '  Amadeus for DSH - One-click Setup' -ForegroundColor Cyan
Write-Host '============================================' -ForegroundColor Cyan
Write-Host ''
Write-Host '  [0] Edge TTS（云端快速，默认推荐）'
Write-Host '  [1] VOICEVOX 公共 API（云端备用）'
Write-Host '  [2] 仅安装 / 更新插件'
Write-Host ''

$choice = Read-Host '请选择 [0/1/2]'
switch ($choice) {
  '0' { Write-Host '已选择：Edge TTS。' -ForegroundColor Yellow; & $INSTALLER -Channel edge }
  '1' { Write-Host '已选择：VOICEVOX 公共 API。' -ForegroundColor Yellow; & $INSTALLER -Channel quest }
  '2' { Write-Host '已选择：仅安装/更新插件。' -ForegroundColor Yellow; & $INSTALLER }
  default {
    Write-Host '无效选择，请重新运行。' -ForegroundColor Red
    exit 1
  }
}

Write-Host ''
Write-Host '全部完成！请重启 DSH 激活 Amadeus。' -ForegroundColor Green