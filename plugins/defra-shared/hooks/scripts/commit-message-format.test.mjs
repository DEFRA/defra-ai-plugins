import { test } from 'node:test'
import assert from 'node:assert/strict'
import { check } from './commit-message-format.mjs'

const cmd = (command) => ({ tool_input: { command } })
const OVER_LIMIT_LENGTH = 80

test('passes non-commit git verbs', () => {
  assert.deepEqual(check(cmd('git status')), { exitCode: 0 })
})

test('passes --amend --no-edit', () => {
  assert.deepEqual(check(cmd('git commit --amend --no-edit')), { exitCode: 0 })
})

test('passes valid conventional commit with -m', () => {
  assert.deepEqual(check(cmd('git commit -m "feat(api): add endpoint"')), {
    exitCode: 0
  })
})

test('passes valid conventional commit with --message=', () => {
  assert.deepEqual(check(cmd('git commit --message="fix: handle empty input"')), {
    exitCode: 0
  })
})

test('passes valid conventional commit with -am (combined flag)', () => {
  assert.deepEqual(check(cmd('git commit -am "feat: add thing"')), { exitCode: 0 })
})

test('refuses WIP subject', () => {
  const r = check(cmd('git commit -m "WIP"'))
  assert.equal(r.exitCode, 2)
  assert.match(r.stderr, /does not match Conventional Commits/)
})

test('refuses -F file bypass', () => {
  const r = check(cmd('git commit -F /tmp/msg.txt'))
  assert.equal(r.exitCode, 2)
  assert.match(r.stderr, /bypass subject validation/)
})

test('refuses --file=... bypass', () => {
  const r = check(cmd('git commit --file=/tmp/msg.txt'))
  assert.equal(r.exitCode, 2)
  assert.match(r.stderr, /bypass subject validation/)
})

const bypassCases = [
  { name: '--template= bypass', cmd: 'git commit --template=/tmp/tpl.txt' },
  { name: '-C reuse-message bypass', cmd: 'git commit -C HEAD' },
  { name: '--reuse-message= bypass', cmd: 'git commit --reuse-message=HEAD' },
  { name: '--fixup= bypass', cmd: 'git commit --fixup=HEAD~' },
  { name: '--squash= bypass', cmd: 'git commit --squash=HEAD~' }
]
for (const { name, cmd: c } of bypassCases) {
  test(`refuses ${name}`, () => {
    const r = check(cmd(c))
    assert.equal(r.exitCode, 2)
  })
}

test('refuses editor-driven commit (no -m)', () => {
  const r = check(cmd('git commit'))
  assert.equal(r.exitCode, 2)
  assert.match(r.stderr, /would open the editor/)
})

test('refuses subject > 72 chars', () => {
  const long = 'feat: ' + 'x'.repeat(OVER_LIMIT_LENGTH)
  const r = check(cmd(`git commit -m "${long}"`))
  assert.equal(r.exitCode, 2)
  assert.match(r.stderr, /max is 72/)
})

test('refuses subject with trailing period', () => {
  const r = check(cmd('git commit -m "feat: add thing."'))
  assert.equal(r.exitCode, 2)
})

test('passes feat with scope and breaking-change bang', () => {
  const r = check(cmd('git commit -m "feat(api)!: drop legacy endpoint"'))
  assert.equal(r.exitCode, 0)
})

test('passes single-quoted message', () => {
  const r = check(cmd("git commit -m 'feat: add thing'"))
  assert.equal(r.exitCode, 0)
})

test('refuses past-tense / non-conforming type', () => {
  const r = check(cmd('git commit -m "added a thing"'))
  assert.equal(r.exitCode, 2)
})
