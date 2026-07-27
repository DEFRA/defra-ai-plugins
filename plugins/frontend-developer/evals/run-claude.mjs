#!/usr/bin/env node
// Provider script for promptfoo: runs a prompt through Claude Code CLI
// against a clean copy of the eval fixture, captures output + file diffs.
//
// Usage: node run-claude.mjs "<prompt>"
//
// Prerequisites:
//   - Claude Code CLI installed (`npm install -g @anthropic-ai/claude-code`)
//   - The CLI authenticated. A subscription login (`claude` / `/login`) is
//     enough — no API key required. If ANTHROPIC_API_KEY is set the CLI uses it
//     (API billing) instead; it is optional, not required.
//   - The frontend-developer plugin installed in claude
//   - Eval-fixture dependencies installed (`npm run evals:frontend:fixture:install`)
//
// Pin the model to keep results comparable across runs.
// Override with CLAUDE_MODEL=<id> for local experimentation.
//
// The eval tests THIS repo's plugin, so we always load it via `--plugin-dir` —
// otherwise claude runs with no governance hooks and the adversarial
// forbidden-tech fixtures aren't blocked (the model just answers them). By
// default we point at the local plugin root (no `claude plugin install` needed);
// override with CLAUDE_PLUGIN_DIR=/abs/path to test a different copy.

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runAgent } from './run-agent.mjs'
import { parseClaudeOutput } from './parse-claude-output.mjs'

const pluginDir =
  process.env.CLAUDE_PLUGIN_DIR ?? resolve(dirname(fileURLToPath(import.meta.url)), '..')

runAgent({
  agentLabel: 'CLAUDE',
  binary: 'claude',
  // JSON output (not text) so we can detect a hook-blocked prompt — claude
  // reports it as num_turns:0 with an empty result and does not echo the hook's
  // refusal banner. parseClaudeOutput recovers the banner on that path.
  parseOutput: parseClaudeOutput,
  buildArgs: (prompt) => {
    const model = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6'
    const args = [
      '-p',
      prompt,
      '--model',
      model,
      '--permission-mode',
      'bypassPermissions',
      '--output-format',
      'json',
      '--plugin-dir',
      pluginDir
    ]
    return args
  }
})
