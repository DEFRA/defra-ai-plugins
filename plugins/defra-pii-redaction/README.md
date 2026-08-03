# defra-pii-redaction

A Copilot CLI / Claude Code plugin that intercepts **all LLM interactions** — user prompts, tool inputs, and tool outputs — and redacts UK PII before data reaches or leaves the model.

Unlike the advisory `pii-scan` hook in `defra-shared` (which warns after a file is written), this plugin is a **hard synchronous interceptor**: every interaction is redacted before proceeding, and the operation is blocked if redaction fails.

## What it provides

**One skill:**

- `defra-pii-redaction` — describes what the plugin does and how redaction is configured.

**Three hooks (all synchronous, blocking):**

| Hook                | Event              | Matcher       | What it does                                                                                      |
| ------------------- | ------------------ | ------------- | ------------------------------------------------------------------------------------------------- |
| `pii-redact-prompt` | `UserPromptSubmit` | (all prompts) | Blocks prompts that contain PII — Claude Code cannot replace prompt text, only block it           |
| `pii-redact-pre`    | `PreToolUse`       | (all tools)   | Redacts PII from tool inputs before the tool executes (via `hookSpecificOutput.updatedInput`)     |
| `pii-redact-post`   | `PostToolUse`      | (all tools)   | Redacts PII from tool outputs before they reach the model (via `hookSpecificOutput.updatedToolOutput`) |

### UserPromptSubmit behaviour

Claude Code's hook API does not support replacing prompt text — a `UserPromptSubmit` hook can only **block** a prompt or add context. When a submitted prompt contains PII, this hook returns `{"decision": "block"}` with a human-readable reason, preventing the prompt from reaching the model. Clean prompts (no PII detected) exit 0 with no output and proceed normally.

## The redaction script

Redaction is delegated to `scripts/redact_pii.py` inside the plugin directory. The hooks resolve the script at:

```
${PLUGIN_ROOT:-$CLAUDE_PLUGIN_ROOT}/scripts/redact_pii.py
```

Copilot CLI sets `PLUGIN_ROOT` and Claude Code sets `CLAUDE_PLUGIN_ROOT` automatically to the plugin's install directory — the hook commands fall back from one to the other so they work unmodified on either host. You don't need to set either yourself.

If the script is not found, all hooks degrade gracefully (pass through without redacting). If the script exits non-zero, the hook blocks the operation and surfaces the error.

> **Windows note:** hook commands use POSIX shell parameter expansion (`${PLUGIN_ROOT:-$CLAUDE_PLUGIN_ROOT}`), so both Copilot CLI and Claude Code must invoke them through a POSIX-compatible shell (e.g. Git Bash or WSL). Under a native `cmd.exe`/PowerShell session without such a shell available, the variable will not expand, `uv run` will fail to find the script, and the hook will silently degrade to pass-through (no redaction, no error). Ensure Git Bash or WSL is on `PATH` when running on Windows.

## Model preload

On first use, `uv run` must install the script's dependencies (presidio, spaCy) and the script must download the `en_core_web_sm` spaCy model wheel from GitHub Releases — a one-time step that can add several seconds of latency to the first hook invocation.

Run the preload command once after installation to perform this work upfront. `PLUGIN_ROOT`/`CLAUDE_PLUGIN_ROOT` is only set automatically when the host invokes a hook, so for a manual run substitute your actual plugin install directory (find it with `copilot plugin list` or `/plugin list`, or check `~/.copilot/plugins/defra-pii-redaction` / `~/.claude/plugins/defra-pii-redaction`):

```sh
uv run "/path/to/defra-pii-redaction/scripts/redact_pii.py" --preload
```

What `--preload` does:

1. Downloads `en_core_web_sm-3.8.0` wheel from GitHub Releases (skipped if already cached).
2. Verifies the wheel against a pinned SHA-256.
3. Extracts the model into the cache directory.
4. Warms up the presidio analyser and anonymiser engines.
5. Exits cleanly — no stdin is read.

The wheel and extracted model are cached at:

```
${XDG_CACHE_HOME:-$HOME/.cache}/defra-pii-redaction/
```

Subsequent `uv run` invocations reuse the cached model and the pre-built `uv` virtual environment, so hook latency is minimal after the first preload.

## Prerequisites

- uv available on `PATH`
- `jq` available on `PATH`

## Install

From the marketplace:

```sh
copilot plugin marketplace add DEFRA/defra-ai-plugins
copilot plugin install defra-pii-redaction@defra-ai-plugins
```

For Claude Code, run these inside an interactive session:

```text
/plugin marketplace add DEFRA/defra-ai-plugins
/plugin install defra-pii-redaction@defra-ai-plugins
```

From a local checkout (for development):

```sh
copilot plugin install ./plugins/defra-pii-redaction
```

## Licence

Open Government Licence v3.0. See [LICENSE](../../LICENSE).
