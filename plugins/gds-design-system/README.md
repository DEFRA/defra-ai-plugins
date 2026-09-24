# gds-design-system

GOV.UK Design System depth for coding agents, so they stop reading `node_modules` and start following the guidance.

## The problem

An agent asked to build a GOV.UK user journey goes looking for `node_modules/govuk-frontend`, reads template and macro files until it can infer a working call, and produces something that renders. It costs a lot of tokens, and it learns the wrong thing: the package says what a macro _can_ accept. It never says that a name is one field and not three, that a date of birth needs three inputs and never a date picker, or that an error summary is required even when there is only one error.

That second layer — the patterns — is the part that makes a service pass assessment, and it does not exist in the package at all.

## What this ships

Four skills. The first two are generated from upstream; the last two are written by hand.

| Skill                 | Covers                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| `gds-components`      | 37 components and 13 style pages: guidance, every coded example, and the complete Nunjucks macro options |
| `gds-patterns`        | 35 patterns: how to ask for an address, a name, a date, and how each page type should behave             |
| `gds-prototype-kit`   | Layouts, routes, session data and branching in the GOV.UK Prototype Kit                                  |
| `gds-journey-builder` | Assembling pages into a journey, wiring validation, and checking the result                              |

Plus a `PreToolUse` hook that intercepts reads of `node_modules/govuk-frontend` templates and macro options and points at the reference file that holds the same API plus the guidance. It leaves the package's JavaScript, Sass and tests alone, so debugging the package still works.

### Cost

A typical component file is 1,500 to 3,000 tokens and answers the question completely. `references/_all-params.md` carries every macro signature for all 37 components in 2,600 tokens.

## Works with Claude Code and GitHub Copilot CLI

Both hosts read the same `skills/*/SKILL.md` files and the same `hooks/hooks.json`, following the same single-manifest layout as every other plugin in this marketplace (see `defra-shared`, `defra-pii-redaction`). No per-host duplicate files.

The guard hook reads whichever input shape it is given — Claude Code's `tool_name`/`tool_input` or Copilot CLI's `toolName`/`toolArgs` — and decides on the _argument keys_ rather than the tool name, since the two hosts name their tools differently and those names change. It reads only keys that name a target (`file_path`, `path`, `pattern`, `command` and friends) and never content-bearing keys, so a file that merely mentions `node_modules/govuk-frontend` in its text stays writable. Its deny response carries both hosts' output shapes in one object, so either can read it.

```shell
node hooks/scripts/redirect-node-modules.test.mjs   # 48 cases across 3 host shapes
```

> **Copilot caveat.** Plugin-defined `PreToolUse` hooks have known reliability issues in Copilot CLI ([copilot-cli#2540](https://github.com/github/copilot-cli/issues/2540), [#2893](https://github.com/github/copilot-cli/issues/2893)). The skills themselves work regardless — they are ordinary `SKILL.md` files. If you need the guard enforced hard under Copilot, copy the same command into a repository-level `.github/hooks/*.json`, which is the documented and reliable path.

## Layout

```
plugins/gds-design-system/
  plugin.json
  hooks/
    hooks.json                       PreToolUse guard config
    scripts/
      redirect-node-modules.mjs      the guard, serving both hosts
      redirect-node-modules.test.mjs
  skills/
    gds-components/
      SKILL.md                       hand-written
      references/                    generated
        _index.md                    all 37 components, with aliases
        _all-params.md               every macro signature, 2.6k tokens
        _shared-params.md            label, hint, errorMessage, fieldset
        <component>.md               x 37
        styles/<style>.md            x 13
    gds-patterns/
      SKILL.md                       hand-written
      references/<pattern>.md        generated, x 35
    gds-prototype-kit/               hand-written
      SKILL.md
      references/
        page-module-architecture.md
        scaffold.md
        refactor-existing.md
    gds-journey-builder/             hand-written
      SKILL.md
      references/
        journey-skeleton.md
        validation-and-errors.md
        accessibility-checks.md
```

## Editing

Edit `SKILL.md` files, everything under `gds-prototype-kit` and `gds-journey-builder`, and the generator itself.

Do not edit anything under `gds-components/references/` or `gds-patterns/references/`. Those are generated, CI checks them, and hand edits are lost at the next regeneration. If the guidance is wrong, fix it upstream in the Design System; if the _rendering_ is wrong, fix `generate.mjs`.

## Works alongside

These skills answer "which component, which pattern, how do I wire it". They deliberately do not cover service mapping, writing style or Defra's own constraints, which are handled by the [DEFRA user-centred-designer plugin](https://github.com/DEFRA/defra-ai-plugins/tree/main/plugins/user-centred-designer):

| Question                                           | Skill                                |
| -------------------------------------------------- | ------------------------------------ |
| What should this service do?                       | `defra-service-designer`             |
| How should this sentence read?                     | `defra-doc-style`                    |
| Defra constraints, accessibility duty, deploy loop | `defra-interaction-content-designer` |
| Which component, what parameters                   | `gds-components`                     |
| Which pattern for this question                    | `gds-patterns`                       |
| How do these join into a journey                   | `gds-journey-builder`                |
| How do I make it run                               | `gds-prototype-kit`                  |

## Licence

The hand-written skill content (SKILL.md bodies, styles/, and the gds-prototype-kit and gds-journey-builder reference files) is [Open Government Licence v3.0](../../LICENSE), matching the rest of this repository.

The mechanically-generated reference files under `gds-components/references` and `gds-patterns/references` are derived from the [GOV.UK Design System](https://github.com/alphagov/govuk-design-system) and [GOV.UK Frontend](https://github.com/alphagov/govuk-frontend), both MIT licensed and © Crown copyright.
