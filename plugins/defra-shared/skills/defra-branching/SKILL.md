---
name: defra-branching
description: Defra branching strategy — never commit or push directly to main or master. Use a feature branch named for the work, open a pull request, get review, then merge. Use when the agent is about to run git commit, git push, or git checkout, or when a developer asks how to start a piece of work.
license: OGL-UK-3.0
---

# Defra branching

Defra repositories use a feature-branch workflow. Direct commits to `main` (or `master` on older repos) are forbidden. Every change goes through a feature branch and a pull request, even one-line changes.

## The standard

1. Start every piece of work on a fresh branch off the latest `main`:
   ```sh
   git checkout main
   git pull --ff-only
   git checkout -b <prefix>/<short-description>
   ```
2. Branch name uses a kebab-case description and a conventional prefix:
   - `feature/<name>` for new functionality
   - `fix/<name>` for bug fixes
   - `chore/<name>` for tooling, deps, refactors with no behaviour change
   - `docs/<name>` for documentation-only changes
   - When the work tracks a Jira ticket, prefix with the ticket id, e.g. `feature/CAIT-96-defra-shared-plugin`.
3. Push the branch to `origin` and open a pull request. Never `git push` directly to `main` / `master`.
4. Merge only via pull request, after review and after CI is green.

The companion hook `branch-guard` enforces this: any `git commit` or `git push` while `HEAD` is on `main` / `master` is blocked, and any `git push -f` / `--force` / `--force-with-lease` whose args mention `main` / `master` is blocked from any branch (force-push to a protected branch is refused even when you are not currently on it).

## Anti-patterns the agent must refuse

- `git commit` on `main` / `master` — even "just this once".
- `git push origin main` / `git push origin master`.
- `git push --force` to a shared branch (rebase locally, then `--force-with-lease` to your own feature branch only).
- Working on a long-lived `develop` branch in parallel with `main` — Defra repos use trunk-based branching off `main` only.
- Committing generated artefacts (build output, `node_modules/`, `.env`) onto any branch.
- Renaming or deleting `main` / `master`.

If a user asks the agent to do any of the above, the agent refuses and explains the standard.

## Worked example

User: "I've made a small typo fix in the README, just commit it on main."

Agent response:

> I can't commit directly to `main` — Defra branching requires every change to go through a feature branch and a pull request, even one-line fixes. Here's what I'll do instead:
>
> ```sh
> git checkout -b docs/fix-readme-typo
> git add README.md
> git commit -m "docs: fix typo in install instructions"
> git push -u origin docs/fix-readme-typo
> ```
>
> Then open a pull request from `docs/fix-readme-typo` into `main`. Want me to draft the PR description as well?

If the agent is already on `main` when the user asks for a commit, it switches to a new branch first — it does not just commit and hope.

## TODO — open project-owner questions

- The exact branch-prefix convention (`feature/` vs `feat/` vs Jira-id-only) is not yet pinned by the project owner. The provisional set above (`feature/`, `fix/`, `chore/`, `docs/`) is what this skill enforces until that lands. See the open-questions list in `docs/spec/PLAN.md` "Decisions still required" in the upstream planning repo.
