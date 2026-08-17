# Component-to-HTML mapping table

Sidecar to `SKILL.md`. Maps GDS Design System patterns named in a page spec's
`## Components` section to the HTML class structure the preview should render.

Rows here use `govuk-frontend@6.1.0` class names. If you bump the version pin in
`SKILL.md`, re-verify these against the upstream component docs at
<https://design-system.service.gov.uk/components/>.

When the parser meets a component bullet that isn't in this table, the preview
renders an `inset-text` placeholder and the journal entry records the gap. Add
rows as needed.

## Inputs

### Radios

Single-select; one option per page-level branch.

Spec phrasing examples: `**Radios**`, `Radio buttons`, `Single-select`.

```html
<div class="govuk-form-group">
  <fieldset class="govuk-fieldset" aria-describedby="{{slug}}-hint">
    <legend class="govuk-fieldset__legend govuk-fieldset__legend--l">
      <h1 class="govuk-fieldset__heading">{{question}}</h1>
    </legend>
    <div id="{{slug}}-hint" class="govuk-hint">{{hint}}</div>
    <div class="govuk-radios" data-module="govuk-radios">
      <div class="govuk-radios__item">
        <input
          class="govuk-radios__input"
          id="{{slug}}-1"
          name="{{slug}}"
          type="radio"
          value="{{option-1-value}}"
        />
        <label class="govuk-label govuk-radios__label" for="{{slug}}-1">{{option-1-label}}</label>
      </div>
      <!-- repeat per option -->
    </div>
  </fieldset>
</div>
```

When the page is a single radio question, the `<h1>` moves inside the `<legend>`
per GDS guidance (the question is the heading). When there are multiple form
groups on one page, the `<h1>` is the page heading and each fieldset has its own
non-h1 legend.

### Checkboxes

Multi-select.

Spec phrasing: `**Checkboxes**`, `Multi-select`.

```html
<div class="govuk-form-group">
  <fieldset class="govuk-fieldset" aria-describedby="{{slug}}-hint">
    <legend class="govuk-fieldset__legend govuk-fieldset__legend--l">
      <h1 class="govuk-fieldset__heading">{{question}}</h1>
    </legend>
    <div id="{{slug}}-hint" class="govuk-hint">{{hint}}</div>
    <div class="govuk-checkboxes" data-module="govuk-checkboxes">
      <div class="govuk-checkboxes__item">
        <input
          class="govuk-checkboxes__input"
          id="{{slug}}-1"
          name="{{slug}}"
          type="checkbox"
          value="{{option-1-value}}"
        />
        <label class="govuk-label govuk-checkboxes__label" for="{{slug}}-1"
          >{{option-1-label}}</label
        >
      </div>
      <!-- repeat per option -->
    </div>
  </fieldset>
</div>
```

### Text input

Single-line free text.

Spec phrasing: `**Text input**`, `**Free-text input**`, `Text field`.

```html
<div class="govuk-form-group">
  <h1 class="govuk-label-wrapper">
    <label class="govuk-label govuk-label--l" for="{{slug}}">{{question}}</label>
  </h1>
  <div id="{{slug}}-hint" class="govuk-hint">{{hint}}</div>
  <input
    class="govuk-input"
    id="{{slug}}"
    name="{{slug}}"
    type="text"
    aria-describedby="{{slug}}-hint"
  />
</div>
```

For width constraints (postcodes, references, etc.), add `govuk-input--width-10`
or similar — use the modifier the spec asks for.

### Textarea

Multi-line free text.

Spec phrasing: `**Textarea**`, `**Multi-line text**`.

```html
<div class="govuk-form-group">
  <h1 class="govuk-label-wrapper">
    <label class="govuk-label govuk-label--l" for="{{slug}}">{{question}}</label>
  </h1>
  <div id="{{slug}}-hint" class="govuk-hint">{{hint}}</div>
  <textarea
    class="govuk-textarea"
    id="{{slug}}"
    name="{{slug}}"
    rows="5"
    aria-describedby="{{slug}}-hint"
  ></textarea>
</div>
```

### File upload

Single-file upload.

Spec phrasing: `**File upload**`.

```html
<div class="govuk-form-group">
  <h1 class="govuk-label-wrapper">
    <label class="govuk-label govuk-label--l" for="{{slug}}">{{question}}</label>
  </h1>
  <div id="{{slug}}-hint" class="govuk-hint">{{hint}}</div>
  <input
    class="govuk-file-upload"
    id="{{slug}}"
    name="{{slug}}"
    type="file"
    aria-describedby="{{slug}}-hint"
  />
</div>
```

v6 also ships a JS-enhanced variant (`<div class="govuk-drop-zone"
data-module="govuk-file-upload">` wrapping the input) for drag-and-drop. Not
used here — v1 renders without a JS pipeline.

Multi-upload (the "add another" loop) is a composition of multiple file inputs
plus an "Add another" button; that's outside the v1 mapping table. Render as a
placeholder and flag in the journal entry.

### Date input

Three-text-input day/month/year group.

Spec phrasing: `**Date input**`.

```html
<div class="govuk-form-group">
  <fieldset class="govuk-fieldset" role="group" aria-describedby="{{slug}}-hint">
    <legend class="govuk-fieldset__legend govuk-fieldset__legend--l">
      <h1 class="govuk-fieldset__heading">{{question}}</h1>
    </legend>
    <div id="{{slug}}-hint" class="govuk-hint">{{hint}}</div>
    <div class="govuk-date-input" id="{{slug}}">
      <div class="govuk-date-input__item">
        <div class="govuk-form-group">
          <label class="govuk-label govuk-date-input__label" for="{{slug}}-day">Day</label>
          <input
            class="govuk-input govuk-date-input__input govuk-input--width-2"
            id="{{slug}}-day"
            name="{{slug}}-day"
            type="text"
            inputmode="numeric"
          />
        </div>
      </div>
      <div class="govuk-date-input__item">
        <div class="govuk-form-group">
          <label class="govuk-label govuk-date-input__label" for="{{slug}}-month">Month</label>
          <input
            class="govuk-input govuk-date-input__input govuk-input--width-2"
            id="{{slug}}-month"
            name="{{slug}}-month"
            type="text"
            inputmode="numeric"
          />
        </div>
      </div>
      <div class="govuk-date-input__item">
        <div class="govuk-form-group">
          <label class="govuk-label govuk-date-input__label" for="{{slug}}-year">Year</label>
          <input
            class="govuk-input govuk-date-input__input govuk-input--width-4"
            id="{{slug}}-year"
            name="{{slug}}-year"
            type="text"
            inputmode="numeric"
          />
        </div>
      </div>
    </div>
  </fieldset>
</div>
```

### Select

Drop-down. Use sparingly — radios are usually better for ≤ 6 options.

Spec phrasing: `**Select**`, `Dropdown`.

```html
<div class="govuk-form-group">
  <h1 class="govuk-label-wrapper">
    <label class="govuk-label govuk-label--l" for="{{slug}}">{{question}}</label>
  </h1>
  <div id="{{slug}}-hint" class="govuk-hint">{{hint}}</div>
  <select class="govuk-select" id="{{slug}}" name="{{slug}}">
    <option value="">Choose an option</option>
    <option value="{{option-1-value}}">{{option-1-label}}</option>
    <!-- repeat per option -->
  </select>
</div>
```

## Non-input components

### Hint text

Standalone hint paragraph (when not attached to a specific input).

```html
<div class="govuk-hint">{{text}}</div>
```

### Warning text

Yellow exclamation; used for criminal-offence or financial warnings.

Spec phrasing: `**Warning text**`, `Warning box`.

```html
<div class="govuk-warning-text">
  <span class="govuk-warning-text__icon" aria-hidden="true">!</span>
  <strong class="govuk-warning-text__text">
    <span class="govuk-visually-hidden">Warning</span>
    {{text}}
  </strong>
</div>
```

### Inset text

Grey-bordered callout for important-but-not-warning content.

Spec phrasing: `**Inset text**`, `Callout`.

```html
<div class="govuk-inset-text">{{text}}</div>
```

### Details (disclosure)

Collapsible explanatory text. Used by the preview itself for "Designer notes —
open decisions" but also available to spec-page renders.

Spec phrasing: `**Details**`, `Disclosure`.

```html
<details class="govuk-details">
  <summary class="govuk-details__summary">
    <span class="govuk-details__summary-text">{{summary}}</span>
  </summary>
  <div class="govuk-details__text">{{body}}</div>
</details>
```

### Error summary

Top-of-page error block. v1 renders the Empty state so this isn't shown, but the
mapping is here for v2's state-switcher.

```html
<div class="govuk-error-summary" data-module="govuk-error-summary">
  <div role="alert">
    <h2 class="govuk-error-summary__title">There is a problem</h2>
    <div class="govuk-error-summary__body">
      <ul class="govuk-list govuk-error-summary__list">
        <li><a href="#{{slug}}">{{error-message}}</a></li>
      </ul>
    </div>
  </div>
</div>
```

## Buttons

The preview includes a default "Continue" button at the end of every form (see
`SKILL.md` chrome template). Don't add a separate button per component unless
the spec explicitly calls for a non-default action.

For non-default buttons (e.g. "Save and continue"):

```html
<button type="submit" class="govuk-button" data-module="govuk-button">{{label}}</button>
```

For secondary buttons:

```html
<button type="submit" class="govuk-button govuk-button--secondary" data-module="govuk-button">
  {{label}}
</button>
```
