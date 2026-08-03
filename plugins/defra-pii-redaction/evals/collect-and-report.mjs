// Shared report-builder for the defra-pii-redaction eval.
//
// Drives the redact_pii.py script with synthetic hook payloads representing
// each event type (UserPromptSubmit, PreToolUse, PostToolUse) and a variety
// of PII categories. Produces a combined multi-section text report for
// promptfoo assertions.
//
// Output format:
//   === PROVIDER ===
//   <label>
//   prompt: <prompt>
//
//   === SKILLS LOADED ===
//   <list of SKILL.md files found>
//
//   === HOOKS DEFINED ===
//   <list of hook statusMessages>
//
//   === HOOK RUN <event> <case-label> ===
//   exit_code: <n>
//   stdout:
//   <hook JSON output — a decision/hookSpecificOutput envelope, or empty>
//   stderr:
//   <any stderr lines>

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { driveHook, preload } from '../eval-fixture/scripts/run-hook.mjs'

// PII values are base64-encoded so the PII redaction hooks running on this
// file do not corrupt the test inputs.
// To decode: atob('...') or Buffer.from('...', 'base64').toString()
function b64(s) {
  return Buffer.from(s, 'base64').toString('utf8')
}

export const FIXTURES = [
  // --- UserPromptSubmit cases ---
  // These prompts contain PII and should produce {"decision": "block"} output.
  // Claude Code cannot replace prompt text via hooks, only block.
  {
    label: 'prompt-nino',
    event: 'UserPromptSubmit',
    payload: () => ({ prompt: `My NI number is ${b64('QUIgMTIgMzQgNTYgQw==')} and I need help` }),
    expectedDecision: 'block'
  },
  {
    label: 'prompt-nhs',
    event: 'UserPromptSubmit',
    payload: () => ({ prompt: `Patient NHS number ${b64('OTQzIDQ3NiA1OTE5')} needs a referral` }),
    expectedDecision: 'block'
  },
  {
    label: 'prompt-person-email',
    event: 'UserPromptSubmit',
    payload: () => ({
      prompt: `Contact ${b64('Sm9obiBTbWl0aA==')} at ${b64('am9obi5zbWl0aEBkZWZyYS5nb3YudWs=')} about the application`
    }),
    expectedDecision: 'block'
  },
  {
    label: 'prompt-clean',
    event: 'UserPromptSubmit',
    payload: () => ({ prompt: 'How do I configure the database connection pool size?' }),
    expectedDecision: null
  },

  // --- PreToolUse cases (tool inputs) ---
  // These produce {"hookSpecificOutput": {"updatedInput": {...}}} output.
  {
    label: 'pre-sbi',
    event: 'PreToolUse',
    payload: () => ({ tool_input: { content: `The farmer SBI is ${b64('MTA1MTIzNDU2')} for this holding` } }),
    expectedPlaceholders: ['<SBI>']
  },
  {
    label: 'pre-crn',
    event: 'PreToolUse',
    payload: () => ({ tool_input: { query: `Look up CRN ${b64('MTA1MTIzNDU2LzEyLzM0NS82Nzg5')} in the system` } }),
    expectedPlaceholders: ['<CRN>']
  },
  {
    label: 'pre-cph',
    event: 'PreToolUse',
    payload: () => ({ tool_input: { content: `County Parish Holding: CPH ${b64('MTIvMzQ1LzY3ODk=')} is registered` } }),
    expectedPlaceholders: ['<CPH>']
  },
  {
    label: 'pre-postcode',
    event: 'PreToolUse',
    payload: () => ({ tool_input: { address: `Defra Office, ${b64('U1cxQSAyTlM=')}, London` } }),
    expectedPlaceholders: ['<UK_POSTCODE>']
  },

  // --- PostToolUse cases (tool outputs) ---
  // These produce {"hookSpecificOutput": {"updatedToolOutput": {...}}} output.
  {
    label: 'post-credit-card',
    event: 'PostToolUse',
    payload: () => ({ tool_response: { stdout: `Payment processed with card ${b64('NDExMSAxMTExIDExMTEgMTExMQ==')}` } }),
    expectedPlaceholders: ['<CREDIT_CARD>']
  },
  {
    label: 'post-phone',
    event: 'PostToolUse',
    payload: () => ({ tool_response: { stdout: `Contact the helpline on ${b64('KzQ0NzkxMTEyMzQ1Ng==')} for assistance` } }),
    expectedPlaceholders: ['<PHONE_NUMBER>']
  },
  {
    label: 'post-multi-pii',
    event: 'PostToolUse',
    payload: () => ({
      tool_response: {
        stdout: `Record: ${b64('SmFuZSBEb2U=')}, NI ${b64('QUIxMjM0NTZDP=')}, NHS ${b64('OTQzIDQ3NiA1OTE5')}, SBI ${b64('MTA1MTIzNDU2')}, address ${b64('RVgxIDFBQQ==')}`
      }
    }),
    expectedPlaceholders: ['<UK_NINO>', '<UK_NHS>', '<SBI>', '<UK_POSTCODE>']
  },
  {
    label: 'post-clean',
    event: 'PostToolUse',
    payload: () => ({ tool_response: { stdout: 'Build succeeded in 3.2s with 0 warnings.' } }),
    expectedPlaceholders: []
  }
]

function findSkillFiles(skillsDir) {
  const out = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry)
      const s = statSync(p)
      if (s.isDirectory()) {
        walk(p)
      } else if (entry === 'SKILL.md') {
        out.push(p)
      } else {
        /* not a skill file, ignore */
      }
    }
  }
  try {
    walk(skillsDir)
  } catch {
    /* skills dir may not exist */
  }
  return out.sort((a, b) => a.localeCompare(b))
}

export function listHookStatusMessages(config) {
  const messages = []
  for (const event of Object.values(config.hooks ?? {})) {
    for (const matcher of event ?? []) {
      for (const hook of matcher.hooks ?? []) {
        messages.push(hook.statusMessage || '(no statusMessage)')
      }
    }
  }
  return messages
}

function runOne(out, event, label, input) {
  const { exitCode, stdout, stderr } = driveHook({ input })
  out.push(
    `=== HOOK RUN ${event} ${label} ===`,
    `exit_code: ${exitCode}`,
    'stdout:',
    ...(stdout ? [stdout.replace(/\n$/, '')] : []),
    'stderr:',
    ...(stderr ? [stderr.replace(/\n$/, '')] : []),
    ''
  )
}

export function report({ provider, prompt, fixtureDir }) {
  const pluginDir = join(fixtureDir, '..')
  const out = []

  // Header and skills
  out.push(
    '=== PROVIDER ===',
    provider,
    `prompt: ${prompt}`,
    '',
    '=== SKILLS LOADED ===',
    ...findSkillFiles(join(pluginDir, 'skills')).map((file) => relative(pluginDir, file)),
    ''
  )

  // Hooks defined
  const hooksConfig = JSON.parse(readFileSync(join(pluginDir, 'hooks', 'hooks.json'), 'utf8'))
  out.push('=== HOOKS DEFINED ===', ...listHookStatusMessages(hooksConfig), '')

  // Preload (warm up model/deps once before running test cases)
  preload()

  // Drive each fixture — resolve payloads at runtime so b64 decoding
  // produces the real PII values only when the hook runner executes them.
  for (const fixture of FIXTURES) {
    const payload = typeof fixture.payload === 'function' ? fixture.payload() : fixture.payload
    runOne(out, fixture.event, fixture.label, JSON.stringify(payload))
  }

  process.stdout.write(out.join('\n') + '\n')
}
