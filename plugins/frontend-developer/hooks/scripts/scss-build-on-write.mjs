#!/usr/bin/env node
// Async, non-blocking. Re-run `npm run build` after a .scss change and
// emit the last 5 lines of its output to stderr.

import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

let input = {}
try {
  input = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  process.exit(0)
}

const TAIL_LINE_COUNT = 5

const file = input.tool_input?.file_path ?? ''
const cwd = process.env.CLAUDE_PROJECT_DIR
if (!cwd || !file.endsWith('.scss') || !existsSync(file)) {
  process.exit(0)
}

const result = spawnSync('npm', ['run', 'build'], { cwd, encoding: 'utf8' })
const combined = `${result.stdout ?? ''}${result.stderr ?? ''}`
const lines = combined.split('\n').filter(Boolean).slice(-TAIL_LINE_COUNT)
if (lines.length) {
  process.stderr.write(lines.join('\n') + '\n')
}
process.exit(0)
