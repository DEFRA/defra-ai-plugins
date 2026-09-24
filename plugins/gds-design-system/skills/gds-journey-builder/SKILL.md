---
name: gds-journey-builder
description: >-
  Assembling GOV.UK components and patterns into a complete, working user journey. Use when building or reviewing a multi-page government service flow rather than a single page. Trigger on user journey, build a service, multi-page form, end to end flow, wire up validation, error summary, check answers page, confirmation page, and reviewing generated GOV.UK markup for accessibility. Routes to gds-patterns, gds-components and gds-prototype-kit in the right order.
license: OGL-UK-3.0
---

# Building a GOV.UK user journey

Start here when the task is a journey rather than a page. Individual pages can each be correct while the journey between them is wrong, and that is what fails service assessments.

## Work in this order

**You MUST work in this order.** Doing it out of order is what produces a journey that looks right and tests badly — and the reordering people reach for, picking components before patterns, is precisely the one that fails.

1. **Know what you are asking and why.** Every question needs a reason it exists. If you cannot say what happens differently based on the answer, cut the question. `defra-service-designer` covers the mapping if the journey is not yet decided.
2. **Pick the patterns, not the components.** For each page and each question, find the pattern in `gds-patterns` — page types and questions both have researched answers. Only then does the component follow. If a step in the journey has no pattern and no component, stop and ask rather than inventing one; `gds-patterns` has the escalation.
3. **Sketch the page list and the branches** before writing any template. See [references/journey-skeleton.md](references/journey-skeleton.md).
4. **Write the pages.** `gds-components` for the macro, `gds-prototype-kit` for the layout, route and data.
5. **Wire validation last, but always wire it.** See [references/validation-and-errors.md](references/validation-and-errors.md). A journey with no error states is not finished.
6. **Run the checks** in [references/accessibility-checks.md](references/accessibility-checks.md) against what you produced.

## The journey skeleton

Almost every government transaction is the same shape:

```
Start page (on GOV.UK)
  └─ Question page  ─┐
     Question page   ├─ one thing per page, back link, Continue
     Question page  ─┘
       └─ Check your answers      every answer, each with a Change link
            └─ Confirmation       green panel, reference number, what happens next
```

Read [references/journey-skeleton.md](references/journey-skeleton.md) for what each page must contain and the rules that hold between pages.

## The rules that live between pages, not on them

These are invisible when you review a single page, and they are where journeys break.

- **Ask for each piece of information once.** If you need it twice, pre-populate it or offer the earlier answer as a choice.
- **Every page heading is different**, and describes that page's question — not the section it belongs to. Use `govuk-caption-l` for the section.
- **Back must go back to the page the person last saw, in the state they left it.** That means every input reads its value from stored data, not just on error.
- **A Change link on check answers returns to that question, then comes back to check answers** — not onward through the rest of the journey.
- **Do not break the browser back button.** The exception is after an action that must only happen once, like a payment: the button should still work, but show a sensible message rather than let it happen twice.
- **The URL for each page is a real, meaningful path.** Not `/page1`, `/page2`.

## Related skills

This skill is the orchestrator. It does not carry the component, pattern or kit detail itself — **read the skill named in each step rather than working from memory of it.** Guessing a macro signature or a pattern's rules is the failure this plugin exists to prevent.

| Question                           | Skill                                | When                                             |
| ---------------------------------- | ------------------------------------ | ------------------------------------------------ |
| What should this service be?       | `defra-service-designer`             | Before step 1, if the journey is not yet decided |
| Which pattern for this question?   | `gds-patterns`                       | **Required**, step 2, for every question         |
| Which component, and what options? | `gds-components`                     | **Required**, step 4, for every component        |
| How do I make it run?              | `gds-prototype-kit`                  | **Required**, step 4, before writing any page    |
| How should the words read?         | `defra-doc-style`                    | Whenever writing labels, hints or errors         |
| Defra constraints, deploy, audit   | `defra-interaction-content-designer` | Before anything ships                            |
