#!/usr/bin/env node
/**
 * Validate every plugin under plugins/ against the plugin schema and
 * cross-check against the marketplace registry. Also enforces structural
 * requirements: each plugin needs a README.md and at least one entry point
 * (Copilot agent, Claude agent, or skill — see scripts/lib/discover.mjs).
 */
import { existsSync, readdirSync, statSync } from 'node:fs'
import { resolve, basename } from 'node:path'
import { REPO_ROOT, readJson, buildValidator } from './lib/load-schema.mjs'
import { discoverEntryPoints } from './lib/discover.mjs'

const PLUGINS_DIR = resolve(REPO_ROOT, 'plugins')
const MARKETPLACE_PATH = resolve(REPO_ROOT, '.github/plugin/marketplace.json')

/**
 * @returns {string[]} list of error messages (empty if valid)
 */
export function validatePlugins() {
  const errors = []
  const validatePlugin = buildValidator('plugin.schema.json')

  if (!existsSync(PLUGINS_DIR)) {
    return ['plugins/: directory does not exist']
  }

  const dirs = readdirSync(PLUGINS_DIR).filter((entry) => {
    return statSync(resolve(PLUGINS_DIR, entry)).isDirectory()
  })

  if (dirs.length === 0) {
    errors.push('plugins/: no plugin directories found')
    return errors
  }

  // Build marketplace lookup so we can cross-check each plugin
  let marketplace = { plugins: [] }
  try {
    marketplace = readJson(MARKETPLACE_PATH)
  } catch (err) {
    errors.push(`marketplace.json: cannot read for cross-check: ${err.message}`)
  }

  const marketplaceByName = new Map()
  if (Array.isArray(marketplace.plugins)) {
    for (const p of marketplace.plugins) {
      if (p && typeof p.name === 'string') marketplaceByName.set(p.name, p)
    }
  }

  for (const dir of dirs) {
    const pluginRoot = resolve(PLUGINS_DIR, dir)
    const manifestPath = resolve(pluginRoot, 'plugin.json')
    const prefix = `plugins/${dir}`

    if (!existsSync(manifestPath)) {
      errors.push(`${prefix}: plugin.json missing`)
      continue
    }

    let manifest
    try {
      manifest = readJson(manifestPath)
    } catch (err) {
      errors.push(`${prefix}/plugin.json: cannot parse: ${err.message}`)
      continue
    }

    // Schema validation
    const schemaErrors = validatePlugin(manifest)
    for (const e of schemaErrors) errors.push(`${prefix}/plugin.json: ${e}`)

    // Name must match directory
    if (manifest.name !== basename(pluginRoot)) {
      errors.push(
        `${prefix}/plugin.json: name "${manifest.name}" does not match directory "${dir}"`
      )
    }

    // Must be in marketplace registry
    const marketplaceEntry = marketplaceByName.get(manifest.name)
    if (!marketplaceEntry) {
      errors.push(
        `${prefix}: not registered in marketplace.json (expected entry "${manifest.name}")`
      )
    } else {
      if (marketplaceEntry.description !== manifest.description) {
        errors.push(`${prefix}: description in plugin.json does not match marketplace.json entry`)
      }
      if (marketplaceEntry.version !== manifest.version) {
        errors.push(
          `${prefix}: version in plugin.json does not match marketplace.json entry ` +
            `(plugin: ${manifest.version}, marketplace: ${marketplaceEntry.version})`
        )
      }
      const expectedSource = `plugins/${dir}`
      if (marketplaceEntry.source !== expectedSource) {
        errors.push(
          `${prefix}: marketplace.json source "${marketplaceEntry.source}" should be "${expectedSource}"`
        )
      }
    }

    // README required
    if (!existsSync(resolve(pluginRoot, 'README.md'))) {
      errors.push(`${prefix}: README.md missing`)
    }

    // At least one entry point required (any format: Copilot agent, Claude agent, or skill)
    const entries = discoverEntryPoints(pluginRoot)
    if (entries.length === 0) {
      errors.push(
        `${prefix}: no entry points found — expected one of agents/*.agent.md, ` +
          `agents/*.md, or skills/<name>/SKILL.md`
      )
    }

    // Skill folders must match the convention: skills/<name>/ where the dir name
    // is the skill identifier and matches SKILL.md frontmatter (checked elsewhere).
    for (const entry of entries) {
      if (entry.format === 'skill' && !/^[a-z][a-z0-9-]*[a-z0-9]$/.test(entry.name)) {
        errors.push(
          `${prefix}/${entry.relPath}: skill directory "${entry.name}" must be kebab-case`
        )
      }
    }
  }

  // Reverse check: every marketplace entry must have a directory
  for (const [name, entry] of marketplaceByName) {
    if (!dirs.includes(name)) {
      errors.push(
        `marketplace.json: plugin "${name}" listed (source "${entry.source}") but no plugins/${name}/ directory`
      )
    }
  }

  return errors
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const errors = validatePlugins()
  if (errors.length) {
    console.error(`plugins: ${errors.length} error(s)`)
    for (const e of errors) console.error(`  - ${e}`)
    process.exit(1)
  }
  console.log('plugins: ok')
}
