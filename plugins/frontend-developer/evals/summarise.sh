#!/usr/bin/env bash
# Render a markdown summary of a promptfoo result file.
#
# Usage: ./summarise.sh <results.json>
#
# Stdout is markdown suitable for piping to $GITHUB_STEP_SUMMARY or for
# eyeballing locally.

set -euo pipefail

RESULT="${1:?usage: summarise.sh <results.json>}"

if [[ ! -f "$RESULT" ]]; then
  echo "::error::No result file at $RESULT" >&2
  exit 1
fi

echo "## Eval results"
echo ""
jq -r '.results.stats |
  "**Suite pass:** \(.successes)/\(.successes + .failures) tests"' "$RESULT"

echo ""
echo "### Per-fixture"
jq -r '
  .results.results
  | group_by(.vars.prompt)
  | map({
      prompt: (.[0].vars.prompt | .[0:80]),
      pass: (all(.success == true))
    })
  | .[]
  | "- \(if .pass then "PASS" else "FAIL" end) — \(.prompt)"
' "$RESULT"

echo ""
echo "### Named scores"
jq -r '
  .results.prompts[0].metrics.namedScores // {}
  | to_entries
  | map("- **\(.key)**: \(.value)")
  | .[]
' "$RESULT"

echo ""
echo "### Latency"
jq -r '
  [.results.results[].latencyMs] | sort as $xs
  | ($xs | length) as $n
  | if $n == 0 then "_no latency data_" else
      "- p50: \($xs[($n/2|floor)])ms\n- p95: \($xs[(($n*0.95)|floor)])ms\n- max: \($xs[-1])ms"
    end
' "$RESULT"

echo ""
echo "### Assertion-level failures"
jq -r '
  [.results.results[].gradingResult.componentResults[]?
    | select(.pass == false)
    | (.assertion.metric // "untagged")] as $fails
  | if ($fails | length) == 0 then "_none_" else
      ($fails | group_by(.) | map("- \(.[0]): \(length)") | .[])
    end
' "$RESULT"
