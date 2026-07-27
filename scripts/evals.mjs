#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdirSync, copyFileSync, rmSync, existsSync } from 'node:fs'
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
  // Each provider has its own results + baseline file. The regression gate must
  // never compare a claude run against the copilot baseline (different model,
  // different output shape) — so we pick the matching baseline per provider and
  // pass it to check-regression explicitly.
  const resultsFile = providerId.includes('claude')
    ? 'promptfoo-results-claude.json'
    : 'promptfoo-results.json'
  const baselinePath = join(dir, 'baseline', resultsFile)

  mkdirSync(resultsDir, { recursive: true })
  run(
    'npx',
    ['--no-install', 'promptfoo', 'eval', '--no-cache', '--filter-providers', providerId],
    { cwd: dir }
  )
  copyFileSync(join(dir, 'output.json'), join(resultsDir, resultsFile))

  if (existsSync(baselinePath)) {
    run('node', [join(dir, 'check-regression.mjs'), join(resultsDir, resultsFile), baselinePath])
  } else {
    // No baseline for this provider yet (e.g. the first claude run). Skip the
    // gate loudly rather than fall back to another provider's baseline. Once
    // this run is green, promote it: cp the results file to baselinePath.
    console.log(
      `\nNo baseline at ${baselinePath} — skipping regression gate for this provider.\n` +
        `Promote this run once green:  cp ${join(resultsDir, resultsFile)} ${baselinePath}`
    )
  }

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
