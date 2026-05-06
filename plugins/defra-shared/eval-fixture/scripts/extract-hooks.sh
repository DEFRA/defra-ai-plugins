#!/usr/bin/env bash
# Extract each hook's command body from ../hooks/hooks.json into a standalone
# .sh file under hooks-under-test/. Lets the eval suite invoke each hook with
# a synthetic stdin payload, the same way the Claude Code / Copilot CLI hook
# runtime would.
#
# The mapping (hook id → file) is by stable position; keep it in sync with
# the order in hooks.json.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FIXTURE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_JSON="$(cd "$FIXTURE_DIR/../hooks" && pwd)/hooks.json"
OUT_DIR="$FIXTURE_DIR/hooks-under-test"

mkdir -p "$OUT_DIR"

write_hook() {
  local id="$1" jq_path="$2"
  local out="$OUT_DIR/$id.sh"
  {
    echo '#!/usr/bin/env bash'
    echo "# Auto-extracted from hooks/hooks.json by extract-hooks.sh — do not hand-edit."
    echo "# Hook id: $id"
    echo "# Reads Claude Code hook input on stdin; writes to stderr; exit code is hook signal."
    jq -r "$jq_path" "$HOOKS_JSON"
  } > "$out"
  chmod +x "$out"
}

write_hook 'branch-guard'           '.hooks.PreToolUse[0].hooks[0].command'
write_hook 'commit-message-format'  '.hooks.PreToolUse[1].hooks[0].command'
write_hook 'secret-scan'            '.hooks.PreToolUse[2].hooks[0].command'
write_hook 'pii-scan'               '.hooks.PostToolUse[0].hooks[0].command'
write_hook 'coverage-floor'         '.hooks.PostToolUse[1].hooks[0].command'

echo "extracted 5 hook(s) into $OUT_DIR"
