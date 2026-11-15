# Install the standalone CLI. Set $env:RUNE_SERVER to also install the Paper plugin.
# Optional: RUNE_VERSION pins a release; RUNE_NO_PATH=1 skips PATH setup.

& {
    $ErrorActionPreference = "Stop"

    function Write-Info($Message) {
        Write-Host "[rune] $Message" -ForegroundColor Cyan
    }

    if ($env:PROCESSOR_ARCHITECTURE -ne "AMD64") {
        throw "No prebuilt Rune CLI for $env:PROCESSOR_ARCHITECTURE. Windows x64 is supported."
    }
    $platform = "windows-x64"
    $repo = "Rune-MC/rune"
    $releasePath = if ($env:RUNE_VERSION) { "tags/$env:RUNE_VERSION" } else { "latest" }
    try {
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/$releasePath" -UseBasicParsing
    } catch {
        throw "Couldn't fetch the Rune release from GitHub ($releasePath). $_"
    }
    if (-not $release.tag_name) {
        throw "GitHub's release response did not contain a tag."
    }
    $version = $release.tag_name -replace '^v', ''

    function Install-Asset($Name, $Destination) {
        $asset = $release.assets | Where-Object { $_.name -eq $Name } | Select-Object -First 1
        if (-not $asset) {
            throw "Release $($release.tag_name) has no asset named $Name."
        }
        [IO.Directory]::CreateDirectory((Split-Path -Parent $Destination)) | Out-Null
        $tempFile = "$Destination.$([Guid]::NewGuid().ToString('N')).download"
        try {
            Write-Info "Downloading $Name"
            Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $tempFile -UseBasicParsing
            if ((Get-Item -LiteralPath $tempFile).Length -eq 0) {
                throw "Download was empty for $Name."
            }
            if ([IO.File]::Exists($Destination)) {
                Move-Item -LiteralPath $tempFile -Destination $Destination -Force
            } else {
                [IO.File]::Move($tempFile, $Destination)
            }
        } finally {
            if ([IO.File]::Exists($tempFile)) {
                Remove-Item -LiteralPath $tempFile -Force
            }
        }
    }

    $cliBin = if ($env:RUNE_BIN_DIR) {
        $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($env:RUNE_BIN_DIR)
    } else {
        Join-Path $env:LOCALAPPDATA "Programs\rune\bin"
    }
    $cliDest = Join-Path $cliBin "rune.exe"
    Install-Asset "rune-cli-$version-$platform.exe" $cliDest
    Write-Info "CLI installed at $cliDest"

    if (-not $env:RUNE_BIN_DIR -and $env:RUNE_NO_PATH -ne "1") {
        $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
        if (($userPath -split ';') -notcontains $cliBin) {
            $newUserPath = if ($userPath) { "$userPath;$cliBin" } else { $cliBin }
            [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
        }
        if (($env:Path -split ';') -notcontains $cliBin) {
            $env:Path = "$env:Path;$cliBin"
        }
    }

    if ($env:RUNE_SERVER) {
        if (-not (Test-Path -LiteralPath $env:RUNE_SERVER -PathType Container)) {
            throw "Server folder does not exist: $env:RUNE_SERVER. The CLI is installed."
        }
        $serverPath = (Resolve-Path -LiteralPath $env:RUNE_SERVER).ProviderPath
        $pluginsDir = Join-Path $serverPath "plugins"
        $pluginName = "rune-$version-$platform.jar"
        $pluginDest = Join-Path $pluginsDir $pluginName
        Install-Asset $pluginName $pluginDest
        Get-ChildItem -LiteralPath $pluginsDir -Filter "rune-*-$platform.jar" -File |
            Where-Object { $_.FullName -ne $pluginDest } |
            ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }
        Write-Info "Plugin installed at $pluginDest. Restart Paper to load Rune."
    } else {
        Write-Info 'Run rune --help to get started. Set $env:RUNE_SERVER to also install the Paper plugin.'
    }
}
