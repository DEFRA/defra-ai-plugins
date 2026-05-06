---
name: defra-quality-gates
description: Defra code-quality gates — lint, format, test, and coverage must all pass before code is committed. The role plugin pins the exact toolchain (ESLint/Prettier/Vitest, dotnet format/xUnit, ruff/black/pytest, etc.); this skill states the universal expectations. Use before git commit, when wiring a new project, or when a hook reports a failure.
license: OGL-UK-3.0
---

# Defra quality gates

Every Defra service runs the same four gates before code lands on `main`:

1. **Lint** — the repo's linter exits 0 on the changed files.
2. **Format** — the repo's formatter has been applied; `--check` exits 0.
3. **Test** — the repo's test suite exits 0.
4. **Coverage** — line/branch coverage on changed files is ≥ the threshold for the role (default **80%** until the project owner pins a different number).

The role plugin pins the exact toolchain. Provisional defaults:

| Stack | Lint | Format | Test | Coverage tool |
|---|---|---|---|---|
| Node.js / frontend | ESLint | Prettier | Vitest | `vitest --coverage` (v8) |
| C# / .NET | `dotnet format --verify-no-changes` | `dotnet format` | xUnit (`dotnet test`) | Coverlet via `dotnet test --collect:"XPlat Code Coverage"` |
| Python | Ruff (`ruff check`) | Black | pytest | `pytest --cov` |

## The standard

- Run lint, format-check, test, and coverage **locally before pushing**, not just in CI. The companion hooks (`coverage-floor`, plus stack-specific lint/format hooks like `eslint-fix`, `prettier-fix`, `ruff-fix`, `black-fix`) automate this on file save where possible.
- A failing gate is **never** silenced with `// eslint-disable` / `# noqa` / `[SuppressMessage]` without a one-line justification comment naming the trade-off.
- Auto-fixers (`--fix`, `prettier --write`, `dotnet format`, `ruff --fix`, `black`) are run on the changed files, not on the whole repo, to keep diffs reviewable.
- The test runner exits non-zero on any unhandled console error / promise rejection where the framework supports it.
- Coverage is measured on the changed files (`vitest related --coverage`, `pytest --cov`, `dotnet test --collect`), not just on the file just edited. The `coverage-floor` hook fails the run when coverage falls below the threshold.

## Anti-patterns the agent must refuse

- Committing with a failing lint, format, or test gate "to be fixed later".
- Adding blanket `eslint-disable` / `# noqa` / `[SuppressMessage]` to make a gate pass without justification.
- Reducing the coverage threshold to make a fail go green.
- Deleting or skipping tests (`it.skip`, `[Fact(Skip="…")]`, `@pytest.mark.skip`) to make the suite pass.
- Mocking the function under test so its behaviour is never actually exercised.
- Running lint on the whole repo and committing every drive-by formatting change in one PR — keep the diff to the work in hand.

If the user asks the agent to commit with a failing gate, the agent refuses and offers to either fix the failure or split the failing change into a separate ticket.

## Worked example

Before committing, the agent runs (Node.js example):

```sh
npm run lint -- $(git diff --name-only --diff-filter=ACM main...HEAD | grep -E '\.(js|mjs)$')
npm run format -- --check
npm test -- --run
npx vitest related --coverage --run $(git diff --name-only --diff-filter=ACM main...HEAD | grep -E '\.(js|mjs)$')
```

If lint fails, the agent runs the auto-fixer on the affected files and re-runs the gate. If coverage falls below 80% on a changed file, the agent adds the missing tests before staging the commit. If the user explicitly says "skip the tests, I'll add them later", the agent answers:

> Defra quality gates require the test suite and coverage threshold to pass before commit. I won't push code with the suite skipped. I can either (a) add the missing tests now, or (b) revert the change behind a feature flag so it's invisible until tests land. Which would you like?

## TODO — open project-owner questions

- The exact coverage threshold per role is **not yet pinned** by the project owner; 80% is the working default. See the open-questions list in `docs/spec/PLAN.md` "Decisions still required" in the upstream planning repo.
- The Python linter and formatter (Ruff vs Flake8, Black vs Ruff-format) are provisional pins; the role plugin will update if the project owner picks a different set.
- Whether the GDS Service Standard adds extra gates for non-frontend roles is still an open question and will be reflected here once confirmed.
