# Baseline eval results — defra-shared

This directory holds the reference runs the defra-shared eval is compared
against. A regression relative to the matching baseline blocks a PR.

## Deterministic providers — no model, no cost

defra-shared ships **no agent**. Both providers exercise the plugin's guardrail
hooks directly against the eval-fixture with synthetic hook inputs — there is no
LLM call, so a run spends **no tokens / premium budget** and is fully
reproducible. The `COPILOT` / `CLAUDE` split is just the hook-input format each
host CLI would send, not a model:

| Provider | Results / baseline file         | Hook-input shape          |
| -------- | ------------------------------- | ------------------------- |
| Copilot  | `promptfoo-results.json`        | Copilot CLI tool-use JSON |
| Claude   | `promptfoo-results-claude.json` | Claude Code tool-use JSON |

`scripts/evals.mjs` picks the file matching the provider it ran and passes it to
`check-regression.mjs`. If the matching baseline is absent the gate is skipped
with a logged message rather than compared across providers.

## Provenance

| Field      | Value                                                   |
| ---------- | ------------------------------------------------------- |
| Date       | 2026-06-05                                              |
| Providers  | Deterministic hook suite (Copilot + Claude input shapes) |
| Fixtures   | 25                                                      |
| Result     | 25/25 both providers                                    |

## How the regression gate uses these files

`check-regression.mjs` is metric-threshold based (not per-prompt). It fails if
any metric falls below its absolute threshold, or regresses by more than 5pp
versus the baseline:

| Metric        | Threshold |
| ------------- | --------- |
| correctness   | ≥ 90%     |
| security      | = 100%    |
| lint_passes   | = 100%    |
| accessibility | = 100%    |
| refusal       | = 100%    |

(Thresholds come from `docs/design/eval_taxonomy.md` §Thresholds.)

## Regenerating

Because the providers are deterministic, regenerate after any deliberate change
to a defra-shared hook's behaviour:

```sh
node scripts/evals.mjs eval defra-shared copilot-cli-defra-shared
cp results/run-$(date +%Y-%m-%d)/promptfoo-results.json \
   plugins/defra-shared/evals/baseline/promptfoo-results.json

node scripts/evals.mjs eval defra-shared claude-code-defra-shared
cp results/run-$(date +%Y-%m-%d)/promptfoo-results-claude.json \
   plugins/defra-shared/evals/baseline/promptfoo-results-claude.json
```

Commit the new baselines in the same PR as the change that prompted them.
