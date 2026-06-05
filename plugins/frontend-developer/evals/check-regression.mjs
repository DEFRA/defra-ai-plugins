#!/usr/bin/env node
// Regression gate: compare a new promptfoo result file against the committed
// baseline and exit non-zero if any test that PASSED in the baseline now fails.
//
// Usage: node check-regression.mjs <new-results.json> [baseline.json]
//
// Tests are matched by prompt text (descriptions are not always populated in
// promptfoo's JSON output). New tests added since the baseline are ignored
// by this gate — promptfoo's own exit code already fails the run on any
// fixture failure, so new fixtures get gated from their first appearance.

import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Build a per-prompt success map from a parsed promptfoo result object.
 * A prompt is "passing" only if every provider that ran it passed — with
 * multiple providers a regression on any one fails the gate.
 *
 * @param {object} data - Parsed promptfoo JSON result object.
 * @returns {Map<string, boolean>} Map of prompt text → overall pass status.
 */
export function buildPromptPassMap(data) {
  const byPrompt = new Map()
  for (const r of data.results?.results ?? []) {
    const prompt = r.vars?.prompt
    if (prompt === undefined) {
      continue
    }
    const arr = byPrompt.get(prompt) ?? []
    arr.push(r.success === true)
    byPrompt.set(prompt, arr)
  }
  const out = new Map()
  for (const [prompt, arr] of byPrompt) {
    out.set(prompt, arr.every(Boolean))
  }
  return out
}

/**
 * Given baseline and fresh pass-maps, list prompts that passed in the baseline
 * but are now missing or failing. Newly-added prompts are intentionally
 * ignored — promptfoo's own exit code already gates new fixtures from their
 * first appearance.
 *
 * @param {Map<string, boolean>} baseline - Pass-map built from the committed baseline results.
 * @param {Map<string, boolean>} fresh - Pass-map built from the current run's results.
 * @returns {string[]} Human-readable regression descriptions; empty means no regressions.
 */
export function findRegressions(baseline, fresh) {
  const regressions = []
  for (const [prompt, basePassed] of baseline) {
    if (!basePassed) {
      continue
    }
    if (!fresh.has(prompt)) {
      regressions.push(`MISSING: ${prompt}`)
    } else if (!fresh.get(prompt)) {
      regressions.push(`FAIL: ${prompt}`)
    }
  }
  return regressions
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , newPath, baselineArg] = process.argv
  if (!newPath) {
    console.error('usage: check-regression.mjs <new-results.json> [baseline.json]')
    process.exit(2)
  }

  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const baselinePath = baselineArg ?? join(scriptDir, 'baseline', 'promptfoo-results.json')

  if (!existsSync(resolve(newPath))) {
    console.error(`::error::New results file not found: ${newPath}`)
    process.exit(2)
  }
  if (!existsSync(baselinePath)) {
    console.error(`::error::Baseline file not found: ${baselinePath}`)
    process.exit(2)
  }

  const baseline = buildPromptPassMap(JSON.parse(readFileSync(baselinePath, 'utf8')))
  const fresh = buildPromptPassMap(JSON.parse(readFileSync(newPath, 'utf8')))

  const regressions = findRegressions(baseline, fresh)

  if (regressions.length === 0) {
    console.log('No regressions vs baseline.')
    process.exit(0)
  }

  console.error(`::error::${regressions.length} regression(s) vs baseline:`)
  for (const r of regressions) {
    console.error(`  ${r}`)
  }
  process.exit(1)
}
