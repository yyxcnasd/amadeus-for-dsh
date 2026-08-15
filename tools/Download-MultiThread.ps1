# Amadeus for DSH - robust multi-threaded download helper with integrity check
# Usage:
#   . "$PSScriptRoot\Download-MultiThread.ps1"
#   Start-MultiThreadDownload -Url "..." -OutFile "..." -Threads 8 -VerifyZip

function Test-ZipFile {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return $false }
  try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction Stop
    $zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
    $zip.Dispose()
    return $true
  } catch {
    return $false
  }
}

function Start-MultiThreadDownload {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [Parameter(Mandatory = $true)][string]$OutFile,
    [int]$Threads = 8,
    [switch]$VerifyZip
  )

  if (Test-Path $OutFile) {
    if ($VerifyZip) {
      if (Test-ZipFile -Path $OutFile) {
        Write-Host "Already downloaded and verified: $OutFile" -ForegroundColor DarkGray
        return
      }
      Write-Host "Existing file is corrupt, redownloading: $OutFile" -ForegroundColor Yellow
      Remove-Item -Force $OutFile
    } else {
      Write-Host "Already downloaded: $OutFile" -ForegroundColor DarkGray
      return
    }
  }

  # Get total size
  $total = 0L
  try {
    $head = [System.Net.HttpWebRequest]::Create($Url)
    $head.Method = 'HEAD'
    $head.UserAgent = 'Amadeus-DSH'
    $head.Timeout = 15000
    $resp = $head.GetResponse()
    $total = [long]$resp.ContentLength
    $resp.Close()
  } catch {
    $total = 0
  }

  if ($total -le 0) {
    Write-Host 'Server does not provide file size, fallback to single stream...' -ForegroundColor Yellow
    Invoke-WebRequest -Uri $Url -OutFile $OutFile -UseBasicParsing
    if ($VerifyZip -and -not (Test-ZipFile -Path $OutFile)) {
      throw "Downloaded file is corrupt: $OutFile"
    }
    return
  }

  $partDir = $OutFile + '.parts'
  if (Test-Path $partDir) { Remove-Item -Recurse -Force $partDir }
  New-Item -ItemType Directory -Force -Path $partDir | Out-Null

  $chunk = [math]::Ceiling($total / $Threads)
  $jobs = @()
  $expected = @()

  Write-Host "Multi-thread download: $Threads threads, $([math]::Round($total / 1MB, 1)) MB" -ForegroundColor Cyan

  for ($i = 0; $i -lt $Threads; $i++) {
    $start = [long]($i * $chunk)
    $end = [long][math]::Min($total - 1, ($i + 1) * $chunk - 1)
    if ($start -gt $end) { continue }
    $part = Join-Path $partDir ("part-{0:D3}" -f $i)
    $expected += , @{ Index = $i; Start = $start; End = $end; Path = $part; Length = $end - $start + 1 }
    $script = {
      param($u, $s, $e, $o)
      $req = [System.Net.HttpWebRequest]::Create($u)
      $req.UserAgent = 'Amadeus-DSH'
      $req.AddRange([long]$s, [long]$e)
      $req.Timeout = 120000
      $resp = $req.GetResponse()
      try {
        if ($resp.StatusCode -ne [System.Net.HttpStatusCode]::PartialContent) {
          throw "Range not supported: $($resp.StatusCode)"
        }
        $in = $resp.GetResponseStream()
        $out = [System.IO.File]::Create($o)
        try {
          $in.CopyTo($out)
        } finally {
          $out.Close()
          $in.Close()
        }
      } finally {
        $resp.Close()
      }
    }
    $jobs += Start-Job -ScriptBlock $script -ArgumentList $Url, $start, $end, $part
  }

  $jobs | Wait-Job | Out-Null
  $failed = $jobs | Where-Object { $_.State -ne 'Completed' }
  $jobs | Remove-Job -Force

  $ok = $true
  if ($failed) { $ok = $false }
  if ($ok) {
    foreach ($item in $expected) {
      if (-not (Test-Path $item.Path)) { $ok = $false; break }
      $len = (Get-Item $item.Path).Length
      if ($len -ne $item.Length) {
        Write-Host "Part $($item.Index) size mismatch: expected $($item.Length), got $len" -ForegroundColor Yellow
        $ok = $false
        break
      }
    }
  }

  if (-not $ok) {
    Write-Host 'Multi-thread download failed, falling back to single stream...' -ForegroundColor Yellow
    if (Test-Path $partDir) { Remove-Item -Recurse -Force $partDir }
    Invoke-WebRequest -Uri $Url -OutFile $OutFile -UseBasicParsing
    if ($VerifyZip -and -not (Test-ZipFile -Path $OutFile)) {
      throw "Downloaded file is corrupt: $OutFile"
    }
    return
  }

  # Combine parts
  $fs = [System.IO.File]::OpenWrite($OutFile)
  try {
    foreach ($item in $expected) {
      $bytes = [System.IO.File]::ReadAllBytes($item.Path)
      $fs.Write($bytes, 0, $bytes.Length)
    }
  } finally {
    $fs.Close()
  }

  Remove-Item -Recurse -Force $partDir

  $actual = (Get-Item $OutFile).Length
  if ($actual -ne $total) {
    Write-Host "File size mismatch after merge: expected $total, got $actual" -ForegroundColor Yellow
    Remove-Item -Force $OutFile -ErrorAction SilentlyContinue
    Invoke-WebRequest -Uri $Url -OutFile $OutFile -UseBasicParsing
  }

  if ($VerifyZip) {
    if (-not (Test-ZipFile -Path $OutFile)) {
      Remove-Item -Force $OutFile -ErrorAction SilentlyContinue
      throw "Downloaded zip is corrupt: $OutFile"
    }
    Write-Host 'Zip integrity verified.' -ForegroundColor Green
  }

  Write-Host "Download complete: $OutFile" -ForegroundColor Green
}
