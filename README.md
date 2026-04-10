# defra-ai-plugins

A marketplace of [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing) plugins for Defra. Each plugin ships agents and skills that encode Defra's software development standards, the GOV.UK Design System, and GDS service standards so Copilot produces compliant code by default.

> Cross-CLI support (Claude Code, OpenAI Codex) is planned for a future iteration. For now, this marketplace targets GitHub Copilot CLI only.

## Add this marketplace

```sh
copilot plugin marketplace add DEFRA/defra-ai-plugins
```

## Plugins

| Plugin | Description | Install |
|---|---|---|
| [`frontend-developer`](plugins/frontend-developer) | Builds Defra-compliant frontends following the GOV.UK Design System, WCAG 2.2 AA, and Defra software development standards (Hapi + Nunjucks + SCSS + Vitest). | `copilot plugin install frontend-developer@defra-ai-plugins` |

## Repository layout

```
defra-ai-plugins/
├── .github/
│   └── plugin/
│       └── marketplace.json          # Copilot CLI marketplace registry
└── plugins/
    └── frontend-developer/
        ├── plugin.json               # Plugin manifest
        ├── README.md
        └── agents/
            └── frontend-developer.agent.md
```

Each plugin lives in its own directory under `plugins/` with a `plugin.json` manifest and an `agents/` directory containing one or more Copilot custom agents.

## Contributing

Contributions are welcome. To add a new plugin:

1. Create `plugins/<plugin-name>/` with a `plugin.json` and a `README.md`
2. Add the agent file at `plugins/<plugin-name>/agents/<plugin-name>.agent.md`
3. Register the plugin in `.github/plugin/marketplace.json`
4. Add a row to the table above

A `CONTRIBUTING.md` with full guidance is on the roadmap.

## References

- [Defra software development standards](https://github.com/DEFRA/software-development-standards)
- [Defra AI SDLC playbook](https://defra.github.io/defra-ai-sdlc/)
- [GitHub Copilot CLI plugin documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing)

## Licence

Open Government Licence v3.0. See [LICENSE](LICENSE).
