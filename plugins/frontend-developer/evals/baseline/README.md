# Baseline eval results

This directory holds the reference runs that future evals are compared against.
A regression in any fixture relative to the matching baseline blocks a PR.

## One baseline per provider

The gate is provider-aware — a run is only ever compared against a baseline
recorded with the **same** provider, never across providers (a claude run and a
copilot run produce different output shapes and come from different models).

| Provider                | Results / baseline file          | Gated in CI |
| ----------------------- | -------------------------------- | ----------- |
| GitHub Copilot CLI      | `promptfoo-results.json`         | yes         |
| Claude Code (local)     | `promptfoo-results-claude.json`  | local-only  |

`scripts/evals.mjs` picks the file matching the provider it ran and passes it to
`check-regression.mjs`. If the matching baseline does not exist yet (e.g. the
first claude run), the gate is **skipped with a logged message** rather than
falling back to another provider's baseline — promptfoo's own exit code still
fails the run on any fixture failure. Promote a green run to a baseline by
copying its results file over the corresponding file here.

The copilot baseline below is the canonical, CI-gated reference. The claude
baseline is generated locally (no API key — subscription auth) once
`npm run evals:frontend:claude` scores 7/7.

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

- `plugins/frontend-developer/evals/run-copilot.mjs` — `COPILOT_MODEL=gpt-5-mini`
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
npm run evals:frontend
cp results/run-$(date +%Y-%m-%d)/promptfoo-results.json \
   plugins/frontend-developer/evals/baseline/promptfoo-results.json
# update the provenance table above with the new date and model
```

Commit the new baseline with the change that prompted it, in the same PR.
Update the model pin in `run-copilot.mjs` and `evals.yml` in the same PR if
that is what triggered the regeneration.

For the local claude baseline (subscription auth, no API key):

```sh
CLAUDE_PLUGIN_DIR=$PWD/plugins/frontend-developer npm run evals:frontend:claude
cp results/run-$(date +%Y-%m-%d)/promptfoo-results-claude.json \
   plugins/frontend-developer/evals/baseline/promptfoo-results-claude.json
```

The adversarial forbidden-tech fixtures pass on claude via its deterministic
hook block: the prompt is refused at turn 0 and `parse-claude-output.mjs`
surfaces the hook's refusal banner so the standards-language assertions match.

## How the regression gate uses this file

`plugins/frontend-developer/evals/check-regression.mjs` reads this file and
the new run's JSON, matches tests by `vars.prompt`, and exits non-zero if
any test that PASSED here now fails. With multiple providers in a single
run, a test must pass on **every** provider to count as passing — a
regression on any provider fails the gate. New tests added since the
baseline are not retroactively gated — promptfoo's own exit code already
fails the run on any fixture failure, so new fixtures are gated from their
first appearance.
