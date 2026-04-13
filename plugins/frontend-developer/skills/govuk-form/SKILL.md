---
name: govuk-form
description: Scaffold a complete GOV.UK form page for a Defra Hapi service. Use when building a new form page with user input — generates the Nunjucks template with govukErrorSummary and field macros, a Joi validation schema with custom error messages, and a Hapi route handler with GET and POST methods following the GDS error pattern.
license: OGL-UK-3.0
---

# GOV.UK Form Scaffold

Scaffold a complete, standards-compliant GOV.UK form page. Read the requirement or existing code to determine what fields are needed and their types, then generate all artefacts together.

## What to generate

### 1. Nunjucks template (`app/views/<name>.njk`)

- Extend the project base layout
- Import and call `govukErrorSummary` at the top of `<main>`, before the `<h1>` — only render when `errorList` has items:
  ```njk
  {% from "govuk/components/error-summary/macro.njk" import govukErrorSummary %}
  {% if errorList | length %}
    {{ govukErrorSummary({ titleText: "There is a problem", errorList: errorList }) }}
  {% endif %}
  ```
- For each field, import and call the appropriate macro with `value: values.<name>` and `errorMessage: fieldErrors.<name>`:
  - Short text → `govukInput`
  - Long text → `govukTextarea`
  - Single choice → `govukRadios` with `fieldset.legend`
  - Multiple choice → `govukCheckboxes` with `fieldset.legend`
  - Date → `govukDateInput` with `namePrefix` and `fieldset.legend`
  - File → `govukFileUpload`
- End with `govukButton({ text: "Continue" })`
- Include the CSRF hidden input: `{{ crumb }}`

### 2. Joi validation schema (`app/schemas/<name>.schema.js`)

- Export a named const `<name>Schema = joi.object({ ... })`
- One rule per field; call `.messages()` with user-facing strings for every error key:
  - `'any.required'` / `'string.empty'` → `"Enter [what the field is]"`
  - `'string.max'` → `"[Field] must be [n] characters or less"`
  - `'string.email'` → `"Enter an email address in the correct format, like name@example.com"`
  - `'number.base'` → `"Enter a number"`
  - `'date.base'` → `"Enter a real date"`
- Use `{ abortEarly: false }` at call sites so all errors surface at once

### 3. Hapi route handler (`app/routes/<name>.js`)

- Export a named array `<name>Routes` containing two route objects
- `GET /path` — render view with empty state: `{ errorList: [], fieldErrors: {}, values: {} }`
- `POST /path`:
  1. Validate `request.payload` against the schema with `{ abortEarly: false }`
  2. On validation error: map `error.details` and re-render the view
  3. On success: redirect to the next page

### 4. Error mapper (inline in route, or `app/helpers/form-errors.js` if shared)

```js
/**
 * @param {import('@hapi/joi').ValidationError} error
 * @returns {{ errorList: Array<{text: string, href: string}>, fieldErrors: Record<string, {text: string}> }}
 */
export function mapValidationErrors(error) {
  const errorList = []
  const fieldErrors = {}
  for (const detail of error.details) {
    const field = String(detail.path[0])
    const text = detail.message
    if (!fieldErrors[field]) {
      errorList.push({ text, href: `#${field}` })
      fieldErrors[field] = { text }
    }
  }
  return { errorList, fieldErrors }
}
```

## Field type quick reference

| Input           | Macro             | Key props                                                                |
| --------------- | ----------------- | ------------------------------------------------------------------------ |
| Short text      | `govukInput`      | `id`, `name`, `label`, `hint`, `value`, `errorMessage`                   |
| Long text       | `govukTextarea`   | `id`, `name`, `label`, `rows`, `value`, `errorMessage`                   |
| Single choice   | `govukRadios`     | `idPrefix`, `name`, `fieldset.legend`, `items`, `value`, `errorMessage`  |
| Multiple choice | `govukCheckboxes` | `idPrefix`, `name`, `fieldset.legend`, `items`, `values`, `errorMessage` |
| Date            | `govukDateInput`  | `id`, `namePrefix`, `fieldset.legend`, `hint`, `items`, `errorMessage`   |
| File            | `govukFileUpload` | `id`, `name`, `label`, `errorMessage`                                    |

## References

- [GOV.UK Error Summary component](https://design-system.service.gov.uk/components/error-summary/)
- [GOV.UK Error Message component](https://design-system.service.gov.uk/components/error-message/)
- [GOV.UK Validation pattern](https://design-system.service.gov.uk/patterns/validation/)
- [Joi API](https://joi.dev/api/)
