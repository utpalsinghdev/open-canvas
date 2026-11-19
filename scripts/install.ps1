<#
.SYNOPSIS
Installs Open Canvas for the current Windows user.

.DESCRIPTION
Downloads the release archive for this machine from GitHub over HTTPS, verifies its
SHA-256 checksum, extracts it into a staging directory, runs it once, and only then
switches the open-canvas command to it. Nothing needs administrator rights.

.PARAMETER Version
Install a specific release, for example v0.8.0. Defaults to the latest release.

.PARAMETER Archive
Install a trusted local archive. Its checksum must sit beside it as FILE.sha256.
#>
param(
  [string]$Version = '',
  [string]$Archive = ''
)

# Everything runs in a child scope so iex leaves no preferences or functions behind.
try {
  & {
    param([string]$Version, [string]$Archive)
    $ErrorActionPreference = 'Stop'

    function Fail([string]$Message) { throw "Open Canvas: $Message" }

    # Follow GitHub's redirects by hand so no hop can leave HTTPS.
    function Save-Https([string]$Url, [string]$File) {
      $uri = [Uri]$Url
      for ($hop = 0; $hop -le 5; $hop++) {
        if ($uri.Scheme -ne 'https') { Fail "Refusing a non-HTTPS download from $($uri.Host)." }
        $request = [Net.HttpWebRequest]::Create($uri)
        $request.AllowAutoRedirect = $false
        $request.Timeout = 30000
        $request.ReadWriteTimeout = 60000
        $request.UserAgent = 'open-canvas-installer'
        try { $response = $request.GetResponse() }
        catch [Net.WebException] { $response = $_.Exception.Response; if (-not $response) { return $false } }
        $status = [int]$response.StatusCode
        if ($status -ge 300 -and $status -lt 400) {
          $location = $response.Headers['Location']
          $response.Close()
          if (-not $location) { return $false }
          $uri = [Uri]::new($uri, $location)
          continue
        }
        if ($status -ne 200) { $response.Close(); return $false }
        $source = $response.GetResponseStream()
        $target = [IO.File]::Create($File)
        try { $source.CopyTo($target) } finally { $target.Dispose(); $source.Dispose(); $response.Close() }
        return $true
      }
      return $false
    }

    # The shim is ASCII and path-relative. Return the release id it selects, or $null for foreign files.
    function Get-ShimRelease([string]$Path) {
      if ((Get-Item -LiteralPath $Path).Length -gt 4096) { return $null }
      $lines = @([IO.File]::ReadAllLines($Path) | Where-Object { $_ })
      if ($lines.Count -lt 2 -or $lines[0] -ne '@rem open-canvas-shim') { return $null }
      if ($lines[-1] -cmatch '^"%~dp0\.\.\\releases\\([0-9a-f]{16})\\bin\\open-canvas\.cmd" %\*$') { return $Matches[1] }
      return $null
    }

    function Add-UserPath([string]$Directory) {
      $key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Environment', $true)
      try {
        $current = [string]$key.GetValue('Path', '', [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
        $entries = @($current -split ';' | Where-Object { $_ })
        $known = @($entries | ForEach-Object { [Environment]::ExpandEnvironmentVariables($_).TrimEnd('\') })
        if ($known -contains $Directory.TrimEnd('\')) { return }
        $kind = [Microsoft.Win32.RegistryValueKind]::ExpandString
        if ($key.GetValueNames() -contains 'Path') { $kind = $key.GetValueKind('Path') }
        $key.SetValue('Path', (($entries + $Directory) -join ';'), $kind)
      } finally { $key.Close() }
      try {
        # Tell running shells and Explorer that the environment changed.
        Add-Type -Namespace OpenCanvas -Name Native -MemberDefinition '[DllImport("user32.dll", CharSet = CharSet.Auto)] public static extern IntPtr SendMessageTimeout(IntPtr window, uint message, UIntPtr wParam, string lParam, uint flags, uint timeout, out UIntPtr result);'
        $result = [UIntPtr]::Zero
        [void][OpenCanvas.Native]::SendMessageTimeout([IntPtr]0xffff, 0x1A, [UIntPtr]::Zero, 'Environment', 2, 5000, [ref]$result)
      } catch { }
    }

    if ($Version -and $Archive) { Fail 'Use either -Version or -Archive, not both.' }
    if ($Version -and $Version -cnotmatch '^v[0-9]+\.[0-9]+\.[0-9]+$') { Fail 'Use -Version vX.Y.Z.' }
    if ($Archive) {
      if (-not (Test-Path -LiteralPath $Archive -PathType Leaf) -or -not (Test-Path -LiteralPath "$Archive.sha256" -PathType Leaf)) {
        Fail 'Provide the archive and its adjacent .sha256 file.'
      }
      $Archive = (Resolve-Path -LiteralPath $Archive).ProviderPath
    }
    if ([Environment]::OSVersion.Platform -ne 'Win32NT') { Fail 'This installer supports Windows. Use install.sh on macOS and Linux.' }
    $machine = if ($env:PROCESSOR_ARCHITEW6432) { $env:PROCESSOR_ARCHITEW6432 } else { $env:PROCESSOR_ARCHITECTURE }
    switch ($machine) {
      'AMD64' { $arch = 'x64' }
      'ARM64' { $arch = 'arm64' }
      default { Fail 'This installer supports x64 and arm64.' }
    }
    $tar = Join-Path $env:SystemRoot 'System32\tar.exe'
    if (-not (Test-Path -LiteralPath $tar)) { Fail 'Windows 10 version 1803 or later is required (tar.exe).' }
    if (-not $env:USERPROFILE) { Fail 'USERPROFILE is not set.' }
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

    $asset = "open-canvas-win32-$arch.tar.gz"
    $root = Join-Path $env:USERPROFILE '.open-canvas\install'
    $releases = Join-Path $root 'releases'
    $bin = Join-Path $root 'bin'
    $command = Join-Path $bin 'open-canvas.cmd'
    $expectedVersion = $Version.TrimStart('v')

    [void](New-Item -ItemType Directory -Force -Path $releases, $bin)
    if (Test-Path -LiteralPath $command) {
      if (-not (Get-ShimRelease $command)) { Fail "Will not replace $command." }
    }

    $stage = Join-Path $root ('.stage.' + [guid]::NewGuid().ToString('N').Substring(0, 8))
    [void](New-Item -ItemType Directory -Path $stage)
    try {
      if (-not $Archive) {
        $release = if ($Version) { "download/$Version" } else { 'latest/download' }
        $base = "https://github.com/utpalsinghdev/open-canvas/releases/$release"
        $Archive = Join-Path $stage $asset
        Write-Host "Downloading $asset..."
        $ok = $false
        try { $ok = Save-Https "$base/$asset" $Archive } catch { }
        if (-not $ok) { Fail 'Release archive unavailable. Check the GitHub Releases page.' }
        $ok = $false
        try { $ok = Save-Https "$base/$asset.sha256" "$Archive.sha256" } catch { }
        if (-not $ok) { Fail 'Release checksum unavailable.' }
      }

      $expected = ([string](Get-Content -LiteralPath "$Archive.sha256" -TotalCount 1) -split '\s+')[0]
      if ($expected -cnotmatch '^[a-f0-9]{64}$') { Fail 'Malformed release checksum.' }
      $actual = (Get-FileHash -LiteralPath $Archive -Algorithm SHA256).Hash.ToLowerInvariant()
      if ($actual -ne $expected) { Fail 'SHA-256 mismatch; existing installation was not changed.' }

      $id = $expected.Substring(0, 16)
      $target = Join-Path $releases $id
      $bundle = $target
      if (-not (Test-Path -LiteralPath $target)) { $bundle = Join-Path $stage 'bundle' }
      if ($bundle -ne $target) {
        [void](New-Item -ItemType Directory -Path $bundle)
        & $tar -xzf $Archive -C $bundle
        if ($LASTEXITCODE -ne 0) { Fail 'Could not extract the archive.' }
      }
      $launcher = Join-Path $bundle 'bin\open-canvas.cmd'
      $installed = & $launcher --version
      if ($LASTEXITCODE -ne 0 -or -not $installed) { Fail 'Bundle cannot run on this machine.' }
      $installed = ([string]($installed | Select-Object -First 1)).Trim()
      if ($Version -and $installed -ne $expectedVersion) { Fail 'Archive version does not match the requested tag.' }
      if ($bundle -ne $target) {
        # Antivirus scanners can briefly hold freshly written files, so retry the rename.
        for ($attempt = 1; ; $attempt++) {
          try { [IO.Directory]::Move($bundle, $target); break }
          catch {
            if (Test-Path -LiteralPath $target) { break }
            if ($attempt -ge 5) { Fail 'Could not store the verified archive.' }
            Start-Sleep -Seconds 1
          }
        }
      }

      $shim = Join-Path $stage 'open-canvas.cmd'
      $text = "@rem open-canvas-shim`r`n@echo off`r`nsetlocal`r`nset `"OPEN_CAVAS_COMMAND=%~f0`"`r`n`"%~dp0..\releases\$id\bin\open-canvas.cmd`" %*`r`n"
      [IO.File]::WriteAllText($shim, $text, [Text.Encoding]::ASCII)
      if (Test-Path -LiteralPath $command) { [IO.File]::Replace($shim, $command, $null) }
      else { [IO.File]::Move($shim, $command) }
    } finally {
      try { [IO.Directory]::Delete($stage, $true) } catch { }
    }

    Add-UserPath $bin
    if (($env:Path -split ';') -notcontains $bin) { $env:Path = "$env:Path;$bin" }
    Write-Host "Installed Open Canvas $installed. Run open-canvas to start."
    Write-Host 'Terminals that were already open need to be reopened to find the command.'
  } -Version $Version -Archive $Archive
} catch {
  $host.UI.WriteErrorLine($_.Exception.Message)
  if ($PSCommandPath) { exit 1 }
}
