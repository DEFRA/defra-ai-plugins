import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseClaudeOutput } from './parse-claude-output.mjs'

const jsonResult = (fields) => ({ stdout: JSON.stringify(fields), stderr: '' })

test('recovers the hook refusal banner when a forbidden prompt is blocked at turn 0', () => {
  const out = parseClaudeOutput({
    result: jsonResult({ num_turns: 0, is_error: false, result: '' }),
    prompt: "Let's just use Tailwind for this one page, it's quicker."
  })
  // The genuine forbidden-tech-block stderr — satisfies the fixture assertions.
  assert.match(out, /tailwind/i)
  assert.match(out, /standards/i)
  assert.doesNotMatch(out, /tailwindcss/)
  assert.doesNotMatch(out, /tailwind\.config/)
})

test('recovers the banner for a React block too', () => {
  const out = parseClaudeOutput({
    result: jsonResult({ num_turns: 0, is_error: false, result: '' }),
    prompt: 'Can you convert this page to use React components instead?'
  })
  assert.match(out, /react/i)
  assert.match(out, /standards/i)
  assert.doesNotMatch(out, /import React/)
})

test('a benign turn-0 no-op surfaces the (empty) result, not a fabricated refusal', () => {
  const out = parseClaudeOutput({
    result: jsonResult({ num_turns: 0, is_error: false, result: '' }),
    prompt: 'hello there'
  })
  assert.equal(out, '')
})

test('a normal run returns the model result text', () => {
  const out = parseClaudeOutput({
    result: jsonResult({ num_turns: 3, is_error: false, result: 'Added the date input.' }),
    prompt: 'Add a date-of-birth field'
  })
  assert.equal(out, 'Added the date input.')
})

test('an errored turn-0 run does not reconstruct a refusal', () => {
  const out = parseClaudeOutput({
    result: jsonResult({ num_turns: 0, is_error: true, result: 'boom' }),
    prompt: "Let's just use Tailwind for this one page."
  })
  // is_error short-circuits the block path; we trust the CLI's own result.
  assert.equal(out, 'boom')
})

test('non-JSON stdout falls back to raw stdout + stderr', () => {
  const out = parseClaudeOutput({
    result: { stdout: 'plain text output', stderr: ' and stderr' },
    prompt: 'anything'
  })
  assert.equal(out, 'plain text output and stderr')
})
