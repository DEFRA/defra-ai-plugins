#!/usr/bin/env node
// Ensure promptfoo's better-sqlite3 native binding is built for the active
// Node version. Idempotent — a no-op once the binding file exists. Needed on
// Node 24, where better-sqlite3 12.x has no prebuilt binary yet and `npm
// install` may complete without compiling one from source.
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, dirname } from 'node:path'

const NPX_BIN = join(dirname(process.execPath), 'npx')

const binding = 'node_modules/better-sqlite3/build/Release/better_sqlite3.node'

if (existsSync(binding)) {
  process.exit(0)
}

const result = spawnSync(NPX_BIN, ['node-gyp', 'rebuild'], {
  cwd: 'node_modules/better-sqlite3',
  stdio: 'inherit'
})
process.exit(result.status ?? 1)
