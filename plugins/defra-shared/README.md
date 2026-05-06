# defra-shared

A Copilot CLI / Claude Code plugin that ships Defra's cross-cutting standards as installable **skills** and guardrail **hooks**. Every other Defra plugin references these skills by name in its system prompt and inherits these hooks by default — so the cross-cutting rules live in one place and stay consistent across the v1 set.

## What it provides

**Five skills** (the standards, written for an agent to read):

- `defra-branching` — no commits to `main` / `master`; feature-branch + pull-request workflow.
- `defra-commit-messages` — provisional Conventional Commits format (subject ≤ 72 chars, imperative, no trailing period).
- `defra-quality-gates` — lint, format, test, and ≥ 80% coverage all pass before commit.
- `defra-security-pii` — no hard-coded secrets, no PII in logs, no unsafe template patterns.
- `defra-accessibility` — WCAG 2.2 AA for code-generating roles; semantic markup for documentation roles.

**Five hooks** (the guardrails, enforced by the host CLI on tool use):

| Hook                    | Event                          | Sync?         | What it does                                                                                                          |
| ----------------------- | ------------------------------ | ------------- | --------------------------------------------------------------------------------------------------------------------- |
| `branch-guard`          | `PreToolUse` on `Bash`         | sync (blocks) | Refuses `git commit` / `git push` while `HEAD` is on `main` / `master`.                                               |
| `commit-message-format` | `PreToolUse` on `Bash`         | sync (blocks) | Refuses `git commit -m "<msg>"` when `<msg>` does not match Conventional Commits.                                     |
| `secret-scan`           | `PreToolUse` on `Edit\|Write`  | sync (blocks) | Refuses writes that contain AWS keys, private-key blocks, GitHub / Slack tokens, or `apiKey: "…"`-shaped credentials. |
| `pii-scan`              | `PostToolUse` on `Edit\|Write` | async (warns) | Warns when a file contains UK NI numbers, NHS numbers, postcodes, or `dd/mm/yyyy` DoBs.                               |
| `coverage-floor`        | `PostToolUse` on `Bash`        | async (warns) | Parses test runner output and warns when coverage falls below 80% (override via `COVERAGE_FLOOR`).                    |

## What it does _not_ provide

> **No agent — see why**
>
> Unlike every other plugin in the v1 set, `defra-shared` does not ship an `agents/` directory. That is **deliberate**, not an oversight. This plugin's role is to be the single source of truth for the cross-cutting standards; **any** agent (the role-specific plugins, ad-hoc Copilot / Claude Code sessions) can reference its skills by name. Adding an agent here would either duplicate the role-specific plugins (against the design in `docs/design/shared_skills.md` Option A "inline duplication") or create a vague meta-agent that owns nothing in particular.
>
> The skills and hooks are inherited by reference: when a role plugin's system prompt says "see skill `defra-commit-messages`", the host CLI resolves it from any installed plugin — so installing `defra-shared` alongside the role plugin is enough. If `defra-shared` is not installed, role plugins fall back to short inline restatements; the soft-handoff principle (per `docs/requirements/non_goals.md`) keeps this graceful.

## Install

From the marketplace:

```sh
copilot plugin marketplace add DEFRA/defra-ai-plugins
copilot plugin install defra-shared@defra-ai-plugins
```

```sh
claude plugin marketplace add DEFRA/defra-ai-plugins
claude plugin install defra-shared@defra-ai-plugins
```

From a local checkout (for development):

```sh
copilot plugin install ./plugins/defra-shared
```

Once installed, the skills are discoverable to any other agent on the same host CLI; the hooks fire automatically on the matching tool use.

## Standards encoded

- Defra project conventions and branching strategy (`defra-branching`).
- Defra commit-message format (`defra-commit-messages`).
- Code-quality gates: linter, formatter, test runner, coverage floor (`defra-quality-gates`).
- Security and PII handling: secrets, UK PII patterns, unsafe template patterns (`defra-security-pii`).
- Accessibility: WCAG 2.2 AA for code-generating roles, semantic-markup for docs roles (`defra-accessibility`).

## Anti-patterns it refuses

- `git commit` / `git push` on `main` / `master` (branch-guard, sync).
- Commit subjects like `WIP`, `update`, past-tense, or > 72 chars (commit-message-format, sync).
- Hard-coded AWS keys, private-key blocks, GitHub / Slack tokens, `apiKey: "…"`-shaped credentials (secret-scan, sync).
- Files containing UK NI numbers, NHS numbers, postcodes, or `dd/mm/yyyy` DoBs in non-fixture paths (pii-scan, async).
- Test runs that drop coverage below 80% (coverage-floor, async).

## Eval status

The plugin's eval suite drives every hook against the `eval-fixture/` end-to-end and asserts on stderr / exit codes; it also asserts that all five skill files load and that the hooks catalogue parses as JSON.

Last run: _not yet baselined_ (this is the first commit of the plugin). Pass-rate per metric will populate the table below once `evals/baseline/promptfoo-results.json` is committed.

| metric        | pass-rate |
| ------------- | --------- |
| correctness   | —         |
| security      | —         |
| accessibility | —         |
| lint_passes   | —         |
| refusal       | —         |

Run locally:

```sh
cd plugins/defra-shared/evals
npx promptfoo eval
./check-regression.sh output.json
```

## Suggested handoffs

- Every other Defra plugin references these skills in its system prompt — `frontend-developer`, `nodejs-backend-developer`, `csharp-backend-developer`, `python-backend-developer`, `test-engineer`, `technical-writer`, `plugin-author`. When `defra-shared` is installed, those plugins inherit the cross-cutting hooks too.
- See `docs/design/handoff_patterns.md` in the upstream planning repo for the canonical phrasing role plugins use when invoking these skills.

## Open questions (provisional content marked TODO in-skill)

The skills land what is confirmed and mark the rest TODO with a link back to the open-questions list:

- Final commit-message format (provisional: Conventional Commits).
- Welsh-language inclusion across content (out of scope for v1 unless confirmed).
- GDPR-specific tooling beyond PII handling (out of scope for v1; see `docs/requirements/non_goals.md`).
- GDS Service Standard for non-frontend roles.
- Secret-scan tool (provisional: `gitleaks`).
- PII pattern set (UK NI / postcodes / NHS numbers / DoB combos — provisional).

## Licence

Open Government Licence v3.0. See [LICENSE](../../LICENSE).
