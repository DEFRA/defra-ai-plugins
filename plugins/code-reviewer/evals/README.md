# code-reviewer evals

Behavioural eval harness for the `code-reviewer` plugin. Same shape as `plugins/frontend-developer/evals/`: promptfoo drives Copilot CLI (and optionally Claude Code) against a clean copy of the eval fixture and asserts on the agent's stdout plus the markdown review files it produces.

## Layout

```
evals/
├── promptfooconfig.yaml        # test cases and provider wiring
├── run-copilot.sh              # default CI provider
├── run-claude.sh               # local-only cross-provider demo
├── collect-and-report.sh       # shared snapshot / review-extraction helpers
├── check-regression.sh         # baseline regression gate
├── summarise.sh                # markdown summary for CI step output
└── baseline/                   # reference run (see "Baseline" below)
```

## Running locally

Prerequisites:

```sh
npm install -g @github/copilot
copilot plugin marketplace add DEFRA/defra-ai-plugins
copilot plugin install code-reviewer@defra-ai-plugins
```

Then from the repository root:

```sh
make code-reviewer-evals
```

Results land in `results/run-YYYY-MM-DD/promptfoo-results-code-reviewer.json`. `make code-reviewer-evals` also runs `check-regression.sh`, which compares against `baseline/promptfoo-results.json` and exits non-zero on any per-fixture regression.

To run against Claude Code instead (requires `ANTHROPIC_API_KEY` and the `claude` CLI):

```sh
make code-reviewer-evals-claude
```

## Eval fixture

`plugins/code-reviewer/eval-fixture/` is a small Hapi project skeleton with a seeded git history: a base commit on `main`, and a feature branch with a deliberate set of issues for the reviewer to catch (missing CSRF crumb on a state-changing route, a route handler with no associated tests, and a stale comment).

The provider scripts run `./bin/seed-git.sh` in the temp working copy to initialise the repo, commit the base state to `main`, then check out the feature branch with the planted changes. The agent is then asked to `git diff origin/main...HEAD` and review the diff.

The fixture intentionally keeps the diff small so:

- The eval is cheap to run.
- The planted issues are unambiguous, so assertion text is straightforward.
- The fixture is easy to update without rebaselining the whole suite.

## Baseline

The committed baseline at `baseline/promptfoo-results.json` is the reference run for the regression gate. Until the repo's Copilot CLI CI gate is provisioned (`COPILOT_GITHUB_TOKEN` — see the repo README §CI), the baseline lives as a placeholder. To (re)generate it the first time you run the suite locally:

```sh
make code-reviewer-evals    # produces results/run-YYYY-MM-DD/promptfoo-results-code-reviewer.json
cp results/run-YYYY-MM-DD/promptfoo-results-code-reviewer.json \
   plugins/code-reviewer/evals/baseline/promptfoo-results.json
```

Commit the result with a note explaining which model and date were used. The regression gate then prevents any subsequent change from making a passing fixture fail without an explicit rebaseline.
