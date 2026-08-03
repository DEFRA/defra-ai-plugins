# Baseline eval results — defra-pii-redaction

This directory holds the reference run the defra-pii-redaction eval is compared
against. A regression relative to the baseline blocks a PR.

## Deterministic provider — no model, no cost

defra-pii-redaction ships **no agent**. The single provider exercises the
plugin's PII redaction script directly with synthetic hook payloads — there is
no LLM call, so a run spends **no tokens / premium budget** and is fully
reproducible.

| Provider | Results / baseline file         | Hook-input shape      |
| -------- | ------------------------------- | --------------------- |
| Copilot  | `promptfoo-results.json`        | Copilot CLI hook JSON |
| Claude   | `promptfoo-results-claude.json` | Claude Code hook JSON |

## Provenance

| Field    | Value                             |
| -------- | --------------------------------- |
| Date     | 2026-07-27                        |
| Provider | Deterministic hook suite (Claude) |
| Fixtures | 15                                |
| Result   | 15/15 pass                        |

## Thresholds

| Metric      | Threshold |
| ----------- | --------- |
| correctness | >= 90%    |
| security    | = 100%    |
| lint_passes | = 100%    |

## Regenerating

Because the provider is deterministic, regenerate after any deliberate change
to the redaction script's behaviour:

```sh
node scripts/evals.mjs eval defra-pii-redaction claude-code-defra-pii-redaction
cp results/run-$(date +%Y-%m-%d)/promptfoo-results-claude.json \
   plugins/defra-pii-redaction/evals/baseline/promptfoo-results-claude.json
```

Commit the new baseline in the same PR as the change that prompted it.
