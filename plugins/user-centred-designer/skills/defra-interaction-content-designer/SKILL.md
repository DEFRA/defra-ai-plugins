---
name: defra-interaction-content-designer
description: >-
  Interaction and content design for Defra services, including frontends on the Core Delivery Platform (CDP). Use when designing a service frontend, writing interface copy, building a prototype for research, choosing a component or pattern, writing error messages or a copy deck, or getting a change live. Trigger on 'prototype', 'GOV.UK Design System', 'question page', 'error message', 'copy deck', 'accessibility', 'deploy to CDP', 'pull request'. Covers Defra tech constraints and the deploy loop.
license: OGL-UK-3.0
---

# Defra interaction and content designer

Designing and building the thing people actually use, at Defra. Covers prototypes for research, real frontends on the Core Delivery Platform (CDP), the copy that goes in them, and the accessibility duties that are not optional. Works alongside `defra-doc-style` for writing and visual standards and `defra-service-designer` for mapping the service before you build any of it.

Two governing sources: the [Defra service manual](https://digital.defra.gov.uk/service-manual) and the [GOV.UK service manual](https://www.gov.uk/service-manual). Defra adds to GOV.UK, it does not replace it.

## The rules that are not negotiable

- **WCAG 2.2 level AA.** [Defra applies this to every service with a human interface](https://digital.defra.gov.uk/accessibility): public, specialist and staff-facing, on GOV.UK domains and off them. The only exemptions are pure backends and command line or IDE tools. If unsure, assume you must comply. It is a legal duty, not a preference.
- **Technology is restricted.** Per [architecture and software development](https://digital.defra.gov.uk/architecture-and-software-development): use Node.js with the Hapi framework for frontend and backend services. Only consider .NET or Python where Node.js is not suitable. **Use GOV.UK Frontend Nunjucks templates. Do not use other frontend frameworks like Vue or React.** Use vanilla JavaScript. Anything else goes through the Defra Tools Radar on Jira. The [Defra software development standards](https://defra.github.io/software-development-standards/) are mandatory requirements with exceptions handled through governance.
- **Code in the open** from the start, in the [Defra GitHub organisation](https://github.com/DEFRA).
- **Check the Design System before you design anything new.** [All patterns must be useful and unique.](https://digital.defra.gov.uk/design/components-and-patterns)
- **Never copy prototype code into production.** The Prototype Kit has neither the security nor the performance features for a live service.

## Prototyping

Prototypes exist to make sure you are building the right thing, to give the team a shared understanding, and to explore ideas faster and at lower risk than production code.

- Sketches for exploring ideas with colleagues. Code prototypes for user research, because they are more realistic.
- Use the current version of the [GOV.UK Prototype Kit](https://prototype-kit.service.gov.uk/docs/), and take component code from the current Design System rather than copying from old prototypes. Old prototype code will not display correctly.
- **You cannot run the Prototype Kit on a Defra supplied laptop.** For security reasons you need a different machine. You will not need VPN or SSH keys. This is the single most common blocker for a new designer at Defra.
- Hosting: GitHub for version control, Heroku for publishing. Request a Defra Design GitHub repository and a Heroku app through DesignOps@defra.gov.uk or Slack `#prototype-kit-support`. The Defra Design team does not give Heroku access to team members directly.
- **Password protect every published prototype** so the public cannot find it and mistake it for a real service.
- At alpha, prototype only enough to test your riskiest assumptions. Alpha services stay closed to the public.
- Other tools: Mural for whiteboarding and low fidelity, where Defra has an enterprise licence. Figma for low to medium fidelity, exported to the team or the Defra Figma instance when an assignment ends.

## Components and patterns

Check the [GOV.UK Design System](https://design-system.service.gov.uk/) before designing anything new. If what you need is not there, check its backlog, then other departments via the `gov-design-systems-list` GitHub repository, then ask DesignOps@defra.gov.uk before inventing.

Defra does not publish its own component library. It does provide [Defra Forms](https://digital.defra.gov.uk/architecture-and-software-development/defra-forms) for accessible GOV.UK-styled forms, [Defra Interactive Map](https://defra.github.io/interactive-map/) for accessible mapping, which is in alpha, so expect breaking changes, and [Defra Customer Identity](https://digital.defra.gov.uk/architecture-and-software-development/defra-customer-identity) for external sign-in via GOV.UK One Login and Government Gateway.

### The patterns you will use most

- **[Question pages](https://design-system.service.gov.uk/patterns/question-pages/).** One thing per page. Know why you are asking every question and only ask for information you really need. Page headings relate specifically to the question on that page, and are never repeated across pages. Mark optional fields "(optional)"; **never mark mandatory fields with asterisks**. The button says "Continue", not "Next", left aligned. Every question page needs a back link, a page heading and a continue button.
- **[Error summary](https://design-system.service.gov.uk/components/error-summary/).** Always show one when there is a validation error, even if there is only one error. Put it at the top of the main container, below any back link, above the `<h1>`. Link to the field in error. Prefix the page title with "Error: ". The summary text must match the inline message exactly.
- **[Error message](https://design-system.service.gov.uk/components/error-message/).** Red, after the question and hint text, with a red left border, and a visually hidden "Error:" before it. Be specific: "Enter your first name", not "This field is required".
- **[Back link](https://design-system.service.gov.uk/components/back-link/).** Always on question pages, at the top of the page before `<main>`, working without JavaScript. Never together with breadcrumbs.
- **[Check answers](https://design-system.service.gov.uk/patterns/check-answers/).** Before the confirmation screen, with a "Change" link per section carrying hidden text for screen readers.
- **[Service navigation](https://design-system.service.gov.uk/components/service-navigation/)** alongside the GOV.UK header, so people know which service they are in.
- **[Page template](https://design-system.service.gov.uk/styles/page-template/).** Use the Nunjucks version rather than copying HTML, so you get updates.

## Content design

The standards stack is the [GOV.UK A to Z style guide](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/) plus the [Defra style guide](https://digital.defra.gov.uk/content/defra-style-guide) for terminology. The full list is on [Defra content design](https://digital.defra.gov.uk/content).

### Writing for interfaces

From [writing for user interfaces](https://www.gov.uk/service-manual/design/writing-for-user-interfaces):

- One `<h1>` per page, describing what the page does.
- Headings and input labels are sentence case and not punctuated.
- There is usually no need to say "please" or "please note". Say "sorry" only if something serious has gone wrong. Do not use it in routine validation errors, where the Error message component lists it among words to avoid.
- "Wrong password", not "You have entered the wrong password".
- Link purpose must be clear from the link text alone.
- Start with simple questions and only add help text if research shows you need it.
- **"If people do not notice your copy, you're probably doing it right. Aim to be boring."**

Error message language to avoid: technical jargon, "forbidden", "illegal", "prohibited", "you forgot", "please" (it implies a choice), "sorry" (it does not fix anything), "valid" and "invalid" (they add nothing), and informal language like "oops".

### Plain English and Defra terms

The `defra-doc-style` skill carries the full writing rules and is the single source for them. The ones that bite hardest in an interface: say **"people", not "users"**, per the Defra style guide. Short words: "buy" not "purchase", "help" not "assist". Never leverage, robust, streamline or utilise. Say what actually happens. No em dashes, sentence case everywhere, acronyms expanded on first use. Check the [Defra style guide](https://digital.defra.gov.uk/content/defra-style-guide) before inventing a term, and submit new terms through the form on that page.

### Copy decks and deliverables

A [copy deck](https://digital.defra.gov.uk/content/working-in-alpha) is a single document containing everything a developer needs to code a page: headings, body, hint text, button labels, metadata and error messages. Word, spreadsheet or Confluence is fine. Write error and validation messages jointly with the interaction designer, and make sure developers use the final versions rather than placeholder text.

Run content critiques. Keep a service-specific style guide and glossary capturing the difference between the language people use and internal terminology.

### Legal and Welsh content

Terms and conditions, the privacy notice, the accessibility statement and the cookies policy each have a phase deadline and a reviewer. Follow [legal content](https://digital.defra.gov.uk/content/legal-content) for the gates, and [Welsh language translation](https://digital.defra.gov.uk/content/welsh-language-translation) if the service offers Welsh: everything needs translating, including hint text, error messages and screen reader hidden text.

Public-facing services must have a start page hosted on GOV.UK.

## Accessibility

- WCAG 2.2 AA, for public, specialist and staff services.
- **[Test three ways](https://digital.defra.gov.uk/accessibility/test-for-accessibility): automated tools, manual checks and a professional audit.** Each finds different issues and you need all three. Test during development, not only before launch.
- Automated: Axe DevTools, WAVE, Lighthouse, Pa11y. Defra has bookmarklet-based testing for restricted devices at [defra-design.github.io/accessibility](https://defra-design.github.io/accessibility/).
- Manual: keyboard navigation, screen readers, focus visibility, mouse-free access, zoom to 200%.
- **Defra staff assistive technologies you must work with:** Dragon, Read and Write, ZoomText, JAWS, Microsoft Windows Voice Access, Magnifier and Narrator. Public services follow the GDS list.
- **A professional audit is needed before public beta.** Book it early through the Defra accessibility team; costs and timings are in the [service manual](https://digital.defra.gov.uk/accessibility/test-for-accessibility).
- Test with disabled and older people. Automated testing alone is not enough, and a lack of complaints does not mean a service is accessible.

## Data visualisation

Defra adds hard rules here. All essential geographic information must be available in a non-visual format such as text or a list. All essential chart data must be available as text or a table. Maps and charts are visual enhancements for people who choose to use them. **Only use interactive maps when there is a clear user need.**

## Cookies

Design the consent journey so people can use the service without consenting, and withdraw consent as easily as they gave it. The retention and storage rules are in [Defra's cookies guidance](https://digital.defra.gov.uk/design/cookies).

## Building on the Core Delivery Platform

CDP is Defra's internal developer platform. Teams build, deploy, test and monitor services on it without depending on separate infrastructure teams. Read the [onboarding considerations, architectural overview and how-to documentation](https://portal.cdp-int.defra.cloud/documentation) before adopting it. Portal access needs a Defra device or the VPN. Support is in `#cdp-support`.

Service creation, templates, data stores and the Bedrock guardrail presets are documented in the [CDP portal documentation](https://portal.cdp-int.defra.cloud/documentation), which needs a Defra device or the VPN. Two facts that shape design work: frontends on CDP are Node.js with GOV.UK Frontend Nunjucks templates, and AI services run behind mandatory Bedrock guardrails.

### The build and deploy loop

1. Work on a branch.
2. Open a pull request. Someone reviews it. This is the closest thing the code has to a design crit, so use it.
3. Merge to main. **Merging is the deployment.** CDP watches GitHub and builds and deploys on its own. There is no separate step and no ticket.
4. Check the change on the environment. Confirm which environment is safe before pointing a research participant at a link.

Interface copy usually sits in files you can edit directly in GitHub in your browser, so a content designer can change wording and open a pull request without a developer and without installing anything. Ask to be shown this once.

Analyse code with [Defra SonarQube Cloud](https://sonarcloud.io/organizations/defra) and follow the [README standards](https://defra.github.io/software-development-standards/standards/readme_standards/). Keep architecture decision records.

**Before you commit anything**, check that no personal data has reached generated mockups, test fixtures, configuration files or connection strings. If it has, remove it, do not commit the file, and follow [report an AI incident](https://digital.defra.gov.uk/ai-toolkit/guidance/report-an-ai-incident).

## Designing an AI feature

If the service uses a language model, everything sits under the [AI digital toolkit](https://digital.defra.gov.uk/ai-toolkit): run the triage, check the tools radar, and follow the data rules before you start. The list below is the AICE house pattern drawn from the AI Playbook and the GOV.UK Chat work, not a published Defra standard, so check it against the toolkit as that grows:

- Label AI-generated content clearly.
- Include a "check this answer" step. Never give the system a human persona.
- Quote rules with compliance consequences verbatim, or render them from structured data. Never let the model paraphrase a rule. Generate around the rule, never the rule.
- Offer transcript download.
- Scope whether an Algorithmic Transparency Recording Standard (ATRS) record is needed.
- Timed in-chat onboarding rather than a wall of instructions.
- Screen reader announcements at message level. Buffer streaming rather than announcing every token.
- The GOV.UK Chat frontend components are MIT licensed and can be reused. Assistant answers are unboxed in that pattern; only the person's own message gets a card. Box almost nothing, because noise inside a mock reads as misalignment.

## Recording decisions

Keep a [design history](https://digital.defra.gov.uk/design/tools): what changed, what the research found, why the decision went the way it did. Save previous iterations, especially anything tested with people, with consistent naming.

## Final checklist

- [ ] Component or pattern checked against the GOV.UK Design System first
- [ ] Node.js, Hapi and GOV.UK Frontend Nunjucks, no other frontend framework
- [ ] One thing per page, back link present, error summary always shown on validation failure
- [ ] Error messages specific, no "please", "sorry", "valid" or "invalid"
- [ ] Plain English, sentence case, no em dashes, "people" not "users"
- [ ] Copy deck complete, developers using final strings not placeholders
- [ ] Keyboard, screen reader, focus, zoom to 200% all checked manually as well as automatically
- [ ] Essential map and chart information available as text
- [ ] Prototype password protected, and no prototype code copied into production
- [ ] No personal data in the repository, in mockups or in test fixtures
- [ ] Design history and decisions updated
