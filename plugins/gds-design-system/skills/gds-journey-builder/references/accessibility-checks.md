# Accessibility checks on generated markup

Checks you can run yourself against markup you just produced, by reading it. They catch the failures that come from assembling components wrongly.

This is not the whole accessibility duty. Automated tools, manual testing with real assistive technology, and a professional audit before public beta are all still required — `defra-interaction-content-designer` covers that process. What follows is the part an agent can actually verify at the point of writing.

## Run these on every page you generate

**Headings**

- [ ] Exactly one `<h1>`.
- [ ] On a single-question page, the `<h1>` _is_ the label or legend (`isPageHeading: true`), not a separate heading repeating the question.
- [ ] Heading levels do not skip: no `<h3>` without an `<h2>` above it.
- [ ] The page heading is different from every other page's heading in the journey.

**Labels and inputs**

- [ ] Every input has a label. Not a placeholder, not an `aria-label` standing in for one.
- [ ] Labels came from the component's `label` option, so `for` and `id` match.
- [ ] Hint text came from the `hint` option, so it is in `aria-describedby`.
- [ ] Related inputs (date parts, address lines, a radio group) are inside a `fieldset` with a `legend`.
- [ ] Anything asking for the person's own details has an `autocomplete` value. This is WCAG 2.2 AA 1.3.5, not optional.
- [ ] No placeholder text used as a label, hint or example.

**Errors**

- [ ] Error summary present whenever there is any error, even one.
- [ ] Every summary `href` matches a real `id` on the page.
- [ ] Summary text and inline text are character-for-character identical.
- [ ] Page title prefixed "Error: ".
- [ ] Summary items in the same order as the fields.

**Links and buttons**

- [ ] Link text makes sense read on its own. No "click here", "read more", "this page".
- [ ] Repeated link text (Change, Remove) carries `visuallyHiddenText` naming what it acts on.
- [ ] Buttons that submit are `<button>`, not links styled as buttons. Links that navigate are `<a>`, not buttons.
- [ ] Only one primary button per page.

**Structure**

- [ ] Content is inside the page template's `content` block, so the skip link, `<main>` and landmarks come from the template.
- [ ] The back link is in `beforeContent`, above `<main>`.
- [ ] Back link and breadcrumbs are not both on the same page.
- [ ] Tables use `<th scope="...">` and have a caption. The `govukTable` macro does this if you use `head` and `caption`.

**Content**

- [ ] Sentence case for headings, labels, buttons and hints. No trailing colons on labels.
- [ ] No colour used as the only way of conveying something.
- [ ] Any essential information in a chart or map is also available as text or a table.

## The failures that keep recurring

Worth checking specifically, because they look correct in a browser:

1. **Hand-written label or error HTML** next to a macro call, instead of the component's `label` / `errorMessage` options. Looks identical, breaks `aria-describedby`.
2. **`aria-label` used to patch a missing or unclear label.** Fix the visible label instead.
3. **A `<div>` with a click handler** where a `<button>` belongs. Not focusable, not announced, not keyboard operable.
4. **Summary `href` pointing at the `name` rather than the `id`.** They differ whenever `id` is set explicitly.
5. **Two pages sharing a heading**, usually "Your details", which makes the browser history and screen reader page list useless.
6. **A date picker for a date of birth.** Three inputs, per the dates pattern.
7. **`type="number"` for a phone number or reference.** It rejects spaces and shows spinners. Use `type="text"` with `inputmode`.

## Then run the real tests

Reading markup cannot find contrast failures, focus order problems, zoom reflow or how a screen reader actually behaves. Automated tooling (Axe, WAVE, Lighthouse, Pa11y), manual keyboard and screen reader testing, and an audit before public beta all still apply.
