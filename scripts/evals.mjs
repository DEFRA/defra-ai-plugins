#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdirSync, copyFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const [subcommand, ...rest] = process.argv.slice(2)

const usage = `usage:
  evals.mjs eval  <plugin> <provider-id>   run promptfoo against one provider, archive results, run regression gate
  evals.mjs view  <plugin>                 open the promptfoo UI for the plugin
  evals.mjs clean <plugin>                 remove the plugin's promptfoo output + cache`

if (!subcommand) {
  console.error(usage)
  process.exit(2)
}

const evalDir = (plugin) => `plugins/${plugin}/evals`

const run = (cmd, args, opts = {}) => {
  const result = spawnSync(cmd, args, { stdio: 'inherit', ...opts })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

if (subcommand === 'eval') {
  const [plugin, providerId] = rest
  if (!plugin || !providerId) {
    console.error(usage)
    process.exit(2)
  }
  const dir = evalDir(plugin)
  const date = new Date().toISOString().slice(0, 10)
  const resultsDir = `results/run-${date}`
  const resultsFile = providerId.includes('claude')
    ? 'promptfoo-results-claude.json'
    : 'promptfoo-results.json'

  mkdirSync(resultsDir, { recursive: true })
  run(
    'npx',
    ['--no-install', 'promptfoo', 'eval', '--no-cache', '--filter-providers', providerId],
    { cwd: dir }
  )
  copyFileSync(join(dir, 'output.json'), join(resultsDir, resultsFile))
  run('node', [join(dir, 'check-regression.mjs'), join(resultsDir, resultsFile)])

  console.log(`\nResults saved to ${join(resultsDir, resultsFile)}`)
} else if (subcommand === 'view') {
  const [plugin] = rest
  if (!plugin) {
    console.error(usage)
    process.exit(2)
  }
  run('npx', ['--no-install', 'promptfoo', 'view'], { cwd: evalDir(plugin) })
} else if (subcommand === 'clean') {
  const [plugin] = rest
  if (!plugin) {
    console.error(usage)
    process.exit(2)
  }
  const dir = evalDir(plugin)
  rmSync(join(dir, 'output.json'), { force: true })
  rmSync(join(dir, '.promptfoo'), { recursive: true, force: true })
} else {
  console.error(usage)
  process.exit(2)
}
