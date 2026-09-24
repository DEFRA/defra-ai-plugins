---
name: gds-patterns
description: >-
  GOV.UK Design System patterns, offline — the tested way to build a page type or ask for a particular thing. Entry point for building any government service page: read the pattern first, then gds-components for the macro. Trigger on question page, check answers, confirmation page, start page, task list, validation, error recovery, cookie banner, and asking for an address, name, date of birth, email, phone number, NI number, bank or card details, password, or equality information.
license: OGL-UK-3.0
---

# GOV.UK Design System patterns

**This is the entry point for building anything in a government service.** Start here, then go to `gds-components` for the macro. Not the other way round.

Patterns are the part that reading component code can never give you. A component tells you what a text input can do. A pattern tells you that a name is one field and not three, that you ask for a date of birth with three separate inputs and never a date picker, and that "postcode" is a fixed-width input inside an address lookup flow.

This is not only about questions. 28 of the 37 components in the Design System are governed by a pattern — the confirmation panel, the check answers summary list, the task list, the error summary, the cookie banner, the service navigation. Reaching for the component first skips the research every time.

Most things a government service does have already been built, got wrong, and fixed. Reinventing one is how services fail assessments.

## How to use this skill

Open [references/_index.md](references/_index.md) — 35 patterns with aliases, so "protected characteristics", "2FA" and "404" resolve. Then read the pattern file, which carries the full guidance and every coded example.

## Find the pattern by what you are building

**By page type** — what is this page for?

| Building                              | Pattern                                                                                                                                                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A page that asks something            | [question-pages.md](references/question-pages.md)                                                                                                                                                                         |
| The summary before submitting         | [check-answers.md](references/check-answers.md)                                                                                                                                                                           |
| The page after submitting             | [confirmation-pages.md](references/confirmation-pages.md)                                                                                                                                                                 |
| The entry point on GOV.UK             | [start-using-a-service.md](references/start-using-a-service.md)                                                                                                                                                           |
| A list of tasks to complete           | [task-list-pages.md](references/task-list-pages.md), [complete-multiple-tasks.md](references/complete-multiple-tasks.md)                                                                                                  |
| Eligibility before starting           | [check-a-service-is-suitable.md](references/check-a-service-is-suitable.md)                                                                                                                                               |
| Headers, nav, knowing where you are   | [navigate-a-service.md](references/navigate-a-service.md)                                                                                                                                                                 |
| Error recovery on a form              | [validation.md](references/validation.md)                                                                                                                                                                                 |
| Pausing to give important information | [interruption-pages.md](references/interruption-pages.md)                                                                                                                                                                 |
| 404, 500, service unavailable         | [page-not-found-pages.md](references/page-not-found-pages.md), [problem-with-the-service-pages.md](references/problem-with-the-service-pages.md), [service-unavailable-pages.md](references/service-unavailable-pages.md) |
| Cookie consent                        | [cookies-page.md](references/cookies-page.md)                                                                                                                                                                             |

**By what you are asking for** — see the table further down.

## The three that apply to almost every page

Read these before anything else if you are building a journey.

- **[references/question-pages.md](references/question-pages.md)** — one thing per page, back link, page heading, continue button. Label or legend as the `<h1>`. Never mark mandatory fields with asterisks; mark optional ones "(optional)".
- **[references/validation.md](references/validation.md)** — how error recovery works end to end: the error summary, the inline message, the page title prefix, and the wording.
- **[references/check-answers.md](references/check-answers.md)** — the summary page before submission, with a "Change" link per row carrying visually hidden text.

## Find the pattern by what you are asking for

Match on what you are asking for, not on the component you had in mind:

| You need to ask for        | Pattern                                                                                                      | The thing people get wrong                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| A person's name            | [names.md](references/names.md)                                                                              | Splitting into title/first/middle/last when one field would do |
| An address                 | [addresses.md](references/addresses.md)                                                                      | Hand-rolling a postcode lookup                                 |
| A date                     | [dates.md](references/dates.md)                                                                              | Reaching for a date picker                                     |
| A date of birth            | [dates.md](references/dates.md)                                                                              | Not using three separate inputs with `autocomplete`            |
| An email address           | [email-addresses.md](references/email-addresses.md)                                                          | Asking twice to confirm                                        |
| A phone number             | [phone-numbers.md](references/phone-numbers.md)                                                              | `type="number"`, and rejecting spaces                          |
| Ethnicity, sex, disability | [equality-information.md](references/equality-information.md)                                                | Asking at all without a clear need, and no "prefer not to say" |
| Bank or card details       | [bank-details.md](references/bank-details.md), [payment-card-details.md](references/payment-card-details.md) | Splitting the card number into four boxes                      |

## How closely to follow a pattern

Patterns are calibrated for the general public using a service once or twice, under stress, on a phone, often for something that matters. That is the default assumption, and where it holds the pattern wins.

Work out which of three cases you are in.

**It fits.** Follow it. Do not improve on it.

**It partly fits.** Adapt the existing pattern before you consider a new one — a modified check answers page is a far safer bet than an invented summary screen. Say plainly what you changed and why.

**The cost of diverging is user research**, and that cost is the thing to surface, not hide. A pattern carries years of testing you get for free; the moment you leave it you have taken on the obligation to prove the change works, with real people, including disabled people. That is time and budget. It is a legitimate decision — it is not a decision to make silently. Flag it, and record it in a [design history](https://digital.defra.gov.uk/content/sharing-designs-recording-decisions).

**It does not fit at all.** See the next section.

### Internal and staff-facing services

Patterns are not a straitjacket for services used by trained people, many times a day. The Design System says so itself:

- One thing per page is relaxable. On question pages: _"User research will tell you when you can group pages together. For example, if you're designing an internal service for government users who need to repeat and switch between tasks quickly."_
- Density components exist for exactly this. Small radios and small checkboxes _"can work well on information dense screens in services designed for repeat use, like caseworking systems"_. Tabs and accordions likewise, where _"their need to perform tasks quickly may be greater than their need for simplicity of first-time use"_.

So for a caseworking or admin system, expect to group questions onto one page, use denser controls, and keep a repeat user's speed ahead of a first-timer's simplicity. Base it on research with the actual users, not on an assumption that internal means it matters less.

**What does not relax, ever:**

- **WCAG 2.2 AA.** It applies to public, specialist and staff-facing services alike, on GOV.UK domains and off them. It is a legal duty. Staff are disabled at the same rate as everybody else, and a staff member cannot choose another service.
- **The component library.** Adapting how components are composed is not licence to hand-roll markup. You still use GOV.UK Frontend components, and you still get their accessibility behaviour.
- **The branding rules.** A service not on GOV.UK must not present itself as GOV.UK — use the `generic-header` component, not the crown, the GOV.UK logotype, GDS Transport or the GOV.UK brand colours.

## When there is no pattern

Not finding a pattern is a decision point, not a licence to invent one.

**If an existing component covers it, build it.** The nine presentational components listed in `gds-components` — `accordion`, `tabs`, `warning-text` and the rest — need no pattern and no permission.

**If neither a pattern nor a component covers it, stop and ask the person you are working with.** Designing a new pattern is not an agent's decision to make. GDS and Defra both require that anything new is useful and unique, and that check runs through people. Before you escalate, do the work:

1. Search [references/_index.md](references/_index.md) again including the aliases column — most "missing" patterns are filed under a name you did not think of.
2. Check the [Design System backlog](https://github.com/alphagov/govuk-design-system-backlog/issues); it may already be in progress.
3. Check other departments in the [gov-design-systems-list](https://github.com/ctdesign/gov-design-systems-list).
4. Then ask. At Defra that means DesignOps.

Give the person something to react to, not an open question:

- what the service actually needs to do
- what you searched for, and which patterns came closest and why they do not fit
- the option you would choose, and what the risk is
- whether this is a public or an internal service, because it changes the answer

That last point matters. A caseworking tool doing something the Design System has no pattern for is unremarkable — the Design System is largely built for public services, and internal tools routinely need screens it never contemplated. The same gap on a public journey is a much stronger signal that the pattern exists and has been missed. Either way the research obligation stands: something new has to be tested with real users before it is trusted.

**Never quietly invent an interaction and present it as though it were standard.** A plausible-looking non-standard pattern is worse than an obvious gap: it passes review, ships, and then fails a service assessment.

## Related skills

- **`gds-components`** — **read before writing the macro call.** A pattern names the component and shows an example, but not its full options. Do not guess a signature from the example.
- **`gds-journey-builder`** — stringing these pages into a journey that works end to end.
- **`gds-prototype-kit`** — building the pages so they run.
- **`defra-service-designer`** — deciding what the journey should be before you design any page in it.
- **`defra-doc-style`** and **`defra-interaction-content-designer`** — the words in the questions, hints and errors.
