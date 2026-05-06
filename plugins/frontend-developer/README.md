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

## Companion plugin

This plugin's agent references the **`defra-shared`** plugin for cross-cutting standards (branching, commit messages, quality gates, security/PII, accessibility) and inherits its guardrail hooks. Install both for the full set of Defra rules and PreToolUse / PostToolUse guardrails. Without `defra-shared`, the agent falls back to short inline restatements; behaviour stays graceful but the shared hooks (e.g. `secret-scan`, `pii-scan`, `commit-message-format`, `coverage-floor`) won't fire.

## Hook expectations

The PostToolUse hooks in this plugin call the **target project's** npm scripts after edits to JS, SCSS, and Nunjucks files. If the target project uses different script names, the hooks silently no-op — they don't fail loudly. Make sure your `package.json` defines:

| Script            | When it runs                                  |
| ----------------- | --------------------------------------------- |
| `npm run lint`    | After `Edit`/`Write` on `*.js` / `*.mjs` (`-- --fix <file>`). |
| `npm run format:fix` | Same trigger as above (`-- <file>`).      |
| `npm run build`   | After `Edit`/`Write` on `*.scss`.             |

If your project uses `lint:fix`, `prettier`, `compile`, or similar, either rename your scripts or fork `hooks/hooks.json` for your project.

## Install

From the marketplace (install both):

```sh
copilot plugin marketplace add DEFRA/defra-ai-plugins
copilot plugin install defra-shared@defra-ai-plugins
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
