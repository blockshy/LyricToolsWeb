#!/usr/bin/env bash
set -euo pipefail
[[ "$#" -eq 0 ]] || { echo "Usage: ./deploy/build-artifact.sh" >&2; exit 2; }
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
control_root="${TYUKKI_DEPLOY_CONTROL_ROOT:-/huyu/bootstrap/remote-deploy}"
exec env STATIC_REPO_ROOT="$repo_root" "$control_root/scripts/build-static-release.sh" lyric-tools
