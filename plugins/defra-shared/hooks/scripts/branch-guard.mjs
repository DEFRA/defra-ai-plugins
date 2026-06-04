#!/usr/bin/env node
// Block `git commit` / `git push` while HEAD is on main or master. Block any
// `git push --force` / -f / --force-with-lease whose args mention main or
// master, from any branch — force-pushes overwrite shared history regardless
// of current HEAD.

import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { runHook } from './hook-runner.mjs'

export function check(input, getCurrentBranch) {
  const cmd = input.tool_input?.command ?? ''

  if (!/^\s*git\s+(commit|push)(\s|$)/.test(cmd)) {
    return { exitCode: 0 }
  }

  const isPushForce =
    /^\s*git\s+push(\s|$).*(-[a-zA-Z]*f(\s|$)|--force(\s|=|$)|--force-with-lease)/.test(cmd)
  if (isPushForce && /(^|[\s/:])(main|master)([\s/:]|$)/.test(cmd)) {
    return {
      exitCode: 2,
      stderr:
        "branch-guard: force-push to 'main'/'master' is not allowed. See skill defra-branching.\n"
    }
  }

  const branch = getCurrentBranch()
  if (branch === 'main' || branch === 'master') {
    return {
      exitCode: 2,
      stderr: `branch-guard: direct commits and pushes to '${branch}' are not allowed. Create a feature branch first (e.g. feature/my-change). See skill defra-branching.\n`
    }
  }

  return { exitCode: 0 }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd()
  const getCurrentBranch = () => {
    const r = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: dir,
      encoding: 'utf8'
    })
    return r.status === 0 ? (r.stdout || '').trim() : ''
  }
  runHook((input) => check(input, getCurrentBranch))
}
