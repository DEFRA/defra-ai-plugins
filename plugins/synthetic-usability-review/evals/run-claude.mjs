#!/usr/bin/env node
// Provider script for promptfoo: runs a prompt through Claude Code CLI with
// this plugin loaded, and prints what it says.
//
// Usage: node run-claude.mjs "<prompt>"
//
// Prerequisites:
//   - Claude Code CLI installed and signed in
//
// The plugin is loaded with --plugin-dir, so nothing needs installing.
// Pin the model to keep results comparable. Override with CLAUDE_MODEL=<id>.

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const prompt = process.argv[2]
if (!prompt) {
  console.error('usage: run-claude.mjs <prompt>')
  process.exit(2)
}

const pluginDir =
  process.env.CLAUDE_PLUGIN_DIR ?? resolve(dirname(fileURLToPath(import.meta.url)), '..')
const model = process.env.CLAUDE_MODEL ?? 'claude-sonnet-5'

// The prompt goes in on stdin, not as an argument, so no shell ever reads it.
// Windows needs a shell to start claude.cmd, and the shell joins arguments
// with spaces, so the plugin path is quoted.
const onWindows = process.platform === 'win32'
const result = spawnSync(
  'claude',
  [
    '-p',
    '--model',
    model,
    '--output-format',
    'text',
    '--plugin-dir',
    onWindows ? `"${pluginDir}"` : pluginDir
  ],
  { encoding: 'utf8', input: prompt, shell: onWindows }
)

if (result.error) {
  console.error(`could not start claude: ${result.error.message}`)
  process.exit(1)
}
process.stdout.write(`${result.stdout ?? ''}${result.stderr ?? ''}`)
