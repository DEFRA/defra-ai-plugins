---
name: gds-prototype-kit
description: >-
  Building and structuring GOV.UK Prototype Kit repositories. Use when creating or editing prototype pages, routes, layouts, controllers, view models or session data, when a Design System example needs turning into a page that runs, or a prototype has grown messy. Trigger on prototype kit, app/views, app/routes.js, layouts/main.html, session data, branching, npm run dev, clear data, view model, controller, and why a form does not remember answers or a radio does not stay selected.
license: OGL-UK-3.0
---

# GOV.UK Prototype Kit

The kit runs the pages. This skill covers two things: turning a Design System example into a page that works, and laying the repository out so it survives past ten pages.

Design System examples are template fragments. They have no layout, no route and no data. Pasting one into `app/views` and expecting it to work is the most common failure.

## Structure first

Prototypes are usually written by people who are not developers, get extended for months, and are sometimes read by the team building the real service. The default layout — every route in one `app/routes.js`, every template flat in `app/views/` — stops working somewhere around ten pages.

**Read [references/page-module-architecture.md](references/page-module-architecture.md) before creating the second page of a prototype**, and use [references/scaffold.md](references/scaffold.md) for the working skeleton to copy. For a prototype that is already a mess, [references/refactor-existing.md](references/refactor-existing.md) is the incremental way out.

In short: one folder per page under `app/views/`, holding only the files that page needs.

```
app/
  routes.js                  a loader that walks the tree for routes.js files
  data/boards.js             data access, no presentation
  views/
    common/
      layouts/               base + a small fixed set of variants
      macros/                reusable UI, prefixed app…
    boards/
      routes.js              paths only, no logic
      controller.js          glue: read request, call data, build view model, render
      view-model.js          all display shaping
      page.njk               extends a layout variant
```

Controllers are glue. View models own sorting, formatting, pagination and computed labels. Templates loop over data that is already the right shape.

**But do not scaffold five files for a static page.** Most prototype pages are a single template and should stay that way. Grow into the structure: template, then a route when there is branching or validation, then a view model the moment the template starts computing something.

## Turning a Design System example into a page

Every example in `gds-components` and `gds-patterns` is the middle of a page. Wrap it:

```njk
{% extends "common/layouts/content.njk" %}
{% from "govuk/components/input/macro.njk" import govukInput %}
{% from "govuk/components/button/macro.njk" import govukButton %}

{% set title = "What is your name?" %}
{% set backLink = { text: "Back", href: "/start" } %}

{% block columns %}
  <form method="post">
    {{ govukInput({
      label: { text: title, classes: "govuk-label--l", isPageHeading: true },
      id: "full-name",
      name: "fullName",
      autocomplete: "name",
      value: data['fullName']
    }) }}

    {{ govukButton({ text: "Continue" }) }}
  </form>
{% endblock %}
```

The parts that are not in the Design System example:

- A layout. `common/layouts/content.njk` if you have the scaffold, `layouts/main.html` in a bare kit. Never `govuk/template.njk` directly.
- A title, which the layout puts in `<title>` as `title - serviceName - GOV.UK`.
- The back link, in `beforeContent` so it sits above `<main>`.
- The grid wrapper. Two-thirds is the default for reading and forms — in the scaffold the layout owns it, so pages do not repeat it.
- `<form method="post">` with no `action` — it posts back to the same URL.
- `value: data['fullName']` so the answer survives going back.

## Session data

The kit stores **every** posted field into `req.session.data` automatically. You do not write code to save answers.

- In a template: `{{ data['fullName'] }}`, and `value: data['fullName']` on inputs.
- In a route: `req.session.data['fullName']`.
- Field names starting with `_` are ignored by the store.
- `app/data/session-data-defaults.js` seeds every new session — useful for a realistic scenario in research.

### Radios and checkboxes

Use the kit's `checked()` function so a selection survives going back:

```njk
{{ govukRadios({
  name: "vehicle",
  fieldset: { legend: { text: "What are you registering?", classes: "govuk-fieldset__legend--l", isPageHeading: true } },
  items: [
    { value: "car", text: "Car", checked: checked("vehicle", "car") },
    { value: "van", text: "Van", checked: checked("vehicle", "van") }
  ]
}) }}
```

For checkboxes, add a hidden `_unchecked` value so clearing every box actually clears the stored answer:

```njk
<input type="hidden" name="interests" value="_unchecked">
```

## Routes and branching

Only write a route when the page needs branching or validation. Otherwise the kit's own handling is enough: an unmatched POST is redirected to the same path as a GET, and the auto data store keeps the answers.

```js
const govukPrototypeKit = require('govuk-prototype-kit')
const { getVehicle, postVehicle } = require('./controller')

const router = govukPrototypeKit.requests.setupRouter('/what-are-you-registering')

router.get('/', getVehicle)
router.post('/', postVehicle)
```

**Always redirect after a POST**, except when re-rendering a page that failed validation. Rendering the next page straight from the POST handler leaves the browser on a posted URL, so the back button re-submits and the back link goes to the wrong place.

### Gotchas that cost an hour each

- **Route parameters must be in the router's own path, not the mount path.** The kit builds the router without `mergeParams`, so `setupRouter('/boards/:id')` leaves `req.params.id` undefined. Use `setupRouter('/boards')` with `router.get('/:id', ...)`.
- **The kit renders any URL that matches a template**, so `/boards/page` will serve `page.njk` with no view model — a page that renders but is empty. The scaffold's loader includes a guard for this.
- **Templates must live under `app/views/`.** The Nunjucks search root is hardcoded; only installed plugins can add paths. That is why page modules sit under `app/views/` rather than a separate `app/pages/`.
- **A layout that does `{% set pageName = title %}` overrides whatever the page set.** Use `{% set pageName = pageName or title %}` so a view model can supply an "Error: " prefix.

## Version pinning

The kit pins its own `govuk-frontend`, usually a major version behind what the Design System website documents. Run `npm ls govuk-frontend` before using a newer macro option.

Affected components carry a **Version differences** section in their `gds-components` reference file — `header`, `button`, `date-input`, `file-upload`, `footer`, `panel` and `service-navigation`, plus `feedback`, `generic-header` and `language-navigation`, which do not exist in older versions at all.

## Publishing

- **Password protect every published prototype.** An unprotected prototype on the open web can be mistaken for a real service.
- Prototypes are for research, not production. **Never copy prototype code into a live service** — the kit has neither the security nor the performance characteristics for one.
- No real personal data in `session-data-defaults.js` or any committed file. Made-up names and addresses only.

## Related skills

- **`gds-components`** — the macro to put in the page, and its options.
- **`gds-patterns`** — how the page should behave before you code it.
- **`gds-journey-builder`** — stringing pages into a journey, and wiring validation.
- **`defra-interaction-content-designer`** — Defra's hosting, laptop and access constraints for the kit, and the deploy loop for real services.
