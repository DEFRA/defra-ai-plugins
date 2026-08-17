# interaction-designer

A GitHub Copilot CLI plugin for Defra interaction designers. One conversational
**orchestrator skill** (`/ixd-start`) walks a designer from a
verbal brief through to a journey doc, one page spec, and a GOV.UK- or
Defra-styled HTML preview in a single session. Six **leaf skills** the
orchestrator composes (`/ixd-read-corpus`, `/ixd-frame-policy`,
`/ixd-map-journey`, `/ixd-spec-page`, `/ixd-preview-spec`, `/ixd-wrap-up`) are
also directly invokable, for designers who want to drive the pipeline
themselves.

Two surfaces, one skill layer. The orchestrator is a curated path through the
leaves — not a separate codepath.

## What it provides

**No agent** — seven skills only (one orchestrator + six leaves). The
orchestrator is deliberately **a Copilot skill, never a custom agent**: custom
agents run as isolated subagents with their own context window, which would
silently break the per-stage journal accumulation the leaves depend on. See
`AGENTS.md` for the full set of load-bearing invariants.

## Install

From the marketplace:

```sh
copilot plugin marketplace add DEFRA/defra-ai-plugins
copilot plugin install interaction-designer@defra-ai-plugins
```

For Claude Code, run these inside an interactive session (they are slash
commands, not shell commands):

```text
/plugin marketplace add DEFRA/defra-ai-plugins
/plugin install interaction-designer@defra-ai-plugins
```

From a local checkout (for development):

```sh
copilot plugin install ./plugins/interaction-designer
```

Then launch `copilot` (or a Claude Code session) from your own design
workspace — a directory containing a `sources/` corpus you've curated. The
skills read from `sources/` at cwd and write `DESIGN_HISTORY.md`, `journey.md`,
`specs/`, and `previews/` alongside.

The plugin does **not** bundle a corpus. A designer brings their own.

### Choosing a model

The picker's default is Claude Sonnet 4.6. Recommendations from end-to-end
testing (as of 2026-05-20):

| Situation                            | Model             | Multiplier |
| ------------------------------------ | ----------------- | ---------- |
| Guided first session, important work | Claude Sonnet 4.6 | 1.0x       |
| Returning designer, bulk runs        | Claude Haiku 4.5  | 0.33x      |
| Avoid                                | Claude Opus 4.6   | 3.0x       |
| Currently broken via Copilot CLI     | All GPT models    | varies     |

Sonnet 4.6 is the only model **validated** on the orchestrator's conversational
surfaces (frame-policy walk-through, revision loop). Haiku 4.5 is validated on
artefact production (journey doc, page spec, preview) but not yet head-to-head
against Sonnet on conversational surfaces — see the caveats in
`docs/cost-monitoring.md`. Switch with `copilot --model <id>` or `/model` inside
a session.

### Cost

Copilot bills by **premium requests** (a per-call multiplier; not tokens). A
full session is ≈30 model calls, costing ≈30 premium requests at Sonnet 4.6
(1.0x) or ≈10 at Haiku 4.5 (0.33x). The CLI does not expose remaining quota
locally — check `github.com/settings/copilot` for the authoritative "Usage this
month" view. See `docs/cost-monitoring.md` for the multiplier table, model
recommendations, and how to switch.

## Usage

For a visual walkthrough of how the orchestrator and the six leaf skills compose
— flow diagrams, per-stage inputs/outputs, the revision loop — see
[`docs/how-it-works.md`](docs/how-it-works.md).

### A guided first session

```
/ixd-start
```

The orchestrator walks an eight-phase arc:

1. **Intake** — gather the verbal brief.
2. **ixd-read-corpus** — read `sources/index.md` and the named brief.
3. **ixd-frame-policy** — work through the four Defra categories
   (**user → legal context → evidence → eligibility**), one at a time, in
   strict order.
4. **ixd-map-journey** — propose a numbered page sequence with citations into
   the source material.
5. **ixd-spec-page** — write one `specs/<slug>.md` in the union page shape.
6. **ixd-preview-spec** — render the spec as `previews/<slug>.html` (or
   `previews/<slug>--defra.html` for Defra-domain services).
7. **Revision loop** (optional) — re-invoke `ixd-spec-page` and `ixd-preview-spec` for
   each revision the designer wants. Revisions append dated sub-headings to
   the page's existing journal entry.
8. **ixd-wrap-up** — append a session summary on top of the per-stage entries
   in `DESIGN_HISTORY.md`.

Each phase invokes one leaf skill. Skills write their own per-stage journal
entries; the orchestrator surfaces the artefacts as they appear. A single
consolidated commit suggestion lands at wrap-up.

### Driving the pipeline yourself

A returning designer who knows the shape can skip the orchestrator and invoke
the leaf skills directly, in any order:

```
/ixd-read-corpus fell-protected-tree
/ixd-frame-policy
/ixd-map-journey
/ixd-spec-page check-tree-condition
/ixd-preview-spec check-tree-condition --brand=gov.uk
/ixd-wrap-up
```

The artefacts produced are identical. Skills ground on prior entries in
`DESIGN_HISTORY.md`; downstream skills do not re-run upstream work.

### Outputs

- `journey.md` — proposed page sequence with corpus citations
  (from `ixd-map-journey`).
- `specs/<slug>.md` — page specs in the union shape (from `ixd-spec-page`,
  one or many).
- `previews/<slug>.html` and/or `previews/<slug>--defra.html` — rendered
  previews (from `ixd-preview-spec`; Defra mode also writes
  `previews/defra.css` and `previews/defra-logo.svg` as sibling files).
- `DESIGN_HISTORY.md` — per-stage journal entries from each skill, plus
  session summaries from `ixd-wrap-up`.

The page spec is **declarative** (what was built); the journal entry alongside
is **narrative** (why). The split is load-bearing — never collapse the two.

The trust gate is at commit time. No skill runs `git`; each one ends by
suggesting the `git add … && git commit -m '…'` line for the designer to paste.

## Suggested handoffs

When a spec is ready to share with a developer (or to click through yourself),
the sibling [`frontend-developer`](../frontend-developer) plugin's
`/frontend-developer:govuk-form` skill scaffolds a runnable Hapi + Nunjucks +
Joi prototype from a `specs/<slug>.md` file. Install both plugins side by side
and ask the agent to scaffold a GOV.UK form page from the spec, then bootstrap
the surrounding Hapi app if you want to run it locally. This is a soft,
designer-initiated handoff — not a hard dependency — so `interaction-designer`
does not declare `frontend-developer` in `plugin.json#dependencies`.

## Development

No build or test runner of its own — the marketplace's `npm test` (schema,
frontmatter, docs-sync, and cross-plugin-ref validators) covers this plugin
too. This is a spec-stage project beyond that; the `SKILL.md` files under
`skills/<name>/` are the artefact and the source of truth for each skill's
behaviour. Cross-cutting conventions and load-bearing invariants live in
`AGENTS.md`.

### Layout

```
plugins/interaction-designer/
├── plugin.json                            Plugin manifest
├── README.md                              This file
├── AGENTS.md                              Project conventions for the agent
├── skills/
│   ├── ixd-start/SKILL.md                     Orchestrator (invoked as /ixd-start)
│   ├── ixd-read-corpus/SKILL.md               Leaf skill
│   ├── ixd-frame-policy/SKILL.md              Leaf skill
│   ├── ixd-map-journey/SKILL.md               Leaf skill
│   ├── ixd-spec-page/SKILL.md                 Leaf skill
│   ├── ixd-preview-spec/SKILL.md              Leaf skill
│   │   ├── components.md                      GDS pattern → HTML mapping table
│   │   ├── chrome-gov-uk.md                   GOV.UK chrome template
│   │   ├── chrome-defra.md                    Defra chrome template
│   │   └── assets/                            Defra logo SVG + hand-written theme CSS
│   └── ixd-wrap-up/SKILL.md                   Leaf skill
└── docs/
    ├── how-it-works.md                    Flow diagrams, per-stage contracts
    └── cost-monitoring.md                 Premium-request multipliers, model picks
```

### Working on a skill

1. Re-read the relevant section of `AGENTS.md`.
2. Implement the skill at `skills/<name>/SKILL.md`. YAML frontmatter with
   `name` (must match the parent directory), `description` (≤500 chars);
   `allowed-tools: shell` only if the skill actually shells out.
   Body sections: preamble, `## When to use`, `## Process`
   (numbered for leaves, phased for the orchestrator), `## Notes`.
3. Exercise end-to-end against a real `sources/` corpus before treating it as
   done.
4. Run `npm test` from the repository root to confirm the change passes the
   marketplace's structural validators.

### The single hard architectural rule

The orchestrator is a **Copilot skill**, never a **Copilot custom agent**.
Custom agents run as isolated subagents and carry a known
`/skill-name`-invocation bug; using one breaks per-stage journal accumulation
and slash-command composition.

## Licence

Open Government Licence v3.0. See [LICENSE](../../LICENSE).
