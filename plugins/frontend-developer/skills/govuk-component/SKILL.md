---
name: govuk-component
description: Generate the correct Nunjucks macro call for any GOV.UK Design System component. Use when adding a govuk-frontend component to a template — button, input, radios, checkboxes, select, textarea, date input, file upload, summary list, table, tabs, accordion, breadcrumbs, pagination, panel, tag, phase banner, notification banner, warning text, details, fieldset, back link, skip link, or cookie banner.
license: OGL-UK-3.0
---

# GOV.UK Component

Generate the correct `{% from %}` import and macro call for any GOV.UK Design System component. Never hand-roll markup that duplicates a GOV.UK component.

Always import from:
```njk
{% from "govuk/components/<component-name>/macro.njk" import govuk<ComponentName> %}
```

## Common components

### Button
```njk
{% from "govuk/components/button/macro.njk" import govukButton %}
{{ govukButton({ text: "Continue" }) }}
```
Secondary action: add `classes: "govuk-button--secondary"`. Destructive: `classes: "govuk-button--warning"`.

### Text input
```njk
{% from "govuk/components/input/macro.njk" import govukInput %}
{{ govukInput({
  id: "field-id",
  name: "fieldName",
  label: { text: "Label text", classes: "govuk-label--m" },
  hint: { text: "Optional hint text" },
  value: values.fieldName,
  errorMessage: fieldErrors.fieldName
}) }}
```

### Radios
```njk
{% from "govuk/components/radios/macro.njk" import govukRadios %}
{{ govukRadios({
  idPrefix: "option",
  name: "option",
  fieldset: { legend: { text: "Question text", isPageHeading: true, classes: "govuk-fieldset__legend--l" } },
  hint: { text: "Select one option" },
  items: [
    { value: "yes", text: "Yes" },
    { value: "no", text: "No" }
  ],
  value: values.option,
  errorMessage: fieldErrors.option
}) }}
```

### Checkboxes
```njk
{% from "govuk/components/checkboxes/macro.njk" import govukCheckboxes %}
{{ govukCheckboxes({
  idPrefix: "items",
  name: "items",
  fieldset: { legend: { text: "Which items apply?", classes: "govuk-fieldset__legend--m" } },
  items: [
    { value: "item1", text: "Item 1" },
    { value: "item2", text: "Item 2" }
  ],
  values: values.items,
  errorMessage: fieldErrors.items
}) }}
```

### Date input
```njk
{% from "govuk/components/date-input/macro.njk" import govukDateInput %}
{{ govukDateInput({
  id: "dob",
  namePrefix: "dob",
  fieldset: { legend: { text: "Date of birth", classes: "govuk-fieldset__legend--m" } },
  hint: { text: "For example, 27 3 2007" },
  errorMessage: fieldErrors.dob
}) }}
```

### Textarea
```njk
{% from "govuk/components/textarea/macro.njk" import govukTextarea %}
{{ govukTextarea({
  id: "description",
  name: "description",
  label: { text: "Description", classes: "govuk-label--m" },
  hint: { text: "Do not include personal or financial information" },
  rows: 5,
  value: values.description,
  errorMessage: fieldErrors.description
}) }}
```

### Error summary (always at top of page, before `<h1>`)
```njk
{% from "govuk/components/error-summary/macro.njk" import govukErrorSummary %}
{% if errorList | length %}
  {{ govukErrorSummary({
    titleText: "There is a problem",
    errorList: errorList
  }) }}
{% endif %}
```

### Summary list
```njk
{% from "govuk/components/summary-list/macro.njk" import govukSummaryList %}
{{ govukSummaryList({
  rows: [
    {
      key: { text: "Name" },
      value: { text: data.name },
      actions: { items: [{ href: "/name", text: "Change", visuallyHiddenText: "name" }] }
    }
  ]
}) }}
```

### Notification banner
```njk
{% from "govuk/components/notification-banner/macro.njk" import govukNotificationBanner %}
{{ govukNotificationBanner({ text: "Your application has been submitted." }) }}
```
Success variant: add `type: "success"`.

### Phase banner
```njk
{% from "govuk/components/phase-banner/macro.njk" import govukPhaseBanner %}
{{ govukPhaseBanner({
  tag: { text: "beta" },
  html: 'This is a new service – your <a class="govuk-link" href="/feedback">feedback</a> will help us to improve it.'
}) }}
```

### Back link
```njk
{% from "govuk/components/back-link/macro.njk" import govukBackLink %}
{{ govukBackLink({ text: "Back", href: "/previous-page" }) }}
```

### Panel (confirmation page)
```njk
{% from "govuk/components/panel/macro.njk" import govukPanel %}
{{ govukPanel({
  titleText: "Application complete",
  html: "Your reference number<br><strong>HDJ2123F</strong>"
}) }}
```

## References

- [GOV.UK Design System components](https://design-system.service.gov.uk/components/)
- [govuk-frontend Nunjucks macros](https://frontend.design-system.service.gov.uk/)
