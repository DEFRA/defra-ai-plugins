---
name: govuk-accessibility
description: Apply the accessibility patterns that the rest of the frontend-developer plugin does not already cover — manual testing methodology (keyboard, screen reader, 400% zoom, high contrast), focus management for dynamic updates, status announcements via aria-live, form autocomplete attributes, and information-conveyance rules (colour, link text, plain language). Use when adding interactivity beyond static GOV.UK forms, when triaging accessibility issues, or when running a manual accessibility check.
license: OGL-UK-3.0
---

# GOV.UK Accessibility — Beyond the Defaults

The frontend-developer agent prompt and the `pre-commit-review` skill already enforce the headline WCAG 2.2 AA baseline: semantic HTML, one `<h1>`, keyboard reachability with visible focus, labelled form fields, `govukErrorSummary`, 4.5:1 contrast, 320px reflow, `prefers-reduced-motion`, and `alt` text. **This skill does not repeat that material.**

Use this skill when:

- A page does more than render a static GOV.UK form (route changes, dynamic content, status updates, timeouts, lazy-loaded sections).
- A form needs the right `autocomplete` attribute on identity-related fields.
- You are running a manual accessibility check (keyboard-only, screen reader, 400% zoom, high contrast).
- A change touches information conveyance (colour, link text, content order, plain language).
- You need to triage an automated tool's report and decide what to do about it.

## Manual testing methodology

Automated tooling (axe, Lighthouse) catches roughly 30% of issues. The remaining 70% need a manual pass. Run all four checks below on every new or changed page before raising a pull request.

### 1. Keyboard-only walkthrough

- Unplug or ignore the mouse.
- Tab from the top of the page to the bottom. Every interactive element must be reachable in a logical order.
- Focus indicators must remain visible the entire time (do not rely on the browser default if the design overrides outline).
- Activate every control with `Enter` (links, buttons) and `Space` (buttons, checkboxes, radios within a group). Use arrow keys inside radio groups, tabs, and menus.
- There must be no keyboard trap: pressing `Tab` from anywhere must eventually reach the next landmark.
- Skip-link (`govukSkipLink`) must appear as the first interactive element and move focus to the main content area when activated.

### 2. Screen reader pass

- Use NVDA on Windows or VoiceOver on macOS (built-in, no install needed).
- Confirm the page title announces correctly on load.
- Walk the page with the screen reader's reading and form-navigation modes.
- Every form field's accessible name must read as the visible label plus any hint and error text.
- Status changes (form submission result, async load completion) must be announced via an `aria-live` region — see _Status announcements_ below.
- Headings, landmarks, and link lists (NVDA: `H`, `D`, `K`; VoiceOver rotor) must reflect the visible structure.

### 3. 400% zoom

- In a desktop browser, zoom to 400%.
- No content can be cut off, hidden, or require horizontal scrolling other than for data tables.
- All functionality must remain operable.
- This is a WCAG 2.2 AA requirement and stricter than the 320px reflow check already in `pre-commit-review` — both must pass.

### 4. High-contrast / forced-colours mode

- Windows: enable "Contrast themes" in Settings.
- macOS: enable "Increase contrast" in System Settings → Accessibility → Display.
- Borders, focus indicators, and icon meanings must remain visible (use `currentColor` for SVG strokes; do not rely on background colours alone for affordance).
- Test with `@media (forced-colors: active)` if custom styling depends on system colours.

## Focus management for dynamic updates

GOV.UK services normally use page navigation, not single-page-app routing. When dynamic updates are unavoidable, focus must be managed deliberately.

- **After a route change or full content swap:** move focus to the new page's `<h1>` (or `<main>` with `tabindex="-1"`) so screen-reader users do not silently stay on the previous context.
- **After opening a modal or details disclosure:** move focus into the newly revealed content; restore focus to the trigger when it closes.
- **After validation failure:** `govukErrorSummary` already handles this — move focus to the error summary container, which is in `pre-commit-review`. This skill adds: also set `aria-describedby` on each invalid field to link to its inline error message ID.
- **Never** call `.focus()` on something that scrolls the page silently and disorientingly — focus should follow user intent.

## Status announcements

Any change that happens without a full page load needs a live region for screen-reader users.

- Use `role="status"` (polite) for non-urgent updates: "Form saved", "5 results found".
- Use `role="alert"` (assertive, interrupts) only for genuine errors that demand immediate attention.
- The live region must already exist in the DOM at page load — do not inject the region and the message together; screen readers will not announce it.
- Empty the region before writing a new message so identical successive messages are re-announced.

```njk
<div id="status" role="status" aria-live="polite" class="govuk-visually-hidden"></div>
```

Loading states for asynchronous operations must be announced (e.g. "Loading results") and replaced with the result message when complete. Timeouts that affect the session must give an adequate warning with the option to extend.

## Form attributes the baseline does not cover

`govuk-form` covers labels, error summary, error messages, and Joi-driven error text. This skill adds:

- **`autocomplete` attribute on identity fields.** Set the WHATWG-defined value where it applies so users with autofill or password managers do not have to retype. Examples:
  - `name` → `name`
  - email → `email`
  - phone → `tel`
  - postal address → `street-address`, `address-line1`, `postal-code`, `country-name`
  - date of birth → `bday`
  - one-time code → `one-time-code`
- **`autocomplete="off"`** only when the field deliberately must not autofill (e.g. a fresh search box, a security-sensitive override). Do not use it on identity fields by default.
- **`inputmode`** to hint the on-screen keyboard: `numeric` for digits-only fields, `email` for email, `tel` for phone.
- **Required-field indication.** Use `aria-required="true"` on the input and surface "(optional)" on labels for optional fields — never the other way round. The GOV.UK pattern is to mark optional fields, not required ones.

## Information-conveyance rules

The baseline does not call these out explicitly:

- **Do not rely on colour alone.** Any state conveyed by colour (error, success, warning) must also have a text label, an icon, or a position cue.
- **Link text must make sense out of context.** "Read more" or "Click here" are unacceptable. Screen-reader users often jump between links — every link must describe its destination ("Read the {service} privacy notice").
- **Content order matches visual order.** Do not use CSS `order` or absolute positioning to reorder visually unless the DOM order remains logical for screen readers and keyboard users.
- **Landmarks are exclusive.** One `<main>`, one `<header role="banner">` at page level, one `<footer role="contentinfo">` at page level. Nested landmarks confuse screen-reader rotor navigation.
- **Plain language.** GOV.UK content style: short sentences, common words, active voice. Aim for reading age 9. Define necessary jargon on first use.

## Triaging an automated report

When axe or Lighthouse flags an issue:

1. Read the rule's full description — most rules have known false positives.
2. Check whether the rule is WCAG 2.2 AA or beyond. Beyond-AA issues are worth fixing but do not block merge.
3. If the violation is genuine, fix at the source: prefer changing the markup over adding ARIA, and prefer removing ARIA over adding more.
4. Re-run the keyboard and screen-reader checks after the fix — automated tools cannot verify the actual user experience.

## Legal and policy context

- Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018.
- Equality Act 2010.
- WCAG 2.2 Level AA is the contractual baseline for Defra digital services.

## References

- [GOV.UK Design System — accessibility](https://design-system.service.gov.uk/accessibility/)
- [GOV.UK Design System — patterns](https://design-system.service.gov.uk/patterns/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [WAI-ARIA Authoring Practices — live regions](https://www.w3.org/WAI/ARIA/apg/practices/live-regions/)
