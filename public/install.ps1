# Rune one-line installer (Windows).
#
#   irm runemc.dev/install.ps1 | iex
#
# What this does:
#   1. Fetches the latest Rune release from GitHub.
#   2. Asks where your Minecraft server lives + sanity-checks the folder.
#   3. Drops the Rune plugin jar into <server>/plugins/.
#   4. Installs the `rune` CLI to %LOCALAPPDATA%\Programs\rune\bin and adds
#      it to the user PATH (HKCU). New terminals will pick it up.
#   5. Optionally starts the server using whatever start script you have
#      (start.ps1, start.bat, run.bat, run.ps1).
#
# Env overrides:
#   RUNE_VERSION   — pin a specific release tag (e.g. v0.2.0). Default: latest.
#   RUNE_SERVER    — server directory; skips the prompt when set.
#   RUNE_NO_PATH   — set to 1 to skip the user-PATH modification.

$ErrorActionPreference = "Stop"

# ----- pretty output -------------------------------------------------------
function Info($msg) { Write-Host "[rune] $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "[rune] $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "[rune] $msg" -ForegroundColor Yellow }
function Err($msg)  { Write-Host "[rune] $msg" -ForegroundColor Red }

# Read-Host works even under `irm | iex` because PowerShell's host reads
# from the console UI directly, not the pipeline stdin we just consumed.
function Prompt-Line($question, $default = "") {
    # `${question}` (not `$question`) so PowerShell doesn't parse the
    # trailing `:` as the start of a PSDrive specifier (`$env:PATH` syntax).
    if ($default) { $q = "${question} [$default]: " } else { $q = "${question}: " }
    $ans = Read-Host -Prompt $q
    if ([string]::IsNullOrWhiteSpace($ans)) { return $default }
    return $ans
}
function Prompt-YesNo($question, $defaultYes = $true) {
    $hint = if ($defaultYes) { "[Y/n]" } else { "[y/N]" }
    $ans  = (Read-Host -Prompt "$question $hint").Trim().ToLower()
    if ($ans -eq "") { return $defaultYes }
    return ($ans -eq "y" -or $ans -eq "yes")
}

# Architecture check. We only ship x64 binaries today; everything else
# bails with a clear pointer rather than half-installing.
$arch = $env:PROCESSOR_ARCHITECTURE
if ($arch -ne "AMD64") {
    Err "Unsupported architecture: $arch. Rune currently ships x64 only."
    Err "Open an issue if you need arm64: https://github.com/Rune-MC/rune/issues"
    exit 1
}
$platformSuffix = "windows-x64"

# ----- 1. Resolve release --------------------------------------------------
$repo = "Rune-MC/rune"
$tag  = $env:RUNE_VERSION
if (-not $tag) {
    Info "Looking up latest Rune release..."
    try {
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/latest" -UseBasicParsing
    } catch {
        Err "Couldn't reach GitHub: $_"
        exit 1
    }
} else {
    Info "Fetching release $tag..."
    try {
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/tags/$tag" -UseBasicParsing
    } catch {
        Err "Couldn't find release $tag in $repo : $_"
        exit 1
    }
}
$tag = $release.tag_name
$version = $tag -replace '^v',''
Ok "Release $tag selected."

$pluginAsset = $release.assets | Where-Object { $_.name -eq "rune-${version}-${platformSuffix}.jar" } | Select-Object -First 1
$cliAsset    = $release.assets | Where-Object { $_.name -eq "rune-cli-${version}-${platformSuffix}.exe" } | Select-Object -First 1
if (-not $pluginAsset) {
    Err "Release $tag has no plugin jar for $platformSuffix."
    Err "Expected asset: rune-${version}-${platformSuffix}.jar"
    exit 1
}
if (-not $cliAsset) {
    Err "Release $tag has no CLI binary for $platformSuffix."
    Err "Expected asset: rune-cli-${version}-${platformSuffix}.exe"
    exit 1
}

# ----- 2. Pick & validate server dir ---------------------------------------
$serverPath = $env:RUNE_SERVER
if (-not $serverPath) {
    Write-Host ""
    $serverPath = Prompt-Line "Path to your Minecraft server folder" (Get-Location).Path
}
try {
    $serverPath = (Resolve-Path -Path $serverPath -ErrorAction Stop).Path
} catch {
    Err "That folder doesn't exist: $serverPath"
    exit 1
}

function Test-IsMinecraftServer($dir) {
    if (Test-Path (Join-Path $dir "server.properties")) { return $true }
    if (Test-Path (Join-Path $dir "eula.txt"))          { return $true }
    $candidates = @("server.jar","paper.jar","purpur.jar","spigot.jar","folia.jar")
    foreach ($c in $candidates) {
        if (Test-Path (Join-Path $dir $c)) { return $true }
    }
    # Globs: paper-1.21.4-123.jar, purpur-...jar, etc.
    foreach ($pat in @("paper-*.jar","purpur-*.jar","spigot-*.jar","folia-*.jar")) {
        if (Get-ChildItem -Path $dir -Filter $pat -ErrorAction SilentlyContinue) { return $true }
    }
    return $false
}

if (-not (Test-IsMinecraftServer $serverPath)) {
    Warn "$serverPath doesn't look like a Minecraft server folder."
    Warn "  (no server.properties / eula.txt / paper*.jar / etc.)"
    if (-not (Prompt-YesNo "Install Rune there anyway?" $false)) {
        Err "Aborted."
        exit 1
    }
}
Ok "Server folder: $serverPath"

# ----- 3. Download plugin jar -> plugins/ ----------------------------------
$pluginsDir = Join-Path $serverPath "plugins"
New-Item -ItemType Directory -Path $pluginsDir -Force | Out-Null
$pluginDest = Join-Path $pluginsDir $pluginAsset.name
Info "Downloading $($pluginAsset.name) ($([math]::Round($pluginAsset.size / 1MB, 1)) MB)..."
Invoke-WebRequest -Uri $pluginAsset.browser_download_url -OutFile $pluginDest -UseBasicParsing
Ok "Plugin installed -> $pluginDest"

# Clean up older rune-*.jars in plugins/ so duplicate versions don't both
# load. We only touch files matching `rune-*-windows-x64.jar` to avoid
# nuking unrelated plugins that happen to start with "rune".
Get-ChildItem -Path $pluginsDir -Filter "rune-*-windows-x64.jar" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -ne $pluginDest } |
    ForEach-Object {
        Info "Removing older plugin: $($_.Name)"
        Remove-Item -Path $_.FullName -Force
    }

# ----- 4. Install CLI + PATH -----------------------------------------------
$cliRoot = Join-Path $env:LOCALAPPDATA "Programs\rune"
$cliBin  = Join-Path $cliRoot "bin"
New-Item -ItemType Directory -Path $cliBin -Force | Out-Null
$cliDest = Join-Path $cliBin "rune.exe"
Info "Downloading $($cliAsset.name) ($([math]::Round($cliAsset.size / 1MB, 1)) MB)..."
Invoke-WebRequest -Uri $cliAsset.browser_download_url -OutFile $cliDest -UseBasicParsing
Ok "CLI installed -> $cliDest"

if ($env:RUNE_NO_PATH -ne "1") {
    # SetEnvironmentVariable("User") modifies HKCU\Environment AND broadcasts
    # WM_SETTINGCHANGE so new processes pick it up. The current session's
    # $env:Path is a snapshot — we update it too so the user can invoke
    # `rune` immediately if they `iex` and then keep going in the same shell.
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if (-not $userPath) { $userPath = "" }
    $segments = $userPath.Split(';') | Where-Object { $_ -ne "" }
    if ($segments -notcontains $cliBin) {
        $newUserPath = if ($userPath -eq "") { $cliBin } else { "$userPath;$cliBin" }
        [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
        Ok "Added $cliBin to your user PATH."
        Warn "Open a new terminal for the change to take effect in other apps."
        # Patch the current session so this terminal works immediately.
        if (($env:Path.Split(';')) -notcontains $cliBin) {
            $env:Path = "$env:Path;$cliBin"
        }
    } else {
        Info "$cliBin already on PATH."
    }
} else {
    Info "RUNE_NO_PATH=1: skipping PATH modification."
}

# ----- 5. Offer to start the server ----------------------------------------
Write-Host ""
if (-not (Prompt-YesNo "Start the server now so Rune can generate its config + scripts dir?" $true)) {
    Ok "All done. Start your server whenever you're ready."
    Write-Host ""
    Write-Host "  Plugin:   $pluginDest"
    Write-Host "  CLI:      $cliDest  (rune --help)"
    exit 0
}

# Scan for a start script in priority order. We don't auto-detect plain
# `java -jar` invocations because there's no portable way to know what
# args/Xmx the user wants. If we can't find a script, surface the standard
# fallback instead of guessing.
$scriptCandidates = @("start.ps1","start.bat","run.bat","run.ps1","start.cmd","run.cmd")
$startScript = $null
foreach ($name in $scriptCandidates) {
    $candidate = Join-Path $serverPath $name
    if (Test-Path $candidate) {
        $startScript = $candidate
        break
    }
}

if (-not $startScript) {
    Warn "Couldn't find a start script in $serverPath."
    Warn "Tried: $($scriptCandidates -join ', ')"
    Write-Host ""
    Write-Host "Start it manually with something like:"
    Write-Host "  cd `"$serverPath`""
    Write-Host "  java -Xms2G -Xmx2G -jar paper.jar nogui"
    exit 0
}

Info "Starting server with $(Split-Path -Leaf $startScript) (Ctrl+C to stop)..."
Push-Location $serverPath
try {
    if ($startScript -like "*.ps1") {
        & powershell -ExecutionPolicy Bypass -File $startScript
    } else {
        & cmd /c $startScript
    }
} finally {
    Pop-Location
}
