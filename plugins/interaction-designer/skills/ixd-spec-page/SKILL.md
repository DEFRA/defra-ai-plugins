---
name: ixd-spec-page
description: Write a page spec in the Defra union shape (Route, Purpose, Serves user need, Pattern, Question, Components, States, Validation, Open decisions) for one page from the journey. Pass `--all` to spec every non-rejected page from `journey.md` in one pass. Invoke after `/ixd-map-journey`, or on request with a page slug. Re-invoking on an existing spec revises it — appends a dated note instead of overwriting. Do NOT auto-invoke during journey-drafting or earlier phases.
---

# ixd-spec-page

Fourth skill in the interaction-design arc and the headline artefact-producer:
turns one page from the journey into `specs/<slug>.md` in the union page-spec
shape. Per-page is the default; `--all` is a batch path that walks every
non-rejected page in `journey.md` for the initial write.

**Load-bearing constraint:** the page spec is **declarative** (what was built);
the journal entry alongside is **narrative** (why). Keep the split — do not let
rationale leak into the spec, or declarative content into the journal.
Collapsing the split loses half the value of the artefact (audit trail) and half
the value of the spec (skim-able description of what shipped).

## When to use

- Immediately after `/ixd-map-journey`, when `journey.md` exists and its journal entry recommends a first page to spec.
- Standalone on the skills surface, with a page slug as the argument, when the designer wants to revise an existing page or spec a different page from the journey.
- Standalone with `--all`, when the designer wants every non-rejected page in `journey.md` spec'd in one shot (e.g. once the journey is stable and per-page revision can come later).

Do **not** auto-invoke during journey-drafting or earlier phases — page-level
work assumes the journey is settled. Do **not** invoke `--all` from inside the
orchestrator's arc; batch is a direct-skills-surface mode (see the "Batch is a
direct-skills-surface mode" bullet in § Notes).

## Process

**On invocation, work through the steps below in order — read, parse, write —
without pausing for confirmation unless a step explicitly requires it.**

### 1. Ground

Read at the current working directory:

- `DESIGN_HISTORY.md` — find the latest `ixd-map-journey`, `ixd-frame-policy`, and `ixd-read-corpus` entries.
- `journey.md` — the sequence and citations.
- The brief file recorded in the `ixd-read-corpus` entry — re-read for load-bearing detail on the user state, evidence specifics, and branch conditions.

If `journey.md` is missing, stop and say: "I'm looking for a journey to pick a
page from. Run `/ixd-map-journey` first."

If either `ixd-frame-policy` or `ixd-read-corpus` history entries are missing,
stop and say which is needed.

### 2. Resolve the page slug

If the argument is `--all`, switch to the **Batch mode** flow in § Batch mode
below. The rest of this section is for per-page mode.

Discovery order:

1. **Argument**: if a page slug was passed, use it.
2. **Recommended from history**: if not passed, read the `Next:` line of the most recent `ixd-map-journey` entry and use the slug it recommends.
3. **Ask**: if neither, list the page slugs from `journey.md` and ask the designer to pick.

### 3. Collision check

Check whether `specs/<slug>.md` exists. If it does, ask the designer:

> "There's already a `specs/<slug>.md`. Is this a revision (I'll edit in place and append a dated note to the page's journal entry), or did you mean a different slug?"

If revision → jump to **§6 Revision loop**. If different slug → restart at §2
with the new slug.

### 4. Re-read the precedent

From `journey.md`, find the entry for this slug. The `Precedent:
path:line-range` line tells you which file in `sources/reference/` to re-read
for the Pattern and Components sections. Read it.

If the page is in `journey.md`'s rejected/parked section, stop and say: "That
slug is marked rejected/parked in the journey. Want me to write the spec for it
anyway, or pick a different slug?"

### 5. Write `specs/<slug>.md`

Union shape. Write it straight through — no back-and-forth on individual
sections. The designer reads the whole spec at the end; revisions happen via the
revision loop.

```markdown
# Page: <slug>

**Route**: `/<path>` (derive from slug as `/<slug>` for the first cut; the designer can override in revision if the URL shape differs)
**Purpose**: <one sentence — expand the journey.md one-line purpose into a single declarative sentence>
**Serves user need**: see `DESIGN_HISTORY.md` entry from <date> — `ixd-frame-policy on <brief title>`

## Pattern

<which GOV.UK pattern this page implements>. Cite into the corpus: `sources/reference/<file>:<line-range>`.

## Question

> <literal wording the user sees, in their voice — not "the user enters X" but the actual question text>

Hint text: <if any — also in the user's voice>

## Components

- **<GDS component name>** — `sources/reference/<file>:<line-range>` — <one line on why this component, not a description of what it does>
- ...

## States

- **Empty / first visit**: <what the user sees on arrival>
- **Filled, valid**: <what changes after submission>
- **Filled, invalid**: <error message wording + which validation fired>
- **Returning after CYA**: <if applicable — what's pre-filled, what's editable>

## Validation

- <rule> → error message: "<exact wording>"
- ...

## Open decisions

- <anything the spec hasn't resolved — parked for later, with one line on why parked>
```

Notes on filling this in:

- **Route**: start with `/<slug>`. Override only when the URL shape genuinely differs from the slug (rare).
- **Question**: this is _literal wording_ — the actual text on the page, in the user's voice, not a description of what gets asked. If you find yourself writing "ask the user about X", you're describing the page, not spec'ing it.
- **Components**: name the GDS component, cite into `sources/reference/`, give a one-line "why this one". Don't restate what the component does.
- **States**: include `Returning after CYA` only if check-your-answers routes back to this page. Most non-final pages in a Defra journey do route back, but the very first page (start) typically doesn't.
- **Open decisions**: capture what's parked. Half-finished specs are honest; this section is where that honesty lives.

### 6. Revision loop (existing spec)

If §3 routed here:

1. Re-read the existing `specs/<slug>.md` and the existing journal entry for this page in `DESIGN_HISTORY.md`.
2. Edit the spec in place. Make the minimum change that addresses the revision — don't rewrite untouched sections.
3. In `DESIGN_HISTORY.md`, find the page's journal entry — **match by slug**, not by date. Scan for any `## <YYYY-MM-DD> — ixd-spec-page on <slug>` heading (the date may be from a prior session). Append a sub-heading **inside** that entry, after any prior revisions:

   ```markdown
   ### Revision <YYYY-MM-DD>

   Changed: <what changed — section names + summary>.
   Why: <one sentence>.
   ```

4. Do **not** change the original entry's `Next:` line. The page's narrative stays contiguous; the `Next:` reflects the original session's plan.

Skip step 7's "next page" recommendation for revisions and proceed straight to
step 8.

### 7. Append the journal entry (new spec only)

To `DESIGN_HISTORY.md` at the current working directory:

```markdown
## <YYYY-MM-DD> — ixd-spec-page on <slug>

Wrote the spec at `specs/<slug>.md`. <One paragraph: why this shape. What made this question wording, pattern choice, or state set the right call for this page, given the framing and the journey.>

Rejected: <alternative pattern, wording, or shape>, <why not>.
Parked: <decisions left open in the spec's Open decisions section>, <why>.

Next: invoke `/ixd-spec-page <next-slug>` for the next page in the journey (recommended: `<slug>`, because <one-line why>), or `/ixd-wrap-up` to close the session.
```

The journal entry is narrative — alternatives, rationale, parked decisions. The
declarative shape lives in `specs/<slug>.md`. Do not duplicate.

If there's no obvious next page (the journey is done, or the designer is
spec'ing pages out of order), recommend `/ixd-wrap-up` instead.

### 8. End the turn

Confirm the spec is written and name the recommended next step. Do not surface a
git commit line here. The session's consolidated commit suggestion lands once at
`/ixd-wrap-up`.

## Batch mode

For `--all`. Initial write only — revisions stay per-slug via the existing
per-page revision loop. Work straight through, no per-page confirmation.

### B1. Ground

As per §1. If `journey.md` is missing, stop with the same message. Read every
file §1 names.

### B2. Collect target slugs

From `journey.md`'s `## Proposed sequence`, in order, collect every page slug.
**Skip** anything in the `## Rejected / parked` section — those are deliberate
gaps and don't get a spec.

If `## Proposed sequence` is empty, stop and say: "`journey.md` has no proposed
pages. Re-run `/ixd-map-journey` first."

### B3. Partition by collision

For each collected slug, check whether `specs/<slug>.md` already exists.

- **New** slugs go in a `to-write` list.
- **Existing** slugs go in a `skipped` list. Batch mode does **not** revise —
  it only writes initial specs. The designer can revise per-slug afterwards.

If `to-write` is empty (every page already has a spec), stop and say: "Every
non-rejected page in `journey.md` already has a spec. Use `/ixd-spec-page
<slug>` to revise an existing one." Skip B4 and B5; do not write a journal entry
— there's nothing to record.

### B4. Write each spec

For each slug in `to-write`, in journey order:

1. Find the page's entry in `journey.md`'s `## Proposed sequence`. Read its
   `Precedent: path:line-range` and re-read that line range from
   `sources/reference/`.
2. Write `specs/<slug>.md` in the union shape (same template as §5). Same
   load-bearing rules: literal user-voice `## Question` wording, GDS component
   names with `path:line-range` citations, `Returning after CYA` state only
   where applicable, honest `Open decisions`.

Do **not** pause between pages. Do **not** ask for per-page confirmation. The
designer reads the whole set at the end — if a page needs revision, that's a
per-slug re-invocation afterwards.

### B5. Append one combined journal entry

To `DESIGN_HISTORY.md`:

```markdown
## <YYYY-MM-DD> — ixd-spec-page on <journey title> (batch)

Wrote <N> specs from `journey.md` in one pass: `<slug>`, `<slug>`, ..., `<slug>`. <One paragraph: what shape this set took — common pattern choices, where the journey's branch lands, anything that surprised across the set rather than per-page.>

Per-page rejected / parked:

- `<slug>`: <rejected one-liner>; <parked one-liner>.
- `<slug>`: <rejected one-liner>; <parked one-liner>.
- ...

Skipped (already had a spec): <slug>, <slug>, ... (or "none").

Next: invoke `/ixd-preview-spec <slug> --brand=<brand>` to render any of the pages, or `/ixd-spec-page <slug>` to revise a specific spec (revision path is per-slug). Recommended first preview: `<slug>` (because <one-line why — usually the start page or the key decision point>).
```

**One** combined entry. **Not** N per-page entries — that would clutter
`DESIGN_HISTORY.md` and lose the "this was a batch run" signal. The per-page
rejected/parked one-liners stay first-class so the audit trail survives; they're
just under one heading instead of N.

### B6. End the turn

Confirm: "Wrote N specs (skipped M existing). One combined journal entry in
`DESIGN_HISTORY.md`." Name the recommended first preview. Do **not** surface a
git commit line — the consolidated commit suggestion lands at `/ixd-wrap-up` as
normal.

## Notes

- **Citations point into `sources/reference/`** with `path:line-range`. Those source docs already carry retrieved-date / paraphrased-from markers (corpus's job). Don't duplicate URL+date in the page spec.
- **Open decisions stays first-class.** Half-finished specs are honest; don't pretend resolution.
- **Revision-loop journal entries are dated sub-headings inside the original entry**, not new top-level entries. The page's narrative is one contiguous block in history.
- **Batch mode (`--all`) is for initial writes only.** It produces one combined journal entry, skips slugs that already have a spec, and never revises in place. To revise, re-invoke per-slug (`/ixd-spec-page <slug>`) — that hits the per-page revision loop and adds a dated sub-heading under whichever entry first wrote the page (batch or per-page, matched by slug not by date).
- **Batch is a direct-skills-surface mode, not part of the orchestrator's arc.** The orchestrator holds the line at one page per session. Designers who want every page in one shot invoke `/ixd-spec-page --all` directly, off the guided arc.
- Date format: `YYYY-MM-DD` from today's date.
