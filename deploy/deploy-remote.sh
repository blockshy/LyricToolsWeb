#!/usr/bin/env bash
set -euo pipefail
[[ "$#" -eq 3 ]] || { echo "Usage: ./deploy/deploy-remote.sh <release.json> <dev|prod> <full-commit>" >&2; exit 2; }
manifest="$(readlink -f "$1")"
[[ "$(jq -r '.siteKey' "$manifest")" == lyric-tools ]] || { echo "release.json is not for LyricToolsWeb" >&2; exit 2; }
[[ "$(jq -r '.commit' "$manifest")" == "$3" ]] || { echo "Commit confirmation does not match release.json" >&2; exit 2; }
control_root="${TYUKKI_DEPLOY_CONTROL_ROOT:-/huyu/bootstrap/remote-deploy}"
if [[ "$2" == prod ]]; then exec "$control_root/scripts/deploy-static.sh" "$manifest" prod "$3"; fi
[[ "$2" == dev ]] || { echo "Environment must be dev or prod" >&2; exit 2; }
exec "$control_root/scripts/deploy-static.sh" "$manifest" dev
