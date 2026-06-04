import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildPromptPassMap, findRegressions } from './check-regression.mjs'

// Build a minimal promptfoo-shaped result object from [prompt, success] tuples.
function resultsWith(...rows) {
  return {
    results: {
      results: rows.map(([prompt, success]) => ({ vars: { prompt }, success }))
    }
  }
}

test('buildPromptPassMap marks a single-provider prompt by its success flag', () => {
  const map = buildPromptPassMap(resultsWith(['a', true], ['b', false]))
  assert.equal(map.get('a'), true)
  assert.equal(map.get('b'), false)
})

test('buildPromptPassMap requires every provider of a prompt to pass', () => {
  // Same prompt run by two providers: one fails -> the prompt is failing.
  const map = buildPromptPassMap(resultsWith(['a', true], ['a', false]))
  assert.equal(map.get('a'), false)
})

test('buildPromptPassMap treats non-true success as a failure', () => {
  const map = buildPromptPassMap(resultsWith(['a', undefined]))
  assert.equal(map.get('a'), false)
})

test('buildPromptPassMap skips rows without a prompt var', () => {
  const data = { results: { results: [{ vars: {}, success: true }] } }
  assert.equal(buildPromptPassMap(data).size, 0)
})

test('buildPromptPassMap tolerates missing results arrays', () => {
  assert.equal(buildPromptPassMap({}).size, 0)
})

test('findRegressions reports a baseline-passing prompt that now fails', () => {
  const baseline = buildPromptPassMap(resultsWith(['keeps', true], ['breaks', true]))
  const fresh = buildPromptPassMap(resultsWith(['keeps', true], ['breaks', false]))
  assert.deepEqual(findRegressions(baseline, fresh), ['FAIL: breaks'])
})

test('findRegressions reports a baseline-passing prompt that disappeared', () => {
  const baseline = buildPromptPassMap(resultsWith(['gone', true]))
  const fresh = buildPromptPassMap(resultsWith(['other', true]))
  assert.deepEqual(findRegressions(baseline, fresh), ['MISSING: gone'])
})

test('findRegressions ignores prompts that were already failing in baseline', () => {
  const baseline = buildPromptPassMap(resultsWith(['flaky', false]))
  const fresh = buildPromptPassMap(resultsWith(['flaky', false]))
  assert.deepEqual(findRegressions(baseline, fresh), [])
})

test('findRegressions ignores brand-new prompts not in the baseline', () => {
  const baseline = buildPromptPassMap(resultsWith(['old', true]))
  const fresh = buildPromptPassMap(resultsWith(['old', true], ['new', false]))
  assert.deepEqual(findRegressions(baseline, fresh), [])
})

test('findRegressions returns empty when nothing regressed', () => {
  const baseline = buildPromptPassMap(resultsWith(['a', true], ['b', true]))
  const fresh = buildPromptPassMap(resultsWith(['a', true], ['b', true]))
  assert.deepEqual(findRegressions(baseline, fresh), [])
})
