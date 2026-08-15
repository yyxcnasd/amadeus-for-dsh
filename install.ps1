#requires -Version 5.1
# ============================================================
# Amadeus for DSH — 一键安装 / 更新 / 卸载脚本（任何人可用）
#
# 三种用法：
#   1) 在线一行命令（无需下载任何文件）：
#        powershell -ExecutionPolicy Bypass -c "irm https://raw.githubusercontent.com/yyxcnasd/amadeus-for-dsh/main/install.ps1 | iex"
#   2) 本地：解压发行版 zip 后，双击 Amadeus-OneClick.bat （或直接运行本脚本）
#   3) 仓库开发者：直接在源码目录运行本脚本（自动先构建静态包）
#
# 参数：
#   -Channel edge|quest   非交互指定 TTS 通道（edge=Edge TTS 默认 / quest=VOICEVOX 公共 API）
#   -Uninstall            卸载插件（保留你的配置与记忆数据）
#
# 安装到：$env:DSH_HOME（默认 ~/.dsh）
#   插件本体 → profiles\node_modules\amadeus-for-dsh
#   运行数据 → ~/.dsh\amadeus\{config,memory,tmp}　（重装/升级不丢失）
# ============================================================
[CmdletBinding()]
param(
  [ValidateSet('edge', 'quest', 'none', '')]
  [string]$Channel = '',
  [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'

# GitHub 发布信息（发布时按实际情况修改）
$GithubOwner = 'yyxcnasd'
$GithubRepo = 'amadeus-for-dsh'
$ReleaseZipUrl = "https://github.com/$GithubOwner/$GithubRepo/releases/latest/download/Amadeus-for-DSH.zip"

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

# ---------- 在线模式自举：下载 release zip → 解压 → 以内置副本重新安装 ----------
function Invoke-OnlineBootstrap {
  Write-Info '== 在线模式：下载 Amadeus 发行包 …'
  $stage = Join-Path $env:TEMP ('amadeus-for-dsh-online-' + [guid]::NewGuid().ToString('N'))
  $zip = Join-Path $stage 'Amadeus-for-DSH.zip'
  New-Item -ItemType Directory -Force -Path $stage | Out-Null
  try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $ReleaseZipUrl -OutFile $zip -UseBasicParsing
  } catch {
    Write-Fail "下载失败：$($_.Exception.Message)"
    Write-Fail "请检查网络，或手动下载 $ReleaseZipUrl 解压后运行 Amadeus-OneClick.bat"
    throw
  }
  $extract = Join-Path $stage 'extract'
  Expand-Archive -Path $zip -DestinationPath $extract -Force
  $inner = Join-Path $extract 'Amadeus-for-DSH'
  if (-not (Test-Path (Join-Path $inner 'package\host.mjs'))) {
    # 包内容若直接散在解压根目录
    if (Test-Path (Join-Path $extract 'package\host.mjs')) { $inner = $extract }
  }
  if (-not (Test-Path (Join-Path $inner 'install.ps1'))) {
    Write-Fail '下载的包不完整（缺少 install.ps1 / package/host.mjs）'
    throw
  }
  if ($Uninstall) {
    & (Join-Path $inner 'install.ps1') -Uninstall
  } elseif ($Channel -ne '') {
    & (Join-Path $inner 'install.ps1') -Channel $Channel
  } else {
    & (Join-Path $inner 'install.ps1')
  }
  $code = $LASTEXITCODE
  Remove-Item -Recurse -Force $stage -ErrorAction SilentlyContinue
  exit $code
}

# ---------- 交互菜单（在线一行命令默认走这里） ----------
function Select-Channel {
  if ($Channel -ne '') { return $Channel }
  Write-Host ''
  Write-Host '============================================' -ForegroundColor Cyan
  Write-Host '  Amadeus for DSH - 一键安装' -ForegroundColor Cyan
  Write-Host '============================================' -ForegroundColor Cyan
  Write-Host ''
  Write-Host '   [0] Edge TTS（云端快速，默认推荐）'
  Write-Host '   [1] VOICEVOX 公共 API（云端备用）'
  Write-Host '   [2] 仅安装 / 更新插件'
  Write-Host ''
  $ch = (Read-Host '请选择 [0/1/2]').Trim()
  switch ($ch) {
    '0' { Write-Ok '已选择：Edge TTS'; return 'edge' }
    '1' { Write-Ok '已选择：VOICEVOX 公共 API'; return 'quest' }
    '2' { Write-Ok '已选择：仅安装/更新插件'; return '' }
    default { Write-Fail '无效选择，请重试。'; exit 1 }
  }
}

# ---------- 复制目录树（优先 robocopy，缺失时退回 Copy-Item） ----------
function Copy-Tree {
  param([string]$Src, [string]$Dst, [string[]]$ExcludeDirs, [string[]]$ExcludeFiles)
  if (Get-Command robocopy -ErrorAction SilentlyContinue) {
    $roArgs = @($Src, $Dst, '/E', '/NFL', '/NDL', '/NJH', '/NJS', '/NP')
    foreach ($d in $ExcludeDirs) { $roArgs += @('/XD', $d) }
    foreach ($f in $ExcludeFiles) { $roArgs += @('/XF', $f) }
    & robocopy @roArgs | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "robocopy 失败（$LASTEXITCODE）" }
    return
  }
  New-Item -ItemType Directory -Force -Path $Dst | Out-Null
  Get-ChildItem -Path $Src -Force | ForEach-Object {
    if ($ExcludeDirs -contains $_.Name) { return }
    if ($_.PSIsContainer) {
      Copy-Tree -Src $_.FullName -Dst (Join-Path $Dst $_.Name) -ExcludeDirs $ExcludeDirs -ExcludeFiles $ExcludeFiles
    } elseif ($ExcludeFiles -notcontains $_.Name) {
      Copy-Item -Force $_.FullName (Join-Path $Dst $_.Name)
    }
  }
}

# ---------- 安装主体 ----------
function Install-Plugins {
  param([string]$Src, [string]$DshHome)
  $installDir = Join-Path $DshHome 'profiles\node_modules\amadeus-for-dsh'
  $patchYml = Join-Path $DshHome 'profiles\web\cordis.patch.yml'
  $presetYml = Join-Path $DshHome '.agent-presets\anchored-standard\agent.cordis.yml'
  $dataDir = Join-Path $DshHome 'amadeus'

  if (-not (Test-Path (Join-Path $DshHome 'profiles'))) {
    Write-Fail "未找到 DSH 配置目录：$DshHome\profiles"
    Write-Fail '请先安装并启动过一次 DeepSeek Harness（或设置 DSH_HOME 环境变量指向配置目录）'
    throw 'DSH 配置目录不存在'
  }

  # 1. 静态包齐备性（源码仓库模式：缺包时尝试构建）
  if (-not (Test-Path (Join-Path $Src 'package\host.mjs'))) {
    Write-Fail '缺少 package/host.mjs（这不是完整发行包或源码未构建）'
    if (Get-Command node -ErrorAction SilentlyContinue) {
      Write-Info '检测到 node，尝试构建静态包…'
      & node (Join-Path $Src 'tools\build_static.mjs')
      if ($LASTEXITCODE -ne 0) { throw 'build_static.mjs 失败' }
      & node (Join-Path $Src 'tools\build_client.mjs')
      if ($LASTEXITCODE -ne 0) { throw 'build_client.mjs 失败' }
    } else {
      throw '缺少 node 且发行包不完整'
    }
  }

  Write-Info '[1/4] 安装插件到 profiles\node_modules\amadeus-for-dsh …'
  if (Test-Path $installDir) { Remove-Item -Recurse -Force $installDir }
  New-Item -ItemType Directory -Force -Path $installDir | Out-Null
  Copy-Tree -Src $Src -Dst $installDir `
    -ExcludeDirs @('node_modules', '.git', 'memory', 'tmp', '__pycache__', 'docs', 'research') `
    -ExcludeFiles @('*.pyc')
  # 清理可能带进来的符号链接
  $nm = Join-Path $installDir 'package\node_modules'
  if (Test-Path $nm) { Remove-Item -Recurse -Force $nm }

  # 2. 运行数据目录 + 配置文件
  Write-Info '[2/4] 初始化运行数据目录（配置/记忆/临时）…'
  foreach ($d in @('config', 'memory', 'tmp')) {
    New-Item -ItemType Directory -Force -Path (Join-Path $dataDir $d) | Out-Null
  }
  $dataConfig = Join-Path $dataDir 'config\amadeus.json'
  if (-not (Test-Path $dataConfig)) {
    $seed = Join-Path $Src 'config\amadeus.json'
    if (Test-Path $seed) { Copy-Item -Force $seed $dataConfig }
  }
  if ($script:Channel -ne '') {
    if (Test-Path $dataConfig) {
      try {
        $cfg = Get-Content -Raw -Encoding UTF8 $dataConfig | ConvertFrom-Json
        $cfg.provider = $script:Channel
        [System.IO.File]::WriteAllText($dataConfig, ($cfg | ConvertTo-Json -Depth 10), (New-Object System.Text.UTF8Encoding $false))
        Write-Ok "TTS 通道已设为：$($script:Channel)"
      } catch {
        Write-Warn "更新配置通道失败（不影响安装）：$($_.Exception.Message)"
      }
    } else {
      $cfg = @{ provider = $script:Channel }
      [System.IO.File]::WriteAllText($dataConfig, ($cfg | ConvertTo-Json -Depth 10), (New-Object System.Text.UTF8Encoding $false))
      Write-Ok "TTS 通道已设为：$($script:Channel)"
    }
  }

  # 3. 主机组合补丁层插入 amadeus 行（幂等 + 自动备份）
  Write-Info '[3/4] 写入主机补丁层 cordis.patch.yml …'
  if (-not (Test-Path $patchYml)) {
    [System.IO.File]::WriteAllText($patchYml, "# Your patch layer for this dsh profile, applied after every bundle layer:`r`n[]`r`n", (New-Object System.Text.UTF8Encoding $true))
    Write-Warn '补丁层文件不存在，已重建默认空文件'
  }
  $yml = Get-Content -Raw -Encoding UTF8 $patchYml
  if ($yml -notmatch 'id: amadeus\b') {
    Copy-Item $patchYml ($patchYml + '.bak-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
    $row = @'

# ── Amadeus（牧濑红莉栖助手；由 install.ps1 管理） ─────────
- insert:
    - id: amadeus
      name: amadeus-for-dsh
'@
    [System.IO.File]::WriteAllText($patchYml, ($yml.TrimEnd() + $row), (New-Object System.Text.UTF8Encoding $true))
    Write-Ok '已在 cordis.patch.yml 插入 amadeus 行（原文件已备份为 .bak-*）'
  } else {
    Write-Ok 'amadeus 行已存在，跳过'
  }

  # 清理旧版预设行（避免双重加载）
  if (Test-Path $presetYml) {
    $py = Get-Content -Raw -Encoding UTF8 $presetYml
    if ($py -match 'id: amadeus\b') {
      $py = $py -replace "(?ms)\r?\n# ── Amadeus[^\r\n]*\r?\n- id: amadeus\s*\r?\n\s+name: [^\r\n]+", ''
      [System.IO.File]::WriteAllText($presetYml, $py, (New-Object System.Text.UTF8Encoding $true))
      Write-Ok '已移除预设中的旧 amadeus 行'
    }
  }

  # 4. 可选：确保 edge-tts 依赖（默认通道，best-effort）
  Write-Info '[4/4] 检查 Edge TTS 依赖（edge-tts）…'
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

  Write-Host ''
  Write-Ok '安装完成！'
  Write-Host '  · 重启 DSH（或在设置页手动重载）后，Amadeus 对所有会话自动加载。'
  Write-Host "  · 插件目录：$installDir"
  Write-Host "  · 数据目录：$dataDir（配置/记忆/临时，升级不丢）"
  Write-Host '  · 卸载：本脚本加 -Uninstall 参数，或删除 cordis.patch.yml 中的 amadeus insert 段 + 插件目录。'
}

# ---------- 卸载 ----------
function Uninstall-Plugins {
  param([string]$DshHome)
  $installDir = Join-Path $DshHome 'profiles\node_modules\amadeus-for-dsh'
  $patchYml = Join-Path $DshHome 'profiles\web\cordis.patch.yml'
  $dataDir = Join-Path $DshHome 'amadeus'

  if (Test-Path $patchYml) {
    $yml = Get-Content -Raw -Encoding UTF8 $patchYml
    $pattern = "(?ms)\r?\n# ── Amadeus[^\r\n]*\r?\n- insert:\r?\n\s+- id: amadeus\r?\n\s+name: [^\r\n]+"
    if ($yml -match $pattern) {
      Copy-Item $patchYml ($patchYml + '.bak-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
      $yml = $yml -replace $pattern, ''
      [System.IO.File]::WriteAllText($patchYml, ($yml.TrimEnd() + "`r`n"), (New-Object System.Text.UTF8Encoding $true))
      Write-Ok '已从 cordis.patch.yml 移除 amadeus 行（备份 .bak-*）'
    }
  }
  if (Test-Path $installDir) {
    Remove-Item -Recurse -Force $installDir
    Write-Ok "已删除插件目录：$installDir"
  }
  Write-Ok "运行数据保留在：$dataDir（如需彻底清除请手动删除）"
  Write-Host '重启 DSH 后生效。'
}

# ============================================================
# 主流程
# ============================================================
$script:Channel = $Channel
$isOnline = ($null -eq $PSScriptRoot) -or -not (Test-Path (Join-Path $PSScriptRoot 'package\host.mjs'))

if ($isOnline) {
  Invoke-OnlineBootstrap
}

Write-Host ''
Write-Host '== Amadeus for DSH 安装/管理 ==' -ForegroundColor Cyan
$dshHome = Get-DshHome
Write-Host "DSH 配置目录：$dshHome" -ForegroundColor Gray

if ($Uninstall) {
  Uninstall-Plugins -DshHome $dshHome
  exit 0
}

$effChannel = Select-Channel
$script:Channel = $effChannel
Install-Plugins -Src $PSScriptRoot -DshHome $dshHome