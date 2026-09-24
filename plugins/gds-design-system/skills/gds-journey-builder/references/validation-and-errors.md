# Wiring validation and errors

The Design System documents the error summary and error message components separately. It does not show them wired together, and that wiring is where most implementations go wrong.

For the guidance on _what to say_, read `gds-patterns/references/validation.md` and the error message wording section in each component's reference file. This file is the mechanism.

## The five things that must all happen together

When a page fails validation, **every one** of these is required. Doing four of five is a failure.

1. **The error summary appears at the top of the page**, inside `{% block content %}`, below the back link, above the `<h1>`. It moves focus to itself on load.
2. **Each summary item links to the field in error** with `href: "#field-id"`, matching the input's `id` exactly.
3. **The field shows an inline error message**, passed as the component's `errorMessage` option so the component wires up `aria-describedby` and the red border for you.
4. **The summary text and the inline text are identical.** Not similar. Identical.
5. **The page title is prefixed with "Error: "**, so screen reader users hear that something is wrong before the page name.

Show the summary whenever there is an error, **even when there is only one**.

## The template

```njk
{% extends "layouts/main.html" %}
{% from "govuk/components/error-summary/macro.njk" import govukErrorSummary %}
{% from "govuk/components/input/macro.njk" import govukInput %}
{% from "govuk/components/button/macro.njk" import govukButton %}
{% from "govuk/components/back-link/macro.njk" import govukBackLink %}

{% set pageName = "What is your name?" %}
{% if errors %}{% set pageName = "Error: " + pageName %}{% endif %}

{% block beforeContent %}
  {{ govukBackLink({ text: "Back", href: "/start" }) }}
{% endblock %}

{% block content %}
  <div class="govuk-grid-row">
    <div class="govuk-grid-column-two-thirds">

      {% if errors %}
        {{ govukErrorSummary({
          titleText: "There is a problem",
          errorList: errors
        }) }}
      {% endif %}

      <form method="post">
        {{ govukInput({
          label: { text: "What is your name?", classes: "govuk-label--l", isPageHeading: true },
          id: "full-name",
          name: "fullName",
          autocomplete: "name",
          value: data['fullName'],
          errorMessage: errorMessages['fullName']
        }) }}

        {{ govukButton({ text: "Continue" }) }}
      </form>

    </div>
  </div>
{% endblock %}
```

`errorMessage` takes an object, or a falsy value when there is no error. Passing `false`, `null` or an undefined lookup renders nothing, so no `{% if %}` is needed around it.

## The route

Building both shapes from one list keeps rule 4 — identical text — true by construction, rather than by someone remembering.

```js
router.post('/name', (req, res) => {
  const errors = []

  if (!req.session.data['fullName']) {
    errors.push({ text: 'Enter your full name', href: '#full-name', name: 'fullName' })
  }

  if (errors.length) {
    // The summary list and the inline messages come from the same source, so
    // they cannot drift apart.
    const errorMessages = {}
    for (const error of errors) errorMessages[error.name] = { text: error.text }
    return res.render('name', { errors, errorMessages })
  }

  res.redirect('/date-of-birth')
})
```

**Errors are the one place you render instead of redirecting.** Everywhere else, post then redirect then get. On error, re-render the same page so the person keeps their answers and the URL still matches the page they are on.

## Order the summary to match the page

Summary items must appear in the same order as the fields on the page. A list that jumps around makes no sense to someone working through it top to bottom. Build the list by walking the fields in page order, not by walking a rules object.

## Wording

Full rules are in `gds-patterns/references/validation.md`, and each component's reference file has the specific wording for its own error cases. The ones that come up constantly:

- Say what to do, not what went wrong: "Enter your full name", not "Name is required".
- Be specific about which field: "Enter your date of birth", not "Complete this field".
- Do not say "please", "sorry", "valid", "invalid", "forbidden", "illegal" or "you forgot".
- Sentence case, no full stop.
- For a selection: "Select whether you are registering a car or a van".
- For a length: "Full name must be 35 characters or fewer".

## Checkbox and radio errors

The error message goes on the `fieldset`'s component, not on an individual item, and the summary `href` points at the **first input in the group** — `#vehicle` if the first radio has `id="vehicle"`. The component generates that id from `name` for the first item, so check the rendered output rather than assuming.
