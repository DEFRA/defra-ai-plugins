import { test } from 'node:test'
import assert from 'node:assert/strict'
import { check } from './forbidden-tech-block.mjs'

test('empty prompt passes', () => {
  assert.deepEqual(check({}), { exitCode: 0 })
})

test('benign prompt passes', () => {
  assert.deepEqual(check({ prompt: 'add a callback form at /callback' }), { exitCode: 0 })
})

test('refuses react', () => {
  const r = check({ prompt: 'build a React app please' })
  assert.equal(r.exitCode, 2)
  assert.match(r.stderr, /'React'/)
})

test('refuses tailwind (case-insensitive)', () => {
  const r = check({ prompt: 'use Tailwind for the styles' })
  assert.equal(r.exitCode, 2)
  assert.match(r.stderr, /'Tailwind'/)
})

test('refuses typescript', () => {
  const r = check({ prompt: 'write in typescript' })
  assert.equal(r.exitCode, 2)
})

test('refuses express', () => {
  const r = check({ prompt: 'set up an express server' })
  assert.equal(r.exitCode, 2)
})

test('word-boundary: does not refuse "expression"', () => {
  assert.deepEqual(check({ prompt: 'evaluate this expression' }), { exitCode: 0 })
})
