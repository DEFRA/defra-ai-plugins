# defra-ai-plugins

[![Validate](https://github.com/DEFRA/defra-ai-plugins/actions/workflows/validate.yml/badge.svg)](https://github.com/DEFRA/defra-ai-plugins/actions/workflows/validate.yml)
[![Evals](https://github.com/DEFRA/defra-ai-plugins/actions/workflows/evals.yml/badge.svg)](https://github.com/DEFRA/defra-ai-plugins/actions/workflows/evals.yml)

A marketplace of [GitHub Copilot
CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing)
plugins for Defra. Each plugin ships agents and skills that encode Defra's
software development standards, the GOV.UK Design System, and GDS service
standards so Copilot produces compliant code by default.

> Primary target is GitHub Copilot CLI. The eval harness includes a
> demonstration that the same fixtures run unchanged against Claude Code
> (`make evals-claude`); cross-CLI plugin distribution is a future
> iteration.

## Add this marketplace

```sh
copilot plugin marketplace add DEFRA/defra-ai-plugins
```

## Plugins

| Plugin                                             | Description                                                                                                                                                   | Install                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [`frontend-developer`](plugins/frontend-developer) | Builds Defra-compliant frontends following the GOV.UK Design System, WCAG 2.2 AA, and Defra software development standards (Hapi + Nunjucks + SCSS + Vitest). | `copilot plugin install frontend-developer@defra-ai-plugins` |

## Repository layout

```
defra-ai-plugins/
├── .github/
│   ├── plugin/
│   │   └── marketplace.json          # Copilot CLI marketplace registry
│   └── workflows/
│       ├── validate.yml              # CI: runs validators on every PR
│       └── evals.yml                 # CI: runs behavioural eval on every PR
├── schemas/
│   ├── marketplace.schema.json       # JSON Schema for marketplace.json
│   └── plugin.schema.json            # JSON Schema for plugin manifests
├── scripts/                          # Node.js validators
└── plugins/
    └── frontend-developer/
        ├── plugin.json               # Plugin manifest
        ├── README.md
        ├── agents/
        │   └── frontend-developer.agent.md
        ├── skills/                   # Skill files (work across CLIs)
        ├── hooks/                    # Plugin hooks
        ├── eval-fixture/             # Skeleton app the agent operates on during eval
        └── evals/                    # Behavioural fixtures, provider scripts, baseline
            ├── promptfooconfig.yaml
            ├── run-copilot.sh        # Default CI provider
            ├── run-claude.sh         # Local-only demo of cross-provider support
            ├── collect-and-report.sh # Shared snapshot/diff/lint/test helpers
            ├── check-regression.sh   # Baseline regression gate
            ├── summarise.sh          # Markdown summary for CI step output
            └── baseline/             # Reference run for regression comparison
```

Each plugin lives in its own directory under `plugins/` with a `plugin.json`
manifest and an `agents/` directory containing one or more Copilot custom
agents.

## Validation

Every PR runs four checks:

| Check                     | What it enforces                                                   |
| ------------------------- | ------------------------------------------------------------------ |
| `marketplace.json` schema | Required fields, kebab-case names, no duplicates, source paths     |
| `plugin.json` schema      | Required fields per plugin; name matches directory and marketplace |
| Agent frontmatter         | `description` and `tools` present and well-formed                  |
| Alphabetical sort         | Marketplace plugins sorted by name                                 |

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
(`promptfooconfig.yaml`) and the eval-target skeleton live under the plugin
they test. New plugins should add their own
`plugins/<plugin-name>/eval-fixture/` skeleton and
`plugins/<plugin-name>/evals/` fixture set.

A second provider, Claude Code, is wired up locally as a demonstration that
the same fixtures port across CLIs unchanged (`make evals-claude`). It is
**not** part of the CI gate — Copilot CLI is the only provider with a
committed baseline and a regression gate.

### Run locally

Prerequisites:

```sh
npm install -g @github/copilot
copilot plugin marketplace add DEFRA/defra-ai-plugins
copilot plugin install frontend-developer@defra-ai-plugins
```

Then:

```sh
make evals
```

Results land in `results/run-YYYY-MM-DD/promptfoo-results.json`. `make evals`
also runs `check-regression.sh`, which compares against
`plugins/frontend-developer/evals/baseline/promptfoo-results.json` and exits
non-zero on any per-fixture regression.

To run the same suite against Claude Code instead (requires
`ANTHROPIC_API_KEY` and `claude` CLI installed):

```sh
make evals-claude
```

To browse results in a UI:

```sh
make evals-view
```

The default model is pinned in `plugins/frontend-developer/evals/run-copilot.sh`
(`COPILOT_MODEL=gpt-5-mini`). Override for ad-hoc experiments:

```sh
COPILOT_MODEL=gpt-5 make evals
```

Inside the provider script, the agent is invoked as
`copilot --agent frontend-developer:frontend-developer`. The `<plugin>:<agent>`
double-colon form is Copilot CLI's way of disambiguating an agent inside a
plugin from a same-named built-in agent. For this plugin, both halves match;
when adding a plugin, use `<your-plugin>:<your-agent>`.

### CI

The [`Evals`](.github/workflows/evals.yml) workflow runs the Copilot CLI
provider on every PR that touches `plugins/`, and on `workflow_dispatch`. It
runs `check-regression.sh` against the committed baseline and fails the build
if any fixture that previously passed now fails. The Claude provider is
filtered out of CI by `--filter-providers copilot-cli-frontend-developer` —
it's local-only.

`check-regression.sh` matches tests by `vars.prompt`, treats a test as
passing only if **every** provider that ran it passed, and exits non-zero on
any baseline-passing test that now fails. New tests added since the baseline
are not retroactively gated — promptfoo's own exit code already fails the
run on any fixture failure, so new fixtures are gated from their first
appearance. The result JSON is uploaded
as an artifact, and the GitHub Actions step summary publishes per-fixture
pass/fail, named scores per quality dimension (component_correctness,
security, accessibility, lint_passes, refusal), assertion-level failure
counts, and latency p50/p95/max.

CI requires a repository secret named `COPILOT_GITHUB_TOKEN` containing a
fine-grained personal access token (or GitHub App token) with the
**Copilot Requests** permission. This is distinct from the built-in
`GITHUB_TOKEN`. To create one:

1. Go to **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens** ([direct link](https://github.com/settings/personal-access-tokens)).
2. Click **Generate new token**, set a name and expiry, and choose the
   resource owner that has the Copilot subscription.
3. Under **Account permissions**, find **Copilot Requests** and set it to
   **Read and write**. (Account-level, not repository-level — easy to miss.)
4. Save the token and add it to this repo as `COPILOT_GITHUB_TOKEN` under
   **Settings → Secrets and variables → Actions**.

See [GitHub's "Automate Copilot CLI with Actions"
guide](https://docs.github.com/en/copilot/how-tos/copilot-cli/automate-copilot-cli/automate-with-actions)
for the full reference.

The token has a per-account premium-request budget — at
`PR cadence × fixtures × repeats`, that budget is the rate-limit ceiling. Watch
for it if eval volume increases.

CI installs the plugin from the PR checkout (`copilot plugin install
./plugins/frontend-developer`), so behavioural changes on the branch are
exercised before merge. `COPILOT_HOME` is pinned to a per-job temp dir to
prevent any cross-run plugin cache reuse. Once `Evals` is added as a required
status check in branch protection, regressions block merge automatically.

## Contributing

Contributions are welcome from anyone. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide. In short:

1. Open a [plugin proposal issue](.github/ISSUE_TEMPLATE/plugin-proposal.md)
2. Copy `plugins/frontend-developer/` as a template
3. Update the manifest, agent file, and README
4. Add the plugin to `.github/plugin/marketplace.json` (alphabetical order)
5. Run `npm test` and open a PR

This project follows the [Contributor Covenant 2.1](CODE_OF_CONDUCT.md) and accepts contributions under the [Open Government Licence v3.0](LICENSE). To report a security issue, see [SECURITY.md](SECURITY.md).

## References

- [Defra software development standards](https://github.com/DEFRA/software-development-standards)
- [Defra AI SDLC playbook](https://defra.github.io/defra-ai-sdlc/)
- [GitHub Copilot CLI plugin documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing)

## Licence

Open Government Licence v3.0. See [LICENSE](LICENSE).
