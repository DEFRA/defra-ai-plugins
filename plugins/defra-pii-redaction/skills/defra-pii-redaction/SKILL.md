---
name: defra-pii-redaction
description: Defra PII redaction — intercepts all LLM interactions (prompts, tool inputs, tool outputs) and redacts UK PII using a Python script before data reaches or leaves the model. Use when the agent is operating in an environment where PII must never appear in LLM context.
license: OGL-UK-3.0
---

# Defra PII redaction

This plugin provides three deterministic guardrail hooks that intercept all data flowing to and from the LLM and redact UK PII using an external Python script.

## What it intercepts

| Hook                | Event              | What happens                                                                                |
| ------------------- | ------------------ | ------------------------------------------------------------------------------------------- |
| `pii-redact-prompt` | `UserPromptSubmit` | Prompts containing PII are **blocked** — Claude Code cannot replace prompt text, only block |
| `pii-redact-pre`    | `PreToolUse`       | PII in tool inputs is redacted before the tool executes                                     |
| `pii-redact-post`   | `PostToolUse`      | PII in tool outputs is redacted before the results are fed back into LLM context            |

All three hooks are **synchronous and blocking** — execution does not proceed until redaction is complete.

### UserPromptSubmit behaviour

Claude Code's hook API does not support replacing prompt text. When a prompt contains PII, the hook returns `{"decision": "block"}` with a human-readable reason asking the user to rephrase without personal data. Clean prompts exit 0 with no output and proceed normally.

## The redaction script

Redaction is delegated to `scripts/redact_pii.py` inside the plugin directory. The script:

- Reads raw JSON from stdin (the full hook payload)
- Detects the event type from the payload shape
- For `UserPromptSubmit`: returns a block decision if PII is detected; exits 0 silently for clean prompts
- For `PreToolUse`: returns `hookSpecificOutput.updatedInput` with PII replaced; exits 0 silently for clean inputs
- For `PostToolUse`: returns `hookSpecificOutput.updatedToolOutput` with PII replaced; exits 0 silently for clean outputs
- Exits 0 on success, non-zero on failure

The plugin resolves the script path using `${PLUGIN_ROOT:-$CLAUDE_PLUGIN_ROOT}`. Copilot CLI sets `PLUGIN_ROOT` and Claude Code sets `CLAUDE_PLUGIN_ROOT` automatically to the plugin's install directory; the fallback lets the same hook command work on either host. If the script cannot be found, the hook degrades gracefully by passing the data through unmodified.

> **Windows note:** hook commands use POSIX shell parameter expansion (`${PLUGIN_ROOT:-$CLAUDE_PLUGIN_ROOT}`), so both Copilot CLI and Claude Code must invoke them through a POSIX-compatible shell (e.g. Git Bash or WSL). Under a native `cmd.exe`/PowerShell session without such a shell available, the variable will not expand, `uv run` will fail to find the script, and the hook will silently degrade to pass-through (no redaction, no error).

## Prerequisites

- Python 3 available on `PATH`
- `jq` available on `PATH`

## Anti-patterns this plugin guards against

- PII (names, NI numbers, NHS numbers, postcodes, dates of birth, email addresses, phone numbers) reaching the LLM in prompts or tool inputs
- PII appearing in LLM-visible tool output (e.g. file reads, shell command output, API responses)
- PII being logged or persisted via tool use after it has passed through the model
