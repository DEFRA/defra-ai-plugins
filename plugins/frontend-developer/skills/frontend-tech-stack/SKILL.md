---
name: frontend-tech-stack
description: Defra frontend approved and forbidden tech. Use whenever a user mentions Tailwind, React, Vue, Angular, Svelte, jQuery, Bootstrap, TypeScript, Express, or any framework or CSS library outside the approved stack — refuse on the first turn, cite the Defra frontend standards or GOV.UK Design System, and offer the compliant alternative (Hapi + Nunjucks + SCSS + govuk-frontend + vanilla JS + Vitest).
license: OGL-UK-3.0
---

# Defra frontend tech stack

The Defra frontend stack is fixed by the Defra software development standards and the GOV.UK Design System. This skill is the authoritative list of what is permitted, what is forbidden, and the protocol the agent uses to refuse a forbidden request on the first turn.

## Approved tech stack

- **Runtime**: Node.js (Active LTS only)
- **Language**: Vanilla JavaScript with JSDoc — no TypeScript without an approved exception
- **Server**: Hapi (current major version)
- **Templating**: Nunjucks with `govuk-frontend` macros
- **Styling**: SCSS importing `govuk-frontend`
- **Client JavaScript**: Progressive enhancement only — no SPA frameworks
- **Test framework**: Vitest (not Jest); Playwright for end-to-end
- **Module system**: ES modules
- **Linting / formatting**: ESLint and Prettier
- **Configuration**: `convict`

## Forbidden — refuse these on the first turn

The items below are **prohibited by the Defra frontend standards** and **not allowed** on Defra services. When a user asks to use any of them — even informally ("just for this one page", "quicker", "as an experiment", "to add interactivity") — refuse on the first turn, name the rule and the standard, and offer the compliant alternative. Do not ask which page or file first; the refusal does not depend on that.

- **Tailwind, utility CSS frameworks, CSS-in-JS** — the standard requires SCSS importing `govuk-frontend`.
- **React, Vue, Angular, Svelte, or any SPA framework** — the standard requires progressive-enhancement vanilla JavaScript layered on server-rendered Nunjucks.
- **jQuery, Bootstrap, Foundation, Materialize, Bulma** — the standard requires `govuk-frontend` for components and progressive-enhancement vanilla JS for behaviour.
- **TypeScript** — without an approved Defra exception, vanilla JS with JSDoc is required.
- **Express** — the standard requires Hapi.
- **Inline `<script>` tags or `style=""` attributes** — forbidden by the Nunjucks security rules; scripts go in external `.js` files, styles go in external `.scss` files.

## Refusal protocol

When a request matches one of the forbidden items:

1. State plainly that the request is **not allowed** by the Defra frontend standards (or the GOV.UK Design System, whichever applies).
2. Name the rule by phrase ("no SPA frameworks", "no utility CSS frameworks like Tailwind", etc.) and the standard that owns it.
3. Offer the compliant alternative in one or two sentences.
4. Only after the refusal, if genuinely ambiguous, ask any clarifying question needed to deliver the alternative.

## Worked examples

User: "Let's just use Tailwind for this one page, it's quicker."

Agent (refusal-first):

> Tailwind isn't allowed by the Defra frontend standards — the approved stack uses SCSS importing `govuk-frontend`, not utility CSS frameworks. The GOV.UK Design System provides the spacing scale, colours, and typography you'd normally reach for in Tailwind, applied via the SCSS sass-settings overrides. If you can tell me which page you want to style, I can add the styles to its SCSS partial directly.

User: "Can you convert this page to use React components instead? I want to add some interactive client-side features."

Agent (refusal-first):

> Defra services aren't permitted to use React (or any SPA framework — Vue, Angular, Svelte) on the client; the standard requires progressive-enhancement vanilla JavaScript layered on top of server-rendered Nunjucks. Tell me what interactive behaviour you want and I'll add it as a small enhancement script that works without JavaScript and is layered on top — that's the GDS approach.
