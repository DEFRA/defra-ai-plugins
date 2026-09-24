# Scaffold

A complete working skeleton for a Prototype Kit repository using page modules. Every file here has been run against GOV.UK Prototype Kit 13.20.4.

Create these once at the start of a prototype, then add one folder per page.

## Files to create once

```
app/
  routes.js
  data/boards.js
  views/common/layouts/base.njk
  views/common/layouts/content.njk
  views/common/layouts/hub.njk
  views/common/layouts/not-found.njk
  views/common/macros/empty-state.njk
```

### `app/routes.js` — the loader

```js
const { readdirSync, statSync } = require('fs')
const path = require('path')
const govukPrototypeKit = require('govuk-prototype-kit')

const pagesDir = path.join(__dirname, 'views')

function findRouteFiles(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) findRouteFiles(full, found)
    else if (entry === 'routes.js') found.push(full)
  }
  return found
}

for (const file of findRouteFiles(pagesDir)) require(file)

// The kit renders any URL that matches a template, which would serve a page
// with no view model, or a bare layout. Registered after the page modules so
// real routes still win.
govukPrototypeKit.requests.setupRouter().get(/(^\/common\/)|(\/page$)/, (req, res) => {
  res.status(404).render('common/layouts/not-found.njk')
})
```

### `app/views/common/layouts/base.njk`

Chrome only. The kit's starter `layouts/main.html` already extends the GOV.UK branded layout, so base sits on top of it and is the single place to add anything site-wide.

```njk
{% extends "layouts/main.html" %}
```

### `app/views/common/layouts/content.njk`

The ordinary page shape. Most pages extend this.

```njk
{% extends "common/layouts/base.njk" %}
{% from "govuk/components/back-link/macro.njk" import govukBackLink %}

{# A view model may set pageName itself, for example to add an "Error: "
   prefix. Only fall back to title when it has not. #}
{% set pageName = pageName or title %}

{% block beforeContent %}
  {% if backLink %}{{ govukBackLink(backLink) }}{% endif %}
{% endblock %}

{% block content %}
  <div class="govuk-grid-row">
    <div class="govuk-grid-column-two-thirds">
      {% block columns %}{% endblock %}
    </div>
  </div>
{% endblock %}
```

### `app/views/common/layouts/hub.njk`

Landing and entry pages: full width, no back link.

```njk
{% extends "common/layouts/base.njk" %}

{% set pageName = pageName or title %}

{% block content %}
  <div class="govuk-grid-row">
    <div class="govuk-grid-column-full">
      {% block hero %}{% endblock %}
    </div>
  </div>
  <div class="govuk-grid-row">
    {% block tiles %}{% endblock %}
  </div>
{% endblock %}
```

Two variants is usually enough. Add a third only when a genuinely different page _shape_ appears, never for a one-off page.

### `app/views/common/layouts/not-found.njk`

```njk
{% extends "common/layouts/content.njk" %}

{% set title = "Page not found" %}

{% block columns %}
  <h1 class="govuk-heading-l">Page not found</h1>
  <p class="govuk-body">If you typed the web address, check it is correct.</p>
{% endblock %}
```

### `app/views/common/macros/empty-state.njk`

Prefix your own macros `app…` so nobody mistakes one for a Design System component.

```njk
{% macro appEmptyState(text, action) %}
  <p class="govuk-body">{{ text }}</p>
  {% if action %}
    <p class="govuk-body"><a class="govuk-link" href="{{ action.href }}">{{ action.text }}</a></p>
  {% endif %}
{% endmacro %}
```

### `app/data/boards.js`

Data access, separate from presentation. In a prototype this is usually a few functions over session data — and it is still worth its own file, because this is the part that becomes a real API call if the service gets built.

```js
function listBoards(sessionData, filters = {}) {
  const boards = sessionData.boards ?? []
  if (!filters.status) return boards
  return boards.filter((board) => board.status === filters.status)
}

function getBoard(sessionData, id) {
  return (sessionData.boards ?? []).find((board) => board.id === id)
}

module.exports = { listBoards, getBoard }
```

## A question page module

The most common page in a government service. Four files.

```
app/views/full-name/
  routes.js
  schema.js
  controller.js
  view-model.js
  page.njk
```

### `routes.js`

```js
const govukPrototypeKit = require('govuk-prototype-kit')
const { get, post } = require('./controller')

const router = govukPrototypeKit.requests.setupRouter('/full-name')

router.get('/', get)
router.post('/', post)
```

### `schema.js`

Validation rules and nothing else. Returning errors in field order keeps the error summary in the same order as the page, which the Design System requires.

```js
// Page order. The error summary must list errors in this order.
const FIELDS = [{ name: 'fullName', id: 'full-name' }]

function validate(data) {
  const errors = []

  if (!data.fullName || !data.fullName.trim()) {
    errors.push({ name: 'fullName', text: 'Enter your full name', href: '#full-name' })
  } else if (data.fullName.length > 35) {
    errors.push({
      name: 'fullName',
      text: 'Full name must be 35 characters or fewer',
      href: '#full-name'
    })
  }

  return errors.sort(
    (a, b) =>
      FIELDS.findIndex((f) => f.name === a.name) - FIELDS.findIndex((f) => f.name === b.name)
  )
}

module.exports = { validate }
```

### `controller.js`

```js
const { FullNameViewModel } = require('./view-model')
const { validate } = require('./schema')

function get(req, res) {
  res.render('full-name/page.njk', FullNameViewModel.fromData(req.session.data))
}

function post(req, res) {
  const errors = validate(req.session.data)

  // Errors are the one case where you re-render instead of redirecting, so the
  // person keeps their answers and the URL still matches the page.
  if (errors.length) {
    return res.render('full-name/page.njk', FullNameViewModel.fromData(req.session.data, errors))
  }

  res.redirect('/date-of-birth')
}

module.exports = { get, post }
```

The kit's auto data store has already written the posted fields into `req.session.data` by the time the handler runs, so there is nothing to save.

### `view-model.js`

Building the summary list and the inline messages from one source is what keeps their text identical, which the Design System requires — rather than leaving it to whoever edits the strings next.

```js
class FullNameViewModel {
  constructor(data = {}) {
    this.title = data.title
    this.pageName = data.pageName
    this.values = data.values ?? {}
    this.errors = data.errors ?? null
    this.errorMessages = data.errorMessages ?? {}
  }

  static fromData(data, errors = []) {
    const title = 'What is your name?'

    const errorMessages = {}
    for (const error of errors) errorMessages[error.name] = { text: error.text }

    return new FullNameViewModel({
      title,
      // The "Error: " title prefix is presentation, so it is computed here
      // rather than with a conditional in the template.
      pageName: (errors.length ? 'Error: ' : '') + title,
      values: { fullName: data.fullName },
      errors: errors.length ? errors : null,
      errorMessages
    })
  }
}

module.exports = { FullNameViewModel }
```

### `page.njk`

```njk
{% extends "common/layouts/content.njk" %}
{% from "govuk/components/error-summary/macro.njk" import govukErrorSummary %}
{% from "govuk/components/input/macro.njk" import govukInput %}
{% from "govuk/components/button/macro.njk" import govukButton %}

{% set backLink = { text: "Back", href: "/start" } %}

{% block columns %}
  {% if errors %}
    {{ govukErrorSummary({ titleText: "There is a problem", errorList: errors }) }}
  {% endif %}

  <form method="post">
    {{ govukInput({
      label: { text: title, classes: "govuk-label--l", isPageHeading: true },
      id: "full-name",
      name: "fullName",
      autocomplete: "name",
      value: values.fullName,
      errorMessage: errorMessages.fullName
    }) }}

    {{ govukButton({ text: "Continue" }) }}
  </form>
{% endblock %}
```

`errorMessage` renders nothing for a falsy value, so no `{% if %}` is needed around it.

## A page with no logic

Most pages in a prototype are static. They do not need a module — a single template in the right place is correct, and adding four files around it is waste.

```
app/views/privacy.html
```

The kit serves it at `/privacy` automatically. Give it a layout and a title:

```njk
{% extends "common/layouts/content.njk" %}
{% set title = "Privacy notice" %}
{% block columns %}
  <h1 class="govuk-heading-l">{{ title }}</h1>
{% endblock %}
```

A form on such a page still works with no route at all: the kit redirects an unmatched POST back to the same path as a GET, and the auto data store keeps the answers. Add a `routes.js` at the point you need branching or validation, not before.

## Order of work when adding a page

1. Template only, extending a layout variant. Check it renders.
2. Add `routes.js` and `controller.js` when the page needs branching or validation.
3. Add `view-model.js` the moment the template starts computing anything.
4. Add `schema.js` when there is more than one validation rule.

Growing into the structure beats scaffolding five files for a page that turns out to be static.
