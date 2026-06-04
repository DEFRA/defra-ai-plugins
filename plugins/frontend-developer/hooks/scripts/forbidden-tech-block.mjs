#!/usr/bin/env node
// Block prompts that mention a technology forbidden by the Defra frontend
// standards. Exits 2 so the message never reaches the LLM and the refusal
// banner is printed to the terminal — refusal is deterministic, not
// dependent on the model cooperating.

import { fileURLToPath } from 'node:url'
import { runHook } from './hook-runner.mjs'

const FORBIDDEN = /\b(tailwind|react|vue|angular|svelte|jquery|bootstrap|typescript|express)\b/i

export function check(input) {
  const match = (input.prompt ?? '').match(FORBIDDEN)
  if (!match) {
    return { exitCode: 0 }
  }
  return {
    exitCode: 2,
    stderr: `[frontend-developer] refused: '${match[1]}' is not allowed by the Defra frontend standards.

The approved stack is Hapi + Nunjucks + SCSS (importing govuk-frontend) +
progressive-enhancement vanilla JS + Vitest. SPA frameworks (React, Vue,
Angular, Svelte), utility-CSS frameworks (Tailwind, Bootstrap), jQuery,
and TypeScript are all forbidden.

Re-send the request without naming a forbidden technology — e.g. "add a
callback request form at /callback" — and the agent will build the
compliant version. See skill frontend-tech-stack for the full list.
`
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runHook(check)
}
