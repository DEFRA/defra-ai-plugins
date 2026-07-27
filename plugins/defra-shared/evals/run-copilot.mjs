#!/usr/bin/env node
// Provider script for promptfoo: drives the defra-shared hook suite against
// the eval-fixture and emits a single combined report on stdout for the
// promptfoo assertions to match against.
//
// Usage: node run-copilot.mjs "<prompt>"
//
// defra-shared ships no agent — the "Copilot" provider exercises the same
// hooks the host CLI would execute on tool use, with synthetic Copilot-CLI
// hook inputs. The output format mirrors the Claude provider so promptfoo
// assertions are agnostic to which provider ran.

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { report } from './collect-and-report.mjs'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const pluginDir = resolve(scriptDir, '..')
const fixtureDir = resolve(pluginDir, 'eval-fixture')

const prompt = process.argv[2] ?? 'defra-shared'
report({ provider: 'COPILOT', prompt, fixtureDir })
