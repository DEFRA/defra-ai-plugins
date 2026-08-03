# Agents and skills in this repo

This repo ships three GitHub Copilot CLI plugins under `plugins/`. Each plugin
is independent; one is shared and referenced by the others. This doc maps the
abstractions and the wiring between them. Source files are authoritative — the
file paths cited below are the audit trail.

## 1. The distinction

| Axis         | Agent                                                                                          | Skill                                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| What it is   | A persona + workflow + tool surface. Entry point for a session.                                | A reusable instruction document — formatting rules, templates, refusal lists, checklists.                            |
| File         | `plugins/<plugin>/agents/<name>.agent.md`                                                      | `plugins/<plugin>/skills/<name>/SKILL.md`                                                                            |
| Frontmatter  | `description`, `tools` (required, non-empty array). See `scripts/validate-frontmatter.mjs:74`. | `name` (must match parent dir), `description`. No `tools` field. See `scripts/validate-frontmatter.mjs:99`.          |
| How invoked  | `copilot --agent <plugin>:<name>` (see `README.md:209`), or interactively.                     | Loaded by an agent at runtime via the `skill` tool, named in the agent prompt (e.g. "use the **govuk-form** skill"). |
| Calls tools? | Yes — declares its tool surface in frontmatter.                                                | No. Skills are instruction text loaded into the agent's context; the agent still runs all tools.                     |
| Returns      | Whatever a session produces (files written, output, refusals).                                 | No return — its content is just appended to context when the agent loads it.                                         |
| Fit          | Decides what to do, gathers context, orchestrates skills, runs tools.                          | Encodes a single repeatable recipe or rule set the agent can pull in when relevant.                                  |

Skills in this repo are **pure instruction documents**, not callable functions.
This matches the schema (`schemas/plugin.schema.json` says nothing about
skills declaring tools) and the frontmatter validator (only agents declare
`tools`).

## 2. Composition model

Verified against the source: the assistant invokes an **agent**; the agent
loads zero-or-more **skills** as context and calls all tools itself. Hooks fire
deterministically around tool calls — they are not invoked by skills.

```
  user / harness (copilot CLI)
        │
        │ copilot --agent <plugin>:<agent>
        ▼
  ┌──────────────────────────────────────────────┐
  │ Agent  (one .agent.md file)                  │
  │   • persona + workflow                       │
  │   • tools: [view, edit, create, glob,        │
  │            grep, bash, skill, (task)]        │
  │                                              │
  │   ┌── loads ───────────────┐                 │
  │   ▼                        │                 │
  │ Skill (SKILL.md)           │                 │
  │   • instructions only      │                 │
  │   • no tools of its own ───┘                 │
  │                                              │
  │   calls tools ──► view / edit / create /     │
  │                   glob / grep / bash         │
  └──────────────────────────────────────────────┘
        ▲                  ▲
        │                  │
   ┌────┴───────┐    ┌─────┴──────────────────┐
   │ Hooks      │    │ Hooks                  │
   │ (Pre*)     │    │ (Post*, UserPromptSub) │
   │ hooks.json │    │ hooks.json             │
   └────────────┘    └────────────────────────┘
```

Notes that diverge from "skills call tools, agent aggregates":

- Skills here have **no `tools` declaration**. The agent's tool surface is the
  only one in play (`scripts/validate-frontmatter.mjs:99-110`).
- The cross-plugin relationship is **declared in `plugin.json`** and verified
  by `scripts/validate-cross-plugin-refs.mjs`, which scans every agent prompt
  for skill names and fails the build if any name belongs to a plugin not
  listed in the agent plugin's `dependencies`. Both `frontend-developer` and
  `ticket-writer` declare `defra-shared` as a dependency. The agent prompts
  still name skills textually (e.g.
  `plugins/frontend-developer/agents/frontend-developer.agent.md:38-42`); the
  validator is what keeps the prompt and the manifest in sync. Copilot CLI
  does not auto-install dependencies — the user installs both plugins in the
  order documented in each plugin's README.
- `defra-shared` has **no agent** — only skills + hooks. It is consumed by the
  other plugins' agents (`plugins/defra-shared/plugin.json`).

## 3. Inventory and invocation map

### Agents

| Agent              | File                                                            | Tools                                                 | Skills it names in its prompt                                                                                                                                                                                        |
| ------------------ | --------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| frontend-developer | `plugins/frontend-developer/agents/frontend-developer.agent.md` | view, edit, create, glob, grep, bash, **task**, skill | `govuk-form`, `govuk-component`, `vitest-unit-test`, `pre-commit-review` (own plugin); `defra-branching`, `defra-commit-messages`, `defra-quality-gates`, `defra-security-pii`, `defra-accessibility` (defra-shared) |
| ticket-writer      | `plugins/ticket-writer/agents/ticket-writer.agent.md`           | view, edit, create, glob, grep, bash, skill           | `story-ticket`, `task-ticket` (own plugin); `defra-branching`, `defra-commit-messages`, `defra-security-pii`, `defra-accessibility`, `defra-quality-gates` (defra-shared)                                            |

`frontend-developer` is the only agent that declares the `task` tool
(`plugins/frontend-developer/agents/frontend-developer.agent.md:3`); the agent
prompt does not explicitly delegate to sub-agents, so `task` is currently
declared-but-unused for sub-agent delegation.

### Skills

| Skill                 | File                                                              | Owning plugin       | Called by                                                                                                                                                                           |
| --------------------- | ----------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| defra-accessibility   | `plugins/defra-shared/skills/defra-accessibility/SKILL.md`        | defra-shared        | frontend-developer agent, ticket-writer agent                                                                                                                                       |
| defra-pii-redaction   | `plugins/defra-pii-redaction/skills/defra-pii-redaction/SKILL.md` | defra-pii-redaction | Loaded as context when the pii-redaction hooks are installed; describes the redaction contract                                                                                      |
| defra-branching       | `plugins/defra-shared/skills/defra-branching/SKILL.md`            | defra-shared        | frontend-developer agent, ticket-writer agent; also cited by name in `defra-shared/hooks/hooks.json` branch-guard error                                                             |
| defra-commit-messages | `plugins/defra-shared/skills/defra-commit-messages/SKILL.md`      | defra-shared        | frontend-developer agent, ticket-writer agent; cited by `commit-message-format` hook                                                                                                |
| defra-quality-gates   | `plugins/defra-shared/skills/defra-quality-gates/SKILL.md`        | defra-shared        | frontend-developer agent, ticket-writer agent; cited by `coverage-floor` hook                                                                                                       |
| defra-security-pii    | `plugins/defra-shared/skills/defra-security-pii/SKILL.md`         | defra-shared        | frontend-developer agent, ticket-writer agent; cited by `secret-scan` and `pii-scan` hooks                                                                                          |
| frontend-tech-stack   | `plugins/frontend-developer/skills/frontend-tech-stack/SKILL.md`  | frontend-developer  | Not named in the agent prompt; surfaced deterministically by the `UserPromptSubmit` hook in `plugins/frontend-developer/hooks/hooks.json` when the prompt mentions a forbidden tech |
| govuk-component       | `plugins/frontend-developer/skills/govuk-component/SKILL.md`      | frontend-developer  | frontend-developer agent (workflow step 4)                                                                                                                                          |
| govuk-form            | `plugins/frontend-developer/skills/govuk-form/SKILL.md`           | frontend-developer  | frontend-developer agent (workflow step 3)                                                                                                                                          |
| pre-commit-review     | `plugins/frontend-developer/skills/pre-commit-review/SKILL.md`    | frontend-developer  | frontend-developer agent (workflow step 7)                                                                                                                                          |
| vitest-unit-test      | `plugins/frontend-developer/skills/vitest-unit-test/SKILL.md`     | frontend-developer  | frontend-developer agent (workflow step 5)                                                                                                                                          |
| story-ticket          | `plugins/ticket-writer/skills/story-ticket/SKILL.md`              | ticket-writer       | ticket-writer agent (workflow step 3)                                                                                                                                               |
| task-ticket           | `plugins/ticket-writer/skills/task-ticket/SKILL.md`               | ticket-writer       | ticket-writer agent (workflow step 3)                                                                                                                                               |

### Wiring diagram

```
                        ┌──────────────────────────┐
                        │ defra-shared (no agent)  │
                        │                          │
                        │  defra-branching         │◄──┐
                        │  defra-commit-messages   │◄──┤
                        │  defra-quality-gates     │◄──┤
                        │  defra-security-pii      │◄──┤
                        │  defra-accessibility     │◄──┤
                        │                          │   │  (cross-plugin
                        │  hooks: branch-guard,    │   │   references —
                        │   commit-message-format, │   │   textual only)
                        │   secret-scan, pii-scan, │   │
                        │   coverage-floor         │   │
                        └──────────────────────────┘   │
                                                       │
   ┌───────────────────────────────────────────┐       │
   │ frontend-developer                        │───────┤
   │                                           │       │
   │   agent: frontend-developer ──► loads:    │       │
   │     govuk-form                            │       │
   │     govuk-component                       │       │
   │     vitest-unit-test                      │       │
   │     pre-commit-review                     │       │
   │                                           │       │
   │   skill (no agent caller):                │       │
   │     frontend-tech-stack ◄── injected by   │       │
   │       UserPromptSubmit hook on prompts    │       │
   │       mentioning forbidden tech           │       │
   │                                           │       │
   │   hooks: lint/format, scss-build,         │       │
   │     nunjucks-security                     │       │
   │     (branch-guard lives in defra-shared)  │       │
   └───────────────────────────────────────────┘       │
                                                       │
   ┌───────────────────────────────────────────┐       │
   │ ticket-writer                             │───────┘
   │                                           │
   │   agent: ticket-writer ──► loads:         │
   │     story-ticket                          │
   │     task-ticket                           │
   │                                           │
   │   (no hooks)                              │
   └───────────────────────────────────────────┘
```

## 4. Composition between agents or between skills

- **Agent → agent**: none. `frontend-developer` declares the `task` tool
  (`plugins/frontend-developer/agents/frontend-developer.agent.md:3`) but does
  not name a sub-agent anywhere in the prompt. `ticket-writer` does not declare
  `task` at all.
- **Skill → skill**: none. A `grep` across all `SKILL.md` files shows no skill
  body references another skill by name.
- **Hook → skill**: one-way and textual. The hooks in
  `plugins/defra-shared/hooks/hooks.json` emit error messages of the form
  `"See skill defra-branching"` so the agent can recover the rule from a
  blocked tool call. The hook does not load the skill itself.
- **Hook → skill (injection)**: the `UserPromptSubmit` hook in
  `plugins/frontend-developer/hooks/hooks.json` prints a refusal banner into
  the agent's context when the user prompt matches a forbidden technology
  keyword, citing `frontend-tech-stack`. This is the only path that surfaces
  that skill — the agent file does not call it out by name.

## 5. Reading guidance

- To find **what an agent is allowed to do** and its workflow: read
  `plugins/<plugin>/agents/<name>.agent.md` — frontmatter is the tool surface,
  body is the prompt.
- To find **the rule behind a refusal or a hook block**: read the matching
  `SKILL.md`. Hook error messages name the skill (`"See skill defra-…"`).
- To find **what runs deterministically around tool calls**: read
  `plugins/<plugin>/hooks/hooks.json`. Each entry has a matcher (`Bash`,
  `Edit|Write`, `UserPromptSubmit`) and an inline shell command.
- To find **what's installed in the marketplace and how plugins relate**: read
  `README.md` and `plugins/<plugin>/plugin.json`. Each plugin declares its
  cross-plugin dependencies in the `dependencies` field; the
  `validate-cross-plugin-refs` check
  (`scripts/validate-cross-plugin-refs.mjs`) enforces that every skill named
  in an agent prompt resolves to either the agent's own plugin or a declared
  dependency.
- To **keep this document honest**: the `validate-docs-sync` check
  (`scripts/validate-docs-sync.mjs`, run as part of `npm test`) parses this
  file's backticked path references and fails CI if any agent or skill on
  disk is missing from the inventory, or if a path in the doc no longer
  exists. Adding, removing, or renaming an entry-point file means updating
  the inventory in section 3 below.

## 6. Notes on the model

- **Declared but not auto-installed.** `plugin.json` carries an optional
  `dependencies` array (`schemas/plugin.schema.json`). Both
  `frontend-developer` and `ticket-writer` declare `defra-shared` there, and
  the `validate-cross-plugin-refs` check fails the build if an agent
  references a skill from an undeclared plugin. Copilot CLI does **not**
  resolve or install dependencies — the field is a contract for documentation
  and CI, not an installer directive. The user must still install both
  plugins; the READMEs document the order. Without `defra-shared`, agent
  prompts fall back to the inline "soft-handoff" copy
  (`plugins/frontend-developer/agents/frontend-developer.agent.md:36`) and
  the shared hooks do not fire.
- **Skill loading is opportunistic, not deterministic.** The agent decides
  when to load a skill based on the workflow text in its prompt. The one
  exception is `frontend-tech-stack`, which the `UserPromptSubmit` hook
  injects deterministically on keyword match — added because the project
  could not rely on the skill selector picking it up (see the comment in
  `plugins/frontend-developer/hooks/hooks.json` on the UserPromptSubmit hook).
- **Hooks are the only enforcement, and they live exactly once.** Skill
  content is advisory; the guarantees that something cannot happen (no commit
  to `main`, no hard-coded secret reaching disk) come from `PreToolUse` hooks
  that exit 2. All cross-cutting hooks live in `defra-shared` — role plugins
  do not redeclare them. (An earlier duplicate `branch-guard` in
  `frontend-developer/hooks/hooks.json` was removed once `defra-shared` was
  made a declared dependency; carrying both meant the hook fired twice when
  both plugins were installed and partially when only the role plugin was.)
- **Context cost.** Every skill an agent loads is appended to its context for
  the rest of the session. The frontend-developer workflow can pull in up to
  nine skills in one session (four own + five shared) which is the upper bound
  to keep in mind when iterating on skill length.
- **Cross-CLI portability.** Skill files are format-shared with Claude Code
  (see `scripts/validate-frontmatter.mjs:9-12` distinguishing
  `copilot-agent` vs `claude-agent` formats). The Copilot agent file format
  (`.agent.md` with required `tools` array) is Copilot-specific.
