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
//   <redacted JSON output>
//   stderr:
//   <any stderr lines>

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { driveHook, preload } from '../eval-fixture/scripts/run-hook.mjs'

export const FIXTURES = [
  // --- UserPromptSubmit cases ---
  {
    label: 'prompt-nino',
    event: 'UserPromptSubmit',
    payload: { prompt: 'My NI number is AB 12 34 56 C and I need help' },
    piiValues: ['AB 12 34 56 C'],
    expectedPlaceholders: ['<UK_NINO>']
  },
  {
    label: 'prompt-nhs',
    event: 'UserPromptSubmit',
    payload: { prompt: 'Patient NHS number 943 476 5919 needs a referral' },
    piiValues: ['943 476 5919'],
    expectedPlaceholders: ['<UK_NHS>']
  },
  {
    label: 'prompt-person-email',
    event: 'UserPromptSubmit',
    payload: { prompt: 'Contact John Smith at john.smith@defra.gov.uk about the application' },
    piiValues: ['John Smith', 'john.smith@defra.gov.uk'],
    expectedPlaceholders: ['<PERSON>', '<EMAIL_ADDRESS>']
  },
  {
    label: 'prompt-clean',
    event: 'UserPromptSubmit',
    payload: { prompt: 'How do I configure the database connection pool size?' },
    piiValues: [],
    expectedPlaceholders: []
  },

  // --- PreToolUse cases (tool inputs) ---
  {
    label: 'pre-sbi',
    event: 'PreToolUse',
    payload: { tool_input: { content: 'The farmer SBI is 105123456 for this holding' } },
    piiValues: ['105123456'],
    expectedPlaceholders: ['<SBI>']
  },
  {
    label: 'pre-crn',
    event: 'PreToolUse',
    payload: { tool_input: { query: 'Look up CRN 105123456/12/345/6789 in the system' } },
    piiValues: ['105123456/12/345/6789'],
    expectedPlaceholders: ['<CRN>']
  },
  {
    label: 'pre-cph',
    event: 'PreToolUse',
    payload: { tool_input: { content: 'County Parish Holding: CPH 12/345/6789 is registered' } },
    piiValues: ['12/345/6789'],
    expectedPlaceholders: ['<CPH>']
  },
  {
    label: 'pre-postcode',
    event: 'PreToolUse',
    payload: { tool_input: { address: 'Defra Office, SW1A 2NS, London' } },
    piiValues: ['SW1A 2NS'],
    expectedPlaceholders: ['<UK_POSTCODE>']
  },

  // --- PostToolUse cases (tool outputs) ---
  {
    label: 'post-credit-card',
    event: 'PostToolUse',
    payload: { tool_response: { stdout: 'Payment processed with card 4111 1111 1111 1111' } },
    piiValues: ['4111 1111 1111 1111'],
    expectedPlaceholders: ['<CREDIT_CARD>']
  },
  {
    label: 'post-phone',
    event: 'PostToolUse',
    payload: { tool_response: { stdout: 'Contact the helpline on +447911123456 for assistance' } },
    piiValues: ['+447911123456'],
    expectedPlaceholders: ['<PHONE_NUMBER>']
  },
  {
    label: 'post-multi-pii',
    event: 'PostToolUse',
    payload: {
      tool_response: {
        stdout: 'Record: Jane Doe, NI AB123456C, NHS 943 476 5919, SBI 105123456, address EX1 1AA'
      }
    },
    piiValues: ['Jane Doe', 'AB123456C', '943 476 5919', '105123456', 'EX1 1AA'],
    expectedPlaceholders: ['<PERSON>', '<UK_NINO>', '<UK_NHS>', '<SBI>', '<UK_POSTCODE>']
  },
  {
    label: 'post-clean',
    event: 'PostToolUse',
    payload: { tool_response: { stdout: 'Build succeeded in 3.2s with 0 warnings.' } },
    piiValues: [],
    expectedPlaceholders: []
  }
]

function findSkillFiles(skillsDir) {
  const out = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry)
      const s = statSync(p)
      if (s.isDirectory()) walk(p)
      else if (entry === 'SKILL.md') out.push(p)
    }
  }
  try { walk(skillsDir) } catch { /* skills dir may not exist */ }
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
  out.push(`=== HOOK RUN ${event} ${label} ===`)
  const { exitCode, stdout, stderr } = driveHook({ input })
  out.push(`exit_code: ${exitCode}`)
  out.push('stdout:')
  if (stdout) out.push(stdout.replace(/\n$/, ''))
  out.push('stderr:')
  if (stderr) out.push(stderr.replace(/\n$/, ''))
  out.push('')
}

export function report({ provider, prompt, fixtureDir }) {
  const pluginDir = join(fixtureDir, '..')
  const out = []

  // Header
  out.push('=== PROVIDER ===', provider, `prompt: ${prompt}`, '')

  // Skills
  out.push('=== SKILLS LOADED ===')
  for (const file of findSkillFiles(join(pluginDir, 'skills'))) {
    out.push(relative(pluginDir, file))
  }
  out.push('')

  // Hooks defined
  out.push('=== HOOKS DEFINED ===')
  const hooksConfig = JSON.parse(readFileSync(join(pluginDir, 'hooks', 'hooks.json'), 'utf8'))
  for (const msg of listHookStatusMessages(hooksConfig)) {
    out.push(msg)
  }
  out.push('')

  // Preload (warm up model/deps once before running test cases)
  preload()

  // Drive each fixture
  for (const fixture of FIXTURES) {
    runOne(out, fixture.event, fixture.label, JSON.stringify(fixture.payload))
  }

  process.stdout.write(out.join('\n') + '\n')
}
