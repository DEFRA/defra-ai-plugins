import { test } from 'node:test'
import assert from 'node:assert/strict'
import { check } from './branch-guard.mjs'

const onMain = () => 'main'
const onMaster = () => 'master'
const onFeature = () => 'feature/x'

test('passes non-git commands', () => {
  assert.deepEqual(check({ tool_input: { command: 'ls -la' } }, onMain), { exitCode: 0 })
})

test('refuses git commit on main', () => {
  const r = check({ tool_input: { command: 'git commit -m "x"' } }, onMain)
  assert.equal(r.exitCode, 2)
  assert.match(r.stderr, /direct commits and pushes to 'main'/)
})

test('refuses git commit on master', () => {
  const r = check({ tool_input: { command: 'git commit -m "x"' } }, onMaster)
  assert.equal(r.exitCode, 2)
  assert.match(r.stderr, /'master'/)
})

test('allows git commit on a feature branch', () => {
  assert.deepEqual(check({ tool_input: { command: 'git commit -m "feat: x"' } }, onFeature), {
    exitCode: 0
  })
})

test('refuses force-push to main from a feature branch', () => {
  const r = check({ tool_input: { command: 'git push --force origin main' } }, onFeature)
  assert.equal(r.exitCode, 2)
  assert.match(r.stderr, /force-push to 'main'\/'master'/)
})

test('refuses --force-with-lease to main:HEAD', () => {
  const r = check(
    { tool_input: { command: 'git push --force-with-lease origin HEAD:main' } },
    onFeature
  )
  assert.equal(r.exitCode, 2)
})

test('refuses -f short form to main', () => {
  const r = check({ tool_input: { command: 'git push -f origin main' } }, onFeature)
  assert.equal(r.exitCode, 2)
})

test('allows force-push to a feature branch', () => {
  const r = check({ tool_input: { command: 'git push --force origin feature/x' } }, onFeature)
  assert.equal(r.exitCode, 0)
})

test('allows non-commit/push git verbs on main', () => {
  assert.deepEqual(check({ tool_input: { command: 'git status' } }, onMain), { exitCode: 0 })
})

test('empty input passes', () => {
  assert.deepEqual(check({}, onFeature), { exitCode: 0 })
})
