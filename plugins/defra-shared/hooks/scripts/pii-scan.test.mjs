import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scan } from './pii-scan.mjs'

const fakeFs = (content) => ({
  readFile: () => content,
  fileExists: () => true
})

test('passes clean content', () => {
  const { readFile, fileExists } = fakeFs('hello world')
  assert.deepEqual(scan('/tmp/x.md', readFile, fileExists), { exitCode: 0 })
})

test('flags UK NI number', () => {
  const { readFile, fileExists } = fakeFs('NI: AB123456C')
  const r = scan('/tmp/x.md', readFile, fileExists)
  assert.match(r.stderr, /UK-NI-number/)
})

test('flags valid NHS number (Mod-11 passes)', () => {
  // 9434765919 is a valid NHS number (commonly cited test value).
  const { readFile, fileExists } = fakeFs('Patient ID: 9434765919')
  const r = scan('/tmp/x.md', readFile, fileExists)
  assert.match(r.stderr, /NHS-number/)
})

test('does NOT flag generic 10-digit number (Mod-11 fails)', () => {
  // 1234567890 fails the Mod-11 check (computed check digit is 10).
  const { readFile, fileExists } = fakeFs('Order: 1234567890')
  const r = scan('/tmp/x.md', readFile, fileExists)
  assert.equal(r.stderr ?? '', '')
})

test('flags UK postcode', () => {
  const { readFile, fileExists } = fakeFs('Address SW1A 1AA')
  const r = scan('/tmp/x.md', readFile, fileExists)
  assert.match(r.stderr, /UK-postcode/)
})

test('flags dd/mm/yyyy DoB', () => {
  const { readFile, fileExists } = fakeFs('DoB: 01/01/1990')
  const r = scan('/tmp/x.md', readFile, fileExists)
  assert.match(r.stderr, /DoB/)
})

test('skips eval-fixture/fixtures paths', () => {
  const { readFile, fileExists } = fakeFs('AB123456C')
  assert.deepEqual(scan('/repo/plugins/x/eval-fixture/fixtures/x.md', readFile, fileExists), {
    exitCode: 0
  })
})

test('skips *.lock files', () => {
  const { readFile, fileExists } = fakeFs('AB123456C')
  assert.deepEqual(scan('/repo/poetry.lock', readFile, fileExists), { exitCode: 0 })
})

test('skips *lock.json files', () => {
  const { readFile, fileExists } = fakeFs('AB123456C')
  assert.deepEqual(scan('/repo/package-lock.json', readFile, fileExists), { exitCode: 0 })
})

test('non-existent file passes silently', () => {
  assert.deepEqual(
    scan(
      '/tmp/nope.md',
      () => '',
      () => false
    ),
    { exitCode: 0 }
  )
})

test('empty file path passes silently', () => {
  assert.deepEqual(
    scan(
      '',
      () => '',
      () => true
    ),
    { exitCode: 0 }
  )
})
