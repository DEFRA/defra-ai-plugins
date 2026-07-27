import { test } from 'node:test'
import assert from 'node:assert/strict'
import { check } from './coverage-floor.mjs'

const env = { COVERAGE_FLOOR: '80' }

test('passes for non-test commands', () => {
  const r = check({ tool_input: { command: 'npm run build' }, tool_response: { stdout: '' } }, env)
  assert.equal(r.exitCode, 0)
  assert.equal(r.stderr, undefined)
})

test('warns on All files row below threshold', () => {
  const r = check(
    {
      tool_input: { command: 'npm test' },
      tool_response: { stdout: '  All files | 70.25 |  60.0 |  72.0 |  70.25' }
    },
    env
  )
  assert.equal(r.exitCode, 0)
  assert.match(r.stderr, /coverage 70\.25% is below the 80% threshold/)
})

test('passes on All files row at or above threshold', () => {
  const r = check(
    {
      tool_input: { command: 'npm test' },
      tool_response: { stdout: '  All files | 80.5 |  60.0 |  72.0 |  80.5' }
    },
    env
  )
  assert.equal(r.exitCode, 0)
  assert.equal(r.stderr, undefined)
})

test('falls back to first percentage when no structured row', () => {
  const r = check(
    {
      tool_input: { command: 'pytest' },
      tool_response: { stdout: 'coverage 55% across the suite' }
    },
    env
  )
  assert.equal(r.exitCode, 0)
  assert.match(r.stderr, /55% is below/)
})

test('respects custom COVERAGE_FLOOR env var', () => {
  const r = check(
    {
      tool_input: { command: 'npm test' },
      tool_response: { stdout: 'All files | 85.0' }
    },
    { COVERAGE_FLOOR: '90' }
  )
  assert.match(r.stderr, /85\.0% is below the 90% threshold/)
})

test('no percentage found → passes silently', () => {
  const r = check(
    {
      tool_input: { command: 'vitest run' },
      tool_response: { stdout: 'all tests passed' }
    },
    env
  )
  assert.equal(r.exitCode, 0)
  assert.equal(r.stderr, undefined)
})
