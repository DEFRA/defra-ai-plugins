import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderSummary } from './summarise.mjs'

const OVER_MAX_PROMPT_LENGTH = 200
const LATENCY_START_MS = 10
const LATENCY_STEP_MS = 10
const LATENCY_ENTRY_COUNT = 5
const LATENCY_VALUES = Array.from(
  { length: LATENCY_ENTRY_COUNT },
  (_, i) => LATENCY_START_MS + i * LATENCY_STEP_MS
)

test('renderSummary reports the suite pass count from stats', () => {
  const md = renderSummary({ results: { stats: { successes: 7, failures: 3 } } })
  assert.match(md, /\*\*Suite pass:\*\* 7\/10 tests/)
})

test('renderSummary defaults the suite count to 0/0 when stats are absent', () => {
  const md = renderSummary({})
  assert.match(md, /\*\*Suite pass:\*\* 0\/0 tests/)
})

test('renderSummary marks a per-fixture PASS only when all providers pass', () => {
  const md = renderSummary({
    results: {
      results: [
        { vars: { prompt: 'green' }, success: true },
        { vars: { prompt: 'mixed' }, success: true },
        { vars: { prompt: 'mixed' }, success: false }
      ]
    }
  })
  assert.match(md, /- PASS — green/)
  assert.match(md, /- FAIL — mixed/)
})

test('renderSummary truncates long prompts to 80 chars', () => {
  const prompt = 'x'.repeat(OVER_MAX_PROMPT_LENGTH)
  const md = renderSummary({
    results: { results: [{ vars: { prompt }, success: true }] }
  })
  assert.match(md, /- PASS — x{80}(?!x)/)
})

test('renderSummary renders named scores', () => {
  const md = renderSummary({
    results: { prompts: [{ metrics: { namedScores: { correctness: 0.9 } } }] }
  })
  assert.match(md, /- \*\*correctness\*\*: 0\.9/)
})

test('renderSummary reports latency percentiles when present', () => {
  const results = LATENCY_VALUES.map((latencyMs) => ({
    vars: { prompt: 'p' },
    latencyMs
  }))
  const md = renderSummary({ results: { results } })
  assert.match(md, /- p50: 30ms/)
  assert.match(md, /- max: 50ms/)
})

test('renderSummary notes when there is no latency data', () => {
  const md = renderSummary({ results: { results: [{ vars: { prompt: 'p' } }] } })
  assert.match(md, /_no latency data_/)
})

test('renderSummary tallies assertion-level failures by metric', () => {
  const md = renderSummary({
    results: {
      results: [
        {
          vars: { prompt: 'p' },
          gradingResult: {
            componentResults: [
              { pass: false, assertion: { metric: 'security' } },
              { pass: false, assertion: { metric: 'security' } },
              { pass: true, assertion: { metric: 'correctness' } }
            ]
          }
        }
      ]
    }
  })
  assert.match(md, /- security: 2/)
  assert.doesNotMatch(md, /- correctness: /)
})

test('renderSummary reports no assertion failures as _none_', () => {
  const md = renderSummary({ results: { results: [{ vars: { prompt: 'p' } }] } })
  assert.match(md, /### Assertion-level failures\n_none_/)
})
