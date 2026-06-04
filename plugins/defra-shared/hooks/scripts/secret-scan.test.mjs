import { test } from 'node:test'
import assert from 'node:assert/strict'
import { check } from './secret-scan.mjs'

const w = (content, file = 'src/file.js') => ({ tool_input: { file_path: file, content } })

test('allows clean content', () => {
  assert.deepEqual(check(w("export const greeting = 'hello'")), { exitCode: 0 })
})

test('refuses AWS access key id', () => {
  const r = check(w("const k = 'AKIAIOSFODNN7EXAMPLE'"))
  assert.equal(r.exitCode, 2)
  assert.match(r.stderr, /AWS access key id/)
})

test('refuses private key block', () => {
  const r = check(w('-----BEGIN RSA PRIVATE KEY-----'))
  assert.equal(r.exitCode, 2)
  assert.match(r.stderr, /private key block/)
})

test('refuses hard-coded credential with apiKey:', () => {
  const r = check(w('const c = { apiKey: "ABCDEFGHIJKLMNOPQRSTUV" }'))
  assert.equal(r.exitCode, 2)
  assert.match(r.stderr, /hard-coded credential/)
})

test('refuses Anthropic key', () => {
  const r = check(w("const k = 'sk-ant-api03-AAAAAAAAAAAAAAAAAAAA1234567890'"))
  assert.equal(r.exitCode, 2)
  assert.match(r.stderr, /Anthropic API key/)
})

test('refuses OpenAI sk-proj key', () => {
  const r = check(w("const k = 'sk-proj-AAAAAAAAAAAAAAAAAAAA1234567890abc'"))
  assert.equal(r.exitCode, 2)
  assert.match(r.stderr, /OpenAI API key/)
})

test('refuses GitHub token', () => {
  const r = check(w("const t = 'ghp_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1234567890'"))
  assert.equal(r.exitCode, 2)
  assert.match(r.stderr, /GitHub token/)
})

test('refuses Stripe live key', () => {
  // Built at runtime so the contiguous literal never appears in this file and
  // trips GitHub push-protection secret scanning. Still matches secret-scan.mjs.
  const fixture = 'sk_' + 'live_' + 'A'.repeat(24) + '1234567890'
  const r = check(w(`const k = '${fixture}'`))
  assert.equal(r.exitCode, 2)
  assert.match(r.stderr, /Stripe key/)
})

test('refuses JWT', () => {
  const r = check(
    w(
      "const t = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'"
    )
  )
  assert.equal(r.exitCode, 2)
  assert.match(r.stderr, /JWT/)
})

test('reads from new_string when content is absent', () => {
  const r = check({
    tool_input: { file_path: 'x.js', new_string: "const k = 'AKIAIOSFODNN7EXAMPLE'" }
  })
  assert.equal(r.exitCode, 2)
})

test('empty input passes', () => {
  assert.deepEqual(check({}), { exitCode: 0 })
})
