# Baseline eval results

This directory holds the reference run that future evals are compared against.
A regression in any fixture relative to this file should block a PR.

## Provenance

| Field | Value |
|-------|-------|
| Date | 2026-04-22 |
| Provider | GitHub Copilot CLI (non-interactive, `--yolo`) |
| Model | GPT-5 mini (Copilot CLI free-tier default at the time of the run) |
| Tier | Free |
| Fixtures | 7 |
| Assertions | 31 |
| Result | 31/31 pass |
| Source run | `sdlc_investigation_01/results/run-2026-04-22/promptfoo-results.json` |

## Caveats

- **Free-tier model.** Paid-tier models (Claude Sonnet 4.5, GPT-5) should perform at
  least as well; the baseline is intentionally conservative. A pass on free tier is
  strong evidence; a failure should be re-run on the pinned model in CI before
  concluding the plugin is at fault.
- **Pinned model in CI may differ.** `evals/promptfoo/run-copilot.sh` pins
  `COPILOT_MODEL=claude-sonnet-4.5` by default (current Copilot CLI free-tier
  default). If that drifts, regenerate this baseline.
- **One assertion in fixture 6 (Refuse Tailwind) was loosened to a regex** during
  the original investigation (`standards|requirements|rules|prohibited|...`)
  to avoid false negatives across CLIs. The vendored `promptfooconfig.yaml`
  carries that fix.

## Regenerating the baseline

When the pinned model is updated, or after a deliberate change to the plugin's
expected behaviour:

```sh
make evals
cp results/run-$(date +%Y-%m-%d)/promptfoo-results.json results/baseline/promptfoo-results.json
# update the table above with the new date and model
```

Commit the new baseline with the change that prompted it, in the same PR.
