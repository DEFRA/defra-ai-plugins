# code-reviewer eval fixture

A minimal Hapi project skeleton used by `plugins/code-reviewer/evals/` to give the agent something realistic to review.

## How it is wired up

The provider scripts (`evals/run-copilot.sh`, `evals/run-claude.sh`) copy this directory into a temp working copy and run `./bin/seed-git.sh` to:

1. `git init` in the working copy.
2. Stage and commit the base state to a `main` branch.
3. Configure `origin` as a local alias for the same repo (so `origin/main` resolves).
4. Apply the planted feature-branch changes (see `bin/seed-git.sh`).
5. Commit them on a `feature-x` branch.

The agent is then asked to `git diff origin/main...HEAD` and produce a review under `reviews/feature-x/`.

## Planted issues

The feature branch deliberately contains issues that an attentive reviewer should flag, so the eval can assert on what the agent catches:

| Issue                                        | Severity | Category   |
| -------------------------------------------- | -------- | ---------- |
| State-changing POST route with no CSRF crumb | Critical | Security   |
| New route handler with no associated test    | Major    | Tests      |
| Stale comment that no longer matches code    | Minor    | Quality    |

The list is intentionally short so the eval is cheap and the assertions are unambiguous.
