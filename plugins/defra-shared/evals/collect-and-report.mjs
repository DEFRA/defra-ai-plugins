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
import { join, relative, dirname } from 'node:path'
import { driveHook } from '../eval-fixture/scripts/run-hook.mjs'

const GIT_BIN = execFileSync('/usr/bin/which', ['git'], { encoding: 'utf8' }).trim()

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
        // skip non-SKILL.md files
      }
    }
  }
  try {
    walk(skillsDir)
  } catch {
    // Skills dir may not exist; treat as empty.
  }
  return out.sort((a, b) => a.localeCompare(b))
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
  const stage = execFileSync(process.execPath, [join(scriptDir, 'init-git.mjs')], {
    encoding: 'utf8'
  }).trim()
  execFileSync(GIT_BIN, ['checkout', '-q', '-b', 'feature/x'], { cwd: stage })
  return stage
}

// Stage a fresh fixture on a feature branch, run `fn(stage)`, and always clean
// up the temp checkout afterwards (even if `fn` throws).
function withFeatureBranch(fixtureDir, fn) {
  const stage = stageFeatureBranch(fixtureDir)
  try {
    fn(stage)
  } finally {
    rmSync(stage, { recursive: true, force: true })
  }
}

function runOne(out, hookId, label, projectDir, inputJson) {
  out.push(`=== HOOK RUN ${hookId} ${label} ===`)
  const { exitCode, stderr } = driveHook({ hookId, input: inputJson, projectDir })
  out.push(`exit_code: ${exitCode}`, 'stderr:')
  if (stderr) {
    out.push(stderr.replace(/\n$/, ''))
  }
  out.push('')
}

const HOOK_BRANCH_GUARD = 'branch-guard'
const HOOK_COMMIT_MSG = 'commit-message-format'
const HOOK_SECRET_SCAN = 'secret-scan'
const GIT_COMMIT_FEAT = 'git commit -m "feat: x"'

function reportHeader(out, provider, prompt, pluginDir) {
  out.push('=== PROVIDER ===', provider, `prompt: ${prompt}`, '', '=== SKILLS LOADED ===')
  for (const file of findSkillFiles(join(pluginDir, 'skills'))) {
    out.push(relative(pluginDir, file))
  }
  out.push('', '=== HOOKS DEFINED ===')
  const hooksConfig = JSON.parse(readFileSync(join(pluginDir, 'hooks', 'hooks.json'), 'utf8'))
  for (const msg of listHookStatusMessages(hooksConfig)) {
    out.push(msg)
  }
  out.push('')
}

function reportBranchGuard(out, fixtureDir) {
  runOne(
    out,
    HOOK_BRANCH_GUARD,
    'main+commit',
    undefined,
    JSON.stringify({ tool_input: { command: GIT_COMMIT_FEAT } })
  )

  withFeatureBranch(fixtureDir, (stage) =>
    runOne(
      out,
      HOOK_BRANCH_GUARD,
      'feature-branch',
      stage,
      JSON.stringify({ tool_input: { command: GIT_COMMIT_FEAT } })
    )
  )

  withFeatureBranch(fixtureDir, (stage) =>
    runOne(
      out,
      HOOK_BRANCH_GUARD,
      'force-push-main',
      stage,
      JSON.stringify({ tool_input: { command: 'git push --force origin main' } })
    )
  )

  withFeatureBranch(fixtureDir, (stage) =>
    runOne(
      out,
      HOOK_BRANCH_GUARD,
      'force-with-lease-main',
      stage,
      JSON.stringify({ tool_input: { command: 'git push --force-with-lease origin HEAD:main' } })
    )
  )

  withFeatureBranch(fixtureDir, (stage) =>
    runOne(
      out,
      HOOK_BRANCH_GUARD,
      'force-push-feature',
      stage,
      JSON.stringify({ tool_input: { command: 'git push --force origin feature/x' } })
    )
  )
}

function reportCommitMsgFormat(out) {
  const cases = [
    ['WIP', 'git commit -m "WIP"'],
    ['valid-feat', 'git commit -m "feat(api): add endpoint"'],
    ['am-bypass', 'git commit -am "WIP"'],
    ['long-bypass', 'git commit --message="WIP"'],
    ['F-bypass', 'git commit -F /tmp/msg.txt'],
    ['editor-bypass', 'git commit'],
    ['amend-no-edit', 'git commit --amend --no-edit']
  ]
  for (const [name, command] of cases) {
    runOne(out, HOOK_COMMIT_MSG, name, undefined, JSON.stringify({ tool_input: { command } }))
  }
}

function reportSecretScan(out, fixtureDir) {
  const planted = `${fixtureDir}/fixtures/secret-planted.js`
  const clean = `${fixtureDir}/fixtures/clean.js`
  runOne(
    out,
    HOOK_SECRET_SCAN,
    'AWS-key',
    undefined,
    JSON.stringify({
      tool_input: { file_path: planted, content: "const k = 'AKIAIOSFODNN7EXAMPLE'" }
    })
  )
  runOne(
    out,
    HOOK_SECRET_SCAN,
    'clean-content',
    undefined,
    JSON.stringify({ tool_input: { file_path: clean, content: 'export const greeting = "hello"' } })
  )
  runOne(
    out,
    HOOK_SECRET_SCAN,
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
    HOOK_SECRET_SCAN,
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
    HOOK_SECRET_SCAN,
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
    HOOK_SECRET_SCAN,
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
}

function reportPiiScan(out, fixtureDir) {
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
}

function reportCoverageFloor(out, fixtureDir) {
  const lowCovOut = readFileSync(`${fixtureDir}/fixtures/lowcov-test-output.txt`, 'utf8')
  runOne(
    out,
    'coverage-floor',
    'low-coverage',
    undefined,
    JSON.stringify({ tool_input: { command: 'npm test' }, tool_response: { stdout: lowCovOut } })
  )
}

export function report({ provider, prompt, fixtureDir }) {
  const pluginDir = join(fixtureDir, '..')
  const out = []

  reportHeader(out, provider, prompt, pluginDir)

  // --- branch-guard --------------------------------------------------------
  reportBranchGuard(out, fixtureDir)

  // --- commit-message-format ----------------------------------------------
  reportCommitMsgFormat(out)

  // --- secret-scan ---------------------------------------------------------
  reportSecretScan(out, fixtureDir)

  // --- pii-scan ------------------------------------------------------------
  reportPiiScan(out, fixtureDir)

  // --- coverage-floor ------------------------------------------------------
  reportCoverageFloor(out, fixtureDir)

  // --- refusal trace -------------------------------------------------------
  out.push(
    '=== REFUSAL TRACE ===',
    'branch-guard refused commit on main: see HOOK RUN branch-guard main+commit',
    'commit-message-format refused WIP subject: see HOOK RUN commit-message-format WIP',
    'secret-scan refused AWS key: see HOOK RUN secret-scan AWS-key'
  )

  process.stdout.write(out.join('\n') + '\n')
}
