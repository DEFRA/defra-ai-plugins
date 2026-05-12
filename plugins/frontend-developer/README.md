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

## Prerequisite plugin

This plugin declares **`defra-shared`** as a dependency in [`plugin.json`](plugin.json) and **must be installed alongside it**. The agent references the shared skills (`defra-branching`, `defra-commit-messages`, `defra-quality-gates`, `defra-security-pii`, `defra-accessibility`) by name in its workflow, and the guardrail hooks shipped by `defra-shared` (`branch-guard`, `commit-message-format`, `secret-scan`, `pii-scan`, `coverage-floor`) are the enforcement layer for those standards.

Copilot CLI does not auto-install dependencies — `npm test` (the `validate-cross-plugin-refs` check) verifies that every skill named in an agent prompt resolves to either the agent's own plugin or a plugin declared in `dependencies`, but the user still has to install both plugins. The Install section below lists the commands in the required order.

If `defra-shared` is not installed, the agent falls back to short inline restatements of each rule; behaviour stays graceful but the shared hooks do not fire, so enforcement degrades to advisory.

## Hook expectations

The PostToolUse hooks in this plugin call the **target project's** npm scripts after edits to JS, SCSS, and Nunjucks files. If the target project uses different script names, the hooks silently no-op — they don't fail loudly. Make sure your `package.json` defines:

| Script               | When it runs                                                  |
| -------------------- | ------------------------------------------------------------- |
| `npm run lint`       | After `Edit`/`Write` on `*.js` / `*.mjs` (`-- --fix <file>`). |
| `npm run format:fix` | Same trigger as above (`-- <file>`).                          |
| `npm run build`      | After `Edit`/`Write` on `*.scss`.                             |

If your project uses `lint:fix`, `prettier`, `compile`, or similar, either rename your scripts or fork `hooks/hooks.json` for your project.

## Install

From the marketplace (install both):

```sh
copilot plugin marketplace add DEFRA/defra-ai-plugins
copilot plugin install defra-shared@defra-ai-plugins
copilot plugin install frontend-developer@defra-ai-plugins
```

For Claude Code, run these inside an interactive session (they are slash commands, not shell commands):

```text
/plugin marketplace add DEFRA/defra-ai-plugins
/plugin install defra-shared@defra-ai-plugins
/plugin install frontend-developer@defra-ai-plugins
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
