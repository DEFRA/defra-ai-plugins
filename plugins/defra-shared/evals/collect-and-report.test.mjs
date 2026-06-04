import { test } from 'node:test'
import assert from 'node:assert/strict'
import { listHookStatusMessages } from './collect-and-report.mjs'

test('listHookStatusMessages collects messages across events and matchers', () => {
  const config = {
    hooks: {
      PreToolUse: [
        { hooks: [{ statusMessage: 'guarding branch' }] },
        { hooks: [{ statusMessage: 'scanning secrets' }, { statusMessage: 'scanning pii' }] }
      ],
      PostToolUse: [{ hooks: [{ statusMessage: 'checking coverage' }] }]
    }
  }
  assert.deepEqual(listHookStatusMessages(config), [
    'guarding branch',
    'scanning secrets',
    'scanning pii',
    'checking coverage'
  ])
})

test('listHookStatusMessages substitutes a placeholder for a missing message', () => {
  const config = { hooks: { PreToolUse: [{ hooks: [{}] }] } }
  assert.deepEqual(listHookStatusMessages(config), ['(no statusMessage)'])
})

test('listHookStatusMessages returns empty for a config with no hooks', () => {
  assert.deepEqual(listHookStatusMessages({}), [])
})

test('listHookStatusMessages tolerates empty matcher and hook arrays', () => {
  const config = { hooks: { PreToolUse: [{}, { hooks: [] }] } }
  assert.deepEqual(listHookStatusMessages(config), [])
})
