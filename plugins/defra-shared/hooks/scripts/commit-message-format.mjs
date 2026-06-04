#!/usr/bin/env node
// Validate Conventional Commits subject on `git commit`.
// Refuse forms that bypass message inspection (-F / --file / --template /
// -C / --reuse-message / --fixup / --squash) and editor-driven commits.
// Allow `--amend --no-edit` (reuses an already-validated message).

import { fileURLToPath } from 'node:url'
import { runHook } from './hook-runner.mjs'

const TYPES =
  /^(feat|fix|chore|docs|refactor|test|build|ci|perf|style|revert)(\([a-z0-9-]+\))?(!)?: [^\s].*[^.\s]$/

const BYPASS_FLAGS =
  /(^|\s)(-F(\s|$)|--file(\s|=)|--template(\s|=)|-C(\s|$)|--reuse-message(\s|=)|--fixup(\s|=)|--squash(\s|=))/

const HAS_M_OR_MESSAGE = /(-[a-zA-Z]*m(\s|=)|--message[= ])/

// Capture the message argument from -m / --message= / --message <text>.
const EXTRACT_MSG = /(?:--message=|--message\s+|\s-[a-zA-Z]*m\s+)("[^"]*"|'[^']*'|[^ ]+)/

function stripQuotes(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1)
  }
  return s
}

export function check(input) {
  const cmd = input.tool_input?.command ?? ''

  if (!/^\s*git\s+commit(\s|$)/.test(cmd)) {
    return { exitCode: 0 }
  }

  const hasAmend = /(^|\s)--amend(\s|=|$)/.test(cmd)
  const hasNoEdit = /(^|\s)--no-edit(\s|$)/.test(cmd)
  if (hasAmend && hasNoEdit) {
    return { exitCode: 0 }
  }

  if (BYPASS_FLAGS.test(cmd)) {
    return {
      exitCode: 2,
      stderr:
        'commit-message-format: -F/--file/--template/-C/--reuse-message/--fixup/--squash bypass subject validation. Use -m "type(scope): subject". See skill defra-commit-messages.\n'
    }
  }

  if (!HAS_M_OR_MESSAGE.test(cmd)) {
    return {
      exitCode: 2,
      stderr:
        'commit-message-format: commit without -m/--message would open the editor (not usable from an agent). Use -m "type(scope): subject". See skill defra-commit-messages.\n'
    }
  }

  const matched = cmd.match(EXTRACT_MSG)
  const msg = stripQuotes(matched ? matched[1] : '')

  if (!msg) {
    return {
      exitCode: 2,
      stderr:
        'commit-message-format: could not parse commit subject from -m / --message argument.\n'
    }
  }

  const subject = msg.split('\n')[0]

  if (subject.length > 72) {
    return {
      exitCode: 2,
      stderr: `commit-message-format: subject is ${subject.length} chars; max is 72. Subject: '${subject}'. See skill defra-commit-messages.\n`
    }
  }

  if (!TYPES.test(subject)) {
    return {
      exitCode: 2,
      stderr: `commit-message-format: subject '${subject}' does not match Conventional Commits (type(scope)?: subject, <=72 chars, no trailing period). See skill defra-commit-messages.\n`
    }
  }

  return { exitCode: 0 }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runHook(check)
}
