#!/usr/bin/env node
// Refuse Edit/Write whose content contains a known secret pattern.

import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runHook } from './hook-runner.mjs'

const PATTERNS = [
  [/AKIA[0-9A-Z]{16}/, 'AWS access key id'],
  [/-----BEGIN ((RSA|EC|DSA|OPENSSH|PGP) )?PRIVATE KEY/, 'private key block'],
  [
    /(api[_-]?key|secret|password|passwd|token|bearer)[A-Za-z0-9_]*\s*[:=]\s*["'`][A-Za-z0-9+/=_\-]{16,}["'`]/i,
    'hard-coded credential'
  ],
  [/gh[oprsu]_[A-Za-z0-9]{30,}/, 'GitHub token'],
  [/xox[abpr]-[A-Za-z0-9-]{10,}/, 'Slack token'],
  [/sk-ant-(api|admin)[0-9]{2}-[A-Za-z0-9_\-]{20,}/, 'Anthropic API key'],
  [/sk-(proj|svcacct|admin)-[A-Za-z0-9_\-]{20,}/, 'OpenAI API key'],
  [/(sk|rk|pk)_(live|test)_[A-Za-z0-9]{24,}/, 'Stripe key'],
  [/AIza[0-9A-Za-z_\-]{35}/, 'Google API key'],
  [/eyJ[A-Za-z0-9_\-]{10,}\.eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}/, 'JWT']
]

/**
 * Refuse an Edit/Write tool call whose new content contains a known secret pattern
 * (AWS key, private key block, hard-coded credential, GitHub/Slack/Anthropic/OpenAI/Stripe token, JWT, etc.).
 *
 * @param {{ tool_input?: { file_path?: string, content?: string, new_string?: string } }} input - Copilot hook tool-use payload.
 * @returns {{ exitCode: number, stderr?: string }}
 */
export function check(input) {
  const file = input.tool_input?.file_path ?? ''
  const content = input.tool_input?.content ?? input.tool_input?.new_string ?? ''

  for (const [pattern, label] of PATTERNS) {
    if (pattern.test(content)) {
      return {
        exitCode: 2,
        stderr: `secret-scan: ${label} detected in change to ${basename(file)}. Move the secret to an environment variable or the platform secret manager. See skill defra-security-pii.\n`
      }
    }
  }

  return { exitCode: 0 }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runHook(check)
}
