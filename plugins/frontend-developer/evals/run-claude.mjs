#!/usr/bin/env node
// Provider script for promptfoo: runs a prompt through Claude Code CLI
// against a clean copy of the eval fixture, captures output + file diffs.
//
// Usage: node run-claude.mjs "<prompt>"
//
// Prerequisites:
//   - Claude Code CLI installed (`npm install -g @anthropic-ai/claude-code`)
//   - ANTHROPIC_API_KEY set in the environment
//   - The frontend-developer plugin installed in claude
//   - Eval-fixture dependencies installed (`npm run evals:frontend:fixture:install`)
//
// Pin the model to keep results comparable across runs.
// Override with CLAUDE_MODEL=<id> for local experimentation.
//
// For iterating on plugin files without `claude plugin install` each time:
//   export CLAUDE_PLUGIN_DIR=/abs/path/to/plugins/frontend-developer
// When set, this script passes `--plugin-dir $CLAUDE_PLUGIN_DIR` to claude.

import { runAgent } from './run-agent.mjs'

runAgent({
  agentLabel: 'CLAUDE',
  binary: 'claude',
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
      'text'
    ]
    if (process.env.CLAUDE_PLUGIN_DIR) {
      args.push('--plugin-dir', process.env.CLAUDE_PLUGIN_DIR)
    }
    return args
  }
})
