---
name: ixd-wrap-up
description: At the end of an interaction-design session, write a session-summary entry on top of the per-stage entries already in `DESIGN_HISTORY.md`. Names the brief in scope, the journey shape, the pages a spec was written for, decisions made, and open questions for next session. Invoke only after one or more of `ixd-read-corpus`, `ixd-frame-policy`, `ixd-map-journey`, `ixd-spec-page` have run in this session.
---

# ixd-wrap-up

Fifth and final leaf skill. Per-stage journal entries accumulate during a design
session, one per skill invocation. What's missing at the end is a coherent
**session summary** sitting on top of those entries — one entry naming what the
session produced, what was decided, and what's parked. This skill writes that.

**Load-bearing constraints**: (1) the summary heading `## Session wrap-up —
<YYYY-MM-DD>: <title>` is a **locked format** — future invocations grep `^##
Session wrap-up` to find session boundaries, so the shape must not drift; (2)
the summary is a **table of contents and a parking lot**, never a duplicate of
per-stage narrative — if a designer wants detail of what `ixd-frame-policy`
decided, they read that per-stage entry, not the summary.

## When to use

- At the end of an interaction-design session, after the per-stage skills have run and the designer is ready to commit.
- Standalone, when the designer wants to summarise a `DESIGN_HISTORY.md` they didn't wrap up at the end of the prior session.

This skill writes a design-session summary only. It is not a general
end-of-coding-session ritual (reflect/simplify/verify/devlog, kanban moves) —
if your host environment has a skill like that, use this one for
design-session summaries and that one for wrapping up a working session.

## Process

**On invocation, work through the steps below in order — read, parse, write —
without pausing for confirmation unless a step explicitly requires it.**

### 1. Find the session boundary

Read `DESIGN_HISTORY.md` at the current working directory. Identify the
per-stage entries since the last `## Session wrap-up` heading (or all entries
from the top, if none exists).

Session-summary headings have the form:

```
## Session wrap-up — <YYYY-MM-DD>: <title>
```

Per-stage headings have the form:

```
## <YYYY-MM-DD> — <skill> on <subject>
```

Different shape; scan for `^## Session wrap-up` to find boundaries.

If `DESIGN_HISTORY.md` is missing, stop: "I'm looking for per-stage entries to
summarise. Run a design session first (`/ixd-read-corpus` → `/ixd-frame-policy`
→ `/ixd-map-journey` → `/ixd-spec-page`)."

If `DESIGN_HISTORY.md` exists but has no new per-stage entries since the last
session summary, stop: "No new session activity to wrap up since the last
summary at `<date>`."

### 2. Identify what the session produced

From the per-stage entries since the last summary, pull:

- **Brief in scope** — from the `ixd-read-corpus` entry (brief title + path).
- **Framing one-liners** — from the `ixd-frame-policy` entry's four sub-headings (user / legal context / evidence / eligibility).
- **Journey shape** — from the `ixd-map-journey` entry: page count, the key decision point, headline rejected/parked items.
- **Pages with specs written** — from `ixd-spec-page` entries: slugs, the page's parked open decisions (which the spec's own `Open decisions` section lists declaratively).
- **What was recommended next** — from the `Next:` line of the most recent per-stage entry. Carry it into the summary's "Next session" line unless the designer overrides.

If a session has gaps (e.g. `ixd-read-corpus` and `ixd-frame-policy` ran but
`ixd-map-journey` and `ixd-spec-page` didn't), summarise what's there. Don't
fabricate a journey or a spec that wasn't produced.

### 3. Resolve the session title

Discovery order:

1. **Argument**: if a session title was passed, use it.
2. **Derive**: combine the brief title with what was produced. Examples:
   - `ixd-read-corpus` only → "TPO felling: source material loaded"
   - through `ixd-frame-policy` → "TPO felling: framed"
   - through `ixd-map-journey` → "TPO felling: journey drafted"
   - through one `ixd-spec-page` → "TPO felling: spec written for `<slug>`"
   - multiple specs → "TPO felling: specs written for N pages (`<slug>`, ..., `<slug>`)"

### 4. Compose the session summary

Single entry. Shape:

```markdown
## Session wrap-up — <YYYY-MM-DD>: <session title>

**Brief**: `<path>`, <title>
**Per-stage entries in this session**: <N>. `<skill>`, `<skill>`, ... (in invocation order; `ixd-spec-page` may appear more than once, list each with its slug).

### What the session produced

- `journey.md`: <N>-page sequence. Key decision point at `<slug>`. Main rejected/parked: <one-line>.
- `specs/<slug>.md`: <one-line on why this page was first / next>.
- (one bullet per artefact; omit lines for artefacts the session didn't produce)

### Open decisions to carry forward

Pull from each spec's `Open decisions` section (the parked items), and from `journey.md`'s rejected/parked section if any items are likely to surface next session:

- `<slug>`: <decision>, <why parked>
- (etc.)

### Next session

<recommended next move. Typically the `Next:` line from the most recent per-stage entry. If multiple specs were produced, the recommendation is the next page in the journey that resolves a parked decision from this session.>
```

### 5. Append to `DESIGN_HISTORY.md`

Append the summary at the end of the file — the file is an append-only journal,
read top-to-bottom chronologically, and the session summary is the final entry
in the session's run. The per-stage entries above stay untouched.

### 6. Suggest a commit line

This is the session's single consolidated commit suggestion. Per-stage skills no
longer surface their own commit lines; everything the session produced lands
together here.

Build the commit line as text from what the per-stage entries claim was
produced:

```
git add DESIGN_HISTORY.md journey.md specs/ && git commit -m "session ixd-wrap-up: <title>"
```

Adjust for what's actually in scope. Omit `journey.md` if no `ixd-map-journey`
entry was in this session. Omit `specs/` if no `ixd-spec-page` entry was in this
session.

Do **not** run `git`. The designer runs the commit themselves.

### 7. Suggest the prototype-handoff path (if a spec was produced)

If this session wrote one or more `specs/<slug>.md` files, surface the next move
for a designer who wants a runnable prototype to hand to a Defra frontend
developer:

> When you're ready for a runnable handoff, the sibling `frontend-developer` plugin's `/frontend-developer:govuk-form` skill scaffolds a GOV.UK form page (Nunjucks template + Joi schema + Hapi route handler in the GDS error pattern) from this page spec. Ask the agent to bootstrap the surrounding Hapi app afterwards if you want to run it locally.

One-line surface only. Do **not** run `/frontend-developer:govuk-form` yourself
— the handoff is the designer's call.

## Notes

- **Open decisions are first-class.** Half-finished sessions are honest. Carry parked items forward explicitly under "Open decisions to carry forward"; the designer can drop or fold them in the next session.
- **Multi-session continuity**: when this skill needs to ground on prior context (rare — usually only the current session matters), cap at the **most recent 2 session summaries**. Older summaries are audit trail.
- **Don't fabricate artefacts.** If `journey.md` doesn't appear in any `ixd-map-journey` entry from this session, don't claim one was produced. Summarise what's there.
- **This skill is not a general working-session wrap-up.** It writes a single design-session-summary entry into `DESIGN_HISTORY.md` — nothing else.
- Date format: `YYYY-MM-DD` from today's date.
