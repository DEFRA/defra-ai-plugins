---
name: refine-ticket
description: Review an existing JIRA ticket draft to assess whether it is ready for team refinement. Use when evaluating a ticket that has already been written, to decide if the team can estimate it or whether more context is needed first.
---

# Refine Ticket

## When to Use

Use this skill to **evaluate an existing ticket draft** before it goes into a refinement session. The other ticket-writer skills (`story-ticket`, `task-ticket`) create new tickets; this skill reviews one that already exists and produces a structured readiness verdict.

A ticket is ready for refinement when the team can:

- Understand what needs to be done.
- Identify the repositories and components affected.
- Estimate the effort.
- Identify the risks and dependencies.

## Workflow

1. **Load the draft.** Ask the user for the path to the ticket file (or a pasted draft) and read it in full.
2. **Identify the relevant code.** Ask which repositories and components the work touches. If the user is unsure, look for the systems implied by the description and ask follow-up questions to confirm.
3. **Run the readiness checklist** (see below) against the draft.
4. **Write the review** to the agreed save location and report the verdict.

## Readiness Checklist

Use these four dimensions. For each, note whether the draft passes and capture any gaps.

### Description Clarity

| Check       | Question                              |
| ----------- | ------------------------------------- |
| Context     | Is the "why" explained?               |
| Scope       | Is in-scope and out-of-scope clear?   |
| Specificity | Are there concrete details to act on? |

### Acceptance Criteria

| Check       | Question                              |
| ----------- | ------------------------------------- |
| Present     | Are acceptance criteria written?      |
| Testable    | Can each criterion be verified?       |
| Complete    | Do they cover the full scope?         |
| Unambiguous | Is there only one reasonable reading? |

### Technical Clarity

| Check        | Question                                    |
| ------------ | ------------------------------------------- |
| Repositories | Are the affected repositories identified?   |
| Approach     | Is the implementation direction understood? |
| Dependencies | Are blockers and prerequisites called out?  |
| Risks        | Are technical risks called out explicitly?  |

### Estimability

| Check    | Question                                               |
| -------- | ------------------------------------------------------ |
| Sized    | Could the team plausibly fit this in a single sprint?  |
| Unknowns | Are there too many unknowns to estimate confidently?   |
| Spike    | Is investigation work needed before this can be sized? |

## Template

Use the [review template](./assets/template.md) as your starting structure.

If the user has provided a custom review template for this session, use that instead.

## Clarification Questions

Before writing the review, confirm:

1. **Ticket location** — where is the draft (file path, ticket ID, or pasted text)?
2. **Repositories in scope** — which codebases are affected?
3. **Reviewer perspective** — is this a developer review, product review, or both?
4. **Save location** — where should the review file be written?

If still unclear, ask about:

- The broader epic or initiative the ticket sits within.
- Whether the work is a feature, bug, or technical task.
- Any constraints (deadline, compliance, dependency on another team).

## Verdict Guidelines

The review must end in one of three verdicts:

| Verdict            | Criteria                                                                        |
| ------------------ | ------------------------------------------------------------------------------- |
| **READY**          | Description is clear, acceptance criteria are testable, the team can estimate.  |
| **NEEDS WORK**     | Specific information is missing; list what to add before refinement.            |
| **SPIKE REQUIRED** | Too many unknowns; recommend a time-boxed investigation before sizing the work. |

The verdict must be supported by the gaps recorded in the checklist — do not return **READY** if any gap is unresolved.

## Save Location

Default: `tickets/refinement/<ticket-name>.review.md` where `<ticket-name>` matches the draft's filename or identifier (lowercase, hyphenated). Always confirm the path with the user before writing.

## Example

Given a draft titled "Manage Notification Preferences" with a clear user story and five acceptance criteria, but no repository identified:

- Description Clarity → pass.
- Acceptance Criteria → pass.
- Technical Clarity → **fail** (no repositories named).
- Estimability → uncertain (depends on technical clarity).

**Verdict:** NEEDS WORK — name the affected frontend and notification-service repositories and confirm whether the preference store already exists before refinement.
