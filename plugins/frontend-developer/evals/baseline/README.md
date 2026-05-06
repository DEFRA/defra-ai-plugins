# Baseline eval results

This directory holds the reference run that future evals are compared against.
A regression in any fixture relative to this file blocks a PR.

## Provenance

| Field                         | Value                                              |
| ----------------------------- | -------------------------------------------------- |
| Date                          | 2026-04-28                                         |
| Provider                      | GitHub Copilot CLI (non-interactive, `--yolo`)     |
| Model (matches pinned)        | `gpt-5-mini`                                       |
| Tier                          | Premium-request budget (per Copilot subscription)  |
| Fixtures                      | 7                                                  |
| Assertions                    | 32                                                 |
| Result                        | 7/7 tests, 32/32 assertions                        |
| Duration                      | 4m 38s (concurrency 4)                             |

The pin lives in two places and must match this file:

- `plugins/frontend-developer/evals/run-copilot.sh` — `COPILOT_MODEL=gpt-5-mini`
- `.github/workflows/evals.yml` — `COPILOT_MODEL: gpt-5-mini`

## Caveats

- **The Tailwind-refusal fixture loosens its standards-language assertion to a regex**
  (`standards|requirements|rules|prohibited|...`). Phrasing varies enough between
  models and runs that exact-match would false-negative; the regex still requires
  the refusal to be grounded in standards/rules language rather than an arbitrary
  decline.
- **Free-tier model.** GPT-5 mini is the Copilot CLI free-tier default at the time
  of writing. Paid-tier models should perform at least as well, so a pass here is
  strong evidence the plugin is healthy. A failure on a paid model against a
  free-tier baseline is the noisier case — re-run on the same model before
  concluding the plugin is at fault.

## Regenerating the baseline

When the pinned model is updated, or after a deliberate change to the plugin's
expected behaviour:

```sh
make frontend-evals
cp results/run-$(date +%Y-%m-%d)/promptfoo-results.json \
   plugins/frontend-developer/evals/baseline/promptfoo-results.json
# update the provenance table above with the new date and model
```

Commit the new baseline with the change that prompted it, in the same PR.
Update the model pin in `run-copilot.sh` and `evals.yml` in the same PR if
that is what triggered the regeneration.

## How the regression gate uses this file

`plugins/frontend-developer/evals/check-regression.sh` reads this file and
the new run's JSON, matches tests by `vars.prompt`, and exits non-zero if
any test that PASSED here now fails. With multiple providers in a single
run, a test must pass on **every** provider to count as passing — a
regression on any provider fails the gate. New tests added since the
baseline are not retroactively gated — promptfoo's own exit code already
fails the run on any fixture failure, so new fixtures are gated from their
first appearance.
