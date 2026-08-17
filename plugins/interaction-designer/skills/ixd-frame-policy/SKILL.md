---
name: ixd-frame-policy
description: Work through a policy brief one category at a time against the four named Defra categories (user, legal context, evidence, eligibility), surfacing each category by name so the designer learns the frame. Invoke after `/ixd-read-corpus`, or standalone when the designer says "let's frame this" or similar. Do NOT auto-invoke once `/ixd-map-journey` or downstream skills are running.
---

# ixd-frame-policy

Second skill in the interaction-design arc. Walks the designer through the four
Defra dimensions of a service interaction — **user / legal context / evidence /
eligibility** — one category at a time, in order, naming each category as it
goes.

**Load-bearing constraint:** the naming is the point. Designers learn the frame
by being asked the questions inside it, with the category name spoken out loud
each turn. Bundling categories into a mega-question, or summarising the
designer's answers into bullets in the journal entry, collapses the value.

## When to use

- Immediately after `/ixd-read-corpus`, when the brief is loaded and ready to work through.
- Standalone, when the designer wants to frame a brief without the full orchestrator flow ("let's frame this", "run me through the four categories").

Do **not** auto-invoke once the journey is being mapped or pages are being
written. Those phases assume the framing is already done.

## Process

**On invocation, work through the steps below in order — read, parse, write —
without pausing for confirmation unless a step explicitly requires it.**

### 1. Ground the framing

Find the brief in scope:

- Read `DESIGN_HISTORY.md` at the current working directory. If it exists and has a recent `ixd-read-corpus` entry, the brief path is recorded there — read the brief file itself to ground the questions.
- If `DESIGN_HISTORY.md` is missing or has no `ixd-read-corpus` entry, say: "I'd usually pick up the brief from a prior `/ixd-read-corpus` run. What brief are we framing?" Accept either a path or a verbal description in reply. Proceed with whatever the designer gives you.

If a brief slug was passed as an input, use it to disambiguate when the history
has multiple briefs in play.

### 2. Walk the four categories in order

Strict order: **user → legal context → evidence → eligibility**. One category
per turn. Do not bundle.

For each category:

1. **Name the category explicitly** in the question. The wording matters — the designer should hear the category name come out of the model's mouth.
2. **Anchor to the brief.** If the brief already says something about this category, lead with a one-line acknowledgement ("the brief says X — is that the shape of it?"). If the brief is silent, say so and ask the open question.
3. **Wait for the designer's answer** before moving on. Do not pre-empt the next category.

Starting wordings (one open question per category; adapt to the brief):

- **User**: "On **user**, who's the person at the door?"
- **Legal context**: "On **legal context**, what gates this interaction?"
- **Evidence**: "On **evidence**, what does the user need to produce for a decision?"
- **Eligibility**: "On **eligibility**, what puts someone in or out of scope?"

Only if the designer asks for prompts or asks what else to consider, surface the
supplementary angles for that category. Do not volunteer them:

- **User**: what state are they in when they arrive? What are they trying to do?
- **Legal context**: which statute, regulation, or guidance? What does the law say _must_ happen?
- **Evidence**: documents, photos, declarations?
- **Eligibility**: where are the branches that route people to different journeys?

Trust the designer's first answer. A thin answer is not a trigger to dig — it
may simply be all there is to say at this point.

If the designer volunteers an answer to a later category early, acknowledge it
("we'll come back to that under _evidence_, for now on _user_…"), but still
surface each category by name in its own turn.

### 3. Write the journal entry

After all four categories are answered, append to `DESIGN_HISTORY.md` at the
current working directory:

```markdown
## <YYYY-MM-DD> — ixd-frame-policy on <brief title>

Worked through the brief against the four Defra categories.

### User

<designer's answer, in their own words — summarise, don't paraphrase away the specifics>

### Legal context

<designer's answer>

### Evidence

<designer's answer>

### Eligibility

<designer's answer>

Next: invoke `/ixd-map-journey` to draft the journey from the framed categories.
```

If the brief grounded part of an answer, note it inline (e.g. "The brief sets
this as householder + protected tree; designer confirmed and added: ...").

### 4. End the turn

Confirm the framing is done and suggest `/ixd-map-journey` as the next step. Do
not surface a git commit line here. The session's consolidated commit suggestion
lands once at `/ixd-wrap-up`.

## Notes

- **Strict category order is deliberate.** The order `user → legal context → evidence → eligibility` mirrors how Defra services are typically scoped; adaptive ordering would be more conversational but would let the frame leak.
- **Read the brief file directly** (in addition to the `ixd-read-corpus` history entry) — it's worth the tokens. The history summary is one paragraph; the brief is where the load-bearing details live.
- **Don't summarise the designer's answers into bullet points** in the journal entry. Keep their wording. The frame is _their_ mental model being written down; flattening it back into checklist-speak loses the thing the framing was for.
- Date format: `YYYY-MM-DD` from today's date.
