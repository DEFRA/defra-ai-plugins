import { test } from 'node:test'
import assert from 'node:assert/strict'
import { check } from './nunjucks-security.mjs'

const fakeFs = (content) => ({
  readFile: () => content,
  fileExists: () => true
})

test('non-njk file passes', () => {
  const { readFile, fileExists } = fakeFs('<script>alert(1)</script>')
  assert.deepEqual(check('/tmp/x.html', readFile, fileExists), { exitCode: 0 })
})

test('missing file passes', () => {
  assert.deepEqual(
    check(
      '/tmp/missing.njk',
      () => '',
      () => false
    ),
    { exitCode: 0 }
  )
})

test('clean template passes', () => {
  const { readFile, fileExists } = fakeFs('<h1>{{ title }}</h1>')
  assert.deepEqual(check('/tmp/x.njk', readFile, fileExists), { exitCode: 0 })
})

test('refuses inline <script>', () => {
  const { readFile, fileExists } = fakeFs('<script>alert(1)</script>')
  const r = check('/tmp/x.njk', readFile, fileExists)
  assert.equal(r.exitCode, 2)
  assert.match(r.stderr, /inline <script>/)
})

test('refuses inline <style>', () => {
  const { readFile, fileExists } = fakeFs('<style>.x{}</style>')
  const r = check('/tmp/x.njk', readFile, fileExists)
  assert.equal(r.exitCode, 2)
})

test('refuses style= attribute', () => {
  const { readFile, fileExists } = fakeFs('<div style="color:red">x</div>')
  const r = check('/tmp/x.njk', readFile, fileExists)
  assert.equal(r.exitCode, 2)
})

test('warns on | safe but does not refuse', () => {
  const { readFile, fileExists } = fakeFs('{{ content | safe }} and {{ other | safe }}')
  const r = check('/tmp/x.njk', readFile, fileExists)
  assert.equal(r.exitCode, 0)
  assert.match(r.stderr, /2 use\(s\) of '\| safe'/)
})

test('no | safe → no stderr', () => {
  const { readFile, fileExists } = fakeFs('{{ content }}')
  assert.deepEqual(check('/tmp/x.njk', readFile, fileExists), { exitCode: 0 })
})
