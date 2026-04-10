# frontend-developer

A GitHub Copilot CLI plugin that ships a Defra frontend developer agent. The agent encodes Defra's software development standards, the GOV.UK Design System, and WCAG 2.2 AA so Copilot produces compliant frontend code by default.

## What it provides

A single custom agent: **`frontend-developer`**.

Switch to it whenever you are building or editing:

- User-facing pages and GOV.UK Design System components
- Nunjucks templates and SCSS
- Progressive-enhancement client JavaScript
- Anything in a Defra service frontend built with Hapi + Nunjucks + `govuk-frontend` + Vitest

The agent will automatically apply Defra's pre-commit checklist, accessibility requirements, and security headers.

## Install

From the marketplace:

```sh
copilot plugin marketplace add DEFRA/defra-ai-plugins
copilot plugin install frontend-developer@defra-ai-plugins
```

Direct from the repository:

```sh
copilot plugin install DEFRA/defra-ai-plugins
```

From a local checkout (for development):

```sh
copilot plugin install ./plugins/frontend-developer
```

## Use

In an interactive Copilot CLI session:

```
/agent frontend-developer
```

Then describe what you want to build.

## See also

- [`agents/frontend-developer.agent.md`](agents/frontend-developer.agent.md) — the full agent prompt
- [Defra software development standards](https://github.com/DEFRA/software-development-standards)
- [GOV.UK Design System](https://design-system.service.gov.uk/)

## Licence

Open Government Licence v3.0. See [LICENSE](../../LICENSE).
