# Amadeus for DSH — 旧名一键安装脚本（兼容入口，实际逻辑在 install.ps1）
$ErrorActionPreference = 'Stop'
$installer = Join-Path $PSScriptRoot 'install.ps1'
if (-not (Test-Path $installer)) {
  Write-Host '错误：未找到 install.ps1' -ForegroundColor Red
  exit 1
}
& $installer @args
exit $LASTEXITCODE