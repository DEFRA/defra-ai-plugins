#!/usr/bin/env node
// Provider script for promptfoo: runs a prompt through Copilot CLI against a
// clean copy of the eval fixture, captures output + file diffs.
//
// Usage: node run-copilot.mjs "<prompt>"
//
// Prerequisites:
//   - Copilot CLI installed (`npm install -g @github/copilot`)
//   - The frontend-developer plugin installed:
//       copilot plugin marketplace add DEFRA/defra-ai-plugins
//       copilot plugin install frontend-developer@defra-ai-plugins
//   - Eval-fixture dependencies installed (`npm run evals:frontend:fixture:install`)
//
// Pin the model to keep results comparable across runs.
// Override with COPILOT_MODEL=<id> for local experimentation.

import { mkdtempSync, cpSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { report, snapshotFiles } from './collect-and-report.mjs'

const prompt = process.argv[2]
if (!prompt) {
  console.error('usage: run-copilot.mjs <prompt>')
  process.exit(2)
}

const scriptDir = dirname(fileURLToPath(import.meta.url))
const pluginDir = resolve(scriptDir, '..')
const fixtureSource = join(pluginDir, 'eval-fixture')

const copilotModel = process.env.COPILOT_MODEL ?? 'gpt-5-mini'

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

const copilot = spawnSync(
  'copilot',
  [
    '-p',
    prompt,
    '--agent',
    'frontend-developer:frontend-developer',
    '--model',
    copilotModel,
    '--yolo',
    '--output-format',
    'text'
  ],
  { cwd: workDir, encoding: 'utf8' }
)
const agentOutput = `${copilot.stdout ?? ''}${copilot.stderr ?? ''}`

report({
  agentLabel: 'COPILOT',
  agentOutput,
  snapBefore,
  cwd: workDir,
  tmpAfterPath: snapAfter
})
