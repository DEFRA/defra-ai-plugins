# interaction-designer

A GitHub Copilot CLI (and Claude Code) plugin that walks Defra interaction
designers from a verbal brief through to a journey doc, page spec, and HTML
preview in a single session. Lives at `plugins/interaction-designer/` in the
`defra-ai-plugins` marketplace.

## Conventions

Repo-wide conventions (manifest schema, marketplace registration, validator
rules) live in the marketplace root — see `../../CONTRIBUTING.md` and
`../../docs/agents-and-skills.md`. Project-specific only below. Keep this file
under ~150 lines. The skill bodies (`skills/<name>/SKILL.md`) are the source of
truth for each skill's behaviour and load-bearing constraints; this file
records the cross-cutting conventions and invariants.

### Skill-format notes

- Plugin manifest is `plugin.json` in this directory (not repo root — the
  marketplace root's `.github/plugin/marketplace.json` /
  `.claude-plugin/marketplace.json` is what registers this plugin).
- Skills auto-discover from `skills/<name>/SKILL.md` — purely directory-based
  (`scripts/lib/discover.mjs` in the marketplace root). `plugin.json` does not
  declare a `skills` field; that key is not part of this marketplace's
  `plugin.schema.json` and fails validation if added.
- Agent guidance file is `AGENTS.md` (this file), not `CLAUDE.md`.
- `allowed-tools` in skill frontmatter is for **external tools only**
  (`shell`, `bash`). Never list Claude tool names like `Read`, `Edit`,
  `Write`, `Glob`, `Grep`, `Skill`.
- Written primarily for Copilot CLI, but the `SKILL.md` format is shared
  across Copilot CLI and Claude Code (see the marketplace's
  `scripts/validate-frontmatter.mjs`) — nothing here is Copilot-only except
  the `allowed-tools` values.

### Layered shape (load-bearing)

- One orchestrator skill (`skills/ixd-start/`, frontmatter `name: ixd-start`,
  invoked as `/ixd-start`) + six leaf skills
  (`ixd-read-corpus`, `ixd-frame-policy`, `ixd-map-journey`, `ixd-spec-page`,
  `ixd-preview-spec`, `ixd-wrap-up`). Two invocation surfaces, one skill layer.
- Each leaf writes its own per-stage entry to `DESIGN_HISTORY.md` before returning. Survives session loss.
- Orchestrator composes leaves via in-context slash invocation. Never as a Copilot **custom agent** (`.agent.md`) — custom agents are isolated subagents that break per-stage journal accumulation.
- Skills never auto-invoke each other; description fields must be narrow enough not to surprise the user mid-session.
- **Skill-to-skill invocation is model-mediated, not runtime-intercepted.** When a skill body says "Invoke `/<skill>`", the model dispatches it; there's no runtime `/skill-name` parser inside a SKILL.md. The orchestrator phase bodies use natural-language imperative + the `/ixd-<name>` form together as belt-and-braces so the model commits to executing, not just acknowledging.

### Declarative / narrative split

- `specs/<slug>.md` is **what** was built (Route, Purpose, Pattern, Question, Components, States, Validation, Open decisions).
- `DESIGN_HISTORY.md` entries are **why** (decisions, rejections, parked items, alternatives).
- Never collapse the two.

### Hard constraints

- **No skill ever runs `git`.** Skills end by suggesting a `git add … && git commit -m '…'` line as text; the designer runs it.
- **No silent brand defaulting in `ixd-preview-spec`.** If neither `--brand=` argument nor `brand:` frontmatter resolves the brand, stop and ask.
- **No fabricated citations in `ixd-map-journey`.** Cite `sources/reference/<file>:<line-range>` from grep hits; gaps go in `rejected / parked`.
- **No bundled corpus.** The plugin reads `sources/` at cwd; a designer brings their own.
- `govuk-frontend` is pinned to v6.1.0; the pin appears in `chrome-gov-uk.md`, `chrome-defra.md`, and the `ixd-preview-spec/SKILL.md` journal-entry template. Bump all three together.

### Stack

- Markdown for skill bodies, YAML frontmatter, HTML for rendered previews. No Python, no Node, no compiled languages, no build tooling.

## Workflows

### Building a new leaf skill

1. Read the existing leaf skills for the established pattern, and the **Hard constraints** above for what's load-bearing.
2. Implement at `skills/<name>/SKILL.md` with frontmatter (`name` matching the directory, `description`; optional `allowed-tools: shell`) and body sections: preamble, `## When to use`, `## Process` (numbered for leaves, phased for orchestrator), `## Notes`.
3. Exercise end-to-end against a real `sources/` corpus.
4. End the skill with a commit-line suggestion as text; the human runs `git`.
5. Run `npm test` from the marketplace root — the frontmatter, docs-sync, and cross-plugin-ref validators cover this plugin too.

## House style

Skill frontmatter:

```yaml
---
name: <skill-name> # must match the parent directory name exactly
description: <single sentence — what it does and when to invoke, ≤500 chars>
allowed-tools: shell # optional; only if the skill shells out (values: shell or bash)
license: OGL-UK-3.0 # optional
---
```

Per-stage journal entry:

```markdown
## <YYYY-MM-DD> — <skill> on <subject>

<one paragraph: decisions, rejections, parked items>

Next: <one line — what the next skill or session should pick up>
```

Session summary (locked format, greppable by `^## Session wrap-up`):

```markdown
## Session wrap-up — <YYYY-MM-DD>: <title>

**Brief**: `<path>` — <title>
**Per-stage entries in this session**: <N> — `<skill>`, ...

### What the session produced

### Open decisions to carry forward

### Next session
```

## Development

No build, no tests of its own. Verification = exercising each skill against a
real `sources/` corpus and eyeballing outputs, plus the marketplace-wide
structural validators (`npm test` from the repo root).
