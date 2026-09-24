# The journey skeleton

What each page in a standard transaction must contain, and how they join up.

Full guidance for each page type is in `gds-patterns`. This file is the assembly order and the joins between pages, which no single pattern page covers.

## 1. Start page

Lives on GOV.UK, not in your service, for a public-facing service. It tells someone what the service does, whether it applies to them, what they need before starting, and how long it takes.

- One "Start now" button, styled `govuk-button--start`.
- No back link — there is nowhere to go back to.
- Full guidance: `gds-patterns/references/start-using-a-service.md`.

If people need to work out whether they are eligible before starting, that is a separate pattern: `check-a-service-is-suitable.md`.

## 2. Question pages

The body of the journey. One thing per page.

Every question page has:

- A **back link**, in `{% block beforeContent %}` so it sits above `<main>`.
- **One `<h1>`**, which is the `<label>` or `<legend>` of the question when there is only one question on the page. Set `isPageHeading: true` and `classes: "govuk-label--l"` (or `govuk-fieldset__legend--l`).
- A **Continue button**. The text is "Continue", not "Next" or "Submit". Left aligned, no `href`.
- **Values read from stored data**, so going back shows what was entered.

Optional, only if research supports it: a `govuk-caption-l` above the heading for the section name, and a progress indicator.

Never: asterisks on mandatory fields. Mark the optional ones "(optional)" instead.

Full guidance: `gds-patterns/references/question-pages.md`.

### More than one question on a page

Allowed when the questions are genuinely one thing — a date of birth, an address. Then the `<h1>` is a separate heading and the labels are _not_ page headings. Set `isPageHeading: false` and use `govuk-label--s` or no size class.

## 3. Check your answers

Comes after the last question and before anything is submitted.

- A `govukSummaryList` with one row per answer.
- Every row has a **Change** action whose `visuallyHiddenText` names the thing being changed, so a screen reader hears "Change name" and not a page full of links all called "Change".
- Grouped into sections with `<h2>` when the journey is long.
- A declaration and a submit button whose text says what happens: "Accept and send", "Confirm and submit". Not "Continue".

The Change link carries the person back to that question and then **returns them to check answers**, not onward through the remaining pages. In the Prototype Kit, pass where to come back to:

```njk
{
  key: { text: "Name" },
  value: { text: data['fullName'] },
  actions: { items: [{
    href: "/name?returnTo=check-answers",
    text: "Change",
    visuallyHiddenText: "name"
  }]}
}
```

and honour it in the route:

```js
router.post('/name', (req, res) => {
  res.redirect(req.query.returnTo === 'check-answers' ? '/check-answers' : '/date-of-birth')
})
```

Full guidance: `gds-patterns/references/check-answers.md`.

## 4. Confirmation page

- A `govukPanel` with the confirmation and the reference number.
- **What happens next**, in specific terms with real timescales.
- No back link — the transaction is done.
- A link to feedback or to related services if there is somewhere sensible to go.

Full guidance: `gds-patterns/references/confirmation-pages.md`.

## The pages people forget

A journey is not finished without these. They are cheap to add and always come up in assessment.

| Page                                      | Pattern                             |
| ----------------------------------------- | ----------------------------------- |
| Page not found (404)                      | `page-not-found-pages.md`           |
| There is a problem with the service (500) | `problem-with-the-service-pages.md` |
| Service unavailable (503)                 | `service-unavailable-pages.md`      |
| Cookies page                              | `cookies-page.md`                   |
| Accessibility statement                   | linked from the footer              |

## Long or non-linear journeys

If someone cannot complete the whole thing in one sitting, or the parts can be done in any order, the shape changes: a task list replaces the straight run of question pages.

See `gds-patterns/references/task-list-pages.md` and `complete-multiple-tasks.md`, and the `govukTaskList` component.
