---
name: review-summary
description: Consolidate every per-file review into a single repository-level summary with a unified items table and an overall verdict. Use after the parent code-reviewer agent has invoked review-file for every changed file and verified 100% coverage.
license: OGL-UK-3.0
---

# Review Summary

Consolidate the per-file reviews under `reviews/<branch-or-pr>/file-reviews/*.review.md` into a single summary at `reviews/<branch-or-pr>/review.md`.

## Inputs

Your invoker provides:

- The path to the directory containing the per-file reviews.
- The path to write the summary to.
- The branch or PR identifier.
- The base ref and head ref.
- The acceptance criteria the change was meant to deliver (or "not provided").

## Steps

1. **List every per-file review** under `file-reviews/`. If any are missing, stop and ask the parent agent to backfill them — do not synthesise findings for a file that was not reviewed.

2. **For each per-file review, extract:**

   - The path and change type.
   - The verdict (SAFE / NEEDS ATTENTION / RISKY).
   - The Critical / Major / Minor counts.
   - Every row in the "Issues found" table.

3. **Renumber the consolidated items sequentially.** The per-file numbering restarts at 1 in each file; the consolidated table runs from 1 to N across all files.

4. **Compute the overall verdict** using the rules below.

5. **Write the summary** using the template below.

## Verdict rules

| Verdict             | Trigger                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------- |
| **PASS**            | All acceptance criteria met, every file SAFE, no Critical or Major issues open.          |
| **PASS WITH NOTES** | Acceptance criteria met, no Critical issues; one or more Major issues that are advisory. |
| **CONCERNS**        | Acceptance criteria partially met, or one or more Critical issues open.                  |
| **FAIL**            | Acceptance criteria not met, or Critical security / data-loss / regression risk.         |

Do not return **PASS** if any Critical issue is open.

## Template

Write exactly this structure.

```markdown
# Code Review: <branch-or-pr>

**Base:** <base-ref>
**Head:** <head-ref>
**Date:** <YYYY-MM-DD>
**Verdict:** PASS | PASS WITH NOTES | CONCERNS | FAIL

## Summary

<!-- 2–3 sentences. What does the change do, and what is the headline finding? -->

## Files reviewed

| File | Change type | Verdict | Critical | Major | Minor |
| ---- | ----------- | ------- | -------- | ----- | ----- |

<!-- One row per file under file-reviews/. Sort by path. -->

## Acceptance criteria check

| #   | Criterion | Met? | Notes |
| --- | --------- | ---- | ----- |

<!--
One row per AC. Met? is Yes / No / Partial.
If no AC was provided, replace the table with: "No acceptance criteria provided."
-->

## Items

| #   | File | Line | Severity | Category | Issue | Recommendation |
| --- | ---- | ---- | -------- | -------- | ----- | -------------- |

<!--
Concatenate every "Issues found" row from each file-review.
Renumber sequentially. Sort by Severity (Critical → Major → Minor) then by file path.
-->

## Risk matrix

| Category      | Risk level          |
| ------------- | ------------------- |
| Correctness   | Low / Medium / High |
| Code quality  | Low / Medium / High |
| Security      | Low / Medium / High |
| Test coverage | Low / Medium / High |
| Performance   | Low / Medium / High |

## Test coverage

- **Unit tests:** Present / Missing / Partial — <!-- one sentence -->
- **Integration tests:** Present / Missing / Partial — <!-- one sentence -->

## Configuration and environment

- **New environment variables:** <!-- list, or "None" -->
- **Database or schema changes:** <!-- list, or "None" -->
- **Dependency changes:** <!-- list, or "None" -->

## Conclusion

<!--
2–3 sentences ending with the verdict and the single most important action
the author should take next, if any.
-->
```

## Constraints

- Do not omit any per-file finding from the consolidated items table. If you think a finding is invalid, the right place to fix that is in the per-file review, not in the summary.
- Do not change the verdict rules. If the rules say CONCERNS, write CONCERNS even if you feel the change is fundamentally fine.
- Do not write the summary before every file under `file-reviews/` exists.
- Re-running this skill on an existing summary overwrites it. Do not append.
