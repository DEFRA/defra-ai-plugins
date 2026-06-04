import { test } from 'node:test'
import assert from 'node:assert/strict'
import { metricPassRate, findRegressions, THRESHOLDS } from './check-regression.mjs'

// Build a minimal promptfoo-shaped result object from a list of
// [metric, pass] component tuples.
function resultsWith(...components) {
  return {
    results: {
      results: [
        {
          gradingResult: {
            componentResults: components.map(([metric, pass]) => ({
              pass,
              assertion: { metric }
            }))
          }
        }
      ]
    }
  }
}

test('metricPassRate returns null when the metric never appears', () => {
  assert.equal(metricPassRate(resultsWith(['security', true]), 'correctness'), null)
})

test('metricPassRate computes a percentage across matching components', () => {
  const data = resultsWith(['correctness', true], ['correctness', false], ['correctness', true])
  assert.equal(metricPassRate(data, 'correctness'), (2 * 100) / 3)
})

test('metricPassRate matches namespaced metrics (metric:suffix)', () => {
  const data = resultsWith(['security:secret', true], ['security:pii', false])
  assert.equal(metricPassRate(data, 'security'), 50)
})

test('metricPassRate does not match a different metric sharing a prefix', () => {
  // "correctness_extra" must not be picked up by the "correctness" gate.
  const data = resultsWith(['correctness_extra', false])
  assert.equal(metricPassRate(data, 'correctness'), null)
})

test('metricPassRate tolerates missing results arrays', () => {
  assert.equal(metricPassRate({}, 'security'), null)
})

test('findRegressions: clean run below no threshold returns empty', () => {
  const data = resultsWith(['correctness', true], ['security', true])
  assert.deepEqual(findRegressions(data, null), [])
})

test('findRegressions flags a metric under its threshold', () => {
  // 2/3 correctness = 66.6% < 90% threshold.
  const data = resultsWith(['correctness', true], ['correctness', false], ['correctness', false])
  const out = findRegressions(data, null)
  assert.equal(out.length, 1)
  assert.match(out[0], /^correctness: .* < 90% threshold$/)
})

test('findRegressions uses floor for the threshold comparison', () => {
  // 89.999% floors to 89 which is < 90, so it must fail even though it rounds
  // up. Construct 8/9 correctness = 88.8% to stay clearly under.
  const comps = Array.from({ length: 9 }, (_, i) => ['correctness', i !== 0])
  const out = findRegressions(resultsWith(...comps), null)
  assert.equal(out.length, 1)
})

test('findRegressions: a security/refusal metric must be 100%', () => {
  const data = resultsWith(['security', true], ['security', false])
  const out = findRegressions(data, null)
  assert.ok(out.some((r) => r.startsWith('security:')))
})

test('findRegressions flags a >5pp drop versus baseline', () => {
  // Baseline correctness 100%, new correctness 90% -> 10pp drop > 5.
  const baseline = resultsWith(['correctness', true])
  const newData = resultsWith(...Array.from({ length: 10 }, (_, i) => ['correctness', i !== 0]))
  const out = findRegressions(newData, baseline)
  assert.ok(out.some((r) => r.includes('below baseline')))
})

test('findRegressions: a 5pp drop is tolerated (only >5 fails)', () => {
  // Baseline 100%, new 95% -> exactly 5pp drop, not flagged as a regression.
  const baseline = resultsWith(['correctness', true])
  const newData = resultsWith(...Array.from({ length: 20 }, (_, i) => ['correctness', i !== 0]))
  const out = findRegressions(newData, baseline)
  assert.equal(out.filter((r) => r.includes('below baseline')).length, 0)
})

test('THRESHOLDS encodes the documented v1 gate values', () => {
  assert.equal(THRESHOLDS.correctness, 90)
  assert.equal(THRESHOLDS.security, 100)
  assert.equal(THRESHOLDS.refusal, 100)
})
