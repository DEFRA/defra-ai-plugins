import { test } from 'node:test'
import assert from 'node:assert/strict'
import { metricPassRate, findRegressions, THRESHOLDS } from './check-regression.mjs'

function resultsWith(...components) {
  return {
    results: {
      results: [{
        gradingResult: {
          componentResults: components.map(([metric, pass]) => ({
            pass, assertion: { metric }
          }))
        }
      }]
    }
  }
}

test('metricPassRate returns null when the metric never appears', () => {
  assert.equal(metricPassRate(resultsWith(['security', true]), 'correctness'), null)
})

test('metricPassRate returns 100 when all pass', () => {
  const data = resultsWith(['security', true], ['security', true])
  assert.equal(metricPassRate(data, 'security'), 100)
})

test('metricPassRate computes percentage correctly', () => {
  const data = resultsWith(['security', true], ['security', false], ['security', true])
  const rate = metricPassRate(data, 'security')
  assert.ok(Math.abs(rate - 66.66) < 1, `expected ~66.67, got ${rate}`)
})

test('metricPassRate matches namespaced metrics', () => {
  const data = resultsWith(['security:nino', true], ['security:nhs', false])
  assert.equal(metricPassRate(data, 'security'), 50)
})

test('metricPassRate does not match prefix collisions', () => {
  const data = resultsWith(['security_extra', true], ['security', false])
  assert.equal(metricPassRate(data, 'security'), 0)
})

test('findRegressions: clean run returns empty array', () => {
  const data = resultsWith(
    ['correctness', true],
    ['security', true],
    ['lint_passes', true]
  )
  assert.deepEqual(findRegressions(data, null), [])
})

test('findRegressions flags security below 100%', () => {
  const data = resultsWith(['security', true], ['security', false])
  const out = findRegressions(data, null)
  assert.ok(out.some(r => r.startsWith('security:')))
})

test('findRegressions allows correctness at 90%', () => {
  const components = []
  for (let i = 0; i < 9; i++) components.push(['correctness', true])
  components.push(['correctness', false])
  const data = resultsWith(...components)
  const out = findRegressions(data, null)
  assert.ok(!out.some(r => r.startsWith('correctness:')))
})

test('findRegressions flags correctness below 90%', () => {
  const components = []
  for (let i = 0; i < 8; i++) components.push(['correctness', true])
  components.push(['correctness', false])
  components.push(['correctness', false])
  const data = resultsWith(...components)
  const out = findRegressions(data, null)
  assert.ok(out.some(r => r.startsWith('correctness:')))
})

test('findRegressions detects baseline drop > 5pp', () => {
  const newData = resultsWith(
    ['security', true], ['security', true],
    ['security', true], ['security', false],
    ['security', false]
  )
  const baseData = resultsWith(
    ['security', true], ['security', true],
    ['security', true], ['security', true],
    ['security', true]
  )
  const out = findRegressions(newData, baseData)
  assert.ok(out.some(r => r.includes('below baseline')))
})

test('THRESHOLDS has correct values for this plugin', () => {
  assert.equal(THRESHOLDS.correctness, 90)
  assert.equal(THRESHOLDS.security, 100)
  assert.equal(THRESHOLDS.lint_passes, 100)
  assert.equal(THRESHOLDS.accessibility, undefined)
  assert.equal(THRESHOLDS.refusal, undefined)
})
