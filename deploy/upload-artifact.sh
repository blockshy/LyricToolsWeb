#!/usr/bin/env bash
set -euo pipefail
[[ "$#" -eq 2 ]] || { echo "Usage: ./deploy/upload-artifact.sh <release.json> <dev|prod>" >&2; exit 2; }
manifest="$(readlink -f "$1")"
[[ "$(jq -r '.siteKey' "$manifest")" == lyric-tools ]] || { echo "release.json is not for LyricToolsWeb" >&2; exit 2; }
control_root="${TYUKKI_DEPLOY_CONTROL_ROOT:-/huyu/bootstrap/remote-deploy}"
exec "$control_root/scripts/upload-static.sh" "$manifest" "$2"
