// Shared launcher for the promptfoo provider scripts (run-claude, run-copilot).
// Copies the eval fixture to a temp dir, snapshots files before/after, runs the
// agent CLI, and reports the output + file diff. The per-provider scripts supply
// the binary name, a label, and a `buildArgs(prompt)` callback because the CLI
// argument shapes differ between agents.

import { mkdtempSync, cpSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { report, snapshotFiles } from './collect-and-report.mjs'

export function runAgent({ agentLabel, binary, buildArgs }) {
  const prompt = process.argv[2]
  if (!prompt) {
    console.error(`usage: run-${binary}.mjs <prompt>`)
    process.exit(2)
  }

  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const fixtureSource = join(resolve(scriptDir, '..'), 'eval-fixture')

  const workDir = mkdtempSync(join(tmpdir(), 'frontend-developer-eval-'))
  const snapBefore = join(workDir, '.snap-before')
  const snapAfter = join(workDir, '.snap-after')

  process.on('exit', () => rmSync(workDir, { recursive: true, force: true }))
  process.on('SIGINT', () => process.exit(130))
  process.on('SIGTERM', () => process.exit(143))

  cpSync(fixtureSource, workDir, { recursive: true })
  snapshotFiles(snapBefore, workDir)

  const result = spawnSync(binary, buildArgs(prompt), { cwd: workDir, encoding: 'utf8' })
  const agentOutput = `${result.stdout ?? ''}${result.stderr ?? ''}`

  report({ agentLabel, agentOutput, snapBefore, cwd: workDir, tmpAfterPath: snapAfter })
}
