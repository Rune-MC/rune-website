#!/usr/bin/env bash
# Rune one-line installer (Linux/macOS).
#
#   curl -fsSL runemc.dev/install.sh | bash
#
# What this does:
#   1. Fetches the latest Rune release from GitHub.
#   2. Asks where your Minecraft server lives + sanity-checks the folder.
#   3. Drops the Rune plugin jar into <server>/plugins/.
#   4. Installs the `rune` CLI to ~/.local/bin/rune. Adds that dir to your
#      shell rc if it isn't already on PATH.
#   5. Optionally starts the server using your existing start script.
#
# Env overrides:
#   RUNE_VERSION   — pin a specific release tag (e.g. v0.2.0). Default: latest.
#   RUNE_SERVER    — server directory; skips the prompt when set.
#   RUNE_NO_PATH=1 — skip the shell-rc PATH update.

set -euo pipefail

# ----- pretty output -------------------------------------------------------
if [ -t 1 ]; then
    C_INFO='\033[36m'; C_OK='\033[32m'; C_WARN='\033[33m'; C_ERR='\033[31m'; C_RESET='\033[0m'
else
    C_INFO=''; C_OK=''; C_WARN=''; C_ERR=''; C_RESET=''
fi
info() { printf "${C_INFO}[rune]${C_RESET} %s\n" "$*"; }
ok()   { printf "${C_OK}[rune]${C_RESET} %s\n"   "$*"; }
warn() { printf "${C_WARN}[rune]${C_RESET} %s\n" "$*" >&2; }
err()  { printf "${C_ERR}[rune]${C_RESET} %s\n"  "$*" >&2; }

# When piped from curl, stdin is the script itself — we have to read user
# input from the controlling terminal instead. If there isn't one (e.g.
# in CI), we fall back to non-interactive defaults.
if [ -t 0 ]; then
    TTY="/dev/stdin"
    HAVE_TTY=1
elif [ -e /dev/tty ]; then
    TTY="/dev/tty"
    HAVE_TTY=1
else
    TTY=""
    HAVE_TTY=0
fi

prompt_line() {
    # $1 = question, $2 = default
    local q="$1" def="${2:-}" ans=""
    if [ "$HAVE_TTY" -eq 0 ]; then echo "$def"; return 0; fi
    if [ -n "$def" ]; then
        printf "%s [%s]: " "$q" "$def" > /dev/tty
    else
        printf "%s: " "$q" > /dev/tty
    fi
    IFS= read -r ans < "$TTY" || ans=""
    if [ -z "$ans" ]; then ans="$def"; fi
    echo "$ans"
}

prompt_yes_no() {
    # $1 = question, $2 = "y" or "n" default
    local q="$1" def="${2:-y}" ans=""
    local hint
    if [ "$def" = "y" ]; then hint="[Y/n]"; else hint="[y/N]"; fi
    if [ "$HAVE_TTY" -eq 0 ]; then [ "$def" = "y" ] && return 0 || return 1; fi
    printf "%s %s " "$q" "$hint" > /dev/tty
    IFS= read -r ans < "$TTY" || ans=""
    ans="$(echo "$ans" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
    if [ -z "$ans" ]; then ans="$def"; fi
    [ "$ans" = "y" ] || [ "$ans" = "yes" ]
}

# ----- platform detect -----------------------------------------------------
OS_RAW="$(uname -s)"
ARCH_RAW="$(uname -m)"
case "$OS_RAW" in
    Linux)
        if [ "$ARCH_RAW" = "x86_64" ]; then
            PLATFORM="linux-x64"
        else
            err "Unsupported Linux architecture: $ARCH_RAW (only x86_64 is shipped today)."
            exit 1
        fi
        ;;
    Darwin)
        if [ "$ARCH_RAW" = "arm64" ]; then
            PLATFORM="macos-arm64"
        else
            err "Unsupported macOS architecture: $ARCH_RAW (only Apple Silicon is shipped today)."
            err "Open an issue if you need x86_64: https://github.com/Rune-MC/rune/issues"
            exit 1
        fi
        ;;
    *)
        err "Unsupported OS: $OS_RAW. Try the Windows installer if you're on Windows:"
        err "  irm runemc.dev/install.ps1 | iex"
        exit 1
        ;;
esac

# Required tools. curl is doing the heavy lifting; jq is optional — we
# fall back to a regex parse if it isn't installed.
need_cmd() { command -v "$1" >/dev/null 2>&1 || { err "$1 is required but not installed."; exit 1; }; }
need_cmd curl

# ----- 1. Resolve release --------------------------------------------------
REPO="Rune-MC/rune"
TAG="${RUNE_VERSION:-}"
if [ -z "$TAG" ]; then
    info "Looking up latest Rune release..."
    api_url="https://api.github.com/repos/$REPO/releases/latest"
else
    info "Fetching release $TAG..."
    api_url="https://api.github.com/repos/$REPO/releases/tags/$TAG"
fi

if ! release_json="$(curl -fsSL "$api_url")"; then
    err "Couldn't reach GitHub at $api_url"
    exit 1
fi

# Try jq first for safety; fall back to grep for the handful of fields
# we actually need. The fallback only handles the flat scalar lookups
# and one array (assets); it isn't a general JSON parser.
extract_field() {
    # extract_field <key>  — returns the value of a top-level string key.
    local key="$1"
    if command -v jq >/dev/null 2>&1; then
        echo "$release_json" | jq -r ".${key} // empty"
    else
        echo "$release_json" | grep -E "\"${key}\"\\s*:" | head -1 | sed -E 's/.*"'"$key"'"\s*:\s*"([^"]*)".*/\1/'
    fi
}

asset_url() {
    # asset_url <asset name>  — returns the browser_download_url for an
    # asset of that exact name, or empty string if not found.
    local name="$1"
    if command -v jq >/dev/null 2>&1; then
        echo "$release_json" | jq -r --arg n "$name" '.assets[] | select(.name==$n) | .browser_download_url' | head -1
    else
        # Portable fallback: every GitHub release asset has a
        # browser_download_url ending in the asset's filename. We grep
        # out every URL with -o, then pick the one whose final path
        # segment is the exact asset name we asked for. Works across
        # BSD awk (macOS) and GNU awk (Linux) because we never touch awk.
        echo "$release_json" \
            | grep -oE '"browser_download_url"[[:space:]]*:[[:space:]]*"[^"]+"' \
            | sed -E 's/.*"([^"]+)"$/\1/' \
            | while IFS= read -r url; do
                case "$url" in
                    */"$name") echo "$url"; break ;;
                esac
            done
    fi
}

TAG="$(extract_field tag_name)"
if [ -z "$TAG" ]; then
    err "Release JSON didn't have a tag_name. Got: $(echo "$release_json" | head -c 200)"
    exit 1
fi
VERSION="${TAG#v}"
ok "Release $TAG selected."

plugin_name="rune-${VERSION}-${PLATFORM}.jar"
cli_name="rune-cli-${VERSION}-${PLATFORM}"
plugin_url="$(asset_url "$plugin_name")"
cli_url="$(asset_url "$cli_name")"

if [ -z "$plugin_url" ]; then
    err "Release $TAG has no plugin jar for $PLATFORM."
    err "Expected asset: $plugin_name"
    exit 1
fi
if [ -z "$cli_url" ]; then
    err "Release $TAG has no CLI binary for $PLATFORM."
    err "Expected asset: $cli_name"
    exit 1
fi

# ----- 2. Pick & validate server dir ---------------------------------------
SERVER_PATH="${RUNE_SERVER:-}"
if [ -z "$SERVER_PATH" ]; then
    echo
    SERVER_PATH="$(prompt_line "Path to your Minecraft server folder" "$PWD")"
fi
# Expand ~
case "$SERVER_PATH" in "~"|"~/"*) SERVER_PATH="${HOME}${SERVER_PATH#~}";; esac
if [ ! -d "$SERVER_PATH" ]; then
    err "That folder doesn't exist: $SERVER_PATH"
    exit 1
fi
SERVER_PATH="$(cd "$SERVER_PATH" && pwd)"

is_minecraft_server() {
    local d="$1"
    [ -f "$d/server.properties" ] && return 0
    [ -f "$d/eula.txt" ]          && return 0
    for c in server.jar paper.jar purpur.jar spigot.jar folia.jar; do
        [ -f "$d/$c" ] && return 0
    done
    # `compgen -G` returns 0 if at least one match; suppress shell errors.
    for pat in 'paper-*.jar' 'purpur-*.jar' 'spigot-*.jar' 'folia-*.jar'; do
        # shellcheck disable=SC2086
        if ls "$d"/$pat >/dev/null 2>&1; then return 0; fi
    done
    return 1
}

if ! is_minecraft_server "$SERVER_PATH"; then
    warn "$SERVER_PATH doesn't look like a Minecraft server folder."
    warn "  (no server.properties / eula.txt / paper*.jar / etc.)"
    if ! prompt_yes_no "Install Rune there anyway?" "n"; then
        err "Aborted."
        exit 1
    fi
fi
ok "Server folder: $SERVER_PATH"

# ----- 3. Download plugin jar -> plugins/ ----------------------------------
plugins_dir="$SERVER_PATH/plugins"
mkdir -p "$plugins_dir"
plugin_dest="$plugins_dir/$plugin_name"
info "Downloading $plugin_name..."
curl -fL --progress-bar "$plugin_url" -o "$plugin_dest"
ok "Plugin installed -> $plugin_dest"

# Strip stale plugin jars matching the same platform suffix to avoid two
# versions loading on the next restart. Only touch our own naming pattern.
shopt -s nullglob 2>/dev/null || true
for old in "$plugins_dir"/rune-*-"$PLATFORM".jar; do
    if [ "$old" != "$plugin_dest" ]; then
        info "Removing older plugin: $(basename "$old")"
        rm -f "$old"
    fi
done

# ----- 4. Install CLI + PATH -----------------------------------------------
cli_bin_dir="$HOME/.local/bin"
mkdir -p "$cli_bin_dir"
cli_dest="$cli_bin_dir/rune"
info "Downloading $cli_name..."
curl -fL --progress-bar "$cli_url" -o "$cli_dest"
chmod +x "$cli_dest"
ok "CLI installed -> $cli_dest"

# PATH handling. ~/.local/bin is the XDG default but lots of distros don't
# put it on PATH by default. We append an export to whichever rc file the
# user's shell would source — but only if it isn't already present, and
# only if they haven't opted out via RUNE_NO_PATH=1.
on_path() {
    case ":$PATH:" in *":$1:"*) return 0;; esac
    return 1
}

ensure_path_in_rc() {
    local rc="$1"
    local line='export PATH="$HOME/.local/bin:$PATH"'
    if [ -f "$rc" ] && grep -Fq "$line" "$rc"; then
        return 0
    fi
    {
        echo ""
        echo "# Added by Rune installer"
        echo "$line"
    } >> "$rc"
    ok "Added ~/.local/bin to PATH in $rc"
    warn "Run 'source $rc' or open a new terminal for the change to take effect."
}

if [ "${RUNE_NO_PATH:-0}" = "1" ]; then
    info "RUNE_NO_PATH=1: skipping PATH modification."
elif on_path "$cli_bin_dir"; then
    info "$cli_bin_dir already on PATH."
else
    # Pick an rc file based on the user's current shell. Defaults to bash
    # because that's still the most common login shell on Linux.
    user_shell="${SHELL:-/bin/bash}"
    rc=""
    case "$(basename "$user_shell")" in
        zsh)  rc="$HOME/.zshrc" ;;
        bash)
            # macOS uses .bash_profile for login shells; Linux uses .bashrc
            if [ "$OS_RAW" = "Darwin" ] && [ -f "$HOME/.bash_profile" ]; then
                rc="$HOME/.bash_profile"
            else
                rc="$HOME/.bashrc"
            fi
            ;;
        fish) rc="$HOME/.config/fish/config.fish" ;;
        *)    rc="$HOME/.profile" ;;
    esac
    if [ "$(basename "$user_shell")" = "fish" ]; then
        # fish has its own PATH semantics.
        mkdir -p "$(dirname "$rc")"
        line='set -gx PATH $HOME/.local/bin $PATH'
        if ! { [ -f "$rc" ] && grep -Fq "$line" "$rc"; }; then
            { echo ""; echo "# Added by Rune installer"; echo "$line"; } >> "$rc"
            ok "Added ~/.local/bin to PATH in $rc"
            warn "Open a new terminal for the change to take effect."
        fi
    else
        ensure_path_in_rc "$rc"
    fi
fi

# ----- 5. Offer to start the server ----------------------------------------
echo
if ! prompt_yes_no "Start the server now so Rune can generate its config + scripts dir?" "y"; then
    ok "All done. Start your server whenever you're ready."
    echo
    echo "  Plugin:   $plugin_dest"
    echo "  CLI:      $cli_dest  (rune --help)"
    exit 0
fi

# Search for an existing start script in priority order. We don't try to
# guess a `java -jar` invocation: server admins have strong opinions about
# Xmx, Aikar's flags, etc., and a wrong default is worse than no default.
start_script=""
for name in start.sh run.sh start.command run.command start run; do
    candidate="$SERVER_PATH/$name"
    if [ -f "$candidate" ] && [ -x "$candidate" ]; then
        start_script="$candidate"; break
    fi
    # Also accept non-executable .sh as long as it ends in .sh — they're
    # commonly checked in without the +x bit on Windows-edited repos.
    if [ -f "$candidate" ] && [[ "$candidate" == *.sh ]]; then
        start_script="$candidate"; break
    fi
done

if [ -z "$start_script" ]; then
    warn "Couldn't find a start script in $SERVER_PATH."
    warn "Tried: start.sh, run.sh, start.command, run.command, start, run"
    echo
    echo "Start it manually with something like:"
    echo "  cd \"$SERVER_PATH\""
    echo "  java -Xms2G -Xmx2G -jar paper.jar nogui"
    exit 0
fi

info "Starting server with $(basename "$start_script") (Ctrl+C to stop)..."
cd "$SERVER_PATH"
if [ -x "$start_script" ]; then
    exec "$start_script"
else
    exec bash "$start_script"
fi
