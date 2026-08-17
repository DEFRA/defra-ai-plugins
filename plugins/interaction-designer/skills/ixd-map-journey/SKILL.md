---
name: ixd-map-journey
description: Propose a sequence of pages for a service journey, with one-line rationales and citations grepped from `sources/reference/`. Invoke after `/ixd-frame-policy` has produced a framing entry in `DESIGN_HISTORY.md`, or on explicit designer request ("draft the journey", "map this out"). Do NOT auto-invoke once `/ixd-spec-page` is running, since page-level work assumes the journey is already drafted.
allowed-tools: shell
---

# ixd-map-journey

Third skill in the interaction-design arc. Reads the prior `ixd-read-corpus` and
`ixd-frame-policy` entries, greps `sources/reference/` for precedent, and writes
`journey.md` — a numbered sequence of pages with one-line purposes and
`path:line-range` citations into the corpus.

**Load-bearing constraint:** every page in the proposed sequence carries a
`path:line-range` citation from the corpus, or it goes in the `rejected /
parked` section with "no precedent in corpus". **No citation → no fabrication.**
Fabricating a citation to fill a gap collapses the whole audit trail this skill
exists to produce.

## When to use

- Immediately after `/ixd-frame-policy`, when the framing is fresh in the journal.
- Standalone when the designer says "draft the journey", "map this out", or similar — provided `DESIGN_HISTORY.md` has both a `ixd-read-corpus` and a `ixd-frame-policy` entry to ground on.

Do **not** auto-invoke once `/ixd-spec-page` is running — that phase assumes the
journey is settled.

## Process

**On invocation, work through the steps below in order — read, parse, write —
without pausing for confirmation unless a step explicitly requires it.**

### 1. Ground

Read `DESIGN_HISTORY.md` at the current working directory. Find the most recent
`ixd-read-corpus` entry (for the brief path) and the most recent
`ixd-frame-policy` entry (for the four framed categories). If either is missing,
stop and say:

- No `ixd-read-corpus` entry: "I need a brief in scope. Run `/ixd-read-corpus` first."
- No `ixd-frame-policy` entry: "I'm looking for a framing entry. Run `/ixd-frame-policy` first so the journey is grounded in the four categories."

Re-read the brief file itself; the framing summary is a paragraph, the brief has
the load-bearing detail (states, branches, evidence specifics).

### 2. Grep precedent

List the reference docs under `sources/reference/` (recursive `.md`), then shell
out to `grep` for terms derived from the framing. The model picks the terms —
they should fall into these rough buckets:

- **GDS pattern names**: `question pages?`, `check your answers`, `confirmation`, `file upload`, `start page`, `eligibility`.
- **Journey-shape verbs**: `branch`, `route`, `fork`, `gate`, `redirect`.
- **Evidence words** (from the brief's evidence framing): file types, upload specifics, document names.
- **Eligibility words** (from the brief's eligibility framing): the key decision point terms — for the TPO brief, `5-day notice`, `dangerous`, etc.

Use `grep -nE -r --include='*.md' '<pattern>' sources/reference/` so each hit
comes back as `path:line:matched-line` — that line number is the citation
anchor.

If a category in the framing has no precedent hit, that's a real signal — note
it in the rejected/parked section ("no precedent in the corpus for X; likely a
candidate for a custom page"). **Do not fabricate a citation.**

### 3. Propose the sequence

Draft a numbered sequence of pages. For each page:

- **Slug** in kebab-case (`start`, `eligibility-check`, `upload-photos`).
- **One-line purpose**. Strict — if it needs a paragraph, the page isn't thought through. Defer the detail to `/ixd-spec-page`.
- **Citation**: `path:line-range` for the precedent that justifies this page, plus a one-line "why this precedent fits".

Order matters: the sequence is the journey. Eligibility branches go early (GDS
pattern); check-your-answers and confirmation go at the end.

### 4. Write `journey.md`

At the current working directory. Single file. Overwrite if it exists (the
previous draft is in `DESIGN_HISTORY.md` if it ever mattered). Shape:

```markdown
# Journey: <brief title>

**Brief**: `<path to brief>`
**Framed**: see `DESIGN_HISTORY.md` entry from <date>

## Proposed sequence

1. **`<page-slug>`**: <one-line purpose>
   Precedent: `sources/reference/<file>.md:<start>-<end>`, <one-line why this precedent fits>

2. **`<page-slug>`**: <one-line purpose>
   Precedent: `<path>:<lines>`, <why>

...

## Rejected / parked

- **<page or pattern>**: <why this isn't in the sequence>
```

### 5. Append the journal entry

To `DESIGN_HISTORY.md`:

```markdown
## <YYYY-MM-DD> — ixd-map-journey on <brief title>

Drafted `journey.md` proposing <N> pages: <slug>, <slug>, ..., <slug>.

Key decision point: <slug> — <one-line on where the journey splits and why>.

Rejected: <slug or pattern>, <one-line why>.
Parked: <slug or pattern>, <one-line why>.

Next: invoke `/ixd-spec-page <slug>` to write the spec for the first page (recommended: `<slug>`, because <one-line why this is the right one to spec first>).
```

The journal entry is a summary and an audit trail; the full proposal lives in
`journey.md`.

### 6. End the turn

Confirm the journey is drafted and recommend the first page to write the spec
for. Do not surface a git commit line here. The session's consolidated commit
suggestion lands once at `/ixd-wrap-up`.

## Notes

- **Citations are `path:line-range` from grep.** This is fragile — corpus edits will break the line numbers. The alternative (section-heading references) is more robust but harder to extract automatically; accept the fragility. If a session re-runs after corpus edits, re-run `/ixd-map-journey` to refresh the citations.
- **Strict one-line purpose** per page. Paragraph-per-page is `/ixd-spec-page`'s job. If a rationale won't fit on one line, the page hasn't been thought through — split it or defer it.
- **Recommend one page to write the spec for next.** The first page of the journey is usually the right call (start page), but the key decision point (eligibility) is often a stronger first-spec candidate because it's where the journey's complexity actually lives.
- Date format: `YYYY-MM-DD` from today's date.
