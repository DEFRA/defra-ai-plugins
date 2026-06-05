#!/usr/bin/env node
// Async, non-blocking. Auto-lint + auto-format JavaScript files after an
// Edit/Write. Failures are swallowed: this is best-effort housekeeping,
// not a quality gate.

import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, dirname } from 'node:path'

const NPM_BIN = join(dirname(process.execPath), 'npm')

let input = {}
try {
  input = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  process.exit(0)
}

const file = input.tool_input?.file_path ?? ''
const cwd = process.env.CLAUDE_PROJECT_DIR
if (!cwd || !/\.(js|mjs)$/.test(file)) {
  process.exit(0)
}

spawnSync(NPM_BIN, ['run', 'lint', '--', '--fix', file], { cwd, stdio: 'ignore' })
spawnSync(NPM_BIN, ['run', 'format:fix', '--', file], { cwd, stdio: 'ignore' })
process.exit(0)
