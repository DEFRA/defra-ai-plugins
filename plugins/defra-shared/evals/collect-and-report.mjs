// Shared report-builder for the defra-shared eval providers.
//
// Walks every hook in the catalogue, drives it with a representative
// synthetic input (the same inputs AC6 lists in eval_taxonomy.md), and
// prints one combined block to stdout for promptfoo to assert against.
//
// Output format (multi-section):
//   === PROVIDER ===
//   <label>
//   prompt: <prompt>
//
//   === SKILLS LOADED ===
//   <list of SKILL.md files found, one per line>
//
//   === HOOKS DEFINED ===
//   <list of hook ids extracted from hooks.json>
//
//   === HOOK RUN <id> <case-label> ===
//   exit_code: <n>
//   stderr:
//   <captured stderr lines>
//
//   === REFUSAL TRACE ===
//   <one-line summary per blocking-hook case>

import { readFileSync, mkdtempSync, cpSync, rmSync, readdirSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { driveHook } from '../eval-fixture/scripts/run-hook.mjs'

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
      }
    }
  }
  try {
    walk(skillsDir)
  } catch {
    // Skills dir may not exist; treat as empty.
  }
  return out.sort()
}

// Collect every hook's statusMessage from a parsed hooks.json config, in
// declaration order. Hooks without a statusMessage report "(no statusMessage)".
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

function stageFeatureBranch(fixtureDir) {
  const scriptDir = join(fixtureDir, 'scripts')
  const stage = execFileSync('node', [join(scriptDir, 'init-git.mjs')], {
    encoding: 'utf8'
  }).trim()
  execFileSync('git', ['checkout', '-q', '-b', 'feature/x'], { cwd: stage })
  return stage
}

function runOne(out, hookId, label, projectDir, inputJson) {
  out.push(`=== HOOK RUN ${hookId} ${label} ===`)
  const { exitCode, stderr } = driveHook({ hookId, input: inputJson, projectDir })
  out.push(`exit_code: ${exitCode}`)
  out.push('stderr:')
  if (stderr) {
    out.push(stderr.replace(/\n$/, ''))
  }
  out.push('')
}

export function report({ provider, prompt, fixtureDir }) {
  const pluginDir = join(fixtureDir, '..')
  const out = []

  out.push('=== PROVIDER ===')
  out.push(provider)
  out.push(`prompt: ${prompt}`)
  out.push('')

  out.push('=== SKILLS LOADED ===')
  for (const file of findSkillFiles(join(pluginDir, 'skills'))) {
    out.push(relative(pluginDir, file))
  }
  out.push('')

  out.push('=== HOOKS DEFINED ===')
  const hooksConfig = JSON.parse(readFileSync(join(pluginDir, 'hooks', 'hooks.json'), 'utf8'))
  for (const msg of listHookStatusMessages(hooksConfig)) {
    out.push(msg)
  }
  out.push('')

  // --- branch-guard --------------------------------------------------------

  // Fresh fixture HEAD is on `main`, no explicit project dir.
  runOne(
    out,
    'branch-guard',
    'main+commit',
    undefined,
    JSON.stringify({ tool_input: { command: 'git commit -m "feat: x"' } })
  )

  // Negative control on feature branch.
  let stage = stageFeatureBranch(fixtureDir)
  runOne(
    out,
    'branch-guard',
    'feature-branch',
    stage,
    JSON.stringify({ tool_input: { command: 'git commit -m "feat: x"' } })
  )
  rmSync(stage, { recursive: true, force: true })

  // Force-push to main from feature.
  stage = stageFeatureBranch(fixtureDir)
  runOne(
    out,
    'branch-guard',
    'force-push-main',
    stage,
    JSON.stringify({ tool_input: { command: 'git push --force origin main' } })
  )
  rmSync(stage, { recursive: true, force: true })

  // --force-with-lease HEAD:main from feature.
  stage = stageFeatureBranch(fixtureDir)
  runOne(
    out,
    'branch-guard',
    'force-with-lease-main',
    stage,
    JSON.stringify({ tool_input: { command: 'git push --force-with-lease origin HEAD:main' } })
  )
  rmSync(stage, { recursive: true, force: true })

  // Force-push to a feature branch (negative control).
  stage = stageFeatureBranch(fixtureDir)
  runOne(
    out,
    'branch-guard',
    'force-push-feature',
    stage,
    JSON.stringify({ tool_input: { command: 'git push --force origin feature/x' } })
  )
  rmSync(stage, { recursive: true, force: true })

  // --- commit-message-format ----------------------------------------------

  runOne(
    out,
    'commit-message-format',
    'WIP',
    undefined,
    JSON.stringify({ tool_input: { command: 'git commit -m "WIP"' } })
  )
  runOne(
    out,
    'commit-message-format',
    'valid-feat',
    undefined,
    JSON.stringify({ tool_input: { command: 'git commit -m "feat(api): add endpoint"' } })
  )
  runOne(
    out,
    'commit-message-format',
    'am-bypass',
    undefined,
    JSON.stringify({ tool_input: { command: 'git commit -am "WIP"' } })
  )
  runOne(
    out,
    'commit-message-format',
    'long-bypass',
    undefined,
    JSON.stringify({ tool_input: { command: 'git commit --message="WIP"' } })
  )
  runOne(
    out,
    'commit-message-format',
    'F-bypass',
    undefined,
    JSON.stringify({ tool_input: { command: 'git commit -F /tmp/msg.txt' } })
  )
  runOne(
    out,
    'commit-message-format',
    'editor-bypass',
    undefined,
    JSON.stringify({ tool_input: { command: 'git commit' } })
  )
  runOne(
    out,
    'commit-message-format',
    'amend-no-edit',
    undefined,
    JSON.stringify({ tool_input: { command: 'git commit --amend --no-edit' } })
  )

  // --- secret-scan ---------------------------------------------------------

  const planted = `${fixtureDir}/fixtures/secret-planted.js`
  const clean = `${fixtureDir}/fixtures/clean.js`
  runOne(
    out,
    'secret-scan',
    'AWS-key',
    undefined,
    JSON.stringify({
      tool_input: { file_path: planted, content: "const k = 'AKIAIOSFODNN7EXAMPLE'" }
    })
  )
  runOne(
    out,
    'secret-scan',
    'clean-content',
    undefined,
    JSON.stringify({ tool_input: { file_path: clean, content: 'export const greeting = "hello"' } })
  )
  runOne(
    out,
    'secret-scan',
    'AWS-secret',
    undefined,
    JSON.stringify({
      tool_input: {
        file_path: planted,
        content: "const AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'"
      }
    })
  )
  runOne(
    out,
    'secret-scan',
    'openai-key',
    undefined,
    JSON.stringify({
      tool_input: {
        file_path: planted,
        content: "const k = 'sk-proj-AAAAAAAAAAAAAAAAAAAA1234567890abc'"
      }
    })
  )
  runOne(
    out,
    'secret-scan',
    'anthropic-key',
    undefined,
    JSON.stringify({
      tool_input: {
        file_path: planted,
        content: "const k = 'sk-ant-api03-AAAAAAAAAAAAAAAAAAAA1234567890'"
      }
    })
  )
  runOne(
    out,
    'secret-scan',
    'jwt',
    undefined,
    JSON.stringify({
      tool_input: {
        file_path: planted,
        content:
          "const t = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'"
      }
    })
  )

  // --- pii-scan ------------------------------------------------------------

  // Copy the planted markdown out of the fixtures/ skip-path so the scanner
  // actually flags it (the hook now skips */eval-fixture/fixtures/* so the
  // planted file does not flag itself during regression runs).
  const piiTmp = mkdtempSync(join(tmpdir(), 'pii-planted-')) + '.md'
  cpSync(`${fixtureDir}/fixtures/pii-planted.md`, piiTmp)
  runOne(
    out,
    'pii-scan',
    'planted-pii',
    undefined,
    JSON.stringify({ tool_input: { file_path: piiTmp } })
  )
  rmSync(piiTmp, { force: true })

  runOne(
    out,
    'pii-scan',
    'fixture-skipped',
    undefined,
    JSON.stringify({ tool_input: { file_path: `${fixtureDir}/fixtures/pii-planted.md` } })
  )

  // --- coverage-floor ------------------------------------------------------

  const lowCovOut = readFileSync(`${fixtureDir}/fixtures/lowcov-test-output.txt`, 'utf8')
  runOne(
    out,
    'coverage-floor',
    'low-coverage',
    undefined,
    JSON.stringify({ tool_input: { command: 'npm test' }, tool_response: { stdout: lowCovOut } })
  )

  // --- refusal trace -------------------------------------------------------

  out.push('=== REFUSAL TRACE ===')
  out.push('branch-guard refused commit on main: see HOOK RUN branch-guard main+commit')
  out.push('commit-message-format refused WIP subject: see HOOK RUN commit-message-format WIP')
  out.push('secret-scan refused AWS key: see HOOK RUN secret-scan AWS-key')

  process.stdout.write(out.join('\n') + '\n')
}
