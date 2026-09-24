#!/usr/bin/env node
// The hook must deny the expensive path and stay out of the way everywhere else.
// A hook that over-blocks gets uninstalled, so the allow cases matter as much as
// the deny ones.

import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HOOK = path.join(path.dirname(fileURLToPath(import.meta.url)), 'redirect-node-modules.mjs')

function run(payload) {
  const stdout = execFileSync(process.execPath, [HOOK], {
    input: JSON.stringify(payload),
    encoding: 'utf8'
  })
  if (!stdout.trim()) {
    return { decision: 'allow' }
  }
  const parsed = JSON.parse(stdout)

  // The two hosts read different shapes out of the same object. Assert both are
  // present and agree, so a change that satisfies one cannot silently break the
  // other.
  const claude = parsed.hookSpecificOutput
  if (!claude) {
    throw new Error('missing hookSpecificOutput — Claude Code would not see the denial')
  }
  if (typeof parsed.permissionDecision !== 'string') {
    throw new TypeError('missing top-level permissionDecision — Copilot CLI would not see the denial')
  }
  if (parsed.permissionDecision !== claude.permissionDecision) {
    throw new Error('the two host shapes disagree')
  }
  if (parsed.permissionDecisionReason !== claude.permissionDecisionReason) {
    throw new Error('the two host shapes carry different reasons')
  }

  return { decision: parsed.permissionDecision, reason: parsed.permissionDecisionReason }
}

// Copilot CLI sends toolName/toolArgs where Claude Code sends tool_name/tool_input.
function asCopilot(payload) {
  const { tool_name: toolName, tool_input: toolArgs, ...rest } = payload
  return { ...rest, ...(toolName ? { toolName } : {}), ...(toolArgs ? { toolArgs } : {}) }
}

const cases = [
  // Denied: the templates and macro options the reference files replace.
  {
    name: 'macro-options.json read',
    payload: {
      tool_name: 'Read',
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
      tool_name: 'Read',
      tool_input: {
        file_path: '/p/node_modules/govuk-frontend/dist/govuk/components/radios/template.njk'
      }
    },
    expect: 'deny',
    reasonIncludes: 'references/radios.md'
  },
  {
    name: 'glob across the package',
    payload: { tool_name: 'Glob', tool_input: { pattern: 'node_modules/govuk-frontend/**/*.njk' } },
    expect: 'deny'
  },
  {
    name: 'grep through Bash',
    payload: {
      tool_name: 'Bash',
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
      tool_name: 'Read',
      tool_input: { file_path: '/p/node_modules/govuk-frontend/dist/govuk/all.bundle.js' }
    },
    expect: 'allow'
  },
  {
    name: 'package Sass',
    payload: {
      tool_name: 'Read',
      tool_input: {
        file_path: '/p/node_modules/govuk-frontend/dist/govuk/components/input/_index.scss'
      }
    },
    expect: 'allow'
  },
  {
    name: 'an unrelated project file',
    payload: { tool_name: 'Read', tool_input: { file_path: '/p/app/views/name.html' } },
    expect: 'allow'
  },
  {
    name: 'another package entirely',
    payload: { tool_name: 'Read', tool_input: { file_path: '/p/node_modules/express/index.js' } },
    expect: 'allow'
  },
  {
    name: 'running the prototype',
    payload: { tool_name: 'Bash', tool_input: { command: 'npm run dev' } },
    expect: 'allow'
  },
  {
    name: 'installing the package',
    payload: { tool_name: 'Bash', tool_input: { command: 'npm install govuk-frontend@latest' } },
    expect: 'allow'
  },
  {
    name: 'checking the installed version',
    payload: { tool_name: 'Bash', tool_input: { command: 'npm ls govuk-frontend' } },
    expect: 'allow'
  },
  {
    name: 'writing a project file',
    payload: { tool_name: 'Write', tool_input: { file_path: '/p/app/views/name.html' } },
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
      tool_name: 'Write',
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
      tool_name: 'Edit',
      tool_input: {
        file_path: '/p/README.md',
        old_string: 'x',
        new_string: 'see node_modules/govuk-frontend/dist/govuk/components/radios/template.njk'
      }
    },
    expect: 'allow'
  },

  // Copilot's own tool vocabulary, with its argument names.
  {
    name: 'Copilot view tool on a component template',
    payload: {
      tool_name: 'view',
      tool_input: {
        path: '/p/node_modules/govuk-frontend/dist/govuk/components/select/template.njk'
      }
    },
    expect: 'deny',
    reasonIncludes: 'references/select.md'
  }
]

// Copilot names its tools differently (bash, view, edit), so the same cases run
// again under Copilot's payload shape with the tool name stripped entirely —
// proving the hook decides on the arguments, not on a host's tool vocabulary.
const hosts = [
  { label: 'claude', shape: (payload) => payload },
  { label: 'copilot', shape: (payload) => asCopilot(payload) },
  {
    label: 'copilot/unknown-tool',
    shape: (payload) => ({ ...asCopilot(payload), toolName: 'view' })
  }
]

let failed = 0
let total = 0
for (const host of hosts) {
  for (const testCase of cases) {
    total++
    let result
    try {
      result = run(host.shape(testCase.payload))
    } catch (error) {
      failed++
      console.error(`FAIL  [${host.label}] ${testCase.name}: ${error.message}`)
      continue
    }

    const wrongDecision = result.decision !== testCase.expect
    const wrongReason = testCase.reasonIncludes && !result.reason?.includes(testCase.reasonIncludes)

    if (wrongDecision || wrongReason) {
      failed++
      console.error(`FAIL  [${host.label}] ${testCase.name}`)
      if (wrongDecision) {
        console.error(`      expected ${testCase.expect}, got ${result.decision}`)
      }
      if (wrongReason) {
        console.error(`      reason did not mention ${testCase.reasonIncludes}`)
      }
    } else {
      console.log(`ok    [${host.label}] ${testCase.name} (${result.decision})`)
    }
  }
}

if (failed) {
  console.error(`\n${failed} of ${total} failed`)
  process.exit(1)
}
console.log(`\n${total} passed across ${hosts.length} host shapes`)
