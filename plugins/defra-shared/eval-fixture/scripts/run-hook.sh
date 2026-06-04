#!/usr/bin/env bash
# Drive a single hook with a synthetic Claude Code hook input on stdin.
# Prints the hook's exit code and any stderr output in a parseable format.
#
# Usage: run-hook.sh <hook-id> [project-dir] < <input.json>
#
# If [project-dir] is omitted, the hook runs with CLAUDE_PROJECT_DIR set to
# a fresh staging copy of eval-fixture/ (created via init-git.sh) so that
# branch-guard / commit-message-format see a real git HEAD on `main`.
#
# Output (multi-line):
#   === HOOK <hook-id> ===
#   exit_code: <n>
#   stderr:
#   <captured stderr lines>
set -euo pipefail

HOOK_ID="${1:?usage: run-hook.sh <hook-id> [project-dir]}"
EXPLICIT_PROJECT_DIR="${2:-}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FIXTURE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PLUGIN_DIR="$(cd "$FIXTURE_DIR/.." && pwd)"
HOOK_SCRIPT="$FIXTURE_DIR/hooks-under-test/$HOOK_ID.sh"

if [[ ! -x "$HOOK_SCRIPT" ]]; then
  "$SCRIPT_DIR/extract-hooks.sh" >/dev/null
fi

if [[ -n "$EXPLICIT_PROJECT_DIR" ]]; then
  PROJECT_DIR="$EXPLICIT_PROJECT_DIR"
  CLEANUP=''
else
  PROJECT_DIR=$("$SCRIPT_DIR/init-git.sh")
  CLEANUP="$PROJECT_DIR"
fi

export CLAUDE_PROJECT_DIR="$PROJECT_DIR"
export CLAUDE_PLUGIN_ROOT="$PLUGIN_DIR"

stderr_capture=$(mktemp)
cleanup() {
  rm -f "$stderr_capture"
  if [[ -n "$CLEANUP" && -d "$CLEANUP" ]]; then
    rm -rf "$CLEANUP"
  fi
  return 0
}
trap cleanup EXIT

set +e
( cd "$PROJECT_DIR" && bash "$HOOK_SCRIPT" ) 2>"$stderr_capture"
rc=$?
set -e

echo "=== HOOK $HOOK_ID ==="
echo "exit_code: $rc"
echo "stderr:"
cat "$stderr_capture"
