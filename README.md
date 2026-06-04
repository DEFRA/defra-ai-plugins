# defra-ai-plugins

[![Validate](https://github.com/DEFRA/defra-ai-plugins/actions/workflows/validate.yml/badge.svg)](https://github.com/DEFRA/defra-ai-plugins/actions/workflows/validate.yml)

A marketplace of [GitHub Copilot
CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing)
plugins for Defra. Each plugin ships agents and skills that encode Defra's
software development standards, the GOV.UK Design System, and GDS service
standards so Copilot produces compliant code by default.

> Primary target is GitHub Copilot CLI. The eval harness includes a
> demonstration that the same fixtures run unchanged against Claude Code
> (`npm run evals:frontend:claude`); cross-CLI plugin distribution is a future
> iteration.

## Prerequisites

To use the plugins as a Copilot CLI user:

| Tool          | Why                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------- |
| `copilot` CLI | Host that loads the plugins (`npm install -g @github/copilot`).                               |
| `jq`          | Every plugin hook parses tool-use JSON via `jq`. Without it, hooks fail.                      |
| `bash`        | Hooks are bash scripts. macOS/Linux native; Windows users need WSL or Git Bash.               |
| `git`         | Required by the `branch-guard` and `commit-message-format` hooks shipped with `defra-shared`. |

Additionally, to develop in this repo or run the eval harness:

| Tool                               | Why                                                                              |
| ---------------------------------- | -------------------------------------------------------------------------------- |
| Node.js + `npm`                    | Repo validators (`npm test`), the eval harness, and all build/scripting targets. |
| `claude` CLI + `ANTHROPIC_API_KEY` | Only for `npm run evals:frontend:claude`; not required for Copilot-only use.     |

Optional — activate the tracked pre-commit hook so Prettier formats the repo on
every commit (one-time, per checkout):

```sh
git config core.hooksPath .githooks
```

## Add this marketplace

```sh
copilot plugin marketplace add DEFRA/defra-ai-plugins
```

## Plugins

| Plugin                                             | Description                                                                                                                                                                                                               | Install                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [`defra-shared`](plugins/defra-shared)             | Cross-cutting Defra standards as installable skills and guardrail hooks (branching, commit messages, quality gates, security/PII, accessibility). Referenced by every other Defra plugin. No agent — skills + hooks only. | `copilot plugin install defra-shared@defra-ai-plugins`       |
| [`frontend-developer`](plugins/frontend-developer) | Builds Defra-compliant frontends following the GOV.UK Design System, WCAG 2.2 AA, and Defra software development standards (Hapi + Nunjucks + SCSS + Vitest).                                                             | `copilot plugin install frontend-developer@defra-ai-plugins` |
| [`ticket-writer`](plugins/ticket-writer)           | Creates well-structured JIRA tickets (stories and tasks) for any team. Ships default templates with support for custom templates at runtime.                                                                              | `copilot plugin install ticket-writer@defra-ai-plugins`      |

## Repository layout

```
defra-ai-plugins/
├── .github/
│   ├── plugin/
│   │   └── marketplace.json          # Copilot CLI marketplace registry
│   └── workflows/
│       └── validate.yml              # CI: runs validators on every PR
├── schemas/
│   ├── marketplace.schema.json       # JSON Schema for marketplace.json
│   └── plugin.schema.json            # JSON Schema for plugin manifests
├── scripts/                          # Node.js validators
└── plugins/
    ├── frontend-developer/
    │   ├── plugin.json               # Plugin manifest
    │   ├── README.md
    │   ├── agents/
    │   │   └── frontend-developer.agent.md
    │   ├── skills/                   # Skill files (work across CLIs)
    │   ├── hooks/                    # Plugin hooks
    │   ├── eval-fixture/             # Skeleton app the agent operates on during eval
    │   └── evals/                    # Behavioural fixtures, provider scripts, baseline
    │       ├── promptfooconfig.yaml
    │       ├── run-copilot.mjs       # Default CI provider
    │       ├── run-claude.mjs        # Local-only demo of cross-provider support
    │       ├── collect-and-report.mjs # Shared snapshot/diff/lint/test helpers
    │       ├── check-regression.mjs  # Baseline regression gate
    │       ├── summarise.mjs         # Markdown summary for CI step output
    │       └── baseline/             # Reference run for regression comparison
    └── ticket-writer/
        ├── plugin.json
        ├── README.md
        ├── agents/
        │   └── ticket-writer.agent.md
        └── skills/                   # story-ticket, task-ticket (+ custom skills)
```

Each plugin lives in its own directory under `plugins/` with a `plugin.json`
manifest and an entry-point file (`agents/<name>.agent.md`, `agents/<name>.md`,
or `skills/<name>/SKILL.md`). `hooks/`, `evals/`, and `eval-fixture/` are
optional — see [CONTRIBUTING.md](CONTRIBUTING.md).

## Validation

Every PR runs six checks:

| Check                     | What it enforces                                                                                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `marketplace.json` schema | Required fields, kebab-case names, no duplicates, source paths                                                                                                                      |
| `plugin.json` schema      | Required fields per plugin; name matches directory and marketplace                                                                                                                  |
| Agent frontmatter         | `description` and `tools` present and well-formed                                                                                                                                   |
| Cross-plugin refs         | Every skill named in an agent prompt resolves to the agent's own plugin or a plugin listed in `dependencies` in `plugin.json`. Catches drift between agent prompts and manifests.   |
| Docs sync                 | `docs/agents-and-skills.md` references every agent and skill on disk, and every path it cites still exists. Catches doc drift when an agent or skill is added, renamed, or removed. |
| Alphabetical sort         | Marketplace plugins sorted by name                                                                                                                                                  |

Run them locally:

```sh
npm install     # first time only
npm test
```

## Evaluating the plugins

Schema validation only checks that manifests are well-formed. A behavioural eval
exercises each plugin against realistic Defra tasks (and a few adversarial ones)
and asserts on what the agent actually produces — GOV.UK macros, Joi validation,
CSRF tokens, refusal of forbidden technologies, lint passing.

The harness uses [promptfoo](https://github.com/promptfoo/promptfoo) to drive
Copilot CLI in non-interactive mode against a minimal Hapi + govuk-frontend
skeleton at `plugins/frontend-developer/eval-fixture/`. Both the fixtures
(`promptfooconfig.yaml`) and the eval-target skeleton live under the plugin they
test. Evals are currently optional for new plugins (only `frontend-developer`
ships them today) but will become mandatory — plugins that add them should
follow the same `plugins/<plugin-name>/eval-fixture/` skeleton +
`plugins/<plugin-name>/evals/` fixture set layout.

A second provider, Claude Code, is wired up locally as a demonstration that the
same fixtures port across CLIs unchanged (`npm run evals:frontend:claude`). It is
**not** part of the CI gate — Copilot CLI is the only provider with a committed
baseline and a regression gate.

### Run locally

Prerequisites:

```sh
npm install                              # installs promptfoo (pinned) and other devDependencies
npm install -g @github/copilot
copilot plugin marketplace add DEFRA/defra-ai-plugins
copilot plugin install frontend-developer@defra-ai-plugins
```

Then:

```sh
npm run evals:frontend
```

Results land in `results/run-YYYY-MM-DD/promptfoo-results.json`. `npm run
evals:frontend` also runs `check-regression.mjs`, which compares against
`plugins/frontend-developer/evals/baseline/promptfoo-results.json` and exits
non-zero on any per-fixture regression.

> **Node 24 / `better-sqlite3` native-binding gotcha** — promptfoo persists
> results to SQLite via `better-sqlite3`. As of `better-sqlite3@12.9.0` there
> is no prebuilt binary for Node 24's ABI, and `npm install` may complete
> without compiling one from source. The `evals:frontend` and
> `evals:frontend:claude` scripts depend on `evals:setup` — an idempotent
> script that rebuilds the binding if the file is missing and no-ops
> otherwise. If you run promptfoo by hand rather than via the npm scripts,
> run `npm run evals:setup` first.

To run the same suite against Claude Code instead (requires `ANTHROPIC_API_KEY`
and `claude` CLI installed):

```sh
npm run evals:frontend:claude
```

### Iterating on the plugin without reinstalling

By default `claude` loads the plugin that was installed via
`claude plugin install frontend-developer@defra-ai-plugins`, so edits to
`plugins/frontend-developer/` are only picked up after a fresh
`claude plugin install`. To skip that step while you iterate locally, set
`CLAUDE_PLUGIN_DIR` to the absolute path of the plugin checkout — the
Claude-provider eval script passes it through as `--plugin-dir`, which
overrides the installed copy for that session only:

```sh
export CLAUDE_PLUGIN_DIR=/abs/path/to/plugins/frontend-developer
npx --no-install promptfoo eval \
  --filter-providers claude-code-frontend-developer \
  --filter-pattern 'Refuse'
```

Leave the env var unset for CI or baseline runs against the installed
plugin.

To browse results in a UI:

```sh
npm run evals:frontend:view
```

The default model is pinned in `plugins/frontend-developer/evals/run-copilot.mjs`
(`COPILOT_MODEL=gpt-5-mini`). Override for ad-hoc experiments:

```sh
COPILOT_MODEL=gpt-5 npm run evals:frontend
```

Inside the provider script, the agent is invoked as `copilot --agent
frontend-developer:frontend-developer`. The `<plugin>:<agent>` double-colon form
is Copilot CLI's way of disambiguating an agent inside a plugin from a
same-named built-in agent. For this plugin, both halves match; when adding a
plugin, use `<your-plugin>:<your-agent>`.

### CI

CI automation for the eval harness is forthcoming — it depends on a
`COPILOT_GITHUB_TOKEN` repository secret (a fine-grained PAT with the **Copilot
Requests** permission) which has not yet been provisioned. The workflow
definition, baseline regression gate, token-setup instructions, and GitHub
Actions step-summary reporting will land in a follow-up PR. Until then, run the
harness locally with `npm run evals:frontend` (see above).

## Contributing

Contributions are welcome from anyone. See [CONTRIBUTING.md](CONTRIBUTING.md)
for the full guide. In short:

1. Open a [plugin proposal issue](.github/ISSUE_TEMPLATE/plugin-proposal.md)
2. Copy `plugins/frontend-developer/` as a template
3. Update the manifest, agent file, and README
4. Add the plugin to `.github/plugin/marketplace.json` (alphabetical order)
5. Run `npm test` and open a PR

This project follows the [Contributor Covenant 2.1](CODE_OF_CONDUCT.md) and
accepts contributions under the [Open Government Licence v3.0](LICENSE). To
report a security issue, see [SECURITY.md](SECURITY.md).

## References

- [Defra software development standards](https://github.com/DEFRA/software-development-standards)
- [Defra AI SDLC playbook](https://defra.github.io/defra-ai-sdlc/)
- [GitHub Copilot CLI plugin documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing)

## Licence

Open Government Licence v3.0. See [LICENSE](LICENSE).
