# Page module architecture

How to lay out a Prototype Kit repository so it stays readable past about ten pages.

The default kit layout puts every route in one `app/routes.js` and every template in a flat `app/views/`. That is fine for five pages. At thirty it is a file nobody can navigate, with sorting logic inline in templates and a route file thousands of lines long. Prototypes get handed over, extended by the next person, and sometimes read by the developers building the real thing — so the structure is worth getting right.

Everything in this file has been run against GOV.UK Prototype Kit 13.20.4. The constraints in [What the kit fixes for you](#what-the-kit-fixes-for-you) are the reason the layout is shaped the way it is rather than some other way.

## When to use this

| Prototype                                                                            | Structure                                                                                                                  |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Under about 8 pages, one linear journey, throwaway                                   | Flat `app/views/*.html`, one `routes.js`. Do not add ceremony to a thing that will be deleted after one round of research. |
| More than that, or it will be handed over, or it has branching and real data shaping | Page modules, as below.                                                                                                    |

Do not retrofit this into a prototype that is about to be thrown away. Do reach for it the moment someone says "and then we'll add…".

## The layout

One directory per page or feature, under `app/views/`, holding only the files that page actually needs.

```
app/
  routes.js                     the loader — walks the tree, requires every routes.js
  views/
    common/
      layouts/
        base.njk                page chrome. Nothing extends this directly.
        content.njk             the ordinary page shape
        hub.njk                 landing and entry pages
      macros/
        status-tag.njk
        empty-state.njk
    boards/
      routes.js                 paths and which handler serves them. No logic.
      controller.js             glue: read request, call data, build view model, render
      view-model.js             all display shaping
      page.njk                  extends a common layout
      detail/
        routes.js
        controller.js
        view-model.js
        page.njk
```

**Why under `app/views/` and not a separate `app/pages/`.** The kit hardcodes its Nunjucks search root to `app/views` — it comes from `appViewsDir` in the kit's `paths.js`, and only installed plugins can add more paths. A template outside `app/views` is not found. Putting the JavaScript beside the template keeps the module in one place, and costs nothing: Nunjucks only ever loads a template it is asked for by name, and the kit's nodemon config watches `app/**/*.js`, so editing a controller still reloads the server.

## The flow through one request

```
routes.js       path and method, points at a controller function
   ↓
controller.js   reads the request, calls the data layer, builds a view model, renders
   ↓
view-model.js   pure shaping: given this data, what does the template need
   ↓
page.njk        extends a common layout, renders the view model
```

The discipline that makes it worth doing:

- **Controllers are glue.** Read the request, call something, render. No sorting, no formatting, no date handling, no building hrefs.
- **View models own presentation.** Sorting, filtering, pagination, display strings, computed labels and links, deciding whether a section renders at all. A view model takes plain data and returns plain data. It never touches `req` or `res`.
- **Templates are declarative.** Loops and simple conditionals over data that is already the right shape. If a template contains arithmetic, string building or a sort, that work belongs in the view model.

The payoff is that a view model is the one piece you can read, reason about and test without starting a server.

### routes.js

```js
const govukPrototypeKit = require('govuk-prototype-kit')
const { getBoards, postBoards } = require('./controller')

const router = govukPrototypeKit.requests.setupRouter('/boards')

router.get('/', getBoards)
router.post('/', postBoards)
```

`setupRouter(path)` returns an Express router already mounted at `path`. Requiring the file is what registers it, so the loader does not need it to export anything.

> **Route parameters must go in the router's own path, not the mount path.** The kit creates the router without `mergeParams`, so `setupRouter('/boards/:id')` leaves `req.params.id` undefined. Use `setupRouter('/boards')` with `router.get('/:id', ...)`.

### controller.js

```js
const { BoardsViewModel } = require('./view-model')
const { listBoards } = require('../../data/boards')

function getBoards(req, res) {
  const filters = { q: req.query.q, status: req.query.status }
  const boards = listBoards(req.session.data, filters)

  res.render('boards/page.njk', BoardsViewModel.fromBoards(boards, filters, req.query))
}

module.exports = { getBoards }
```

Template paths passed to `res.render` are relative to `app/views`, so a module renders its own template by its full path: `boards/page.njk`, `boards/detail/page.njk`.

### view-model.js

A class with a static factory reads well and keeps the shaping in one obvious place.

```js
class BoardsViewModel {
  constructor(data = {}) {
    this.title = data.title
    this.boards = data.boards ?? []
    this.pagination = data.pagination ?? null
    this.filters = data.filters ?? {}
  }

  static fromBoards(boards, filters, view = {}) {
    const rows = boards.map((board) => ({
      name: board.name,
      href: `/boards/${board.id}`,
      status: STATUS_LABELS[board.status],
      updated: formatDate(board.updatedAt)
    }))

    const sorted = sortRows(rows, view.sort, view.order)
    const page = paginate(sorted, view.page)

    return new BoardsViewModel({
      title: 'Boards',
      boards: page.items,
      // Never render pagination for a single page of results.
      pagination: page.totalPages > 1 ? page.pagination : null,
      filters
    })
  }
}

module.exports = { BoardsViewModel }
```

A plain function returning an object is fine too. The class matters less than the rule that the shaping lives here.

### page.njk

```njk
{% extends "common/layouts/content.njk" %}
{% from "common/macros/empty-state.njk" import appEmptyState %}
{% from "govuk/components/table/macro.njk" import govukTable %}

{% set backLink = { text: "Back", href: "/" } %}

{% block columns %}
  <h1 class="govuk-heading-l">{{ title }}</h1>

  {% if boards.length %}
    {{ govukTable({ head: tableHead, rows: tableRows }) }}
  {% else %}
    {{ appEmptyState("No boards have been requested yet.") }}
  {% endif %}
{% endblock %}
```

## The loader

`app/routes.js` is the only route file the kit loads — it requires exactly that path and nothing else. So it becomes a loader, and adding a page means adding a folder.

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

// The kit renders any URL that happens to match a template, which would serve
// a page.njk with no view model, or a bare layout. Registered after the page
// modules, so real routes still win.
govukPrototypeKit.requests.setupRouter().get(/(^\/common\/)|(\/page$)/, (req, res) => {
  res.status(404).render('common/layouts/not-found.njk')
})
```

Load order across modules is directory order, so no module may depend on another having been loaded first. Register the most specific paths inside each module rather than relying on sequence.

## The shared template layer

`common/` is what stops thirty pages drifting apart.

- **`layouts/base.njk`** — chrome only: head, header, footer, assets. In the kit this extends `layouts/main.html`, which the starter already wires to the GOV.UK branded layout. **No page extends `base.njk` directly.**
- **A small fixed set of layout variants** on top of base — one per page _shape_, not one per page. Two is usually right: `content.njk` for ordinary pages, `hub.njk` for landing pages. This gives whoever is building pages two modes to pick between instead of inventing chrome each time, and it is the single biggest lever on consistency.
- **`macros/`** — reusable presentational macros for things the Design System does not cover: status tags, cards, empty states, filter panels. Import per template with `{% from "common/macros/x.njk" import y %}`.

Prefix your own macros distinctly (`appEmptyState`, not `govukEmptyState`) so nobody mistakes a local invention for a Design System component.

A layout variant, for reference:

```njk
{% extends "common/layouts/base.njk" %}
{% from "govuk/components/back-link/macro.njk" import govukBackLink %}

{% set pageName = title %}

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

## Where data lives

Keep anything that is not presentation out of the page modules:

```
app/
  data/
    session-data-defaults.js    the kit's own seed data
    boards.js                   query and mutate functions over session data
```

A data function takes `req.session.data` and returns plain objects. It does not know about `req`, `res` or templates. In a prototype "the data layer" is usually twenty lines over the session — that is fine, and it still belongs in its own file, because it is the part that gets replaced by a real API call if the service is built.

## What the kit fixes for you

Behaviour that the layout above depends on. All verified against 13.20.4.

- **`app/routes.js` is the only route file the kit requires.** Everything else is your own composition.
- **The Nunjucks search root is `app/views`**, hardcoded. Templates must live under it; only installed plugins can add search paths.
- **nodemon watches `app/**/*.js` and `app/**/*.json`**, ignoring `app/assets`, so co-located controllers and view models hot reload.
- **Your routers are registered before the kit's own catch-alls.** Both the auto-render and the blanket POST-to-GET redirect run after yours, so a module route always wins.
- **Any POST with no matching route is redirected to the same path as a GET.** That is what makes a form on a page with no branching work without a route at all — the auto data store keeps the answers.
- **Every posted field is stored in `req.session.data` automatically.** Field names starting with `_` are skipped.

## Checklist

- [ ] One folder per page or feature under `app/views/`, with only the files it needs.
- [ ] `app/routes.js` is a loader; adding a page means adding a folder.
- [ ] Route params are in the router's own path, never in the `setupRouter` mount path.
- [ ] Controllers contain no sorting, formatting or href building.
- [ ] All display shaping is in a view model that never touches `req` or `res`.
- [ ] Templates contain loops and simple conditionals only.
- [ ] Every page extends a named layout variant; nothing extends `base.njk` directly.
- [ ] Repeated UI is a macro in `common/macros/`, prefixed `app…`, not copied markup.
- [ ] Data access is in `app/data/`, not in controllers.
