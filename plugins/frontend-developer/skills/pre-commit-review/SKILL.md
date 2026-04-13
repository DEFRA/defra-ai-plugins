---
name: pre-commit-review
description: Run through the full Defra pre-commit checklist before raising a pull request. Use when work is complete and about to be committed or submitted for review — checks code quality, test coverage, accessibility, security, and GOV.UK Design System compliance against all Defra and GDS requirements.
license: OGL-UK-3.0
---

# Pre-commit Review

Work through every item below before marking work as done or opening a pull request. For each item, check the current state of the codebase and flag any failures clearly.

## Code quality

- [ ] `npm run lint` passes with zero warnings or errors
- [ ] `npm run format` passes (or `npm run format:fix` has been run)
- [ ] No commented-out code, magic numbers, or `console.log` statements left in
- [ ] Every new or changed function has a single clear responsibility
- [ ] JSDoc added for all new public functions

## Tests

- [ ] All Vitest tests pass — no regressions introduced
- [ ] New or changed behaviour has corresponding test coverage
- [ ] Coverage meets targets: ≥90% global, ≥95% core view/controller logic, 100% error handling and security paths
- [ ] Coverage has not decreased from the project or SonarCloud baseline
- [ ] SonarCloud quality gate passes (SonarWay profile) — no new bugs, vulnerabilities, or code smells
- [ ] SonarCloud security hotspots reviewed and resolved

## Accessibility

- [ ] Every new or changed page tested with keyboard only (tab, enter, space, arrow keys)
- [ ] Every new or changed page tested with a screen reader (NVDA on Windows, VoiceOver on macOS)
- [ ] Automated accessibility check passes (axe / Lighthouse) — zero violations
- [ ] One `<h1>` per page; heading hierarchy has no skipped levels
- [ ] All form fields have associated `<label>` elements
- [ ] Focus indicators visible on all interactive elements
- [ ] Pages reflow without horizontal scroll at 320px
- [ ] Colour contrast meets WCAG AA (4.5:1 body text, 3:1 large text)
- [ ] `prefers-reduced-motion` respected for any animations

## GOV.UK Design System

- [ ] GOV.UK Frontend macros used — no hand-rolled replacements for buttons, inputs, radios, checkboxes, error summary, or error messages
- [ ] `govukErrorSummary` at top of page + inline `errorMessage` per field on all form pages
- [ ] Content follows GOV.UK style guide: plain English, sentence case, "you" / "we", no jargon

## Security

- [ ] CSRF protection on all state-changing routes (`@hapi/crumb`)
- [ ] CSP configured — no `unsafe-inline` or `unsafe-eval`
- [ ] Security headers present: `X-Content-Type-Options: nosniff`, `Referrer-Policy`, HSTS
- [ ] Cookies are `HttpOnly`, `Secure`, `SameSite=Lax`
- [ ] No PII in log output, query strings, or URL paths
- [ ] All user input validated with `joi` schemas
- [ ] No secrets committed to source — secrets via environment variables only

## Git hygiene

- [ ] Commit messages use conventional format (`feat:`, `fix:`, `test:`, `refactor:`, `chore:`, `docs:`)
- [ ] Branch is up to date with main — no merge conflicts
- [ ] README and config docs updated if environment variables or setup steps changed
