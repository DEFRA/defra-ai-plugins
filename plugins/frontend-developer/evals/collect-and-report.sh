#!/usr/bin/env bash
# Shared collection and reporting library for provider scripts.
#
# Usage (from a provider script):
#   source collect-and-report.sh
#   snapshot_files "$SNAP_BEFORE"
#   ... run the agent, capture AGENT_OUTPUT ...
#   report "COPILOT" "$AGENT_OUTPUT" "$SNAP_BEFORE"
#
# `report` prints a single combined block to stdout that promptfoo asserts
# against. See CONTRIBUTING.md §Add behavioural fixtures for the format.

# Hash every file under src/ into a sorted "<hash> <path>" listing.
# md5sum on Linux, md5 -r on macOS — both produce the same shape.
snapshot_files() {
  local outfile="$1"
  if command -v md5sum &>/dev/null; then
    find src -type f -exec md5sum {} \; 2>/dev/null \
      | awk '{print $1, $2}' | sort -k2 > "$outfile" || true
  else
    find src -type f -exec md5 -r {} \; 2>/dev/null \
      | sort -k2 > "$outfile" || true
  fi
}

# Diff two snapshots. New paths are flagged "(new)"; paths in both whose
# hash changed are flagged "(modified)". Uses comm on path-only projections
# rather than the previous O(n^2) grep-per-line scan.
_files_changed() {
  local before="$1" after="$2"
  local before_paths after_paths
  before_paths=$(mktemp)
  after_paths=$(mktemp)

  awk '{print $2}' "$before" > "$before_paths"
  awk '{print $2}' "$after"  > "$after_paths"

  comm -13 "$before_paths" "$after_paths" | while IFS= read -r p; do
    [ -n "$p" ] && printf '%s (new)\n' "$p"
  done

  comm -12 "$before_paths" "$after_paths" | while IFS= read -r p; do
    [ -z "$p" ] && continue
    local h_before h_after
    h_before=$(awk -v p="$p" '$2==p {print $1; exit}' "$before")
    h_after=$(awk  -v p="$p" '$2==p {print $1; exit}' "$after")
    [ "$h_before" != "$h_after" ] && printf '%s (modified)\n' "$p"
  done

  rm -f "$before_paths" "$after_paths"
}

# Print the combined report. Caller provides the agent output and label;
# this function handles the file diff, content extraction, lint, and tests.
report() {
  local agent_label="${1:-AGENT}"
  local agent_output="$2"
  local snap_before="$3"

  local snap_after
  snap_after=$(mktemp)
  snapshot_files "$snap_after"

  local files_changed
  files_changed=$(_files_changed "$snap_before" "$snap_after")
  rm -f "$snap_after"

  local njk_content="" js_content="" f
  for f in $(find src/views -name '*.njk' -type f 2>/dev/null); do
    njk_content="$njk_content
--- $f ---
$(cat "$f")"
  done
  for f in $(find src/routes -name '*.js' -type f 2>/dev/null); do
    js_content="$js_content
--- $f ---
$(cat "$f")"
  done

  local lint_exit=0 lint_output
  lint_output=$(npm run lint --silent 2>&1) || lint_exit=$?

  local test_exit=0 test_output
  test_output=$(npm test --silent 2>&1) || test_exit=$?

  cat <<HEREDOC
=== ${agent_label} OUTPUT ===
$agent_output

=== NJK TEMPLATES ===
$njk_content

=== JS ROUTES ===
$js_content

=== FILES CHANGED ===
$files_changed

=== LINT ===
exit_code: $lint_exit
$lint_output

=== TESTS ===
exit_code: $test_exit
$test_output
HEREDOC
}
