// Shared entry point for hook scripts. Reads the hook payload from stdin, runs
// `fn(input)`, writes any returned stderr, and exits with the returned code.
// Malformed or empty stdin is a no-op (exit 0), matching Claude Code's
// best-effort hook contract.

import { readFileSync } from 'node:fs'

export function runHook(fn) {
  let input = {}
  try {
    input = JSON.parse(readFileSync(0, 'utf8'))
  } catch {
    process.exit(0)
  }
  const { exitCode, stderr } = fn(input)
  if (stderr) {
    process.stderr.write(stderr)
  }
  process.exit(exitCode)
}
