#!/usr/bin/env bash
# Extract each hook's command body from ../hooks/hooks.json into a standalone
# .sh file under hooks-under-test/. Lets the eval suite invoke each hook with
# a synthetic stdin payload, the same way the Claude Code / Copilot CLI hook
# runtime would.
#
# Hooks are matched by the leading id token of their `statusMessage`
# (e.g. "branch-guard: ...") rather than by array index, so reordering
# hooks.json doesn't silently misalign the extracted scripts.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FIXTURE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_JSON="$(cd "$FIXTURE_DIR/../hooks" && pwd)/hooks.json"
OUT_DIR="$FIXTURE_DIR/hooks-under-test"

mkdir -p "$OUT_DIR"

write_hook() {
  local id="$1"
  local out="$OUT_DIR/$id.sh"
  local cmd
  cmd=$(jq -r --arg id "$id" '
    [.hooks | to_entries[].value[].hooks[]
      | select((.statusMessage // "") | startswith($id + ":"))]
    | if length == 0 then
        error("no hook with statusMessage starting \"" + $id + ":\" in " + $__loc__.file)
      elif length > 1 then
        error("multiple hooks with statusMessage starting \"" + $id + ":\"")
      else .[0].command
      end
  ' "$HOOKS_JSON")
  {
    echo '#!/usr/bin/env bash'
    echo "# Auto-extracted from hooks/hooks.json by extract-hooks.sh — do not hand-edit."
    echo "# Hook id: $id"
    echo "# Reads Claude Code hook input on stdin; writes to stderr; exit code is hook signal."
    printf '%s\n' "$cmd"
  } > "$out"
  chmod +x "$out"
}

write_hook 'branch-guard'
write_hook 'commit-message-format'
write_hook 'secret-scan'
write_hook 'pii-scan'
write_hook 'coverage-floor'

echo "extracted 5 hook(s) into $OUT_DIR"
