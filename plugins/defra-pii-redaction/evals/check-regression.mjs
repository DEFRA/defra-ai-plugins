#!/usr/bin/env node
// Regression gate for the defra-pii-redaction eval suite.
//
// Reads a promptfoo result file, compares per-metric pass-rates to
// thresholds, and exits 1 if any metric falls below threshold or
// regresses by more than 5pp compared with the committed baseline.
//
// Usage: node check-regression.mjs <new-results.json> [baseline.json]
//
// Thresholds:
//   correctness  >= 90%
//   security     = 100%
//   lint_passes  = 100%

import { readFileSync, existsSync, realpathSync } from 'node:fs'
import { dirname, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const THRESHOLDS = {
  correctness: 90,
  security: 100,
  lint_passes: 100
}

export function metricPassRate(data, metric) {
  const hits = []
  for (const r of data.results?.results ?? []) {
    for (const c of r.gradingResult?.componentResults ?? []) {
      const m = c.assertion?.metric ?? ''
      if (m === metric || m.startsWith(`${metric}:`)) {
        hits.push(c.pass)
      }
    }
  }
  if (hits.length === 0) {
    return null
  }
  return (hits.filter(Boolean).length * 100) / hits.length
}

const BASELINE_DROP_THRESHOLD = 5

export function findRegressions(newData, baselineData, thresholds = THRESHOLDS) {
  const regressions = []

  for (const [metric, threshold] of Object.entries(thresholds)) {
    const rate = metricPassRate(newData, metric)
    if (rate === null) {
      continue
    }
    if (Math.floor(rate) < threshold) {
      regressions.push(`${metric}: ${rate}% < ${threshold}% threshold`)
    }
  }

  if (baselineData) {
    for (const metric of Object.keys(thresholds)) {
      const newRate = metricPassRate(newData, metric)
      const baseRate = metricPassRate(baselineData, metric)
      if (newRate === null || baseRate === null) {
        continue
      }
      const drop = Math.floor(baseRate) - Math.floor(newRate)
      if (drop > BASELINE_DROP_THRESHOLD) {
        regressions.push(`${metric}: ${newRate}% is ${drop}pp below baseline ${baseRate}%`)
      }
    }
  }

  return regressions
}

// Resolve and validate a CLI-supplied path, preventing it from escaping the
// current working directory (defends against path injection via an LLM
// agent invoking this script with a manipulated path).
function safePath(filePath) {
  const resolved = realpathSync(filePath)
  const baseDir = dirname(fileURLToPath(import.meta.url))
  if (resolved !== baseDir && !resolved.startsWith(baseDir + sep)) {
    throw new Error(`path '${filePath}' is outside the allowed directory`)
  }
  return resolved
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , newPath, baselineArg] = process.argv
  if (!newPath) {
    console.error('usage: check-regression.mjs <new-results.json> [baseline.json]')
    process.exit(2)
  }

  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const baselinePath = baselineArg ?? join(scriptDir, 'baseline', 'promptfoo-results.json')

  let newData
  try {
    newData = JSON.parse(readFileSync(safePath(newPath), 'utf8'))
  } catch {
    console.error(`ERROR: New results file not found or invalid: ${newPath}`)
    process.exit(2)
  }

  const baselineData = existsSync(baselinePath)
    ? JSON.parse(readFileSync(safePath(baselinePath), 'utf8'))
    : null

  const regressions = findRegressions(newData, baselineData)

  if (regressions.length === 0) {
    console.log('defra-pii-redaction: no regressions, all metrics at or above threshold.')
    process.exit(0)
  }

  console.error(`ERROR: ${regressions.length} regression(s) in defra-pii-redaction evals:`)
  for (const r of regressions) {
    console.error(`  ${r}`)
  }
  process.exit(1)
}
