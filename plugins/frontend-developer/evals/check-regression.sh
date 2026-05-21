#!/usr/bin/env bash
# Regression gate: compare a new promptfoo result file against the committed
# baseline and exit non-zero if any test that PASSED in the baseline now fails.
#
# Usage: ./check-regression.sh <new-results.json> [baseline.json]
#
# Tests are matched by prompt text (descriptions are not always populated in
# promptfoo's JSON output). New tests added since the baseline are ignored
# by this gate — promptfoo's own exit code already fails the run on any
# fixture failure, so new fixtures get gated from their first appearance.

set -euo pipefail

NEW="${1:?usage: check-regression.sh <new-results.json> [baseline.json]}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASELINE="${2:-$SCRIPT_DIR/baseline/promptfoo-results.json}"

if [[ ! -f "$NEW" ]]; then
  echo "::error::New results file not found: $NEW" >&2
  exit 2
fi
if [[ ! -f "$BASELINE" ]]; then
  echo "::error::Baseline file not found: $BASELINE" >&2
  exit 2
fi

# Build per-prompt success maps for baseline and new run.
# A test is "passing" only if EVERY provider that ran it passed. With one
# provider this is the obvious thing; with multiple, a regression on any
# provider fails the gate. That's the strict reading: if Claude regresses
# but Copilot doesn't, we still want to know.
baseline_passing=$(jq -r '
  .results.results
  | group_by(.vars.prompt)
  | map({prompt: .[0].vars.prompt, pass: (all(.success == true))})
  | map(select(.pass)) | .[].prompt
' "$BASELINE")

regressions=()
while IFS= read -r prompt; do
  [[ -z "$prompt" ]] && continue
  status=$(jq -r --arg p "$prompt" '
    [.results.results[] | select(.vars.prompt == $p) | .success] as $rs
    | if ($rs | length) == 0 then "missing"
      elif (all($rs[]; . == true)) then "pass"
      else "fail" end
  ' "$NEW")
  case "$status" in
    pass) ;;
    fail) regressions+=("FAIL: $prompt") ;;
    missing) regressions+=("MISSING: $prompt") ;;
  esac
done <<< "$baseline_passing"

if [[ ${#regressions[@]} -eq 0 ]]; then
  echo "No regressions vs baseline."
  exit 0
fi

echo "::error::${#regressions[@]} regression(s) vs baseline:" >&2
printf '  %s\n' "${regressions[@]}" >&2
exit 1
