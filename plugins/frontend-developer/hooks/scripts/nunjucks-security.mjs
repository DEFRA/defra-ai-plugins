#!/usr/bin/env node
// Sync, blocking. Refuse Nunjucks templates that include inline
// <script>/<style>/style= attributes; warn (non-blocking) on each `| safe`
// filter use.

import { readFileSync, existsSync } from 'node:fs'
import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runHook } from './hook-runner.mjs'

const INLINE = /<script[^>]*>|<style[^>]*>|\bstyle=/
const SAFE_FILTER = /\| safe/g

export function check(file, readFile = (f) => readFileSync(f, 'utf8'), fileExists = existsSync) {
  if (!file || !file.endsWith('.njk') || !fileExists(file)) {
    return { exitCode: 0 }
  }
  const content = readFile(file)
  if (INLINE.test(content)) {
    return {
      exitCode: 2,
      stderr: `Security: inline <script>, <style>, or style= attribute found in ${basename(file)}. Move scripts to external .js files and styles to external .scss files.\n`
    }
  }
  const safeMatches = content.match(SAFE_FILTER)
  if (safeMatches) {
    return {
      exitCode: 0,
      stderr: `Warning: ${safeMatches.length} use(s) of '| safe' in ${basename(file)} — only use on pre-sanitised trusted content, never on user-supplied data.\n`
    }
  }
  return { exitCode: 0 }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runHook((input) => check(input.tool_input?.file_path ?? ''))
}
