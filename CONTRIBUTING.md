# Contributing to defra-ai-plugins

Thanks for your interest in contributing. This repository is the Defra GitHub Copilot CLI plugin marketplace. It ships agents and skills that encode Defra software development standards, the GOV.UK Design System, and GDS service standards so Copilot produces compliant code by default.

Anyone can propose and contribute a plugin. All changes go through GitHub pull requests and are reviewed by the Defra AI dev team.

## How the marketplace is organised

```
defra-ai-plugins/
├── .github/
│   ├── plugin/
│   │   └── marketplace.json          # the registry — every plugin must be listed here
│   └── workflows/
│       └── validate.yml              # CI: runs the validators on every PR
├── schemas/
│   ├── marketplace.schema.json
│   └── plugin.schema.json
├── scripts/                          # Node.js validators
└── plugins/
    └── <plugin-name>/
        ├── plugin.json               # plugin manifest
        ├── README.md                 # plugin docs and install commands
        └── agents/
            └── <plugin-name>.agent.md
```

Each plugin is a self-contained directory under `plugins/`. The marketplace registry (`.github/plugin/marketplace.json`) lists every plugin and is the source of truth for what's installable.

## Adding a new plugin

1. **Open a plugin proposal issue first.** Use the "Plugin proposal" issue template. This avoids duplicate work and gives the AI dev team a chance to flag any concerns before you put effort in.

2. **Fork the repo and create a branch.** Use the conventional naming `feature/<plugin-name>` or `feature/<short-description>`.

3. **Copy `plugins/frontend-developer/` as a template.** Rename the folder to `plugins/<your-plugin-name>/`.

4. **Edit the manifest.** Update `plugins/<your-plugin-name>/plugin.json`:
   - `name` must match the directory name (kebab-case, ≤50 characters)
   - `description` is one sentence (≤500 characters)
   - `version` is `0.1.0` for a new plugin
   - `author`, `license` (`OGL-UK-3.0`), `homepage`, `repository`, `keywords`, `category` as appropriate

5. **Edit the entry-point file.** Rename `agents/frontend-developer.agent.md` to match your plugin and rewrite the body. The validators support three entry-point formats — pick the one that matches your target CLI:
   - **Copilot custom agent** — `agents/<your-plugin-name>.agent.md`. Frontmatter must include `description` and a non-empty `tools` array.
   - **Claude Code agent** — `agents/<your-plugin-name>.md` (no `.agent` infix). Frontmatter must include `description`. `tools` is optional but, if present, must be an array of strings.
   - **Skill** (works for Claude Code, Codex, and Copilot CLI) — `skills/<your-plugin-name>/SKILL.md`. Frontmatter must include `name` (matching the parent directory) and `description`.

6. **Edit the plugin README.** Update `plugins/<your-plugin-name>/README.md` with what the plugin does, when to switch to it, and the install commands.

7. **Register the plugin.** Add an entry to `.github/plugin/marketplace.json`. Keep the `plugins` array sorted alphabetically by `name`. The validator will fail if it isn't.

8. **Run the validators locally:**

   ```sh
   npm install     # first time only
   npm test
   ```

   All checks must pass before opening a PR.

9. **Open a pull request** using the PR template and fill in the checklist.

## Naming conventions

- Plugin names: kebab-case, lowercase letters / digits / hyphens, ≤50 characters
- Plugin directory name = `plugin.json#name` = `marketplace.json` entry name
- Entry-point file naming follows the chosen format (see step 5 above)

## Validation rules

The CI workflow runs four checks. All must pass:

| Check                     | What it enforces                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------ |
| `marketplace.json` schema | Required fields, kebab-case names, no duplicates, source paths start with `plugins/` |
| `plugin.json` schema      | Required fields per plugin; name matches directory and marketplace entry             |
| Entry-point frontmatter   | Per-format frontmatter rules (Copilot agent, Claude agent, or skill)                 |
| Alphabetical sort         | Marketplace plugins sorted by name                                                   |

To auto-fix sorting:

```sh
npm run validate:fix
```

## Licence

By contributing, you agree that your contribution is licensed under the [Open Government Licence v3.0](LICENSE), the default Defra licence.

## Code of Conduct

This project follows the [Contributor Covenant v2.1](CODE_OF_CONDUCT.md). Please be respectful and constructive in all interactions.

## Reporting security issues

Do NOT open a public issue for security vulnerabilities. See [SECURITY.md](SECURITY.md) for the disclosure process.

## Questions

Open an issue tagged `question` or contact the AI dev team at `AICapabilitiesEnablement@defra.gov.uk`.
