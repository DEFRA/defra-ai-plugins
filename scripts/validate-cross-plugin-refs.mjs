#!/usr/bin/env node
/**
 * Validate that agent prompts only reference skills from their own plugin or
 * from a plugin declared in `dependencies` in plugin.json.
 *
 * Copilot CLI does not auto-install dependencies — the validator is the only
 * gate that catches drift between an agent's prompt and its manifest. Without
 * this, an agent can name a skill from another plugin in its workflow and the
 * reference will silently dangle if the user installs this plugin alone.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import matter from 'gray-matter'
import { REPO_ROOT } from './lib/load-schema.mjs'
import { discoverEntryPoints } from './lib/discover.mjs'

const PLUGINS_DIR = resolve(REPO_ROOT, 'plugins')

/**
 * Build a map of every skill name → the plugin that owns it.
 * @param {string[]} pluginDirs
 * @returns {Map<string, string>}
 */
function buildSkillRegistry(pluginDirs) {
  /** @type {Map<string, string>} */
  const registry = new Map()
  for (const dir of pluginDirs) {
    const pluginRoot = resolve(PLUGINS_DIR, dir)
    for (const entry of discoverEntryPoints(pluginRoot)) {
      if (entry.format === 'skill') registry.set(entry.name, dir)
    }
  }
  return registry
}

/**
 * Find every skill name from `registry` that appears as a whole word in `body`.
 * Skill names are kebab-case (≥ 2 chars) so substring collisions with English
 * prose are vanishingly rare; the `\b` word boundary guards against partial
 * matches like `defra-branching-extras`.
 * @param {string} body
 * @param {Map<string, string>} registry
 * @returns {Set<string>}
 */
function findSkillReferences(body, registry) {
  /** @type {Set<string>} */
  const hits = new Set()
  for (const name of registry.keys()) {
    const re = new RegExp(`\\b${name.replace(/[-]/g, '-')}\\b`)
    if (re.test(body)) hits.add(name)
  }
  return hits
}

/**
 * @returns {string[]} list of error messages (empty if valid)
 */
export function validateCrossPluginRefs() {
  const errors = []

  if (!existsSync(PLUGINS_DIR)) return ['plugins/: directory does not exist']

  const dirs = readdirSync(PLUGINS_DIR).filter((entry) =>
    statSync(resolve(PLUGINS_DIR, entry)).isDirectory()
  )

  const skillRegistry = buildSkillRegistry(dirs)

  for (const dir of dirs) {
    const pluginRoot = resolve(PLUGINS_DIR, dir)
    const manifestPath = resolve(pluginRoot, 'plugin.json')
    if (!existsSync(manifestPath)) continue

    let manifest
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    } catch {
      continue // validate-plugins.mjs will report parse errors
    }
    const declaredDeps = new Set(Array.isArray(manifest.dependencies) ? manifest.dependencies : [])

    for (const entry of discoverEntryPoints(pluginRoot)) {
      if (entry.format !== 'copilot-agent' && entry.format !== 'claude-agent') continue

      let parsed
      try {
        parsed = matter(readFileSync(entry.absPath, 'utf8'))
      } catch {
        continue // validate-frontmatter.mjs reports parse errors
      }

      const hits = findSkillReferences(parsed.content, skillRegistry)
      for (const skillName of hits) {
        const owningPlugin = skillRegistry.get(skillName)
        if (owningPlugin === dir) continue // own-plugin reference is always fine
        if (!declaredDeps.has(owningPlugin)) {
          errors.push(
            `plugins/${dir}/${entry.relPath}: references skill "${skillName}" ` +
              `(owned by plugin "${owningPlugin}") but plugins/${dir}/plugin.json ` +
              `does not declare "${owningPlugin}" in "dependencies".`
          )
        }
      }
    }

    // Reverse check: every declared dependency must exist as a plugin directory.
    for (const depName of declaredDeps) {
      if (!dirs.includes(depName)) {
        errors.push(
          `plugins/${dir}/plugin.json: dependency "${depName}" is not a plugin in this marketplace ` +
            `(no plugins/${depName}/ directory).`
        )
      }
      if (depName === dir) {
        errors.push(`plugins/${dir}/plugin.json: plugin lists itself as a dependency.`)
      }
    }
  }

  return errors
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const errors = validateCrossPluginRefs()
  if (errors.length) {
    console.error(`cross-plugin refs: ${errors.length} error(s)`)
    for (const e of errors) console.error(`  - ${e}`)
    process.exit(1)
  }
  console.log('cross-plugin refs: ok')
}
