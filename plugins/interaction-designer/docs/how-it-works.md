# How interaction-designer works

This plugin turns a verbal brief into a journey doc, a page spec, and a styled
HTML preview through a chain of small skills. Each skill does one job, reads the
prior skill's per-stage entry from `DESIGN_HISTORY.md`, writes its own artefact,
and appends its own per-stage entry. The orchestrator
(`/ixd-start`) is conversational glue — it does not write
artefacts; the leaves do.

This doc maps that out: the high-level shape, the eight-phase arc, the inputs
and outputs per stage, and how the two surfaces (guided vs direct) share the
same skills underneath.

## The shape at a glance

```mermaid
flowchart LR
    brief([Verbal brief])
    sources[(sources/<br/>index.md + briefs<br/>+ reference/)]

    subgraph leaves[Six leaf skills]
        direction TB
        rc[ixd-read-corpus]
        fp[ixd-frame-policy]
        mj[ixd-map-journey]
        sp[ixd-spec-page]
        ps[ixd-preview-spec]
        wu[ixd-wrap-up]
        rc --> fp --> mj --> sp --> ps
        ps -. revision .-> sp
        ps --> wu
    end

    journal[(DESIGN_HISTORY.md<br/>per-stage entries)]
    journey[journey.md]
    specs[specs/&lt;slug&gt;.md]
    previews[previews/&lt;slug&gt;.html]

    brief --> rc
    sources --> rc
    rc --> journal
    fp --> journal
    mj --> journey
    mj --> journal
    sp --> specs
    sp --> journal
    ps --> previews
    ps --> journal
    wu --> journal
```

Two things to notice:

- **`DESIGN_HISTORY.md` is the spine.** Every skill reads the prior per-stage
  entries to ground, and every skill appends its own. Downstream skills never
  re-run upstream work.
- **The revision loop is a self-edge on `ixd-spec-page` → `ixd-preview-spec`.**
  Revisions edit `specs/<slug>.md` in place and append a dated sub-heading
  inside the page's existing journal entry — not a new top-level entry.

## Two surfaces, one skill layer

```mermaid
flowchart TB
    designer((Designer))

    subgraph guided[Guided surface]
        orch[/ixd-start/]
    end

    subgraph direct[Direct surface]
        slash[/ixd-read-corpus, ixd-frame-policy,<br/>ixd-map-journey, ixd-spec-page,<br/>ixd-preview-spec, ixd-wrap-up/]
    end

    leaves[[Six leaf skills]]
    artefacts[(Artefacts<br/>DESIGN_HISTORY, journey, specs, previews)]

    designer -->|first session| guided
    designer -->|returning designer| direct
    guided -->|composes via<br/>in-context slash invocation| leaves
    direct -->|invokes directly| leaves
    leaves --> artefacts
```

The orchestrator is **a curated path through the leaves**, not a separate
codepath. The artefacts produced are identical either way.

## The eight-phase arc

The guided surface walks an eight-phase arc. Each phase invokes exactly one leaf
skill (Phase 7 is the revision loop; it re-invokes `ixd-spec-page` and
`ixd-preview-spec`).

```mermaid
flowchart TD
    p1[Phase 1<br/>Intake]
    p2[Phase 2<br/>Read the corpus<br/>ixd-read-corpus]
    p3[Phase 3<br/>Frame against the four categories<br/>ixd-frame-policy]
    p4[Phase 4<br/>Draft the journey<br/>ixd-map-journey]
    p5[Phase 5<br/>Spec one page<br/>ixd-spec-page]
    p6[Phase 6<br/>Preview the spec<br/>ixd-preview-spec]
    p7{{Phase 7<br/>Revision loop?}}
    p8[Phase 8<br/>Wrap up<br/>ixd-wrap-up]

    p1 --> p2 --> p3 --> p4 --> p5 --> p6 --> p7
    p7 -- yes --> p5
    p7 -- no --> p8
```

Phase 1 also runs a **pre-flight resume check** — if `DESIGN_HISTORY.md` has
per-stage entries below the last `## Session wrap-up`, the orchestrator offers
to continue from the next phase instead of starting fresh.

## Inputs and outputs per stage

The table below is the contract for each leaf skill: what it reads, what it
writes, and what it expects from the prior stage. The orchestrator just
sequences these — the contracts are the same on the direct surface.

| Phase | Skill                                                       | Inputs (reads)                                                                                                                                            | Outputs (writes)                                                                                                                              |
| ----- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 2     | `ixd-read-corpus`                                           | `sources/index.md`; the named brief; every reference doc listed in the index                                                                              | Per-stage entry in `DESIGN_HISTORY.md` (brief path + summaries of reference docs)                                                             |
| 3     | `ixd-frame-policy`                                          | Last `ixd-read-corpus` entry; the brief file itself                                                                                                       | Per-stage entry with four sub-headings (**user / legal context / evidence / eligibility**), each holding the designer's own answer            |
| 4     | `ixd-map-journey`                                           | Last `ixd-read-corpus` and `ixd-frame-policy` entries; the brief; grep over `sources/reference/` for precedent                                            | `journey.md` (numbered page sequence with `path:line-range` citations) + per-stage entry                                                      |
| 5     | `ixd-spec-page`                                             | Last `ixd-map-journey`, `ixd-frame-policy`, `ixd-read-corpus` entries; `journey.md`; the brief; the cited precedent file                                  | `specs/<slug>.md` in the union shape + per-stage entry                                                                                        |
| 6     | `ixd-preview-spec`                                          | `specs/<slug>.md`; last `ixd-frame-policy` entry (for the service title); brand mode from `--brand=` or spec frontmatter; chrome template + components.md | `previews/<slug>.html` (or `previews/<slug>--defra.html` + `previews/defra.css` + `previews/defra-logo.svg` for Defra mode) + per-stage entry |
| 7     | `ixd-spec-page` (revision) + `ixd-preview-spec` (re-render) | Existing `specs/<slug>.md`; the page's existing journal entry                                                                                             | Edited `specs/<slug>.md` (in place); dated `### Revision <date>` sub-heading inside the page's existing journal entry; re-rendered preview    |
| 8     | `ixd-wrap-up`                                               | All per-stage entries since the last `## Session wrap-up`                                                                                                 | `## Session wrap-up — <date>: <title>` entry appended to `DESIGN_HISTORY.md`; consolidated commit suggestion (text only)                      |

### The grounding chain

Each skill grounds on prior journal entries rather than re-reading source files.
This keeps the chain composable: a designer can skip the orchestrator and invoke
leaves directly in any order, as long as the upstream journal entries exist.

```mermaid
flowchart LR
    rc[ixd-read-corpus] -->|writes| j1[entry: read-corpus]
    j1 -.reads.-> fp[ixd-frame-policy]
    fp -->|writes| j2[entry: frame-policy]
    j1 -.reads.-> mj[ixd-map-journey]
    j2 -.reads.-> mj
    mj -->|writes| j3[entry: map-journey]
    mj -->|writes| journey[journey.md]
    j1 -.reads.-> sp[ixd-spec-page]
    j2 -.reads.-> sp
    j3 -.reads.-> sp
    journey -.reads.-> sp
    sp -->|writes| j4[entry: spec-page]
    sp -->|writes| spec[specs/&lt;slug&gt;.md]
    spec -.reads.-> ps[ixd-preview-spec]
    j2 -.reads.-> ps
    ps -->|writes| preview[previews/&lt;slug&gt;.html]
    ps -->|writes| j5[entry: preview-spec]
    j1 & j2 & j3 & j4 & j5 -.reads.-> wu[ixd-wrap-up]
    wu -->|writes| j6[entry: session wrap-up]
```

The dotted arrows are reads; the solid arrows are writes. Every leaf reads some
subset of prior entries and writes exactly one new entry (plus optionally one or
more artefacts).

## The revision loop in detail

Revisions are where the spec/journal split earns its keep. The page spec is
**declarative** (what was built); the journal entry is **narrative** (why).
Revisions edit the declarative spec in place and append narrative as dated
sub-headings inside the page's existing journal entry — not a new top-level
entry. This keeps each page's history as one contiguous block.

```mermaid
sequenceDiagram
    autonumber
    participant D as Designer
    participant O as Orchestrator
    participant SP as ixd-spec-page
    participant PS as ixd-preview-spec
    participant FS as Filesystem

    D->>O: the question wording is wrong
    O->>SP: /ixd-spec-page [slug]
    SP->>FS: detects existing specs/[slug].md
    SP->>FS: edit specs/[slug].md in place
    SP->>FS: append ### Revision [date] inside existing page journal entry
    SP-->>O: revised
    O->>PS: /ixd-preview-spec [slug]
    PS->>FS: re-render previews/[slug].html
    PS-->>O: re-rendered
    O-->>D: revised and preview re-rendered — another revision or wrap up?
```

After two revisions on the same page, the orchestrator soft-nudges toward
wrap-up — but it's not a hard limit. The arc covers one page per session by
design; a designer wanting more pages invokes `/ixd-spec-page <slug>` directly
on the skills surface after the session ends.

## Artefacts on disk at session end

```mermaid
flowchart TD
    cwd[Design workspace cwd]
    cwd --> hist[DESIGN_HISTORY.md<br/>per-stage entries + session summary]
    cwd --> journey[journey.md<br/>numbered page sequence + citations]
    cwd --> specs_d[specs/]
    specs_d --> spec_md[&lt;slug&gt;.md<br/>union page spec]
    cwd --> previews_d[previews/]
    previews_d --> govuk_html[&lt;slug&gt;.html<br/>gov.uk mode]
    previews_d --> defra_html[&lt;slug&gt;--defra.html<br/>defra mode]
    previews_d --> defra_css[defra.css<br/>defra mode sibling]
    previews_d --> defra_svg[defra-logo.svg<br/>defra mode sibling]
```

The Defra-mode preview is a directory, not a single file — sharing the HTML
alone won't carry the styling. Sharing the `previews/` directory does.

## The trust gate

No skill runs `git`. Each one ends by suggesting a commit line for the designer
to paste — but the consolidated commit suggestion lands only once, at wrap-up.
Per-stage skills no longer surface their own commit lines.

## Further reading

- `README.md` — install, model picker, usage.
- `AGENTS.md` — project conventions, ~150 lines.
- `docs/cost-monitoring.md` — premium-request multipliers and model
  recommendations.
