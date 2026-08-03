import { test } from 'node:test'
import assert from 'node:assert/strict'
import { listHookStatusMessages, FIXTURES } from './collect-and-report.mjs'

test('listHookStatusMessages collects messages across events', () => {
  const config = {
    hooks: {
      UserPromptSubmit: [{ hooks: [{ statusMessage: 'redacting prompt' }] }],
      PreToolUse: [{ hooks: [{ statusMessage: 'redacting input' }] }],
      PostToolUse: [{ hooks: [{ statusMessage: 'redacting output' }] }]
    }
  }
  assert.deepEqual(listHookStatusMessages(config), [
    'redacting prompt',
    'redacting input',
    'redacting output'
  ])
})

test('listHookStatusMessages returns empty for a config with no hooks', () => {
  assert.deepEqual(listHookStatusMessages({}), [])
})

test('listHookStatusMessages falls back to "(no statusMessage)"', () => {
  const config = {
    hooks: {
      PreToolUse: [{ hooks: [{ type: 'command', command: 'echo hi' }] }]
    }
  }
  assert.deepEqual(listHookStatusMessages(config), ['(no statusMessage)'])
})

test('FIXTURES covers all three event types', () => {
  const events = new Set(FIXTURES.map((f) => f.event))
  assert.ok(events.has('UserPromptSubmit'))
  assert.ok(events.has('PreToolUse'))
  assert.ok(events.has('PostToolUse'))
})

test('FIXTURES includes clean (no-PII) cases', () => {
  const clean = FIXTURES.filter(
    (f) => (f.expectedPlaceholders ?? []).length === 0 && f.expectedDecision == null
  )
  assert.ok(clean.length >= 2, 'at least two clean fixtures expected')
})

test('FIXTURES includes Defra-specific PII entity types', () => {
  const allPlaceholders = FIXTURES.flatMap((f) => f.expectedPlaceholders ?? [])
  assert.ok(allPlaceholders.includes('<SBI>'))
  assert.ok(allPlaceholders.includes('<CRN>'))
  assert.ok(allPlaceholders.includes('<CPH>'))
})

test('UserPromptSubmit fixtures with PII have expectedDecision block', () => {
  const piiPrompts = FIXTURES.filter(
    (f) => f.event === 'UserPromptSubmit' && f.expectedDecision != null
  )
  assert.ok(piiPrompts.length > 0, 'at least one PII prompt fixture expected')
  for (const f of piiPrompts) {
    assert.equal(f.expectedDecision, 'block', `${f.label} should block`)
  }
})

test('PreToolUse and PostToolUse PII fixtures have expectedPlaceholders', () => {
  const toolFixtures = FIXTURES.filter(
    (f) => (f.event === 'PreToolUse' || f.event === 'PostToolUse') && !f.label.endsWith('-clean')
  )
  for (const f of toolFixtures) {
    assert.ok(
      (f.expectedPlaceholders ?? []).length > 0,
      `${f.label} should list expected PII placeholders`
    )
  }
})
