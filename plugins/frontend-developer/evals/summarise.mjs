#!/usr/bin/env node
// Render a markdown summary of a promptfoo result file.
//
// Usage: node summarise.mjs <results.json>
//
// Stdout is markdown suitable for piping to $GITHUB_STEP_SUMMARY or for
// eyeballing locally.

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Build the markdown report (without a trailing newline) from a parsed
// promptfoo result object.
export function renderSummary(data) {
  const lines = []

  lines.push('## Eval results', '')

  const stats = data.results?.stats ?? {}
  const successes = stats.successes ?? 0
  const failures = stats.failures ?? 0
  lines.push(`**Suite pass:** ${successes}/${successes + failures} tests`, '')

  lines.push('### Per-fixture')
  const byPrompt = new Map()
  for (const r of data.results?.results ?? []) {
    const prompt = r.vars?.prompt ?? ''
    const arr = byPrompt.get(prompt) ?? []
    arr.push(r.success === true)
    byPrompt.set(prompt, arr)
  }
  for (const [prompt, arr] of byPrompt) {
    const pass = arr.every(Boolean)
    lines.push(`- ${pass ? 'PASS' : 'FAIL'} — ${prompt.slice(0, 80)}`)
  }

  lines.push('', '### Named scores')
  const scores = data.results?.prompts?.[0]?.metrics?.namedScores ?? {}
  for (const [k, v] of Object.entries(scores)) {
    lines.push(`- **${k}**: ${v}`)
  }

  lines.push('', '### Latency')
  const latencies = (data.results?.results ?? [])
    .map((r) => r.latencyMs)
    .filter((n) => typeof n === 'number')
    .sort((a, b) => a - b)
  if (latencies.length === 0) {
    lines.push('_no latency data_')
  } else {
    const p50 = latencies[Math.floor(latencies.length / 2)]
    const p95 = latencies[Math.floor(latencies.length * 0.95)]
    const max = latencies[latencies.length - 1]
    lines.push(`- p50: ${p50}ms`, `- p95: ${p95}ms`, `- max: ${max}ms`)
  }

  lines.push('', '### Assertion-level failures')
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
    const counts = new Map()
    for (const m of failureMetrics) {
      counts.set(m, (counts.get(m) ?? 0) + 1)
    }
    for (const [metric, count] of counts) {
      lines.push(`- ${metric}: ${count}`)
    }
  }

  return lines.join('\n')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const resultPath = process.argv[2]
  if (!resultPath) {
    console.error('usage: summarise.mjs <results.json>')
    process.exit(1)
  }
  if (!existsSync(resultPath)) {
    console.error(`::error::No result file at ${resultPath}`)
    process.exit(1)
  }
  const data = JSON.parse(readFileSync(resultPath, 'utf8'))
  process.stdout.write(renderSummary(data) + '\n')
}
