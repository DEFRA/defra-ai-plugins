---
name: defra-accessibility
description: Defra accessibility expectations — WCAG 2.2 AA for code-generating roles (frontend, backend rendering HTML), and semantic-markup expectations for documentation roles. Use when the agent generates a page, a component, a markdown file, or any artefact that will be read by a screen reader, a keyboard-only user, or a user with reduced vision.
license: OGL-UK-3.0
---

# Defra accessibility

Defra services are public-sector services governed by the Public Sector Bodies (Websites and Mobile Applications) Accessibility Regulations 2018. The agent assumes **WCAG 2.2 AA** is a minimum bar, not a target, for every code-generating role. Documentation roles meet a parallel "semantic markup" bar.

## The standard

### Code-generating roles (frontend, backend rendering HTML)

1. **Use the GOV.UK Design System component** rather than hand-rolling markup. Components are tested for accessibility; bespoke markup is not.
2. **Every form input has a programmatic label** via `<label for="…">` or the equivalent `govukInput({ label: { … } })` macro argument. Placeholder text is **not** a label.
3. **Every page has one `<h1>`** and a logical heading hierarchy (no skipping `<h1>` to `<h3>`). The `<h1>` matches the page's question or task.
4. **Errors are exposed twice**: in a `govukErrorSummary` at the top of the page (as a list of links to the offending fields) and inline next to each field via `errorMessage`. Field IDs in the summary `href` match the field's `id` exactly.
5. **Focus is managed**: keyboard focus moves to the error summary on validation failure; focus returns to the trigger when a modal closes; focus is never trapped.
6. **Colour is never the only signal**: errors use a coloured border *and* an icon *and* text; status uses a tag *and* text.
7. **Images have alt text** — descriptive for content images, `alt=""` for decorative ones; never omit the attribute. SVG icons used as buttons have an `aria-label`.
8. **Tables use `<th scope="col|row">`**; complex tables use `<caption>`. Layout-via-`<table>` is forbidden.
9. **Links have meaningful text** — never `click here`, `read more`, `link`. Visually-hidden text fills in the context (`<span class="govuk-visually-hidden">`).
10. **Touch targets are ≥ 24 × 24 CSS px** (WCAG 2.2 SC 2.5.8 *Target Size (Minimum)*). The GOV.UK button macro meets this by default.
11. **Pages are usable at 400% zoom** without horizontal scrolling on a 1280-px viewport. No fixed pixel widths on text containers.
12. **Motion is respected**: any animation respects `prefers-reduced-motion`.

### Documentation roles (technical-writer)

1. **Headings convey structure**, not styling. Use `##`, `###`, in order; never bold-as-heading.
2. **Images have alt text** in markdown: `![Description of the diagram](path.png)` — describe the *information*, not the file.
3. **Link text is descriptive**: `[Defra software development standards](https://…)` — never `[click here](…)` or `[link](…)`.
4. **Tables have a header row** in markdown (`|---|---|`).
5. **Code blocks declare a language** so syntax highlighting and screen readers can identify them.
6. **No emoji-only signposting** — emoji are decorative; the meaning must also be in text.

The agent applies the same rule for any user-facing prose it writes (release notes, error messages, README installation steps).

## Anti-patterns the agent must refuse

- Hand-rolled form markup that duplicates a GOV.UK component (use the macro instead).
- `<input>` with no `<label>`, or label-by-placeholder.
- Multiple `<h1>` on a page.
- Validation errors shown only inline (no error summary) or only in the summary (no inline message).
- Link text `click here` / `read more` / `link` / `here`.
- `alt=""` on a content image (it must be descriptive); missing `alt` on any image.
- Disabling focus outlines globally (`*:focus { outline: none }`).
- Using colour alone to signal a state (red text without an icon or label).
- Animating something that flashes more than three times per second.
- In markdown: bold-as-heading, emoji-as-bullet, or a table without a header row.

If the user asks the agent to do any of the above, the agent refuses and explains which Success Criterion is at stake.

## Worked example

User: "Just add a quick error message under the email input — don't bother with the summary."

Agent response:

> I'll wire both the inline error and the summary — Defra accessibility (WCAG 2.2 AA, SC 3.3.1 *Error Identification* and SC 3.3.3 *Error Suggestion*) requires errors to appear in a summary at the top of the page **and** inline at the field. This lets screen-reader users hear the full list before they hit the field, and lets keyboard users jump to the field via a link.
>
> ```njk
> {% from "govuk/components/error-summary/macro.njk" import govukErrorSummary %}
> {% from "govuk/components/input/macro.njk" import govukInput %}
>
> {% if errorList | length %}
>   {{ govukErrorSummary({ titleText: "There is a problem", errorList: errorList }) }}
> {% endif %}
>
> {{ govukInput({
>   id: "email",
>   name: "email",
>   type: "email",
>   label: { text: "Email address", classes: "govuk-label--m" },
>   value: values.email,
>   errorMessage: fieldErrors.email
> }) }}
> ```
>
> The `errorList` entry's `href` matches `#email` so the summary link focuses the input.

The agent volunteers the summary even when not asked.

## TODO — open project-owner questions

- The exact WCAG 2.2 SC subset for non-frontend roles (technical-writer, backend) is **provisional** — the canonical list above is what this skill enforces until the project owner confirms. See the open-questions list in `docs/spec/PLAN.md` "Decisions still required" in the upstream planning repo.
- Whether the GDS Service Standard adds extra accessibility expectations for non-frontend roles is open.
- Welsh-language accessibility (alt text, language tags, cognitive-load considerations for bilingual pages) is **out of scope for v1** unless the project owner confirms it as a Defra-wide requirement; see `docs/requirements/non_goals.md`.
