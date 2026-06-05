#!/usr/bin/env node
// Warn when test-runner output reports coverage below the floor (default 80%).
// Try the structured "All files" / "TOTAL" row first; fall back to the first
// stand-alone percentage only if that row isn't present.

import { fileURLToPath } from 'node:url'
import { runHook } from './hook-runner.mjs'

const DEFAULT_COVERAGE_FLOOR = 80

function extractCoverage(output) {
  const rowLine = output.split('\n').find((line) => /^\s*(All files|TOTAL)/i.test(line))
  if (rowLine) {
    const rowMatch = /\d{2,3}(?:\.\d{1,2})?|\d\.\d{1,2}/.exec(rowLine)
    if (rowMatch) {
      return rowMatch[0]
    }
  }
  const m = /(\d{1,3}(?:\.\d{1,2})?)\s*%/.exec(output)
  return m ? m[1] : undefined
}

/**
 * Warn when a test-runner command's output reports coverage below the floor.
 * Non-blocking (always returns exitCode 0); emits a stderr warning only.
 *
 * @param {{ tool_input?: { command?: string }, tool_response?: { stdout?: string, output?: string } }} input - Copilot hook tool-use payload.
 * @param {Record<string, string | undefined>} [env] - Environment variables; reads `COVERAGE_FLOOR` (default 80).
 * @returns {{ exitCode: number, stderr?: string }}
 */
export function check(input, env = {}) {
  const cmd = input.tool_input?.command ?? ''
  const output = input.tool_response?.stdout ?? input.tool_response?.output ?? ''

  if (!/\b(test|vitest|jest|pytest|dotnet test)\b/.test(cmd)) {
    return { exitCode: 0 }
  }

  const threshold = Number(env.COVERAGE_FLOOR ?? DEFAULT_COVERAGE_FLOOR)

  const pct = extractCoverage(output)
  if (pct === undefined) {
    return { exitCode: 0 }
  }

  const value = Number.parseFloat(pct)
  if (value < threshold) {
    return {
      exitCode: 0,
      stderr: `coverage-floor: coverage ${pct}% is below the ${threshold}% threshold. Add tests for the changed files before merging. See skill defra-quality-gates.\n`
    }
  }

  return { exitCode: 0 }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runHook((input) => check(input, process.env))
}
