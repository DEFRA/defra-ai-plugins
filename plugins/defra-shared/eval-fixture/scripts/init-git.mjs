#!/usr/bin/env node
// Stage a copy of the eval-fixture in a fresh tmp directory and make it a git
// repo with HEAD on `main`. Echoes the absolute path of the staging dir on
// stdout so callers can `cd` into it (or set CLAUDE_PROJECT_DIR to it).
//
// Why a tmp dir rather than `git init` inside eval-fixture/: the fixture lives
// inside the defra-ai-plugins git repo. A nested `.git` confuses the parent
// repo's tooling. Staging gives us an independent working tree.

import { cpSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const fixtureDir = resolve(scriptDir, '..')

const GIT_BIN = execFileSync('/usr/bin/which', ['git'], { encoding: 'utf8' }).trim()
const stage = mkdtempSync(join(tmpdir(), 'defra-shared-fixture-'))
cpSync(fixtureDir, stage, { recursive: true })
rmSync(join(stage, '.git'), { recursive: true, force: true })

const git = (...args) => execFileSync(GIT_BIN, args, { cwd: stage, stdio: ['ignore', 'ignore', 'pipe'] })
git('init', '-q', '-b', 'main')
git('config', 'user.email', 'eval-fixture@defra-ai-plugins.local')
git('config', 'user.name', 'Defra eval fixture')
git('add', '.')
git('commit', '-q', '-m', 'chore: bootstrap defra-shared eval-fixture')

process.stdout.write(stage + '\n')
