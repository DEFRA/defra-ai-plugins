#!/usr/bin/env node
// Discover and run every hook unit test under plugins/*/hooks/scripts/*.test.mjs.
// Uses node:fs glob so the path resolution is shell-agnostic (no reliance on
// bash/zsh glob expansion that would fail under Windows cmd).

import { glob } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'

const files = []
for await (const file of glob('plugins/*/hooks/scripts/*.test.mjs')) {
  files.push(file)
}

if (files.length === 0) {
  console.log('No hook tests found.')
  process.exit(0)
}

const result = spawnSync('node', ['--test', '--test-reporter=spec', ...files], {
  stdio: 'inherit'
})
process.exit(result.status ?? 1)
