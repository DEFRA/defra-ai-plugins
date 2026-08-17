---
name: ixd-preview-spec
description: Render a `specs/<slug>.md` page spec as an HTML preview at `previews/<slug>.html` (gov.uk mode) or `previews/<slug>--defra.html` (defra mode). Two brand modes are supported — `gov.uk` (GOV.UK Design System chrome) and `defra` (Defra branding). Brand comes from the `--brand=` input or the spec's `brand:` setting; stops and asks if neither is set. Invoke after `/ixd-spec-page <slug>`, or on request to see what's been designed. Do NOT auto-invoke during journey-drafting or earlier phases.
---

# ixd-preview-spec

A "show me what I've designed" step. Reads `specs/<slug>.md` and writes
`previews/<slug>.html` — a single HTML file that renders the page in one of two
brand modes:

- **gov.uk**: standard GOV.UK Design System chrome via the `govuk-frontend@6.1.0` CDN.
- **defra**: Defra brand chrome per <https://digital.defra.gov.uk/design/branding>, layered on top of the same `govuk-frontend` base (Defra reuses GOV.UK Design System components — only the chrome, fonts, and accent colours change).

A yellow preview banner sits above the rendered page making clear this is a
preview, not a deployable artefact.

**Load-bearing constraints**: brand mode is a **hard gate** — if neither
`--brand=` argument nor spec frontmatter sets a value, the skill stops and asks.
No silent default; stakeholder audiences raise the cost of a wrong-brand render
to the point that always-confirmed beats sometimes-defaulted. And **the spec is
the source of truth** — the preview is a view, not an authoring surface; edits
to the preview don't propagate back. To change what the preview shows, revise
`specs/<slug>.md` and re-run this skill.

## When to use

- Immediately after `/ixd-spec-page <slug>` has written a new or revised `specs/<slug>.md`, when the designer wants to see what the page looks like.
- Standalone, with a page slug as the argument, on the skills surface.
- With `--brand=defra` (or `brand: defra` in the spec frontmatter) when the service will ship on a Defra domain rather than GOV.UK.

Do **not** auto-invoke during journey-drafting or earlier phases — there's no
spec to preview yet.

## Process

**On invocation, work through the steps below in order — read, parse, write —
without pausing for confirmation unless a step explicitly requires it.**

### 1. Resolve the page slug

Discovery order:

1. **Argument**: if a page slug was passed, use it.
2. **Recommended from history**: read `DESIGN_HISTORY.md` and use the slug from the most recent `## <date> — ixd-spec-page on <slug>` heading.
3. **Ask**: if neither, list `specs/*.md` and ask the designer to pick.

### 2. Read the spec

Read `specs/<slug>.md` at the current working directory. If it doesn't exist,
stop and say: "I can't find `specs/<slug>.md`. Run `/ixd-spec-page <slug>`
first."

Also read the latest `ixd-frame-policy` entry from `DESIGN_HISTORY.md` — use its
`on <subject>` clause as the service title that appears in the `<title>` tag and
the header.

While reading the spec, check for a YAML frontmatter block at the top of the
file (a `---` line, key-value lines, then another `---`). If present, capture
any `brand:` value for use in step 4. The absence of `brand:` frontmatter is not
an error at this step; brand resolution (including the hard-gate ask if no value
is set anywhere) happens at step 4.

### 3. Parse the spec sections

Extract from `specs/<slug>.md`:

- **Question** — the literal wording. Becomes the page `<h1>`.
- **Hint text** — if present in the spec's Question section as `Hint text: ...`. Becomes a `<div class="govuk-hint">` below the H1.
- **Components** — bullet list under `## Components`. Each bullet names a GDS component (e.g. **Radios**, **Text input**). Look each one up in `skills/ixd-preview-spec/components.md` (the mapping table) for the HTML shape. `components.md` is shared across both brand modes — Defra reuses GOV.UK Design System components for form bodies.
- **States** — under `## States`. Render the **Empty / first visit** state only in v1; the others (Filled, valid / Filled, invalid / Returning after CYA) are parked for v2.
- **Validation** — under `## Validation`. Used to set up real `required` attributes and `<noscript>`/inline error messages (but the page renders in the Empty state by default, so errors are not visible).
- **Open decisions** — under `## Open decisions`. Render as a collapsed `<details class="govuk-details">` element below the form, with summary "Designer notes — open decisions on this page".

### 4. Resolve the brand and load the chrome template

The brand mode picks which chrome template wraps the form body. Two modes in v1:
`gov.uk` and `defra`. Agency variants (Forestry Commission, Natural England, EA,
APHA, RPA, etc.) are not supported in v1.

Resolution order, highest priority first:

1. **`--brand=` argument** to the skill invocation (e.g. `/ixd-preview-spec tree-condition --brand=defra`). Use this value, announce it, render.
2. **`brand:` frontmatter** captured in step 2. Use this value, announce it, render.
3. **Neither**: STOP. Do **not** assume a default. Ask the designer:

   > Which brand should this preview render in?
   >
   > - `gov.uk` for services hosted on gov.uk. GOV.UK Design System chrome with the crown wordmark.
   > - `defra` for services hosted on Defra domains. Defra header, Defra logo, Helvetica/Arial fonts, Defra green accents. Required by the Defra branding guidance for non-GOV.UK services.
   >
   > Reply with `gov.uk` or `defra`, or re-run with `--brand=<value>`.

   Wait for the designer's reply before proceeding. Do not fabricate a choice on their behalf.

The `--brand=` input wins over the spec's `brand:` setting when both are
present. Explicit per-render override beats the per-spec default.

Once a brand is resolved, announce it before loading the chrome:

> Rendering with brand `<brand>`.

Then load the chrome template:

- For `gov.uk`: read `skills/ixd-preview-spec/chrome-gov-uk.md` and use the code block under its `## Template` heading.
- For `defra`: read `skills/ixd-preview-spec/chrome-defra.md` and use the code block under its `## Template` heading. The template references two sibling files in `previews/`:
  - `defra.css` — read `skills/ixd-preview-spec/assets/defra.css` and write its contents to `previews/defra.css`.
  - `defra-logo.svg` — read `skills/ixd-preview-spec/assets/defra-logo.svg` and write its contents to `previews/defra-logo.svg`.

  Both writes are idempotent — overwriting with identical content is harmless. The rendered Defra preview HTML references these by relative path (`<link href="defra.css">`, `<img src="defra-logo.svg">`), so the three files together form the Defra preview artefact.

### 5. Substitute placeholders

Substitutions are the same in both brand modes — no Defra-only placeholders. The
Defra theme CSS and logo are sibling files referenced by relative path from the
rendered HTML, not inline substitutions.

- `{{question}}`: the literal question text from the spec's `## Question` section, escaped for HTML.
- `{{service-title}}`: the brief title from the `ixd-frame-policy` entry's `on <subject>` clause (e.g. "Apply to fell a tree with a Tree Preservation Order").
- `{{slug}}`: the page slug.
- `{{date}}`: today's date as `YYYY-MM-DD`.
- `{{form-body}}`: see step 6.
- `{{open-decisions}}`: see step 7.

### 6. Build the form body

The form body is an `<h1>`, optional hint, then one form group per component
from the spec's `## Components` section.

Shape:

```html
<h1 class="govuk-heading-l">{{question}}</h1>

<!-- Optional hint -->
<div class="govuk-hint">{{hint}}</div>

<!-- One block per component, in order -->
{{component-block-1}} {{component-block-2}} ...
```

For each component bullet, look up the GDS pattern name (e.g. **Radios**, **Text
input**, **File upload**) in `skills/ixd-preview-spec/components.md` to get the
HTML shape. The mapping table contains the canonical class names, attributes,
and inner structure for each pattern. Substitute the component's spec-provided
details (options, labels, hint text) into the template. Form components use
`govuk-*` classes in **both** brand modes — Defra reuses GOV.UK Design System
for form bodies; the Defra theme CSS re-asserts the Helvetica/Arial font stack
on those classes.

If the spec's `## Components` section names a pattern that isn't in
`components.md`:

- Render an inline placeholder:
  ```html
  <div class="govuk-inset-text">
    The preview can't render <strong>{{pattern-name}}</strong> yet. The spec describes it as:
    <em>{{spec-description}}</em>.
  </div>
  ```
- Record the missing pattern in the journal entry under "Components the preview couldn't render".

### 7. Build the Open decisions block

```html
<details class="govuk-details">
  <summary class="govuk-details__summary">
    <span class="govuk-details__summary-text"> Designer notes: open decisions on this page </span>
  </summary>
  <div class="govuk-details__text">
    <ul class="govuk-list govuk-list--bullet">
      <li>{{decision-1}}</li>
      <li>{{decision-2}}</li>
      ...
    </ul>
  </div>
</details>
```

Take each bullet from the spec's `## Open decisions` section verbatim
(preserving the designer's wording). If the section is empty, omit this block
entirely.

### 8. Write the file

For the **gov.uk** brand mode, write to `previews/<slug>.html`.

For the **defra** brand mode, write to `previews/<slug>--defra.html` so a
designer can render both brands of the same spec side-by-side and compare
(useful when a service might plausibly host on either side).

Create the `previews/` directory if it doesn't exist. Overwrite if a preview
already exists — previews are cheap; re-running the skill always regenerates.

### 9. Append the journal entry

To `DESIGN_HISTORY.md` at the current working directory:

```markdown
## <YYYY-MM-DD> — ixd-preview-spec on <slug>

Rendered `previews/<output-filename>` from `specs/<slug>.md`.

Brand mode: `<brand>`.
Page shape: question page, first-visit state.
GOV.UK Frontend: `govuk-frontend@6.1.0` via jsdelivr CDN.

Components rendered: <list of patterns>.
Components the preview couldn't render: <list, or "none">.
Open decisions surfaced: <count>, shown as a collapsed Designer notes disclosure.

Next: open `previews/<output-filename>` in a browser. If the preview surfaces a wording or shape problem, revise via `/ixd-spec-page <slug>` and re-run `/ixd-preview-spec <slug>`. Otherwise continue with the journey or invoke `/ixd-wrap-up`.
```

### 10. End the turn

Confirm the preview was written, name the file path, and suggest opening it:

```
open previews/<output-filename>       # macOS
xdg-open previews/<output-filename>   # Linux
```

Do **not** run `open`. The trust gate is at the designer.

Do not surface a git commit line here. The session's consolidated commit
suggestion lands once at `/ixd-wrap-up`.

## Notes

- **`govuk-frontend` version is pinned in three places.** The CDN URL in `chrome-gov-uk.md`'s template, the CDN URL in `chrome-defra.md`'s template, and the literal version string in the journal-entry template at step 9. Bumping the renderer means updating all three. If the bump crosses a major boundary, also row-by-row reverify `components.md`, both chrome templates, and the Defra theme CSS in `assets/defra.css` against the new version's canonical examples at <https://design-system.service.gov.uk/components/>.
- **Form components are shared across brand modes.** `components.md` is single and not duplicated per brand — Defra reuses GOV.UK Design System for radios, inputs, buttons, etc. The Defra theme CSS (`assets/defra.css`) overrides the font stack on those `govuk-*` classes.
- **Defra assets are vendored, not loaded cross-origin.** `assets/defra-logo.svg` was sourced from `digital.defra.gov.uk/public/images/defra-logo.svg`; `assets/defra.css` is hand-written from inspection of the live digital.defra.gov.uk bundle. Both copied into `previews/` as sibling files at render time — the HTML references them by relative path so the preview opens off disk without cross-origin or CDN dependency for the brand assets.
- **Defra preview is a directory, not a single file.** A Defra render produces `previews/<slug>--defra.html` plus `previews/defra.css` and `previews/defra-logo.svg` (the latter two copied once per session). Sending the HTML alone won't carry the styling; a designer sharing the preview shares the directory.
- **Designer review is a non-skippable shipping gate for Defra mode.** Hand-written theme CSS plus stakeholder audiences mean a Defra designer should eyeball a Defra-rendered preview against a real Defra service before the work is treated as shippable. Implementer cannot self-certify Defra fidelity.
- **Question-page shape is v1's contract.** Start-page shape (intro, warning box, "Start now" button, "Before you start" list) is a special case parked as a v2 follow-up. If asked to preview a `start` slug, render it as a question page with a note in the journal entry flagging the limitation.
- **Empty state only in v1.** No state-switcher; the page renders as the user would see it on first visit. Validation errors don't show.
- **Don't fabricate content.** Render what's in the spec. If a section is missing or terse, the preview shows that — it's an honest view of the spec as written.
- **Mapping table grows as needed.** When `components.md` doesn't have a pattern the spec uses, the preview shows an inset-text placeholder and the journal entry records the gap. Treat repeated gaps as a signal to add rows to `components.md`.
- Date format: `YYYY-MM-DD` from today's date.
