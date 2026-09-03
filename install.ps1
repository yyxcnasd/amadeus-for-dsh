#requires -Version 5.1
# ============================================================
# Amadeus for DSH — 安装 / 更新 / 卸载（标准 dsh plugin add 方式）
#
# 三种用法：
#   1) 在线一行命令（普通用户推荐，安装源 = GitHub 仓库）：
#        powershell -ExecutionPolicy Bypass -c "irm https://raw.githubusercontent.com/yyxcnasd/amadeus-for-dsh/main/install-online.ps1 | iex"
#   2) 本地：解压发行版 zip 后，双击 Amadeus-OneClick.bat（或直接运行本脚本）
#   3) 仓库开发者：在源码目录直接运行本脚本（自动先构建静态包）
#
# 参数：
#   -Profile desktop|web   安装到哪个 profile（默认：DSSH_DESKTOP_DEFAULT_PROFILE，
#                          否则优先 desktop，其次 web）
#   -Channel edge|quest    非交互指定 TTS 通道（edge=Edge TTS 默认 / quest=VOICEVOX 公共 API）
#   -Uninstall             卸载插件（保留你的配置与记忆数据）
#
# 安装机制（与生态其它插件一致）：
#   dsh plugin --profile <p> add <spec>
#     · spec 在线为 github:yyxcnasd/amadeus-for-dsh，本地为 link:<本目录>
#     · dsh 会把它写进该 profile 的 package.json 依赖（pnpm 安装），
#       并因包内声明了 dsh.bundle.patch 而自动加入该 profile 的 dsh.profile.bundles
#     · 重启 DSH 后生效
# 运行数据：%DSH_HOME%\amadeus\{config,memory,tmp}（重装/升级不丢）
# ============================================================
$ErrorActionPreference = 'Stop'

# 说明：本脚本不使用 param() 块 —— 因为 `irm <url> | iex` 用 Invoke-Expression
# 执行时不允许脚本以 param() 开头。参数在这里手动解析。
$TargetProfile = ''
$Channel = ''
$Uninstall = $false
for ($i = 0; $i -lt $args.Count; $i++) {
  $a = $args[$i]
  if ($a -eq '-Uninstall') { $Uninstall = $true }
  elseif ($a -like '-Profile:*') { $TargetProfile = $a.Substring($a.IndexOf(':') + 1) }
  elseif ($a -eq '-Profile' -and $i + 1 -lt $args.Count) { $i++; $TargetProfile = [string]$args[$i] }
  elseif ($a -like '-Channel:*') { $Channel = $a.Substring($a.IndexOf(':') + 1) }
  elseif ($a -eq '-Channel' -and $i + 1 -lt $args.Count) { $i++; $Channel = [string]$args[$i] }
}

$GithubRepo = 'github:yyxcnasd/amadeus-for-dsh'

function Write-Info  { Write-Host $args -ForegroundColor Cyan }
function Write-Ok    { Write-Host $args -ForegroundColor Green }
function Write-Warn  { Write-Host $args -ForegroundColor Yellow }
function Write-Fail  { Write-Host $args -ForegroundColor Red }

function Get-DshHome {
  if ($env:DSH_HOME -and (Test-Path $env:DSH_HOME)) { return $env:DSH_HOME }
  $def = Join-Path $env:USERPROFILE '.dsh'
  if (Test-Path $def) { return $def }
  return $def
}

function Select-TargetProfile {
  param([string]$DshHome, [string]$Forced)
  if ($Forced -ne '') { return $Forced }
  if ($env:DSH_DESKTOP_DEFAULT_PROFILE) { return $env:DSH_DESKTOP_DEFAULT_PROFILE }
  $profilesDir = Join-Path $DshHome 'profiles'
  if (Test-Path (Join-Path $profilesDir 'desktop')) { return 'desktop' }
  if (Test-Path (Join-Path $profilesDir 'web')) { return 'web' }
  throw "未找到 $profilesDir ：请先安装并启动过一次 DeepSeek Harness"
}

# ---------- 清理 2.x 时代的旧安装痕迹（扁平目录 + 手写补丁行），避免与新机制重复加载 ----------
function Clear-LegacyArtifacts {
  param([string]$DshHome)
  $legacyDir = Join-Path $DshHome 'profiles\node_modules\amadeus-for-dsh'
  if (Test-Path $legacyDir) {
    Remove-Item -Recurse -Force $legacyDir
    Write-Warn '已清理旧版安装目录 profiles\node_modules\amadeus-for-dsh（v2.0 时代遗留）'
  }
  $patchYml = Join-Path $DshHome 'profiles\web\cordis.patch.yml'
  if (Test-Path $patchYml) {
    $yml = Get-Content -Raw -Encoding UTF8 $patchYml
    $pattern = "(?ms)(\r?\n\s*# ── Amadeus[^\r\n]*)?\r?\n- insert:\r?\n\s+- id: amadeus\r?\n\s+name: amadeus-for-dsh"
    if ($yml -match $pattern) {
      $bak = $patchYml + '.bak-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
      Copy-Item $patchYml $bak
      $yml = $yml -replace $pattern, ''
      $trim = ($yml -replace '^\uFEFF', '').Trim()
      $looksArray = ($trim -match '(?m)^\s*-\s') -or ($trim -match '^\[')
      if ($trim.Length -eq 0 -or -not $looksArray) {
        [System.IO.File]::WriteAllText($patchYml, "# Your patch layer for this dsh profile, applied after every bundle layer:`r`n[]`r`n", (New-Object System.Text.UTF8Encoding $true))
      } else {
        [System.IO.File]::WriteAllText($patchYml, ($trim + "`r`n"), (New-Object System.Text.UTF8Encoding $true))
      }
      Write-Warn "已从 profiles\web\cordis.patch.yml 移除旧版 amadeus 行（备份 $bak）"
    }
  }
  $presetYml = Join-Path $DshHome '.agent-presets\anchored-standard\agent.cordis.yml'
  if (Test-Path $presetYml) {
    $py = Get-Content -Raw -Encoding UTF8 $presetYml
    if ($py -match 'id: amadeus\b') {
      $py = $py -replace "(?ms)\r?\n# ── Amadeus[^\r\n]*\r?\n- id: amadeus\s*\r?\n\s+name: [^\r\n]+", ''
      [System.IO.File]::WriteAllText($presetYml, $py, (New-Object System.Text.UTF8Encoding $true))
      Write-Warn '已移除 agent preset 中的旧版 amadeus 行'
    }
  }
}

# ---------- 运行数据目录（配置/记忆/临时） ----------
function Init-DataDirs {
  param([string]$DshHome, [string]$SeedConfig)
  $dataDir = Join-Path $DshHome 'amadeus'
  foreach ($d in @('config', 'memory', 'tmp')) {
    New-Item -ItemType Directory -Force -Path (Join-Path $dataDir $d) | Out-Null
  }
  $dataConfig = Join-Path $dataDir 'config\amadeus.json'
  if (-not (Test-Path $dataConfig)) {
    if (Test-Path $SeedConfig) { Copy-Item -Force $SeedConfig $dataConfig }
    else { [System.IO.File]::WriteAllText($dataConfig, '{}', (New-Object System.Text.UTF8Encoding $false)) }
  }
  if ($script:Channel -ne '') {
    try {
      $cfg = Get-Content -Raw -Encoding UTF8 $dataConfig | ConvertFrom-Json
      $cfg.provider = $script:Channel
      [System.IO.File]::WriteAllText($dataConfig, ($cfg | ConvertTo-Json -Depth 10), (New-Object System.Text.UTF8Encoding $false))
      Write-Ok "TTS 通道已设为：$($script:Channel)"
    } catch {
      Write-Warn "更新配置通道失败（不影响安装）：$($_.Exception.Message)"
    }
  }
}

# ---------- Edge TTS 依赖（默认通道，best-effort） ----------
function Ensure-TtsDeps {
  $python = $null
  try { $python = (Get-Command python -ErrorAction Stop).Source } catch { $python = $null }
  if ($python) {
    & $python -c "import edge_tts" 2>$null
    if ($LASTEXITCODE -ne 0) {
      Write-Info '未检测到 edge-tts，正在安装（需联网，可跳过）…'
      & $python -m pip install --quiet edge-tts 2>$null
      if ($LASTEXITCODE -eq 0) { Write-Ok 'edge-tts 安装完成' }
      else { Write-Warn 'edge-tts 安装失败：TTS 需 Python + edge-tts（pip install edge-tts），或换用 VOICEVOX 公共 API 通道' }
    } else {
      Write-Ok 'edge-tts 已就绪'
    }
  } else {
    Write-Warn '未检测到 Python：Edge TTS 需要 Python 3.9+（pip install edge-tts）。可改选 VOICEVOX 公共 API 通道（无需 Python）'
  }
}

# ---------- 交互菜单 ----------
function Select-Options {
  param([string]$DshHome)
  $profile = ''
  $channel = ''
  Write-Host '============================================' -ForegroundColor Cyan
  Write-Host '  Amadeus for DSH - 安装' -ForegroundColor Cyan
  Write-Host '============================================' -ForegroundColor Cyan
  Write-Host ''
  $profilesDir = Join-Path $DshHome 'profiles'
  $known = @()
  if (Test-Path (Join-Path $profilesDir 'desktop')) { $known += 'desktop' }
  if (Test-Path (Join-Path $profilesDir 'web')) { $known += 'web' }
  if ($known.Count -eq 0) { throw "未找到 $profilesDir" }
  if ($known.Count -eq 1) {
    $profile = $known[0]
    Write-Info "检测到 profile：$profile"
  } else {
    $sel = (Read-Host "安装到哪个 profile？ [${known}]（默认 $($known[0])）").Trim()
    $sel = if ($sel -eq '') { $known[0] } else { $sel }
    if ($known -notcontains $sel) { Write-Fail "无效 profile：$sel"; exit 1 }
    $profile = $sel
  }
  Write-Host '  [0] Edge TTS（云端快速，默认推荐）'
  Write-Host '  [1] VOICEVOX 公共 API（云端备用）'
  Write-Host '  [2] 仅安装 / 更新插件'
  Write-Host ''
  $ch = (Read-Host '请选择 [0/1/2]').Trim()
  switch ($ch) {
    '0' { Write-Ok '已选择：Edge TTS'; $channel = 'edge' }
    '1' { Write-Ok '已选择：VOICEVOX 公共 API'; $channel = 'quest' }
    '2' { Write-Ok '已选择：仅安装/更新插件'; $channel = '' }
    default { Write-Fail '无效选择，请重试。'; exit 1 }
  }
  return @($profile, $channel)
}

# ---------- 主流程 ----------
Write-Host ''
Write-Host '== Amadeus for DSH 安装/管理 ==' -ForegroundColor Cyan
$dshHome = Get-DshHome
Write-Host "DSH 配置目录：$dshHome" -ForegroundColor Gray
if (-not (Test-Path (Join-Path $dshHome 'profiles'))) {
  Write-Fail "未找到 DSH 配置目录：$dshHome\profiles"
  throw '请先安装并启动过一次 DeepSeek Harness'
}
if (-not (Get-Command dsh -ErrorAction SilentlyContinue)) {
  Write-Fail '未找到 dsh 命令：请安装 DSH 并确保 dsh 在 PATH 中（DSH Desktop 自带，普通安装见官方文档）'
  throw 'dsh not found'
}
if ($TargetProfile -eq '' -and -not $Uninstall) {
  $opts = Select-Options -DshHome $dshHome
  $script:TargetProfile = $opts[0]
  $script:Channel = $opts[1]
} else {
  $script:TargetProfile = Select-TargetProfile -DshHome $dshHome -Forced $TargetProfile
}

if ($Uninstall) {
  Write-Info "[卸载] dsh plugin --profile $script:TargetProfile remove amadeus-for-dsh …"
  & dsh plugin --profile $script:TargetProfile remove amadeus-for-dsh
  Clear-LegacyArtifacts -DshHome $dshHome
  Write-Ok "已从 $script:TargetProfile 卸载（运行数据保留在 $dshHome\amadeus，如需彻底清除请手动删除）"
  Write-Host '重启 DSH 后生效。'
  exit 0
}

# 1. 本地模式：确保静态包齐备（源码仓库缺包时自动构建）
$isOnline = ($null -eq $PSScriptRoot) -or -not (Test-Path (Join-Path $PSScriptRoot 'host.mjs'))
if (-not $isOnline -and -not (Test-Path (Join-Path $PSScriptRoot 'host.mjs'))) {
  if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Info '检测到 node，尝试构建静态包…'
    & node (Join-Path $PSScriptRoot 'tools\build_static.mjs')
    if ($LASTEXITCODE -ne 0) { throw 'build_static.mjs 失败' }
    if (-not (Test-Path (Join-Path $PSScriptRoot 'client.js'))) {
      & node (Join-Path $PSScriptRoot 'tools\build_client.mjs')
      if ($LASTEXITCODE -ne 0) { throw 'build_client.mjs 失败' }
    }
  } elseif (-not $isOnline) {
    throw "缺少 host.mjs 且找不到 node：请从完整发行包或源码运行"
  }
}

# 2. 清理旧痕迹（幂等）
Clear-LegacyArtifacts -DshHome $dshHome

# 3. dsh plugin add（在线=GitHub 源；本地=link 本目录）
$spec = if ($isOnline) { $GithubRepo } else { 'link:' + $PSScriptRoot }
Write-Info "[1/4] dsh plugin --profile $script:TargetProfile add $spec …"
& dsh plugin --profile $script:TargetProfile add $spec
if ($LASTEXITCODE -ne 0) {
  Write-Fail 'dsh plugin add 失败（可能需要 pnpm：corepack enable 或 npm i -g pnpm）'
  exit 1
}

# 4. 运行数据 + TTS 通道 + 依赖
$seedCandidates = @(
  (Join-Path $dshHome "profiles\$script:TargetProfile\node_modules\amadeus-for-dsh\config\amadeus.json"),
  (Join-Path $dshHome "profiles\web\node_modules\amadeus-for-dsh\config\amadeus.json")
)
$seedConfig = $seedCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
Write-Info '[2/4] 初始化运行数据目录（配置/记忆/临时）…'
Init-DataDirs -DshHome $dshHome -SeedConfig $seedConfig
Write-Info '[3/4] 检查 TTS 依赖…'
Ensure-TtsDeps
Write-Info '[4/4] 完成'

Write-Host ''
Write-Ok '安装完成！'
Write-Host "  · 已写入 profile 依赖并自动加入 bundles（dsh.profile.bundles）：$script:TargetProfile"
Write-Host "  · 重启 DSH 后，Amadeus 对该 profile 的所有会话自动加载（右侧栏出现翻盖手机面板）。"
Write-Host "  · 数据目录：$dshHome\amadeus（配置/记忆/临时，升级不丢）"
Write-Host '  · 卸载：本脚本加 -Uninstall 参数，或 dsh plugin --profile <p> remove amadeus-for-dsh'