---
name: defra-pii-redaction
description: Defra PII redaction — intercepts all LLM interactions (prompts, tool inputs, tool outputs) and redacts UK PII using a Python script before data reaches or leaves the model. Use when the agent is operating in an environment where PII must never appear in LLM context.
license: OGL-UK-3.0
---

# Defra PII redaction

This plugin provides three deterministic guardrail hooks that intercept all data flowing to and from the LLM and redact UK PII using an external Python script.

## What it intercepts

| Hook                | Event              | What is redacted                                           |
| ------------------- | ------------------ | ---------------------------------------------------------- |
| `pii-redact-prompt` | `UserPromptSubmit` | User prompt text before it reaches the LLM                 |
| `pii-redact-pre`    | `PreToolUse`       | All tool inputs before the tool executes                   |
| `pii-redact-post`   | `PostToolUse`      | All tool outputs before they are fed back into LLM context |

All three hooks are **synchronous and blocking** — execution does not proceed until redaction is complete.

## The redaction script

Redaction is delegated to `scripts/redact_pii.py` inside the plugin directory. The script:

- Reads raw JSON from stdin (the full hook payload)
- Writes a redacted version of the same structure to stdout
- Exits 0 on success, non-zero on failure

The plugin resolves the script path using the `${CLAUDE_PLUGIN_ROOT}` environment variable, which the host app (Copilot CLI or Claude Code) sets automatically to the plugin's install directory. If the script cannot be found, the hook degrades gracefully by passing the data through unmodified.

> **Windows note:** hook commands use POSIX shell parameter expansion (`${CLAUDE_PLUGIN_ROOT}`), so both Copilot CLI and Claude Code must invoke them through a POSIX-compatible shell (e.g. Git Bash or WSL). Under a native `cmd.exe`/PowerShell session without such a shell available, the variable will not expand, `uv run` will fail to find the script, and the hook will silently degrade to pass-through (no redaction, no error).

## Prerequisites

- Python 3 available on `PATH`
- `jq` available on `PATH`

## Anti-patterns this plugin guards against

- PII (names, NI numbers, NHS numbers, postcodes, dates of birth, email addresses, phone numbers) reaching the LLM in prompts or tool inputs
- PII appearing in LLM-visible tool output (e.g. file reads, shell command output, API responses)
- PII being logged or persisted via tool use after it has passed through the model
