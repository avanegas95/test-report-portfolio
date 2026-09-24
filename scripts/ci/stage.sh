#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: stage.sh <Name> -- <command...>" >&2
  exit 2
fi

STAGE_NAME="$1"
shift

if [[ "$1" != "--" ]]; then
  echo "Usage: stage.sh <Name> -- <command...>" >&2
  exit 2
fi

shift

mkdir -p reports
START="$(date -u +%FT%TZ)"
set +e
"$@"
EXIT=$?
set -e
END="$(date -u +%FT%TZ)"

printf '{"name":"%s","start":"%s","end":"%s","exit":%d}\n' \
  "$STAGE_NAME" "$START" "$END" "$EXIT" >> reports/stages.jsonl

exit "$EXIT"
