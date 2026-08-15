# Amadeus for DSH - online one-shot installer.
# ASCII-only, no BOM, so it survives 'irm <url> | iex' on Windows PowerShell 5.1.
# Downloads the latest release zip, extracts it, then runs the full installer inside.
$ErrorActionPreference = 'Stop'

$release = 'https://github.com/yyxcnasd/amadeus-for-dsh/releases/latest/download/Amadeus-for-DSH.zip'
$stage = Join-Path $env:TEMP ('amadeus-online-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $stage | Out-Null

Write-Host '== Amadeus for DSH : online installer =='
Write-Host ('Downloading: ' + $release)
try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest -Uri $release -OutFile (Join-Path $stage 'pkg.zip') -UseBasicParsing
} catch {
  Write-Host ('Download failed: ' + $_.Exception.Message) -ForegroundColor Red
  Write-Host 'Check network, or download the zip manually from the GitHub Releases page and run Amadeus-OneClick.bat.'
  Remove-Item -Recurse -Force $stage -ErrorAction SilentlyContinue
  exit 1
}

$extract = Join-Path $stage 'x'
Expand-Archive -Path (Join-Path $stage 'pkg.zip') -DestinationPath $extract -Force
$inner = Join-Path $extract 'Amadeus-for-DSH'
if (-not (Test-Path (Join-Path $inner 'package\host.mjs'))) { $inner = $extract }
$innerInstaller = Join-Path $inner 'install.ps1'
if (-not (Test-Path $innerInstaller)) {
  Write-Host 'Broken package: install.ps1 missing in the downloaded zip.' -ForegroundColor Red
  Remove-Item -Recurse -Force $stage -ErrorAction SilentlyContinue
  exit 1
}

& $innerInstaller @args
$code = $LASTEXITCODE
Remove-Item -Recurse -Force $stage -ErrorAction SilentlyContinue
exit $code