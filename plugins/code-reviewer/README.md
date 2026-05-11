# code-reviewer

A GitHub Copilot CLI plugin that performs post-write multi-file code review of a feature branch or pull request. The agent walks every changed file, applies a per-file review template, and produces a single consolidated repository-level summary.

## What it provides

A custom agent (**`code-reviewer`**) backed by two skills:

- **`review-file`** — fixed-shape review of a single changed file, written to `reviews/<branch-or-pr>/file-reviews/<path>.review.md`.
- **`review-summary`** — consolidates every per-file review into one `reviews/<branch-or-pr>/review.md` with a unified items table and an overall verdict.

## When to use this plugin (vs `frontend-developer/pre-commit-review`)

The `frontend-developer` plugin ships a `pre-commit-review` skill that runs a self-check **before** the author commits. It is a checklist for the author, not a written review of a diff.

This plugin is the other side: **after** the diff exists (on a branch or in a PR), it produces a written, multi-file review that a maintainer can sign off on. The two are intentionally complementary:

|                   | `pre-commit-review` skill | `code-reviewer` plugin   |
| ----------------- | ------------------------- | ------------------------ |
| When              | Before committing         | After branch / PR exists |
| Audience          | Author                    | Independent reviewer     |
| Output            | Author marks a checklist  | Written review artefact  |
| Scope             | Whole working tree        | Diff between two refs    |
| Stack assumptions | Defra Hapi + Nunjucks     | Language-agnostic        |

## Install

From the marketplace:

```sh
copilot plugin marketplace add DEFRA/defra-ai-plugins
copilot plugin install code-reviewer@defra-ai-plugins
```

Direct from the repository:

```sh
copilot plugin install DEFRA/defra-ai-plugins
```

From a local checkout (for development):

```sh
copilot plugin install ./plugins/code-reviewer
```

## Use

In an interactive Copilot CLI session:

```
/agent code-reviewer
```

Then tell the agent which branch or PR to review, what acceptance criteria it should be measured against, and where the project's standards documents live. The agent will:

1. Enumerate the changed files between the base and head refs.
2. Invoke `review-file` once per file, writing a per-file review markdown.
3. Verify 100% coverage of changed files.
4. Invoke `review-summary` to produce the consolidated summary.
5. Report the verdict and the path to the summary.

Default output directory: `reviews/<branch-or-pr>/` at the repository root.

## Output layout

```
reviews/<branch-or-pr>/
├── review.md                        # consolidated summary + verdict
└── file-reviews/
    ├── src_routes_register.js.review.md
    ├── src_views_register.njk.review.md
    └── ...                          # one per changed file
```

## Verdict rubric

| Verdict             | Means                                                           |
| ------------------- | --------------------------------------------------------------- |
| **PASS**            | AC met, every file SAFE, no Critical or Major issues open.      |
| **PASS WITH NOTES** | AC met, no Critical issues; Major issues are advisory only.     |
| **CONCERNS**        | AC partially met, or one or more Critical issues open.          |
| **FAIL**            | AC not met, or Critical security / data-loss / regression risk. |

The agent will never write **PASS** while any Critical issue is open.

## Evals

This plugin ships an eval suite at [`evals/`](evals/) following the same shape as `frontend-developer`. Run it locally with:

```sh
make code-reviewer-evals
```

See the repository README §Evaluating for prerequisites (Copilot CLI install, plugin install, model pinning). A baseline is required for the regression gate — see [`evals/README.md`](evals/README.md) for how to (re)generate it the first time you run the suite.

## See also

- [`agents/code-reviewer.agent.md`](agents/code-reviewer.agent.md) — the full agent prompt
- [`skills/review-file/SKILL.md`](skills/review-file/SKILL.md) — per-file review template
- [`skills/review-summary/SKILL.md`](skills/review-summary/SKILL.md) — consolidated-summary template
- [Defra software development standards](https://github.com/DEFRA/software-development-standards)

## Licence

Open Government Licence v3.0. See [LICENSE](../../LICENSE).
