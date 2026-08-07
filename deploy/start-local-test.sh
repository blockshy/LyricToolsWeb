#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./deploy/start-local-test.sh [--skip-install] [-- <vite arguments>]

Starts the local Vite test server. Dependencies are refreshed with npm ci
unless --skip-install is supplied. Press Ctrl-C to stop.
EOF
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then usage; exit 0; fi
skip_install=0
if [[ "${1:-}" == "--skip-install" ]]; then skip_install=1; shift; fi
if [[ "${1:-}" == "--" ]]; then shift; fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
environment_file="${HOME}/.config/dev-bootstrap/environment.sh"
[[ -r "$environment_file" ]] || { echo "Missing managed Node environment: $environment_file" >&2; exit 1; }
# shellcheck disable=SC1090
source "$environment_file"
command -v nvm >/dev/null 2>&1 || { echo "nvm is unavailable" >&2; exit 1; }
nvm use 24.19.0 >/dev/null
cd "$repo_root"
if ((skip_install == 0)); then npm ci; fi
echo "Starting LyricToolsWeb local test server (press Ctrl-C to stop)"
exec npm run dev -- --host 127.0.0.1 "$@"
