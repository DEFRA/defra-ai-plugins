#!/usr/bin/env node
// Drive a single hook script with a synthetic Claude Code hook input on
// stdin. Prints the hook's exit code and any stderr output in a parseable
// format.
//
// Usage: node run-hook.mjs <hook-id> [project-dir]
//
// If [project-dir] is omitted, the hook runs with CLAUDE_PROJECT_DIR set to
// a fresh staging copy of eval-fixture/ (created via init-git.mjs).

import { readFileSync, rmSync } from 'node:fs'
import { spawnSync, execFileSync } from 'node:child_process'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const fixtureDir = resolve(scriptDir, '..')
const pluginDir = resolve(fixtureDir, '..')

export function driveHook({ hookId, input, projectDir }) {
  let stage = projectDir
  let cleanup = ''
  if (!stage) {
    stage = execFileSync('node', [join(scriptDir, 'init-git.mjs')], {
      encoding: 'utf8'
    }).trim()
    cleanup = stage
  }
  const hookScript = join(pluginDir, 'hooks', 'scripts', `${hookId}.mjs`)
  const result = spawnSync('node', [hookScript], {
    cwd: stage,
    input,
    encoding: 'utf8',
    env: {
      ...process.env,
      CLAUDE_PROJECT_DIR: stage,
      CLAUDE_PLUGIN_ROOT: pluginDir
    }
  })
  if (cleanup) {
    rmSync(cleanup, { recursive: true, force: true })
  }
  return { exitCode: result.status ?? 1, stderr: result.stderr ?? '' }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [hookId, explicitProjectDir] = process.argv.slice(2)
  if (!hookId) {
    console.error('usage: run-hook.mjs <hook-id> [project-dir]')
    process.exit(2)
  }
  const input = readFileSync(0, 'utf8')
  const { exitCode, stderr } = driveHook({
    hookId,
    input,
    projectDir: explicitProjectDir
  })
  process.stdout.write(`=== HOOK ${hookId} ===\n`)
  process.stdout.write(`exit_code: ${exitCode}\n`)
  process.stdout.write('stderr:\n')
  process.stdout.write(stderr)
}
