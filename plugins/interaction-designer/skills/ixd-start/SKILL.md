---
name: ixd-start
description: Front-door conversational arc for a Defra interaction designer. Walks a verbal brief through to a journey doc, one page spec, and an HTML preview in a single session, composing the six leaf skills behind the scenes. Invoke at session start when the designer wants the guided experience.
---

# interaction-designer

The plugin's headline surface. Walks a designer conversationally from a verbal
brief to a journey doc, one page spec, and an HTML preview of that page in a
single session, by composing the six leaf skills (`ixd-read-corpus`,
`ixd-frame-policy`, `ixd-map-journey`, `ixd-spec-page`, `ixd-preview-spec`,
`ixd-wrap-up`) via in-context slash invocation.

**Load-bearing constraints**: (1) **thin orchestrator** — the work happens in
the leaves. This skill's job is conversational glue: introduce each phase,
invoke the right leaf, present the result in one sentence, gate the transition.
It does **not** write to `DESIGN_HISTORY.md`, `journey.md`, or `specs/*.md`
directly — the leaf skills are the single source of truth for what gets written.
(2) **This is a Copilot skill, never a custom agent** (`.agent.md`). Custom
agents run as isolated subagents with their own context window, which silently
breaks per-stage journal accumulation — the per-stage entries the leaves write
would land in a context the next phase can't see.

## When to use

- At session start, when a designer wants the guided experience from a verbal brief.
- **Not** when leaf skills have already run in this session — the orchestrator assumes a clean start (see Phase 1's pre-flight check).

A designer who prefers picking skills themselves (a power user) invokes the leaf
skills directly. The two surfaces share the same skills underneath; the
orchestrator is the curated path through them.

## Process

Walk the eight-phase arc below in order. For each phase:

- **Set up** with one sentence on what's about to happen.
- **On the first invocation of each leaf skill in this session, name it explicitly** ("I'm going to run `ixd-read-corpus` now. It'll read your brief and reference docs."). On subsequent invocations (Phase 7 revisions of `ixd-spec-page`, re-runs of `ixd-preview-spec`), don't re-announce.
- **Invoke** the leaf skill by writing the slash command as a directive, e.g. "Now invoke `/ixd-read-corpus`." The model dispatches on that line.
- **Present** the result in **one sentence**. Point at the journal entry and the artefact for detail; do **not** re-state the journal contents.
- **Hand off** to the next phase using the handoff pattern below.

### Handoff pattern

At every phase boundary (Phases 2–6; Phase 1 has its own intake shape, Phase 8
is the close), do these three things in order:

1. **Progress line.** A short sentence naming what's done, what's next, and what comes after. E.g.:

   > "Done so far: read your source material, framed the policy. Up next: map the journey. After that: write a page spec, render a preview."

   This is the user-facing replacement for "Phase N" framing. The designer never sees a phase map.

2. **Decisions so far.** One line summarising what's been captured this session. Read from the per-stage journal entries; do not duplicate state. E.g. after frame-policy:

   > "Captured so far: brief `fell-protected-tree`, framing on user / legal context / evidence / eligibility."

   Keep it terse. Named items only, no rationale, no per-decision detail (the journal has that).

3. **Three-way offer.** Ask the designer how to proceed:

   > "Continue to <next phase in plain English>, revise <name an upstream phase>, or pause here? (Pause leaves the session resumable next time.)"

   Default is continue. Revise routes back to a named upstream phase (designer picks). Pause ends the session cleanly without running wrap-up; the next orchestrator start will offer resume.

### Conversation style

- **Lead with natural open questions, not numbered multiple choice.** Default to a single open question and listen. Fall back to a numbered-options pattern only when the designer says "not sure" or asks for choices.
- **Frame alternatives as perspectives, not options.** "Here are a couple of perspectives to consider" beats "here are 3 options, pick one". The flow is a thinking partner, not a quiz.
- **Never announce phase numbers to the designer.** The phase scaffolding here is for the model. User-facing transitions use the handoff pattern's progress line, never "Moving to Phase 4".
- **Don't surface git commit lines mid-flow.** The consolidated commit suggestion lands once at wrap-up (Phase 8). The orchestrator never runs `git`.

### Phase 1 — Intake

**Pre-flight check.** Read `DESIGN_HISTORY.md` at the current working directory
(if it exists). Look at the per-stage entries below the most recent `## Session
wrap-up` heading (or all entries if there isn't one).

- **No DESIGN_HISTORY.md, or its last entry is a `## Session wrap-up`**: clean start. Proceed to "Open the conversation".
- **Per-stage entries exist below the last wrap-up**: a session is in progress. Offer resume rather than starting fresh:

  1. Scan the per-stage skill names in order. Map them to phases (`ixd-read-corpus` → Phase 2 done, `ixd-frame-policy` → Phase 3 done, `ixd-map-journey` → Phase 4 done, `ixd-spec-page` → Phase 5 done, `ixd-preview-spec` → Phase 6 done; multiple `ixd-spec-page` entries on the same slug indicate Phase 7 revisions).
  2. Summarise what ran in one sentence. E.g.: "Looks like you've already loaded the brief, framed it, and drafted the journey."
  3. Ask the designer:

     > "Continue from <next phase in plain English>, or start fresh? (Start fresh closes this session via `/ixd-wrap-up` first, then begins a new one.)"

  4. **Continue**: jump straight to the next phase. Skip the "Open the conversation" step. The brief is already loaded; the framing (if any) is already in the journal. Brand mode on resume: if a prior `ixd-preview-spec` entry exists in `DESIGN_HISTORY.md`, re-use its recorded brand value. Otherwise ask just before invoking `/ixd-preview-spec` in Phase 6.
  5. **Start fresh**: invoke `/ixd-wrap-up` to close the in-progress activity, then restart at "Open the conversation".

Corpus existence (`sources/index.md` plus a brief) is **not** checked here —
`ixd-read-corpus` does that in Phase 2 and will fail loudly if missing. Two
checks would drift apart.

**Open the conversation.** If a policy-domain input was passed:

> "I see you're working on `<domain>`. Tell me a bit about it. What's the user need, and what user research or policy documents have you got to draw on?"

Otherwise:

> "Welcome. I'll walk you through turning a brief into a journey doc and page specs. Let's start with where you are. What's the policy intent you're designing for, and what user research or policy documents have you got to draw on?"

**Confirm the brief and pick a brand.** Once the designer has named the policy
area and the source material, ask brand mode in the same turn:

> "Got it. Before we get going: will this service ship on `gov.uk` (standard GOV.UK Design System chrome) or on a Defra domain (`defra`, with Defra branding)? I'll thread the answer through to the preview at the end so we don't have to ask again."

Hold the answer in working memory for the session. It feeds the `--brand=` input
to `/ixd-preview-spec` in Phase 6. A designer who genuinely wants both can
override the session value at preview time by passing `--brand=` directly; flag
this as available but don't lead with it.

**Transition** to Phase 2 once the brief and brand are both known.

### Phase 2 — Read the corpus

**Announce** (first leaf-skill invocation, so name it explicitly):

> "I'm going to run `ixd-read-corpus` now. It'll read your brief and the reference docs alongside it, then write a note about what was loaded to `DESIGN_HISTORY.md`."

**Invoke** `/ixd-read-corpus`. Pass the brief slug as an input if the designer
named one during intake; otherwise let the skill list briefs and ask.

**Present** in one sentence: "Loaded `<brief>` plus N reference docs. The note
is in `DESIGN_HISTORY.md`."

**Hand off** using the handoff pattern. Up next is "frame the policy against
four categories"; after that, "map the journey, write a page spec, render a
preview".

### Phase 3 — Frame against the four categories

**Announce** (first invocation):

> "Running `ixd-frame-policy` now. We'll work through the four Defra categories one at a time: **user**, **legal context**, **evidence**, **eligibility**. Each gets named so the frame is visible."

**Invoke** `/ixd-frame-policy`. The skill is itself question-by-question; it
will pose each category in turn and wait for the designer's answer. The
orchestrator's job during this phase is to **not interject** — let the skill
run.

**Present** after the skill returns: "The framing is in `DESIGN_HISTORY.md`
under the four categories."

**Hand off** using the handoff pattern. Up next is "draft the journey"; after
that, "write a page spec, render a preview".

### Phase 4 — Draft the journey

**Announce** (first invocation):

> "Running `ixd-map-journey` now. It'll search your reference docs for precedent and propose a sequence of pages, each with a one-line purpose and a citation back to the source material."

**Invoke** `/ixd-map-journey`.

**Present** in one sentence: pull the page count and the key decision point from
the skill's journal entry. Refer to "the key decision point" in plain English
(e.g. "the page where the journey splits on eligibility") rather than "the
load-bearing branch". Point at `journey.md` for the full proposal.

**Hand off** using the handoff pattern, with the slug question folded into the
"continue" option so the three-way offer is concrete. Pull the recommended slug
from the `Next:` line of the `ixd-map-journey` entry. Up next is "write a page
spec"; after that, "render a preview". The continue offer reads:

> "Continue and write the spec for `<slug>` (the journey recommends it because <rationale>), pick a different page from the journey, revise the journey itself, or pause here?"

Proceed to Phase 5 with whichever slug the designer chooses.

If the designer asks for "all pages at once" or similar, name the
direct-skills-surface escape hatch — `/ixd-spec-page --all` writes a spec for
every non-rejected page from `journey.md` in one pass — and note it skips the
preview-per-page beat the guided arc runs in Phases 5–6. Do **not** invoke it
from the orchestrator; the arc holds the line at one page per session. If the
designer takes that path, end the session at Phase 8 once they're done — `--all`
lands them outside the guided arc, and there's no clean place for the
orchestrator to re-enter.

### Phase 5 — Spec one page

**Announce** (first invocation):

> "Running `ixd-spec-page` for `<slug>` now."

**Invoke** `/ixd-spec-page <slug>`.

**Present** in one sentence: pull the literal question wording and the count of
open decisions from the skill's journal entry. Point at `specs/<slug>.md` for
the full spec.

**Transition** to Phase 6 directly — do **not** apply the handoff pattern here.
Always preview before asking about revisions; the designer needs to _see_ the
spec to know whether it needs revising. The handoff pattern fires after the
preview lands, in Phase 6.

### Phase 6 — Preview the spec

**Announce** (first invocation), parameterised on the session brand picked in
Phase 1:

> "Running `ixd-preview-spec` now. It'll render `specs/<slug>.md` as an HTML page with <gov.uk: GOV.UK Design System styling | defra: Defra branding> so you can see what you've designed."

**Invoke** `/ixd-preview-spec <slug> --brand=<session-brand>` where
`<session-brand>` is the value picked in Phase 1. On resume, if the session
brand isn't in working memory, recover it from a prior `ixd-preview-spec` entry
in `DESIGN_HISTORY.md`; if no prior entry exists, ask the designer now before
invoking.

**Present** in one sentence: name the output path (`previews/<slug>.html` or
`previews/<slug>--defra.html`) and the components rendered from the spec's `##
Components` section.

**Suggest** opening the file as text:

```
open previews/<slug>.html       # macOS
xdg-open previews/<slug>.html   # Linux
```

Don't run `open`. The trust gate is at the human.

**Hand off** using the handoff pattern, with one phase-specific twist: ask
whether the preview surfaces a revision before offering continue / pause:

> "Have a look at the preview. Does it match what you intended, or want to revise the spec?"

If revise → Phase 7. If matches → apply the rest of the handoff pattern with
"continue to wrap up" as the default. Pause is still on offer.

### Phase 7 — Revision loop (optional)

For each revision the designer wants:

- Listen to what needs to change. Capture in one sentence.
- **Invoke** `/ixd-spec-page <slug>` — same skill. It detects the existing spec at `specs/<slug>.md`, runs its revision-loop path (edit in place + dated sub-heading inside the page's existing journal entry, matched by slug not by date), preserves the original `Next:` line.
- **Do NOT re-announce the skill** on subsequent invocations.
- **Re-invoke `/ixd-preview-spec <slug>`** after the revision so the designer can see the change rendered. Don't re-announce `ixd-preview-spec` either.
- **Present** in one sentence: "Revised. Change recorded as a dated sub-heading in the page's journal entry. Preview re-rendered to `previews/<slug>.html`."

**After the second revision on the same page**, soft-nudge:

> "We've revised `<slug>` twice. Happy to keep going, or ready to wrap up? You can always re-invoke `/ixd-spec-page <slug>` and `/ixd-preview-spec <slug>` later for further tweaks."

Not a hard limit. Respect the designer's "keep going".

**Transition** to Phase 8 when the designer says they're done with the page (or
accepts the wrap-up nudge). The orchestrator's arc covers one page per session;
a designer wanting more pages invokes `/ixd-spec-page <slug>` directly on the
skills surface after this session ends.

### Phase 8 — Wrap up

**Announce** (first invocation):

> "Running `ixd-wrap-up` now. It'll add a session summary on top of the per-stage entries already in `DESIGN_HISTORY.md`."

**Invoke** `/ixd-wrap-up`. Let the skill derive the session title from the brief
plus the page the spec was written for. Only pass a title input if the designer
wants a specific one.

**Present**: "Session summary's appended to `DESIGN_HISTORY.md`."

**Close** with a summary of what's on disk and the consolidated session commit
line (the only commit suggestion in the whole flow):

> "Session complete. Journey: `journey.md` (N pages). Page spec: `specs/<slug>.md`. Preview: `previews/<slug>.html`. Session history: `DESIGN_HISTORY.md`. Run `<commit line from /ixd-wrap-up>` when you're ready."

Do **not** run `git`.
