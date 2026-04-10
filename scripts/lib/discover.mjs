/**
 * Discover and classify plugin entry points (agents and skills) inside a
 * single plugin directory. Format-agnostic so the validators can support
 * Copilot, Claude Code, and Codex side by side.
 *
 * Recognised formats:
 *
 *   copilot-agent  →  agents/<name>.agent.md
 *   claude-agent   →  agents/<name>.md          (any other .md in agents/)
 *   skill          →  skills/<name>/SKILL.md
 */
import { existsSync, readdirSync, statSync } from 'node:fs'
import { resolve, basename } from 'node:path'

/**
 * @typedef {'copilot-agent' | 'claude-agent' | 'skill'} EntryPointFormat
 *
 * @typedef {Object} EntryPoint
 * @property {string} absPath  absolute path to the entry point file
 * @property {string} relPath  path relative to the plugin root
 * @property {EntryPointFormat} format
 * @property {string} name     identifier (filename stem for agents, dir name for skills)
 */

/**
 * Walk a single plugin directory and return every entry point it contains.
 * @param {string} pluginRoot absolute path to the plugin's root directory
 * @returns {EntryPoint[]}
 */
export function discoverEntryPoints(pluginRoot) {
  /** @type {EntryPoint[]} */
  const entries = []

  // agents/  → copilot-agent or claude-agent depending on filename
  const agentsDir = resolve(pluginRoot, 'agents')
  if (existsSync(agentsDir) && statSync(agentsDir).isDirectory()) {
    for (const file of readdirSync(agentsDir)) {
      if (!file.endsWith('.md')) continue
      const absPath = resolve(agentsDir, file)
      if (file.endsWith('.agent.md')) {
        entries.push({
          absPath,
          relPath: `agents/${file}`,
          format: 'copilot-agent',
          name: file.replace(/\.agent\.md$/, '')
        })
      } else {
        entries.push({
          absPath,
          relPath: `agents/${file}`,
          format: 'claude-agent',
          name: file.replace(/\.md$/, '')
        })
      }
    }
  }

  // skills/<name>/SKILL.md  → skill
  const skillsDir = resolve(pluginRoot, 'skills')
  if (existsSync(skillsDir) && statSync(skillsDir).isDirectory()) {
    for (const skillName of readdirSync(skillsDir)) {
      const skillRoot = resolve(skillsDir, skillName)
      if (!statSync(skillRoot).isDirectory()) continue
      const skillFile = resolve(skillRoot, 'SKILL.md')
      if (existsSync(skillFile)) {
        entries.push({
          absPath: skillFile,
          relPath: `skills/${skillName}/SKILL.md`,
          format: 'skill',
          name: basename(skillRoot)
        })
      }
    }
  }

  return entries
}
