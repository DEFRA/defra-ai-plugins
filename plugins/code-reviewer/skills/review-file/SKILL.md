---
name: review-file
description: Produce a structured review of a single changed file as part of a multi-file pull-request review. Use once per file enumerated from the diff — the parent code-reviewer agent invokes this skill in a loop. Writes a fixed-shape file-review markdown so the downstream summary skill can collate findings consistently.
license: OGL-UK-3.0
---

# Review File

Produce a review of **one file**. The parent `code-reviewer` agent calls this skill once per changed file.

## Inputs

Your invoker provides:

- The repository or working directory.
- The file path (relative to the repo root).
- The base ref and head ref (or the PR number).
- Where to write the output (the agent computes the path).

## Steps

1. **Read the diff for this file only.**

   ```
   git diff <base-ref>...<head-ref> -- <file-path>
   ```

   The hunks define your scope. Lines outside these hunks are out of scope unless the change substantially rewrote a function that contains them.

2. **Read the full file** for context — but flag findings only against changed lines (per the rule above).

3. **Read any best-practices documents** the agent passed in. For Defra services, this typically includes the software development standards and any GDS guidance relevant to the file type.

4. **Walk the review criteria** for the changed lines: correctness, code quality, best practices, error handling, security, performance, test coverage.

5. **Write the review** to the path the agent provided, using the template below verbatim.

## File-type guidance

| Type                                | Check for                                                              |
| ----------------------------------- | ---------------------------------------------------------------------- |
| Tests (`*.test.*`, `*.spec.*`)      | Coverage of branches, edge cases, isolation, meaningful assertions.    |
| Config (`*.json`, `*.yml`, `.env*`) | Correct values, no secrets in source, consistency across environments. |
| Manifests (`package.json`, etc.)    | Pinned versions, dev vs prod, dependency advisories.                   |
| Lock files                          | Consistency with the manifest; concerning transitive dependencies.     |
| Generated files                     | Should not be hand-edited; flag any apparent manual changes.           |
| Documentation                       | Accurate, not contradicted by the code change, no stale references.    |

## Severity

- **Critical** — bugs, security, data loss, regressions.
- **Major** — quality or maintainability that will hurt the next reader.
- **Minor** — style, nits, suggestions.

## Template

Write exactly this structure. Keep section headings even if a section is empty (write "None." underneath).

```markdown
# File Review: <path/to/file.ext>

**Change type:** Added | Modified | Deleted
**Lines changed:** +X / -Y

## Summary

### What changed

<!-- One short paragraph. State what the diff does, in your own words. -->

### Why

<!-- One sentence linking the change to the acceptance criteria or stated reason. -->

## Analysis

<!--
Walk the key changes function by function or block by block.
For each, note what it does, any concerns, and any positives worth calling out.
-->

## Issues found

| #   | Line | Severity | Category | Issue | Recommendation |
| --- | ---- | -------- | -------- | ----- | -------------- |

<!--
One row per issue. If there are none, replace the table with the single
line: "None."

Severity is one of Critical / Major / Minor.
Category is one of Correctness / Quality / Best practices / Error handling /
Security / Performance / Tests.
-->

## Risk assessment

- **Edge cases:** <!-- list, or "None identified" -->
- **Error handling:** <!-- list, or "None identified" -->
- **Security:** <!-- list, or "None identified" -->

## Test coverage

| Test file | Covers this change? | Notes |
| --------- | ------------------- | ----- |

<!-- One row per test file relevant to this change. Use "None." if there are no relevant tests. -->

## Verdict

**Status:** SAFE | NEEDS ATTENTION | RISKY

**Reason:** <!-- One sentence. -->

| Critical | Major | Minor |
| -------- | ----- | ----- |
| X        | X     | X     |
```

## When to mark the file SAFE

- No Critical or Major issues.
- The change is covered by tests, or is the kind of change that does not require new tests (e.g. comment fixes).
- The diff matches the stated acceptance criteria.

## When to mark the file RISKY

- One or more Critical issues.
- Security boundary affected without compensating tests.
- Behaviour change in a production code path with no corresponding test update.

Use **NEEDS ATTENTION** for everything in between.

## Constraints

- Do not invent issues to look thorough. If the file is fine, say so and move on.
- Do not propose refactors outside the diff.
- Do not edit the source file. This skill writes the review markdown only.
