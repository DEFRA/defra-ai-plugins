#!/usr/bin/env node
// Drive the PII redaction script with a synthetic hook payload on stdin.
// Returns exit code, stdout (redacted JSON), and stderr.
//
// Unlike defra-shared's run-hook.mjs, this does NOT need a project directory
// or git state — the PII script only reads/writes JSON.

import { readFileSync, accessSync, constants as fsConstants } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, resolve, join, delimiter } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const fixtureDir = resolve(scriptDir, '..')
const pluginDir = resolve(fixtureDir, '..')
const redactScript = join(pluginDir, 'scripts', 'redact_pii.py')

const TIMEOUT_MS = 120_000

// Resolve the executable to an absolute path ourselves instead of letting
// the OS search PATH at spawn time (PATH-hijacking risk, see javascript:S4036).
function resolveExecutable(name) {
  const exts = process.platform === 'win32' ? ['.exe', '.cmd', '.bat', ''] : ['']
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    for (const ext of exts) {
      const candidate = join(dir, name + ext)
      try {
        accessSync(candidate, fsConstants.X_OK)
        return candidate
      } catch {
        // not found in this directory, keep searching
      }
    }
  }
  throw new Error(`Unable to resolve executable '${name}' on PATH`)
}

const uvPath = resolveExecutable('uv')

export function driveHook({ input, args = [] }) {
  const result = spawnSync(uvPath, ['run', redactScript, ...args], {
    input,
    encoding: 'utf8',
    timeout: TIMEOUT_MS,
    env: {
      ...process.env,
      CLAUDE_PLUGIN_ROOT: pluginDir
    }
  })
  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? ''
  }
}

export function preload() {
  const result = spawnSync(uvPath, ['run', redactScript, '--preload'], {
    encoding: 'utf8',
    timeout: TIMEOUT_MS,
    env: {
      ...process.env,
      CLAUDE_PLUGIN_ROOT: pluginDir
    }
  })
  if (result.status !== 0) {
    throw new Error(`Preload failed (exit ${result.status}): ${result.stderr}`)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2).filter(a => a.startsWith('--'))
  const input = readFileSync(0, 'utf8')
  const { exitCode, stdout, stderr } = driveHook({ input, args })
  process.stdout.write(`exit_code: ${exitCode}\n`)
  process.stdout.write('stdout:\n')
  process.stdout.write(stdout)
  process.stdout.write('\nstderr:\n')
  process.stdout.write(stderr)
}
