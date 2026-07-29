#!/usr/bin/env node
// Render a markdown summary of a promptfoo result file.
//
// Usage: node summarise.mjs <results.json>
//
// Stdout is markdown suitable for piping to $GITHUB_STEP_SUMMARY or for
// eyeballing locally.

import { readFileSync, existsSync } from 'node:fs'
import { resolve, relative, isAbsolute } from 'node:path'
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

const PROMPT_TRUNCATE_LENGTH = 80
const P95_PERCENTILE = 0.95

function renderSuiteStats(data) {
  const stats = data.results?.stats ?? {}
  const successes = stats.successes ?? 0
  const failures = stats.failures ?? 0
  return [`**Suite pass:** ${successes}/${successes + failures} tests`, '']
}

function renderPerFixture(data) {
  const lines = ['### Per-fixture']
  const byPrompt = new Map()
  for (const r of data.results?.results ?? []) {
    const prompt = r.vars?.prompt ?? ''
    const arr = byPrompt.get(prompt) ?? []
    arr.push(r.success === true)
    byPrompt.set(prompt, arr)
  }
  for (const [prompt, arr] of byPrompt) {
    const pass = arr.every(Boolean)
    lines.push(`- ${pass ? 'PASS' : 'FAIL'} — ${prompt.slice(0, PROMPT_TRUNCATE_LENGTH)}`)
  }
  return lines
}

function renderNamedScores(data) {
  const lines = ['', '### Named scores']
  const scores = data.results?.prompts?.[0]?.metrics?.namedScores ?? {}
  for (const [k, v] of Object.entries(scores)) {
    lines.push(`- **${k}**: ${v}`)
  }
  return lines
}

function renderLatencySection(data) {
  const lines = ['', '### Latency']
  const latencies = (data.results?.results ?? [])
    .map((r) => r.latencyMs)
    .filter((n) => typeof n === 'number')
    .sort((a, b) => a - b)
  if (latencies.length === 0) {
    lines.push('_no latency data_')
  } else {
    const p50 = latencies[Math.floor(latencies.length / 2)]
    const p95 = latencies[Math.floor(latencies.length * P95_PERCENTILE)]
    const max = latencies[latencies.length - 1]
    lines.push(`- p50: ${p50}ms`, `- p95: ${p95}ms`, `- max: ${max}ms`)
  }
  return lines
}

function buildMetricCounts(failureMetrics) {
  const counts = new Map()
  for (const m of failureMetrics) {
    counts.set(m, (counts.get(m) ?? 0) + 1)
  }
  return counts
}

function renderAssertionFailures(data) {
  const lines = ['', '### Assertion-level failures']
  const failureMetrics = []
  for (const r of data.results?.results ?? []) {
    for (const c of r.gradingResult?.componentResults ?? []) {
      if (c.pass === false) {
        failureMetrics.push(c.assertion?.metric ?? 'untagged')
      }
    }
  }
  if (failureMetrics.length === 0) {
    lines.push('_none_')
  } else {
    for (const [metric, count] of buildMetricCounts(failureMetrics)) {
      lines.push(`- ${metric}: ${count}`)
    }
  }
  return lines
}

// Build the markdown report (without a trailing newline) from a parsed
// promptfoo result object.
export function renderSummary(data) {
  return [
    '## Eval results',
    '',
    ...renderSuiteStats(data),
    ...renderPerFixture(data),
    ...renderNamedScores(data),
    ...renderLatencySection(data),
    ...renderAssertionFailures(data)
  ].join('\n')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const resultPath = process.argv[2]
  if (!resultPath) {
    console.error('usage: summarise.mjs <results.json>')
    process.exit(1)
  }
  let resolvedResultPath
  try {
    resolvedResultPath = safePath(resultPath)
  } catch (err) {
    console.error(`::error::${err.message}`)
    process.exit(1)
  }
  if (!existsSync(resolvedResultPath)) {
    console.error(`::error::No result file at ${resultPath}`)
    process.exit(1)
  }
  const data = JSON.parse(readFileSync(resolvedResultPath, 'utf8'))
  process.stdout.write(renderSummary(data) + '\n')
}
