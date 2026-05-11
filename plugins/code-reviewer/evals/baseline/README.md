# Baseline

The regression gate compares each eval run against a committed baseline at `baseline/promptfoo-results.json`. That file is intentionally absent today — the repository's Copilot CLI CI gate is blocked on provisioning the `COPILOT_GITHUB_TOKEN` secret (see the top-level README §CI), so there is no environment in which a canonical baseline can be produced and signed off.

When the gate is provisioned (or a maintainer runs the eval suite locally for the first time), generate the baseline with:

```sh
make code-reviewer-evals
cp results/run-YYYY-MM-DD/promptfoo-results-code-reviewer.json \
   plugins/code-reviewer/evals/baseline/promptfoo-results.json
```

Commit the resulting file with a note in the commit message recording the model id and the date.

`check-regression.sh` is intentionally a no-op (with a warning) when the baseline file is missing, so the eval suite still exits zero pre-baseline and a future automation run can seed the file without that being its only blocker.
