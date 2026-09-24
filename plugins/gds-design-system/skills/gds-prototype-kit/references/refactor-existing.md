# Refactoring an existing prototype

Most prototypes you are handed look like this:

```
app/
  routes.js              900 lines, every route in the service
  views/
    index.html
    name.html
    name-error.html      a whole duplicate page for the error state
    dob.html
    check.html
    confirm.html
    name-v2.html         from a round of research nobody deleted
```

The work is mechanical and can be done one page at a time. **Do it incrementally, and keep the prototype running after every step** — a prototype that is broken for two days while being tidied is worse than a messy one that works.

## Do this only when it pays

Refactor when the prototype is being extended, handed over, or used as the reference for a real build. If it is about to be deleted after one round of research, leave it alone and spend the time on the research.

## Step 1: put the loader in, change nothing else

Replace `app/routes.js` with the loader from [scaffold.md](scaffold.md), and move the existing route file to `app/views/legacy/routes.js` unchanged.

The loader finds it, everything still works, and you now have somewhere to move routes _to_. Nothing has broken.

## Step 2: introduce the layout variants

Add `common/layouts/base.njk`, `content.njk` and `hub.njk`.

Then change existing templates one at a time from `{% extends "layouts/main.html" %}` to `{% extends "common/layouts/content.njk" %}`, moving their grid wrapper markup out and their content into `{% block columns %}`.

This alone usually deletes a lot of repeated markup and is the change people notice most, because pages that had drifted apart line up again.

## Step 3: collapse the duplicated error pages

A separate `name-error.html` beside `name.html` is the single most common problem, and the most valuable to fix. The two pages drift, so the error text stops matching, and the summary and inline messages disagree.

For each pair:

1. Delete the `-error` template.
2. Add `errors` and `errorMessages` to the surviving page, per the question page module in [scaffold.md](scaffold.md).
3. Move the route's error branch to re-render the same page.

Rule of thumb: **one page, one template, whatever state it is in.**

## Step 4: move one page at a time out of the legacy route file

Pick the page being worked on, not the biggest one. For each:

1. Create `app/views/<page>/`.
2. Move its handler out of `legacy/routes.js` into `controller.js`, and its paths into `routes.js`.
3. Move the template in as `page.njk` and update `res.render` paths.
4. If the template computes anything, move that into `view-model.js`.

When `legacy/routes.js` is empty, delete it. There is no need to finish this in one go — a half-migrated prototype where the migrated half is clean is a real improvement.

## Step 5: lift the shaping out of the templates

Search the templates for work that should not be there:

```shell
grep -rnE '\{%[^%]*(for .* in .*\|)|\{\{[^}]*(\+|\*|slice|sort|replace)' app/views --include=*.njk --include=*.html
```

Anything that sorts, formats a date, builds an href or does arithmetic moves to a view model. The template keeps loops and simple conditionals.

## Step 6: delete the dead pages

`name-v2.html`, `dob-old.html`, the folder called `test`. Check them against the routes first, then delete. Git has them if anyone wants them back; a template nobody can account for is a trap for the next person.

## What good looks like afterwards

- No `-error`, `-v2` or `-old` templates.
- No page extends `layouts/main.html` directly.
- `app/routes.js` is the loader and nothing else.
- No template contains a sort, a date format or string arithmetic.
- Every folder under `app/views/` maps to something in the journey.

## Keep the URLs

Prototypes get shared as links, in research plans, in Slack, in a design history. Changing a page's URL during a tidy-up breaks all of that silently.

Keep the paths the same, or add a redirect:

```js
router.get('/old-path', (req, res) => res.redirect(301, '/new-path'))
```
