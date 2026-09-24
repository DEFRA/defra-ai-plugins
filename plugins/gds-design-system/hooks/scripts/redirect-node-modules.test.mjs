// The hook must deny the expensive path and stay out of the way everywhere
// else. A hook that over-blocks gets uninstalled, so the allow cases matter
// as much as the deny ones.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { check } from './redirect-node-modules.mjs'

// Copilot CLI sends toolName/toolArgs where Claude Code sends tool_name/tool_input.
function asCopilot(payload) {
  const { tool_input: toolArgs, ...rest } = payload
  return { ...rest, ...(toolArgs ? { toolArgs } : {}) }
}

function run(payload) {
  const result = check(payload)
  if (!result) {
    return { decision: 'allow' }
  }

  // The two hosts read different shapes out of the same object. Assert both
  // are present and agree, so a change that satisfies one cannot silently
  // break the other.
  const claude = result.hookSpecificOutput
  assert.ok(claude, 'missing hookSpecificOutput — Claude Code would not see the denial')
  assert.equal(
    typeof result.permissionDecision,
    'string',
    'missing top-level permissionDecision — Copilot CLI would not see the denial'
  )
  assert.equal(result.permissionDecision, claude.permissionDecision, 'the two host shapes disagree')
  assert.equal(
    result.permissionDecisionReason,
    claude.permissionDecisionReason,
    'the two host shapes carry different reasons'
  )

  return { decision: result.permissionDecision, reason: result.permissionDecisionReason }
}

const cases = [
  // Denied: the templates and macro options the reference files replace.
  {
    name: 'macro-options.json read',
    payload: {
      tool_input: {
        file_path: '/p/node_modules/govuk-frontend/dist/govuk/components/input/macro-options.json'
      }
    },
    expect: 'deny',
    reasonIncludes: 'references/text-input.md'
  },
  {
    name: 'template.njk read',
    payload: {
      tool_input: {
        file_path: '/p/node_modules/govuk-frontend/dist/govuk/components/radios/template.njk'
      }
    },
    expect: 'deny',
    reasonIncludes: 'references/radios.md'
  },
  {
    name: 'glob across the package',
    payload: { tool_input: { pattern: 'node_modules/govuk-frontend/**/*.njk' } },
    expect: 'deny'
  },
  {
    name: 'grep through Bash',
    payload: {
      tool_input: {
        command: 'grep -rn govukInput node_modules/govuk-frontend/dist/govuk/components/input/'
      }
    },
    expect: 'deny'
  },

  // Allowed: everything that is not the guidance-shaped part of the package.
  {
    name: 'package JavaScript',
    payload: {
      tool_input: { file_path: '/p/node_modules/govuk-frontend/dist/govuk/all.bundle.js' }
    },
    expect: 'allow'
  },
  {
    name: 'package Sass',
    payload: {
      tool_input: {
        file_path: '/p/node_modules/govuk-frontend/dist/govuk/components/input/_index.scss'
      }
    },
    expect: 'allow'
  },
  {
    name: 'an unrelated project file',
    payload: { tool_input: { file_path: '/p/app/views/name.html' } },
    expect: 'allow'
  },
  {
    name: 'another package entirely',
    payload: { tool_input: { file_path: '/p/node_modules/express/index.js' } },
    expect: 'allow'
  },
  {
    name: 'running the prototype',
    payload: { tool_input: { command: 'npm run dev' } },
    expect: 'allow'
  },
  {
    name: 'installing the package',
    payload: { tool_input: { command: 'npm install govuk-frontend@latest' } },
    expect: 'allow'
  },
  {
    name: 'checking the installed version',
    payload: { tool_input: { command: 'npm ls govuk-frontend' } },
    expect: 'allow'
  },
  {
    name: 'writing a project file',
    payload: { tool_input: { file_path: '/p/app/views/name.html' } },
    expect: 'allow'
  },
  {
    name: 'malformed input',
    payload: {},
    expect: 'allow'
  },

  // The hook reads argument keys that name a target. It must never read the
  // content being written, or documentation that mentions the path would be
  // unwritable — this file among them.
  {
    name: 'writing content that mentions the path',
    payload: {
      tool_input: {
        file_path: '/p/docs/notes.md',
        content: 'Do not read node_modules/govuk-frontend/dist/govuk/components/input/macro.njk'
      }
    },
    expect: 'allow'
  },
  {
    name: 'editing a file to mention the path',
    payload: {
      tool_input: {
        file_path: '/p/README.md',
        old_string: 'x',
        new_string: 'see node_modules/govuk-frontend/dist/govuk/components/radios/template.njk'
      }
    },
    expect: 'allow'
  },

  // Copilot's own argument names.
  {
    name: 'Copilot view tool on a component template',
    payload: {
      toolArgs: {
        path: '/p/node_modules/govuk-frontend/dist/govuk/components/select/template.njk'
      }
    },
    expect: 'deny',
    reasonIncludes: 'references/select.md'
  }
]

function assertCase(host, testCase) {
  const result = run(host.shape(testCase.payload))
  assert.equal(result.decision, testCase.expect)
  if (testCase.reasonIncludes) {
    assert.ok(
      result.reason?.includes(testCase.reasonIncludes),
      `reason did not mention ${testCase.reasonIncludes}`
    )
  }
}

// Claude Code and Copilot CLI name their arguments differently, so the same
// cases run again under Copilot's payload shape — proving the hook decides
// on the arguments, not on a host's payload vocabulary.
const hosts = [
  { label: 'claude', shape: (payload) => payload },
  { label: 'copilot', shape: (payload) => asCopilot(payload) }
]

for (const host of hosts) {
  for (const testCase of cases) {
    test(`[${host.label}] ${testCase.name}`, () => {
      assertCase(host, testCase)
    })
  }
}

test('null input passes', () => {
  assert.deepEqual(run(null), { decision: 'allow' })
})

test('undefined input passes', () => {
  assert.deepEqual(run(undefined), { decision: 'allow' })
})
