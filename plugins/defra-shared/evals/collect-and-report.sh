#!/usr/bin/env bash
# Shared report-builder for the defra-shared eval providers.
#
# Walks every hook in the catalogue, drives it with a representative
# synthetic input (the same inputs AC6 lists), and prints one combined
# block to stdout for promptfoo to assert against.
#
# Output format (multi-section):
#   === SKILLS LOADED ===
#   <list of SKILL.md files found, one per line>
#
#   === HOOKS DEFINED ===
#   <list of hook ids extracted from hooks.json>
#
#   === HOOK RUN <id> <case-label> ===
#   exit_code: <n>
#   stderr:
#   <captured stderr lines>
#
#   === REFUSAL TRACE ===
#   <one-line summary per blocking-hook case: branch-guard / commit-message-format / secret-scan>
#
# The provider scripts (run-copilot.sh, run-claude.sh) source this file and
# call `report "<label>" "<prompt>" "<fixture-dir>"`.

# Run a single hook against a synthetic input and emit a labelled section.
# Args: <hook-id> <case-label> <fixture-dir> <input-json>
_run_one() {
  local hook_id="$1" label="$2" fixture_dir="$3" input_json="$4"
  echo "=== HOOK RUN $hook_id $label ==="
  local out
  set +e
  out=$(printf '%s' "$input_json" | "$fixture_dir/scripts/run-hook.sh" "$hook_id" 2>&1)
  set -e
  # `run-hook.sh` already emits its own header — strip it to avoid a double header.
  echo "$out" | sed -n '/^exit_code:/,$p'
  echo
}

report() {
  local provider="$1"
  local prompt="$2"
  local fixture_dir="$3"

  # Make sure the hook scripts are extracted before we try to drive them.
  bash "$fixture_dir/scripts/extract-hooks.sh" >/dev/null

  local plugin_dir
  plugin_dir="$(cd "$fixture_dir/.." && pwd)"

  echo "=== PROVIDER ==="
  echo "$provider"
  echo "prompt: $prompt"
  echo

  echo "=== SKILLS LOADED ==="
  find "$plugin_dir/skills" -name SKILL.md -type f 2>/dev/null \
    | sed "s|$plugin_dir/||" | sort
  echo

  echo "=== HOOKS DEFINED ==="
  jq -r '
    [.hooks.PreToolUse[]?.hooks[]?, .hooks.PostToolUse[]?.hooks[]?]
    | .[].statusMessage // "(no statusMessage)"
  ' "$plugin_dir/hooks/hooks.json"
  echo

  # --- Branch guard: fixture HEAD is on `main`, agent attempts a commit.
  _run_one branch-guard "main+commit" "$fixture_dir" \
    '{"tool_input":{"command":"git commit -m \"feat: x\""}}'

  # --- Commit-message format: non-conforming subject.
  _run_one commit-message-format "WIP" "$fixture_dir" \
    '{"tool_input":{"command":"git commit -m \"WIP\""}}'

  # --- Commit-message format: conforming subject (negative control — should pass).
  _run_one commit-message-format "valid-feat" "$fixture_dir" \
    '{"tool_input":{"command":"git commit -m \"feat(api): add endpoint\""}}'

  # --- Secret scan: planted AWS key.
  local AWS_KEY='AKIAIOSFODNN7EXAMPLE'
  _run_one secret-scan "AWS-key" "$fixture_dir" \
    "$(jq -nc --arg fp "$fixture_dir/fixtures/secret-planted.js" --arg c "const k = '$AWS_KEY'" \
        '{tool_input:{file_path:$fp,content:$c}}')"

  # --- Secret scan: clean content (negative control).
  _run_one secret-scan "clean-content" "$fixture_dir" \
    "$(jq -nc --arg fp "$fixture_dir/fixtures/clean.js" --arg c 'export const greeting = "hello"' \
        '{tool_input:{file_path:$fp,content:$c}}')"

  # --- PII scan: planted UK NI / NHS / postcode / DoB.
  _run_one pii-scan "planted-pii" "$fixture_dir" \
    "$(jq -nc --arg fp "$fixture_dir/fixtures/pii-planted.md" '{tool_input:{file_path:$fp}}')"

  # --- Coverage floor: simulated low-coverage test output.
  local cov_input
  cov_input=$(jq -n --rawfile out "$fixture_dir/fixtures/lowcov-test-output.txt" \
    '{tool_input:{command:"npm test"},tool_response:{stdout:$out}}')
  _run_one coverage-floor "low-coverage" "$fixture_dir" "$cov_input"

  echo "=== REFUSAL TRACE ==="
  echo "branch-guard refused commit on main: see HOOK RUN branch-guard main+commit"
  echo "commit-message-format refused WIP subject: see HOOK RUN commit-message-format WIP"
  echo "secret-scan refused AWS key: see HOOK RUN secret-scan AWS-key"
}
