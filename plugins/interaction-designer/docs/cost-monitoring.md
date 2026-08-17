# Cost monitoring

How to see how much of your Copilot quota a session consumes, and how to choose
a cheaper model if you're spending more than you'd like.

## Premium requests, not tokens

GitHub Copilot bills by **premium requests** — a per-call count, not a token
count. One designer turn through `/ixd-start` is many requests
(one per model call: skill body, tool use, file write, response). Each request
is multiplied by the model's premium-request multiplier.

Multipliers as observed in the Copilot CLI model picker on **2026-05-20**
(subject to change by GitHub):

| Model             | Multiplier |
| ----------------- | ---------- |
| Claude Sonnet 4.6 | 1.0x       |
| Claude Sonnet 4.5 | 1.0x       |
| Claude Haiku 4.5  | 0.33x      |
| Claude Opus 4.6   | 3.0x       |
| GPT-5.3-Codex     | 1.0x       |
| GPT-5.2-Codex     | 1.0x       |
| GPT-5 mini        | 0x         |
| GPT-4.1           | 0x         |
| GPT-4o            | 0x         |

A full eight-phase orchestrator session against the TPO fixture runs ≈30 model
requests. At Sonnet 4.6 that's ≈30 premium requests; at Haiku 4.5 that's ≈10.

## Authoritative usage view

The Copilot CLI **does not expose** your remaining premium-request quota
locally. The only authoritative view is on GitHub:

- Personal accounts: <https://github.com/settings/copilot> →
  "Usage this month"
- Org accounts (Business / Enterprise): the org's billing page

Check there before and after a session if you want a real before/after delta.

## Local proxies for in-session inspection

The Copilot CLI's log files do not include premium-request counts, but they
include two useful proxies:

- **Model-call count** — one log line per call:
  `Sending request to the AI model`. Multiply by the model
  multiplier above for a rough premium-request estimate. (Tool calls
  may be free or charged depending on Copilot's accounting; the
  estimate is an upper bound.)
- **Context size over time** — periodic lines:
  `CompactionProcessor: Utilization X% (tokens/total tokens)`.
  Peak utilization tells you how big your input got, which
  influences cost in a separate way (input-token billing if it
  applies on your plan).

Log files live in `~/.copilot/logs/`.

## Choosing a model

Recommendations are dated 2026-05-20 and based on a one-shot non-interactive
model-comparison run plus an interactive verification session. Re-evaluate after
a Copilot CLI version bump or a real interactive head-to-head.

| Situation                            | Model             | Multiplier | Confidence                                                                   |
| ------------------------------------ | ----------------- | ---------- | ---------------------------------------------------------------------------- |
| Guided first session, important work | Claude Sonnet 4.6 | 1.0x       | validated (interactive)                                                      |
| Returning designer, bulk runs        | Claude Haiku 4.5  | 0.33x      | validated on artefact production; conversational surfaces untested           |
| Avoid                                | Claude Opus 4.6   | 3.0x       | untested — but no evidence the workflow needs the extra reasoning depth      |
| Currently broken                     | All GPT models    | varies     | Copilot CLI sends a tool with empty `function.name` on the OpenAI path → 400 |

### Why Sonnet 4.6 as default for first sessions

The interactive verification session is the only validated baseline for the
orchestrator's **conversational surfaces** — the per-phase gates, the
`ixd-frame-policy` interrogation cadence, the no-fabrication self-discipline.
The verification recorded a load-bearing moment where the model identified a
journey page idea with no corpus precedent and parked it rather than inventing a
citation — exactly the audit-trail behaviour the no-fabrication invariant
depends on. That run was Sonnet 4.6 in interactive mode.

### Why Haiku 4.5 for returning use

The model-comparison run exercised the full eight-phase arc against the TPO
fixture: 29 model calls (~10 premium requests at 0.33x), credible 11-page
journey with spot-checked real line-range citations, complete union-shape spec,
locked-format wrap-up summary. 3× the runs per quota vs Sonnet. The
artefact-production rubric is green; the conversational rubric is **untested**
because the script runs non-interactively (the per-phase gates self-confirm, the
frame-policy interrogation flattens to a single brief-lifting pass).

For a designer who has done one full session and knows the shape, the cost
saving is real and the risk is low. For a first session against an unfamiliar
brief, Sonnet's validated grilling behaviour is worth the 3× cost.

### Why avoid Opus 4.6

Not tested. No part of the workflow involves the kind of reasoning Opus is
differentiated on — no proofs, no novel algorithms, no math-heavy synthesis. The
skills are structured-artefact production with conversational discipline. Sonnet
handles both at a third of the cost.

### Why GPT is currently blocked

Two failure modes observed in this session against Copilot CLI 1.0.50:

- `gpt-4o` returns `400 Invalid 'tools[5].function.name': empty string`
  before any model output. The CLI is exposing a tool with no name on
  the OpenAI path.
- `gpt-5-mini` rejects `--effort none` (requires one of
  `minimal/low/medium/high`); with default `medium` it hits the same
  empty-function-name 400.

Worth re-testing after a Copilot CLI version bump. If the schema bug clears,
GPT-5 mini / 4.1 / 4o are all 0x — appealing for unlimited runs.

### Caveats and what would strengthen this

- **N=1 on Haiku**, in non-interactive mode only. The conversational
  rubric items (frame-policy interrogation cadence, revision-loop
  discipline, intake-conversation tone) are unmeasured.
- **No direct Sonnet head-to-head.** `--model claude-sonnet-4.6`
  returns `"Model … not available"` in non-interactive mode
  (`copilot -p`) even when Sonnet is the user's interactive default.
  The cheapest unblocker is two parallel **interactive** sessions on
  the same fixture brief, transcribed manually side by side.
- **Smaller GPT models had a standalone-leaf trigger wrinkle** in the
  interactive verification: the skill body loaded but the
  Process did not start until downstream demand surfaced. Haiku
  didn't show this through the orchestrator but it's worth knowing
  if you drop to leaf-level invocation on a smaller model later.

### Switching models

```
copilot --model claude-haiku-4.5
```

Or inside a running session, run `/model` to see the picker.
