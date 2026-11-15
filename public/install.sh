#!/usr/bin/env bash
# Install the standalone CLI. Set RUNE_SERVER to also install the Paper plugin.
# Optional: RUNE_VERSION=v0.4.4 to pin a release; RUNE_NO_PATH=1 to skip PATH setup.
set -euo pipefail

info() { printf '[rune] %s\n' "$*"; }
fail() { printf '[rune] %s\n' "$*" >&2; exit 1; }

case "$(uname -s):$(uname -m)" in
    Linux:x86_64)  platform=linux-x64 ;;
    Darwin:arm64)  platform=macos-arm64 ;;
    Darwin:x86_64) fail "Prebuilt macOS binaries require Apple Silicon." ;;
    *) fail "No prebuilt Rune CLI for this platform. Windows users can run: irm https://runemc.dev/install.ps1 | iex" ;;
esac
command -v curl >/dev/null 2>&1 || fail "Install curl and rerun the installer."

repo='Rune-MC/rune'
tag="${RUNE_VERSION:-}"
release_path='latest'
if [ -n "$tag" ]; then
    release_path="tags/$tag"
fi
release_json="$(curl -fsSL "https://api.github.com/repos/$repo/releases/$release_path")" \
    || fail "Couldn't fetch the Rune release from GitHub ($release_path)."

if command -v jq >/dev/null 2>&1; then
    tag="$(printf '%s\n' "$release_json" | jq -r '.tag_name // empty')"
else
    tag="$(printf '%s\n' "$release_json" \
        | { grep -oE '"tag_name"[[:space:]]*:[[:space:]]*"[^"]+"' || true; } \
        | sed -nE '1s/.*:[[:space:]]*"([^"]+)"/\1/p')"
fi
[ -n "$tag" ] || fail "GitHub's release response did not contain a tag."
version="${tag#v}"

asset_url() {
    local name="$1"
    if command -v jq >/dev/null 2>&1; then
        printf '%s\n' "$release_json" \
            | jq -r --arg name "$name" 'first(.assets[] | select(.name == $name) | .browser_download_url) // empty'
    else
        printf '%s\n' "$release_json" \
            | { grep -oE '"browser_download_url"[[:space:]]*:[[:space:]]*"[^"]+"' || true; } \
            | sed -nE 's/^"browser_download_url"[[:space:]]*:[[:space:]]*"([^"]+)"/\1/p' \
            | awk -F/ -v name="$name" '$NF == name && !found { print; found = 1 }'
    fi
}

# Download beside the destination so a failed download never replaces a working install.
temp_file=''
trap 'if [ -n "$temp_file" ]; then rm -f -- "$temp_file"; fi' EXIT
download() {
    local name="$1" dest="$2" mode="$3" url
    url="$(asset_url "$name")"
    [ -n "$url" ] || fail "Release $tag has no asset named $name."
    mkdir -p "$(dirname "$dest")"
    temp_file="$(mktemp "${dest}.XXXXXX")"
    info "Downloading $name"
    curl -fsSL "$url" -o "$temp_file" || fail "Download failed for $name."
    [ -s "$temp_file" ] || fail "Download was empty for $name."
    chmod "$mode" "$temp_file"
    mv -f -- "$temp_file" "$dest"
    temp_file=''
}

cli_bin_dir="${RUNE_BIN_DIR:-$HOME/.local/bin}"
cli_dest="$cli_bin_dir/rune"
download "rune-cli-$version-$platform" "$cli_dest" 755
info "CLI installed at $cli_dest"

if [ -n "${RUNE_BIN_DIR:-}" ]; then
    info "Use \"$cli_dest\" --help, or add its directory to PATH."
elif [[ "${RUNE_NO_PATH:-0}" != 1 && ":$PATH:" != *":$cli_bin_dir:"* ]]; then
    # Write literal variable references to the shell startup file.
    # shellcheck disable=SC2016
    line='export PATH="$HOME/.local/bin:$PATH"'
    case "$(basename "${SHELL:-/bin/bash}")" in
        zsh)  rc="$HOME/.zshrc" ;;
        bash)
            if [ "$platform" = macos-arm64 ]; then
                rc="$HOME/.bash_profile"
            else
                rc="$HOME/.bashrc"
            fi
            ;;
        fish)
            rc="${XDG_CONFIG_HOME:-$HOME/.config}/fish/config.fish"
            # shellcheck disable=SC2016
            line='fish_add_path $HOME/.local/bin'
            mkdir -p "$(dirname "$rc")"
            ;;
        *) rc="$HOME/.profile" ;;
    esac
    if ! grep -Fxq "$line" "$rc" 2>/dev/null; then
        printf '\n# Added by Rune installer\n%s\n' "$line" >> "$rc"
    fi
    info "Open a new terminal to pick up PATH. Run \"$cli_dest\" --help in this one."
fi

server_path="${RUNE_SERVER:-}"
if [ -n "$server_path" ]; then
    # Expand a literal tilde supplied in the environment.
    # shellcheck disable=SC2088
    case "$server_path" in "~"|"~/"*) server_path="$HOME${server_path#\~}" ;; esac
    [ -d "$server_path" ] || fail "Server folder does not exist: $server_path. The CLI is installed."
    server_path="$(cd -- "$server_path" && pwd)"
    plugins_dir="$server_path/plugins"
    plugin_dest="$plugins_dir/rune-$version-$platform.jar"
    download "rune-$version-$platform.jar" "$plugin_dest" 644
    shopt -s nullglob
    for old in "$plugins_dir"/rune-*-"$platform".jar; do
        if [ "$old" != "$plugin_dest" ] && [ -f "$old" ]; then
            rm -f -- "$old"
        fi
    done
    info "Plugin installed at $plugin_dest. Restart Paper to load Rune."
else
    info "Run rune --help to get started. Set RUNE_SERVER to also install the Paper plugin."
fi
