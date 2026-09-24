#!/usr/bin/env node

/**
 * @module
 *
 * Turns a read of node_modules/govuk-frontend into a pointer at the reference
 * file that holds the same thing plus the guidance.
 * Reading the package is not wrong, it is just the expensive way to learn less:
 * it costs many times the tokens and tells you what a macro *can* do, never what
 * it *should* do. Agents reach for it by habit, so this makes the better path
 * the one they land on.
 * It denies only reads of the component template and options files. Debugging
 * the package itself — its JavaScript, its Sass, its tests — is untouched.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const SKILL = 'gds-components'

function readInput() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'))
  } catch {
    return null
  }
}

// The Design System documents this component under a different name.
const DOC_NAME = { input: 'text-input' }

// Paths worth intercepting: the Nunjucks templates, the macros, and the macro
// option tables. Everything else in the package is fair game.
const TEMPLATE_FILE = /\.(njk|yaml|json)$/
const COMPONENT_PATH = /node_modules\/govuk-frontend\/(?:dist\/)?govuk\/components\/([\w-]+)\//

function targetFor(text) {
  if (!text) {
    return null
  }
  if (!/node_modules[\\/]+govuk-frontend/.test(text)) {
    return null
  }

  const component = COMPONENT_PATH.exec(text.replaceAll('\\', '/'))
  if (component) {
    const name = DOC_NAME[component[1]] || component[1]
    return { file: `${name}.md`, component: name }
  }
  return { file: '_index.md', component: null }
}

function commandReadsPackage(command) {
  if (!/node_modules[\\/]+govuk-frontend/.test(command)) {
    return false
  }
  return /\b(cat|less|more|head|tail|bat|grep|rg|find|ls|fd)\b/.test(command)
}

// Claude Code and Copilot CLI name their tools and arguments differently, and
// both sets change over time. Rather than switching on tool name, look at the
// argument keys that carry a target — they are stable across both hosts.
const PATH_KEYS = ['file_path', 'filePath', 'path', 'file', 'target']
const PATTERN_KEYS = ['glob', 'pattern', 'query', 'include']
const COMMAND_KEYS = ['command', 'cmd', 'bash', 'script']

function collect(args, keys) {
  const found = []

  for (const key of keys) {
    const value = args?.[key]

    if (typeof value === 'string') {
      found.push(value)
      continue
    }

    if (Array.isArray(value)) {
      found.push(...value.filter((entry) => typeof entry === 'string'))
    }
  }

  return found
}

function findPathHit(args) {
  for (const value of collect(args, PATH_KEYS)) {
    if (TEMPLATE_FILE.test(value)) {
      const hit = targetFor(value)
      if (hit) {
        return hit
      }
    }
  }
  return null
}

function findPatternHit(args) {
  for (const value of collect(args, PATTERN_KEYS)) {
    const hit = targetFor(value)
    if (hit) {
      return hit
    }
  }
  return null
}

function findCommandHit(args) {
  for (const value of collect(args, COMMAND_KEYS)) {
    if (commandReadsPackage(value)) {
      const hit = targetFor(value)
      if (hit) {
        return hit
      }
    }
  }
  return null
}

function findHit(args) {
  return findPathHit(args) || findPatternHit(args) || findCommandHit(args)
}

function buildDenial(hit) {
  const where = `the ${SKILL} skill, references/${hit.file}`
  const subject = hit.component
    ? `The \`${hit.component}\` component is documented in ${where}.`
    : `Start at ${where}.`

  const reason = [
    `Read ${where} instead of node_modules/govuk-frontend.`,
    '',
    subject,
    '',
    'That file has everything this package does and more:',
    '  - the complete Nunjucks macro options, so you do not need the source',
    '  - when to use the component and when not to',
    '  - every coded example from the Design System',
    '  - the error message wording',
    '  - a note where the Prototype Kit pins a different govuk-frontend version',
    '',
    'It is also far cheaper to read. For every macro signature at once, see',
    `references/_all-params.md. For patterns, see the gds-patterns skill.`,
    '',
    'If you genuinely need the package internals (its JavaScript, Sass or tests),',
    'read those files directly — this only covers the templates and macro options.'
  ].join('\n')

  return {
    permissionDecision: 'deny',
    permissionDecisionReason: reason,
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason
    }
  }
}

/**
 * Decide whether a tool call reads the guidance-shaped part of
 * node_modules/govuk-frontend (templates, macros, macro option tables), and if
 * so, build the deny decision that points at the reference file instead.
 *
 * Accepts both host payload shapes directly — Claude Code's
 * `tool_input` and Copilot CLI's `toolArgs` — and decides on the argument
 * values, never on the tool name, so new tools in either host are covered
 * without a hook change.
 *
 * @param {object} input - The hook payload as sent by the host.
 * @returns {{ permissionDecision: 'deny', permissionDecisionReason: string, hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: string } } | null} The deny decision, or `null` to allow.
 */
export function check(input) {
  // Copilot sends toolName/toolArgs; Claude Code sends tool_name/tool_input.
  const args = input?.tool_input ?? input?.toolArgs ?? {}
  const hit = findHit(args)

  if (!hit) {
    return null
  }

  return buildDenial(hit)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const input = readInput()
  const decision = input && check(input)
  if (decision) {
    process.stdout.write(JSON.stringify(decision))
  }
  process.exit(0)
}
