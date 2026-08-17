---
name: ixd-read-corpus
description: Read the design source material (sources/index.md plus a named policy brief) at the start of an interaction-design session. Invoke at session start, or when the designer explicitly asks to (re)load the source material. Do NOT auto-invoke mid-session. Downstream skills read what they need from DESIGN_HISTORY.md instead.
---

# ixd-read-corpus

First skill in the interaction-design arc. Reads `sources/index.md` plus a named
brief and all reference docs, then writes a per-stage entry to
`DESIGN_HISTORY.md` so later skills can pick up the brief without re-invoking
this one.

**Load-bearing constraint:** the per-stage entry written here is the single
source of truth for what was loaded this session. Downstream skills
(`ixd-frame-policy`, `ixd-map-journey`, `ixd-spec-page`) ground on the entry
rather than re-reading `sources/`. Do not re-invoke this skill mid-session
unless the designer explicitly asks to reload.

## When to use

- Session start, with a brief slug as the first argument or a verbal brief.
- When the designer says "(re)load the corpus" or "start over".

Do **not** auto-invoke mid-session.

## Process

**On invocation, work through the steps below in order — read, parse, write —
without pausing for confirmation unless a step explicitly requires it.**

### 1. Read the index

Read `sources/index.md` from the current working directory. If `sources/` or
`sources/index.md` is missing, stop and say:

> I'm looking for your source material at `sources/`. Are you in your design workspace?

### 2. Resolve the brief

If a brief slug was passed as an argument, look it up in the index. If no slug
was passed (or the slug isn't in the index), list every brief from the index
with title + one-line summary and ask the designer to pick.

### 3. Load the brief and reference docs

Read the brief and every reference doc listed in the index, in parallel.
`ixd-frame-policy`, `ixd-map-journey`, and `ixd-spec-page` will all want these
later; loading them now keeps them in context for the rest of the session.

### 4. Write the journal entry

Append a per-stage entry to `DESIGN_HISTORY.md` at the current working directory
(create the file if it doesn't exist):

```markdown
## <YYYY-MM-DD> — ixd-read-corpus on <brief title>

Source material loaded from `sources/`. Brief in scope: `<path>`, <title>.

The brief describes <one-sentence summary of the user need>.

Reference docs available for journey precedent:

- `<path>`: <one-line summary>
- ...

Next: invoke `/ixd-frame-policy` to work through the brief against the four categories (user / legal context / evidence / eligibility).
```

### 5. End the turn

Confirm the source material is loaded and suggest `/ixd-frame-policy` as the
next step. Do not surface a git commit line here. The session's consolidated
commit suggestion lands once at `/ixd-wrap-up`.

## Notes

- Load the brief and reference docs in parallel — they're independent files.
- If the index lists a path that doesn't exist on disk, note the gap in the journal entry under the relevant section and continue with what's available. Don't fabricate content.
- Date format: `YYYY-MM-DD` from today's date.
