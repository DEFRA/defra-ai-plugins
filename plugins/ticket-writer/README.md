# ticket-writer

A GitHub Copilot CLI plugin that creates well-structured JIRA tickets for any team or project. The agent guides you from a rough idea to a saved, formatted ticket — asking clarifying questions, applying consistent structure, and offering default or custom templates.

## What it provides

A custom agent (**`ticket-writer`**) backed by two skills:

- **`story-ticket`** — user-facing features in _As a / I want to / so that_ format with Acceptance Criteria
- **`task-ticket`** — technical implementation, infrastructure, or developer tasks

At the start of every session the agent lists the available skills and asks whether to use the built-in default templates or a custom template file you provide.

## Companion plugin

This plugin's agent references the **`defra-shared`** plugin for cross-cutting standards (branching, commit messages, security/PII, documentation accessibility) and inherits its guardrail hooks. Install both for the full set of Defra rules and PreToolUse / PostToolUse guardrails. Without `defra-shared`, the agent falls back to short inline restatements; behaviour stays graceful but the shared hooks (e.g. `pii-scan`, `commit-message-format`, `branch-guard`) won't fire when the agent saves or commits ticket files.

## Install

From the marketplace (install both):

```sh
copilot plugin marketplace add DEFRA/defra-ai-plugins
copilot plugin install defra-shared@defra-ai-plugins
copilot plugin install ticket-writer@defra-ai-plugins
```

Direct from the repository:

```sh
copilot plugin install DEFRA/defra-ai-plugins
```

From a local checkout (for development):

```sh
copilot plugin install ./plugins/ticket-writer
```

## Use

In an interactive Copilot CLI session:

```
/agent ticket-writer
```

Then describe what you want to create. The agent will ask clarifying questions, route to the right skill, confirm the save path, and write the ticket.

Default save locations:

| Type  | Path                                    |
| ----- | --------------------------------------- |
| Story | `tickets/story/<feature-name>.story.md` |
| Task  | `tickets/task/<feature-name>.task.md`   |

To use your own template, choose **custom** when prompted and supply a file path. The agent uses it for the rest of the session.

## Creating a custom template skill

If your team has its own ticket format, you can package it as a Copilot CLI skill and drop it into this plugin. The agent will pick it up automatically.

### Skill structure

```
plugins/ticket-writer/skills/<your-skill-name>/
├── SKILL.md          ← skill definition and formatting rules
└── assets/
    └── template.md  ← the template the agent fills in
```

`<your-skill-name>` must be kebab-case (e.g. `bug-report`, `spike-ticket`).

### SKILL.md frontmatter

```yaml
---
name: <your-skill-name> # must match the directory name exactly
description: <one sentence describing when to use this skill>
license: OGL-UK-3.0
---
```

### template.md

Copy the [story template](skills/story-ticket/assets/template.md) or [task template](skills/task-ticket/assets/template.md) as a starting point, then replace the sections with your team's structure. Use HTML comments (`<!-- … -->`) to explain each placeholder to the agent.

### Registering the skill with the agent

Add a line to the `## Startup` section of [`agents/ticket-writer.agent.md`](agents/ticket-writer.agent.md) so the agent announces the new skill at the start of each session, and add a routing rule in the `## Workflow` section so the agent knows when to load it.

### Validation

Run `npm test` from the repository root to confirm the new skill passes all structural checks before raising a PR.

## See also

- [`agents/ticket-writer.agent.md`](agents/ticket-writer.agent.md) — the full agent prompt
- [`skills/story-ticket/SKILL.md`](skills/story-ticket/SKILL.md) — story formatting rules and default template
- [`skills/task-ticket/SKILL.md`](skills/task-ticket/SKILL.md) — task formatting rules and default template

## Licence

Open Government Licence v3.0. See [LICENSE](../../LICENSE).
