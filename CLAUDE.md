# CLAUDE.md

Guidance for Claude Code (and other AI assistants) working in this repo. The
user-facing docs are README.md and CONTRIBUTING.md — read those first. This file
captures conventions that aren't obvious from the code or other docs and would
be costly to rediscover.

## What this repo is

A marketplace of GitHub Copilot CLI plugins. Each plugin under `plugins/`
encodes Defra software development standards (GOV.UK Design System, GDS service
standards, Defra security/accessibility requirements) so that Copilot CLI
produces compliant code by default.

Two plugins ship today (both v0.1.0): `frontend-developer` (full kit — agents,
skills, hooks, evals, eval-fixture) and `ticket-writer` (agents + skills only).
`frontend-developer` is the most complete reference, but its layout is a
superset, not a minimum. The minimum plugin is `plugin.json` + `README.md` + an
entry-point file (`agents/<name>.agent.md`, `agents/<name>.md`, or
`skills/<name>/SKILL.md`). `hooks/`, `evals/`, and `eval-fixture/` are optional
today.

## CI workflows

- `validate.yml` — schema and structural checks (manifests parse,
  marketplace.json sorted, frontmatter shapes match the format). Fast,
  deterministic, runs on every PR.
- `evals.yml` (forthcoming, separate PR) — behavioural eval. Drives Copilot
  CLI in non-interactive mode against the committed baseline. Held back
  until `COPILOT_GITHUB_TOKEN` is provisioned. The two workflows are
  intentionally separate concerns — don't merge them when `evals.yml` lands.

## Eval harness conventions

- **Evals are currently optional, will become mandatory.** Only
  `frontend-developer` ships evals today; `ticket-writer` does not. Treat the
  absence of `evals/` on a plugin as a known gap, not a bug. New plugins are
  encouraged to add evals; future iterations will gate merge on their
  presence.

- **Fixtures live under the plugin** — `plugins/<name>/evals/` (the
  promptfoo config and provider scripts) and `plugins/<name>/eval-fixture/`
  (the skeleton app the agent operates on). Both are plugin-scoped because
  fixtures and target stacks are plugin-specific.

- **Copilot CLI is the default provider.** The Claude Code provider
  (`run-claude.sh`) exists as a _demonstration_ that the harness is portable
  across CLIs — it has no CI gate and no committed baseline. Treat it as
  local-only.

- **Named-score buckets** (in `metric:` fields on assertions):
  `component_correctness`, `security`, `accessibility`, `lint_passes`,
  `refusal`. Reuse these in new fixtures so the CI dashboards stay consistent.
  Defined once in `CONTRIBUTING.md`'s metric table.

- **The combined report block** (`collect-and-report.sh`) is what
  promptfoo asserts against — a single text blob with section headers (`===
COPILOT OUTPUT ===`, `=== NJK TEMPLATES ===`, etc.). Section names are
  load-bearing: fixtures assert on strings that appear under specific sections
  (e.g. `exit_code: 0` for lint). Don't rename them without updating the
  fixtures.

- **Baseline + model pin must be regenerated together.** If you change
  `COPILOT_MODEL` in `run-copilot.sh`, you must also regenerate
  `plugins/frontend-developer/evals/baseline/promptfoo-results.json` and
  update its README provenance table in the same PR.

- **Regression gate semantics.** `check-regression.sh` matches tests by
  prompt text and treats a test as passing only if every provider that ran it
  passed. New tests aren't retroactively gated — promptfoo's exit code fails
  the run on any fresh failure, so they're gated from first appearance.

## Plugin structure quirks

- **`hooks/hooks.json` uses Claude Code hook schema** (`PostToolUse`,
  `PreToolUse`, `$CLAUDE_PROJECT_DIR`). The plugin is described as a Copilot
  CLI plugin in its manifest and READMEs, but hooks are Claude-Code-specific.
  Treat the plugin as effectively dual-CLI for hook purposes; revisit when
  `plugin.json` schema gains an explicit `targets` field.

- **Three entry-point formats are supported** for the agent file —
  Copilot custom agent (`<name>.agent.md`), Claude Code agent (`<name>.md`),
  or skill (`skills/<name>/SKILL.md`). The validator picks one based on what's
  present. See CONTRIBUTING.md step 5.

## Things to not do

- Don't commit per-run eval results (`results/run-*/`) — they're gitignored
  and only the baseline goes in git.
- Don't add the Claude provider to CI without also adding a Claude
  baseline — the regression gate requires per-provider parity.
- Don't rename combined-block section headers without grepping every
  fixture's assertions.
- Don't use destructive git operations on this branch without asking —
  the baseline file is the only on-disk record of the current pass-rate
  reference.
