#!/usr/bin/env bash
# Regression gate: compare a new promptfoo result file against the committed
# baseline and exit non-zero if any test that PASSED in the baseline now fails.
#
# Usage: ./check-regression.sh <new-results.json> [baseline.json]
#
# Tests are matched by prompt text. New tests added since the baseline are
# ignored by this gate — promptfoo's own exit code already fails the run
# on any fixture failure, so new fixtures get gated from their first
# appearance.

set -euo pipefail

NEW="${1:?usage: check-regression.sh <new-results.json> [baseline.json]}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASELINE="${2:-$SCRIPT_DIR/baseline/promptfoo-results.json}"

if [ ! -f "$NEW" ]; then
  echo "::error::New results file not found: $NEW" >&2
  exit 2
fi
if [ ! -f "$BASELINE" ]; then
  echo "::warning::No baseline at $BASELINE — skipping regression check."
  echo "Generate one by running the eval suite once and copying the result"
  echo "into $BASELINE. See evals/README.md."
  exit 0
fi

# Build per-prompt success maps for baseline and new run.
base_map=$(mktemp)
new_map=$(mktemp)
trap 'rm -f "$base_map" "$new_map"' EXIT

jq -r '
  .results.results
  | group_by(.vars.prompt)
  | map({ prompt: .[0].vars.prompt, pass: (all(.success == true)) })
  | .[] | "\(.pass)\t\(.prompt)"
' "$BASELINE" > "$base_map"

jq -r '
  .results.results
  | group_by(.vars.prompt)
  | map({ prompt: .[0].vars.prompt, pass: (all(.success == true)) })
  | .[] | "\(.pass)\t\(.prompt)"
' "$NEW" > "$new_map"

regressions=0
while IFS=$'\t' read -r base_pass prompt; do
  [ "$base_pass" != "true" ] && continue
  new_pass=$(awk -F'\t' -v p="$prompt" '$2 == p { print $1 }' "$new_map")
  if [ "$new_pass" != "true" ]; then
    echo "::error::Regression: prompt now failing — $prompt" >&2
    regressions=$((regressions + 1))
  fi
done < "$base_map"

if [ "$regressions" -gt 0 ]; then
  echo "::error::$regressions regression(s) vs baseline" >&2
  exit 1
fi

echo "No regressions vs baseline."
