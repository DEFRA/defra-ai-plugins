#!/usr/bin/env node
/**
 * Validate the YAML frontmatter of every entry-point file under plugins/.
 * Format-agnostic: dispatches to per-format rules based on file path.
 *
 *   copilot-agent  →  agents/<name>.agent.md
 *                     requires: description, tools (non-empty array)
 *
 *   claude-agent   →  agents/<name>.md (any other .md)
 *                     requires: description
 *                     optional: tools (must be array if present)
 *
 *   skill          →  skills/<name>/SKILL.md
 *                     requires: name (must match parent dir), description
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import matter from 'gray-matter'
import { REPO_ROOT } from './lib/load-schema.mjs'
import { discoverEntryPoints } from './lib/discover.mjs'

const PLUGINS_DIR = resolve(REPO_ROOT, 'plugins')
const MAX_DESCRIPTION_LENGTH = 500

/**
 * @param {Record<string, unknown>} data parsed frontmatter
 * @param {string} prefix path prefix used in error messages
 * @returns {string[]}
 */
function validateDescription(data, prefix) {
  const errors = []
  if (typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.push(`${prefix}: frontmatter "description" missing or empty`)
  } else if (data.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(
      `${prefix}: frontmatter "description" is ${data.description.length} chars (max ${MAX_DESCRIPTION_LENGTH})`
    )
  }
  return errors
}

/**
 * @param {unknown} value value of the `tools` frontmatter field
 * @param {string} prefix path prefix used in error messages
 * @param {{ required: boolean }} options
 * @returns {string[]}
 */
function validateToolsArray(value, prefix, { required }) {
  const errors = []
  if (value === undefined || value === null) {
    if (required) errors.push(`${prefix}: frontmatter "tools" missing or not an array`)
    return errors
  }
  if (!Array.isArray(value)) {
    errors.push(`${prefix}: frontmatter "tools" must be an array`)
    return errors
  }
  if (required && value.length === 0) {
    errors.push(`${prefix}: frontmatter "tools" array is empty`)
  }
  for (const [i, tool] of value.entries()) {
    if (typeof tool !== 'string' || tool.trim().length === 0) {
      errors.push(`${prefix}: frontmatter "tools[${i}]" must be a non-empty string`)
    }
  }
  return errors
}

/**
 * @param {Record<string, unknown>} data
 * @param {string} prefix
 * @returns {string[]}
 */
function validateCopilotAgent(data, prefix) {
  return [
    ...validateDescription(data, prefix),
    ...validateToolsArray(data.tools, prefix, { required: true })
  ]
}

/**
 * @param {Record<string, unknown>} data
 * @param {string} prefix
 * @returns {string[]}
 */
function validateClaudeAgent(data, prefix) {
  return [
    ...validateDescription(data, prefix),
    ...validateToolsArray(data.tools, prefix, { required: false })
  ]
}

/**
 * @param {Record<string, unknown>} data
 * @param {string} prefix
 * @param {string} expectedName  the parent directory name (skill identifier)
 * @returns {string[]}
 */
function validateSkill(data, prefix, expectedName) {
  const errors = []
  if (typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push(`${prefix}: frontmatter "name" missing or empty`)
  } else if (data.name !== expectedName) {
    errors.push(
      `${prefix}: frontmatter "name" is "${data.name}" but parent directory is "${expectedName}"`
    )
  }
  errors.push(...validateDescription(data, prefix))
  return errors
}

/**
 * @returns {string[]} list of error messages (empty if valid)
 */
export function validateFrontmatter() {
  const errors = []

  if (!existsSync(PLUGINS_DIR)) {
    return ['plugins/: directory does not exist']
  }

  const dirs = readdirSync(PLUGINS_DIR).filter((entry) => {
    return statSync(resolve(PLUGINS_DIR, entry)).isDirectory()
  })

  for (const dir of dirs) {
    const pluginRoot = resolve(PLUGINS_DIR, dir)
    const entries = discoverEntryPoints(pluginRoot)

    for (const entry of entries) {
      const prefix = `plugins/${dir}/${entry.relPath}`

      let parsed
      try {
        parsed = matter(readFileSync(entry.absPath, 'utf8'))
      } catch (err) {
        errors.push(`${prefix}: cannot parse frontmatter: ${err.message}`)
        continue
      }

      const { data } = parsed
      if (!data || typeof data !== 'object') {
        errors.push(`${prefix}: missing frontmatter block`)
        continue
      }

      switch (entry.format) {
        case 'copilot-agent':
          errors.push(...validateCopilotAgent(data, prefix))
          break
        case 'claude-agent':
          errors.push(...validateClaudeAgent(data, prefix))
          break
        case 'skill':
          errors.push(...validateSkill(data, prefix, entry.name))
          break
      }
    }
  }

  return errors
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const errors = validateFrontmatter()
  if (errors.length) {
    console.error(`frontmatter: ${errors.length} error(s)`)
    for (const e of errors) console.error(`  - ${e}`)
    process.exit(1)
  }
  console.log('frontmatter: ok')
}
