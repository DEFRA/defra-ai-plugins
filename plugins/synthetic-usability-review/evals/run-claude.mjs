#!/usr/bin/env node
// Provider script for promptfoo: runs a prompt through Claude Code CLI with
// this plugin loaded, and prints what it says.
//
// Usage: node run-claude.mjs "<prompt>"
//
// Prerequisites:
//   - Claude Code CLI installed and signed in
//   - On Windows with an npm install, CLAUDE_BIN set to claude.exe (see below)
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

// The prompt goes in on stdin, so a prompt starting with '-' is never read as
// a flag. No shell is used. If Windows cannot start claude because npm
// installed it as a .cmd file, set CLAUDE_BIN to the full path of claude.exe.
const binary = process.env.CLAUDE_BIN ?? 'claude'
const result = spawnSync(
  binary,
  ['-p', '--model', model, '--output-format', 'text', '--plugin-dir', pluginDir],
  { encoding: 'utf8', input: prompt }
)

if (result.error) {
  console.error(
    `could not start ${binary}: ${result.error.message}. Set CLAUDE_BIN to its full path.`
  )
  process.exit(1)
}
const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
if (output.trim() === '') {
  console.error(`claude returned nothing (exit code ${result.status})`)
  process.exit(1)
}
process.stdout.write(output)
