#!/usr/bin/env node
// Provider script for promptfoo: drives the defra-shared hook suite against
// the eval-fixture and emits a single combined report on stdout for the
// promptfoo assertions to match against.
//
// Usage: node run-claude.mjs "<prompt>"

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { report } from './collect-and-report.mjs'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const pluginDir = resolve(scriptDir, '..')
const fixtureDir = resolve(pluginDir, 'eval-fixture')

const prompt = process.argv[2] ?? 'defra-shared'
report({ provider: 'CLAUDE', prompt, fixtureDir })
