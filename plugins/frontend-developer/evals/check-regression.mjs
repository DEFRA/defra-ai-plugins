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
import { dirname, resolve, join, relative, isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Resolve `filePath` and ensure it does not escape the current working
 * directory. Prevents an LLM-driven CLI invocation from reading or
 * overwriting arbitrary files via a path-traversal argument.
 *
 * @param {string} filePath - Untrusted path supplied via CLI argument.
 * @returns {string} The resolved, validated absolute path.
 */
function safePath(filePath) {
  const baseDir = process.cwd()
  const resolved = resolve(baseDir, filePath)
  const rel = relative(baseDir, resolved)
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`path '${filePath}' is outside the allowed directory`)
  }
  return resolved
}

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
    if (fresh.has(prompt)) {
      if (fresh.get(prompt) === false) {
        regressions.push(`FAIL: ${prompt}`)
      }
    } else {
      regressions.push(`MISSING: ${prompt}`)
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

  let resolvedNewPath
  let resolvedBaselinePath
  try {
    resolvedNewPath = safePath(newPath)
    resolvedBaselinePath = safePath(baselinePath)
  } catch (err) {
    console.error(`::error::${err.message}`)
    process.exit(2)
  }

  if (!existsSync(resolvedNewPath)) {
    console.error(`::error::New results file not found: ${newPath}`)
    process.exit(2)
  }
  if (!existsSync(resolvedBaselinePath)) {
    console.error(`::error::Baseline file not found: ${baselinePath}`)
    process.exit(2)
  }

  const baseline = buildPromptPassMap(JSON.parse(readFileSync(resolvedBaselinePath, 'utf8')))
  const fresh = buildPromptPassMap(JSON.parse(readFileSync(resolvedNewPath, 'utf8')))

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
