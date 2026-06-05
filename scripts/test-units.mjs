#!/usr/bin/env node
// Discover and run every plugin unit test (node:test, *.test.mjs) under the
// hook scripts and eval harnesses. Uses node:fs glob over explicit patterns so
// path resolution is shell-agnostic (no reliance on bash/zsh glob expansion
// that would fail under Windows cmd) and never descends into node_modules.

import { glob } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'

const PATTERNS = [
  'plugins/*/hooks/scripts/*.test.mjs',
  'plugins/*/evals/*.test.mjs',
  'plugins/*/eval-fixture/scripts/*.test.mjs'
]

const files = []
for (const pattern of PATTERNS) {
  for await (const file of glob(pattern)) {
    files.push(file)
  }
}
files.sort((a, b) => a.localeCompare(b))

if (files.length === 0) {
  console.log('No unit tests found.')
  process.exit(0)
}

const result = spawnSync(
  'node',
  ['--test', '--test-reporter=spec', '--experimental-test-coverage', ...files],
  { stdio: 'inherit' }
)
process.exit(result.status ?? 1)
