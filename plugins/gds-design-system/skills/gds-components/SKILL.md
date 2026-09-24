---
name: gds-components
description: >-
  GOV.UK Design System components and styles, offline. Use when choosing, writing or reviewing any GOV.UK Frontend component or style, in a Prototype Kit page, Nunjucks template or HTML mockup. Trigger on any govuk macro name (govukInput, govukRadios, govukSummaryList, govukErrorSummary), macro options, which component to use, text input, radios, date input, task list, and on spacing, grid, type scale, colour, page template and govuk- override classes. Read this instead of node_modules.
license: OGL-UK-3.0
---

# GOV.UK Design System components

Every component and style in the Design System, held locally: the guidance, the coded examples, and the complete Nunjucks macro options.

**Do not read `node_modules/govuk-frontend` for template code or macro parameters.** Everything that is in there is in here, plus the guidance on how the component is meant to be used, which the package does not carry. Reading the package costs more tokens and tells you only what is _possible_, never what is _right_.

## A component is not the entry point

**Read the pattern first, then come back here for the macro.** This holds for nearly every component, not just form inputs.

28 of the 37 components here are governed by a pattern. `panel` belongs to confirmation pages, `summary-list` to check answers, `breadcrumbs` and `service-navigation` to navigating a service, `task-list` to task list pages, `error-summary` to recovering from validation errors, `cookie-banner` to the cookies page. A component file tells you what the macro accepts. It cannot tell you the shape government has already researched — and for most questions the obvious build is the wrong one:

| Asking for      | Pattern            | What gets built instead, wrongly                    |
| --------------- | ------------------ | --------------------------------------------------- |
| A name          | `names.md`         | Separate title, first, middle and last fields       |
| A date of birth | `dates.md`         | A date picker, or one text input                    |
| A phone number  | `phone-numbers.md` | `type="number"`, rejecting spaces and brackets      |
| An address      | `addresses.md`     | A hand-rolled postcode lookup, or one free-text box |
| Bank details    | `bank-details.md`  | Asking for the account type                         |

So the order is:

1. **Find the pattern** in `gds-patterns` — for the page type you are building, or the thing you are asking for. Start at its `references/_index.md`, which lists all 35 with aliases.
2. **Then come here** for that component's macro options and its own guidance.

### When a component is the entry point

Only when no pattern covers it. These nine are not named by any pattern — they are presentational, and using one directly is correct:

`accordion`, `feedback`, `file-upload`, `generic-header`, `pagination`, `skip-link`, `tabs`, `tag`, `warning-text`

For anything else, if you cannot find a governing pattern, check `gds-patterns/references/_index.md` including its aliases before concluding there isn't one.

And if neither a pattern nor an existing component covers what you have been asked to build, **stop and ask the person you are working with** — see "When there is no pattern" in `gds-patterns`. Inventing a component or an interaction is not an agent's decision.

### Internal and staff-facing services

Patterns assume a member of the public using the service once. For a caseworking or admin system used all day by trained people, the Design System explicitly allows denser choices — grouping questions on one page, small radios and small checkboxes on information-dense screens, and tabs or accordions where speed for a repeat user beats simplicity for a first-timer. Each component's file says where this applies.

What does not relax: WCAG 2.2 AA applies to staff-facing services exactly as it does to public ones, you still use the components rather than hand-rolled markup, and a service not on GOV.UK must use `generic-header` rather than the crown and GOV.UK branding. `gds-patterns` has the full decision.

## How to use this skill

Start at [references/_index.md](references/_index.md). It lists all 37 components with their aliases, so "text box", "tickboxes" and "reveal" resolve to the right file. Then open that component's file.

Each component file holds, in order:

1. When to use it, and when not to
2. How it works — the behaviour and accessibility rules
3. Every coded example, as Nunjucks, inlined where the guidance refers to it
4. Error message wording, where the component has validation
5. The complete macro options for `govukThing({ ... })`

That is one file read per component, typically 1,500 to 3,000 tokens.

## The other reference files

| File                                                         | Read it when                                                                                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| [references/_index.md](references/_index.md)                 | Choosing a component, or resolving a name someone used                                                                          |
| [references/_all-params.md](references/_all-params.md)       | A page needs several components and you want every signature at once (2.6k tokens, all 37 macros)                               |
| [references/_shared-params.md](references/_shared-params.md) | Working with `label`, `hint`, `errorMessage` or `fieldset` — they take the same options everywhere, so they are documented once |
| [references/styles/_index.md](references/styles/_index.md)   | Spacing, grid, colour, type scale, links, lists, page template                                                                  |

## Rules that apply to every component

These come up on nearly every page, so they are here rather than buried in one file.

- **Use the Nunjucks macro, not copied HTML.** Copied HTML does not get fixes when GOV.UK Frontend updates, and it is where accessibility regressions come from. Import the macro at the top of the template.
- **`label`, `hint` and `errorMessage` are objects you pass to the component**, not things you write yourself. The component wires up `aria-describedby`, the `for` attribute and the error state. Hand-writing them breaks screen reader announcements.
- **`name` is what gets submitted, `id` is what the label points at.** `id` defaults to `name`, so you usually only set `name`.
- **Never use placeholder text** in place of a label or hint. It vanishes on typing, is not reliably announced, and usually fails contrast.
- **Set `autocomplete`** on anything asking for the person's own details. It is a WCAG 2.2 AA requirement (1.3.5 Identify input purpose), not a nicety.
- **Do not invent classes.** Use the component's `classes` option with real `govuk-` classes, and the spacing and width override classes in [references/styles/](references/styles/_index.md). If you are writing custom CSS for something the Design System already does, you have taken a wrong turn.
- **`html` options are unescaped.** Use `text` unless you genuinely need markup, and never pass user input into an `html` option.

## Before you reach for a new component

Check [references/_index.md](references/_index.md) first, then the Design System backlog, then other departments, before designing anything new. If it is not in the Design System, the answer is usually that you are solving the problem in the wrong shape.

## Related skills

Required, not optional, in these cases:

- **`gds-patterns`** — **read before** using any component to ask someone for information, per the gate above.
- **`gds-journey-builder`** — **read before** building more than one page. Individual pages can each be correct while the journey between them is wrong, and that is what fails assessments.
- **`gds-prototype-kit`** — **read before** putting an example into a prototype. The examples here are template fragments with no layout, route or data; pasting one into `app/views` and expecting it to work is the most common failure.

Useful alongside:

- **`defra-interaction-content-designer`** — Defra constraints, accessibility duties, copy decks and the deploy loop.
- **`defra-doc-style`** — how to write the words that go in the labels, hints and errors.
