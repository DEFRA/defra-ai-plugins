#!/usr/bin/env bash
# Shared collection and reporting library for code-reviewer provider scripts.
#
# Usage (from a provider script):
#   source collect-and-report.sh
#   snapshot_files "$SNAP_BEFORE"
#   ... run the agent, capture AGENT_OUTPUT ...
#   report "COPILOT" "$AGENT_OUTPUT" "$SNAP_BEFORE"
#
# `report` prints a single combined block to stdout that promptfoo asserts
# against. The block contains the agent stdout, the contents of every
# review markdown produced under reviews/, and a files-changed listing
# scoped to src/ (so unintended source edits show up).

# Hash every file under src/ into a sorted "<hash> <path>" listing.
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

_files_changed() {
  local before="$1" after="$2"
  local before_paths after_paths
  before_paths=$(mktemp)
  after_paths=$(mktemp)

  awk '{print $2}' "$before" > "$before_paths"
  awk '{print $2}' "$after" > "$after_paths"

  comm -13 "$before_paths" "$after_paths" | while IFS= read -r p; do
    [ -n "$p" ] && printf '%s (new)\n' "$p"
  done

  comm -12 "$before_paths" "$after_paths" | while IFS= read -r p; do
    [ -z "$p" ] && continue
    local b a
    b=$(grep -F " $p" "$before" | head -1 | awk '{print $1}')
    a=$(grep -F " $p" "$after" | head -1 | awk '{print $1}')
    [ "$b" != "$a" ] && printf '%s (modified)\n' "$p"
  done

  rm -f "$before_paths" "$after_paths"
}

# Print the combined report.
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

  local reviews_content="" f
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    reviews_content="$reviews_content
--- $f ---
$(cat "$f")"
  done < <(find reviews -name '*.md' -type f 2>/dev/null)

  cat <<HEREDOC
=== ${agent_label} OUTPUT ===
$agent_output

=== REVIEWS ===
$reviews_content

=== FILES CHANGED ===
$files_changed
HEREDOC
}
