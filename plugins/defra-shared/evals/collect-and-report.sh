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
# Args: <hook-id> <case-label> <fixture-dir> <input-json> [project-dir]
_run_one() {
  local hook_id="$1" label="$2" fixture_dir="$3" input_json="$4" project_dir="${5:-}"
  echo "=== HOOK RUN $hook_id $label ==="
  local out
  set +e
  if [ -n "$project_dir" ]; then
    out=$(printf '%s' "$input_json" | "$fixture_dir/scripts/run-hook.sh" "$hook_id" "$project_dir" 2>&1)
  else
    out=$(printf '%s' "$input_json" | "$fixture_dir/scripts/run-hook.sh" "$hook_id" 2>&1)
  fi
  set -e
  # `run-hook.sh` already emits its own header — strip it to avoid a double header.
  echo "$out" | sed -n '/^exit_code:/,$p'
  echo
}

# Stage a fixture clone and check out a feature branch on it. Echoes the path.
# The caller is responsible for `rm -rf` once done.
_stage_feature_branch() {
  local fixture_dir="$1"
  local stage
  stage=$("$fixture_dir/scripts/init-git.sh")
  ( cd "$stage" && git checkout -q -b feature/x )
  echo "$stage"
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

  # --- Branch guard: feature branch (negative control — should pass).
  local feature_stage
  feature_stage=$(_stage_feature_branch "$fixture_dir")
  _run_one branch-guard "feature-branch" "$fixture_dir" \
    '{"tool_input":{"command":"git commit -m \"feat: x\""}}' \
    "$feature_stage"
  rm -rf "$feature_stage"

  # --- Branch guard: force-push to main from a feature branch (now blocked).
  feature_stage=$(_stage_feature_branch "$fixture_dir")
  _run_one branch-guard "force-push-main" "$fixture_dir" \
    '{"tool_input":{"command":"git push --force origin main"}}' \
    "$feature_stage"
  rm -rf "$feature_stage"

  # --- Branch guard: --force-with-lease to main:HEAD form (now blocked).
  feature_stage=$(_stage_feature_branch "$fixture_dir")
  _run_one branch-guard "force-with-lease-main" "$fixture_dir" \
    '{"tool_input":{"command":"git push --force-with-lease origin HEAD:main"}}' \
    "$feature_stage"
  rm -rf "$feature_stage"

  # --- Branch guard: force-push to a feature branch (negative control — should pass).
  feature_stage=$(_stage_feature_branch "$fixture_dir")
  _run_one branch-guard "force-push-feature" "$fixture_dir" \
    '{"tool_input":{"command":"git push --force origin feature/x"}}' \
    "$feature_stage"
  rm -rf "$feature_stage"

  # --- Commit-message format: non-conforming subject.
  _run_one commit-message-format "WIP" "$fixture_dir" \
    '{"tool_input":{"command":"git commit -m \"WIP\""}}'

  # --- Commit-message format: conforming subject (negative control — should pass).
  _run_one commit-message-format "valid-feat" "$fixture_dir" \
    '{"tool_input":{"command":"git commit -m \"feat(api): add endpoint\""}}'

  # --- Commit-message format: bypass attempt via `-am` (now blocked).
  _run_one commit-message-format "am-bypass" "$fixture_dir" \
    '{"tool_input":{"command":"git commit -am \"WIP\""}}'

  # --- Commit-message format: bypass attempt via `--message=` (now blocked).
  _run_one commit-message-format "long-bypass" "$fixture_dir" \
    '{"tool_input":{"command":"git commit --message=\"WIP\""}}'

  # --- Commit-message format: `-F` file bypass (now blocked).
  _run_one commit-message-format "F-bypass" "$fixture_dir" \
    '{"tool_input":{"command":"git commit -F /tmp/msg.txt"}}'

  # --- Commit-message format: editor-driven commit, no -m (now blocked).
  _run_one commit-message-format "editor-bypass" "$fixture_dir" \
    '{"tool_input":{"command":"git commit"}}'

  # --- Commit-message format: --amend --no-edit reuses validated message (allowed).
  _run_one commit-message-format "amend-no-edit" "$fixture_dir" \
    '{"tool_input":{"command":"git commit --amend --no-edit"}}'

  # --- Secret scan: planted AWS key.
  local AWS_KEY='AKIAIOSFODNN7EXAMPLE'
  _run_one secret-scan "AWS-key" "$fixture_dir" \
    "$(jq -nc --arg fp "$fixture_dir/fixtures/secret-planted.js" --arg c "const k = '$AWS_KEY'" \
        '{tool_input:{file_path:$fp,content:$c}}')"

  # --- Secret scan: clean content (negative control).
  _run_one secret-scan "clean-content" "$fixture_dir" \
    "$(jq -nc --arg fp "$fixture_dir/fixtures/clean.js" --arg c 'export const greeting = "hello"' \
        '{tool_input:{file_path:$fp,content:$c}}')"

  # --- Secret scan: AWS secret access key (base64 with /).
  _run_one secret-scan "AWS-secret" "$fixture_dir" \
    "$(jq -nc --arg fp "$fixture_dir/fixtures/secret-planted.js" \
        --arg c "const AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'" \
        '{tool_input:{file_path:$fp,content:$c}}')"

  # --- Secret scan: OpenAI sk-proj-* key.
  _run_one secret-scan "openai-key" "$fixture_dir" \
    "$(jq -nc --arg fp "$fixture_dir/fixtures/secret-planted.js" \
        --arg c "const k = 'sk-proj-AAAAAAAAAAAAAAAAAAAA1234567890abc'" \
        '{tool_input:{file_path:$fp,content:$c}}')"

  # --- Secret scan: Anthropic sk-ant-api-* key.
  _run_one secret-scan "anthropic-key" "$fixture_dir" \
    "$(jq -nc --arg fp "$fixture_dir/fixtures/secret-planted.js" \
        --arg c "const k = 'sk-ant-api03-AAAAAAAAAAAAAAAAAAAA1234567890'" \
        '{tool_input:{file_path:$fp,content:$c}}')"

  # --- Secret scan: JWT triple.
  _run_one secret-scan "jwt" "$fixture_dir" \
    "$(jq -nc --arg fp "$fixture_dir/fixtures/secret-planted.js" \
        --arg c "const t = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'" \
        '{tool_input:{file_path:$fp,content:$c}}')"

  # --- PII scan: planted UK NI / NHS / postcode / DoB.
  # The hook now skips paths under */eval-fixture/fixtures/* so the planted
  # markdown does not flag *itself* during regression runs. Copy it to a tmp
  # location to exercise the scanner.
  local pii_tmp
  pii_tmp=$(mktemp -t pii-planted-XXXXXX.md)
  cp "$fixture_dir/fixtures/pii-planted.md" "$pii_tmp"
  _run_one pii-scan "planted-pii" "$fixture_dir" \
    "$(jq -nc --arg fp "$pii_tmp" '{tool_input:{file_path:$fp}}')"
  rm -f "$pii_tmp"

  # --- PII scan: skip glob correctly suppresses fixture-path reports.
  _run_one pii-scan "fixture-skipped" "$fixture_dir" \
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
