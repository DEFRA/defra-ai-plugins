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

import { mkdtempSync, cpSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { report, snapshotFiles } from './collect-and-report.mjs'

const prompt = process.argv[2]
if (!prompt) {
  console.error('usage: run-claude.mjs <prompt>')
  process.exit(2)
}

const scriptDir = dirname(fileURLToPath(import.meta.url))
const pluginDir = resolve(scriptDir, '..')
const fixtureSource = join(pluginDir, 'eval-fixture')

const claudeModel = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6'

const workDir = mkdtempSync(join(tmpdir(), 'frontend-developer-eval-'))
const snapBefore = join(workDir, '.snap-before')
const snapAfter = join(workDir, '.snap-after')

const onExit = () => {
  rmSync(workDir, { recursive: true, force: true })
}
process.on('exit', onExit)
process.on('SIGINT', () => process.exit(130))
process.on('SIGTERM', () => process.exit(143))

cpSync(fixtureSource, workDir, { recursive: true })
snapshotFiles(snapBefore, workDir)

const args = [
  '-p',
  prompt,
  '--model',
  claudeModel,
  '--permission-mode',
  'bypassPermissions',
  '--output-format',
  'text'
]
if (process.env.CLAUDE_PLUGIN_DIR) {
  args.push('--plugin-dir', process.env.CLAUDE_PLUGIN_DIR)
}

const claude = spawnSync('claude', args, { cwd: workDir, encoding: 'utf8' })
const agentOutput = `${claude.stdout ?? ''}${claude.stderr ?? ''}`

report({
  agentLabel: 'CLAUDE',
  agentOutput,
  snapBefore,
  cwd: workDir,
  tmpAfterPath: snapAfter
})
