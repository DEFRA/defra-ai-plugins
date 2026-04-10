# defra-ai-plugins

[![Validate](https://github.com/DEFRA/defra-ai-plugins/actions/workflows/validate.yml/badge.svg)](https://github.com/DEFRA/defra-ai-plugins/actions/workflows/validate.yml)

A marketplace of [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing) plugins for Defra. Each plugin ships agents and skills that encode Defra's software development standards, the GOV.UK Design System, and GDS service standards so Copilot produces compliant code by default.

> Cross-CLI support (Claude Code, OpenAI Codex) is planned for a future iteration. For now, this marketplace targets GitHub Copilot CLI only.

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
│       └── validate.yml              # CI: runs validators on every PR
├── schemas/
│   ├── marketplace.schema.json       # JSON Schema for marketplace.json
│   └── plugin.schema.json            # JSON Schema for plugin manifests
├── scripts/                          # Node.js validators
└── plugins/
    └── frontend-developer/
        ├── plugin.json               # Plugin manifest
        ├── README.md
        └── agents/
            └── frontend-developer.agent.md
```

Each plugin lives in its own directory under `plugins/` with a `plugin.json` manifest and an `agents/` directory containing one or more Copilot custom agents.

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
