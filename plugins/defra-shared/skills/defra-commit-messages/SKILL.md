---
name: defra-commit-messages
description: Defra commit-message format — provisionally Conventional Commits (type(scope) subject + optional body and footers). Subject ≤ 72 chars, imperative mood, no trailing period. Use whenever the agent is about to run git commit -m, draft a commit message for a developer, or review an existing commit message.
license: OGL-UK-3.0
---

# Defra commit messages

Until the project owner pins a final format, Defra repositories use **Conventional Commits**. The commit message is a contract: it tells future readers (and changelog generators) what changed and why.

## The standard

Commit subject:

```
<type>(<optional-scope>): <subject>
```

- `<type>` is one of: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`, `ci`, `perf`, `style`, `revert`.
- `<scope>` is optional, in lowercase, naming the area (e.g. `frontend`, `auth`, `deps`).
- `<subject>` is imperative mood ("add", not "added" / "adds"), starts lowercase, has no trailing period, and is ≤ 72 characters.

Optional body, separated by a blank line, wrapped at ~72 chars, explaining **why** rather than **what**.

Optional footers (one per line) include:

- `BREAKING CHANGE: <description>` — required when the change breaks API or behaviour.
- `Refs: CAIT-123` — link to the Jira ticket the work tracks.
- `Co-authored-by: Name <email>` — for pair work.

The companion hook `commit-message-format` enforces the subject regex on every `git commit -m` / `--message`. It additionally refuses forms that bypass subject inspection — `-F` / `--file`, `--template`, `-C` / `--reuse-message`, `--fixup`, `--squash`, and editor-driven commits (no `-m`) — and tells the agent to use `-m "type(scope): subject"` instead. `git commit --amend --no-edit` is explicitly allowed, since it reuses an already-validated message.

## Anti-patterns the agent must refuse

- `WIP`, `wip`, `temp`, `fix`, `update`, `stuff`, `.` — non-informative subjects.
- Subjects in the past tense ("added X", "fixed bug").
- Subjects ending in a period.
- Subjects longer than 72 characters.
- Type missing (`add date-of-birth field` instead of `feat: add date-of-birth field`).
- Mixing several unrelated changes in one commit. Split into one commit per logical change.
- Putting the ticket ID in the subject; it belongs in the footer (`Refs: CAIT-123`).
- Bypassing subject validation via `git commit -F <file>`, `--template`, `-C <hash>`, `--reuse-message`, `--fixup`, `--squash`, or by letting the editor open. Use `-m "type(scope): subject"` so the hook can read it.

If a user asks the agent to commit with a non-conforming message, the agent rewrites the message and explains why.

## Worked example

Conforming:

```
feat(frontend): add date-of-birth field to registration form

Adds a GOV.UK date input with day/month/year fields, Joi validation,
and an error-summary entry for each invalid sub-field.

Refs: CAIT-104
```

Non-conforming, rewritten:

```
# Before
git commit -m "added DOB field"

# After (agent rewrites)
git commit -m "feat(frontend): add date-of-birth field to registration form"
```

The agent volunteers the imperative-mood and missing-type fixes without being asked.

## TODO — open project-owner questions

- The final commit-message format for Defra is **not yet pinned** by the project owner. Conventional Commits is the working assumption per the v1 plan. If the owner picks a different convention (e.g. plain prose with a Jira-id prefix), this skill and the `commit-message-format` hook update together. See the open-questions list in `docs/spec/PLAN.md` "Decisions still required" in the upstream planning repo.
- Welsh-language subject lines: out of scope for v1 unless the project owner confirms it. See `docs/requirements/non_goals.md`.
