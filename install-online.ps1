# Amadeus for DSH - online one-shot installer (uses dsh plugin add github:...)
# ASCII-only, no BOM, so it survives 'irm <url> | iex' on Windows PowerShell 5.1.
# Usage:  powershell -ExecutionPolicy Bypass -c "irm https://raw.githubusercontent.com/yyxcnasd/amadeus-for-dsh/main/install-online.ps1 | iex"
# Optional args: -Profile desktop|web  -Channel edge|quest  -Uninstall
$ErrorActionPreference = 'Stop'

$script:TargetProfile = ''
$script:Channel = ''
$Uninstall = $false
for ($i = 0; $i -lt $args.Count; $i++) {
  $a = $args[$i]
  if ($a -eq '-Uninstall') { $Uninstall = $true }
  elseif ($a -like '-Profile:*') { $script:TargetProfile = $a.Substring($a.IndexOf(':') + 1) }
  elseif ($a -eq '-Profile' -and $i + 1 -lt $args.Count) { $i++; $script:TargetProfile = [string]$args[$i] }
  elseif ($a -like '-Channel:*') { $script:Channel = $a.Substring($a.IndexOf(':') + 1) }
  elseif ($a -eq '-Channel' -and $i + 1 -lt $args.Count) { $i++; $script:Channel = [string]$args[$i] }
}

function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Ok   { Write-Host $args -ForegroundColor Green }
function Write-Warn { Write-Host $args -ForegroundColor Yellow }
function Write-Fail { Write-Host $args -ForegroundColor Red }

function Get-DshHome {
  if ($env:DSH_HOME -and (Test-Path $env:DSH_HOME)) { return $env:DSH_HOME }
  $def = Join-Path $env:USERPROFILE '.dsh'
  return $def
}

function Select-TargetProfile {
  param([string]$DshHome, [string]$Forced)
  if ($Forced -ne '') { return $Forced }
  if ($env:DSH_DESKTOP_DEFAULT_PROFILE) { return $env:DSH_DESKTOP_DEFAULT_PROFILE }
  $profilesDir = Join-Path $DshHome 'profiles'
  if (Test-Path (Join-Path $profilesDir 'desktop')) { return 'desktop' }
  if (Test-Path (Join-Path $profilesDir 'web')) { return 'web' }
  throw "profiles dir not found: $profilesDir (start DSH once first)"
}

Write-Host ''
Write-Host '== Amadeus for DSH : online installer (dsh plugin add) ==' -ForegroundColor Cyan
$dshHome = Get-DshHome
if (-not (Test-Path (Join-Path $dshHome 'profiles'))) { throw 'DSH config dir not found; start DSH once first' }
if (-not (Get-Command dsh -ErrorAction SilentlyContinue)) { throw 'dsh command not found on PATH' }

$profile = Select-TargetProfile -DshHome $dshHome -Forced $script:TargetProfile
Write-Info ("Target profile: " + $profile)

if ($Uninstall) {
  Write-Info 'Uninstalling (data kept under $dshHome\amadeus) ...'
  & dsh plugin --profile $profile remove amadeus-for-dsh
  Write-Ok 'Done. Restart DSH.'
  exit 0
}

Write-Info 'Installing from GitHub (pnpm github: spec) ...'
& dsh plugin --profile $profile add github:yyxcnasd/amadeus-for-dsh
if ($LASTEXITCODE -ne 0) {
  Write-Fail 'dsh plugin add failed (pnpm required; see README)'
  exit 1
}

# Legacy cleanup: v2.x flat install dir + hand-written web patch row (idempotent)
$legacyDir = Join-Path $dshHome 'profiles\node_modules\amadeus-for-dsh'
if (Test-Path $legacyDir) {
  Remove-Item -Recurse -Force $legacyDir
  Write-Warn 'Removed legacy flat install dir profiles\node_modules\amadeus-for-dsh'
}
$patchYml = Join-Path $dshHome 'profiles\web\cordis.patch.yml'
if (Test-Path $patchYml) {
  $yml = Get-Content -Raw -Encoding UTF8 $patchYml
  $pattern = "(?ms)(\r?\n\s*# ── Amadeus[^\r\n]*)?\r?\n- insert:\r?\n\s+- id: amadeus\r?\n\s+name: amadeus-for-dsh"
  if ($yml -match $pattern) {
    Copy-Item $patchYml ($patchYml + '.bak-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
    $yml = $yml -replace $pattern, ''
    $trim = ($yml -replace '^\uFEFF', '').Trim()
    $looksArray = ($trim -match '(?m)^\s*-\s') -or ($trim -match '^\[')
    if ($trim.Length -eq 0 -or -not $looksArray) {
      [System.IO.File]::WriteAllText($patchYml, "# Your patch layer for this dsh profile, applied after every bundle layer:`r`n[]`r`n", (New-Object System.Text.UTF8Encoding $true))
    } else {
      [System.IO.File]::WriteAllText($patchYml, ($trim + "`r`n"), (New-Object System.Text.UTF8Encoding $true))
    }
    Write-Warn 'Removed legacy v2 amadeus row from profiles\web\cordis.patch.yml (backup .bak-*)'
  }
}

# Runtime data dirs + seed config (read from the freshly installed package)
$dataDir = Join-Path $dshHome 'amadeus'
foreach ($d in @('config', 'memory', 'tmp')) { New-Item -ItemType Directory -Force -Path (Join-Path $dataDir $d) | Out-Null }
$dataConfig = Join-Path $dataDir 'config\amadeus.json'
if (-not (Test-Path $dataConfig)) {
  $seed = Join-Path $dshHome ("profiles\" + $profile + "\node_modules\amadeus-for-dsh\config\amadeus.json")
  if (Test-Path $seed) { Copy-Item -Force $seed $dataConfig }
  else { [System.IO.File]::WriteAllText($dataConfig, '{}', (New-Object System.Text.UTF8Encoding $false)) }
}
if ($script:Channel -ne '') {
  try {
    $cfg = Get-Content -Raw -Encoding UTF8 $dataConfig | ConvertFrom-Json
    $cfg.provider = $script:Channel
    [System.IO.File]::WriteAllText($dataConfig, ($cfg | ConvertTo-Json -Depth 10), (New-Object System.Text.UTF8Encoding $false))
    Write-Ok ("TTS channel set: " + $script:Channel)
  } catch { Write-Warn ('channel update failed (non-fatal): ' + $_.Exception.Message) }
}

# edge-tts best effort (default channel)
$python = $null
try { $python = (Get-Command python -ErrorAction Stop).Source } catch { $python = $null }
if ($python) {
  & $python -c "import edge_tts" 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-Info 'edge-tts missing; installing ...'
    & $python -m pip install --quiet edge-tts 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Ok 'edge-tts installed' }
    else { Write-Warn 'edge-tts install failed; use VOICEVOX public channel instead (no Python needed)' }
  } else { Write-Ok 'edge-tts ready' }
} else {
  Write-Warn 'Python not found; Edge TTS needs Python 3.9+ (pip install edge-tts), or use VOICEVOX channel'
}

Write-Host ''
Write-Ok 'Done. Restart DSH to activate Amadeus (right sidebar panel + voice).'
Write-Host ("  profile   : " + $profile)
Write-Host ("  data dir  : " + $dataDir)