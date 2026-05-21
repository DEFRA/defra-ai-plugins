#!/usr/bin/env node
/**
 * Verify that docs/agents-and-skills.md still lists every agent and skill that
 * exists on disk, and that every agent/skill it mentions still exists.
 *
 * The doc is hand-written; the check is path-based, not structural. It looks
 * for backtick-quoted paths of the form
 *   `plugins/<plugin>/agents/<name>.agent.md`
 *   `plugins/<plugin>/agents/<name>.md`            (Claude agents)
 *   `plugins/<plugin>/skills/<name>/SKILL.md`
 * anywhere in the doc body. A missing path is treated as a missing inventory
 * row even if the agent/skill is named in prose — the inline path is the audit
 * trail referenced from sections 3 and 5 of the doc, and the assumption is
 * that anyone touching the inventory will keep the path mentions current.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { REPO_ROOT } from './lib/load-schema.mjs'
import { discoverEntryPoints } from './lib/discover.mjs'

const PLUGINS_DIR = resolve(REPO_ROOT, 'plugins')
const DOC_PATH = resolve(REPO_ROOT, 'docs/agents-and-skills.md')

/**
 * @returns {string[]} list of error messages (empty if valid)
 */
export function validateDocsSync() {
  const errors = []

  if (!existsSync(DOC_PATH)) {
    return [
      `docs/agents-and-skills.md: missing — expected the agents-and-skills inventory at this path.`
    ]
  }

  const doc = readFileSync(DOC_PATH, 'utf8')

  if (!existsSync(PLUGINS_DIR)) {
    return ['plugins/: directory does not exist']
  }
  const dirs = readdirSync(PLUGINS_DIR).filter((entry) =>
    statSync(resolve(PLUGINS_DIR, entry)).isDirectory()
  )

  /** Paths the inventory is expected to reference, derived from the file tree. */
  const expectedPaths = new Set()
  for (const dir of dirs) {
    for (const entry of discoverEntryPoints(resolve(PLUGINS_DIR, dir))) {
      expectedPaths.add(`plugins/${dir}/${entry.relPath}`)
    }
  }

  /** Paths the doc references in backticks, extracted from the source. */
  const referencedPaths = new Set()
  // Match `plugins/<plugin>/agents/<name>.agent.md`, `…/agents/<name>.md`, `…/skills/<name>/SKILL.md`.
  const pathRe =
    /`(plugins\/[a-z0-9-]+\/(?:agents\/[a-z0-9.-]+\.md|skills\/[a-z0-9-]+\/SKILL\.md))`/g
  for (const match of doc.matchAll(pathRe)) {
    referencedPaths.add(match[1])
  }

  for (const path of expectedPaths) {
    if (!referencedPaths.has(path)) {
      errors.push(
        `docs/agents-and-skills.md: missing inventory entry for "${path}". ` +
          `Add a row or reference to it in the agents/skills inventory.`
      )
    }
  }

  for (const path of referencedPaths) {
    if (!expectedPaths.has(path)) {
      errors.push(
        `docs/agents-and-skills.md: references "${path}" but no such file exists. ` +
          `Remove the reference or restore the file.`
      )
    }
  }

  return errors
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const errors = validateDocsSync()
  if (errors.length) {
    console.error(`docs sync: ${errors.length} error(s)`)
    for (const e of errors) {
      console.error(`  - ${e}`)
    }
    process.exit(1)
  }
  console.log('docs sync: ok')
}
